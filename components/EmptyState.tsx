import { LucideIcon } from 'lucide-react'
import Link from 'next/link'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
  actionLabel?: string
  actionHref?: string
  onAction?: () => void
}

export default function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
}: EmptyStateProps) {
  return (
    <div className="bg-ocean/30 backdrop-blur-sm rounded-xl p-12 text-center animate-fade-in">
      <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-ocean-light/20 to-ocean/20 mb-6">
        <Icon className="w-10 h-10 text-ocean-light" />
      </div>
      <h3 className="text-2xl font-bold text-white mb-2">{title}</h3>
      <p className="text-ocean-light mb-6 max-w-md mx-auto">{description}</p>
      {(actionLabel && (actionHref || onAction)) && (
        <>
          {actionHref ? (
            <Link
              href={actionHref}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-ocean-light to-ocean hover:from-ocean hover:to-ocean-dark text-white font-semibold py-3 px-8 rounded-lg transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              {actionLabel}
            </Link>
          ) : (
            <button
              onClick={onAction}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-ocean-light to-ocean hover:from-ocean hover:to-ocean-dark text-white font-semibold py-3 px-8 rounded-lg transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              {actionLabel}
            </button>
          )}
        </>
      )}
    </div>
  )
}
