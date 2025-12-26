import { motion } from 'framer-motion'
import { Menu, Bell, Search, Sun, Moon } from 'lucide-react'
import { useState } from 'react'
import { useAuthStore } from '@/store/authStore'
import Button from '@/components/ui/Button'

interface HeaderProps {
  onMenuClick: () => void
}

const Header = ({ onMenuClick }: HeaderProps) => {
  const { user } = useAuthStore()
  const [darkMode, setDarkMode] = useState(false)
  const [notifications] = useState(3)

  return (
    <header className="sticky top-0 z-40 backdrop-blur-lg bg-white/90 border-b border-blue-200">
      <div className="flex items-center justify-between px-6 py-4">
        {/* Left side */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={onMenuClick}
            className="hover:scale-110"
          >
            <Menu className="w-5 h-5" />
          </Button>

          {/* Search */}
          <motion.div
            initial={{ width: 200 }}
            whileFocus={{ width: 300 }}
            className="relative hidden md:block"
          >
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-400" />
            <input
              type="text"
              placeholder="Search..."
              className="pl-10 pr-4 py-2 bg-white border border-blue-200 text-secondary-900 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all hover:shadow-md placeholder:text-secondary-400"
            />
          </motion.div>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-4">
          {/* Theme Toggle */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setDarkMode(!darkMode)}
            className="p-2 rounded-lg hover:bg-blue-50 transition-colors"
          >
            {darkMode ? (
              <Sun className="w-5 h-5 text-primary-600" />
            ) : (
              <Moon className="w-5 h-5 text-primary-600" />
            )}
          </motion.button>

          {/* Notifications */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            className="relative p-2 rounded-lg hover:bg-blue-50 transition-colors"
          >
            <Bell className="w-5 h-5 text-primary-600" />
            {notifications > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-1 -right-1 w-5 h-5 bg-primary-600 text-white text-xs rounded-full flex items-center justify-center animate-pulse-glow font-bold"
              >
                {notifications}
              </motion.span>
            )}
          </motion.button>

          {/* User Avatar */}
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="flex items-center gap-3 p-2 rounded-lg hover:bg-blue-50 cursor-pointer transition-colors"
          >
            <div className="w-10 h-10 bg-gradient-to-br from-primary-600 to-primary-700 rounded-full flex items-center justify-center text-white font-semibold shadow-lg shadow-blue-300">
              {user?.firstName?.[0]}
              {user?.lastName?.[0]}
            </div>
            <div className="hidden lg:block">
              <p className="text-sm font-semibold text-secondary-900">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-xs text-secondary-500 capitalize">{user?.role.toLowerCase()}</p>
            </div>
          </motion.div>
        </div>
      </div>
    </header>
  )
}

export default Header
