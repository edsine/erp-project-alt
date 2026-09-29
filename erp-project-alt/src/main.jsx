import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext'  // adjust the path if needed
import { ToastProvider } from './components/UI/Toast'
import { ConfirmProvider } from './components/UI/ConfirmDialog'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <ToastProvider>
        <ConfirmProvider>
          <App />
        </ConfirmProvider>
      </ToastProvider>
    </AuthProvider>
  </StrictMode>,
)
