'use client'

import { useState, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import CatchForm from '@/components/CatchForm'
import CatchList from '@/components/CatchList'
import { useCatchStore } from '@/lib/store'
import { Fish, List, LayoutGrid } from 'lucide-react'
import type { Coordinates } from '@/lib/utils/geolocation'

export default function CatchesPage() {
  const searchParams = useSearchParams()
  const [dismissPrefillOpen, setDismissPrefillOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterSpecies, setFilterSpecies] = useState('all')
  const [sortBy, setSortBy] = useState<'date' | 'length' | 'weight'>('date')
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list')
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

  const species = useMemo(() => {
    const uniqueSpecies = [...new Set(catches.map(c => c.species))].sort()
    return uniqueSpecies
  }, [catches])

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

    filtered.sort((a, b) => {
      if (sortBy === 'date') return new Date(b.date).getTime() - new Date(a.date).getTime()
      if (sortBy === 'length') return b.length - a.length
      if (sortBy === 'weight') return (b.weight || 0) - (a.weight || 0)
      return 0
    })

    return filtered
  }, [catches, searchTerm, filterSpecies, sortBy])

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
        <div className="flex bg-ocean/30 rounded-lg p-1 gap-1">
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded-md transition-colors ${viewMode === 'list' ? 'bg-ocean text-white' : 'text-ocean-light hover:text-white'}`}
            aria-label="Listenansicht"
          >
            <List className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-ocean text-white' : 'text-ocean-light hover:text-white'}`}
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
        <div className="bg-ocean/30 backdrop-blur-sm rounded-lg p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-ocean-light text-sm mb-2">Suche</label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Art, Ort, Köder..."
                className="w-full px-4 py-2 rounded-lg bg-ocean-dark text-white border border-ocean-light/30 focus:border-ocean-light focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-ocean-light text-sm mb-2">Fischart</label>
              <select
                value={filterSpecies}
                onChange={(e) => setFilterSpecies(e.target.value)}
                className="w-full px-4 py-2 rounded-lg bg-ocean-dark text-white border border-ocean-light/30 focus:border-ocean-light focus:outline-none"
              >
                <option value="all">Alle Arten</option>
                {species.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-ocean-light text-sm mb-2">Sortierung</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="w-full px-4 py-2 rounded-lg bg-ocean-dark text-white border border-ocean-light/30 focus:border-ocean-light focus:outline-none"
              >
                <option value="date">Neueste zuerst</option>
                <option value="length">Größte zuerst</option>
                <option value="weight">Schwerste zuerst</option>
              </select>
            </div>
          </div>
          {filteredCatches.length !== catches.length && (
            <div className="mt-4 text-ocean-light text-sm">
              {filteredCatches.length} von {catches.length} Fängen
              {(searchTerm || filterSpecies !== 'all') && (
                <button
                  onClick={() => { setSearchTerm(''); setFilterSpecies('all') }}
                  className="ml-2 text-white hover:underline"
                >
                  Filter zurücksetzen
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Content */}
      {!effectiveShowForm && (
        viewMode === 'grid' ? (
          <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-1">
            {filteredCatches.map((c) => (
              <Link
                key={c.id}
                href={`/catch/${c.id}`}
                className="relative aspect-square bg-ocean-dark/50 overflow-hidden group"
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
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-ocean/40 to-ocean-dark/60">
                    <Fish className="w-8 h-8 text-ocean-light/40" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="absolute bottom-0 left-0 right-0 p-1.5 translate-y-full group-hover:translate-y-0 transition-transform duration-200">
                  <p className="text-white text-xs font-semibold truncate leading-tight">{c.species}</p>
                  <p className="text-white/70 text-xs">{c.length} cm</p>
                </div>
              </Link>
            ))}
            {filteredCatches.length === 0 && (
              <div className="col-span-3 sm:col-span-4 lg:col-span-5 text-center py-16 text-ocean-light">
                Keine Fänge gefunden
              </div>
            )}
          </div>
        ) : (
          <CatchList catches={filteredCatches} />
        )
      )}
    </div>
  )
}
