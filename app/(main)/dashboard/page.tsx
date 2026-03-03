'use client'

import { useMemo, useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useCatchStore } from '@/lib/store'
import { supabase } from '@/lib/supabase'
import { format, subDays, isAfter } from 'date-fns'
import { de } from 'date-fns/locale'
import { MapPin, BookOpen, Lightbulb, Fish as FishIcon, Zap, ChevronRight } from 'lucide-react'
import VerificationBadge from '@/components/VerificationBadge'
import { DashboardStatsSkeleton, CatchRowSkeleton } from '@/components/Skeleton'
import { getLevelInfo, XP_PER_CATCH, XP_PER_SPECIES, XP_PER_SHINY } from '@/lib/levelSystem'

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
    const shinyCount = catches.filter(c => c.is_shiny).length
    return { totalCatches, uniqueSpecies, biggestCatch, recentCatches, shinyCount }
  }, [catches])

  const levelInfo = useMemo(() => getLevelInfo(
    stats.totalCatches * XP_PER_CATCH +
    stats.uniqueSpecies * XP_PER_SPECIES +
    stats.shinyCount * XP_PER_SHINY
  ), [stats])

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
        <div className="bg-white/[0.07] backdrop-blur-xl border border-white/[0.10] rounded-xl p-6 space-y-4">
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

        <div className="bg-white/[0.06] backdrop-blur-xl border border-white/[0.10] rounded-xl p-8 text-center">
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

      {/* Recent Catches */}
      <div className="bg-white/[0.07] backdrop-blur-xl border border-white/[0.10] rounded-xl p-6 relative overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent pointer-events-none" />
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white">Letzte Fänge</h2>
          <Link href="/catches" className="text-ocean-light hover:text-white text-sm transition-colors">
            Alle ansehen →
          </Link>
        </div>

        <div className="flex flex-col gap-3">
          {recentCatchesList.map((catchData) => (
            <Link key={catchData.id} href={`/catch/${catchData.id}`} className="block">
              <div className="flex items-center gap-4 bg-white/[0.05] border border-white/[0.06] rounded-xl p-4 hover:bg-white/[0.10] transition-colors cursor-pointer group">
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

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white/[0.07] backdrop-blur-xl border border-white/[0.10] rounded-lg p-6 relative overflow-hidden">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent pointer-events-none" />
          <div className="text-ocean-light text-sm">Gesamt</div>
          <div className="text-3xl font-bold text-white mt-1">{stats.totalCatches}</div>
          <div className="text-ocean-light text-xs mt-1">Fänge</div>
        </div>

        <div className="bg-white/[0.07] backdrop-blur-xl border border-white/[0.10] rounded-lg p-6 relative overflow-hidden">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent pointer-events-none" />
          <div className="text-ocean-light text-sm">Diese Woche</div>
          <div className="text-3xl font-bold text-white mt-1">{stats.recentCatches}</div>
          <div className="text-ocean-light text-xs mt-1">Neue Fänge</div>
        </div>

        <div className="bg-white/[0.07] backdrop-blur-xl border border-white/[0.10] rounded-lg p-6 relative overflow-hidden">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent pointer-events-none" />
          <div className="text-ocean-light text-sm">Größter</div>
          <div className="text-3xl font-bold text-white mt-1">{stats.biggestCatch}</div>
          <div className="text-ocean-light text-xs mt-1">cm</div>
        </div>

        <div className="bg-white/[0.07] backdrop-blur-xl border border-white/[0.10] rounded-lg p-6 relative overflow-hidden">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent pointer-events-none" />
          <div className="text-ocean-light text-sm">Arten</div>
          <div className="text-3xl font-bold text-white mt-1">{stats.uniqueSpecies}</div>
          <div className="text-ocean-light text-xs mt-1">Verschiedene</div>
        </div>
      </div>

      {/* FinDex Widget */}
      {fishDexStats && (
        <div className="bg-white/[0.07] backdrop-blur-xl border border-white/[0.10] rounded-xl p-6 relative overflow-hidden">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent pointer-events-none" />
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
            <div className="w-full bg-black/30 rounded-full h-3 overflow-hidden">
              <div
                className="bg-gradient-to-r from-ocean-light to-ocean h-full transition-all duration-500"
                style={{ width: `${fishDexStats.total > 0 ? (fishDexStats.discovered / fishDexStats.total) * 100 : 0}%` }}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Link href="/fishdex" className="bg-white/[0.05] border border-white/[0.06] rounded-lg p-4 hover:bg-white/[0.09] transition-colors">
              <div className="text-2xl font-bold text-white mb-1">{fishDexStats.discovered}</div>
              <div className="text-ocean-light text-sm">Entdeckt</div>
            </Link>
            <Link href="/fishdex/achievements" className="bg-white/[0.05] border border-white/[0.06] rounded-lg p-4 hover:bg-white/[0.09] transition-colors flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-yellow-400 mb-1 flex items-center gap-1">
                  {levelInfo.currentLevel.emoji} {levelInfo.currentLevel.level}
                </div>
                <div className="text-ocean-light text-sm">{levelInfo.currentLevel.title}</div>
              </div>
              <Zap className="w-5 h-5 text-yellow-400/60" />
            </Link>
          </div>

          {fishDexStats.discovered === 0 && (
            <div className="mt-4 text-center p-4 bg-white/[0.04] rounded-lg border border-white/[0.06]">
              <p className="text-ocean-light text-sm inline-flex items-center gap-1">
                <Lightbulb className="w-4 h-4" />
                Fange deinen ersten Fisch um die FinDex zu starten!
              </p>
            </div>
          )}
        </div>
      )}

      {/* Level Widget */}
      <Link href="/fishdex/achievements" className="block">
        <div className="relative rounded-2xl overflow-hidden backdrop-blur-2xl bg-white/[0.07] border border-white/[0.13] shadow-lg hover:scale-[1.01] transition-transform">
          <div className={`absolute inset-0 bg-gradient-to-r ${levelInfo.currentLevel.gradient} opacity-[0.22] pointer-events-none`} />
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/60 to-transparent pointer-events-none" />
          <div className="relative px-5 py-4 flex items-center gap-4">
            <div className="flex-shrink-0 text-center">
              <div className="text-3xl">{levelInfo.currentLevel.emoji}</div>
              <div className={`text-xs font-black ${levelInfo.currentLevel.accent}`}>LV.{levelInfo.currentLevel.level}</div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-white font-black text-base leading-tight truncate">{levelInfo.currentLevel.title}</div>
              <div className="mt-1.5">
                <div className="w-full h-1.5 rounded-full bg-black/30 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-white/80 transition-all duration-700"
                    style={{ width: `${levelInfo.progressPercent}%` }}
                  />
                </div>
                <div className="text-white/50 text-xs mt-1">
                  {levelInfo.nextLevel
                    ? `${levelInfo.xpInCurrentLevel} / ${levelInfo.xpForNextLevel} XP · nächstes: ${levelInfo.nextLevel.title}`
                    : 'Maximum erreicht 🔥'}
                </div>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-white/40 flex-shrink-0" />
          </div>
        </div>
      </Link>

    </div>
  )
}
