import { apiClient } from './apiClient.ts'

export type LoginPayload = {
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

export type ApiResponse<T> = {
   success: boolean
   message: string
   timestamp: string
   data?: T
}

export type LoginResponse = ApiResponse<LoginPayload>

export type ForgotPasswordRequest = {
   email: string
}

export type ResetPasswordRequest = {
   token: string
   newPassword: string
   confirmPassword: string
}

export type ChangePasswordRequest = {
   currentPassword: string
   newPassword: string
   confirmPassword: string
}

export type MeResponse = {
   id?: string | number
   name?: string
   email?: string
   role?: string
   active?: boolean
   [key: string]: unknown
}

export async function loginRequest(credentials: LoginCredentials): Promise<LoginResponse > {
   return await apiClient<LoginResponse>('/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
   })
}

export async function registerRequest(data: RegisterCredentials): Promise<ApiResponse<void>> {
   return await apiClient<ApiResponse<void>>('/api/v1/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
   })
}

export async function logoutRequest(): Promise<ApiResponse<void>> {
   return await apiClient<ApiResponse<void>>('/api/v1/auth/logout', {
      method: 'POST',
   })
}

export async function forgotPasswordRequest(payload: ForgotPasswordRequest): Promise<ApiResponse<void>> {
   return await apiClient<ApiResponse<void>>('/api/v1/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify(payload),
   })
}

export async function resetPasswordRequest(payload: ResetPasswordRequest): Promise<ApiResponse<void>> {
   return await apiClient<ApiResponse<void>>('/api/v1/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify(payload),
   })
}

export async function changePasswordRequest(payload: ChangePasswordRequest): Promise<ApiResponse<void>> {
   return await apiClient<ApiResponse<void>>('/api/v1/auth/change-password', {
      method: 'PUT',
      body: JSON.stringify(payload),
   })
}

export async function meRequest(): Promise<ApiResponse<MeResponse>> {
   return await apiClient<ApiResponse<MeResponse>>('/api/v1/auth/me')
}
