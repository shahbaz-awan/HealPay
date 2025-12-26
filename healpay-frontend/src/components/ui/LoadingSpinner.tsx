import { motion } from 'framer-motion'
import { Loader2 } from 'lucide-react'
import { cn } from '@/utils/cn'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  text?: string
}

const LoadingSpinner = ({ size = 'md', className, text }: LoadingSpinnerProps) => {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
  }

  return (
    <div className={cn('flex flex-col items-center justify-center gap-3', className)}>
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
      >
        <Loader2 className={cn('text-blue-600', sizes[size])} />
      </motion.div>
      {text && <p className="text-sm text-gray-600">{text}</p>}
    </div>
  )
}

export default LoadingSpinner

// Full page loading spinner
export const FullPageLoader = ({ text = 'Loading...' }: { text?: string }) => {
  return (
    <div className="fixed inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="text-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="inline-block"
        >
          <Loader2 className="w-16 h-16 text-blue-600" />
        </motion.div>
        <p className="mt-4 text-lg font-medium text-gray-700">{text}</p>
      </div>
    </div>
  )
}

