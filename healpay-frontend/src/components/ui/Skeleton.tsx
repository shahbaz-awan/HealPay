import { motion } from 'framer-motion'

interface SkeletonProps {
    className?: string
    width?: string | number
    height?: string | number
    variant?: 'text' | 'circular' | 'rectangular'
    animation?: 'pulse' | 'wave'
}

const Skeleton = ({
    className = '',
    width = '100%',
    height = '1rem',
    variant = 'rectangular',
    animation = 'wave'
}: SkeletonProps) => {
    const baseClasses = 'bg-gray-200 dark:bg-gray-700'

    const variantClasses = {
        text: 'rounded',
        circular: 'rounded-full',
        rectangular: 'rounded-lg'
    }

    const animationClasses = {
        pulse: 'animate-pulse',
        wave: 'animate-shimmer bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 bg-[length:200%_100%]'
    }

    const style = {
        width: typeof width === 'number' ? `${width}px` : width,
        height: typeof height === 'number' ? `${height}px` : height,
    }

    return (
        <div
            className={`${baseClasses} ${variantClasses[variant]} ${animationClasses[animation]} ${className}`}
            style={style}
        />
    )
}

// Card Skeleton for dashboard cards
export const CardSkeleton = () => (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <div className="space-y-4">
            <Skeleton height="24px" width="60%" />
            <Skeleton height="32px" width="40%" />
            <Skeleton height="16px" width="80%" />
        </div>
    </div>
)

// Table Row Skeleton
export const TableRowSkeleton = () => (
    <div className="flex items-center gap-4 p-4 border-b border-gray-200 dark:border-gray-700">
        <Skeleton variant="circular" width={40} height={40} />
        <div className="flex-1 space-y-2">
            <Skeleton height="16px" width="70%" />
            <Skeleton height="14px" width="40%" />
        </div>
        <Skeleton height="20px" width="80px" />
    </div>
)

// Stats Card Skeleton
export const StatsCardSkeleton = () => (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
            <div className="flex-1 space-y-3">
                <Skeleton height="14px" width="60%" />
                <Skeleton height="32px" width="40%" />
                <Skeleton height="12px" width="70%" />
            </div>
            <Skeleton variant="circular" width={56} height={56} />
        </div>
    </div>
)

// List Item Skeleton
export const ListItemSkeleton = () => (
    <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <div className="flex items-start gap-3">
            <Skeleton variant="circular" width={40} height={40} />
            <div className="flex-1 space-y-2">
                <Skeleton height="16px" width="80%" />
                <Skeleton height="14px" width="60%" />
                <Skeleton height="12px" width="40%" />
            </div>
        </div>
    </div>
)

// Dashboard Skeleton - Full page
export const DashboardSkeleton = () => (
    <div className="space-y-6">
        {/* Header */}
        <div className="space-y-2">
            <Skeleton height="32px" width="30%" />
            <Skeleton height="16px" width="50%" />
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map(i => (
                <StatsCardSkeleton key={i} />
            ))}
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
                <CardSkeleton />
                <CardSkeleton />
            </div>
            <div className="space-y-4">
                <CardSkeleton />
            </div>
        </div>
    </div>
)

// Form Skeleton
export const FormSkeleton = () => (
    <div className="space-y-4">
        {[1, 2, 3, 4].map(i => (
            <div key={i} className="space-y-2">
                <Skeleton height="14px" width="20%" />
                <Skeleton height="40px" width="100%" />
            </div>
        ))}
        <Skeleton height="40px" width="120px" />
    </div>
)

export default Skeleton
