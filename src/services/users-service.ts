import { apiClient, type ApiError } from './apiClient'
import { USE_MOCK_API } from '../config/feature-flags'

const MOCK_USERS_KEY = 'mock.users.items'
const MOCK_USERS_NEXT_ID_KEY = 'mock.users.nextId'
const MOCK_LATENCY_MS = 450

export type UserRole = 'ADMIN' | 'EMPLOYEE'

export type UserSummary = {
   id: string
   name: string
   email: string
   role: UserRole
   active: boolean
}

export type UserInput = {
   name: string
   email: string
   password?: string
   role: UserRole
}

export type ListUsersParams = {
   page?: number
   size?: number
   role?: UserRole | ''
}

export type ListUsersResult = {
   items: UserSummary[]
   total: number
   page: number
   size: number
}

const MOCK_SEED_USERS: UserSummary[] = [
   { id: '1', name: 'Admin Root', email: 'admin@empresa.com', role: 'ADMIN', active: true },
   { id: '2', name: 'Empleado 1', email: 'empleado1@empresa.com', role: 'EMPLOYEE', active: true },
   { id: '3', name: 'Empleado 2', email: 'empleado2@empresa.com', role: 'EMPLOYEE', active: false },
]

function toNumber(value: unknown, fallback = 0) {
   const num = Number(value)
   return Number.isFinite(num) ? num : fallback
}

function mapUser(raw: Record<string, unknown> | null | undefined): UserSummary {
   if (!raw) {
      return {
         id: '',
         name: '',
         email: '',
         role: 'EMPLOYEE',
         active: false,
      }
   }

   return {
      id: String(raw.id ?? raw.userId ?? ''),
      name: String(raw.name ?? raw.nombre ?? ''),
      email: String(raw.email ?? ''),
      role: (String(raw.role ?? 'EMPLOYEE').toUpperCase() as UserRole) || 'EMPLOYEE',
      active: raw.active === undefined ? true : Boolean(raw.active),
   }
}

function wait(ms: number) {
   return new Promise((resolve) => {
      setTimeout(resolve, ms)
   })
}

function createApiError({ message, status = 400, details = null }: { message: string; status?: number; details?: unknown }): ApiError {
   const error = new Error(message) as ApiError
   error.name = 'ApiError'
   error.status = status
   error.details = details
   return error
}

function readMockUsers(): UserSummary[] {
   const stored = localStorage.getItem(MOCK_USERS_KEY)

   if (!stored) {
      localStorage.setItem(MOCK_USERS_KEY, JSON.stringify(MOCK_SEED_USERS))
      localStorage.setItem(MOCK_USERS_NEXT_ID_KEY, String(MOCK_SEED_USERS.length + 1))
      return [...MOCK_SEED_USERS]
   }

   try {
      const parsed = JSON.parse(stored) as unknown
      if (!Array.isArray(parsed)) {
         throw new Error('Invalid mock data')
      }
      return parsed.map((item) => mapUser(item as Record<string, unknown>))
   } catch {
      localStorage.setItem(MOCK_USERS_KEY, JSON.stringify(MOCK_SEED_USERS))
      localStorage.setItem(MOCK_USERS_NEXT_ID_KEY, String(MOCK_SEED_USERS.length + 1))
      return [...MOCK_SEED_USERS]
   }
}

function writeMockUsers(items: UserSummary[]) {
   localStorage.setItem(MOCK_USERS_KEY, JSON.stringify(items))
}

function getNextMockId() {
   const stored = localStorage.getItem(MOCK_USERS_NEXT_ID_KEY)
   const next = toNumber(stored, MOCK_SEED_USERS.length + 1)
   localStorage.setItem(MOCK_USERS_NEXT_ID_KEY, String(next + 1))
   return String(next)
}

function unwrapListPayload(payload: unknown): { items: UserSummary[]; total: number } {
   if (Array.isArray(payload)) {
      return { items: payload.map((item) => mapUser(item as Record<string, unknown>)), total: payload.length }
   }

   const typedPayload = payload as Record<string, unknown> | null
   const data = (typedPayload?.data as unknown) ?? null
   if (Array.isArray(data)) {
      return {
         items: data.map((item) => mapUser(item as Record<string, unknown>)),
         total: toNumber(typedPayload?.totalElements ?? typedPayload?.total, data.length),
      }
   }

   if (data && typeof data === 'object') {
      const content = (data as Record<string, unknown>)?.content
      if (Array.isArray(content)) {
         return {
            items: content.map((item) => mapUser(item as Record<string, unknown>)),
            total: toNumber(
               (data as Record<string, unknown>)?.totalElements ?? (data as Record<string, unknown>)?.total,
               content.length,
            ),
         }
      }
   }

   const content = (typedPayload?.content as unknown) ?? null
   if (Array.isArray(content)) {
      return {
         items: content.map((item) => mapUser(item as Record<string, unknown>)),
         total: toNumber(typedPayload?.totalElements ?? typedPayload?.total, content.length),
      }
   }

   return { items: [], total: 0 }
}

