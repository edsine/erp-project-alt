import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function AuthLayout() {
  const { user } = useAuth()
  
  if (user) {
    return <Navigate to="/dashboard" replace />
  }
  
  return (
    <div className="auth-layout">
      <Outlet />
    </div>
  )
}