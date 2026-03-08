import { HTMLAttributes, forwardRef } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/utils/cn'
import type React from 'react'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'glass' | 'gradient' | 'hover'
  noPadding?: boolean
}

const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = 'default', noPadding = false, children, ...props }, ref) => {
    const variants = {
      default: 'bg-white dark:bg-gray-800 border border-blue-100 dark:border-gray-700 shadow-lg',
      glass: 'glass dark:bg-gray-800/80 backdrop-blur-lg border-blue-200/50 dark:border-gray-600/50',
      gradient: 'bg-gradient-to-br from-white to-blue-50 dark:from-gray-800 dark:to-gray-700 border border-blue-100 dark:border-gray-700',
      hover: 'bg-white dark:bg-gray-800 border border-blue-100 dark:border-gray-700 shadow-lg hover:shadow-glow hover:border-blue-300 dark:hover:border-gray-500 hover-card cursor-pointer transition-all',
    }

    return (
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className={cn(
          'rounded-xl transition-all duration-300',
          variants[variant],
          !noPadding && 'p-6',
          className
        )}
        {...(props as any)}
      >
        {children}
      </motion.div>
    )
  }
)

Card.displayName = 'Card'

export default Card

// Card Header Component
interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {
  title?: string
  subtitle?: string
  action?: React.ReactNode
  icon?: React.ReactNode
}

export const CardHeader = forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className, title, subtitle, action, icon, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('flex items-start justify-between mb-4', className)}
        {...props}
      >
        <div className="flex items-center gap-3 flex-1">
          {icon && <div className="flex-shrink-0">{icon}</div>}
          <div className="flex-1">
            {title && <h3 className="text-lg font-semibold text-secondary-900 dark:text-gray-100">{title}</h3>}
            {subtitle && <p className="text-sm text-secondary-500 dark:text-gray-400 mt-1">{subtitle}</p>}
            {children}
          </div>
        </div>
        {action && <div className="ml-4">{action}</div>}
      </div>
    )
  }
)

CardHeader.displayName = 'CardHeader'

// Card Body Component
export const CardBody = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    return <div ref={ref} className={cn('', className)} {...props} />
  }
)

CardBody.displayName = 'CardBody'

// Card Footer Component
export const CardFooter = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('mt-4 pt-4 border-t border-blue-100', className)}
        {...props}
      />
    )
  }
)

CardFooter.displayName = 'CardFooter'
