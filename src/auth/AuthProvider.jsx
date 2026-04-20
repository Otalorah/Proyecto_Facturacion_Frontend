import { useCallback, useEffect, useMemo, useState } from 'react'
import { AuthContext } from './auth-context'
import { setApiAuthToken } from '../services/apiClient'

const AUTH_TOKEN_KEY = 'auth.jwt'

export function AuthProvider({ children }) {
   const [token, setToken] = useState(() => localStorage.getItem(AUTH_TOKEN_KEY) || '')

   useEffect(() => {
      setApiAuthToken(token)
   }, [token])

   const persistToken = useCallback((nextToken) => {
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

   const value = useMemo(
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
