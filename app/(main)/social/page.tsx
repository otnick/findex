'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { useCatchStore } from '@/lib/store'
import { format } from 'date-fns'
import { de } from 'date-fns/locale'
import { Users, Heart, MessageCircle, Eye, Info, Fish } from 'lucide-react'
import LoadingSkeleton from '@/components/LoadingSkeleton'
import EmptyState from '@/components/EmptyState'

interface Activity {
  id: string
  user_id: string
  username: string
  species?: string
  length?: number
  photo?: string
  location?: string
  created_at: string
  likes_count: number
  comments_count: number
  user_has_liked: boolean
}

export default function SocialPage() {
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)
  const user = useCatchStore((state) => state.user)

  useEffect(() => {
    fetchActivities()
  }, [])

  const fetchActivities = async () => {
    if (!user) return

    try {
      // Fetch recent public catches
      const { data: catches, error } = await supabase
        .from('catches')
        .select('*')
        .eq('is_public', true)
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) throw error

      // Get unique user IDs
      const userIds = [...new Set(catches.map((c: any) => c.user_id))]

      // Fetch profiles
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, username')
        .in('id', userIds)

      // Check which catches user has liked
      const { data: userLikes } = await supabase
        .from('catch_likes')
        .select('catch_id')
        .eq('user_id', user.id)
        .in('catch_id', catches.map((c: any) => c.id))

      const likedCatchIds = new Set(userLikes?.map(l => l.catch_id) || [])

      const activitiesData = catches.map((c: any) => {
        const profile = profiles?.find(p => p.id === c.user_id)
        
        return {
          id: c.id,
          user_id: c.user_id,
          username: profile?.username || 'angler',
          species: c.species,
          length: c.length,
          photo: c.photo_url,
          location: c.location,
          created_at: c.created_at,
          likes_count: c.likes_count || 0,
          comments_count: c.comments_count || 0,
          user_has_liked: likedCatchIds.has(c.id),
        }
      })

      setActivities(activitiesData)
    } catch (error) {
      console.error('Error in fetchActivities:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleLike = async (catchId: string) => {
    if (!user) return

    const activity = activities.find(a => a.id === catchId)
    if (!activity) return

    try {
      if (activity.user_has_liked) {
        // Unlike
        await supabase
          .from('catch_likes')
          .delete()
          .eq('catch_id', catchId)
          .eq('user_id', user.id)

        setActivities(prev => prev.map(a => 
          a.id === catchId 
            ? { ...a, likes_count: a.likes_count - 1, user_has_liked: false }
            : a
        ))
      } else {
        // Like
        await supabase
          .from('catch_likes')
          .insert({ catch_id: catchId, user_id: user.id })

        setActivities(prev => prev.map(a => 
          a.id === catchId 
            ? { ...a, likes_count: a.likes_count + 1, user_has_liked: true }
            : a
        ))
      }
    } catch (error) {
      console.error('Error toggling like:', error)
      // Revert on error
      await fetchActivities()
    }
  }

  return (
    <div className="space-y-6 animate-fade-in pb-20 md:pb-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
          <Users className="w-8 h-8 text-ocean-light" />
          Social
        </h1>
        <p className="text-ocean-light mt-1">Sieh was andere Angler fangen</p>
      </div>

      {/* Info Box */}
      <div className="bg-gradient-to-r from-ocean/40 to-ocean-dark/40 backdrop-blur-sm rounded-lg p-6 border border-ocean-light/10">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            <Info className="w-8 h-8 text-ocean-light" />
          </div>
          <div>
            <h3 className="text-white font-semibold mb-2">Teile deine Fänge!</h3>
            <p className="text-ocean-light text-sm">
              Mache deine Fänge öffentlich, um in der Community sichtbar zu werden.
              In deinen Fängen kannst du einzelne Fänge auf &quot;Öffentlich&quot; stellen.
            </p>
          </div>
        </div>
      </div>

      {/* Activity Feed */}
      {loading ? (
        <LoadingSkeleton type="grid" />
      ) : activities.length === 0 ? (
        <EmptyState
          icon={Fish}
          title="Noch keine Aktivitäten"
          description="Sei der Erste, der einen öffentlichen Fang teilt!"
          actionLabel="Zu meinen Fängen"
          actionHref="/catches"
        />
      ) : (
        <div className="space-y-4">
          {activities.map((activity) => (
            <div
              key={activity.id}
              className="bg-ocean/30 backdrop-blur-sm rounded-xl overflow-hidden hover:bg-ocean/40 transition-all duration-300 hover:shadow-xl animate-slide-up"
            >
              {/* Photo */}
              {activity.photo && (
                <Link href={`/catch/${activity.id}`}>
                  <div className="relative w-full h-64 cursor-pointer group">
                    <Image
                      src={activity.photo}
                      alt={activity.species || 'Fang'}
                      fill
                      className="object-cover group-hover:opacity-90 transition-opacity"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-ocean-deeper/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Eye className="w-12 h-12 text-white" />
                    </div>
                  </div>
                </Link>
              )}

              {/* Content */}
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <Link href={`/user/${activity.username}`}>
                      <div className="font-semibold text-white text-lg hover:text-ocean-light transition-colors">
                        @{activity.username}
                      </div>
                    </Link>
                    <div className="text-ocean-light text-sm">
                      {format(new Date(activity.created_at), 'dd. MMM yyyy, HH:mm', { locale: de })}
                    </div>
                  </div>
                </div>

                <Link href={`/catch/${activity.id}`}>
                  <div className="mb-4 cursor-pointer hover:opacity-80 transition-opacity">
                    <div className="text-white text-lg font-semibold flex items-center gap-2">
                      <Fish className="w-5 h-5 text-ocean-light" />
                      {activity.species} gefangen!
                    </div>
                    <div className="text-ocean-light">
                      {activity.length} cm
                      {activity.location && ` • 📍 ${activity.location}`}
                    </div>
                  </div>
                </Link>

                {/* Actions */}
                <div className="flex items-center gap-6 pt-4 border-t border-ocean-light/20">
                  <button
                    onClick={() => toggleLike(activity.id)}
                    className={`flex items-center gap-2 transition-all duration-200 ${
                      activity.user_has_liked
                        ? 'text-red-400 scale-110'
                        : 'text-ocean-light hover:text-red-400 hover:scale-110'
                    }`}
                  >
                    <Heart 
                      className={`w-5 h-5 ${activity.user_has_liked ? 'fill-current' : ''}`} 
                    />
                    <span className="text-sm font-semibold">{activity.likes_count}</span>
                  </button>
                  <Link href={`/catch/${activity.id}`}>
                    <button className="flex items-center gap-2 text-ocean-light hover:text-white transition-colors">
                      <MessageCircle className="w-5 h-5" />
                      <span className="text-sm">{activity.comments_count}</span>
                    </button>
                  </Link>
                  <Link href={`/catch/${activity.id}`}>
                    <button className="ml-auto text-ocean-light hover:text-white transition-colors text-sm flex items-center gap-1">
                      Details
                      <Eye className="w-4 h-4" />
                    </button>
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Load More */}
      {activities.length >= 50 && (
        <div className="text-center">
          <button
            onClick={fetchActivities}
            className="bg-gradient-to-r from-ocean-light to-ocean hover:from-ocean hover:to-ocean-dark text-white font-semibold py-3 px-8 rounded-lg transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            Mehr laden
          </button>
        </div>
      )}
    </div>
  )
}
