'use client'

import { useEffect, ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import MainLayout from '@/components/layout/MainLayout'
import { useCatchStore } from '@/lib/store'

function handleAppUrl(url: string, router: ReturnType<typeof useRouter>) {
  try {
    // findex://catch/123  →  /catch/123
    // findex://user/abc   →  /user/abc
    const parsed = new URL(url)
    const path = '/' + parsed.host + (parsed.pathname !== '/' ? parsed.pathname : '')
    router.push(path)
  } catch { /* invalid URL */ }
}

export default function AppLayout({ children }: { children: ReactNode }) {
  const user = useCatchStore((state) => state.user)
  const authLoading = useCatchStore((state) => state.authLoading)
  const router = useRouter()

  useEffect(() => {
    if (!authLoading && user === null) {
      router.push('/')
    }
  }, [user, authLoading, router])

  // Handle deep links opened via findex:// URL scheme
  useEffect(() => {
    const cap = (window as any).Capacitor
    if (!cap?.isNativePlatform?.()) return
    let handle: { remove: () => void } | null = null
    import('@capacitor/app').then(({ App }) => {
      App.addListener('appUrlOpen', ({ url }: { url: string }) => {
        handleAppUrl(url, router)
      }).then((h: { remove: () => void }) => { handle = h })
    }).catch(() => {})
    return () => { handle?.remove() }
  }, [router])

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-ocean-deeper to-ocean-dark" />
    )
  }

  return <MainLayout>{children}</MainLayout>
}
