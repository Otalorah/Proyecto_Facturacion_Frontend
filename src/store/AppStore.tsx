import { useMemo, useState, type ReactNode } from 'react'
import { AppStoreContext, type AppStoreContextValue, type CurrentUser } from './app-store-context'

type AppStoreProviderProps = {
   children: ReactNode
}

export function AppStoreProvider({ children }: AppStoreProviderProps) {
   const [currentUser, setCurrentUser] = useState<CurrentUser>(null)

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