export async function listUsers(
   { page = 1, size = 10, role = '' }: ListUsersParams = {},
): Promise<ListUsersResult> {
   if (USE_MOCK_API) {
      await wait(MOCK_LATENCY_MS)

      const safePage = Math.max(1, toNumber(page, 1))
      const safeSize = Math.max(1, toNumber(size, 10))
      const filtered = role ? readMockUsers().filter((item) => item.role === role) : readMockUsers()
      const total = filtered.length
      const start = (safePage - 1) * safeSize

      return {
         items: filtered.slice(start, start + safeSize),
         total,
         page: safePage,
         size: safeSize,
      }
   }

   const params = new URLSearchParams()
   if (role) {
      params.set('role', role)
   }

   const query = params.toString()
   const payload = await apiClient<Record<string, unknown> | UserSummary[]>(
      `/api/v1/users${query ? `?${query}` : ''}`,
   )

   const { items, total } = unwrapListPayload(payload)
   const safePage = Math.max(1, toNumber(page, 1))
   const safeSize = Math.max(1, toNumber(size, 10))
   const start = (safePage - 1) * safeSize

   return {
      items: items.slice(start, start + safeSize),
      total: total || items.length,
      page: safePage,
      size: safeSize,
   }
}

export async function createUser(data: UserInput): Promise<UserSummary> {
   if (USE_MOCK_API) {
      await wait(MOCK_LATENCY_MS)
      const items = readMockUsers()

      if (items.some((item) => item.email.toLowerCase() === data.email.toLowerCase())) {
         throw createApiError({
            message: 'El correo ya existe en otro usuario.',
            status: 400,
         })
      }

      const created: UserSummary = {
         id: getNextMockId(),
         name: data.name,
         email: data.email,
         role: data.role,
         active: true,
      }

      writeMockUsers([...items, created])
      return created
   }

   const payload = await apiClient<Record<string, unknown>>('/api/v1/users', {
      method: 'POST',
      body: JSON.stringify(data),
   })

   return mapUser(payload?.data || payload)
}

export async function updateUser(id: string, data: UserInput): Promise<UserSummary> {
   if (USE_MOCK_API) {
      await wait(MOCK_LATENCY_MS)
      const items = readMockUsers()
      const index = items.findIndex((item) => String(item.id) === String(id))

      if (index === -1) {
         throw createApiError({
            message: 'Usuario no encontrado.',
            status: 404,
         })
      }

      const updated = {
         ...items[index],
         name: data.name,
         email: data.email,
         role: data.role,
      }

      const nextItems = [...items]
      nextItems[index] = updated
      writeMockUsers(nextItems)

      return updated
   }

   const payload = await apiClient<Record<string, unknown>>(`/api/v1/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
   })

   return mapUser(payload?.data || payload)
}

export async function deactivateUser(id: string): Promise<void> {
   if (USE_MOCK_API) {
      await wait(MOCK_LATENCY_MS)
      const items = readMockUsers()
      const index = items.findIndex((item) => String(item.id) === String(id))

      if (index === -1) {
         throw createApiError({
            message: 'Usuario no encontrado.',
            status: 404,
         })
      }

      const nextItems = [...items]
      nextItems[index] = { ...nextItems[index], active: false }
      writeMockUsers(nextItems)
      return
   }

   await apiClient(`/api/v1/users/${id}/deactivate`, {
      method: 'PATCH',
   })
}

export async function activateUser(id: string): Promise<void> {
   if (USE_MOCK_API) {
      await wait(MOCK_LATENCY_MS)
      const items = readMockUsers()
      const index = items.findIndex((item) => String(item.id) === String(id))

      if (index === -1) {
         throw createApiError({
            message: 'Usuario no encontrado.',
            status: 404,
         })
      }

      const nextItems = [...items]
      nextItems[index] = { ...nextItems[index], active: true }
      writeMockUsers(nextItems)
      return
   }

   await apiClient(`/api/v1/users/${id}/activate`, {
      method: 'PATCH',
   })
}
