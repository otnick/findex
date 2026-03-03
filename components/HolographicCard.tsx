'use client'

import { useRef, useState, useCallback, useEffect } from 'react'

interface Props {
  children: React.ReactNode
  isLegendary?: boolean
  /** When false, renders children as-is with no effect */
  enabled?: boolean
  /** Skip the 3D perspective tilt — only move the shimmer gradient */
  shimmerOnly?: boolean
}

// Singleton: gyro permission + listener shared across all HolographicCard instances
const gyroCallbacks = new Set<(e: DeviceOrientationEvent) => void>()
let gyroPermissionState: 'unknown' | 'granted' | 'denied' = 'unknown'

function addGyroCallback(cb: (e: DeviceOrientationEvent) => void) {
  gyroCallbacks.add(cb)
}
function removeGyroCallback(cb: (e: DeviceOrientationEvent) => void) {
  gyroCallbacks.delete(cb)
}

function onOrientation(e: DeviceOrientationEvent) {
  gyroCallbacks.forEach((cb) => cb(e))
}

function startGyroListener() {
  window.addEventListener('deviceorientation', onOrientation, { passive: true })
}

// Called from a user-gesture handler (touchstart)
function requestIOSPermission(): void {
  const DOE = DeviceOrientationEvent as any
  if (typeof DOE?.requestPermission !== 'function') {
    // Android / desktop — just ensure listener is running
    if (gyroPermissionState === 'unknown') {
      gyroPermissionState = 'granted'
      startGyroListener()
    }
    return
  }
  if (gyroPermissionState !== 'unknown') return // already handled

  // Call synchronously inside the user gesture so iOS accepts it
  DOE.requestPermission()
    .then((result: string) => {
      if (result === 'granted') {
        gyroPermissionState = 'granted'
        // Listener must be added AFTER permission is granted on iOS
        startGyroListener()
      } else {
        gyroPermissionState = 'denied'
      }
    })
    .catch(() => {
      gyroPermissionState = 'denied'
    })
}

export default function HolographicCard({
  children,
  isLegendary,
  enabled = true,
  shimmerOnly = false,
}: Props) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [tiltX, setTiltX] = useState(0)
  const [tiltY, setTiltY] = useState(0)
  const [shimmerX, setShimmerX] = useState(50)
  const [shimmerY, setShimmerY] = useState(50)
  const [isActive, setIsActive] = useState(false)
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
      const gamma = Math.max(-30, Math.min(30, e.gamma ?? 0))
      const beta = Math.max(-30, Math.min(30, (e.beta ?? 40) - 40))
      applyTilt(beta * 0.4, gamma * 0.5)
    },
    [applyTilt],
  )

  useEffect(() => {
    if (!enabled) return

    // Android/desktop: auto-start without needing a gesture
    const DOE = DeviceOrientationEvent as any
    if (typeof DOE?.requestPermission !== 'function' && gyroPermissionState === 'unknown') {
      gyroPermissionState = 'granted'
      startGyroListener()
    }

    addGyroCallback(handleOrientation)
    return () => {
      removeGyroCallback(handleOrientation)
      cancelAnimationFrame(rafRef.current)
    }
  }, [enabled, handleOrientation])

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
    ? `radial-gradient(ellipse 85% 75% at ${sx}% ${sy}%, rgba(56,189,248,0.38) 0%, rgba(217,70,239,0.28) 28%, rgba(245,158,11,0.22) 52%, rgba(34,197,94,0.18) 72%, transparent 95%)`
    : `radial-gradient(ellipse 80% 70% at ${sx}% ${sy}%, rgba(250,204,21,0.36) 0%, rgba(253,186,116,0.24) 38%, rgba(255,255,255,0.12) 62%, transparent 90%)`

  return (
    <div
      ref={cardRef}
      style={{
        position: 'relative',
        transform:
          !shimmerOnly && isActive
            ? `perspective(600px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) scale3d(1.015,1.015,1.015)`
            : undefined,
        transition: 'transform 0.12s ease-out',
        willChange: 'transform',
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onTouchStart={requestIOSPermission}
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
