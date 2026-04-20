import { apiClient } from './apiClient'

function extractToken(payload) {
   return payload?.token || payload?.jwt || payload?.accessToken || ''
}

const MOCK_AUTH = true

function wait(ms) {
   return new Promise((resolve) => {
      setTimeout(resolve, ms)
   })
}

function buildMockToken(email) {
   const raw = `${email}:${Date.now()}`
   return `mock-jwt.${btoa(raw)}.signature`
}

export async function loginRequest(credentials) {
   if (MOCK_AUTH) {
      await wait(700)

      const email = credentials?.email?.trim()
      const password = credentials?.password?.trim()

      if (!email || !password) {
         throw new Error('Debes ingresar correo y contrasena.')
      }

      const payload = {
         token: buildMockToken(email),
         user: {
            email,
         },
      }

      return {
         token: extractToken(payload),
         payload,
      }
   }

   const payload = await apiClient('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
   })

   return {
      token: extractToken(payload),
      payload,
   }
}

export async function registerRequest(data) {
   const payload = await apiClient('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
   })

   return {
      token: extractToken(payload),
      payload,
   }
}
