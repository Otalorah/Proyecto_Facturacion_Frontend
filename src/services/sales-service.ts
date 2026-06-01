import { apiClient } from './apiClient'
import { extractPage, toNumber, unwrapApiData } from './response-utils'

export type SaleStatus = 'ABIERTA' | 'CERRADA' | 'ANULADA'

export type SaleItem = {
   id: string
   productId: string
   productName: string
   quantity: number
   unitPrice: number
   total: number
}

export type SaleSummary = {
   id: string
   clientId: string
   clientName: string
   state: SaleStatus
   saleDate: string
   total: number
}

export type SaleDetail = SaleSummary & {
   items: SaleItem[]
}

export type CreateSaleRequest = {
   clientId: string
}

export type CreateSaleItemRequest = {
   productId: string
   quantity: number
}

export type UpdateSaleItemRequest = {
   quantity: number
}

export type ListSalesParams = {
   page?: number
   size?: number
   clientId?: string
   state?: SaleStatus | ''
   from?: string
   to?: string
}

export type ListSalesResult = {
   items: SaleSummary[]
   total: number
   page: number
   size: number
}

function mapSaleItem(raw: Record<string, unknown> | null | undefined): SaleItem {
   if (!raw) {
      return {
         id: '',
         productId: '',
         productName: '',
         quantity: 0,
         unitPrice: 0,
         total: 0,
      }
   }

   const quantity = toNumber(raw.quantity ?? raw.qty ?? 0, 0)
   const unitPrice = toNumber(raw.unitPrice ?? raw.price ?? 0, 0)

   return {
      id: String(raw.id ?? raw.detailId ?? ''),
      productId: String(raw.productId ?? raw.product?.id ?? ''),
      productName: String(raw.productName ?? raw.product?.name ?? ''),
      quantity,
      unitPrice,
      total: toNumber(raw.total ?? quantity * unitPrice, 0),
   }
}

function mapSale(raw: Record<string, unknown> | null | undefined): SaleSummary {
   if (!raw) {
      return {
         id: '',
         clientId: '',
         clientName: '',
         state: 'ABIERTA',
         saleDate: '',
         total: 0,
      }
   }

   return {
      id: String(raw.id ?? raw.saleId ?? ''),
      clientId: String(raw.clientId ?? raw.client?.id ?? ''),
      clientName: String(raw.clientName ?? raw.client?.name ?? ''),
      state: (String(raw.state ?? 'ABIERTA').toUpperCase() as SaleStatus) || 'ABIERTA',
      saleDate: String(raw.saleDate ?? raw.createdAt ?? ''),
      total: toNumber(raw.total ?? raw.totalAmount ?? raw.amount ?? 0, 0),
   }
}

export async function listSales({
   page = 1,
   size = 10,
   clientId = '',
   state = '',
   from = '',
   to = '',
}: ListSalesParams = {}): Promise<ListSalesResult> {
   const safePage = Math.max(1, toNumber(page, 1))
   const safeSize = Math.max(1, toNumber(size, 10))

   const params = new URLSearchParams()
   params.set('page', String(Math.max(0, safePage - 1)))
   params.set('size', String(safeSize))

   if (clientId) {
      params.set('clientId', clientId)
   }

   if (state) {
      params.set('state', state)
   }

   if (from) {
      params.set('from', from)
   }

   if (to) {
      params.set('to', to)
   }

   const payload = await apiClient<Record<string, unknown>>(`/api/v1/sales?${params.toString()}`)
   const { items, total } = extractPage(payload, mapSale)

   return {
      items,
      total: total || items.length,
      page: safePage,
      size: safeSize,
   }
}

export async function getSale(id: string): Promise<SaleDetail> {
   const payload = await apiClient<Record<string, unknown>>(`/api/v1/sales/${id}`)
   const data = unwrapApiData<Record<string, unknown>>(payload) || payload
   const sale = mapSale(data)
   const items = Array.isArray((data as { details?: unknown })?.details)
      ? ((data as { details?: unknown }).details as unknown[]).map((item) => mapSaleItem(item as Record<string, unknown>))
      : Array.isArray((data as { items?: unknown })?.items)
         ? ((data as { items?: unknown }).items as unknown[]).map((item) => mapSaleItem(item as Record<string, unknown>))
         : []

   return {
      ...sale,
      items,
   }
}

export async function createSale(payload: CreateSaleRequest): Promise<SaleDetail> {
   const response = await apiClient<Record<string, unknown>>('/api/v1/sales', {
      method: 'POST',
      body: JSON.stringify(payload),
   })
   const data = unwrapApiData<Record<string, unknown>>(response) || response
   return {
      ...mapSale(data),
      items: Array.isArray((data as { details?: unknown })?.details)
         ? ((data as { details?: unknown }).details as unknown[]).map((item) => mapSaleItem(item as Record<string, unknown>))
         : [],
   }
}

export async function addSaleItem(saleId: string, payload: CreateSaleItemRequest): Promise<SaleItem> {
   const response = await apiClient<Record<string, unknown>>(`/api/v1/sales/${saleId}/products`, {
      method: 'POST',
      body: JSON.stringify(payload),
   })
   const data = unwrapApiData<Record<string, unknown>>(response) || response
   return mapSaleItem(data)
}

export async function updateSaleItem(
   saleId: string,
   detailId: string,
   payload: UpdateSaleItemRequest,
): Promise<SaleItem> {
   const response = await apiClient<Record<string, unknown>>(`/api/v1/sales/${saleId}/products/${detailId}`,
      {
         method: 'PATCH',
         body: JSON.stringify(payload),
      },
   )
   const data = unwrapApiData<Record<string, unknown>>(response) || response
   return mapSaleItem(data)
}

export async function removeSaleItem(saleId: string, detailId: string): Promise<void> {
   await apiClient(`/api/v1/sales/${saleId}/products/${detailId}`, {
      method: 'DELETE',
   })
}

export async function confirmSale(id: string): Promise<SaleDetail> {
   const response = await apiClient<Record<string, unknown>>(`/api/v1/sales/${id}/confirm`, {
      method: 'PUT',
   })
   const data = unwrapApiData<Record<string, unknown>>(response) || response
   return {
      ...mapSale(data),
      items: Array.isArray((data as { details?: unknown })?.details)
         ? ((data as { details?: unknown }).details as unknown[]).map((item) => mapSaleItem(item as Record<string, unknown>))
         : [],
   }
}

export async function cancelSale(id: string): Promise<SaleDetail> {
   const response = await apiClient<Record<string, unknown>>(`/api/v1/sales/${id}/cancel`, {
      method: 'PATCH',
   })
   const data = unwrapApiData<Record<string, unknown>>(response) || response
   return {
      ...mapSale(data),
      items: Array.isArray((data as { details?: unknown })?.details)
         ? ((data as { details?: unknown }).details as unknown[]).map((item) => mapSaleItem(item as Record<string, unknown>))
         : [],
   }
}
