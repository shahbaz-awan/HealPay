import { Routes, Route, Navigate } from 'react-router-dom'
import LandingPage from '@/pages/LandingPage'
import LoginPage from '@/pages/auth/LoginPage'
import RegisterPage from '@/pages/auth/RegisterPage'
import ForgotPasswordPage from '@/pages/auth/ForgotPasswordPage'
import GoogleCallback from '@/pages/auth/GoogleCallback'
import DashboardLayout from '@/components/layout/DashboardLayout'
import PatientDashboard from '@/pages/patient/Dashboard'
import PatientIntakeForm from '@/pages/patient/PatientIntakeForm'
import PatientAppointments from '@/pages/patient/Appointments'
import PatientBills from '@/pages/patient/Bills'
import DoctorDashboard from '@/pages/doctor/Dashboard'
import DoctorPatients from '@/pages/doctor/Patients'
import DoctorAppointments from '@/pages/doctor/Appointments'
import PatientDetailPage from '@/pages/doctor/PatientDetailPage'
import CoderDashboard from '@/pages/coder/Dashboard'
import ClaimDetailPage from '@/pages/coder/ClaimDetailPage'
import BillingDashboard from '@/pages/billing/Dashboard'
import CMS1500Form from '@/pages/billing/CMS1500Form'
import AdminDashboard from '@/pages/admin/Dashboard'
import AdminUsers from '@/pages/admin/Users'
import AdminSettings from '@/pages/admin/Settings'
import UserProfile from '@/pages/shared/UserProfile'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import { UserRole } from '@/types'

const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/auth/callback" element={<GoogleCallback />} />

      {/* Protected Routes - Patient */}
      <Route
        path="/patient/*"
        element={
          <ProtectedRoute allowedRoles={[UserRole.PATIENT]}>
            <DashboardLayout>
              <Routes>
                <Route path="dashboard" element={<PatientDashboard />} />
                <Route path="intake-form" element={<PatientIntakeForm />} />
                <Route path="appointments" element={<PatientAppointments />} />
                <Route path="bills" element={<PatientBills />} />
                <Route path="profile" element={<UserProfile />} />
                <Route path="*" element={<Navigate to="/patient/dashboard" replace />} />
              </Routes>
            </DashboardLayout>
          </ProtectedRoute>
        }
      />

      {/* Protected Routes - Doctor */}
      <Route
        path="/doctor/*"
        element={
          <ProtectedRoute allowedRoles={[UserRole.DOCTOR]}>
            <DashboardLayout>
              <Routes>
                <Route path="dashboard" element={<DoctorDashboard />} />
                <Route path="patients" element={<DoctorPatients />} />
                <Route path="patients/:id" element={<PatientDetailPage />} />
                <Route path="appointments" element={<DoctorAppointments />} />
                <Route path="profile" element={<UserProfile />} />
                <Route path="*" element={<Navigate to="/doctor/dashboard" replace />} />
              </Routes>
            </DashboardLayout>
          </ProtectedRoute>
        }
      />

      {/* Protected Routes - Medical Coder */}
      <Route
        path="/coder/*"
        element={
          <ProtectedRoute allowedRoles={[UserRole.CODER]}>
            <DashboardLayout>
              <Routes>
                <Route path="dashboard" element={<CoderDashboard />} />
                <Route path="claims/:id" element={<ClaimDetailPage />} />
                <Route path="profile" element={<UserProfile />} />
                <Route path="*" element={<Navigate to="/coder/dashboard" replace />} />
              </Routes>
            </DashboardLayout>
          </ProtectedRoute>
        }
      />

      {/* Protected Routes - Billing Staff */}
      <Route
        path="/billing/*"
        element={
          <ProtectedRoute allowedRoles={[UserRole.BILLING]}>
            <DashboardLayout>
              <Routes>
                <Route path="dashboard" element={<BillingDashboard />} />
                <Route path="cms1500" element={<CMS1500Form />} />
                <Route path="cms1500/:encounterId" element={<CMS1500Form />} />
                <Route path="profile" element={<UserProfile />} />
                <Route path="*" element={<Navigate to="/billing/dashboard" replace />} />
              </Routes>
            </DashboardLayout>
          </ProtectedRoute>
        }
      />

      {/* Protected Routes - Admin */}
      <Route
        path="/admin/*"
        element={
          <ProtectedRoute allowedRoles={[UserRole.ADMIN]}>
            <DashboardLayout>
              <Routes>
                <Route path="dashboard" element={<AdminDashboard />} />
                <Route path="users" element={<AdminUsers />} />
                <Route path="settings" element={<AdminSettings />} />
                <Route path="profile" element={<UserProfile />} />
                <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
              </Routes>
            </DashboardLayout>
          </ProtectedRoute>
        }
      />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes >
  )
}

export default AppRoutes

