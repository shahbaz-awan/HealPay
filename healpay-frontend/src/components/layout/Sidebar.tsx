import { motion } from 'framer-motion'
import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  FileText,
  CreditCard,
  Settings,
  LogOut,
  Activity,
  ClipboardList,
  DollarSign,
  UserCog,
  Stethoscope,
  Code2,
} from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { UserRole } from '@/types'
import { Logo } from '@/components/ui/Logo'
import { cn } from '@/utils/cn'

interface SidebarProps {
  isOpen: boolean
  onToggle: () => void
}

const Sidebar = ({ isOpen }: SidebarProps) => {
  const { user, logout } = useAuthStore()

  const menuItems = {
    [UserRole.PATIENT]: [
      { icon: LayoutDashboard, label: 'Dashboard', path: '/patient/dashboard' },
      { icon: ClipboardList, label: 'Medical Records', path: '/patient/records' },
      { icon: FileText, label: 'Bills', path: '/patient/bills' },
      { icon: CreditCard, label: 'Payments', path: '/patient/payments' },
      { icon: Settings, label: 'Settings', path: '/patient/settings' },
    ],
    [UserRole.DOCTOR]: [
      { icon: LayoutDashboard, label: 'Dashboard', path: '/doctor/dashboard' },
      { icon: Users, label: 'Patients', path: '/doctor/patients' },
      { icon: Stethoscope, label: 'Encounters', path: '/doctor/encounters' },
      { icon: Activity, label: 'Schedule', path: '/doctor/schedule' },
      { icon: Settings, label: 'Settings', path: '/doctor/settings' },
    ],
    [UserRole.CODER]: [
      { icon: LayoutDashboard, label: 'Dashboard', path: '/coder/dashboard' },
      { icon: Code2, label: 'Pending Codes', path: '/coder/pending' },
      { icon: FileText, label: 'History', path: '/coder/history' },
      { icon: Settings, label: 'Settings', path: '/coder/settings' },
    ],
    [UserRole.BILLING]: [
      { icon: LayoutDashboard, label: 'Dashboard', path: '/billing/dashboard' },
      { icon: FileText, label: 'Claims', path: '/billing/claims' },
      { icon: DollarSign, label: 'Payments', path: '/billing/payments' },
      { icon: Activity, label: 'Reports', path: '/billing/reports' },
      { icon: Settings, label: 'Settings', path: '/billing/settings' },
    ],
    [UserRole.ADMIN]: [
      { icon: LayoutDashboard, label: 'Dashboard', path: '/admin/dashboard' },
      { icon: UserCog, label: 'User Management', path: '/admin/users' },
      { icon: Activity, label: 'System', path: '/admin/system' },
      { icon: Settings, label: 'Settings', path: '/admin/settings' },
    ],
  }

  const items = user ? menuItems[user.role] || [] : []

  return (
    <motion.aside
      initial={false}
      animate={{ width: isOpen ? 256 : 80 }}
      transition={{ duration: 0.3 }}
      className="fixed left-0 top-0 h-screen bg-white border-r border-blue-200 shadow-xl z-50"
    >
      <div className="flex flex-col h-full">
        {/* Logo */}
        <div className="p-6 border-b border-blue-200">
          <motion.div
            className="flex items-center gap-3"
            animate={{ justifyContent: isOpen ? 'flex-start' : 'center' }}
          >
            {isOpen ? (
              <Logo size="sm" showText={true} />
            ) : (
              <Logo size="sm" showText={false} />
            )}
          </motion.div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 overflow-y-auto">
          <ul className="space-y-2">
            {items.map((item) => (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200',
                      'hover:bg-blue-50 hover:translate-x-1',
                      isActive
                        ? 'bg-primary-600 text-white shadow-glow'
                        : 'text-secondary-600 hover:text-primary-600'
                    )
                  }
                >
                  <item.icon className="w-5 h-5 flex-shrink-0" />
                  {isOpen && (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="font-medium"
                    >
                      {item.label}
                    </motion.span>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        {/* User Profile & Logout */}
        <div className="p-4 border-t border-blue-200">
          {isOpen && user && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mb-3 p-3 bg-blue-50 rounded-lg border border-blue-100"
            >
              <p className="text-sm font-semibold text-secondary-900">
                {user.firstName} {user.lastName}
              </p>
              <p className="text-xs text-secondary-500">{user.email}</p>
            </motion.div>
          )}
          <button
            onClick={logout}
            className={cn(
              'flex items-center gap-3 w-full px-4 py-3 rounded-lg transition-all duration-200',
              'hover:bg-blue-50 text-secondary-600 hover:text-primary-600 hover:translate-x-1 border border-blue-200',
              !isOpen && 'justify-center'
            )}
          >
            <LogOut className="w-5 h-5" />
            {isOpen && <span className="font-medium">Logout</span>}
          </button>
        </div>
      </div>
    </motion.aside>
  )
}

export default Sidebar
