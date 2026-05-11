import { createContext } from 'react'

export type AuthContextValue = {
	token: string
	isAuthenticated: boolean
	setAuthToken: (token: string) => void
	logout: () => void
}

export const AuthContext = createContext<AuthContextValue | null>(null)
