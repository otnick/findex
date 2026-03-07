'use client'

import { useMemo } from 'react'

interface Props {
  children: React.ReactNode
  isLegendary?: boolean
  enabled?: boolean
  className?: string
}

export default function HolographicCard({ children, isLegendary, enabled = true, className }: Props) {
  // Each card instance gets its own random timing so they don't all animate in sync.
  // Negative delay starts the animation at a random point mid-cycle.
  const { duration, delay } = useMemo(() => {
    const base = isLegendary ? 18 : 22
    const dur = base + (Math.random() * 12 - 6) // ±6s
    return { duration: dur, delay: -(Math.random() * dur) }
  }, [isLegendary])

  if (!enabled) return <>{children}</>

  return (
    <div className={className} style={{ position: 'relative', borderRadius: '0.75rem', overflow: 'hidden' }}>
      {children}
      <div
        aria-hidden
        className={isLegendary ? 'holo-legendary' : 'holo-shiny'}
        style={{ animationDuration: `${duration.toFixed(1)}s`, animationDelay: `${delay.toFixed(1)}s` }}
      />
    </div>
  )
}
