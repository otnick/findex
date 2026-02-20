'use client'

import { ReactNode, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import CatchForm from '@/components/CatchForm'
import { useCatchStore } from '@/lib/store'
import Navigation from './Navigation'

interface MainLayoutProps {
  children: ReactNode
}

export default function MainLayout({ children }: MainLayoutProps) {
  const isCatchModalOpen = useCatchStore((state) => state.isCatchModalOpen)
  const closeCatchModal = useCatchStore((state) => state.closeCatchModal)
  const router = useRouter()
  const touchStartX = useRef(0)
  const touchStartY = useRef(0)

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
    touchStartY.current = e.touches[0].clientY
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    const dx = e.changedTouches[0].clientX - touchStartX.current
    const dy = e.changedTouches[0].clientY - touchStartY.current
    if (Math.abs(dx) < 60 || Math.abs(dx) < Math.abs(dy) * 1.5) return
    // Left-edge back gesture (within 30px of screen edge)
    if (dx > 0 && touchStartX.current < 30) router.back()
  }

  useEffect(() => {
    if (!isCatchModalOpen) return
    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = originalOverflow
    }
  }, [isCatchModalOpen])

  // Android back button: navigate back in history instead of exiting the app
  useEffect(() => {
    const handleBackButton = (e: Event) => {
      e.preventDefault()
      if (window.history.length > 1) {
        window.history.back()
      }
    }
    document.addEventListener('backbutton', handleBackButton, false)
    return () => document.removeEventListener('backbutton', handleBackButton, false)
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-b from-ocean-deeper to-ocean-dark pt-[env(safe-area-inset-top)]">
      <Navigation />

        {/* Main Content */}
        <main
          className="lg:pl-64 pb-20 lg:pb-4"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <div className="px-4 sm:px-6 lg:px-8 py-8">{children}</div>
        </main>

        {isCatchModalOpen && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 pb-[calc(env(safe-area-inset-bottom)+5.5rem)] sm:pb-4">
            <div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-catchOverlayIn"
              onClick={closeCatchModal}
            />
            <div
              data-catch-modal-sheet="true"
              className="relative w-full max-w-none sm:max-w-2xl max-h-[72dvh] sm:max-h-[80dvh] flex flex-col bg-ocean-deeper sm:bg-ocean/30 sm:backdrop-blur-sm rounded-3xl shadow-2xl animate-catchModalIn"
            >
              {/* Drag handle (mobile) */}
              <div className="flex justify-center pt-3 pb-1 shrink-0 sm:hidden">
                <div className="w-10 h-1 rounded-full bg-ocean-light/30" />
              </div>
              <div className="flex items-center justify-between px-5 pt-3 pb-4 sm:px-6 sm:pt-5 shrink-0">
                <h2 className="text-xl font-bold text-white">Neuen Fang hinzufügen</h2>
                <button
                  onClick={closeCatchModal}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-ocean-dark/50 text-ocean-light hover:text-white transition-colors shrink-0"
                  aria-label="Schließen"
                >
                  ×
                </button>
              </div>
              <div className="overflow-x-hidden overflow-y-auto px-5 pb-5 sm:px-6 sm:pb-6">
                <CatchForm onSuccess={closeCatchModal} embeddedFlow />
              </div>
            </div>
          </div>
        )}
    </div>
  )
}
