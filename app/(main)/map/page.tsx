'use client'

import { useState, useMemo, useEffect, useRef } from 'react'
import dynamic from 'next/dynamic'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useCatchStore } from '@/lib/store'
import { MapPin, Fish, TrendingUp, RotateCcw, Layers } from 'lucide-react'
import { format } from 'date-fns'
import { de } from 'date-fns/locale'

const SpotsMap = dynamic(() => import('@/components/SpotsMap'), { ssr: false })

type MobileView = 'map' | 'spots'

export default function MapPage() {
  const catches = useCatchStore((state) => state.catches)
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const hasInitializedFromQuery = useRef(false)

  const [filterSpecies, setFilterSpecies] = useState<string>('all')
  const [filterTimeframe, setFilterTimeframe] = useState<string>('all')
  const [mobileView, setMobileView] = useState<MobileView>('map')
  const [selectedSpot, setSelectedSpot] = useState<{ lat: number; lng: number } | null>(null)
  const [showHeatmap, setShowHeatmap] = useState(false)
  const [showAllSpecies, setShowAllSpecies] = useState(false)

  const filteredCatches = useMemo(() => {
    let filtered = catches.filter((c) => c.coordinates)

    if (filterSpecies !== 'all') {
      filtered = filtered.filter((c) => c.species === filterSpecies)
    }

    if (filterTimeframe !== 'all') {
      const now = new Date()
      const filterDate = new Date()

      switch (filterTimeframe) {
        case 'week':
          filterDate.setDate(now.getDate() - 7)
          break
        case 'month':
          filterDate.setMonth(now.getMonth() - 1)
          break
        case 'year':
          filterDate.setFullYear(now.getFullYear() - 1)
          break
      }

      filtered = filtered.filter((c) => new Date(c.date) >= filterDate)
    }

    return filtered
  }, [catches, filterSpecies, filterTimeframe])

  const spotStats = useMemo(() => {
    const spots = new Map<
      string,
      {
        catches: number
        verified: number
        species: Set<string>
        location: string
        coordinates: { lat: number; lng: number }
        lastCatch: Date
        score: number
      }
    >()

    const getSpotScore = (entry: {
      catches: number
      verified: number
      species: Set<string>
      lastCatch: Date
    }) => {
      const now = Date.now()
      const daysSinceLast = Math.floor((now - entry.lastCatch.getTime()) / (1000 * 60 * 60 * 24))
      const countScore = Math.min(35, entry.catches * 5)
      const speciesScore = Math.min(25, entry.species.size * 8)
      const verifyRatio = entry.catches > 0 ? entry.verified / entry.catches : 0
      const verifyScore = Math.round(verifyRatio * 25)
      const recencyScore = daysSinceLast <= 7 ? 15 : daysSinceLast <= 30 ? 11 : daysSinceLast <= 90 ? 7 : 3
      return Math.min(100, countScore + speciesScore + verifyScore + recencyScore)
    }

    filteredCatches.forEach((catchData) => {
      if (!catchData.coordinates) return

      const key = `${catchData.coordinates.lat.toFixed(4)},${catchData.coordinates.lng.toFixed(4)}`

      if (!spots.has(key)) {
        spots.set(key, {
          catches: 0,
          verified: 0,
          species: new Set(),
          location: catchData.location || 'Unbekannt',
          coordinates: catchData.coordinates,
          lastCatch: new Date(catchData.date),
          score: 0,
        })
      }

      const spot = spots.get(key)!
      spot.catches++
      if (catchData.ai_verified || catchData.verification_status === 'verified') {
        spot.verified++
      }
      spot.species.add(catchData.species)

      const catchDate = new Date(catchData.date)
      if (catchDate > spot.lastCatch) {
        spot.lastCatch = catchDate
      }
      spot.score = getSpotScore(spot)
    })

    const spotsArray = Array.from(spots.values())
    spotsArray.sort((a, b) => b.catches - a.catches)
    return spotsArray
  }, [filteredCatches])

  const speciesByCount = useMemo(() => {
    const countMap = new Map<string, number>()
    catches.filter(c => c.coordinates).forEach(c => countMap.set(c.species, (countMap.get(c.species) || 0) + 1))
    return [...new Set(catches.filter(c => c.coordinates).map(c => c.species))]
      .map(s => ({ name: s, count: countMap.get(s) || 0 }))
      .sort((a, b) => b.count - a.count)
  }, [catches])

  useEffect(() => {
    if (hasInitializedFromQuery.current) return

    const qSpecies = searchParams.get('species')
    const qTimeframe = searchParams.get('timeframe')
    const qHeatmap = searchParams.get('heatmap')
    const qView = searchParams.get('view')

    if (qSpecies) setFilterSpecies(qSpecies)
    if (qTimeframe === 'all' || qTimeframe === 'week' || qTimeframe === 'month' || qTimeframe === 'year') {
      setFilterTimeframe(qTimeframe)
    }
    if (qHeatmap === '1') setShowHeatmap(true)
    if (qView === 'map' || qView === 'spots') setMobileView(qView)

    hasInitializedFromQuery.current = true
  }, [searchParams])

  useEffect(() => {
    if (!hasInitializedFromQuery.current) return

    const params = new URLSearchParams()
    if (filterSpecies !== 'all') params.set('species', filterSpecies)
    if (filterTimeframe !== 'all') params.set('timeframe', filterTimeframe)
    if (showHeatmap) params.set('heatmap', '1')
    if (mobileView !== 'map') params.set('view', mobileView)

    const nextQuery = params.toString()
    const currentQuery = searchParams.toString()
    if (nextQuery === currentQuery) return

    router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, { scroll: false })
  }, [filterSpecies, filterTimeframe, showHeatmap, mobileView, pathname, router, searchParams])

  const resetFilters = () => {
    setFilterSpecies('all')
    setFilterTimeframe('all')
    setShowHeatmap(false)
    setMobileView('map')
  }

  useEffect(() => {
    if (!selectedSpot) return
    const stillExists = spotStats.some(
      (spot) => spot.coordinates.lat === selectedSpot.lat && spot.coordinates.lng === selectedSpot.lng
    )
    if (!stillExists) setSelectedSpot(null)
  }, [spotStats, selectedSpot])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
          <MapPin className="w-8 h-8 text-ocean-light" />
          Angelkarte
        </h1>
        <p className="text-ocean-light">
          {filteredCatches.length} {filteredCatches.length === 1 ? 'Fang' : 'Fänge'} • {spotStats.length}{' '}
          {spotStats.length === 1 ? 'Spot' : 'Spots'}
        </p>
      </div>

      <div className="space-y-2">
        {/* Unified filter card */}
        <div className="bg-ocean/30 backdrop-blur-sm rounded-2xl border border-ocean-light/10 overflow-hidden">

          {/* Row 1: Zeitraum + Heatmap icon */}
          <div className="flex items-center border-b border-ocean-light/10">
            <div className="flex gap-0.5 overflow-x-auto scrollbar-hide p-1.5 flex-1">
              {([
                { val: 'all', label: 'Alle Zeit' },
                { val: 'week', label: 'Woche' },
                { val: 'month', label: 'Monat' },
                { val: 'year', label: 'Jahr' },
              ]).map(({ val, label }) => (
                <button
                  key={val}
                  onClick={() => setFilterTimeframe(val)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-semibold flex-shrink-0 transition-all ${
                    filterTimeframe === val
                      ? 'bg-ocean-light text-white shadow-sm'
                      : 'text-ocean-light/70 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="flex-shrink-0 border-l border-ocean-light/10 p-1.5">
              <button
                onClick={() => setShowHeatmap(!showHeatmap)}
                className={`p-2 rounded-lg transition-all ${
                  showHeatmap
                    ? 'bg-amber-500/20 text-amber-400'
                    : 'text-ocean-light/60 hover:text-ocean-light hover:bg-white/5'
                }`}
                title="Heatmap"
              >
                <Layers className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Row 2: Species (only if multiple) */}
          {speciesByCount.length > 0 && (() => {
            const LIMIT = 5
            const visible = showAllSpecies ? speciesByCount : speciesByCount.slice(0, LIMIT)
            const hiddenCount = speciesByCount.length - LIMIT
            return (
              <div className="flex gap-0.5 overflow-x-auto scrollbar-hide p-1.5">
                <button
                  onClick={() => setFilterSpecies('all')}
                  className={`px-3 py-1.5 rounded-lg text-sm font-semibold flex-shrink-0 transition-all ${
                    filterSpecies === 'all'
                      ? 'bg-ocean-light text-white shadow-sm'
                      : 'text-ocean-light/70 hover:text-white hover:bg-white/5'
                  }`}
                >
                  Alle
                </button>
                {visible.map(({ name, count }) => (
                  <button
                    key={name}
                    onClick={() => setFilterSpecies(filterSpecies === name ? 'all' : name)}
                    className={`px-3 py-1.5 rounded-lg text-sm flex-shrink-0 transition-all flex items-center gap-1.5 ${
                      filterSpecies === name
                        ? 'bg-ocean-light text-white font-semibold shadow-sm'
                        : 'text-ocean-light/70 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    {name}
                    <span className={`text-xs ${filterSpecies === name ? 'text-white/70' : 'text-ocean-light/40'}`}>{count}</span>
                  </button>
                ))}
                {!showAllSpecies && hiddenCount > 0 && (
                  <button
                    onClick={() => setShowAllSpecies(true)}
                    className="px-3 py-1.5 rounded-lg text-sm flex-shrink-0 text-ocean-light/60 hover:text-ocean-light hover:bg-white/5 transition-all"
                  >
                    +{hiddenCount} mehr
                  </button>
                )}
              </div>
            )
          })()}
        </div>

        {/* Reset */}
        {(filterSpecies !== 'all' || filterTimeframe !== 'all' || showHeatmap) && (
          <button
            onClick={resetFilters}
            className="text-xs text-ocean-light/50 hover:text-ocean-light flex items-center gap-1.5 transition-colors pl-1"
          >
            <RotateCcw className="w-3 h-3" />
            Zurücksetzen
          </button>
        )}
      </div>

      <div className="md:hidden inline-flex w-full rounded-xl bg-ocean/30 border border-ocean-light/20 p-1">
        <button
          type="button"
          onClick={() => setMobileView('map')}
          className={`flex-1 py-2 rounded-lg text-sm transition-colors ${mobileView === 'map' ? 'bg-ocean text-white' : 'text-ocean-light hover:text-white'}`}
        >
          Karte
        </button>
        <button
          type="button"
          onClick={() => setMobileView('spots')}
          className={`flex-1 py-2 rounded-lg text-sm transition-colors ${mobileView === 'spots' ? 'bg-ocean text-white' : 'text-ocean-light hover:text-white'}`}
        >
          Spots
        </button>
      </div>

      {filteredCatches.length > 0 ? (
        <div className={`bg-ocean/30 backdrop-blur-sm rounded-xl p-4 ${mobileView === 'spots' ? 'hidden md:block' : ''}`}>
          <div className="h-[500px] rounded-lg overflow-hidden">
            <SpotsMap catches={filteredCatches} selectedSpot={selectedSpot} showHeatmap={showHeatmap} />
          </div>
        </div>
      ) : (
        <div className="bg-ocean/30 backdrop-blur-sm rounded-xl p-12 text-center">
          <MapPin className="w-16 h-16 text-ocean-light/40 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">Keine Spots gefunden</h3>
          <p className="text-ocean-light text-sm">
            {filterSpecies !== 'all' || filterTimeframe !== 'all'
              ? 'Versuche andere Filter'
              : 'Aktiviere GPS beim Eintragen von Fängen, um Spots zu sehen'}
          </p>
        </div>
      )}

      {spotStats.length > 0 && (
        <div className={`bg-ocean/30 backdrop-blur-sm rounded-xl p-4 sm:p-6 ${mobileView === 'map' ? 'hidden md:block' : ''}`}>
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-ocean-light" />
            <h2 className="text-xl font-bold text-white">Spots</h2>
          </div>

          <div className="space-y-2">
            {spotStats.map((spot, index) => {
              const isSelected = selectedSpot?.lat === spot.coordinates.lat && selectedSpot?.lng === spot.coordinates.lng
              const speciesArr = Array.from(spot.species)
              const qualityColor = spot.score >= 70 ? 'bg-green-400' : spot.score >= 40 ? 'bg-yellow-400' : 'bg-ocean-light'
              return (
                <button
                  key={`${spot.coordinates.lat}-${spot.coordinates.lng}`}
                  type="button"
                  onClick={() => { setSelectedSpot(spot.coordinates); setMobileView('map') }}
                  className={`w-full text-left rounded-xl p-4 transition-all ${
                    isSelected
                      ? 'bg-ocean-dark ring-2 ring-ocean-light'
                      : 'bg-ocean-dark/50 hover:bg-ocean-dark'
                  }`}
                >
                  {/* Header row */}
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-6 h-6 rounded-full bg-ocean text-white font-bold text-xs flex items-center justify-center flex-shrink-0">
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-white truncate">{spot.location}</div>
                      <div className="text-xs text-ocean-light">{format(spot.lastCatch, 'dd.MM.yy', { locale: de })}</div>
                    </div>
                    <div className="flex gap-4 shrink-0 text-right">
                      <div>
                        <div className="text-white font-bold text-sm leading-none">{spot.catches}</div>
                        <div className="text-ocean-light text-xs mt-0.5">Fänge</div>
                      </div>
                      <div>
                        <div className="text-white font-bold text-sm leading-none">{spot.species.size}</div>
                        <div className="text-ocean-light text-xs mt-0.5">Arten</div>
                      </div>
                    </div>
                  </div>

                  {/* Quality bar */}
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex-1 h-1.5 rounded-full bg-ocean-deeper overflow-hidden">
                      <div className={`h-full rounded-full ${qualityColor} transition-all`} style={{ width: `${spot.score}%` }} />
                    </div>
                    <span className="text-xs text-ocean-light/50 w-7 text-right">{spot.score}</span>
                  </div>

                  {/* Species tags */}
                  {speciesArr.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {speciesArr.slice(0, 4).map(s => (
                        <span key={s} className="text-xs bg-ocean/60 text-ocean-light px-2 py-0.5 rounded-full">{s}</span>
                      ))}
                      {speciesArr.length > 4 && (
                        <span className="text-xs text-ocean-light/40">+{speciesArr.length - 4}</span>
                      )}
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {filteredCatches.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-ocean/30 backdrop-blur-sm rounded-xl p-4 text-center">
            <div className="text-3xl font-bold text-white mb-1">{filteredCatches.length}</div>
            <div className="text-ocean-light text-sm">Fänge mit GPS</div>
          </div>

          <div className="bg-ocean/30 backdrop-blur-sm rounded-xl p-4 text-center">
            <div className="text-3xl font-bold text-white mb-1">{spotStats.length}</div>
            <div className="text-ocean-light text-sm">Verschiedene Spots</div>
          </div>

          <div className="bg-ocean/30 backdrop-blur-sm rounded-xl p-4 text-center">
            <div className="text-3xl font-bold text-white mb-1">{new Set(filteredCatches.map((c) => c.species)).size}</div>
            <div className="text-ocean-light text-sm">Verschiedene Arten</div>
          </div>

          <div className="bg-ocean/30 backdrop-blur-sm rounded-xl p-4 text-center">
            <div className="text-3xl font-bold text-white mb-1">{spotStats.length > 0 ? Math.max(...spotStats.map((s) => s.catches)) : 0}</div>
            <div className="text-ocean-light text-sm">Max Fänge/Spot</div>
          </div>
        </div>
      )}
    </div>
  )
}
