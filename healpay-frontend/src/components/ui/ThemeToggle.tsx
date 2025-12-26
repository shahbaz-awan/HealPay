import { Moon, Sun } from 'lucide-react'
import { useTheme } from '@/contexts/ThemeContext'
import { motion } from 'framer-motion'

const ThemeToggle = () => {
    const { theme, toggleTheme } = useTheme()

    return (
        <button
            onClick={toggleTheme}
            className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label="Toggle theme"
        >
            <motion.div
                initial={false}
                animate={{ rotate: theme === 'dark' ? 180 : 0 }}
                transition={{ duration: 0.3 }}
            >
                {theme === 'light' ? (
                    <Moon className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                ) : (
                    <Sun className="w-5 h-5 text-yellow-500" />
                )}
            </motion.div>
        </button>
    )
}

export default ThemeToggle
