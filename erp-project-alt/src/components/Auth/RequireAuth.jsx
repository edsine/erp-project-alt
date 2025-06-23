import { Navigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import LoadingSpinner from '../Common/LoadingSpinner'

export default function RequireAuth({ children, allowedRoles }) {
  const { user, loading } = useAuth()

  if (loading) {
    return <LoadingSpinner fullPage />
  }

  if (!user) {
    return <Navigate to="/" replace />
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />
  }

  return children
}