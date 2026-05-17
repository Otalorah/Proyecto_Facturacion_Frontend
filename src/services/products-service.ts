import { apiClient, type ApiError } from './apiClient'
import { USE_MOCK_API } from '../config/feature-flags'

const MOCK_PRODUCTS = USE_MOCK_API
const MOCK_LATENCY_MS = 450
const MOCK_PRODUCTS_KEY = 'mock.products.items'
const MOCK_NEXT_ID_KEY = 'mock.products.nextId'

export type Product = {
   id: string
   name: string
   code: string
   price: number
   stock: number
   active?: boolean
}

export type ProductInput = {
   name: string
   code: string
   price: number
   stock: number
}

export type ListProductsParams = {
   page?: number
   size?: number
   search?: string
}

export type ListProductsResult = {
   items: Product[]
   total: number
   page: number
   size: number
}

const MOCK_SEED_PRODUCTS: Product[] = [
   { id: '1', name: 'Cuaderno A4', code: 'PROD-001', price: 12500, stock: 22, active: true },
   { id: '2', name: 'Lapicero Azul', code: 'PROD-002', price: 2500, stock: 140, active: true },
   { id: '3', name: 'Lapicero Negro', code: 'PROD-003', price: 2500, stock: 115, active: true },
   { id: '4', name: 'Resaltador', code: 'PROD-004', price: 4200, stock: 56, active: true },
   { id: '5', name: 'Carpeta Oficio', code: 'PROD-005', price: 9800, stock: 38, active: true },
   { id: '6', name: 'Marcador Borrable', code: 'PROD-006', price: 6900, stock: 28, active: true },
   { id: '7', name: 'Borrador Blanco', code: 'PROD-007', price: 1800, stock: 90, active: true },
   { id: '8', name: 'Regla 30 cm', code: 'PROD-008', price: 3300, stock: 46, active: true },
   { id: '9', name: 'Tijera Escolar', code: 'PROD-009', price: 5400, stock: 31, active: true },
   { id: '10', name: 'Colbon 125 ml', code: 'PROD-010', price: 5100, stock: 27, active: true },
   { id: '11', name: 'Block Carta', code: 'PROD-011', price: 7600, stock: 62, active: true },
   { id: '12', name: 'Cartulina Blanca', code: 'PROD-012', price: 1900, stock: 175, active: true },
   { id: '13', name: 'Folder Amarillo', code: 'PROD-013', price: 1600, stock: 84, active: true },
   { id: '14', name: 'Grapadora Mini', code: 'PROD-014', price: 14200, stock: 12, active: true },
   { id: '15', name: 'Cinta Transparente', code: 'PROD-015', price: 3700, stock: 52, active: true },
]

function toNumber(value: unknown, fallback = 0) {
   const num = Number(value)
   return Number.isFinite(num) ? num : fallback
}

