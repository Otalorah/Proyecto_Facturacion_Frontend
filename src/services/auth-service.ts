import { apiClient } from './apiClient.ts'
import { USE_MOCK_API } from '../config/feature-flags.ts'

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

type ApiResponse = {
   success: boolean
   message: string
   data?: unknown
   timestamp: string
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

export async function loginRequest(credentials: LoginCredentials): Promise<ApiResponse > {
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
         success: true,
         message: 'Autenticacion simulada exitosa.',
         data: payload,
         timestamp: new Date().toISOString(),
      }
   }

   const res = await apiClient<ApiResponse>('/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
   })

   return res
}

export async function registerRequest(data: RegisterCredentials): Promise<ApiResponse> {
   const res = await apiClient<ApiResponse>('/api/v1/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
   })

   return res
}
