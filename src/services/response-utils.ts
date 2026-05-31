export type ApiResponse<T> = {
   success: boolean
   message: string
   timestamp: string
   data?: T
}

export function toNumber(value: unknown, fallback = 0) {
   const num = Number(value)
   return Number.isFinite(num) ? num : fallback
}

export function unwrapApiData<T>(payload: unknown): T | null {
   if (!payload || typeof payload !== 'object') {
      return null
   }

   const data = (payload as { data?: T }).data
   return data ?? null
}

export function extractPage<T>(
   payload: unknown,
   mapItem: (item: Record<string, unknown>) => T,
): { items: T[]; total: number } {
   if (Array.isArray(payload)) {
      return {
         items: payload.map((item) => mapItem(item as Record<string, unknown>)),
         total: payload.length,
      }
   }

   const payloadObject = payload as Record<string, unknown> | null
   const data = (payloadObject?.data as Record<string, unknown> | null) ?? null

   if (data && Array.isArray((data as { content?: unknown }).content)) {
      const content = (data as { content?: unknown }).content as unknown[]
      return {
         items: content.map((item) => mapItem(item as Record<string, unknown>)),
         total: toNumber((data as { totalElements?: unknown }).totalElements, content.length),
      }
   }

   if (Array.isArray((payloadObject as { content?: unknown })?.content)) {
      const content = (payloadObject as { content?: unknown }).content as unknown[]
      return {
         items: content.map((item) => mapItem(item as Record<string, unknown>)),
         total: toNumber((payloadObject as { totalElements?: unknown }).totalElements, content.length),
      }
   }

   return { items: [], total: 0 }
}
