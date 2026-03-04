'use client'

interface Props {
  children: React.ReactNode
  isLegendary?: boolean
  enabled?: boolean
  /** @deprecated no longer used */
  shimmerOnly?: boolean
}

export default function HolographicCard({ children, isLegendary, enabled = true }: Props) {
  if (!enabled) return <>{children}</>

  return (
    <div style={{ position: 'relative' }}>
      {children}
      <div aria-hidden className={isLegendary ? 'holo-legendary' : 'holo-shiny'} />
    </div>
  )
}
