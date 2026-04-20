import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { AppStoreProvider } from './store/AppStore'
import { AuthProvider } from './auth/AuthProvider'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <AppStoreProvider>
        <App />
      </AppStoreProvider>
    </AuthProvider>
  </StrictMode>,
)
