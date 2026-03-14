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
import MedicalRecords from '@/pages/patient/MedicalRecords'
import DoctorDashboard from '@/pages/doctor/Dashboard'
import DoctorPatients from '@/pages/doctor/Patients'
import DoctorAppointments from '@/pages/doctor/Appointments'
import DoctorBillingPage from '@/pages/doctor/BillingPage'
import PatientDetailPage from '@/pages/doctor/PatientDetailPage'
import CoderDashboard from '@/pages/coder/Dashboard'
import ClaimDetailPage from '@/pages/coder/ClaimDetailPage'
import ClaimsQueue from '@/pages/coder/ClaimsQueue'
import CoderPatients from '@/pages/coder/CoderPatients'
import BillingDashboard from '@/pages/billing/Dashboard'
import InvoicesPage from '@/pages/billing/InvoicesPage'
import PaymentsPage from '@/pages/billing/PaymentsPage'
import ReportsPage from '@/pages/billing/ReportsPage'
import CMS1500Form from '@/pages/billing/CMS1500Form'
import DenialQueuePage from '@/pages/billing/DenialQueuePage'
import AdminDashboard from '@/pages/admin/Dashboard'
import AdminUsers from '@/pages/admin/Users'
import AdminSettings from '@/pages/admin/Settings'
import Analytics from '@/pages/admin/Analytics'
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
                <Route path="records" element={<MedicalRecords />} />
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
                <Route path="billing" element={<DoctorBillingPage />} />
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
                <Route path="claims" element={<ClaimsQueue />} />
                <Route path="claims/:id" element={<ClaimDetailPage />} />
                <Route path="patients" element={<CoderPatients />} />
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
                <Route path="invoices" element={<InvoicesPage />} />
                <Route path="payments" element={<PaymentsPage />} />
                <Route path="denials" element={<DenialQueuePage />} />
                <Route path="reports" element={<ReportsPage />} />
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
                <Route path="analytics" element={<Analytics />} />
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

