'use client'

import { LucideIcon } from 'lucide-react'

interface FilterBarProps {
  title: string
  icon?: LucideIcon
  children: React.ReactNode
  activeFilters?: Array<{ id: string; label: string; onClear?: () => void }>
  onClearAll?: () => void
  clearAllLabel?: string
}

export default function FilterBar({
  title,
  icon: Icon,
  children,
  activeFilters,
  onClearAll,
  clearAllLabel = 'Alle Filter zurücksetzen',
}: FilterBarProps) {
  return (
    <div className="bg-white/[0.07] backdrop-blur-xl rounded-xl p-4 border border-white/[0.08]">
      <div className="flex items-center gap-2 mb-4">
        {Icon && <Icon className="w-5 h-5 text-ocean-light" />}
        <span className="text-white font-semibold">{title}</span>
      </div>
      {activeFilters && activeFilters.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 mb-3">
          {activeFilters.map((filter) => (
            <button
              key={filter.id}
              type="button"
              onClick={filter.onClear}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/[0.07] text-xs text-white/60 border border-white/[0.10] hover:text-white hover:border-white/30 transition-colors"
            >
              {filter.label}
              {filter.onClear ? <span className="text-xs">×</span> : null}
            </button>
          ))}
          {onClearAll && (
            <button
              type="button"
              onClick={onClearAll}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/[0.14] text-xs text-white border border-white/[0.20] hover:bg-white/[0.22] transition-colors"
            >
              {clearAllLabel}
            </button>
          )}
        </div>
      )}
      {children}
    </div>
  )
}
