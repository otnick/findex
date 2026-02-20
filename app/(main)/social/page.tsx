'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { useCatchStore } from '@/lib/store'
import { format } from 'date-fns'
import { de } from 'date-fns/locale'
import { Heart, MessageCircle, MapPin, Ruler, Image as ImageIcon, Search, UserPlus, UserCheck, Users, UserX, Fish, Award } from 'lucide-react'
import { useToast } from '@/components/ToastProvider'
import { useConfirm } from '@/components/ConfirmDialogProvider'
import VerificationBadge from '@/components/VerificationBadge'
import Avatar from '@/components/Avatar'

interface Activity {
  id: string
  user_id: string
  username: string
  avatar_url?: string | null
  species: string
  length: number
  weight?: number
  photo_url?: string
  location?: string
  created_at: string
  verification_status?: 'pending' | 'verified' | 'rejected' | 'manual'
  ai_verified?: boolean
  likes_count: number
  comments_count: number
  user_has_liked: boolean
  photo_count?: number
}

interface SearchResult {
  id: string
  username: string
  bio?: string
  avatar_url?: string | null
}

interface FriendProfile {
  id: string
  username: string
  bio?: string
  avatar_url?: string | null
  stats?: { catches: number; species: number }
}

interface FriendRequest {
  id: string
  friend_id: string
  username: string
  created_at: string
}

