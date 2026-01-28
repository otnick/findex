'use client'

import { useState, useEffect, lazy, Suspense } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useCatchStore, type Catch } from '@/lib/store'
import { supabase } from '@/lib/supabase'
import { format } from 'date-fns'
import { de } from 'date-fns/locale'
import { Eye, Trash2, MapPin, Calendar, Ruler, Image as ImageIcon } from 'lucide-react'

const Map = lazy(() => import('./Map'))

interface CatchListProps {
  catches?: Catch[]
}

interface CatchWithPhotos extends Catch {
  photoCount?: number
}

export default function CatchList({ catches: propCatches }: CatchListProps = {}) {
  const storeCatches = useCatchStore((state) => state.catches)
  const catches = propCatches || storeCatches
  const deleteCatch = useCatchStore((state) => state.deleteCatch)
  const [catchesWithPhotos, setCatchesWithPhotos] = useState<CatchWithPhotos[]>([])
  const [expandedMapId, setExpandedMapId] = useState<string | null>(null)

  useEffect(() => {
    loadPhotoCounts()
  }, [catches])

  const loadPhotoCounts = async () => {
    const catchesWithCounts = await Promise.all(
      catches.map(async (catchItem) => {
        const { count } = await supabase
          .from('catch_photos')
          .select('*', { count: 'exact', head: true })
          .eq('catch_id', catchItem.id)

        return {
          ...catchItem,
          photoCount: count || 0,
        }
      })
    )
    setCatchesWithPhotos(catchesWithCounts)
  }

  if (catches.length === 0) {
    return (
      <div className="bg-ocean/30 backdrop-blur-sm rounded-lg p-12 text-center">
        <div className="text-6xl mb-4">🎣</div>
        <h3 className="text-2xl font-bold text-white mb-2">
          Noch keine Fänge
        </h3>
        <p className="text-ocean-light">
          Füge deinen ersten Fang hinzu und sieh ihn in 3D!
        </p>
      </div>
    )
  }

  const handleDelete = async (id: string) => {
    if (confirm('Möchtest du diesen Fang wirklich löschen?')) {
      await deleteCatch(id)
    }
  }

  const displayCatches = catchesWithPhotos.length > 0 ? catchesWithPhotos : catches

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-white mb-4">
        Meine Fänge ({catches.length})
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {displayCatches.map((catchItem) => (
          <div
            key={catchItem.id}
            className="bg-ocean/30 backdrop-blur-sm rounded-xl overflow-hidden hover:shadow-xl transition-all duration-300 group"
          >
            {/* Photo */}
            <Link href={`/catch/${catchItem.id}`}>
              <div className="relative h-48 bg-ocean-dark cursor-pointer">
                {catchItem.photo ? (
                  <>
                    <Image
                      src={catchItem.photo}
                      alt={catchItem.species}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    {/* Photo Count Badge */}
                    {(catchItem as CatchWithPhotos).photoCount && (catchItem as CatchWithPhotos).photoCount! > 1 && (
                      <div className="absolute top-3 right-3 bg-ocean-deeper/90 backdrop-blur-sm px-2 py-1 rounded-full flex items-center gap-1">
                        <ImageIcon className="w-3 h-3 text-white" />
                        <span className="text-white text-xs font-semibold">
                          {(catchItem as CatchWithPhotos).photoCount}
                        </span>
                      </div>
                    )}
                    {/* Hover Overlay */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <Eye className="w-12 h-12 text-white" />
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="h-full flex items-center justify-center">
                    <span className="text-6xl opacity-50">🎣</span>
                  </div>
                )}
              </div>
            </Link>

            {/* Content */}
            <div className="p-4">
              <Link href={`/catch/${catchItem.id}`}>
                <h3 className="text-xl font-bold text-white mb-2 hover:text-ocean-light transition-colors cursor-pointer">
                  {catchItem.species}
                </h3>
              </Link>

              <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                <div className="flex items-center gap-1 text-ocean-light">
                  <Ruler className="w-4 h-4" />
                  <span>{catchItem.length} cm</span>
                </div>
                {catchItem.weight && (
                  <div className="text-ocean-light">
                    {catchItem.weight > 1000
                      ? `${(catchItem.weight / 1000).toFixed(2)} kg`
                      : `${catchItem.weight} g`}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 text-xs text-ocean-light mb-3">
                <Calendar className="w-3 h-3" />
                <span>
                  {format(new Date(catchItem.date), 'dd.MM.yyyy HH:mm', { locale: de })}
                </span>
              </div>

              {catchItem.location && (
                <div className="flex items-center gap-2 text-xs text-ocean-light mb-3">
                  <MapPin className="w-3 h-3" />
                  <span className="truncate">{catchItem.location}</span>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 pt-3 border-t border-ocean-light/20">
                <Link href={`/catch/${catchItem.id}`} className="flex-1">
                  <button className="w-full px-3 py-2 bg-ocean hover:bg-ocean-light text-white rounded-lg transition-colors text-sm flex items-center justify-center gap-2">
                    <Eye className="w-4 h-4" />
                    Details
                  </button>
                </Link>

                {catchItem.coordinates && (
                  <button
                    onClick={() => setExpandedMapId(
                      expandedMapId === catchItem.id ? null : catchItem.id
                    )}
                    className="px-3 py-2 bg-ocean-dark hover:bg-ocean text-white rounded-lg transition-colors"
                  >
                    <MapPin className="w-4 h-4" />
                  </button>
                )}

                <button
                  onClick={() => handleDelete(catchItem.id)}
                  className="px-3 py-2 bg-red-900/30 hover:bg-red-900/50 text-red-400 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Expanded Map */}
            {expandedMapId === catchItem.id && catchItem.coordinates && (
              <div className="border-t border-ocean-light/20">
                <Suspense fallback={<div className="h-48 bg-ocean-dark animate-pulse" />}>
                  <div className="h-48">
                    <Map
                      coordinates={catchItem.coordinates}
                      markers={[{
                        position: catchItem.coordinates,
                        title: catchItem.species,
                      }]}
                    />
                  </div>
                </Suspense>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
