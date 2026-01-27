'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useCatchStore } from '@/lib/store'
import { format, subDays, isAfter } from 'date-fns'
import { de } from 'date-fns/locale'
import FishAquarium from '@/components/FishAquarium'

export default function DashboardPage() {
  const catches = useCatchStore((state) => state.catches)

  // Calculate stats
  const stats = useMemo(() => {
    const totalCatches = catches.length
    const uniqueSpecies = new Set(catches.map(c => c.species)).size
    const biggestCatch = catches.length > 0 ? Math.max(...catches.map(c => c.length)) : 0
    const recentCatches = catches.filter(c => 
      isAfter(new Date(c.date), subDays(new Date(), 7))
    ).length

    return { totalCatches, uniqueSpecies, biggestCatch, recentCatches }
  }, [catches])

  const recentCatchesList = catches.slice(0, 3)

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">Dashboard</h1>
        <p className="text-ocean-light mt-1">Willkommen zurück! Hier ist deine Übersicht.</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-ocean/30 backdrop-blur-sm rounded-lg p-6">
          <div className="text-ocean-light text-sm">Gesamt</div>
          <div className="text-3xl font-bold text-white mt-1">{stats.totalCatches}</div>
          <div className="text-ocean-light text-xs mt-1">Fänge</div>
        </div>

        <div className="bg-ocean/30 backdrop-blur-sm rounded-lg p-6">
          <div className="text-ocean-light text-sm">Diese Woche</div>
          <div className="text-3xl font-bold text-white mt-1">{stats.recentCatches}</div>
          <div className="text-ocean-light text-xs mt-1">Neue Fänge</div>
        </div>

        <div className="bg-ocean/30 backdrop-blur-sm rounded-lg p-6">
          <div className="text-ocean-light text-sm">Größter</div>
          <div className="text-3xl font-bold text-white mt-1">{stats.biggestCatch}</div>
          <div className="text-ocean-light text-xs mt-1">cm</div>
        </div>

        <div className="bg-ocean/30 backdrop-blur-sm rounded-lg p-6">
          <div className="text-ocean-light text-sm">Arten</div>
          <div className="text-3xl font-bold text-white mt-1">{stats.uniqueSpecies}</div>
          <div className="text-ocean-light text-xs mt-1">Verschiedene</div>
        </div>
      </div>

      {/* 3D Aquarium */}
      <div className="bg-ocean/30 backdrop-blur-sm rounded-xl overflow-hidden p-4">
        <h2 className="text-xl font-bold text-white mb-4">Dein Aquarium</h2>
        <div className="rounded-xl overflow-hidden">
          <FishAquarium />
        </div>
      </div>

      {/* Recent Catches */}
      <div className="bg-ocean/30 backdrop-blur-sm rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white">Letzte Fänge</h2>
          <Link 
            href="/catches"
            className="text-ocean-light hover:text-white text-sm transition-colors"
          >
            Alle ansehen →
          </Link>
        </div>

        {recentCatchesList.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🎣</div>
            <p className="text-ocean-light mb-4">Noch keine Fänge</p>
            <Link
              href="/catches"
              className="inline-block bg-ocean hover:bg-ocean-light text-white font-semibold py-2 px-6 rounded-lg transition-colors"
            >
              Ersten Fang hinzufügen
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {recentCatchesList.map((catchData) => (
              <div
                key={catchData.id}
                className="flex items-center gap-4 bg-ocean-dark/50 rounded-lg p-4 hover:bg-ocean-dark transition-colors"
              >
                {catchData.photo && (
                  <div className="relative w-16 h-16 flex-shrink-0">
                    <Image
                      src={catchData.photo}
                      alt={catchData.species}
                      fill
                      className="object-cover rounded-lg"
                    />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-white truncate">{catchData.species}</div>
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
                      📍 {catchData.location}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Link
          href="/catches"
          className="bg-ocean/30 backdrop-blur-sm rounded-lg p-6 hover:bg-ocean/50 transition-colors text-center"
        >
          <div className="text-4xl mb-2">➕</div>
          <div className="text-white font-semibold">Fang hinzufügen</div>
        </Link>

        <Link
          href="/map"
          className="bg-ocean/30 backdrop-blur-sm rounded-lg p-6 hover:bg-ocean/50 transition-colors text-center"
        >
          <div className="text-4xl mb-2">🗺️</div>
          <div className="text-white font-semibold">Spots anzeigen</div>
        </Link>

        <Link
          href="/stats"
          className="bg-ocean/30 backdrop-blur-sm rounded-lg p-6 hover:bg-ocean/50 transition-colors text-center"
        >
          <div className="text-4xl mb-2">📊</div>
          <div className="text-white font-semibold">Statistiken</div>
        </Link>

        <Link
          href="/profile"
          className="bg-ocean/30 backdrop-blur-sm rounded-lg p-6 hover:bg-ocean/50 transition-colors text-center"
        >
          <div className="text-4xl mb-2">👤</div>
          <div className="text-white font-semibold">Profil</div>
        </Link>
      </div>
    </div>
  )
}
