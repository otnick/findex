'use client'

import { useEffect, ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import MainLayout from '@/components/layout/MainLayout'
import { useCatchStore } from '@/lib/store'

export default function AppLayout({ children }: { children: ReactNode }) {
  const user = useCatchStore((state) => state.user)
  const authLoading = useCatchStore((state) => state.authLoading)
  const router = useRouter()

  useEffect(() => {
    if (!authLoading && user === null) {
      router.push('/')
    }
  }, [user, authLoading, router])

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-ocean-deeper to-ocean-dark" />
    )
  }

  return <MainLayout>{children}</MainLayout>
}
