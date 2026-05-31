import { apiClient, apiFetch } from './apiClient'
import { unwrapApiData } from './response-utils'

export type InvoiceType = 'SIMPLE' | 'DETAILED'

export type InvoiceItem = {
   id: string
   productName: string
   quantity: number
   unitPrice: number
   total: number
}

export type Invoice = {
   id: string
   invoiceNumber: string
   type: InvoiceType
   status: string
   createdAt: string
   total: number
   saleId: string
   items: InvoiceItem[]
}

export type CreateInvoiceRequest = {
   saleId: string
   type: InvoiceType
}

function toNumber(value: unknown, fallback = 0) {
   const num = Number(value)
   return Number.isFinite(num) ? num : fallback
}

function mapInvoiceItem(raw: Record<string, unknown> | null | undefined): InvoiceItem {
   if (!raw) {
      return {
         id: '',
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
      productName: String(raw.productName ?? raw.product?.name ?? ''),
      quantity,
      unitPrice,
      total: toNumber(raw.total ?? quantity * unitPrice, 0),
   }
}

function mapInvoice(raw: Record<string, unknown> | null | undefined): Invoice {
   if (!raw) {
      return {
         id: '',
         invoiceNumber: '',
         type: 'SIMPLE',
         status: '',
         createdAt: '',
         total: 0,
         saleId: '',
         items: [],
      }
   }

   const items = Array.isArray((raw as { items?: unknown })?.items)
      ? ((raw as { items?: unknown }).items as unknown[]).map((item) => mapInvoiceItem(item as Record<string, unknown>))
      : Array.isArray((raw as { details?: unknown })?.details)
         ? ((raw as { details?: unknown }).details as unknown[]).map((item) => mapInvoiceItem(item as Record<string, unknown>))
         : []

   return {
      id: String(raw.id ?? raw.invoiceId ?? ''),
      invoiceNumber: String(raw.invoiceNumber ?? raw.number ?? ''),
      type: (String(raw.type ?? raw.invoiceType ?? 'SIMPLE').toUpperCase() as InvoiceType) || 'SIMPLE',
      status: String(raw.status ?? ''),
      createdAt: String(raw.createdAt ?? raw.issueDate ?? ''),
      total: toNumber(raw.total ?? raw.totalAmount ?? raw.amount ?? 0, 0),
      saleId: String(raw.saleId ?? raw.sale?.id ?? ''),
      items,
   }
}

export async function listInvoices(): Promise<Invoice[]> {
   const payload = await apiClient<Record<string, unknown> | Record<string, unknown>[]>(
      '/api/v1/invoices',
   )

   if (Array.isArray(payload)) {
      return payload.map((item) => mapInvoice(item as Record<string, unknown>))
   }

   const data = unwrapApiData<unknown>(payload)

   if (Array.isArray(data)) {
      return data.map((item) => mapInvoice(item as Record<string, unknown>))
   }

   return []
}

export async function getInvoice(id: string): Promise<Invoice> {
   const payload = await apiClient<Record<string, unknown>>(`/api/v1/invoices/${id}`)
   const data = unwrapApiData<Record<string, unknown>>(payload) || payload
   return mapInvoice(data)
}

export async function createInvoice(payload: CreateInvoiceRequest): Promise<Invoice> {
   const response = await apiClient<Record<string, unknown>>('/api/v1/invoices', {
      method: 'POST',
      body: JSON.stringify(payload),
   })
   const data = unwrapApiData<Record<string, unknown>>(response) || response
   return mapInvoice(data)
}

export async function exportInvoicePdf(id: string, format = 'pdf') {
   const response = await apiFetch(`/api/v1/invoices/${id}/export?format=${encodeURIComponent(format)}`)

   if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
   }

   const blob = await response.blob()
   return blob
}
