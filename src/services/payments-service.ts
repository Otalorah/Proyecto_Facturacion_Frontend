import { apiClient, apiFetch } from './apiClient'
import { extractPage, toNumber, unwrapApiData } from './response-utils'

const API_URL = (import.meta.env.VITE_API_URL as string | undefined) || 'http://localhost:3000'

export type PaymentMethod = 'CASH' | 'CREDIT_CARD' | 'DEBIT_CARD' | 'TRANSFER'
export type PaymentStatus = 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED'

export type Payment = {
   id: string
   invoiceId: string
   method: PaymentMethod
   status: PaymentStatus
   amount: number
   createdAt: string
}

export type CreatePaymentRequest = {
   invoiceId: string
   method: PaymentMethod
   amount: number
}

export type ManualPaymentRequest = {
   invoiceId: string
   method: PaymentMethod
   amount: number
   reference?: string
}

export type ListPaymentsParams = {
   page?: number
   size?: number
   invoiceId?: string
   method?: PaymentMethod | ''
   status?: PaymentStatus | ''
}

export type ListPaymentsResult = {
   items: Payment[]
   total: number
   page: number
   size: number
}

function mapPayment(raw: Record<string, unknown> | null | undefined): Payment {
   if (!raw) {
      return {
         id: '',
         invoiceId: '',
         method: 'CASH',
         status: 'PENDING',
         amount: 0,
         createdAt: '',
      }
   }

   return {
      id: String(raw.id ?? raw.paymentId ?? ''),
      invoiceId: String(raw.invoiceId ?? raw.invoice?.id ?? ''),
      method: (String(raw.method ?? raw.paymentMethod ?? 'CASH').toUpperCase() as PaymentMethod) || 'CASH',
      status: (String(raw.status ?? 'PENDING').toUpperCase() as PaymentStatus) || 'PENDING',
      amount: toNumber(raw.amount ?? raw.total ?? 0, 0),
      createdAt: String(raw.createdAt ?? raw.paymentDate ?? ''),
   }
}

export async function listPayments({
   page = 1,
   size = 10,
   invoiceId = '',
   method = '',
   status = '',
}: ListPaymentsParams = {}): Promise<ListPaymentsResult> {
   const safePage = Math.max(1, toNumber(page, 1))
   const safeSize = Math.max(1, toNumber(size, 10))

   const params = new URLSearchParams()
   params.set('page', String(Math.max(0, safePage - 1)))
   params.set('size', String(safeSize))

   if (invoiceId) {
      params.set('invoiceId', invoiceId)
   }

   if (method) {
      params.set('method', method)
   }

   if (status) {
      params.set('status', status)
   }

   const payload = await apiClient<Record<string, unknown>>(`/api/v1/payments?${params.toString()}`)
   const { items, total } = extractPage(payload, mapPayment)

   return {
      items,
      total: total || items.length,
      page: safePage,
      size: safeSize,
   }
}

export async function getPayment(id: string): Promise<Payment> {
   const payload = await apiClient<Record<string, unknown>>(`/api/v1/payments/${id}`)
   const data = unwrapApiData<Record<string, unknown>>(payload) || payload
   return mapPayment(data)
}

export async function createPayment(payload: CreatePaymentRequest): Promise<Payment> {
   const response = await apiClient<Record<string, unknown>>('/api/v1/payments', {
      method: 'POST',
      body: JSON.stringify(payload),
   })
   const data = unwrapApiData<Record<string, unknown>>(response) || response
   return mapPayment(data)
}

export async function createManualPayment(payload: ManualPaymentRequest): Promise<Payment> {
   const response = await apiClient<Record<string, unknown>>('/api/v1/payments/manual', {
      method: 'POST',
      body: JSON.stringify(payload),
   })
   const data = unwrapApiData<Record<string, unknown>>(response) || response
   return mapPayment(data)
}

export async function fetchPaymentQrImage(invoiceId: string) {
   const response = await apiFetch(`/api/v1/payments/qr/${invoiceId}`)

   if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
   }

   return response.blob()
}

export function getPaymentQrViewUrl(invoiceId: string) {
   return `${API_URL}/api/v1/payments/qr/pay/${invoiceId}`
}
