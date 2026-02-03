'use client'

import { useEffect, useMemo } from 'react'
import Link from 'next/link'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import 'leaflet.heat'
import L from 'leaflet'
import type { Catch } from '@/lib/store'
import { format } from 'date-fns'
import { de } from 'date-fns/locale'

// Fix default marker icon issue in Next.js
const icon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
})

interface SpotsMapProps {
  catches: Catch[]
  selectedSpot?: { lat: number; lng: number } | null
  selectedZoom?: number
  showHeatmap?: boolean
}

function FitBounds({ catches, disabled }: { catches: Catch[]; disabled?: boolean }) {
  const map = useMap()
  
  useEffect(() => {
    if (!disabled && catches.length > 0) {
      const bounds = L.latLngBounds(
        catches
          .filter(c => c.coordinates)
          .map(c => [c.coordinates!.lat, c.coordinates!.lng] as [number, number])
      )
      map.fitBounds(bounds, { padding: [50, 50] })
    }
  }, [catches, map, disabled])
  
  return null
}

function ZoomToSpot({
  spot,
  zoom,
}: {
  spot?: { lat: number; lng: number } | null
  zoom?: number
}) {
  const map = useMap()

  useEffect(() => {
    if (!spot) return
    map.flyTo([spot.lat, spot.lng], zoom ?? 15, { duration: 0.6 })
  }, [map, spot, zoom])

  return null
}

function HeatmapLayer({
  catches,
  enabled,
}: {
  catches: Catch[]
  enabled?: boolean
}) {
  const map = useMap()

  useEffect(() => {
    if (!enabled || catches.length === 0) return

    const points: Array<[number, number, number]> = catches
      .filter(c => c.coordinates)
      .map(c => {
        const weight = c.length ? Math.min(3, Math.max(1, c.length / 50)) : 1
        return [c.coordinates!.lat, c.coordinates!.lng, weight]
      })

    if (points.length === 0) return

    const layer = L.heatLayer(points, {
      radius: 25,
      blur: 18,
      maxZoom: 16,
      minOpacity: 0.4,
    })

    layer.addTo(map)

    return () => {
      map.removeLayer(layer)
    }
  }, [catches, enabled, map])

  return null
}

export default function SpotsMap({
  catches,
  selectedSpot,
  selectedZoom,
  showHeatmap,
}: SpotsMapProps) {
  // Group catches by location
  const groupedSpots = useMemo(() => {
    const spots = new Map<string, Catch[]>()

    catches.forEach(c => {
      if (!c.coordinates) return
      const key = `${c.coordinates.lat.toFixed(5)},${c.coordinates.lng.toFixed(5)}`
      if (!spots.has(key)) {
        spots.set(key, [])
      }
      spots.get(key)!.push(c)
    })

    return Array.from(spots.entries()).map(([key, catchList]) => ({
      coordinates: catchList[0].coordinates!,
      catches: catchList,
      location: catchList[0].location || 'Unbekannt',
    }))
  }, [catches])

  const center = useMemo(() => {
    if (catches.length === 0) return [52.52, 13.405] as [number, number]
    const firstCatch = catches[0]
    return [firstCatch.coordinates!.lat, firstCatch.coordinates!.lng] as [number, number]
  }, [catches])

  const formatWeight = (weight?: number) => {
    if (!weight) return null
    return weight > 1000 ? `${(weight / 1000).toFixed(2)} kg` : `${weight} g`
  }

  const getSpotSummary = (spotCatches: Catch[]) => {
    const sortedByDate = [...spotCatches].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    )
    const lastCatch = sortedByDate[0]
    const biggestCatch = [...spotCatches].sort((a, b) => b.length - a.length)[0]
    const photosCount = spotCatches.filter(c => c.photo).length

    const speciesCounts = new Map<string, number>()
    spotCatches.forEach(c => {
      speciesCounts.set(c.species, (speciesCounts.get(c.species) || 0) + 1)
    })

    const topSpecies = Array.from(speciesCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([species]) => species)

    return {
      lastCatch,
      biggestCatch,
      photosCount,
      topSpecies,
    }
  }

  return (
    <div style={{ height: '600px', width: '100%' }}>
      <MapContainer
        center={center}
        zoom={13}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {!showHeatmap &&
          groupedSpots.map((spot, index) => {
            const summary = getSpotSummary(spot.catches)

            return (
              <Marker
                key={index}
                position={[spot.coordinates.lat, spot.coordinates.lng]}
                icon={icon}
              >
                <Popup>
                  <div className="p-2 min-w-[240px]">
                    <div className="font-bold text-lg mb-2">{spot.location}</div>
                    <div className="text-sm text-gray-600 mb-3">
                      {spot.catches.length} Fänge hier
                    </div>

                    <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
                      <div className="rounded-md bg-slate-50/80 p-2">
                        <div className="text-gray-500">Letzter Fang</div>
                        <div className="font-semibold">
                          {summary.lastCatch
                            ? `${summary.lastCatch.species} • ${format(
                                new Date(summary.lastCatch.date),
                                'dd.MM.yyyy',
                                { locale: de }
                              )}`
                            : '-'}
                        </div>
                      </div>
                      <div className="rounded-md bg-slate-50/80 p-2">
                        <div className="text-gray-500">Größter Fang</div>
                        <div className="font-semibold">
                          {summary.biggestCatch
                            ? `${summary.biggestCatch.species} • ${summary.biggestCatch.length} cm`
                            : '-'}
                        </div>
                      </div>
                      <div className="rounded-md bg-slate-50/80 p-2">
                        <div className="text-gray-500">Fotos</div>
                        <div className="font-semibold">{summary.photosCount}</div>
                      </div>
                      <div className="rounded-md bg-slate-50/80 p-2">
                        <div className="text-gray-500">Top Arten</div>
                        <div className="font-semibold">
                          {summary.topSpecies.length > 0
                            ? summary.topSpecies.join(', ')
                            : '-'}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      {spot.catches.slice(0, 5).map((c, i) => (
                        <div key={i} className="rounded-md bg-slate-50/80 p-2">
                          <div className="flex items-center justify-between gap-2">
                            <div className="text-sm font-semibold">
                              {c.species} • {c.length} cm
                              {formatWeight(c.weight) ? ` • ${formatWeight(c.weight)}` : ''}
                            </div>
                            <Link
                              href={`/catch/${c.id}`}
                              className="text-xs font-semibold text-ocean hover:text-ocean-light transition-colors"
                            >
                              Details
                            </Link>
                          </div>
                          <div className="text-xs text-gray-600 mt-1">
                            {format(new Date(c.date), 'dd.MM.yyyy', { locale: de })}
                            {c.bait ? ` • Köder: ${c.bait}` : ''}
                          </div>
                          {c.notes && (
                            <div className="text-xs text-gray-500 mt-1 line-clamp-2">
                              {c.notes}
                            </div>
                          )}
                        </div>
                      ))}
                      {spot.catches.length > 5 && (
                        <div className="text-xs text-gray-500">
                          ...und {spot.catches.length - 5} weitere
                        </div>
                      )}
                    </div>
                  </div>
                </Popup>
              </Marker>
            )
          })}

        <FitBounds catches={catches} disabled={!!selectedSpot} />
        <ZoomToSpot spot={selectedSpot} zoom={selectedZoom} />
        <HeatmapLayer catches={catches} enabled={showHeatmap} />
      </MapContainer>
    </div>
  )
}
