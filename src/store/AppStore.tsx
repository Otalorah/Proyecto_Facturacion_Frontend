import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { AppStoreContext, type AppStoreContextValue, type CurrentUser } from './app-store-context'
import { useAuth } from '../auth/useAuth'
import { meRequest } from '../services/auth-service'

type AppStoreProviderProps = {
   children: ReactNode
}

export function AppStoreProvider({ children }: AppStoreProviderProps) {
   const [currentUser, setCurrentUser] = useState<CurrentUser>(null)
   const { token } = useAuth()

   useEffect(() => {
      let isMounted = true

      async function loadCurrentUser() {
         if (!token) {
            if (isMounted) {
               setCurrentUser(null)
            }
            return
         }

         try {
            const response = await meRequest()
            if (isMounted) {
               setCurrentUser(response.data ?? null)
            }
         } catch {
            if (isMounted) {
               setCurrentUser(null)
            }
         }
      }

      loadCurrentUser()

      return () => {
         isMounted = false
      }
   }, [token])

   const value = useMemo<AppStoreContextValue>(
      () => ({
         currentUser,
         setCurrentUser,
      }),
      [currentUser],
   )

   return (
      <AppStoreContext.Provider value={value}>{children}</AppStoreContext.Provider>
   )
}
