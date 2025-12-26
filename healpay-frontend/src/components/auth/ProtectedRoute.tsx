import { Navigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { UserRole } from '@/types'
import { FullPageLoader } from '@/components/ui/LoadingSpinner'

interface ProtectedRouteProps {
  children: React.ReactNode
  allowedRoles?: UserRole[]
}

const ProtectedRoute = ({ children, allowedRoles }: ProtectedRouteProps) => {
  const { isAuthenticated, user } = useAuthStore()

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect to their appropriate dashboard
    const roleDashboards: Record<UserRole, string> = {
      [UserRole.PATIENT]: '/patient/dashboard',
      [UserRole.DOCTOR]: '/doctor/dashboard',
      [UserRole.CODER]: '/coder/dashboard',
      [UserRole.BILLING]: '/billing/dashboard',
      [UserRole.ADMIN]: '/admin/dashboard',
    }
    return <Navigate to={roleDashboards[user.role]} replace />
  }

  return <>{children}</>
}

export default ProtectedRoute

