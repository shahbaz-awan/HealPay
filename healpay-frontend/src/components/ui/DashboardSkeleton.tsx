/**
 * DashboardSkeleton — animated placeholder shown while dashboard data loads.
 * Use: replace the spinner/loading UI in dashboard pages with <DashboardSkeleton />.
 * StatCardSkeleton can be used individually for inline stat card placeholders.
 */

/** Single pulsing block */
export const Skeleton = ({
    className = '',
}: {
    className?: string
}) => (
    <div className={`animate-pulse bg-gray-200 dark:bg-gray-700 rounded ${className}`} />
)

/** Stat card skeleton — matches the 4-column stat card layout used across dashboards */
export const StatCardSkeleton = () => (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-6 shadow-sm relative overflow-hidden">
        <div className="flex items-center justify-between">
            <div className="flex-1 space-y-3">
                <Skeleton className="h-3 w-28" />
                <Skeleton className="h-8 w-20" />
                <Skeleton className="h-3 w-32" />
            </div>
            <Skeleton className="w-14 h-14 rounded-xl flex-shrink-0" />
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-100 dark:bg-gray-700 animate-pulse" />
    </div>
)

/** Row skeleton for table rows */
export const TableRowSkeleton = ({ cols = 5 }: { cols?: number }) => (
    <tr>
        {Array.from({ length: cols }).map((_, i) => (
            <td key={i} className="p-4">
                <Skeleton className="h-4 w-full" />
            </td>
        ))}
    </tr>
)

/** Full dashboard skeleton: 4 stat cards + 2 content panels */
const DashboardSkeleton = ({ statCount = 4, title = 'Loading…' }: { statCount?: number; title?: string }) => (
    <div className="space-y-6 animate-pulse">
        {/* Page header */}
        <div className="flex items-center justify-between">
            <div className="space-y-2">
                <div className="h-8 w-56 bg-gray-200 dark:bg-gray-700 rounded" />
                <div className="h-4 w-40 bg-gray-200 dark:bg-gray-700 rounded" />
            </div>
            <div className="h-10 w-32 bg-gray-200 dark:bg-gray-700 rounded-lg" />
        </div>

        {/* Stat cards row */}
        <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-${statCount} gap-6`}>
            {Array.from({ length: statCount }).map((_, i) => (
                <StatCardSkeleton key={i} />
            ))}
        </div>

        {/* Content panels */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-6 shadow-sm">
                    <div className="h-5 w-32 bg-gray-200 dark:bg-gray-700 rounded mb-4" />
                    <div className="space-y-3">
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="h-12 bg-gray-100 dark:bg-gray-700/50 rounded-lg" />
                        ))}
                    </div>
                </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-6 shadow-sm">
                <div className="h-5 w-28 bg-gray-200 dark:bg-gray-700 rounded mb-4" />
                <div className="space-y-3">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="h-10 bg-gray-100 dark:bg-gray-700/50 rounded-lg" />
                    ))}
                </div>
            </div>
        </div>
    </div>
)

export default DashboardSkeleton