export default function SocialPage() {
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'friends' | 'explore' | 'search' | 'requests'>('friends')
  const [friendIds, setFriendIds] = useState<string[]>([])
  const [friends, setFriends] = useState<FriendProfile[]>([])
  const [requests, setRequests] = useState<FriendRequest[]>([])
  const [friendsLoading, setFriendsLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [sentRequests, setSentRequests] = useState<Set<string>>(new Set())
  const user = useCatchStore((state) => state.user)
  const { toast } = useToast()
  const { confirm } = useConfirm()

  useEffect(() => {
    if (user && activeTab !== 'search' && activeTab !== 'requests') {
      fetchActivities()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, activeTab])

  useEffect(() => {
    if (user) {
      fetchFriends()
      fetchRequests()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  const searchUsers = async (query: string) => {
    setSearchQuery(query)
    if (!query.trim() || !user) { setSearchResults([]); return }
    const { data } = await supabase
      .from('profiles')
      .select('id, username, bio, avatar_url')
      .ilike('username', `%${query}%`)
      .neq('id', user.id)
      .limit(10)
    setSearchResults(data || [])
  }

  const sendRequest = async (friendId: string) => {
    if (!user) return
    try {
      const { error } = await supabase
        .from('friendships')
        .insert({ user_id: user.id, friend_id: friendId, status: 'pending' })
      if (error) throw error
      setSentRequests(prev => new Set([...prev, friendId]))
      toast('Freundschaftsanfrage gesendet!', 'success')
    } catch (error: any) {
      if (error.code === '23505') {
        setSentRequests(prev => new Set([...prev, friendId]))
        toast('Anfrage bereits gesendet!', 'info')
      } else {
        toast('Fehler beim Senden der Anfrage', 'error')
      }
    }
  }

  const fetchFriends = async () => {
    if (!user) return
    setFriendsLoading(true)
    try {
      const { data } = await supabase
        .from('friendships')
        .select('friend_id')
        .eq('user_id', user.id)
        .eq('status', 'accepted')

      const ids = (data || []).map(f => f.friend_id)
      if (ids.length === 0) { setFriends([]); return }

      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, username, bio, avatar_url')
        .in('id', ids)

      const friendsWithStats = await Promise.all(
        (profiles || []).map(async (profile) => {
          const { data: catches } = await supabase
            .from('catches').select('species').eq('user_id', profile.id).eq('is_public', true)
          return { ...profile, stats: { catches: catches?.length || 0, species: new Set(catches?.map(c => c.species)).size || 0 } }
        })
      )
      setFriends(friendsWithStats)
    } catch (e) { console.error(e) }
    finally { setFriendsLoading(false) }
  }

  const fetchRequests = async () => {
    if (!user) return
    try {
      const { data } = await supabase
        .from('friendships')
        .select('id, user_id, created_at')
        .eq('friend_id', user.id)
        .eq('status', 'pending')

      if (!data || data.length === 0) { setRequests([]); return }

      const { data: profiles } = await supabase
        .from('profiles').select('id, username').in('id', data.map(r => r.user_id))

      setRequests(data.map(req => {
        const profile = profiles?.find(p => p.id === req.user_id)
        return { id: req.id, friend_id: req.user_id, username: profile?.username || 'Unbekannt', created_at: req.created_at }
      }))
    } catch (e) { console.error(e) }
  }

  const acceptRequest = async (requestId: string, friendId: string) => {
    try {
      await supabase.from('friendships').update({ status: 'accepted' }).eq('id', requestId)
      await supabase.from('friendships').insert({ user_id: user!.id, friend_id: friendId, status: 'accepted' })
      fetchFriends()
      fetchRequests()
      toast('Freundschaftsanfrage angenommen!', 'success')
    } catch (e) { console.error(e) }
  }

  const rejectRequest = async (requestId: string) => {
    try {
      await supabase.from('friendships').delete().eq('id', requestId)
      fetchRequests()
      toast('Anfrage abgelehnt', 'info')
    } catch (e) { console.error(e) }
  }

  const removeFriend = async (friendId: string) => {
    const confirmed = await confirm({ title: 'Freund entfernen?', message: 'Freund wirklich entfernen?', confirmLabel: 'Entfernen', cancelLabel: 'Abbrechen', variant: 'danger' })
    if (!confirmed) return
    try {
      await supabase.from('friendships').delete()
        .or(`and(user_id.eq.${user!.id},friend_id.eq.${friendId}),and(user_id.eq.${friendId},friend_id.eq.${user!.id})`)
      fetchFriends()
      toast('Freund entfernt', 'success')
    } catch (e) { console.error(e) }
  }

  const fetchActivities = async () => {
    if (!user) return

    try {
      setLoading(true)

      let catchQuery = supabase
        .from('catches')
        .select('*')
        .eq('is_public', true)
        .order('created_at', { ascending: false })
        .limit(30)

      if (activeTab === 'friends') {
        const { data: friendships, error: friendsError } = await supabase
          .from('friendships')
          .select('friend_id')
          .eq('user_id', user.id)
          .eq('status', 'accepted')

        if (friendsError) throw friendsError

        const ids = (friendships || []).map(f => f.friend_id)
        setFriendIds(ids)

        if (ids.length === 0) {
          setActivities([])
          setLoading(false)
          return
        }

        catchQuery = catchQuery.in('user_id', ids)
      }

      const { data: catches, error } = await catchQuery

      if (error) throw error

      const activitiesWithData = await Promise.all(
        (catches || []).map(async (catchItem) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('username, avatar_url')
            .eq('id', catchItem.user_id)
            .single()

          const { count: likesCount } = await supabase
            .from('catch_likes')
            .select('*', { count: 'exact', head: true })
            .eq('catch_id', catchItem.id)

          const { count: commentsCount } = await supabase
            .from('catch_comments')
            .select('*', { count: 'exact', head: true })
            .eq('catch_id', catchItem.id)

          const { data: userLike } = await supabase
            .from('catch_likes')
            .select('id')
            .eq('catch_id', catchItem.id)
            .eq('user_id', user.id)
            .single()

          const { count: photoCount } = await supabase
            .from('catch_photos')
            .select('*', { count: 'exact', head: true })
            .eq('catch_id', catchItem.id)

          return {
            id: catchItem.id,
            user_id: catchItem.user_id,
            username: profile?.username || 'angler',
            avatar_url: profile?.avatar_url || null,
            species: catchItem.species,
            length: catchItem.length,
            weight: catchItem.weight,
            photo_url: catchItem.photo_url,
            location: catchItem.location,
            created_at: catchItem.created_at,
            verification_status: catchItem.verification_status,
            ai_verified: catchItem.ai_verified,
            likes_count: likesCount || 0,
            comments_count: commentsCount || 0,
            user_has_liked: !!userLike,
            photo_count: photoCount || 0,
          }
        })
      )

      setActivities(activitiesWithData)
    } catch (error) {
      console.error('Error fetching activities:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleLike = async (activityId: string) => {
    if (!user) return

    const activity = activities.find(a => a.id === activityId)
    if (!activity) return

    try {
      if (activity.user_has_liked) {
        await supabase
          .from('catch_likes')
          .delete()
          .eq('catch_id', activityId)
          .eq('user_id', user.id)

        setActivities(prev => prev.map(a =>
          a.id === activityId
            ? { ...a, likes_count: a.likes_count - 1, user_has_liked: false }
            : a
        ))
      } else {
        await supabase
          .from('catch_likes')
          .insert({
            catch_id: activityId,
            user_id: user.id,
          })

        setActivities(prev => prev.map(a =>
          a.id === activityId
            ? { ...a, likes_count: a.likes_count + 1, user_has_liked: true }
            : a
        ))
      }
    } catch (error) {
      console.error('Error toggling like:', error)
    }
  }

  if (loading && activeTab !== 'search' && activeTab !== 'requests') {
    return (
      <div className="space-y-6">
        <div className="bg-ocean/30 backdrop-blur-sm rounded-xl p-12 text-center">
          <div className="text-ocean-light">Laden...</div>
        </div>
      </div>
    )
  }

  const showEmptyState = activities.length === 0

  return (
    <div className="space-y-6 pb-20 md:pb-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
          <MessageCircle className="w-8 h-8 text-ocean-light" />
          Social Feed
        </h1>
        <p className="text-ocean-light">
          {activities.length} {activities.length === 1 ? 'Fang' : 'Fänge'}
        </p>
      </div>

      {/* Tabs */}
      <div className="bg-ocean/30 backdrop-blur-sm rounded-lg p-1 flex gap-1">
        <button
          onClick={() => setActiveTab('friends')}
          className={`flex-1 py-2 px-3 rounded-lg transition-all text-sm font-semibold ${
            activeTab === 'friends' ? 'bg-ocean text-white' : 'text-ocean-light hover:text-white'
          }`}
        >
          Feed
        </button>
        <button
          onClick={() => setActiveTab('explore')}
          className={`flex-1 py-2 px-3 rounded-lg transition-all text-sm font-semibold ${
            activeTab === 'explore' ? 'bg-ocean text-white' : 'text-ocean-light hover:text-white'
          }`}
        >
          Entdecken
        </button>
        <button
          onClick={() => setActiveTab('search')}
          className={`flex-1 py-2 px-3 rounded-lg transition-all text-sm font-semibold flex items-center justify-center gap-1 ${
            activeTab === 'search' ? 'bg-ocean text-white' : 'text-ocean-light hover:text-white'
          }`}
        >
          <Search className="w-3.5 h-3.5" />
          Suchen
        </button>
        <button
          onClick={() => setActiveTab('requests')}
          className={`flex-1 py-2 px-3 rounded-lg transition-all text-sm font-semibold relative flex items-center justify-center gap-1 ${
            activeTab === 'requests' ? 'bg-ocean text-white' : 'text-ocean-light hover:text-white'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          Kontakte
          {requests.length > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-xs flex items-center justify-center text-white leading-none">
              {requests.length}
            </span>
          )}
        </button>
      </div>

      {activeTab === 'search' ? (
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ocean-light/60" />
            <input
              type="text"
              placeholder="Nach Benutzername suchen..."
              value={searchQuery}
              onChange={(e) => searchUsers(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-ocean-dark text-white border border-ocean-light/30 focus:border-ocean-light focus:outline-none text-sm"
            />
          </div>
          {searchResults.length === 0 && searchQuery.trim() && (
            <div className="text-center text-ocean-light/60 py-8 text-sm">Keine Benutzer gefunden</div>
          )}
          <div className="space-y-3">
            {searchResults.map((result) => (
              <div key={result.id} className="flex items-center gap-3 bg-ocean/30 backdrop-blur-sm rounded-xl p-4">
                <Link href={`/user/${result.id}`} className="flex items-center gap-3 flex-1 min-w-0">
                  <Avatar seed={result.username || result.id} src={result.avatar_url} size={40} className="w-10 h-10 flex-shrink-0" />
                  <div className="min-w-0">
                    <div className="text-white font-semibold text-sm truncate">@{result.username}</div>
                    {result.bio && <div className="text-ocean-light/70 text-xs truncate">{result.bio}</div>}
                  </div>
                </Link>
                {sentRequests.has(result.id) ? (
                  <span className="flex items-center gap-1.5 text-xs text-ocean-light/60 flex-shrink-0">
                    <UserCheck className="w-4 h-4" />
                    Gesendet
                  </span>
                ) : (
                  <button
                    onClick={() => sendRequest(result.id)}
                    className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-ocean-light/20 text-ocean-light hover:bg-ocean-light/30 hover:text-white transition-colors flex-shrink-0"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    Anfrage senden
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : activeTab === 'requests' ? (
        <div className="space-y-6">
          {/* Pending requests */}
          {requests.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-ocean-light uppercase tracking-wider">Anfragen ({requests.length})</h3>
              {requests.map((request) => (
                <div key={request.id} className="bg-ocean/30 backdrop-blur-sm rounded-xl p-4 flex items-center justify-between">
                  <Link href={`/user/${request.friend_id}`} className="flex items-center gap-3 min-w-0">
                    <Avatar seed={request.username} src={null} size={36} className="w-9 h-9 flex-shrink-0" />
                    <div className="min-w-0">
                      <div className="text-white font-semibold text-sm">@{request.username}</div>
                      <div className="text-ocean-light/60 text-xs">Möchte dein Freund sein</div>
                    </div>
                  </Link>
                  <div className="flex gap-2 flex-shrink-0">
                    <button onClick={() => acceptRequest(request.id, request.friend_id)} className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs flex items-center gap-1 transition-colors">
                      <UserCheck className="w-3.5 h-3.5" />
                      Annehmen
                    </button>
                    <button onClick={() => rejectRequest(request.id)} className="px-3 py-1.5 bg-red-900/30 hover:bg-red-900/50 text-red-400 rounded-lg text-xs transition-colors">
                      <UserX className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Friend list */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-ocean-light uppercase tracking-wider">
              Meine Freunde ({friends.length})
            </h3>
            {friendsLoading ? (
              <div className="text-ocean-light/60 text-sm text-center py-6">Laden...</div>
            ) : friends.length === 0 ? (
              <div className="bg-ocean/30 backdrop-blur-sm rounded-xl p-8 text-center">
                <Users className="w-12 h-12 text-ocean-light/40 mx-auto mb-3" />
                <p className="text-ocean-light text-sm">Noch keine Freunde. Nutze Suchen um Angler zu finden!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {friends.map((friend) => (
                  <div key={friend.id} className="bg-ocean/30 backdrop-blur-sm rounded-xl p-4 flex items-center gap-3">
                    <Link href={`/user/${friend.id}`} className="flex items-center gap-3 flex-1 min-w-0">
                      <Avatar seed={friend.username || friend.id} src={friend.avatar_url} size={40} className="w-10 h-10 flex-shrink-0" />
                      <div className="min-w-0">
                        <div className="text-white font-semibold text-sm truncate">@{friend.username}</div>
                        {friend.bio && <div className="text-ocean-light/70 text-xs truncate">{friend.bio}</div>}
                        <div className="flex gap-3 mt-1">
                          <span className="text-ocean-light/60 text-xs flex items-center gap-1"><Fish className="w-3 h-3" />{friend.stats?.catches || 0}</span>
                          <span className="text-ocean-light/60 text-xs flex items-center gap-1"><Award className="w-3 h-3" />{friend.stats?.species || 0} Arten</span>
                        </div>
                      </div>
                    </Link>
                    <button onClick={() => removeFriend(friend.id)} className="p-1.5 text-red-400/60 hover:text-red-400 transition-colors flex-shrink-0">
                      <UserX className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : showEmptyState ? (
        <div className="bg-ocean/30 backdrop-blur-sm rounded-xl p-12 text-center">
          <div className="text-6xl mb-4">?</div>
          <h3 className="text-2xl font-bold text-white mb-2">Keine Aktivitäten</h3>
          <p className="text-ocean-light">
            {activeTab === 'friends'
              ? 'Noch keine öffentlichen Fänge von deinen Freunden.'
              : 'Noch keine öffentlichen Fänge verfügbar.'}
          </p>
        </div>
      ) : (
        <>
          {/* Feed Grid - Better Desktop Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {activities.map((activity) => (
              <Link
                key={activity.id}
                href={`/catch/${activity.id}`}
                className="bg-ocean/30 backdrop-blur-sm rounded-xl overflow-hidden hover:shadow-xl transition-all duration-300 group"
              >
            {/* Photo */}
            {activity.photo_url && (
              <div className="relative h-56 bg-ocean-dark">
                <Image
                  src={activity.photo_url}
                  alt={activity.species}
                  fill
                  sizes="100vw"
            className="object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <VerificationBadge
                  status={activity.verification_status}
                  aiVerified={activity.ai_verified}
                  className="absolute top-2 left-2"
                />
                {/* Photo Count Badge */}
                {activity.photo_count && activity.photo_count > 1 && (
                  <div className="absolute top-3 right-3 bg-ocean-deeper/90 backdrop-blur-sm px-2 py-1 rounded-full flex items-center gap-1">
                    <ImageIcon className="w-3 h-3 text-white" />
                    <span className="text-white text-xs font-semibold">
                          {activity.photo_count}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* Content */}
                <div className="p-5">
                  {/* User */}
                  <div className="flex items-center gap-2 mb-3 min-h-[28px]">
                    <Avatar
                      seed={activity.username || activity.user_id}
                      src={activity.avatar_url}
                      size={28}
                      className="w-7 h-7 flex-shrink-0"
                      alt={`@${activity.username}`}
                    />
                    <div className="flex items-center gap-2 h-7 min-w-0 leading-none sm:leading-snug">
                      <Link
                        href={`/user/${activity.user_id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="text-ocean-light hover:text-white transition-colors text-sm font-semibold leading-none sm:leading-snug flex items-center truncate"
                      >
                        @{activity.username}
                      </Link>
                      <span className="text-ocean-light/70 text-xs leading-none sm:leading-snug flex items-center whitespace-nowrap">
                        {format(new Date(activity.created_at), 'dd.MM.yyyy', { locale: de })}
                      </span>
                    </div>
                  </div>

              {/* Species */}
              <div className="flex items-center gap-2 mb-3">
                <h3 className="text-xl font-bold text-white group-hover:text-ocean-light transition-colors">
                  {activity.species}
                </h3>
                {!activity.photo_url && (
                  <VerificationBadge
                    status={activity.verification_status}
                    aiVerified={activity.ai_verified}
                    className="ml-1"
                  />
                )}
              </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="bg-ocean-dark/50 rounded p-2">
                      <div className="text-ocean-light text-xs flex items-center gap-1">
                        <Ruler className="w-3 h-3" />
                        Länge
                      </div>
                      <div className="text-white font-semibold">{activity.length} cm</div>
                    </div>

                    {activity.weight && (
                      <div className="bg-ocean-dark/50 rounded p-2">
                        <div className="text-ocean-light text-xs">Gewicht</div>
                        <div className="text-white font-semibold">
                          {activity.weight > 1000
                            ? `${(activity.weight / 1000).toFixed(2)} kg`
                            : `${activity.weight} g`}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Location */}
                  {activity.location && (
                    <div className="flex items-center gap-2 text-ocean-light text-sm mb-4">
                      <MapPin className="w-4 h-4" />
                      <span className="truncate">{activity.location}</span>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-4 pt-4 border-t border-ocean-light/20">
                    <button
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        toggleLike(activity.id)
                      }}
                      className={`flex items-center gap-2 transition-all ${
                        activity.user_has_liked
                          ? 'text-red-400 scale-110'
                          : 'text-ocean-light hover:text-red-400 hover:scale-105'
                      }`}
                    >
                      <Heart className={`w-5 h-5 ${activity.user_has_liked ? 'fill-current' : ''}`} />
                      <span className="text-sm font-semibold">{activity.likes_count}</span>
                    </button>

                    <div className="flex items-center gap-2 text-ocean-light">
                      <MessageCircle className="w-5 h-5" />
                      <span className="text-sm font-semibold">{activity.comments_count}</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
