import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import { AppStoreProvider } from './store/AppStore'
import { AuthProvider } from './auth/AuthProvider'

const rootElement = document.getElementById('root') as HTMLElement

createRoot(rootElement).render(
  <StrictMode>
    <AuthProvider>
      <AppStoreProvider>
        <App />
      </AppStoreProvider>
    </AuthProvider>
  </StrictMode>,
)
