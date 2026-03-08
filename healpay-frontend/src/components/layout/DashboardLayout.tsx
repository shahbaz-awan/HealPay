import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard,
  FileText,
  Calendar,
  CreditCard,
  Users,
  Settings,
  LogOut,
  Menu,
  X,
  Search,
  ChevronDown,
  User,
  ClipboardList,
  Activity,
  DollarSign,
  Shield,
  BarChart3
} from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { UserRole } from '@/types'
import { Logo } from '@/components/ui/Logo'
import ThemeToggle from '@/components/ui/ThemeToggle'
import NotificationsPanel from '@/components/ui/NotificationsPanel'

interface NavItem {
  name: string
  path: string
  icon: any
  roles: UserRole[]
}

const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuthStore()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [userMenuOpen, setUserMenuOpen] = useState(false)

  const getNavigationItems = (): NavItem[] => {
    switch (user?.role) {
      case UserRole.PATIENT:
        return [
          { name: 'Dashboard', path: '/patient/dashboard', icon: LayoutDashboard, roles: [UserRole.PATIENT] },
          { name: 'Intake Form', path: '/patient/intake-form', icon: ClipboardList, roles: [UserRole.PATIENT] },
          { name: 'Bills', path: '/patient/bills', icon: FileText, roles: [UserRole.PATIENT] },
          { name: 'Appointments', path: '/patient/appointments', icon: Calendar, roles: [UserRole.PATIENT] },
          { name: 'Payments', path: '/patient/payments', icon: CreditCard, roles: [UserRole.PATIENT] },
          { name: 'Medical Records', path: '/patient/records', icon: Activity, roles: [UserRole.PATIENT] },
        ]
      case UserRole.DOCTOR:
        return [
          { name: 'Dashboard', path: '/doctor/dashboard', icon: LayoutDashboard, roles: [UserRole.DOCTOR] },
          { name: 'Patients', path: '/doctor/patients', icon: Users, roles: [UserRole.DOCTOR] },
          { name: 'Appointments', path: '/doctor/appointments', icon: Calendar, roles: [UserRole.DOCTOR] },
          { name: 'Billing', path: '/doctor/billing', icon: DollarSign, roles: [UserRole.DOCTOR] },
        ]
      case UserRole.CODER:
        return [
          { name: 'Dashboard', path: '/coder/dashboard', icon: LayoutDashboard, roles: [UserRole.CODER] },
          { name: 'Claims Queue', path: '/coder/claims', icon: FileText, roles: [UserRole.CODER] },
          { name: 'Patients', path: '/coder/patients', icon: Users, roles: [UserRole.CODER] },
        ]
      case UserRole.BILLING:
        return [
          { name: 'Dashboard', path: '/billing/dashboard', icon: LayoutDashboard, roles: [UserRole.BILLING] },
          { name: 'Invoices', path: '/billing/invoices', icon: FileText, roles: [UserRole.BILLING] },
          { name: 'Payments', path: '/billing/payments', icon: CreditCard, roles: [UserRole.BILLING] },
          { name: 'Reports', path: '/billing/reports', icon: BarChart3, roles: [UserRole.BILLING] },
        ]
      case UserRole.ADMIN:
        return [
          { name: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard, roles: [UserRole.ADMIN] },
          { name: 'Manage Users', path: '/admin/users', icon: Users, roles: [UserRole.ADMIN] },
          { name: 'Analytics', path: '/admin/analytics', icon: BarChart3, roles: [UserRole.ADMIN] },
          { name: 'Settings', path: '/admin/settings', icon: Shield, roles: [UserRole.ADMIN] },
        ]
      default:
        return []
    }
  }

  const navigationItems = getNavigationItems()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const getUserInitials = () => {
    if (!user) return 'U'
    return `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase()
  }

  const getRoleBadgeColor = () => {
    switch (user?.role) {
      case UserRole.PATIENT:
        return 'bg-blue-100 text-blue-800'
      case UserRole.DOCTOR:
        return 'bg-purple-100 text-purple-800'
      case UserRole.CODER:
        return 'bg-green-100 text-green-800'
      case UserRole.BILLING:
        return 'bg-yellow-100 text-yellow-800'
      case UserRole.ADMIN:
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-40 h-screen transition-transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          } bg-white border-r border-gray-200 w-64`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <Link to="/" className="flex items-center">
              <Logo size="md" />
            </Link>
            {/* Mobile Close Button */}
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-4 space-y-1">
            {navigationItems.map((item) => {
              const Icon = item.icon
              const isActive = location.pathname === item.path

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${isActive
                    ? 'bg-primary-50 text-primary-700 font-medium'
                    : 'text-gray-700 hover:bg-gray-100'
                    }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.name}</span>
                </Link>
              )
            })}
          </nav>

          {/* User Profile Section */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center text-white font-semibold">
                  {getUserInitials()}
                </div>
                <div className="flex-1 text-left">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {user?.firstName} {user?.lastName}
                  </p>
                  <p className={`text-xs px-2 py-0.5 rounded-full inline-block ${getRoleBadgeColor()}`}>
                    {user?.role}
                  </p>
                </div>
                <ChevronDown className={`w-4 h-4 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* User Dropdown */}
              <AnimatePresence>
                {userMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute bottom-full left-0 right-0 mb-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
                  >
                    <Link
                      to={`/${user?.role.toLowerCase()}/profile`}
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      <User className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                      <span className="text-sm text-gray-700 dark:text-gray-300">My Profile</span>
                    </Link>
                    <Link
                      to={`/${user?.role.toLowerCase()}/settings`}
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      <Settings className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                      <span className="text-sm text-gray-700 dark:text-gray-300">Settings</span>
                    </Link>
                    <button
                      onClick={() => {
                        setUserMenuOpen(false)
                        handleLogout()
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors border-t border-gray-100 dark:border-gray-700"
                    >
                      <LogOut className="w-4 h-4 text-red-600" />
                      <span className="text-sm text-red-600">Logout</span>
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className={`transition-all duration-300 ${sidebarOpen ? 'lg:ml-64' : 'lg:ml-0'} min-h-screen`}>
        {/* Header */}
        <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-30">
          <div className="flex items-center justify-between px-6 py-4">
            {/* Left Side - Menu Button & Search */}
            <div className="flex items-center gap-4">
              {/* Sidebar Toggle Button - Always Visible */}
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                title={sidebarOpen ? "Close sidebar" : "Open sidebar"}
              >
                <Menu className="w-6 h-6 text-gray-600 dark:text-gray-400" />
              </button>

              {/* Search Bar */}
              <div className="hidden md:flex flex-1 max-w-xl mx-4">
                <div className="relative w-full">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
                  <input
                    type="text"
                    placeholder="Search patients, bills, appointments..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Right Side Actions */}
            <div className="flex items-center gap-3">
              {/* Theme Toggle */}
              <ThemeToggle />

              {/* Notifications */}
              <NotificationsPanel />

              {/* Desktop User Menu */}
              <div className="hidden lg:block">
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg">
                  <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                    {getUserInitials()}
                  </div>
                  <div className="text-sm">
                    <p className="font-medium text-gray-900 dark:text-gray-100">{user?.firstName} {user?.lastName}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-6">
          {children}
        </main>
      </div>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  )
}

export default DashboardLayout
