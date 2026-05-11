import { apiClient } from './apiClient.js'
import { USE_MOCK_API } from '../config/feature-flags.js'

type AuthPayload = Record<string, unknown> & {
   token?: string
   jwt?: string
   accessToken?: string
}

type LoginCredentials = {
   email: string
   password: string
}

type RegisterCredentials = {
   name: string
   email: string
   password: string
}

type AuthResponse = {
   token: string
   payload: AuthPayload
}

function extractToken(payload: AuthPayload) {
   return payload?.token || payload?.jwt || payload?.accessToken || ''
}

const MOCK_AUTH = USE_MOCK_API

function wait(ms: number) {
   return new Promise((resolve) => {
      setTimeout(resolve, ms)
   })
}

function buildMockToken(email: string) {
   const raw = `${email}:${Date.now()}`
   return `mock-jwt.${btoa(raw)}.signature`
}

export async function loginRequest(credentials: LoginCredentials): Promise<AuthResponse> {
   if (MOCK_AUTH) {
      await wait(700)

      const email = credentials?.email?.trim()
      const password = credentials?.password?.trim()

      if (!email || !password) {
         throw new Error('Debes ingresar correo y contrasena.')
      }

      const payload: AuthPayload = {
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

   const payload = await apiClient<AuthPayload>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
   })

   return {
      token: extractToken(payload || {}),
      payload: payload || {},
   }
}

export async function registerRequest(data: RegisterCredentials): Promise<AuthResponse> {
   const payload = await apiClient<AuthPayload>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
   })

   return {
      token: extractToken(payload || {}),
      payload: payload || {},
   }
}
