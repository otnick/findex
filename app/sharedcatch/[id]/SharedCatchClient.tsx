'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { supabase } from '@/lib/supabase'
import { format } from 'date-fns'
import { de } from 'date-fns/locale'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import VerificationBadge from '@/components/VerificationBadge'
import { Fish, Heart, Share2, MapPin, Ruler, Scale, Utensils } from 'lucide-react'
import { useToast } from '@/components/ToastProvider'

const Map = dynamic(() => import('@/components/Map'), { ssr: false })

interface SharedCatch {
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
  username?: string
  verification_status?: 'pending' | 'verified' | 'rejected' | 'manual'
  ai_verified?: boolean
  likes_count: number
  is_shiny?: boolean
}

export default function SharedCatchClient({ id }: { id: string }) {
  const [catchData, setCatchData] = useState<SharedCatch | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    fetchCatch()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const fetchCatch = async () => {
    try {
      const { data, error } = await supabase
        .from('catches')
        .select('*')
        .eq('id', id)
        .eq('is_public', true)
        .single()

      if (error) throw error

      const { data: profile } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', data.user_id)
        .single()

      const { count: likesCount } = await supabase
        .from('catch_likes')
        .select('*', { count: 'exact', head: true })
        .eq('catch_id', id)

      setCatchData({
        ...data,
        username: profile?.username,
        likes_count: likesCount || 0,
      })
    } catch (err) {
      console.error('Error fetching catch:', err)
      setError(true)
    } finally {
      setLoading(false)
    }
  }

  const handleShare = async () => {
    if (!catchData) return
    const shareData = {
      title: `${catchData.species} – ${catchData.length} cm`,
      text: `Schau dir diesen ${catchData.species}-Fang auf FinDex an!`,
      url: window.location.href,
    }
    if (navigator.share) {
      try { await navigator.share(shareData) } catch { /* cancelled */ }
    } else {
      await navigator.clipboard.writeText(window.location.href)
      toast('Link kopiert!', 'success')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-ocean-deeper to-ocean-dark flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-ocean-light/30 border-t-ocean-light rounded-full animate-spin" />
      </div>
    )
  }

  if (error || !catchData) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-ocean-deeper to-ocean-dark flex items-center justify-center p-4">
        <div className="bg-ocean/30 backdrop-blur-sm rounded-xl p-12 text-center max-w-md">
          <div className="mb-4 flex justify-center"><Fish className="w-14 h-14 text-ocean-light" /></div>
          <h1 className="text-2xl font-bold text-white mb-4">Fang nicht gefunden</h1>
          <p className="text-ocean-light mb-6">Dieser Fang existiert nicht oder ist nicht öffentlich.</p>
          <Link href="/" className="inline-block bg-ocean hover:bg-ocean-light text-white font-semibold py-3 px-8 rounded-lg transition-colors">
            Zur Startseite
          </Link>
        </div>
      </div>
    )
  }

  const weightStr = catchData.weight
    ? catchData.weight > 1000
      ? `${(catchData.weight / 1000).toFixed(2)} kg`
      : `${catchData.weight} g`
    : null

  return (
    <div className="min-h-screen bg-gradient-to-b from-ocean-deeper to-ocean-dark">
      <div className="max-w-lg mx-auto px-4 py-8 pb-16">

        {/* App Banner */}
        <div className="bg-ocean-light/10 border border-ocean-light/30 rounded-2xl p-4 mb-6 flex items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <Fish className="w-5 h-5 text-ocean-light" />
              <span className="text-white font-bold text-sm">FinDex</span>
            </div>
            <p className="text-ocean-light text-xs">In der App ansehen & liken</p>
          </div>
          <a
            href={`findex://catch/${id}`}
            className="shrink-0 bg-ocean-light text-white text-sm font-bold px-5 py-2.5 rounded-xl hover:bg-ocean transition-colors"
          >
            App öffnen
          </a>
        </div>

        {/* Photo */}
        {catchData.photo_url && (
          <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden mb-4 shadow-2xl">
            <Image
              src={catchData.photo_url}
              alt={catchData.species}
              fill
              sizes="(max-width: 640px) 100vw, 640px"
              className="object-cover"
              priority
            />
            {catchData.is_shiny && (
              <div className="absolute top-3 left-3 bg-yellow-400/90 text-black text-xs font-bold px-2.5 py-1 rounded-full">
                ✨ Shiny
              </div>
            )}
          </div>
        )}

        {/* Catch Info Card */}
        <div className="bg-ocean/30 backdrop-blur-sm rounded-2xl p-6 mb-4">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-white">{catchData.species}</h1>
              {catchData.username && (
                <p className="text-ocean-light text-sm mt-0.5">von {catchData.username}</p>
              )}
            </div>
            <div className="flex items-center gap-1.5 text-ocean-light">
              <Heart className="w-4 h-4" />
              <span className="text-sm font-medium">{catchData.likes_count}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 mb-4">
            <VerificationBadge status={catchData.verification_status} aiVerified={catchData.ai_verified} />
            <span className="text-ocean-light text-xs">
              {format(new Date(catchData.date), 'dd. MMMM yyyy', { locale: de })}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-ocean-dark/50 rounded-xl p-3 flex items-center gap-2">
              <Ruler className="w-4 h-4 text-ocean-light shrink-0" />
              <div>
                <div className="text-ocean-light text-xs">Länge</div>
                <div className="text-white font-bold">{catchData.length} cm</div>
              </div>
            </div>
            {weightStr && (
              <div className="bg-ocean-dark/50 rounded-xl p-3 flex items-center gap-2">
                <Scale className="w-4 h-4 text-ocean-light shrink-0" />
                <div>
                  <div className="text-ocean-light text-xs">Gewicht</div>
                  <div className="text-white font-bold">{weightStr}</div>
                </div>
              </div>
            )}
            {catchData.location && (
              <div className="bg-ocean-dark/50 rounded-xl p-3 flex items-center gap-2 col-span-2">
                <MapPin className="w-4 h-4 text-ocean-light shrink-0" />
                <div>
                  <div className="text-ocean-light text-xs">Ort</div>
                  <div className="text-white font-bold truncate">{catchData.location}</div>
                </div>
              </div>
            )}
            {catchData.bait && (
              <div className="bg-ocean-dark/50 rounded-xl p-3 flex items-center gap-2 col-span-2">
                <Utensils className="w-4 h-4 text-ocean-light shrink-0" />
                <div>
                  <div className="text-ocean-light text-xs">Köder</div>
                  <div className="text-white font-bold">{catchData.bait}</div>
                </div>
              </div>
            )}
            {catchData.weather && (
              <div className="bg-ocean-dark/50 rounded-xl p-3 col-span-2">
                <div className="text-ocean-light text-xs mb-1">Wetter</div>
                <div className="text-white font-bold">{catchData.weather.temperature}°C · {catchData.weather.description}</div>
              </div>
            )}
          </div>

          {catchData.notes && (
            <div className="mt-3 p-3 bg-ocean-dark/50 rounded-xl">
              <p className="text-white/80 text-sm italic">„{catchData.notes}"</p>
            </div>
          )}
        </div>

        {/* Map */}
        {catchData.coordinates && (
          <div className="rounded-2xl overflow-hidden mb-4 h-52">
            <Map coordinates={catchData.coordinates} location={catchData.location} />
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={handleShare}
            className="flex-1 flex items-center justify-center gap-2 bg-ocean/40 border border-ocean-light/20 text-white font-semibold py-3 rounded-xl hover:bg-ocean/60 transition-colors"
          >
            <Share2 className="w-4 h-4" />
            Teilen
          </button>
          <a
            href={`findex://catch/${id}`}
            className="flex-1 flex items-center justify-center gap-2 bg-ocean-light text-white font-semibold py-3 rounded-xl hover:bg-ocean transition-colors"
          >
            <Fish className="w-4 h-4" />
            In App öffnen
          </a>
        </div>

        {/* Download CTA */}
        <div className="text-center mt-6 pt-6 border-t border-ocean-light/10">
          <p className="text-ocean-light text-sm mb-3">Noch kein FinDex? Tracke deine Fänge kostenlos.</p>
          <Link href="/" className="inline-block bg-ocean-dark border border-ocean-light/20 hover:bg-ocean text-white font-semibold py-2.5 px-6 rounded-xl transition-colors text-sm">
            Jetzt starten
          </Link>
        </div>
      </div>
    </div>
  )
}
