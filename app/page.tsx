'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Auth from '@/components/auth/Auth'
import { useCatchStore } from '@/lib/store'

export default function Home() {
  const user = useCatchStore((state) => state.user)
  const authLoading = useCatchStore((state) => state.authLoading)
  const router = useRouter()

  useEffect(() => {
    if (!authLoading && user) {
      router.replace('/dashboard')
    }
  }, [user, authLoading, router])

  if (authLoading) return null

  if (user) return null

  return <Auth onSuccess={() => router.push('/dashboard')} />
}
