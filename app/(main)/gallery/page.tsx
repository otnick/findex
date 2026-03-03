'use client'

import { useState, useEffect, useMemo } from 'react'
import Image from 'next/image'
import { useCatchStore } from '@/lib/store'
import { format } from 'date-fns'
import { de } from 'date-fns/locale'
import { Image as ImageIcon, Calendar, Fish, Download, Star } from 'lucide-react'
import EmptyState from '@/components/EmptyState'
import dynamic from 'next/dynamic'
import { useConfirm } from '@/components/ConfirmDialogProvider'

const PhotoLightbox = dynamic(() => import('@/components/PhotoLightbox'), { ssr: false })

interface GalleryPhoto {
  id: string
  url: string
  species: string
  length: number
  date: string
  catchId: string
  isShiny: boolean
  shinyReason?: string | null
}

export default function GalleryPage() {
  const { catches } = useCatchStore()
  const [photos, setPhotos] = useState<GalleryPhoto[]>([])
  const [filteredPhotos, setFilteredPhotos] = useState<GalleryPhoto[]>([])
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const [filterSpecies, setFilterSpecies] = useState<string>('all')
  const [filterShiny, setFilterShiny] = useState(false)
  const [sortBy, setSortBy] = useState<'date' | 'species'>('date')
  const [loading, setLoading] = useState(true)
  const [showAllSpecies, setShowAllSpecies] = useState(false)
  const { confirm } = useConfirm()

  const speciesByCount = useMemo(() => {
    const countMap = new Map<string, number>()
    photos.forEach(p => countMap.set(p.species, (countMap.get(p.species) || 0) + 1))
    return [...new Set(photos.map(p => p.species))]
      .map(s => ({ name: s, count: countMap.get(s) || 0 }))
      .sort((a, b) => b.count - a.count)
  }, [photos])

  const shinyCount = useMemo(() => photos.filter(p => p.isShiny).length, [photos])

  useEffect(() => {
    loadPhotos()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [catches])

  useEffect(() => {
    applyFilters()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [photos, filterSpecies, sortBy, filterShiny])

  const loadPhotos = () => {
    const allPhotos: GalleryPhoto[] = catches.flatMap((c) => {
      const photoUrls = (c.photos && c.photos.length > 0)
        ? c.photos
        : (c.photo ? [c.photo] : [])

      return photoUrls.map((url, index) => ({
        id: `${c.id}-${index}`,
        url,
        species: c.species,
        length: c.length,
        date: typeof c.date === 'string' ? c.date : c.date.toISOString(),
        catchId: c.id,
        isShiny: !!c.is_shiny,
        shinyReason: c.shiny_reason || null,
      }))
    })

    setPhotos(allPhotos)
    setLoading(false)
  }

  const applyFilters = () => {
    let filtered = [...photos]

    if (filterSpecies !== 'all') {
      filtered = filtered.filter(p => p.species === filterSpecies)
    }

    if (filterShiny) {
      filtered = filtered.filter(p => p.isShiny)
    }

    if (sortBy === 'date') {
      filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    } else {
      filtered.sort((a, b) => a.species.localeCompare(b.species))
    }

    setFilteredPhotos(filtered)
  }

  const downloadAll = async () => {
    const confirmed = await confirm({
      title: 'Fotos herunterladen?',
      message: `${filteredPhotos.length} Fotos herunterladen?`,
      confirmLabel: 'Herunterladen',
      cancelLabel: 'Abbrechen',
    })
    if (confirmed) {
      for (const photo of filteredPhotos) {
        try {
          const response = await fetch(photo.url)
          const blob = await response.blob()
          const url = window.URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url
          a.download = `findex-${photo.species}-${format(new Date(photo.date), 'yyyy-MM-dd')}.jpg`
          a.click()
          window.URL.revokeObjectURL(url)
          await new Promise(resolve => setTimeout(resolve, 500))
        } catch (error) {
          console.error('Download failed:', error)
        }
      }
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="bg-white/[0.07] backdrop-blur-xl border border-white/[0.10] rounded-xl p-12 text-center">
          <div className="text-ocean-light">Lade Galerie...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <ImageIcon className="w-8 h-8 text-ocean-light" />
            Foto-Galerie
          </h1>
          <p className="text-ocean-light mt-1">
            {filteredPhotos.length} {filteredPhotos.length === 1 ? 'Foto' : 'Fotos'}
          </p>
        </div>
        {filteredPhotos.length > 0 && (
          <button
            onClick={downloadAll}
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-white/[0.10] hover:bg-white/[0.18] border border-white/[0.15] text-white px-4 py-2 rounded-lg transition-colors text-sm"
          >
            <Download className="w-4 h-4" />
            Alle herunterladen
          </button>
        )}
      </div>

      {/* Filters */}
      {photos.length > 0 && (
        <div className="space-y-3">
          {/* Sort chips */}
          <div className="flex gap-2">
            {(['date', 'species'] as const).map((val, i) => (
              <button
                key={val}
                onClick={() => setSortBy(val)}
                className={`px-3 py-1.5 rounded-full text-sm font-semibold transition-all ${
                  sortBy === val
                    ? 'bg-white/[0.18] text-white shadow-sm'
                    : 'bg-white/[0.07] text-white/60 hover:text-white'
                }`}
              >
                {['Neueste', 'Nach Fischart'][i]}
              </button>
            ))}
          </div>

          {/* Species + Trophäen chips */}
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
          {(filterSpecies !== 'all' || filterShiny) && (
            <div className="text-ocean-light text-sm flex items-center gap-2">
              {filteredPhotos.length} von {photos.length} Fotos
              <button
                onClick={() => { setFilterSpecies('all'); setFilterShiny(false) }}
                className="text-white hover:underline"
              >
                Zurücksetzen
              </button>
            </div>
          )}
        </div>
      )}

      {/* Gallery Grid */}
      {filteredPhotos.length === 0 ? (
        <EmptyState
          icon={ImageIcon}
          title={filterSpecies !== 'all' ? `Keine ${filterSpecies}-Fotos` : 'Keine Fotos'}
          description={
            filterSpecies !== 'all'
              ? `Keine Fotos von ${filterSpecies} gefunden.`
              : 'Füge Fotos zu deinen Fängen hinzu!'
          }
          actionLabel="Fang hinzufügen"
          actionHref="/catches"
        />
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredPhotos.map((photo, index) => {
            const isLegendary = photo.shinyReason === 'legendary'
            return (
            <div
              key={photo.id}
              onClick={() => setSelectedIndex(index)}
              className={`group relative aspect-square rounded-xl overflow-hidden cursor-pointer bg-white/[0.05] hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-2xl animate-scale-in ${
                photo.isShiny ? (isLegendary ? 'legendary-ring' : 'shiny-ring') : ''
              }`}
              style={{ animationDelay: `${index * 30}ms` }}
            >
              <Image
                src={photo.url}
                alt={photo.species}
                fill
                sizes="100vw"
            className="object-cover group-hover:scale-110 transition-transform duration-300"
              />

              {photo.isShiny && (
                <div className={`absolute top-2 right-2 ${isLegendary ? 'legendary-badge text-white' : 'shiny-badge text-black'} rounded-full p-2 shadow-lg group`}>
                  <Star className="w-3.5 h-3.5" />
                  <div className="absolute bottom-full mb-2 right-0 bg-black/90 text-white text-xs px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    {photo.shinyReason === 'legendary' ? 'Legendär • Rekord' : 'Trophäe'}
                  </div>
                </div>
              )}
              
              {/* Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="absolute bottom-0 left-0 right-0 p-3">
                  <div className="flex items-center gap-2 text-white text-sm font-semibold mb-1">
                    <Fish className="w-4 h-4" />
                    {photo.species}
                  </div>
                  <div className="flex items-center gap-2 text-white/80 text-xs">
                    <Calendar className="w-3 h-3" />
                    {format(new Date(photo.date), 'dd.MM.yyyy', { locale: de })}
                  </div>
                  <div className="text-white/80 text-xs mt-1">
                    {photo.length} cm
                  </div>
                </div>
              </div>

              {/* Species Badge */}
              <div className="absolute top-2 left-2 bg-black/50 backdrop-blur-sm px-2 py-1 rounded-full text-white text-xs font-semibold">
                {photo.species}
              </div>
            </div>
          )})}
        </div>
      )}

      {/* Lightbox */}
      {selectedIndex !== null && (
        <PhotoLightbox
          photos={filteredPhotos.map(p => ({
            id: p.id,
            url: p.url,
            species: p.species,
            date: p.date,
          }))}
          initialIndex={selectedIndex}
          onClose={() => setSelectedIndex(null)}
        />
      )}
    </div>
  )
}
