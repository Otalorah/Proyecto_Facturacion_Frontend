import { createContext, type Dispatch, type SetStateAction } from 'react'

export type CurrentUser = Record<string, unknown> | null

export type AppStoreContextValue = {
	currentUser: CurrentUser
	setCurrentUser: Dispatch<SetStateAction<CurrentUser>>
}

export const AppStoreContext = createContext<AppStoreContextValue | null>(null)