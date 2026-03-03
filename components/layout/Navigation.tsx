'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { useState, useEffect, useRef } from 'react'
import { useCatchStore } from '@/lib/store'
import {
  Home,
  Fish,
  Users,
  UserCircle,
  Settings,
  X,
  BookOpen,
  Plus,
  Menu,
  Loader2,
  Map,
} from 'lucide-react'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: Home },
  { name: 'Fänge', href: '/catches', icon: Fish },
  { name: 'FinDex', href: '/fishdex', icon: BookOpen },
  { name: 'Karte', href: '/map', icon: Map },
  { name: 'Social', href: '/social', icon: Users },
  { name: 'Profil', href: '/profile', icon: UserCircle },
]

export default function Navigation() {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const isCatchModalOpen = useCatchStore((state) => state.isCatchModalOpen)
  const isAiAnalyzing = useCatchStore((state) => state.isAiAnalyzing)
  const toggleCatchModal = useCatchStore((state) => state.toggleCatchModal)
  const sheetRef = useRef<HTMLDivElement>(null)
  const dragStartY = useRef(0)
  const [dragY, setDragY] = useState(0)
  const isDragging = useRef(false)

  // Non-passive touchmove listener: prevent page scroll when menu is open,
  // but allow scroll inside the sheet itself.
  useEffect(() => {
    if (!mobileMenuOpen) return
    setDragY(0)
    document.documentElement.style.overflow = 'hidden'
    const prevent = (e: TouchEvent) => {
      if (sheetRef.current?.contains(e.target as Node)) return
      e.preventDefault()
    }
    document.addEventListener('touchmove', prevent, { passive: false })
    return () => {
      document.documentElement.style.overflow = ''
      document.removeEventListener('touchmove', prevent)
    }
  }, [mobileMenuOpen])

  const handleSheetTouchStart = (e: React.TouchEvent) => {
    // Only allow drag-to-close when sheet is scrolled to top
    if (sheetRef.current && sheetRef.current.scrollTop > 4) return
    dragStartY.current = e.touches[0].clientY
    isDragging.current = true
  }

  const handleSheetTouchMove = (e: React.TouchEvent) => {
    if (!isDragging.current) return
    const dy = e.touches[0].clientY - dragStartY.current
    if (dy > 0) setDragY(dy)
  }

  const handleSheetTouchEnd = () => {
    isDragging.current = false
    if (dragY > 80) {
      setMobileMenuOpen(false)
    } else {
      setDragY(0)
    }
  }

  return (
    <>
      {/* Desktop Sidebar */}
      <nav className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:top-4 lg:bottom-4 lg:left-4 bg-white/[0.07] backdrop-blur-2xl border border-white/[0.12] rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex-1 flex flex-col min-h-0 pt-8 pb-4">
          {/* Logo */}
          <div className="flex items-center flex-shrink-0 px-6 mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl overflow-hidden shadow-lg">
                <Image src="/icon-512x512.png" alt="FinDex" width={40} height={40} className="w-full h-full object-cover" />
              </div>
              <span className="text-2xl font-bold text-white">FinDex</span>
            </div>
          </div>

          {/* Nav Items */}
          <div className="flex-1 flex flex-col overflow-y-scroll overscroll-contain px-3 space-y-1" style={{ WebkitOverflowScrolling: 'touch' }}>
            {navigation.map((item) => {
              const isActive = pathname === item.href
              const Icon = item.icon
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`
                    group flex items-center gap-3 px-3 py-3 text-sm font-medium rounded-xl transition-all duration-200
                    ${isActive
                      ? 'bg-white/[0.15] text-white shadow-sm ring-1 ring-white/20'
                      : 'text-ocean-light hover:text-white hover:bg-white/[0.08]'
                    }
                  `}
                >
                  <Icon className={`w-5 h-5 ${isActive ? 'text-ocean-light' : ''}`} />
                  <span>{item.name}</span>
                  {isActive && (
                    <div className="ml-auto w-1.5 h-1.5 rounded-full bg-ocean-light animate-pulse" />
                  )}
                </Link>
              )
            })}
          </div>

          {/* Settings pinned at bottom */}
          <div className="px-3 pt-2 pb-2 border-t border-white/[0.08]">
            <Link
              href="/settings"
              className={`
                group flex items-center gap-3 px-3 py-3 text-sm font-medium rounded-xl transition-all duration-200
                ${pathname === '/settings'
                  ? 'bg-white/[0.15] text-white shadow-sm ring-1 ring-white/20'
                  : 'text-ocean-light hover:text-white hover:bg-white/[0.08]'
                }
              `}
            >
              <Settings className="w-5 h-5" />
              <span>Einstellungen</span>
            </Link>
          </div>
        </div>
      </nav>

      {/* Mobile Bottom Nav */}
      <div
        className="lg:hidden fixed inset-x-4 bg-white/[0.09] backdrop-blur-2xl border border-white/[0.14] rounded-2xl z-[60] shadow-2xl overflow-hidden"
        style={{ bottom: 'calc(env(safe-area-inset-bottom) + 1rem)' }}
      >
        {/* Top edge highlight */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent pointer-events-none" />
        <div className="grid grid-cols-5 items-center h-16 px-1">

          {/* Dashboard */}
          <Link
            href="/dashboard"
            onClick={() => setMobileMenuOpen(false)}
            className="flex flex-col items-center justify-center py-1"
          >
            <div className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all ${pathname === '/dashboard' && !mobileMenuOpen ? 'bg-white/[0.15] text-white' : 'text-ocean-light/70'}`}>
              <Home className="w-5 h-5" />
              <span className="text-[10px] font-medium leading-none">Dashboard</span>
            </div>
          </Link>

          {/* Fänge */}
          <Link
            href="/catches"
            onClick={() => setMobileMenuOpen(false)}
            className="flex flex-col items-center justify-center py-1"
          >
            <div className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all ${pathname === '/catches' && !mobileMenuOpen ? 'bg-white/[0.15] text-white' : 'text-ocean-light/70'}`}>
              <Fish className="w-5 h-5" />
              <span className="text-[10px] font-medium leading-none">Fänge</span>
            </div>
          </Link>

          {/* Center: Fang action */}
          <div className="flex flex-col items-center justify-center gap-0.5">
            <button
              type="button"
              onClick={toggleCatchModal}
              disabled={isAiAnalyzing}
              className="w-11 h-11 rounded-2xl bg-gradient-to-br from-ocean-light to-ocean text-white shadow-lg shadow-ocean/40 flex items-center justify-center ring-1 ring-white/25 transition-all duration-200 active:scale-95"
              aria-label="Neuer Fang"
            >
              {isAiAnalyzing
                ? <Loader2 className="w-5 h-5 animate-spin" />
                : <Plus className={`w-5 h-5 transition-transform duration-200 ${isCatchModalOpen ? 'rotate-45' : ''}`} />
              }
            </button>
          </div>

          {/* FinDex */}
          <Link
            href="/fishdex"
            onClick={() => setMobileMenuOpen(false)}
            className="flex flex-col items-center justify-center py-1"
          >
            <div className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all ${pathname.startsWith('/fishdex') && !mobileMenuOpen ? 'bg-white/[0.15] text-white' : 'text-ocean-light/70'}`}>
              <BookOpen className="w-5 h-5" />
              <span className="text-[10px] font-medium leading-none">FinDex</span>
            </div>
          </Link>

          {/* Menü */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            className="flex flex-col items-center justify-center py-1 w-full"
            aria-label="Navigation öffnen"
          >
            <div className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all ${mobileMenuOpen ? 'bg-white/[0.15] text-white' : 'text-ocean-light/70'}`}>
              <Menu className="w-5 h-5" />
              <span className="text-[10px] font-medium leading-none">Menü</span>
            </div>
          </button>

        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div
            ref={sheetRef}
            className="absolute bottom-0 inset-x-0 bg-white/[0.08] backdrop-blur-3xl border-t border-x border-white/[0.15] rounded-t-3xl shadow-2xl p-6 pb-28 space-y-1.5 max-h-[80vh] overflow-y-scroll overscroll-contain"
            style={{
              WebkitOverflowScrolling: 'touch',
              transform: `translateY(${dragY}px)`,
              transition: isDragging.current ? 'none' : 'transform 0.3s cubic-bezier(0.2,0.8,0.2,1)',
            }}
            onTouchStart={handleSheetTouchStart}
            onTouchMove={handleSheetTouchMove}
            onTouchEnd={handleSheetTouchEnd}
          >
            {/* Top edge highlight */}
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent pointer-events-none" />
            {/* Drag handle */}
            <div className="flex justify-center -mt-2 mb-5">
              <div className="w-10 h-1 rounded-full bg-white/20" />
            </div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xs font-semibold text-white/60 tracking-widest uppercase">Navigation</h2>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 rounded-xl hover:bg-white/[0.08] text-white/50 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            {navigation.map((item) => {
              const isActive = pathname === item.href
              const Icon = item.icon
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`
                    flex items-center gap-3 px-4 py-3.5 text-base font-medium rounded-2xl transition-all
                    ${isActive
                      ? 'bg-white/[0.15] text-white ring-1 ring-white/[0.18]'
                      : 'text-white/70 hover:bg-white/[0.08] hover:text-white'
                    }
                  `}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.name}</span>
                  {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-ocean-light" />}
                </Link>
              )
            })}
            <div className="pt-2 mt-1 border-t border-white/[0.08]">
              <Link
                href="/settings"
                onClick={() => setMobileMenuOpen(false)}
                className={`
                  flex items-center gap-3 px-4 py-3.5 text-base font-medium rounded-2xl transition-all
                  ${pathname === '/settings'
                    ? 'bg-white/[0.15] text-white ring-1 ring-white/[0.18]'
                    : 'text-white/70 hover:bg-white/[0.08] hover:text-white'
                  }
                `}
              >
                <Settings className="w-5 h-5" />
                <span>Einstellungen</span>
                {pathname === '/settings' && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-ocean-light" />}
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
