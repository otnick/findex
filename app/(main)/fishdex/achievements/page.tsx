'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { useCatchStore } from '@/lib/store'
import type { Achievement } from '@/lib/types/fishdex'
import { getLevelInfo, XP_PER_CATCH, XP_PER_SPECIES, XP_PER_SHINY } from '@/lib/levelSystem'
import {
  ArrowLeft, Trophy, Star, Lock, Target, BookOpen,
  Users, Fish, Zap, Sparkles,
} from 'lucide-react'

interface AchievementWithProgress extends Achievement {
  unlocked: boolean
  unlockedAt?: string
}

interface XPStats {
  catchCount: number
  speciesCount: number
  shinyCount: number
  achievementXP: number
}

const CATEGORIES = [
  { id: 'all',        name: 'Alle',       icon: Trophy },
  { id: 'collection', name: 'Sammlung',   icon: BookOpen },
  { id: 'skill',      name: 'Meister',    icon: Target },
  { id: 'social',     name: 'Sozial',     icon: Users },
  { id: 'special',    name: 'Besonderes', icon: Star },
]

const BADGE_STYLES: Record<string, string> = {
  bronze:   'bg-gradient-to-br from-orange-900/80 to-orange-950 border-orange-600/60 shadow-orange-900/30',
  silver:   'bg-gradient-to-br from-gray-600/80 to-gray-700 border-gray-400/50 shadow-gray-800/30',
  gold:     'bg-gradient-to-br from-yellow-800/80 to-amber-900 border-yellow-500/60 shadow-yellow-900/30',
  platinum: 'bg-gradient-to-br from-purple-900/80 to-purple-950 border-purple-500/60 shadow-purple-900/30',
  diamond:  'bg-gradient-to-br from-cyan-900/80 to-cyan-950 border-cyan-400/50 shadow-cyan-900/30',
}

const BADGE_TEXT: Record<string, string> = {
  bronze:   'text-orange-300',
  silver:   'text-gray-300',
  gold:     'text-yellow-300',
  platinum: 'text-purple-300',
  diamond:  'text-cyan-300',
}

const BADGE_LABEL: Record<string, string> = {
  bronze:   'Bronze',
  silver:   'Silber',
  gold:     'Gold',
  platinum: 'Platin',
  diamond:  'Diamant',
}

