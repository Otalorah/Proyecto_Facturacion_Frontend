import { apiClient } from './apiClient.ts'

type LoginPayload = {
   token: string
   role: string
   email: string
   name: string
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

interface ApiResponse {
   success: boolean
   message: string
   timestamp: string
}  

interface LoginResponse extends ApiResponse {
   data: LoginPayload
}

export async function loginRequest(credentials: LoginCredentials): Promise<LoginResponse > {
   return await apiClient<LoginResponse>('/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
   })
}

export async function registerRequest(data: RegisterCredentials): Promise<ApiResponse> {
   return await apiClient<ApiResponse>('/api/v1/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
   })
}
