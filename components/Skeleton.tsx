/** Animated shimmer placeholder for loading states */
export default function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div
      className={`bg-ocean-light/10 rounded animate-pulse ${className}`}
    />
  )
}

/** Full-width card skeleton matching a social feed card */
export function SocialCardSkeleton() {
  return (
    <div className="bg-ocean/30 backdrop-blur-sm rounded-xl overflow-hidden">
      <Skeleton className="h-56 w-full rounded-none" />
      <div className="p-5 space-y-3">
        <div className="flex items-center gap-2">
          <Skeleton className="w-7 h-7 rounded-full flex-shrink-0" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-3 w-16 ml-2" />
        </div>
        <Skeleton className="h-6 w-32" />
        <div className="grid grid-cols-2 gap-3">
          <Skeleton className="h-12 rounded" />
          <Skeleton className="h-12 rounded" />
        </div>
        <div className="flex gap-4 pt-4 border-t border-ocean-light/20">
          <Skeleton className="h-5 w-12" />
          <Skeleton className="h-5 w-12" />
        </div>
      </div>
    </div>
  )
}

/** Catch list row skeleton */
export function CatchRowSkeleton() {
  return (
    <div className="flex items-center gap-4 bg-ocean-dark/50 rounded-lg p-4">
      <Skeleton className="w-16 h-16 rounded-lg flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-3 w-20" />
      </div>
      <div className="space-y-2 text-right">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-3 w-12" />
      </div>
    </div>
  )
}

/** Dashboard stats block skeleton */
export function DashboardStatsSkeleton() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="bg-ocean/30 backdrop-blur-sm rounded-lg p-6 space-y-2">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-8 w-12" />
          <Skeleton className="h-3 w-10" />
        </div>
      ))}
    </div>
  )
}