export default function AchievementsPage() {
  const user = useCatchStore((state) => state.user)
  const [achievements, setAchievements] = useState<AchievementWithProgress[]>([])
  const [xpStats, setXpStats] = useState<XPStats>({ catchCount: 0, speciesCount: 0, shinyCount: 0, achievementXP: 0 })
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  useEffect(() => {
    if (user) loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  const loadData = async () => {
    if (!user) return
    try {
      const [
        { data: allAchievements },
        { data: userAchievements },
        { count: catchCount },
        { count: shinyCount },
        { count: speciesCount },
      ] = await Promise.all([
        supabase.from('achievements').select('*').order('category'),
        supabase.from('user_achievements').select('*').eq('user_id', user.id),
        supabase.from('catches').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('catches').select('*', { count: 'exact', head: true }).eq('user_id', user.id).eq('is_shiny', true),
        supabase.from('user_fishdex').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
      ])

      const unlockedMap = new Map(
        (userAchievements || []).map((ua) => [ua.achievement_id, ua.unlocked_at])
      )

      const merged: AchievementWithProgress[] = (allAchievements || []).map((a) => ({
        ...a,
        unlocked: unlockedMap.has(a.id),
        unlockedAt: unlockedMap.get(a.id),
      }))

      const achievementXP = merged
        .filter((a) => a.unlocked)
        .reduce((sum, a) => sum + (a.xp_reward || 0), 0)

      setAchievements(merged)
      setXpStats({
        catchCount: catchCount || 0,
        speciesCount: speciesCount || 0,
        shinyCount: shinyCount || 0,
        achievementXP,
      })
    } catch (err) {
      console.error('Error loading achievements:', err)
    } finally {
      setLoading(false)
    }
  }

  const totalXP = useMemo(
    () =>
      xpStats.achievementXP +
      xpStats.catchCount * XP_PER_CATCH +
      xpStats.speciesCount * XP_PER_SPECIES +
      xpStats.shinyCount * XP_PER_SHINY,
    [xpStats]
  )

  const levelInfo = useMemo(() => getLevelInfo(totalXP), [totalXP])

  const filteredAchievements = useMemo(() => {
    const base = selectedCategory === 'all'
      ? achievements
      : achievements.filter((a) => a.category === selectedCategory)
    // unlocked first, then locked
    return [...base].sort((a, b) => {
      if (a.unlocked !== b.unlocked) return a.unlocked ? -1 : 1
      return 0
    })
  }, [achievements, selectedCategory])

  const unlockedCount = achievements.filter((a) => a.unlocked).length

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-ocean-light/30 border-t-ocean-light rounded-full animate-spin" />
      </div>
    )
  }

  const { currentLevel, nextLevel, xpInCurrentLevel, xpForNextLevel, progressPercent } = levelInfo

  return (
    <div className="space-y-6 pb-24 md:pb-8">
      {/* Back */}
      <Link
        href="/fishdex"
        className="inline-flex items-center gap-2 text-ocean-light hover:text-white transition-colors"
      >
        <ArrowLeft className="w-5 h-5" />
        Zurück zur FinDex
      </Link>

      {/* ── LEVEL HERO ── */}
      <div className={`relative rounded-2xl overflow-hidden bg-gradient-to-br ${currentLevel.gradient} border border-white/10 shadow-2xl`}>
        {/* decorative glow */}
        <div className="absolute -top-10 -right-10 w-52 h-52 rounded-full bg-white/5 blur-3xl pointer-events-none" />

        <div className="relative p-5 sm:p-8">
          <div className="flex items-center gap-4 sm:gap-6">
            {/* Level circle */}
            <div className="relative flex-shrink-0">
              <svg className="w-20 h-20 sm:w-28 sm:h-28 -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="8" />
                <circle
                  cx="50" cy="50" r="42" fill="none"
                  stroke="rgba(255,255,255,0.8)"
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 42}`}
                  strokeDashoffset={`${2 * Math.PI * 42 * (1 - progressPercent / 100)}`}
                  className="transition-all duration-700"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl sm:text-3xl">{currentLevel.emoji}</span>
                <span className="text-white font-black text-lg sm:text-xl leading-none">{currentLevel.level}</span>
              </div>
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className={`text-xs font-bold uppercase tracking-widest mb-1 ${currentLevel.accent}`}>
                Level {currentLevel.level}
              </div>
              <h1 className="text-xl sm:text-3xl font-black text-white truncate">{currentLevel.title}</h1>
              <div className="mt-2 sm:mt-3">
                <div className="flex items-center justify-between text-xs sm:text-sm mb-1.5 gap-2">
                  <span className="text-white/70 shrink-0">
                    {nextLevel ? `${xpInCurrentLevel.toLocaleString('de')} / ${xpForNextLevel.toLocaleString('de')} XP` : 'MAX'}
                  </span>
                  {nextLevel && (
                    <span className="text-white/50 text-xs truncate">
                      → <span className="text-white/80">{nextLevel.title}</span>
                    </span>
                  )}
                </div>
                <div className="w-full h-2.5 rounded-full bg-black/30 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-white/80 transition-all duration-700"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* XP Sources — readable list */}
          <div className="mt-5 pt-4 border-t border-white/10 space-y-2">
            {[
              { icon: <Fish className="w-3.5 h-3.5" />,    label: 'Fänge',   count: xpStats.catchCount,   rate: XP_PER_CATCH,    xp: xpStats.catchCount * XP_PER_CATCH },
              { icon: <BookOpen className="w-3.5 h-3.5" />, label: 'Arten',   count: xpStats.speciesCount, rate: XP_PER_SPECIES,   xp: xpStats.speciesCount * XP_PER_SPECIES },
              { icon: <Sparkles className="w-3.5 h-3.5" />, label: 'Trophäen',  count: xpStats.shinyCount,   rate: XP_PER_SHINY,    xp: xpStats.shinyCount * XP_PER_SHINY },
              { icon: <Trophy className="w-3.5 h-3.5" />,   label: 'Erfolge', count: null,                 rate: null,            xp: xpStats.achievementXP },
            ].map((row, i) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 text-white/60">
                  {row.icon}
                  <span>
                    {row.count !== null
                      ? <><span className="text-white font-semibold">{row.count}</span> {row.label}</>
                      : <><span className="text-white font-semibold">{unlockedCount}</span> {row.label} freigeschaltet</>
                    }
                  </span>
                </div>
                <span className="text-white/80 font-bold">+{row.xp.toLocaleString('de')} XP</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── QUICK STATS ── */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-ocean/30 backdrop-blur-sm rounded-xl p-4 text-center">
          <div className="text-2xl font-black text-white">{unlockedCount}<span className="text-ocean-light font-normal text-lg">/{achievements.length}</span></div>
          <div className="text-ocean-light text-xs mt-1">Erfolge</div>
        </div>
        <div className="bg-ocean/30 backdrop-blur-sm rounded-xl p-4 text-center">
          <div className="text-2xl font-black text-yellow-400">{totalXP.toLocaleString('de')}</div>
          <div className="text-ocean-light text-xs mt-1">Gesamt XP</div>
        </div>
        <div className="bg-ocean/30 backdrop-blur-sm rounded-xl p-4 text-center">
          <div className="text-2xl font-black text-cyan-400">
            {achievements.filter((a) => a.unlocked && a.badge_color === 'diamond').length}
          </div>
          <div className="text-ocean-light text-xs mt-1">Diamanten</div>
        </div>
      </div>

      {/* ── CATEGORY TABS ── */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {CATEGORIES.map((cat) => {
          const count = achievements.filter((a) => cat.id === 'all' || a.category === cat.id)
          const unlocked = count.filter((a) => a.unlocked).length
          const Icon = cat.icon
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl whitespace-nowrap transition-all font-semibold text-sm flex-shrink-0 ${
                selectedCategory === cat.id
                  ? 'bg-ocean-light text-white shadow-lg shadow-ocean-light/20'
                  : 'bg-ocean/30 text-ocean-light hover:bg-ocean/50 hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4" />
              {cat.name}
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                selectedCategory === cat.id ? 'bg-white/20' : 'bg-ocean-dark/40'
              }`}>
                {unlocked}/{count.length}
              </span>
            </button>
          )
        })}
      </div>

      {/* ── ACHIEVEMENT CARDS ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredAchievements.map((achievement) => {
          const style = achievement.badge_color ? BADGE_STYLES[achievement.badge_color] : BADGE_STYLES.bronze
          const textColor = achievement.badge_color ? BADGE_TEXT[achievement.badge_color] : BADGE_TEXT.bronze
          const label = achievement.badge_color ? BADGE_LABEL[achievement.badge_color] : 'Bronze'

          return (
            <div
              key={achievement.id}
              className={`rounded-2xl border-2 p-4 sm:p-5 transition-all duration-200 shadow-lg flex flex-col ${
                achievement.unlocked
                  ? `${style} hover:scale-[1.02] hover:shadow-xl`
                  : 'bg-ocean-dark/60 border-ocean-light/10 opacity-60'
              }`}
            >
              {/* Header: icon left, tier + lock right */}
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className={`text-4xl leading-none transition-all flex-shrink-0 ${achievement.unlocked ? 'drop-shadow-lg' : 'grayscale opacity-30'}`}>
                  {achievement.icon || '🏆'}
                </div>
                <div className="flex flex-col items-end gap-1 min-w-0">
                  {achievement.badge_color && (
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full border whitespace-nowrap ${
                      achievement.unlocked
                        ? `${textColor} border-current bg-black/20`
                        : 'text-gray-600 border-gray-700'
                    }`}>
                      {label}
                    </span>
                  )}
                  {!achievement.unlocked && (
                    <span className="flex items-center gap-1 text-xs text-gray-600">
                      <Lock className="w-3 h-3 flex-shrink-0" />
                      Gesperrt
                    </span>
                  )}
                </div>
              </div>

              {/* Name */}
              <h3 className={`text-base font-black mb-1 leading-tight ${achievement.unlocked ? 'text-white' : 'text-gray-500'}`}>
                {achievement.name}
              </h3>

              {/* Description */}
              <p className={`text-sm leading-snug flex-1 ${achievement.unlocked ? 'text-white/70' : 'text-gray-600'}`}>
                {achievement.description}
              </p>

              {/* Footer */}
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/10">
                <div className={`flex items-center gap-1.5 font-bold text-sm ${achievement.unlocked ? textColor : 'text-gray-600'}`}>
                  <Zap className="w-3.5 h-3.5" />
                  +{achievement.xp_reward} XP
                </div>
                {achievement.unlocked && achievement.unlockedAt && (
                  <div className="text-white/40 text-xs">
                    {new Date(achievement.unlockedAt).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: '2-digit' })}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {filteredAchievements.length === 0 && (
        <div className="bg-ocean/30 backdrop-blur-sm rounded-2xl p-12 text-center">
          <Trophy className="w-14 h-14 text-ocean-light mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-bold text-white mb-2">Keine Erfolge</h3>
          <p className="text-ocean-light text-sm">In dieser Kategorie gibt es noch nichts.</p>
        </div>
      )}

      {/* XP Guide */}
      <div className="bg-ocean/20 border border-ocean-light/10 rounded-2xl p-5">
        <h3 className="text-white font-bold mb-3 flex items-center gap-2">
          <Zap className="w-4 h-4 text-yellow-400" /> XP verdienen
        </h3>
        <div className="space-y-2 text-sm">
          {[
            { icon: <Fish className="w-4 h-4" />, label: 'Pro Fang eintragen', value: `+${XP_PER_CATCH} XP` },
            { icon: <BookOpen className="w-4 h-4" />, label: 'Neue Art entdecken', value: `+${XP_PER_SPECIES} XP` },
            { icon: <Sparkles className="w-4 h-4" />, label: 'Trophäen-Fang landen', value: `+${XP_PER_SHINY} XP` },
            { icon: <Trophy className="w-4 h-4" />, label: 'Erfolg freischalten', value: 'Bonus XP' },
          ].map((item, i) => (
            <div key={i} className="flex items-center justify-between text-ocean-light">
              <div className="flex items-center gap-2">{item.icon}<span>{item.label}</span></div>
              <span className="font-bold text-yellow-400">{item.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
