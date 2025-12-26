import Skeleton, {
    CardSkeleton,
    TableRowSkeleton,
    StatsCardSkeleton,
    ListItemSkeleton,
    DashboardSkeleton,
    FormSkeleton
} from '@/components/ui/Skeleton'

// Example usage component
const LoadingExample = () => {
    return (
        <div className="space-y-8 p-6">
            {/* Dashboard Loading */}
            <div>
                <h2 className="text-2xl font-bold mb-4">Dashboard Loading</h2>
                <DashboardSkeleton />
            </div>

            {/* Individual Components */}
            <div className="grid grid-cols-3 gap-4">
                <div>
                    <h3 className="text-lg font-semibold mb-2">Stats Card</h3>
                    <StatsCardSkeleton />
                </div>
                <div>
                    <h3 className="text-lg font-semibold mb-2">Card</h3>
                    <CardSkeleton />
                </div>
                <div>
                    <h3 className="text-lg font-semibold mb-2">List Item</h3>
                    <ListItemSkeleton />
                </div>
            </div>

            {/* Table Loading */}
            <div>
                <h2 className="text-2xl font-bold mb-4">Table Loading</h2>
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                    {[1, 2, 3, 4, 5].map(i => (
                        <TableRowSkeleton key={i} />
                    ))}
                </div>
            </div>

            {/* Form Loading */}
            <div>
                <h2 className="text-2xl font-bold mb-4">Form Loading</h2>
                <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
                    <FormSkeleton />
                </div>
            </div>

            {/* Custom Skeleton */}
            <div>
                <h2 className="text-2xl font-bold mb-4">Custom Skeletons</h2>
                <div className="space-y-4">
                    <Skeleton width="60%" height="24px" />
                    <Skeleton width="80%" height="16px" />
                    <Skeleton width="40%" height="16px" />
                    <div className="flex gap-4">
                        <Skeleton variant="circular" width={60} height={60} />
                        <div className="flex-1 space-y-2">
                            <Skeleton height="20px" />
                            <Skeleton width="70%" height="16px" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default LoadingExample
