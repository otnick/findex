'use client'

import { useState, useEffect } from 'react'
import FishAquarium from '@/components/FishAquarium'
import CatchForm from '@/components/CatchForm'
import CatchList from '@/components/CatchList'
import Auth from '@/components/auth/Auth'
import { useCatchStore } from '@/lib/store'

export default function Home() {
  const [showForm, setShowForm] = useState(false)
  const { catches, user, loading, signOut } = useCatchStore()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Show loading state during hydration
  if (!mounted) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-ocean-deeper to-ocean-dark flex items-center justify-center">
        <div className="text-white text-2xl">Laden...</div>
      </div>
    )
  }

  // Show auth screen if not logged in
  if (!user) {
    return <Auth onSuccess={() => {}} />
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-ocean-deeper to-ocean-dark">
      <div className="container mx-auto px-4 py-8">
        {/* Header with User Info */}
        <div className="flex justify-between items-center mb-8">
          <div className="text-center flex-1">
            <h1 className="text-5xl font-bold text-white mb-2">🎣 FishBox</h1>
            <p className="text-ocean-light text-lg">Deine Angel-Sammlung in 3D</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-ocean-light text-sm">Angemeldet als</p>
              <p className="text-white font-semibold">{user.email}</p>
            </div>
            <button
              onClick={signOut}
              className="bg-ocean/50 hover:bg-ocean text-white px-4 py-2 rounded-lg transition-colors"
            >
              Abmelden
            </button>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center text-ocean-light mb-4">
            Lädt deine Fänge...
          </div>
        )}

        {/* 3D Aquarium */}
        <div className="mb-8 rounded-xl overflow-hidden shadow-2xl">
          <FishAquarium />
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-ocean/50 backdrop-blur-sm rounded-lg p-6 text-center">
            <div className="text-3xl font-bold text-white">{catches.length}</div>
            <div className="text-ocean-light">Gesamte Fänge</div>
          </div>
          <div className="bg-ocean/50 backdrop-blur-sm rounded-lg p-6 text-center">
            <div className="text-3xl font-bold text-white">
              {catches.length > 0 ? Math.max(...catches.map(c => c.length)) : 0}
            </div>
            <div className="text-ocean-light">Größter Fang (cm)</div>
          </div>
          <div className="bg-ocean/50 backdrop-blur-sm rounded-lg p-6 text-center">
            <div className="text-3xl font-bold text-white">
              {new Set(catches.map(c => c.species)).size}
            </div>
            <div className="text-ocean-light">Verschiedene Arten</div>
          </div>
        </div>

        {/* Add Catch Button */}
        <div className="text-center mb-8">
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-ocean hover:bg-ocean-light text-white font-bold py-3 px-8 rounded-full transition-colors shadow-lg"
          >
            {showForm ? 'Formular schließen' : '+ Neuer Fang'}
          </button>
        </div>

        {/* Catch Form */}
        {showForm && (
          <div className="mb-8">
            <CatchForm onSuccess={() => setShowForm(false)} />
          </div>
        )}

        {/* Catch List */}
        <CatchList />
      </div>
    </main>
  )
}