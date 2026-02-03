'use client'

import { useState, useMemo, useEffect } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { useCatchStore } from '@/lib/store'
import { MapPin, Fish, Filter, Calendar, TrendingUp } from 'lucide-react'
import { format } from 'date-fns'
import { de } from 'date-fns/locale'

const SpotsMap = dynamic(() => import('@/components/SpotsMap'), { ssr: false })

export default function MapPage() {
  const catches = useCatchStore((state) => state.catches)
  const [filterSpecies, setFilterSpecies] = useState<string>('all')
  const [filterTimeframe, setFilterTimeframe] = useState<string>('all')
  const [sortBy, setSortBy] = useState<'catches' | 'species' | 'recent'>('catches')
  const [selectedSpot, setSelectedSpot] = useState<{ lat: number; lng: number } | null>(null)
  const [showHeatmap, setShowHeatmap] = useState(false)

  // Filter catches
  const filteredCatches = useMemo(() => {
    let filtered = catches.filter(c => c.coordinates)

    // Species filter
    if (filterSpecies !== 'all') {
      filtered = filtered.filter(c => c.species === filterSpecies)
    }

    // Timeframe filter
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

      filtered = filtered.filter(c => new Date(c.date) >= filterDate)
    }

    return filtered
  }, [catches, filterSpecies, filterTimeframe])

  // Calculate spot statistics
  const spotStats = useMemo(() => {
    const spots = new Map<string, {
      catches: number
      species: Set<string>
      location: string
      coordinates: { lat: number; lng: number }
      lastCatch: Date
    }>()

    filteredCatches.forEach(catchData => {
      if (!catchData.coordinates) return
      
      const key = `${catchData.coordinates.lat.toFixed(4)},${catchData.coordinates.lng.toFixed(4)}`
      
      if (!spots.has(key)) {
        spots.set(key, {
          catches: 0,
          species: new Set(),
          location: catchData.location || 'Unbekannt',
          coordinates: catchData.coordinates,
          lastCatch: new Date(catchData.date),
        })
      }

      const spot = spots.get(key)!
      spot.catches++
      spot.species.add(catchData.species)
      
      const catchDate = new Date(catchData.date)
      if (catchDate > spot.lastCatch) {
        spot.lastCatch = catchDate
      }
    })

    let spotsArray = Array.from(spots.values())

    // Sort spots
    switch (sortBy) {
      case 'catches':
        spotsArray.sort((a, b) => b.catches - a.catches)
        break
      case 'species':
        spotsArray.sort((a, b) => b.species.size - a.species.size)
        break
      case 'recent':
        spotsArray.sort((a, b) => b.lastCatch.getTime() - a.lastCatch.getTime())
        break
    }

    return spotsArray
  }, [filteredCatches, sortBy])

  // Get unique species
  const uniqueSpecies = useMemo(() => {
    return [...new Set(catches.filter(c => c.coordinates).map(c => c.species))].sort()
  }, [catches])

  useEffect(() => {
    if (!selectedSpot) return
    const stillExists = spotStats.some(
      spot => spot.coordinates.lat === selectedSpot.lat && spot.coordinates.lng === selectedSpot.lng
    )
    if (!stillExists) setSelectedSpot(null)
  }, [spotStats, selectedSpot])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
          <MapPin className="w-8 h-8 text-ocean-light" />
          Angelkarte
        </h1>
        <p className="text-ocean-light">
          {filteredCatches.length} {filteredCatches.length === 1 ? 'Fang' : 'Fänge'} • {spotStats.length} {spotStats.length === 1 ? 'Spot' : 'Spots'}
        </p>
      </div>

      {/* Filters */}
      <div className="bg-ocean/30 backdrop-blur-sm rounded-xl p-4">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-5 h-5 text-ocean-light" />
          <span className="text-white font-semibold">Filter & Sortierung</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Species Filter */}
          <div>
            <label className="block text-ocean-light text-sm mb-2">Fischart</label>
            <select
              value={filterSpecies}
              onChange={(e) => setFilterSpecies(e.target.value)}
              className="w-full px-4 py-2 rounded-lg bg-ocean-dark text-white border border-ocean-light/30 focus:border-ocean-light focus:outline-none"
            >
              <option value="all">Alle Arten ({catches.filter(c => c.coordinates).length})</option>
              {uniqueSpecies.map(species => (
                <option key={species} value={species}>
                  {species} ({catches.filter(c => c.coordinates && c.species === species).length})
                </option>
              ))}
            </select>
          </div>

          {/* Timeframe Filter */}
          <div>
            <label className="block text-ocean-light text-sm mb-2">Zeitraum</label>
            <select
              value={filterTimeframe}
              onChange={(e) => setFilterTimeframe(e.target.value)}
              className="w-full px-4 py-2 rounded-lg bg-ocean-dark text-white border border-ocean-light/30 focus:border-ocean-light focus:outline-none"
            >
              <option value="all">Alle Zeit</option>
              <option value="week">Letzte Woche</option>
              <option value="month">Letzter Monat</option>
              <option value="year">Letztes Jahr</option>
            </select>
          </div>

          {/* Sort */}
          <div>
            <label className="block text-ocean-light text-sm mb-2">Sortierung</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'catches' | 'species' | 'recent')}
              className="w-full px-4 py-2 rounded-lg bg-ocean-dark text-white border border-ocean-light/30 focus:border-ocean-light focus:outline-none"
            >
              <option value="catches">Meiste Fänge</option>
              <option value="species">Meiste Arten</option>
              <option value="recent">Neueste zuerst</option>
            </select>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between rounded-lg bg-ocean-dark/40 px-4 py-3">
          <div>
            <div className="text-white font-semibold">Heatmap</div>
            <div className="text-ocean-light text-sm">Dichte der Fänge visualisieren</div>
          </div>
          <label className="inline-flex cursor-pointer items-center gap-3">
            <span className="sr-only">Heatmap umschalten</span>
            <input
              type="checkbox"
              className="sr-only"
              checked={showHeatmap}
              onChange={() => setShowHeatmap(prev => !prev)}
            />
            <span
              className={`relative inline-flex h-6 w-11 items-center rounded-full border transition-colors shadow-inner ${
                showHeatmap
                  ? 'bg-amber-500/90 border-amber-400/60'
                  : 'bg-gray-700 border-gray-500/60'
              }`}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                  showHeatmap ? 'translate-x-5' : 'translate-x-1'
                }`}
              />
            </span>
          </label>
        </div>
      </div>

      {/* Map */}
      {filteredCatches.length > 0 ? (
        <div className="bg-ocean/30 backdrop-blur-sm rounded-xl p-4">
          <div className="h-[500px] rounded-lg overflow-hidden">
            <SpotsMap
              catches={filteredCatches}
              selectedSpot={selectedSpot}
              showHeatmap={showHeatmap}
            />
          </div>
        </div>
      ) : (
        <div className="bg-ocean/30 backdrop-blur-sm rounded-xl p-12 text-center">
          <MapPin className="w-16 h-16 text-ocean-light mx-auto mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">Keine Spots gefunden</h3>
          <p className="text-ocean-light mb-6">
            {filterSpecies !== 'all' || filterTimeframe !== 'all'
              ? 'Versuche andere Filter'
              : 'Füge Fänge mit GPS-Koordinaten hinzu'}
          </p>
          <Link
            href="/catches"
            className="inline-block bg-ocean hover:bg-ocean-light text-white font-semibold py-3 px-8 rounded-lg transition-colors"
          >
            Fang hinzufügen
          </Link>
        </div>
      )}

      {/* Top Spots List */}
      {spotStats.length > 0 && (
        <div className="bg-ocean/30 backdrop-blur-sm rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-ocean-light" />
            <h2 className="text-xl font-bold text-white">Spots</h2>
          </div>

          <p className="text-ocean-light text-sm mb-4">
            Tippe auf einen Spot, um die Karte dorthin zu zoomen.
          </p>

          <div className="space-y-3">
            {spotStats.map((spot, index) => (
              <button
                key={`${spot.coordinates.lat}-${spot.coordinates.lng}`}
                type="button"
                onClick={() => setSelectedSpot(spot.coordinates)}
                className={`w-full text-left bg-ocean-dark/50 rounded-lg p-4 transition-colors ${
                  selectedSpot &&
                  selectedSpot.lat === spot.coordinates.lat &&
                  selectedSpot.lng === spot.coordinates.lng
                    ? 'ring-2 ring-ocean-light'
                    : 'hover:bg-ocean-dark'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-ocean text-white font-bold text-sm">
                      #{index + 1}
                    </div>
                    <div>
                      <div className="font-semibold text-white">{spot.location}</div>
                      <div className="text-xs text-ocean-light">
                        {spot.coordinates.lat.toFixed(4)}, {spot.coordinates.lng.toFixed(4)}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-ocean-light text-xs">Letzter Fang</div>
                    <div className="text-white text-sm font-semibold">
                      {format(spot.lastCatch, 'dd.MM.yyyy', { locale: de })}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-ocean-deeper/50 rounded p-2">
                    <div className="text-ocean-light text-xs flex items-center gap-1">
                      <Fish className="w-3 h-3" />
                      Fänge
                    </div>
                    <div className="text-white font-semibold">{spot.catches}</div>
                  </div>
                  <div className="bg-ocean-deeper/50 rounded p-2">
                    <div className="text-ocean-light text-xs">Arten</div>
                    <div className="text-white font-semibold">{spot.species.size}</div>
                  </div>
                </div>

                {spot.species.size > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {Array.from(spot.species).map(species => (
                      <span
                        key={species}
                        className="text-xs bg-ocean/50 text-ocean-light px-2 py-1 rounded-full"
                      >
                        {species}
                      </span>
                    ))}
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Statistics */}
      {filteredCatches.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-ocean/30 backdrop-blur-sm rounded-xl p-4 text-center">
            <div className="text-3xl font-bold text-white mb-1">
              {filteredCatches.length}
            </div>
            <div className="text-ocean-light text-sm">Fänge mit GPS</div>
          </div>

          <div className="bg-ocean/30 backdrop-blur-sm rounded-xl p-4 text-center">
            <div className="text-3xl font-bold text-white mb-1">
              {spotStats.length}
            </div>
            <div className="text-ocean-light text-sm">Verschiedene Spots</div>
          </div>

          <div className="bg-ocean/30 backdrop-blur-sm rounded-xl p-4 text-center">
            <div className="text-3xl font-bold text-white mb-1">
              {new Set(filteredCatches.map(c => c.species)).size}
            </div>
            <div className="text-ocean-light text-sm">Verschiedene Arten</div>
          </div>

          <div className="bg-ocean/30 backdrop-blur-sm rounded-xl p-4 text-center">
            <div className="text-3xl font-bold text-white mb-1">
              {spotStats.length > 0 
                ? Math.max(...spotStats.map(s => s.catches))
                : 0}
            </div>
            <div className="text-ocean-light text-sm">Max Fänge/Spot</div>
          </div>
        </div>
      )}
    </div>
  )
}
