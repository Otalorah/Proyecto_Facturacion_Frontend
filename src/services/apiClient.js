const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

let authToken = ''

export function setApiAuthToken(token) {
   authToken = token || ''
}

function buildHeaders(extraHeaders = {}) {
   const headers = {
      'Content-Type': 'application/json',
      ...extraHeaders,
   }

   if (authToken) {
      headers.Authorization = `Bearer ${authToken}`
   }

   return headers
}

export async function apiClient(path, options = {}) {
   const response = await fetch(`${API_URL}${path}`, {
      headers: buildHeaders(options.headers),
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

      const error = new Error(message)
      error.name = 'ApiError'
      error.status = response.status
      error.details = errorDetails
      throw error
   }

   const contentType = response.headers.get('content-type') || ''

   if (contentType.includes('application/json')) {
      return response.json()
   }

   return null
}