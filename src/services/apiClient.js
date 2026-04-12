const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

export async function apiClient(path, options = {}) {
   const response = await fetch(`${API_URL}${path}`, {
      headers: {
      'Content-Type': 'application/json',
      ...options.headers,
      },
      ...options,
   })

   if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
   }

   return response.json()
}