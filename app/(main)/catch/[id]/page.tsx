'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { useCatchStore } from '@/lib/store'
import { format } from 'date-fns'
import { de } from 'date-fns/locale'
import Map from '@/components/Map'
import Comments from '@/components/Comments'

interface CatchDetail {
  id: string
  species: string
  length: number
  weight?: number
  date: string
  location?: string
  bait?: string
  notes?: string
  photo_url?: string
  coordinates?: { lat: number; lng: number }
  weather?: any
  user_id: string
  username: string
  is_public: boolean
  likes_count: number
  comments_count: number
  user_has_liked: boolean
}

export default function CatchDetailPage({ params }: { params: { id: string } }) {
  const [catchData, setCatchData] = useState<CatchDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const user = useCatchStore((state) => state.user)

  useEffect(() => {
    if (user) {
      fetchCatch()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id, user])

  const fetchCatch = async () => {
    if (!user) return

    try {
      const { data: catchRow, error } = await supabase
        .from('catches')
        .select('*')
        .eq('id', params.id)
        .single()

      if (error) throw error

      // Check if user can view (own catch or public)
      if (catchRow.user_id !== user.id && !catchRow.is_public) {
        setError(true)
        setLoading(false)
        return
      }

      // Get profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', catchRow.user_id)
        .single()

      // Check if user has liked
      const { data: like } = await supabase
        .from('catch_likes')
        .select('id')
        .eq('catch_id', params.id)
        .eq('user_id', user.id)
        .single()

      setCatchData({
        ...catchRow,
        username: profile?.username || 'angler',
        user_has_liked: !!like,
      })
    } catch (err) {
      console.error('Error fetching catch:', err)
      setError(true)
    } finally {
      setLoading(false)
    }
  }

  const toggleLike = async () => {
    if (!user || !catchData) return

    try {
      if (catchData.user_has_liked) {
        await supabase
          .from('catch_likes')
          .delete()
          .eq('catch_id', catchData.id)
          .eq('user_id', user.id)

        setCatchData(prev => prev ? {
          ...prev,
          likes_count: prev.likes_count - 1,
          user_has_liked: false
        } : null)
      } else {
        await supabase
          .from('catch_likes')
          .insert({ catch_id: catchData.id, user_id: user.id })

        setCatchData(prev => prev ? {
          ...prev,
          likes_count: prev.likes_count + 1,
          user_has_liked: true
        } : null)
      }
    } catch (error) {
      console.error('Error toggling like:', error)
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-ocean-deeper to-ocean-dark flex items-center justify-center">
        <div className="text-white text-2xl">Bitte einloggen...</div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="text-ocean-light">Laden...</div>
      </div>
    )
  }

  if (error || !catchData) {
    return (
      <div className="space-y-6">
        <div className="bg-ocean/30 backdrop-blur-sm rounded-xl p-12 text-center">
          <div className="text-6xl mb-4">🎣</div>
          <h1 className="text-2xl font-bold text-white mb-4">Fang nicht gefunden</h1>
          <p className="text-ocean-light mb-6">
            Dieser Fang existiert nicht oder ist privat.
          </p>
          <Link
            href="/catches"
            className="inline-block bg-ocean hover:bg-ocean-light text-white font-semibold py-3 px-8 rounded-lg transition-colors"
          >
            Zurück zu Fängen
          </Link>
        </div>
      </div>
    )
  }

  const isOwnCatch = catchData.user_id === user.id

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Link
          href="/catches"
          className="text-ocean-light hover:text-white transition-colors"
        >
          ← Zurück
        </Link>
        {isOwnCatch && (
          <Link
            href="/catches"
            className="text-ocean-light hover:text-white text-sm transition-colors"
          >
            Bearbeiten
          </Link>
        )}
      </div>

      {/* Catch Card */}
      <div className="bg-ocean/30 backdrop-blur-sm rounded-xl overflow-hidden">
        {/* Photo */}
        {catchData.photo_url && (
          <div className="relative w-full h-96">
            <Image
              src={catchData.photo_url}
              alt={catchData.species}
              fill
              className="object-cover"
            />
          </div>
        )}

        {/* Content */}
        <div className="p-8">
          {/* User Info */}
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-ocean-light/20">
            <div className="w-12 h-12 rounded-full bg-ocean flex items-center justify-center text-2xl">
              🎣
            </div>
            <div>
              <div className="font-semibold text-white text-lg">
                @{catchData.username}
              </div>
              <div className="text-ocean-light text-sm">
                {isOwnCatch ? 'Dein Fang' : 'Öffentlicher Fang'}
              </div>
            </div>
          </div>

          {/* Title */}
          <h1 className="text-3xl font-bold text-white mb-2">{catchData.species}</h1>
          <p className="text-ocean-light mb-6">
            {format(new Date(catchData.date), 'dd. MMMM yyyy, HH:mm', { locale: de })} Uhr
          </p>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-ocean-dark/50 rounded-lg p-4">
              <div className="text-ocean-light text-sm">Länge</div>
              <div className="text-2xl font-bold text-white">{catchData.length} cm</div>
            </div>

            {catchData.weight && (
              <div className="bg-ocean-dark/50 rounded-lg p-4">
                <div className="text-ocean-light text-sm">Gewicht</div>
                <div className="text-2xl font-bold text-white">
                  {catchData.weight > 1000
                    ? `${(catchData.weight / 1000).toFixed(2)} kg`
                    : `${catchData.weight} g`}
                </div>
              </div>
            )}

            {catchData.weather && (
              <div className="bg-ocean-dark/50 rounded-lg p-4">
                <div className="text-ocean-light text-sm">Wetter</div>
                <div className="text-xl font-bold text-white">
                  {catchData.weather.icon} {catchData.weather.temperature}°C
                </div>
              </div>
            )}

            {catchData.bait && (
              <div className="bg-ocean-dark/50 rounded-lg p-4">
                <div className="text-ocean-light text-sm">Köder</div>
                <div className="text-lg font-bold text-white truncate">{catchData.bait}</div>
              </div>
            )}
          </div>

          {/* Notes */}
          {catchData.notes && (
            <div className="mb-6 p-4 bg-ocean-dark/50 rounded-lg">
              <p className="text-white italic">&quot;{catchData.notes}&quot;</p>
            </div>
          )}

          {/* Map */}
          {catchData.coordinates && (
            <div className="mb-6">
              <h3 className="text-lg font-bold text-white mb-3">📍 Spot</h3>
              <Map
                coordinates={catchData.coordinates}
                location={catchData.location}
                height="300px"
              />
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-6 pt-6 border-t border-ocean-light/20 mb-6">
            <button
              onClick={toggleLike}
              className={`flex items-center gap-2 transition-colors ${
                catchData.user_has_liked
                  ? 'text-red-400'
                  : 'text-ocean-light hover:text-white'
              }`}
            >
              <span className="text-2xl">{catchData.user_has_liked ? '❤️' : '🤍'}</span>
              <span className="text-lg font-semibold">{catchData.likes_count}</span>
            </button>
          </div>

          {/* Comments */}
          <div>
            <h3 className="text-lg font-bold text-white mb-4">
              💬 Kommentare ({catchData.comments_count})
            </h3>
            <Comments catchId={catchData.id} />
          </div>
        </div>
      </div>
    </div>
  )
}
