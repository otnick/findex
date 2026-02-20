'use client'

import { useMemo, useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useCatchStore } from '@/lib/store'
import { supabase } from '@/lib/supabase'
import { format, subDays, isAfter } from 'date-fns'
import { de } from 'date-fns/locale'
import { MapPin, BookOpen, Trophy, Lightbulb, Fish as FishIcon } from 'lucide-react'
import VerificationBadge from '@/components/VerificationBadge'
import { DashboardStatsSkeleton, CatchRowSkeleton } from '@/components/Skeleton'

function getGreeting() {
  const h = new Date().getHours()
  if (h < 10) return 'Moin'
  if (h < 18) return 'Hallo'
  return 'Guten Abend'
}

export default function DashboardPage() {
  const catches = useCatchStore((state) => state.catches)
  const storeLoading = useCatchStore((state) => state.loading)
  const user = useCatchStore((state) => state.user)
  const [fishDexStats, setFinDexStats] = useState<{discovered: number, total: number} | null>(null)
  const [username, setUsername] = useState<string>('')

  useEffect(() => {
    if (!user) return
    loadFinDexStats()
    supabase
      .from('profiles')
      .select('username')
      .eq('id', user.id)
      .single()
      .then(({ data }) => { if (data?.username) setUsername(data.username) })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  const loadFinDexStats = async () => {
    if (!user) return
    try {
      const { data: deutschlandSpecies, count: total } = await supabase
        .from('fish_species')
        .select('id', { count: 'exact' })
        .contains('region', ['deutschland'])
        .limit(500)

      const deutschlandIds = deutschlandSpecies?.map(s => s.id) ?? []
      if (deutschlandIds.length === 0) {
        setFinDexStats({ discovered: 0, total: total || 0 })
        return
      }

      const { count: discovered } = await supabase
        .from('user_fishdex')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .in('species_id', deutschlandIds)

      setFinDexStats({ discovered: discovered || 0, total: total || 0 })
    } catch (error) {
      console.error('Error loading FinDex stats:', error)
    }
  }

  const stats = useMemo(() => {
    const totalCatches = catches.length
    const uniqueSpecies = new Set(catches.map(c => c.species)).size
    const biggestCatch = catches.length > 0 ? Math.max(...catches.map(c => c.length)) : 0
    const recentCatches = catches.filter(c =>
      isAfter(new Date(c.date), subDays(new Date(), 7))
    ).length
    return { totalCatches, uniqueSpecies, biggestCatch, recentCatches }
  }, [catches])

  const recentCatchesList = catches.slice(0, 3)

  const greeting = `${getGreeting()}${username ? `, ${username}` : ''}!`

  if (storeLoading) {
    return (
      <div className="space-y-8">
        <div className="pt-4 space-y-2">
          <div className="h-9 w-48 bg-ocean-light/10 rounded animate-pulse" />
          <div className="h-4 w-32 bg-ocean-light/10 rounded animate-pulse" />
        </div>
        <DashboardStatsSkeleton />
        <div className="bg-ocean/30 backdrop-blur-sm rounded-xl p-6 space-y-4">
          <div className="h-5 w-28 bg-ocean-light/10 rounded animate-pulse" />
          {[...Array(3)].map((_, i) => <CatchRowSkeleton key={i} />)}
        </div>
      </div>
    )
  }

  if (catches.length === 0) {
    return (
      <div className="space-y-8">
        <div className="pt-4">
          <h1 className="text-3xl font-bold text-white">{greeting}</h1>
          <p className="text-ocean-light mt-2">
            Willkommen bei FinDex — dein digitales Fangbuch.
          </p>
        </div>

        <div className="bg-ocean/30 backdrop-blur-sm rounded-xl p-8 text-center border border-ocean-light/10">
          <FishIcon className="w-16 h-16 text-ocean-light/40 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Noch kein Fang eingetragen</h2>
          <p className="text-ocean-light text-sm mb-6">
            Drücke den <span className="text-white font-semibold">+</span> Button unten, um deinen ersten Fang hinzuzufügen.
          </p>
          <Link href="/fishdex" className="inline-flex items-center gap-2 text-sm text-ocean-light hover:text-white transition-colors">
            <BookOpen className="w-4 h-4" />
            Schau dir die FinDex an →
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Greeting Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">{greeting}</h1>
        <p className="text-ocean-light mt-1">Hier ist deine Übersicht.</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-ocean/30 backdrop-blur-sm rounded-lg p-6">
          <div className="text-ocean-light text-sm">Gesamt</div>
          <div className="text-3xl font-bold text-white mt-1">{stats.totalCatches}</div>
          <div className="text-ocean-light text-xs mt-1">Fänge</div>
        </div>

        <div className="bg-ocean/30 backdrop-blur-sm rounded-lg p-6">
          <div className="text-ocean-light text-sm">Diese Woche</div>
          <div className="text-3xl font-bold text-white mt-1">{stats.recentCatches}</div>
          <div className="text-ocean-light text-xs mt-1">Neue Fänge</div>
        </div>

        <div className="bg-ocean/30 backdrop-blur-sm rounded-lg p-6">
          <div className="text-ocean-light text-sm">Größter</div>
          <div className="text-3xl font-bold text-white mt-1">{stats.biggestCatch}</div>
          <div className="text-ocean-light text-xs mt-1">cm</div>
        </div>

        <div className="bg-ocean/30 backdrop-blur-sm rounded-lg p-6">
          <div className="text-ocean-light text-sm">Arten</div>
          <div className="text-3xl font-bold text-white mt-1">{stats.uniqueSpecies}</div>
          <div className="text-ocean-light text-xs mt-1">Verschiedene</div>
        </div>
      </div>

      {/* FinDex Widget */}
      {fishDexStats && (
        <div className="bg-ocean/30 backdrop-blur-sm rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <BookOpen className="w-6 h-6 text-ocean-light" />
              <h2 className="text-xl font-bold text-white">FinDex</h2>
            </div>
            <Link href="/fishdex" className="text-ocean-light hover:text-white text-sm transition-colors">
              Zur FinDex →
            </Link>
          </div>

          <div className="mb-4">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-ocean-light">Deutschland</span>
              <span className="text-white font-semibold">
                {fishDexStats.discovered}/{fishDexStats.total} ({fishDexStats.total > 0
                  ? Math.round((fishDexStats.discovered / fishDexStats.total) * 100)
                  : 0}%)
              </span>
            </div>
            <div className="w-full bg-ocean-dark rounded-full h-3 overflow-hidden">
              <div
                className="bg-gradient-to-r from-ocean-light to-ocean h-full transition-all duration-500"
                style={{ width: `${fishDexStats.total > 0 ? (fishDexStats.discovered / fishDexStats.total) * 100 : 0}%` }}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Link href="/fishdex" className="bg-ocean-dark/50 rounded-lg p-4 hover:bg-ocean-dark transition-colors">
              <div className="text-2xl font-bold text-white mb-1">{fishDexStats.discovered}</div>
              <div className="text-ocean-light text-sm">Entdeckt</div>
            </Link>
            <Link href="/fishdex/achievements" className="bg-ocean-dark/50 rounded-lg p-4 hover:bg-ocean-dark transition-colors flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-yellow-400 mb-1">{fishDexStats.total - fishDexStats.discovered}</div>
                <div className="text-ocean-light text-sm">Zu finden</div>
              </div>
              <Trophy className="w-8 h-8 text-yellow-400/50" />
            </Link>
          </div>

          {fishDexStats.discovered === 0 && (
            <div className="mt-4 text-center p-4 bg-ocean-dark/30 rounded-lg">
              <p className="text-ocean-light text-sm inline-flex items-center gap-1">
                <Lightbulb className="w-4 h-4" />
                Fange deinen ersten Fisch um die FinDex zu starten!
              </p>
            </div>
          )}
        </div>
      )}

      {/* Recent Catches */}
      <div className="bg-ocean/30 backdrop-blur-sm rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white">Letzte Fänge</h2>
          <Link href="/catches" className="text-ocean-light hover:text-white text-sm transition-colors">
            Alle ansehen →
          </Link>
        </div>

        <div className="space-y-4">
          {recentCatchesList.map((catchData) => (
            <Link key={catchData.id} href={`/catch/${catchData.id}`}>
              <div className="flex items-center gap-4 bg-ocean-dark/50 rounded-lg p-4 hover:bg-ocean-dark transition-colors cursor-pointer group">
                {catchData.photo && (
                  <div className="relative w-16 h-16 flex-shrink-0">
                    <Image
                      src={catchData.photo}
                      alt={catchData.species}
                      fill
                      sizes="64px"
                      className="object-cover rounded-lg group-hover:scale-105 transition-transform"
                    />
                    <div className="absolute -top-1 -left-1">
                      <VerificationBadge
                        status={catchData.verification_status as any}
                        aiVerified={catchData.ai_verified}
                        className="scale-75 origin-top-left"
                      />
                    </div>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <div className="font-semibold text-white truncate group-hover:text-ocean-light transition-colors">
                      {catchData.species}
                    </div>
                    {!catchData.photo && (
                      <VerificationBadge
                        status={catchData.verification_status as any}
                        aiVerified={catchData.ai_verified}
                        className="scale-75 origin-left"
                      />
                    )}
                  </div>
                  <div className="text-sm text-ocean-light">
                    {catchData.length} cm
                    {catchData.weight && ` • ${catchData.weight > 1000
                      ? `${(catchData.weight / 1000).toFixed(1)} kg`
                      : `${catchData.weight} g`
                    }`}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-ocean-light">
                    {format(new Date(catchData.date), 'dd.MM.yyyy', { locale: de })}
                  </div>
                  {catchData.location && (
                    <div className="text-xs text-ocean-light/70 truncate max-w-[100px]">
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="w-3 h-3" />{catchData.location}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
