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
    <div className="bg-white/[0.07] backdrop-blur-xl border border-white/[0.10] rounded-xl p-12 text-center animate-fade-in">
      <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-white/[0.08] border border-white/[0.10] mb-6">
        <Icon className="w-10 h-10 text-ocean-light" />
      </div>
      <h3 className="text-2xl font-bold text-white mb-2">{title}</h3>
      <p className="text-ocean-light mb-6 max-w-md mx-auto">{description}</p>
      {(actionLabel && (actionHref || onAction)) && (
        <>
          {actionHref ? (
            <Link
              href={actionHref}
              className="inline-flex items-center gap-2 bg-white/[0.10] hover:bg-white/[0.18] border border-white/[0.15] text-white font-semibold py-3 px-8 rounded-lg transition-all"
            >
              {actionLabel}
            </Link>
          ) : (
            <button
              onClick={onAction}
              className="inline-flex items-center gap-2 bg-white/[0.10] hover:bg-white/[0.18] border border-white/[0.15] text-white font-semibold py-3 px-8 rounded-lg transition-all"
            >
              {actionLabel}
            </button>
          )}
        </>
      )}
    </div>
  )
}
