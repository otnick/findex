'use client'

import { ReactNode, useEffect, useRef } from 'react'
import { useRouter, usePathname } from 'next/navigation'
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
  const pathname = usePathname()
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
    closeCatchModal()
  }, [pathname]) // eslint-disable-line react-hooks/exhaustive-deps

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
    <div className="min-h-screen bg-gradient-to-b from-ocean-deeper to-ocean-dark pt-[env(safe-area-inset-top)] relative">
      {/* Ambient color blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-[20%] -left-[10%] w-[70%] h-[55%] rounded-full bg-blue-800/20 blur-[120px]" />
        <div className="absolute top-[25%] -right-[15%] w-[55%] h-[45%] rounded-full bg-cyan-800/15 blur-[110px]" />
        <div className="absolute -bottom-[10%] left-[15%] w-[60%] h-[45%] rounded-full bg-indigo-900/20 blur-[110px]" />
      </div>

      <Navigation />

        {/* Main Content */}
        <main
          className="lg:pl-72 lg:pb-4"
          style={{ paddingBottom: 'calc(5rem + env(safe-area-inset-bottom))' }}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <div className="px-4 sm:px-6 lg:px-8 py-8">{children}</div>
        </main>

        {isCatchModalOpen && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 pb-[calc(env(safe-area-inset-bottom)+5.5rem)] sm:pb-4">
            <div
              className="absolute inset-0 bg-black/50 backdrop-blur-md animate-catchOverlayIn"
              onClick={closeCatchModal}
            />
            <div
              data-catch-modal-sheet="true"
              className="relative w-full max-w-none sm:max-w-2xl max-h-[72dvh] sm:max-h-[80dvh] flex flex-col bg-white/[0.09] backdrop-blur-3xl border border-white/[0.15] rounded-3xl shadow-2xl shadow-black/40 animate-catchModalIn overflow-hidden"
            >
              {/* Prismatic top edge highlight */}
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/50 to-transparent pointer-events-none z-10" />
              {/* Drag handle (mobile) */}
              <div className="flex justify-center pt-3 pb-1 shrink-0 sm:hidden">
                <div className="w-10 h-1 rounded-full bg-white/20" />
              </div>
              <div className="flex items-center justify-between px-5 pt-3 pb-4 sm:px-6 sm:pt-5 shrink-0">
                <h2 className="text-xl font-bold text-white">Neuen Fang hinzufügen</h2>
                <button
                  onClick={closeCatchModal}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-white/[0.10] hover:bg-white/[0.20] text-white/60 hover:text-white transition-colors shrink-0"
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
