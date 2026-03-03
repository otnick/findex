'use client'

import { useState, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import Image from 'next/image'
import dynamic from 'next/dynamic'
import CatchForm from '@/components/CatchForm'
import CatchList from '@/components/CatchList'
import { useCatchStore } from '@/lib/store'
import { Fish, List, LayoutGrid, X } from 'lucide-react'
import type { Coordinates } from '@/lib/utils/geolocation'

const PhotoLightbox = dynamic(() => import('@/components/PhotoLightbox'), { ssr: false })

export default function CatchesPage() {
  const searchParams = useSearchParams()
  const [dismissPrefillOpen, setDismissPrefillOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterSpecies, setFilterSpecies] = useState('all')
  const [filterShiny, setFilterShiny] = useState(false)
  const [sortBy, setSortBy] = useState<'date' | 'length' | 'weight'>('date')
  const [showAllSpecies, setShowAllSpecies] = useState(false)
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list')
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  const catches = useCatchStore((state) => state.catches)

  const prefill = useMemo(() => {
    const latRaw = searchParams.get('lat')
    const lngRaw = searchParams.get('lng')
    const location = searchParams.get('location') || ''
    const autoOpen = searchParams.get('new') === '1'

    const lat = latRaw ? parseFloat(latRaw) : NaN
    const lng = lngRaw ? parseFloat(lngRaw) : NaN
    const coordinates: Coordinates | null =
      Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null

    return { autoOpen, coordinates, location }
  }, [searchParams])

  const effectiveShowForm = prefill.autoOpen && !dismissPrefillOpen

  const speciesByCount = useMemo(() => {
    const countMap = new Map<string, number>()
    catches.forEach(c => countMap.set(c.species, (countMap.get(c.species) || 0) + 1))
    return [...new Set(catches.map(c => c.species))]
      .map(s => ({ name: s, count: countMap.get(s) || 0 }))
      .sort((a, b) => b.count - a.count)
  }, [catches])

  const shinyCount = useMemo(() => catches.filter(c => c.is_shiny).length, [catches])

  const filteredCatches = useMemo(() => {
    let filtered = [...catches]

    if (searchTerm) {
      filtered = filtered.filter(c =>
        c.species.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.bait?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (filterSpecies !== 'all') {
      filtered = filtered.filter(c => c.species === filterSpecies)
    }

    if (filterShiny) {
      filtered = filtered.filter(c => c.is_shiny)
    }

    filtered.sort((a, b) => {
      if (sortBy === 'date') return new Date(b.date).getTime() - new Date(a.date).getTime()
      if (sortBy === 'length') return b.length - a.length
      if (sortBy === 'weight') return (b.weight || 0) - (a.weight || 0)
      return 0
    })

    return filtered
  }, [catches, searchTerm, filterSpecies, filterShiny, sortBy])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Fish className="w-8 h-8 text-ocean-light" />
            Meine Fänge
          </h1>
          <p className="text-ocean-light mt-1">{catches.length} Fänge insgesamt</p>
        </div>
        <div className="flex bg-white/[0.08] backdrop-blur-xl border border-white/[0.12] rounded-xl p-1 gap-1">
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded-md transition-colors ${viewMode === 'list' ? 'bg-white/[0.18] text-white' : 'text-white/60 hover:text-white'}`}
            aria-label="Listenansicht"
          >
            <List className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-white/[0.18] text-white' : 'text-white/60 hover:text-white'}`}
            aria-label="Galerieansicht"
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Auto-open form from map/prefill */}
      {effectiveShowForm && (
        <div className="animate-fadeIn">
          <CatchForm
            onSuccess={() => setDismissPrefillOpen(true)}
            initialCoordinates={prefill.coordinates}
            initialLocation={prefill.location}
          />
        </div>
      )}

      {/* Filters */}
      {!effectiveShowForm && catches.length > 0 && (
        <div className="space-y-3">
          {/* Search with clear button */}
          <div className="relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Art, Ort, Köder..."
              className="w-full px-4 py-2.5 pr-10 rounded-xl bg-white/[0.07] backdrop-blur-sm text-white border border-white/[0.12] focus:border-white/30 focus:outline-none placeholder:text-white/30"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-ocean-light hover:text-white transition-colors"
                aria-label="Suche löschen"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Sort chips */}
          <div className="flex gap-2">
            {(['date', 'length', 'weight'] as const).map((val, i) => (
              <button
                key={val}
                onClick={() => setSortBy(val)}
                className={`px-3 py-1.5 rounded-full text-sm font-semibold transition-all ${
                  sortBy === val
                    ? 'bg-white/[0.18] text-white shadow-sm'
                    : 'bg-white/[0.07] text-white/60 hover:text-white'
                }`}
              >
                {['Neueste', 'Längste', 'Schwerste'][i]}
              </button>
            ))}
          </div>

          {/* Species + Trophäen filter chips */}
          {(speciesByCount.length > 1 || shinyCount > 0) && (() => {
            const LIMIT = 5
            const visible = showAllSpecies ? speciesByCount : speciesByCount.slice(0, LIMIT)
            const hiddenCount = speciesByCount.length - LIMIT
            return (
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                {shinyCount > 0 && (
                  <button
                    onClick={() => setFilterShiny(!filterShiny)}
                    className={`px-3 py-1.5 rounded-full text-sm font-semibold flex-shrink-0 transition-all ${
                      filterShiny
                        ? 'bg-yellow-500/30 text-yellow-300 border border-yellow-500/40'
                        : 'bg-white/[0.07] text-white/60 hover:text-white'
                    }`}
                  >
                    ⭐ Trophäen
                  </button>
                )}
                {speciesByCount.length > 1 && (
                  <>
                    <button
                      onClick={() => setFilterSpecies('all')}
                      className={`px-3 py-1.5 rounded-full text-sm font-semibold flex-shrink-0 transition-all ${
                        filterSpecies === 'all'
                          ? 'bg-white/[0.18] text-white shadow-sm'
                          : 'bg-white/[0.07] text-white/60 hover:text-white'
                      }`}
                    >
                      Alle
                    </button>
                    {visible.map(({ name, count }) => (
                      <button
                        key={name}
                        onClick={() => setFilterSpecies(filterSpecies === name ? 'all' : name)}
                        className={`px-3 py-1.5 rounded-full text-sm flex-shrink-0 transition-all flex items-center gap-1.5 ${
                          filterSpecies === name
                            ? 'bg-white/[0.18] text-white font-semibold shadow-sm'
                            : 'bg-white/[0.07] text-white/60 hover:text-white'
                        }`}
                      >
                        {name}
                        <span className={`text-xs ${filterSpecies === name ? 'text-white/70' : 'text-ocean-light/50'}`}>
                          {count}
                        </span>
                      </button>
                    ))}
                    {!showAllSpecies && hiddenCount > 0 && (
                      <button
                        onClick={() => setShowAllSpecies(true)}
                        className="px-3 py-1.5 rounded-full text-sm flex-shrink-0 bg-white/[0.07] text-white/60 hover:text-white transition-all"
                      >
                        +{hiddenCount} weitere
                      </button>
                    )}
                  </>
                )}
              </div>
            )
          })()}

          {/* Result count + reset */}
          {filteredCatches.length !== catches.length && (
            <div className="text-ocean-light text-sm flex items-center gap-2">
              {filteredCatches.length} von {catches.length} Fängen
              <button
                onClick={() => { setSearchTerm(''); setFilterSpecies('all'); setFilterShiny(false) }}
                className="text-white hover:underline"
              >
                Zurücksetzen
              </button>
            </div>
          )}
        </div>
      )}

      {/* Content */}
      {!effectiveShowForm && (
        viewMode === 'grid' ? (
          <>
            <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-1">
              {filteredCatches.map((c) => {
                const photosOnly = filteredCatches.filter(x => x.photo)
                const photoIdx = photosOnly.findIndex(x => x.id === c.id)
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => c.photo ? setLightboxIndex(photoIdx) : undefined}
                    className="relative aspect-square bg-white/[0.05] overflow-hidden group"
                  >
                    {c.photo ? (
                      <Image
                        src={c.photo}
                        alt={c.species}
                        fill
                        sizes="(max-width: 640px) 33vw, (max-width: 1024px) 25vw, 20vw"
                        className="object-cover group-hover:scale-105 transition-transform duration-200"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-white/[0.08]">
                        <Fish className="w-8 h-8 text-ocean-light/40" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="absolute bottom-0 left-0 right-0 p-1.5 translate-y-full group-hover:translate-y-0 transition-transform duration-200">
                      <p className="text-white text-xs font-semibold truncate leading-tight">{c.species}</p>
                      <p className="text-white/70 text-xs">{c.length} cm</p>
                    </div>
                  </button>
                )
              })}
              {filteredCatches.length === 0 && (
                <div className="col-span-3 sm:col-span-4 lg:col-span-5 text-center py-16 text-ocean-light">
                  Keine Fänge gefunden
                </div>
              )}
            </div>
            {lightboxIndex !== null && (
              <PhotoLightbox
                photos={filteredCatches
                  .filter(c => c.photo)
                  .map(c => ({ id: c.id, url: c.photo!, species: c.species, date: String(c.date) }))}
                initialIndex={lightboxIndex}
                onClose={() => setLightboxIndex(null)}
              />
            )}
          </>
        ) : (
          <CatchList catches={filteredCatches} />
        )
      )}
    </div>
  )
}