function mapProduct(raw: Record<string, unknown> | null | undefined): Product {
   if (!raw) {
      return {
         id: '',
         name: '',
         code: '',
         price: 0,
         stock: 0,
         active: undefined,
      }
   }

   return {
      id: String(raw.id ?? raw.productId ?? ''),
      name: String(raw.name ?? raw.nombre ?? ''),
      code: String(raw.code ?? raw.sku ?? ''),
      price: toNumber(raw.price ?? raw.precio, 0),
      stock: toNumber(raw.stock ?? raw.inventory ?? 0, 0),
      active: raw.active === undefined ? undefined : Boolean(raw.active),
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

function readMockProducts(): Product[] {
   const stored = localStorage.getItem(MOCK_PRODUCTS_KEY)

   if (!stored) {
      localStorage.setItem(MOCK_PRODUCTS_KEY, JSON.stringify(MOCK_SEED_PRODUCTS))
      localStorage.setItem(MOCK_NEXT_ID_KEY, String(MOCK_SEED_PRODUCTS.length + 1))
      return [...MOCK_SEED_PRODUCTS]
   }

   try {
      const parsed = JSON.parse(stored) as unknown
      if (!Array.isArray(parsed)) {
         throw new Error('Invalid mock data')
      }
      return parsed.map((item) => mapProduct(item as Record<string, unknown>))
   } catch {
      localStorage.setItem(MOCK_PRODUCTS_KEY, JSON.stringify(MOCK_SEED_PRODUCTS))
      localStorage.setItem(MOCK_NEXT_ID_KEY, String(MOCK_SEED_PRODUCTS.length + 1))
      return [...MOCK_SEED_PRODUCTS]
   }
}

function writeMockProducts(items: Product[]) {
   localStorage.setItem(MOCK_PRODUCTS_KEY, JSON.stringify(items))
}

function getNextMockId() {
   const stored = localStorage.getItem(MOCK_NEXT_ID_KEY)
   const next = toNumber(stored, MOCK_SEED_PRODUCTS.length + 1)
   localStorage.setItem(MOCK_NEXT_ID_KEY, String(next + 1))
   return String(next)
}

function normalizeProductInput(data: ProductInput): ProductInput {
   return {
      name: String(data?.name || '').trim(),
      code: String(data?.code || '').trim(),
      price: toNumber(data?.price, Number.NaN),
      stock: toNumber(data?.stock, Number.NaN),
   }
}

function validateProductInput(
   data: ProductInput,
   existingItems: Product[],
   currentId: string | null = null,
): ProductInput {
   const product = normalizeProductInput(data)
   const fieldErrors: Record<string, string> = {}

   if (!product.name) {
      fieldErrors.name = 'El nombre es obligatorio.'
   }

   if (!product.code) {
      fieldErrors.code = 'El codigo es obligatorio.'
   }

   if (!Number.isFinite(product.price) || product.price < 0) {
      fieldErrors.price = 'El precio debe ser un numero mayor o igual a 0.'
   }

   if (!Number.isInteger(product.stock) || product.stock < 0) {
      fieldErrors.stock = 'El stock debe ser un entero mayor o igual a 0.'
   }

   const duplicate = existingItems.find((item) => {
      if (currentId && String(item.id) === String(currentId)) {
         return false
      }

      return String(item.code).toLowerCase() === product.code.toLowerCase()
   })

   if (duplicate) {
      fieldErrors.code = 'El codigo ya existe en otro producto.'
   }

   if (Object.keys(fieldErrors).length > 0) {
      throw createApiError({
         message: 'Revisa los datos del formulario.',
         status: 400,
         details: {
            validationErrors: fieldErrors,
         },
      })
   }

   return product
}

function unwrapListPayload(payload: unknown): Product[] {
   if (Array.isArray(payload)) {
      return payload.map((item) => mapProduct(item as Record<string, unknown>))
   }

   const typedPayload = payload as Record<string, unknown> | null
   const data = (typedPayload?.data as unknown) ?? null
   if (Array.isArray(data)) {
      return data.map((item) => mapProduct(item as Record<string, unknown>))
   }

   return []
}

export async function listProducts(
   { page = 1, size = 10, search = '' }: ListProductsParams = {},
): Promise<ListProductsResult> {
   if (MOCK_PRODUCTS) {
      await wait(MOCK_LATENCY_MS)

      const safePage = Math.max(1, toNumber(page, 1))
      const safeSize = Math.max(1, toNumber(size, 10))
      const searchText = search.trim().toLowerCase()

      const source = readMockProducts()
      const filtered = searchText
         ? source.filter((item) => {
            const name = String(item.name || '').toLowerCase()
         const code = String(item.code || '').toLowerCase()
         return name.includes(searchText) || code.includes(searchText)
         })
         : source

      const total = filtered.length
      const start = (safePage - 1) * safeSize
      const items = filtered.slice(start, start + safeSize).map(mapProduct)

      return {
         items,
         total,
         page: safePage,
         size: safeSize,
      }
   }

   const params = new URLSearchParams()

   if (search.trim()) {
      const trimmed = search.trim()
      params.set('name', trimmed)
      params.set('code', trimmed)
   }

   const query = params.toString()
   const payload = await apiClient<Record<string, unknown> | Product[]>(
      `/api/v1/products${query ? `?${query}` : ''}`,
   )

   const items = unwrapListPayload(payload)
   const safePage = Math.max(1, toNumber(page, 1))
   const safeSize = Math.max(1, toNumber(size, 10))
   const start = (safePage - 1) * safeSize

   return {
      items: items.slice(start, start + safeSize),
      total: items.length,
      page: safePage,
      size: safeSize,
   }
}

export async function createProduct(data: ProductInput): Promise<Product> {
   if (MOCK_PRODUCTS) {
      await wait(MOCK_LATENCY_MS)

      const items = readMockProducts()
      const normalized = validateProductInput(data, items)

      const created = {
         id: getNextMockId(),
         ...normalized,
      }

      writeMockProducts([...items, created])
      return mapProduct(created)
   }

   const payload = await apiClient<Record<string, unknown>>('/api/v1/products', {
      method: 'POST',
      body: JSON.stringify(data),
   })

   return mapProduct(payload?.data || payload)
}

export async function updateProduct(id: string, data: ProductInput): Promise<Product> {
   if (MOCK_PRODUCTS) {
      await wait(MOCK_LATENCY_MS)

      const items = readMockProducts()
      const index = items.findIndex((item) => String(item.id) === String(id))

      if (index === -1) {
         throw createApiError({
            message: 'Producto no encontrado.',
            status: 404,
         })
      }

      const normalized = validateProductInput(data, items, id)
      const updated = {
         ...items[index],
         ...normalized,
      }

      const nextItems = [...items]
      nextItems[index] = updated
      writeMockProducts(nextItems)

      return mapProduct(updated)
   }

   const payload = await apiClient<Record<string, unknown>>(`/api/v1/products/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
   })

   return mapProduct(payload?.data || payload)
}

export async function deleteProduct(id: string): Promise<void> {
   if (MOCK_PRODUCTS) {
      await wait(MOCK_LATENCY_MS)

      const items = readMockProducts()
      const exists = items.some((item) => String(item.id) === String(id))

      if (!exists) {
         throw createApiError({
            message: 'Producto no encontrado.',
            status: 404,
         })
      }

      writeMockProducts(items.filter((item) => String(item.id) !== String(id)))
      return
   }

   await apiClient(`/api/v1/products/${id}`, {
      method: 'DELETE',
   })
}

export async function listProductAlerts(): Promise<Product[]> {
   if (MOCK_PRODUCTS) {
      await wait(MOCK_LATENCY_MS)
      return readMockProducts().filter((item) => item.stock <= 15)
   }

   const payload = await apiClient<Record<string, unknown> | Product[]>('/api/v1/products/alerts')
   return unwrapListPayload(payload)
}
