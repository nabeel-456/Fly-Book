import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/Authcontext'

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) return <p className="p-8 text-slate-500">Loading...</p>
  return user ? children : <Navigate to="/login" state={{ from: location.pathname }} replace />
}