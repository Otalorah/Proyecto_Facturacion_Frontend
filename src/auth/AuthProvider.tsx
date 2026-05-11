import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { AuthContext, type AuthContextValue } from './auth-context'
import { setApiAuthToken } from '../services/apiClient'

const AUTH_TOKEN_KEY = 'auth.jwt'

type AuthProviderProps = {
   children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
   const [token, setToken] = useState<string>(() => localStorage.getItem(AUTH_TOKEN_KEY) || '')

   useEffect(() => {
      setApiAuthToken(token)
   }, [token])

   const persistToken = useCallback((nextToken: string) => {
      if (!nextToken) {
         localStorage.removeItem(AUTH_TOKEN_KEY)
         setToken('')
         return
      }

      localStorage.setItem(AUTH_TOKEN_KEY, nextToken)
      setToken(nextToken)
   }, [])

   const logout = useCallback(() => {
      persistToken('')
   }, [persistToken])

   const value = useMemo<AuthContextValue>(
      () => ({
         token,
         isAuthenticated: Boolean(token),
         setAuthToken: persistToken,
         logout,
      }),
      [token, persistToken, logout],
   )

   return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
