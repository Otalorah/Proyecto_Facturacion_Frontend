import { apiClient } from './apiClient'
import { extractPage, toNumber } from './response-utils'

export type AuditRecord = {
   id: string
   userId: string
   userName: string
   action: string
   createdAt: string
}

export type ListAuditsParams = {
   page?: number
   size?: number
   userId?: string
   action?: string
   from?: string
   to?: string
}

export type ListAuditsResult = {
   items: AuditRecord[]
   total: number
   page: number
   size: number
}

function mapAudit(raw: Record<string, unknown> | null | undefined): AuditRecord {
   if (!raw) {
      return {
         id: '',
         userId: '',
         userName: '',
         action: '',
         createdAt: '',
      }
   }

   return {
      id: String(raw.id ?? raw.auditId ?? ''),
      userId: String(raw.userId ?? raw.user?.id ?? ''),
      userName: String(raw.userName ?? raw.user?.name ?? ''),
      action: String(raw.action ?? raw.event ?? ''),
      createdAt: String(raw.createdAt ?? raw.timestamp ?? ''),
   }
}

export async function listAudits({
   page = 1,
   size = 10,
   userId = '',
   action = '',
   from = '',
   to = '',
}: ListAuditsParams = {}): Promise<ListAuditsResult> {
   const safePage = Math.max(1, toNumber(page, 1))
   const safeSize = Math.max(1, toNumber(size, 10))

   const params = new URLSearchParams()
   params.set('page', String(Math.max(0, safePage - 1)))
   params.set('size', String(safeSize))

   if (userId) {
      params.set('userId', userId)
   }

   if (action) {
      params.set('action', action)
   }

   if (from) {
      params.set('from', from)
   }

   if (to) {
      params.set('to', to)
   }

   const payload = await apiClient<Record<string, unknown>>(`/api/v1/audit?${params.toString()}`)
   const { items, total } = extractPage(payload, mapAudit)

   return {
      items,
      total: total || items.length,
      page: safePage,
      size: safeSize,
   }
}
