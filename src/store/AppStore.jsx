import { useMemo, useState } from 'react'
import { AppStoreContext } from './app-store-context'

export function AppStoreProvider({ children }) {
   const [currentUser, setCurrentUser] = useState(null)

   const value = useMemo(
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
