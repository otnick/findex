'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { supabase } from '@/lib/supabase'
import { useCatchStore } from '@/lib/store'
import { format } from 'date-fns'
import { de } from 'date-fns/locale'
import { Heart, MessageCircle, MapPin, Calendar, Ruler, Scale, Fish as FishIcon, ArrowLeft, Image as ImageIcon } from 'lucide-react'

const PhotoLightbox = dynamic(() => import('@/components/PhotoLightbox'), { ssr: false })
const Map = dynamic(() => import('@/components/Map'), { ssr: false })
const Comments = dynamic(() => import('@/components/Comments'), { ssr: false })

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

interface CatchPhoto {
  id: string
  photo_url: string
  caption?: string
  order_index: number
}

export default function CatchDetailPage({ params }: { params: { id: string } }) {
  const [catchData, setCatchData] = useState<CatchDetail | null>(null)
  const [photos, setPhotos] = useState<CatchPhoto[]>([])
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const user = useCatchStore((state) => state.user)

  useEffect(() => {
    if (user) {
      fetchCatch()
      fetchPhotos()
    }
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
      if (!catchRow) {
        setError(true)
        return
      }

      if (catchRow.user_id !== user.id && !catchRow.is_public) {
        setError(true)
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', catchRow.user_id)
        .single()

      const { count: likesCount } = await supabase
        .from('catch_likes')
        .select('*', { count: 'exact', head: true })
        .eq('catch_id', params.id)

      const { data: userLike } = await supabase
        .from('catch_likes')
        .select('id')
        .eq('catch_id', params.id)
        .eq('user_id', user.id)
        .single()

      const { count: commentsCount } = await supabase
        .from('catch_comments')
        .select('*', { count: 'exact', head: true })
        .eq('catch_id', params.id)

      setCatchData({
        ...catchRow,
        username: profile?.username || 'angler',
        likes_count: likesCount || 0,
        comments_count: commentsCount || 0,
        user_has_liked: !!userLike,
      })
    } catch (error) {
      console.error('Error fetching catch:', error)
      setError(true)
    } finally {
      setLoading(false)
    }
  }

  const fetchPhotos = async () => {
    try {
      const { data, error } = await supabase
        .from('catch_photos')
        .select('*')
        .eq('catch_id', params.id)
        .order('order_index')

      if (error) throw error
      if (data && data.length > 0) {
        setPhotos(data)
      }
    } catch (error) {
      console.error('Error fetching photos:', error)
    }
  }

  const toggleLike = async () => {
    if (!user || !catchData) return

    try {
      if (catchData.user_has_liked) {
        await supabase
          .from('catch_likes')
          .delete()
          .eq('catch_id', params.id)
          .eq('user_id', user.id)

        setCatchData({
          ...catchData,
          likes_count: catchData.likes_count - 1,
          user_has_liked: false,
        })
      } else {
        await supabase
          .from('catch_likes')
          .insert({
            catch_id: params.id,
            user_id: user.id,
          })

        setCatchData({
          ...catchData,
          likes_count: catchData.likes_count + 1,
          user_has_liked: true,
        })
      }
    } catch (error) {
      console.error('Error toggling like:', error)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
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
            Zurück zu meinen Fängen
          </Link>
        </div>
      </div>
    )
  }

  const displayPhotos = photos.length > 0 ? photos : (catchData.photo_url ? [{ id: 'main', photo_url: catchData.photo_url, order_index: 0 }] : [])

  return (
    <div className="space-y-6 animate-fade-in pb-20 md:pb-6">
      {/* Back Button */}
      <Link
        href="/catches"
        className="inline-flex items-center gap-2 text-ocean-light hover:text-white transition-colors"
      >
        <ArrowLeft className="w-5 h-5" />
        Zurück
      </Link>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Photos */}
        <div className="lg:col-span-2 space-y-4">
          {displayPhotos.length > 0 && (
            <div className="bg-ocean/30 backdrop-blur-sm rounded-xl p-4">
              {/* Photo Grid - ALL PHOTOS VISIBLE */}
              <div className={`grid gap-3 ${displayPhotos.length === 1 ? 'grid-cols-1' : 'grid-cols-2 md:grid-cols-3'}`}>
                {displayPhotos.map((photo, index) => (
                  <div
                    key={photo.id}
                    className="relative aspect-square rounded-lg overflow-hidden bg-ocean-dark cursor-pointer group"
                    onClick={() => setSelectedPhotoIndex(index)}
                  >
                    <Image
                      src={photo.photo_url}
                      alt={`Foto ${index + 1}`}
                      fill
                      className="object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                    {index === 0 && displayPhotos.length > 1 && (
                      <div className="absolute top-2 left-2 bg-ocean-light px-2 py-1 rounded text-white text-xs font-semibold">
                        Hauptfoto
                      </div>
                    )}
                    {photo.caption && (
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <p className="text-white text-xs line-clamp-2">{photo.caption}</p>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                      <ImageIcon className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Comments Section */}
          <Comments catchId={params.id} />
        </div>

        {/* Right Column - Info */}
        <div className="space-y-4">
          {/* Header Card */}
          <div className="bg-ocean/30 backdrop-blur-sm rounded-xl p-6">
            <h1 className="text-3xl font-bold text-white flex items-center gap-2 mb-2">
              <FishIcon className="w-8 h-8 text-ocean-light" />
              {catchData.species}
            </h1>
            <Link href={`/user/${catchData.username}`}>
              <p className="text-ocean-light hover:text-white transition-colors">
                von @{catchData.username}
              </p>
            </Link>

            {/* Actions */}
            <div className="flex items-center gap-6 pt-4 mt-4 border-t border-ocean-light/20">
              <button
                onClick={toggleLike}
                className={`flex items-center gap-2 transition-all ${
                  catchData.user_has_liked
                    ? 'text-red-400 scale-110'
                    : 'text-ocean-light hover:text-red-400 hover:scale-110'
                }`}
              >
                <Heart className={`w-6 h-6 ${catchData.user_has_liked ? 'fill-current' : ''}`} />
                <span className="font-semibold">{catchData.likes_count}</span>
              </button>
              <div className="flex items-center gap-2 text-ocean-light">
                <MessageCircle className="w-6 h-6" />
                <span className="font-semibold">{catchData.comments_count}</span>
              </div>
            </div>
          </div>

          {/* Stats Card */}
          <div className="bg-ocean/30 backdrop-blur-sm rounded-xl p-6 space-y-4">
            <div className="flex items-center gap-3">
              <Ruler className="w-5 h-5 text-ocean-light" />
              <div>
                <div className="text-ocean-light text-sm">Länge</div>
                <div className="text-2xl font-bold text-white">{catchData.length} cm</div>
              </div>
            </div>

            {catchData.weight && (
              <div className="flex items-center gap-3">
                <Scale className="w-5 h-5 text-ocean-light" />
                <div>
                  <div className="text-ocean-light text-sm">Gewicht</div>
                  <div className="text-xl font-bold text-white">
                    {catchData.weight > 1000
                      ? `${(catchData.weight / 1000).toFixed(2)} kg`
                      : `${catchData.weight} g`}
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-ocean-light" />
              <div>
                <div className="text-ocean-light text-sm">Datum & Zeit</div>
                <div className="text-white font-semibold">
                  {format(new Date(catchData.date), 'dd.MM.yyyy', { locale: de })}
                </div>
                <div className="text-ocean-light text-sm">
                  {format(new Date(catchData.date), 'HH:mm', { locale: de })} Uhr
                </div>
              </div>
            </div>

            {catchData.location && (
              <div className="flex items-center gap-3">
                <MapPin className="w-5 h-5 text-ocean-light" />
                <div>
                  <div className="text-ocean-light text-sm">Ort</div>
                  <div className="text-white font-semibold">
                    {catchData.location}
                  </div>
                </div>
              </div>
            )}

            {catchData.bait && (
              <div className="pt-4 border-t border-ocean-light/20">
                <div className="text-ocean-light text-sm mb-1">Köder</div>
                <div className="text-white">{catchData.bait}</div>
              </div>
            )}

            {catchData.notes && (
              <div className="pt-4 border-t border-ocean-light/20">
                <div className="text-ocean-light text-sm mb-1">Notizen</div>
                <div className="text-white">{catchData.notes}</div>
              </div>
            )}
          </div>

          {/* Map Card */}
          {catchData.coordinates && (
            <div className="bg-ocean/30 backdrop-blur-sm rounded-xl p-4">
              <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-ocean-light" />
                Fangort
              </h3>
              <div className="h-48 rounded-lg overflow-hidden">
                <Map
                  coordinates={catchData.coordinates}
                  location={catchData.location}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Lightbox */}
      {selectedPhotoIndex !== null && (
        <PhotoLightbox
          photos={displayPhotos.map(p => ({
            id: p.id,
            url: p.photo_url,
            species: catchData.species,
            date: catchData.date,
          }))}
          initialIndex={selectedPhotoIndex}
          onClose={() => setSelectedPhotoIndex(null)}
        />
      )}
    </div>
  )
}
