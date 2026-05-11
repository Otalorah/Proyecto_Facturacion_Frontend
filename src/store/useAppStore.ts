import { useContext } from 'react'
import { AppStoreContext, type AppStoreContextValue } from './app-store-context'

export function useAppStore(): AppStoreContextValue {
   const context = useContext(AppStoreContext)

   if (!context) {
      throw new Error('useAppStore must be used within AppStoreProvider')
   }

   return context
}