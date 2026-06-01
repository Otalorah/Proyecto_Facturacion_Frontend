import { apiClient, apiFetch } from './apiClient'
import { unwrapApiData } from './response-utils'

export type InvoiceType = 'SIMPLE' | 'DETAILED'
export type InvoicePayStatus = 'PENDING' | 'PAID' | 'REJECTED'

export type InvoiceItem = {
   productCode: string
   productName: string
   quantity: number
   unitPrice: number
   lineTotal: number
}

export type Invoice = {
   id: string
   invoiceNumber: string
   type: InvoiceType
   payStatus: InvoicePayStatus
   createdAt: string
   total: number
   saleId: string
   lineItems: InvoiceItem[]
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
         productCode: '',
         productName: '',
         quantity: 0,
         unitPrice: 0,
         lineTotal: 0,
      }
   }

   const quantity = toNumber(raw.quantity ?? raw.qty ?? 0, 0)
   const unitPrice = toNumber(raw.unitPrice ?? raw.price ?? 0, 0)

   return {
      productCode: String(raw.productCode ?? raw.id ?? raw.detailId ?? ''),
      productName: String(raw.productName ?? raw.product?.name ?? ''),
      quantity,
      unitPrice,
      lineTotal: toNumber(raw.lineTotal ?? raw.total ?? quantity * unitPrice, 0),
   }
}

function mapInvoice(raw: Record<string, unknown> | null | undefined): Invoice {
   if (!raw) {
      return {
         id: '',
         invoiceNumber: '',
         type: 'SIMPLE',
         payStatus: 'PENDING',
         createdAt: '',
         total: 0,
         saleId: '',
         lineItems: [],
      }
   }

   const rawItems =
       Array.isArray(raw.lineItems)  // ✅ lo que devuelve la API
           ? (raw.lineItems as unknown[])
           : Array.isArray(raw.items)
               ? (raw.items as unknown[])
               : Array.isArray(raw.details)
                   ? (raw.details as unknown[])
                   : []

   const lineItems = rawItems.map((item) => mapInvoiceItem(item as Record<string, unknown>))

   return {
      id: String(raw.id ?? raw.invoiceId ?? ''),
      invoiceNumber: String(raw.invoiceNumber ?? raw.number ?? ''),
      type: (String(raw.type ?? raw.invoiceType ?? 'SIMPLE').toUpperCase() as InvoiceType) || 'SIMPLE',
      payStatus: String(raw.payStatus ?? raw.invoicePayStatus ?? 'PENDING'.toUpperCase() as InvoicePayStatus) || 'PENDING',
      createdAt: String(raw.createdAt ?? raw.issueDate ?? ''),
      total: toNumber(raw.total ?? raw.totalAmount ?? raw.amount ?? 0, 0),
      saleId: String(raw.saleId ?? raw.sale?.id ?? ''),
      lineItems
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

export async function exportInvoiceXml(id: string, format = 'xml') {
   const response = await apiFetch(`/api/v1/invoices/${id}/export?format=${encodeURIComponent(format)}`)

   if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
   }

   const blob = await response.blob()
   return blob
}

export async function exportInvoiceJson(id: string, format = 'json') {
   const response = await apiFetch(`/api/v1/invoices/${id}/export?format=${encodeURIComponent(format)}`)

   if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
   }

   const blob = await response.blob()
   return blob
}