function toBooleanEnv(value: unknown, fallback = false) {
   if (value === undefined || value === null || String(value).trim() === '') {
      return fallback
   }

   const normalized = String(value).trim().toLowerCase()
   return normalized === '1' || normalized === 'true' || normalized === 'yes' || normalized === 'on'
}

export const USE_MOCK_API = toBooleanEnv(import.meta.env.VITE_USE_MOCK_API, true)
