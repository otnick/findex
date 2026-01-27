'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useCatchStore } from '@/lib/store'

interface LeaderboardEntry {
  user_id: string
  email: string
  username?: string
  total_catches: number
  total_weight: number
  biggest_catch: number
  unique_species: number
}

export default function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [timeframe, setTimeframe] = useState<'week' | 'month' | 'all'>('month')
  const [category, setCategory] = useState<'catches' | 'weight' | 'size' | 'species'>('catches')
  const [speciesFilter, setSpeciesFilter] = useState<string>('all')
  const [availableSpecies, setAvailableSpecies] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const user = useCatchStore((state) => state.user)

  useEffect(() => {
    fetchLeaderboard()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeframe, category, speciesFilter])

  const fetchLeaderboard = async () => {
    setLoading(true)
    try {
      const now = new Date()
      let startDate = new Date(0)

      if (timeframe === 'week') {
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      } else if (timeframe === 'month') {
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      }

      // Build query
      let query = supabase
        .from('catches')
        .select('user_id, species, length, weight')
        .eq('is_public', true)
        .gte('date', startDate.toISOString())

      // Add species filter
      if (speciesFilter !== 'all') {
        query = query.eq('species', speciesFilter)
      }

      const { data: catches, error } = await query

      if (error) {
        console.error('Error fetching leaderboard:', error)
        return
      }

      // Get unique species for filter
      const species = [...new Set(catches.map((c: any) => c.species))].sort()
      setAvailableSpecies(species)

      // Group by user
      const userStats = new Map<string, {
        catches: number
        totalWeight: number
        biggestCatch: number
        species: Set<string>
      }>()

      catches.forEach((c: any) => {
        if (!userStats.has(c.user_id)) {
          userStats.set(c.user_id, {
            catches: 0,
            totalWeight: 0,
            biggestCatch: 0,
            species: new Set(),
          })
        }

        const stats = userStats.get(c.user_id)!
        stats.catches++
        stats.totalWeight += c.weight || 0
        stats.biggestCatch = Math.max(stats.biggestCatch, c.length)
        stats.species.add(c.species)
      })

      // Get user IDs
      const userIds = Array.from(userStats.keys())
      
      // Fetch profiles
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, username')
        .in('id', userIds)

      const leaderboardData: LeaderboardEntry[] = userIds
        .map(userId => {
          const stats = userStats.get(userId)!
          const profile = profiles?.find(p => p.id === userId)

          return {
            user_id: userId,
            email: profile?.username || 'angler',
            username: profile?.username || 'angler',
            total_catches: stats.catches,
            total_weight: stats.totalWeight,
            biggest_catch: stats.biggestCatch,
            unique_species: stats.species.size,
          }
        })
        .sort((a, b) => {
          switch (category) {
            case 'weight':
              return b.total_weight - a.total_weight
            case 'size':
              return b.biggest_catch - a.biggest_catch
            case 'species':
              return b.unique_species - a.unique_species
            default:
              return b.total_catches - a.total_catches
          }
        })
        .slice(0, 100)

      setLeaderboard(leaderboardData)
    } catch (error) {
      console.error('Error in fetchLeaderboard:', error)
    } finally {
      setLoading(false)
    }
  }

  const getUserRank = () => {
    return leaderboard.findIndex(entry => entry.user_id === user?.id) + 1
  }

  const getMedalEmoji = (rank: number) => {
    if (rank === 1) return '🥇'
    if (rank === 2) return '🥈'
    if (rank === 3) return '🥉'
    return `#${rank}`
  }

  const formatValue = (entry: LeaderboardEntry) => {
    switch (category) {
      case 'weight':
        return `${(entry.total_weight / 1000).toFixed(1)} kg`
      case 'size':
        return `${entry.biggest_catch} cm`
      case 'species':
        return `${entry.unique_species} Arten`
      default:
        return `${entry.total_catches} Fänge`
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">🏆 Bestenliste</h1>
        <p className="text-ocean-light mt-1">Die besten Angler im Vergleich</p>
      </div>

      {/* Filters */}
      <div className="bg-ocean/30 backdrop-blur-sm rounded-lg p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Timeframe */}
          <div>
            <label className="block text-ocean-light text-sm mb-2">Zeitraum</label>
            <select
              value={timeframe}
              onChange={(e) => setTimeframe(e.target.value as any)}
              className="w-full px-4 py-2 rounded-lg bg-ocean-dark text-white border border-ocean-light/30 focus:border-ocean-light focus:outline-none"
            >
              <option value="week">Diese Woche</option>
              <option value="month">Dieser Monat</option>
              <option value="all">Alle Zeit</option>
            </select>
          </div>

          {/* Category */}
          <div>
            <label className="block text-ocean-light text-sm mb-2">Kategorie</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as any)}
              className="w-full px-4 py-2 rounded-lg bg-ocean-dark text-white border border-ocean-light/30 focus:border-ocean-light focus:outline-none"
            >
              <option value="catches">Meiste Fänge</option>
              <option value="weight">Gesamt-Gewicht</option>
              <option value="size">Größter Fisch</option>
              <option value="species">Meiste Arten</option>
            </select>
          </div>

          {/* Species Filter */}
          <div>
            <label className="block text-ocean-light text-sm mb-2">Fischart</label>
            <select
              value={speciesFilter}
              onChange={(e) => setSpeciesFilter(e.target.value)}
              className="w-full px-4 py-2 rounded-lg bg-ocean-dark text-white border border-ocean-light/30 focus:border-ocean-light focus:outline-none"
            >
              <option value="all">Alle Arten</option>
              {availableSpecies.map(species => (
                <option key={species} value={species}>{species}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Your Rank */}
      {getUserRank() > 0 && (
        <div className="bg-ocean hover:bg-ocean-light transition-colors rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-ocean-light text-sm">Dein Rang</div>
              <div className="text-3xl font-bold text-white mt-1">
                {getMedalEmoji(getUserRank())}
              </div>
            </div>
            <div className="text-right">
              <div className="text-white font-semibold">
                {formatValue(leaderboard[getUserRank() - 1])}
              </div>
              <div className="text-ocean-light text-sm">
                von {leaderboard.length} Anglern
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Leaderboard */}
      {loading ? (
        <div className="bg-ocean/30 backdrop-blur-sm rounded-xl p-12 text-center">
          <div className="text-ocean-light">Laden...</div>
        </div>
      ) : leaderboard.length === 0 ? (
        <div className="bg-ocean/30 backdrop-blur-sm rounded-xl p-12 text-center">
          <div className="text-6xl mb-4">🏆</div>
          <h3 className="text-2xl font-bold text-white mb-2">
            Noch keine öffentlichen Fänge
          </h3>
          <p className="text-ocean-light">
            Teile deine Fänge öffentlich, um in der Bestenliste zu erscheinen!
          </p>
        </div>
      ) : (
        <div className="bg-ocean/30 backdrop-blur-sm rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-ocean-dark/50">
                <tr>
                  <th className="px-6 py-4 text-left text-ocean-light text-sm font-semibold">Rang</th>
                  <th className="px-6 py-4 text-left text-ocean-light text-sm font-semibold">Angler</th>
                  <th className="px-6 py-4 text-right text-ocean-light text-sm font-semibold">Wert</th>
                  <th className="px-6 py-4 text-right text-ocean-light text-sm font-semibold">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ocean-light/10">
                {leaderboard.map((entry, index) => {
                  const rank = index + 1
                  const isCurrentUser = entry.user_id === user?.id

                  return (
                    <tr
                      key={entry.user_id}
                      className={`hover:bg-ocean-dark/30 transition-colors ${
                        isCurrentUser ? 'bg-ocean/20' : ''
                      }`}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-2xl">
                          {getMedalEmoji(rank)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-semibold text-white">
                          @{entry.username}
                          {isCurrentUser && (
                            <span className="ml-2 text-xs text-ocean-light">(Du)</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="text-white font-bold">
                          {formatValue(entry)}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="text-ocean-light text-sm">
                          {entry.total_catches} Fänge • {entry.unique_species} Arten
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
