export default function LoadingSkeleton({ type = 'card' }: { type?: 'card' | 'list' | 'grid' }) {
  if (type === 'card') {
    return (
      <div className="bg-ocean/30 backdrop-blur-sm rounded-xl overflow-hidden animate-pulse">
        <div className="h-48 bg-ocean-dark" />
        <div className="p-4 space-y-3">
          <div className="h-6 bg-ocean-dark/50 rounded w-3/4" />
          <div className="h-4 bg-ocean-dark/50 rounded w-1/2" />
          <div className="flex gap-2">
            <div className="h-8 bg-ocean-dark/50 rounded flex-1" />
            <div className="h-8 bg-ocean-dark/50 rounded flex-1" />
          </div>
        </div>
      </div>
    )
  }

  if (type === 'list') {
    return (
      <div className="bg-ocean/30 backdrop-blur-sm rounded-xl p-4 animate-pulse">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-ocean-dark/50" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-ocean-dark/50 rounded w-1/3" />
            <div className="h-3 bg-ocean-dark/50 rounded w-1/2" />
          </div>
        </div>
      </div>
    )
  }

  if (type === 'grid') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-ocean/30 backdrop-blur-sm rounded-xl overflow-hidden animate-pulse">
            <div className="h-48 bg-ocean-dark" />
            <div className="p-4 space-y-3">
              <div className="h-6 bg-ocean-dark/50 rounded w-3/4" />
              <div className="h-4 bg-ocean-dark/50 rounded w-1/2" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  return null
}
