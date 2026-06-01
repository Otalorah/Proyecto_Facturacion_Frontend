import { apiClient } from './apiClient'
import { extractPage, toNumber, unwrapApiData } from './response-utils'

export type Client = {
   id: string
   name: string
   nit: string
   email: string
   telephone: string
   address: string
   active?: boolean
}

export type ClientInput = {
   name: string
   nit: string
   email?: string
   telephone?: string
   address?: string
}

export type ListClientsParams = {
   page?: number
   size?: number
}

export type ListClientsResult = {
   items: Client[]
   total: number
   page: number
   size: number
}

function mapClient(raw: Record<string, unknown> | null | undefined): Client {
   if (!raw) {
      return {
         id: '',
         name: '',
         nit: '',
         email: '',
         telephone: '',
         address: '',
      }
   }

   return {
      id: String(raw.id ?? raw.clientId ?? raw.idClient ?? ''),
      name: String(raw.name ?? raw.nombre ?? ''),
      nit: String(raw.nit ?? raw.documentNumber ?? raw.identification ?? raw.cedula ?? ''),
      email: String(raw.email ?? ''),
      telephone: String(raw.telephone ?? raw.telefono ?? ''),
      address: String(raw.address ?? raw.direccion ?? ''),
      active: raw.active === undefined ? undefined : Boolean(raw.active),
   }
}

export async function listClients({ page = 1, size = 10 }: ListClientsParams = {}): Promise<ListClientsResult> {
   const safePage = Math.max(1, toNumber(page, 1))
   const safeSize = Math.max(1, toNumber(size, 10))

   const params = new URLSearchParams()
   params.set('page', String(Math.max(0, safePage - 1)))
   params.set('size', String(safeSize))

   const payload = await apiClient<Record<string, unknown>>(`/api/v1/clients?${params.toString()}`)
   const { items, total } = extractPage(payload, mapClient)

   return {
      items,
      total: total || items.length,
      page: safePage,
      size: safeSize,
   }
}

export async function getClient(id: string): Promise<Client> {
   const payload = await apiClient<Record<string, unknown>>(`/api/v1/clients/${id}`)
   const data = unwrapApiData<Record<string, unknown>>(payload) || payload
   return mapClient(data)
}

export async function createClient(data: ClientInput): Promise<Client> {
   const payload = await apiClient<Record<string, unknown>>('/api/v1/clients', {
      method: 'POST',
      body: JSON.stringify(data),
   })
   const parsed = unwrapApiData<Record<string, unknown>>(payload) || payload
   return mapClient(parsed)
}

export async function updateClient(id: string, data: ClientInput): Promise<Client> {
   const payload = await apiClient<Record<string, unknown>>(`/api/v1/clients/${id}`,
      {
         method: 'PATCH',
         body: JSON.stringify(data),
      },
   )
   const parsed = unwrapApiData<Record<string, unknown>>(payload) || payload
   return mapClient(parsed)
}

export async function deleteClient(id: string): Promise<void> {
   await apiClient(`/api/v1/clients/${id}`, {
      method: 'DELETE',
   })
}
