const API_URL = (import.meta.env.VITE_API_URL as string | undefined) || 'http://localhost:3000'

let authToken = ''

export type ApiError = Error & {
   status?: number
   details?: unknown
}

export function setApiAuthToken(token: string) {
   authToken = token || ''
}

function buildHeaders(extraHeaders: Record<string, string> = {}) {
   const headers = {
      'Content-Type': 'application/json',
      ...extraHeaders,
   } as Record<string, string>

   if (authToken) {
      headers.Authorization = `Bearer ${authToken}`
   }

   return headers
}

export async function apiClient<T = unknown>(
   path: string,
   options: RequestInit = {},
): Promise<T> {
   const response = await fetch(`${API_URL}${path}`, {
      headers: buildHeaders((options as RequestInit & { headers?: Record<string, string> }).headers),
      ...options,
   })

   if (!response.ok) {
      let message = `HTTP ${response.status}`
      let errorDetails = null

      try {
         const errorPayload = await response.json()
         errorDetails = errorPayload
         message = errorPayload?.message || message
      } catch {
         // Keep fallback message when response has no JSON payload.
      }

      const error = new Error(message) as ApiError
      error.name = 'ApiError'
      error.status = response.status
      error.details = errorDetails
      throw error
   }

   if (response.status === 204) {
      return null as T
   }

   const contentType = response.headers.get('content-type') || ''

   if (!contentType.includes('application/json')) {
      return null as T
   }

   return response.json() as Promise<T>
}

   export async function apiFetch(path: string, options: RequestInit = {}) {
      return fetch(`${API_URL}${path}`, {
         headers: buildHeaders((options as RequestInit & { headers?: Record<string, string> }).headers),
         ...options,
      })
   }