'use client'

import { useEffect, ReactNode } from 'react'
import { supabase } from '@/lib/supabase'
import { useCatchStore } from '@/lib/store'

interface AuthProviderProps {
  children: ReactNode
}

export default function AuthProvider({ children }: AuthProviderProps) {
  useEffect(() => {
    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      const setUser = useCatchStore.getState().setUser
      setUser(session?.user ?? null)
      useCatchStore.setState({ authLoading: false })
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const setUser = useCatchStore.getState().setUser
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  return <>{children}</>
}
