'use client'

import { useRef, useState, useCallback, useEffect } from 'react'

interface Props {
  children: React.ReactNode
  isLegendary?: boolean
  /** When false, renders children as-is with no effect */
  enabled?: boolean
}

export default function HolographicCard({ children, isLegendary, enabled = true }: Props) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [tiltX, setTiltX] = useState(0)
  const [tiltY, setTiltY] = useState(0)
  const [shimmerX, setShimmerX] = useState(50)
  const [shimmerY, setShimmerY] = useState(50)
  const [isActive, setIsActive] = useState(false)
  const gyroListening = useRef(false)
  const rafRef = useRef<number>(0)

  const applyTilt = useCallback((rx: number, ry: number) => {
    cancelAnimationFrame(rafRef.current)
    rafRef.current = requestAnimationFrame(() => {
      setTiltX(rx)
      setTiltY(ry)
      // shimmer moves opposite to tilt — like light reflecting off foil
      setShimmerX(50 - ry * 2.5)
      setShimmerY(50 + rx * 2.5)
      setIsActive(true)
    })
  }, [])

  const handleOrientation = useCallback(
    (e: DeviceOrientationEvent) => {
      const gamma = Math.max(-30, Math.min(30, e.gamma ?? 0)) // left/right
      const beta = Math.max(-30, Math.min(30, (e.beta ?? 40) - 40)) // front/back, offset by 40° rest angle
      applyTilt(beta * 0.4, gamma * 0.5)
    },
    [applyTilt],
  )

  // Start listening to gyroscope. On Android / desktop it works immediately.
  // On iOS 13+ we need a user gesture to call requestPermission first.
  const startGyro = useCallback(() => {
    if (gyroListening.current) return
    gyroListening.current = true
    window.addEventListener('deviceorientation', handleOrientation, { passive: true })
  }, [handleOrientation])

  const requestGyroPermission = useCallback(async () => {
    const DOE = DeviceOrientationEvent as any
    if (typeof DOE?.requestPermission === 'function') {
      try {
        const result = await DOE.requestPermission()
        if (result === 'granted') startGyro()
      } catch {
        // user declined or gesture not valid — mouse fallback still works
      }
    } else {
      startGyro()
    }
  }, [startGyro])

  useEffect(() => {
    if (!enabled) return
    // Try without permission (Android, desktop) — silently ignored on iOS 13+ until granted
    startGyro()
    return () => {
      window.removeEventListener('deviceorientation', handleOrientation)
      cancelAnimationFrame(rafRef.current)
    }
  }, [enabled, startGyro, handleOrientation])

  // ── Mouse fallback for desktop ──────────────────────────────────────────────
  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const card = cardRef.current
      if (!card) return
      const r = card.getBoundingClientRect()
      const ry = ((e.clientX - r.left - r.width / 2) / (r.width / 2)) * 12
      const rx = -((e.clientY - r.top - r.height / 2) / (r.height / 2)) * 8
      applyTilt(rx, ry)
    },
    [applyTilt],
  )

  const handleMouseLeave = useCallback(() => {
    cancelAnimationFrame(rafRef.current)
    setTiltX(0)
    setTiltY(0)
    setShimmerX(50)
    setShimmerY(50)
    setIsActive(false)
  }, [])

  if (!enabled) return <>{children}</>

  const sx = Math.max(10, Math.min(90, shimmerX))
  const sy = Math.max(10, Math.min(90, shimmerY))

  const shimmerGradient = isLegendary
    ? `radial-gradient(ellipse 85% 75% at ${sx}% ${sy}%, rgba(56,189,248,0.32) 0%, rgba(217,70,239,0.24) 28%, rgba(245,158,11,0.18) 52%, rgba(34,197,94,0.16) 72%, transparent 95%)`
    : `radial-gradient(ellipse 80% 70% at ${sx}% ${sy}%, rgba(250,204,21,0.32) 0%, rgba(253,186,116,0.22) 38%, rgba(255,255,255,0.1) 62%, transparent 90%)`

  return (
    <div
      ref={cardRef}
      style={{
        position: 'relative',
        transform: isActive
          ? `perspective(600px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) scale3d(1.015,1.015,1.015)`
          : undefined,
        transition: 'transform 0.12s ease-out',
        willChange: 'transform',
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onTouchStart={requestGyroPermission}
    >
      {children}
      {/* Holographic foil shimmer */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: '0.75rem',
          background: shimmerGradient,
          opacity: isActive ? 1 : 0,
          transition: 'opacity 0.25s ease',
          pointerEvents: 'none',
          mixBlendMode: 'screen',
          zIndex: 20,
        }}
      />
    </div>
  )
}
