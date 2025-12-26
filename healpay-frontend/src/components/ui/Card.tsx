import { HTMLAttributes, forwardRef } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/utils/cn'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'glass' | 'gradient' | 'hover'
  noPadding?: boolean
}

const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = 'default', noPadding = false, children, ...props }, ref) => {
    const variants = {
      default: 'bg-white border border-blue-100 shadow-lg',
      glass: 'glass backdrop-blur-lg border-blue-200/50',
      gradient: 'bg-gradient-to-br from-white to-blue-50 border border-blue-100',
      hover: 'bg-white border border-blue-100 shadow-lg hover:shadow-glow hover:border-blue-300 hover-card cursor-pointer transition-all',
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
        {...props}
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
}

export const CardHeader = forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className, title, subtitle, action, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('flex items-start justify-between mb-4', className)}
        {...props}
      >
        <div className="flex-1">
          {title && <h3 className="text-lg font-semibold text-secondary-900">{title}</h3>}
          {subtitle && <p className="text-sm text-secondary-500 mt-1">{subtitle}</p>}
          {children}
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
