'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { useCatchStore } from '@/lib/store'
import { format } from 'date-fns'
import { de } from 'date-fns/locale'
import { User, Calendar, Fish, Award, Heart, MessageCircle, ArrowLeft, Settings, Star, GripVertical, X, UserPlus, UserCheck, BarChart3, Zap } from 'lucide-react'
import { getLevelInfo, XP_PER_CATCH, XP_PER_SPECIES, XP_PER_SHINY } from '@/lib/levelSystem'
import VerificationBadge from '@/components/VerificationBadge'
import LoadingSkeleton from '@/components/LoadingSkeleton'
import EmptyState from '@/components/EmptyState'
import { useToast } from '@/components/ToastProvider'
import Avatar from '@/components/Avatar'
import HolographicCard from '@/components/HolographicCard'

interface UserProfile {
  id: string
  username: string
  bio?: string
  avatar_url?: string | null
  created_at: string
  pinned_catch_ids?: string[]
}

interface PublicCatch {
  id: string
  species: string
  length: number
  weight?: number
  photo_url?: string
  date: string
  likes_count: number
  comments_count: number
  is_shiny?: boolean
  shiny_reason?: string | null
  verification_status?: 'pending' | 'verified' | 'rejected' | 'manual'
  ai_verified?: boolean
}

export default function UserProfileClient({ id }: { id: string }) {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [catches, setCatches] = useState<PublicCatch[]>([])
  const [pinnedCatches, setPinnedCatches] = useState<PublicCatch[]>([])
  const [pinnedCatchIds, setPinnedCatchIds] = useState<string[]>([])
  const [pinSaving, setPinSaving] = useState(false)
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [showPublicOnly, setShowPublicOnly] = useState(true)
  const [stats, setStats] = useState({
    totalCatches: 0,
    uniqueSpecies: 0,
    biggestCatch: 0,
    totalWeight: 0,
    shinyCount: 0,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [friendshipStatus, setFriendshipStatus] = useState<'none' | 'pending_sent' | 'pending_received' | 'accepted'>('none')
  const currentUser = useCatchStore((state) => state.user)
  const { toast } = useToast()

  useEffect(() => {
    fetchProfile()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, showPublicOnly, currentUser?.id])

  const fetchProfile = async () => {
    try {
      // Get profile by username
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single()

      if (profileError) throw profileError

      setProfile(profileData)

      if (currentUser && currentUser.id !== profileData.id) {
        const { data: friendships } = await supabase
          .from('friendships')
          .select('status, user_id')
          .or(`and(user_id.eq.${currentUser.id},friend_id.eq.${profileData.id}),and(user_id.eq.${profileData.id},friend_id.eq.${currentUser.id})`)

        if (!friendships || friendships.length === 0) {
          setFriendshipStatus('none')
        } else if (friendships.some(f => f.status === 'accepted')) {
          setFriendshipStatus('accepted')
        } else {
          const pending = friendships.find(f => f.status === 'pending')
          setFriendshipStatus(pending?.user_id === currentUser.id ? 'pending_sent' : 'pending_received')
        }
      }

      const isOwnProfile = currentUser?.id === profileData.id
      const publicOnly = !isOwnProfile || showPublicOnly
      const pinnedIds = (profileData.pinned_catch_ids || []).filter(Boolean)
      setPinnedCatchIds(pinnedIds.slice(0, 6))

      // Get catches
      let catchesQuery = supabase
        .from('catches')
        .select('*')
        .eq('user_id', profileData.id)
        .order('date', { ascending: false })

      if (publicOnly) {
        catchesQuery = catchesQuery.eq('is_public', true)
      }

      const { data: catchesData, error: catchesError } = await catchesQuery

      if (catchesError) throw catchesError

      // Batch-fetch likes and comments counts
      let enrichedCatches: PublicCatch[] = catchesData
      if (catchesData.length > 0) {
        const catchIds = catchesData.map((c: any) => c.id)
        const [{ data: likesData }, { data: commentsData }] = await Promise.all([
          supabase.from('catch_likes').select('catch_id').in('catch_id', catchIds),
          supabase.from('catch_comments').select('catch_id').in('catch_id', catchIds),
        ])
        const likesMap = new Map<string, number>()
        const commentsMap = new Map<string, number>()
        ;(likesData || []).forEach((l: any) => likesMap.set(l.catch_id, (likesMap.get(l.catch_id) || 0) + 1))
        ;(commentsData || []).forEach((c: any) => commentsMap.set(c.catch_id, (commentsMap.get(c.catch_id) || 0) + 1))
        enrichedCatches = catchesData.map((c: any) => ({
          ...c,
          likes_count: likesMap.get(c.id) || 0,
          comments_count: commentsMap.get(c.id) || 0,
        }))
      }

      setCatches(enrichedCatches)
      if (pinnedIds.length > 0) {
        const orderedPinned = pinnedIds
          .map((id: string) => enrichedCatches.find((catchItem: PublicCatch) => catchItem.id === id))
          .filter(Boolean) as PublicCatch[]
        setPinnedCatches(orderedPinned)
      } else {
        setPinnedCatches([])
      }

      // Calculate stats
      const uniqueSpecies = new Set(catchesData.map(c => c.species)).size
      const biggestCatch = Math.max(...catchesData.map(c => c.length), 0)
      const totalWeight = catchesData.reduce((sum, c) => sum + (c.weight || 0), 0)
      const shinyCount = catchesData.filter((c) => c.is_shiny).length

      setStats({
        totalCatches: catchesData.length,
        uniqueSpecies,
        biggestCatch,
        totalWeight,
        shinyCount,
      })

    } catch (err) {
      console.error('Error fetching profile:', err)
      setError(true)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <LoadingSkeleton type="card" />
        <LoadingSkeleton type="grid" />
      </div>
    )
  }

  if (error || !profile) {
    return (
      <div className="space-y-6">
        <EmptyState
          icon={User}
          title="Benutzer nicht gefunden"
          description="Dieser Benutzer existiert nicht oder ist privat."
          actionLabel="Zurück zum Feed"
          actionHref="/social"
        />
      </div>
    )
  }

  const isOwnProfile = currentUser?.id === profile.id

  const levelInfo = getLevelInfo(
    stats.totalCatches * XP_PER_CATCH +
    stats.uniqueSpecies * XP_PER_SPECIES +
    stats.shinyCount * XP_PER_SHINY
  )

  const savePinnedCatchIds = async (nextPinned: string[]) => {
    if (!currentUser) return
    setPinSaving(true)
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          pinned_catch_ids: nextPinned,
          updated_at: new Date().toISOString(),
        })
        .eq('id', currentUser.id)

      if (error) throw error
      setPinnedCatchIds(nextPinned)
      const orderedPinned = nextPinned
        .map((id) => catches.find((catchItem) => catchItem.id === id))
        .filter(Boolean) as PublicCatch[]
      setPinnedCatches(orderedPinned)
    } catch (error: any) {
      toast('Fehler beim Speichern der Vitrine: ' + error.message, 'error')
    } finally {
      setPinSaving(false)
    }
  }

  const handleUnpin = async (catchId: string) => {
    const nextPinned = pinnedCatchIds.filter((id) => id !== catchId)
    await savePinnedCatchIds(nextPinned)
  }

  const handleDragStart = (event: React.DragEvent<HTMLDivElement>, catchId: string) => {
    event.dataTransfer.setData('text/plain', catchId)
    event.dataTransfer.effectAllowed = 'move'
    setDraggingId(catchId)
  }

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = async (event: React.DragEvent<HTMLDivElement>, targetId: string) => {
    event.preventDefault()
    const sourceId = event.dataTransfer.getData('text/plain')
    if (!sourceId || sourceId === targetId) return

    const fromIndex = pinnedCatchIds.indexOf(sourceId)
    const toIndex = pinnedCatchIds.indexOf(targetId)
    if (fromIndex === -1 || toIndex === -1) return

    const nextPinned = [...pinnedCatchIds]
    const [moved] = nextPinned.splice(fromIndex, 1)
    nextPinned.splice(toIndex, 0, moved)
    setPinnedCatchIds(nextPinned)
    await savePinnedCatchIds(nextPinned)
  }

  const handleDragEnd = () => {
    setDraggingId(null)
  }

  const sendFriendRequest = async () => {
    if (!currentUser || !profile) return
    try {
      const { error } = await supabase
        .from('friendships')
        .insert({ user_id: currentUser.id, friend_id: profile.id, status: 'pending' })
      if (error) throw error
      setFriendshipStatus('pending_sent')
      toast('Freundschaftsanfrage gesendet!', 'success')
    } catch (error: any) {
      if (error.code === '23505') {
        setFriendshipStatus('pending_sent')
        toast('Anfrage bereits gesendet!', 'info')
      } else {
        toast('Fehler beim Senden der Anfrage', 'error')
      }
    }
  }

  const showcaseSlots = Array.from({ length: 6 }, (_, index) => pinnedCatches[index] || null)

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Link
          href="/social"
          className="flex items-center gap-2 text-ocean-light hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Zurück
        </Link>
        {isOwnProfile ? (
          <Link
            href="/settings"
            className="flex items-center gap-2 text-ocean-light hover:text-white text-sm transition-colors"
          >
            <Settings className="w-4 h-4" />
            Einstellungen
          </Link>
        ) : currentUser && (
          <>
            {friendshipStatus === 'none' && (
              <button
                onClick={sendFriendRequest}
                className="flex items-center gap-2 text-sm px-3 py-1.5 rounded-lg bg-white/[0.10] hover:bg-white/[0.18] border border-white/[0.15] text-white/70 hover:text-white transition-colors"
              >
                <UserPlus className="w-4 h-4" />
                Anfrage senden
              </button>
            )}
            {friendshipStatus === 'pending_sent' && (
              <span className="flex items-center gap-2 text-sm text-ocean-light/60">
                <UserPlus className="w-4 h-4" />
                Anfrage gesendet
              </span>
            )}
            {friendshipStatus === 'pending_received' && (
              <span className="flex items-center gap-2 text-sm text-ocean-light/60">
                <UserCheck className="w-4 h-4" />
                Möchte Freund sein
              </span>
            )}
            {friendshipStatus === 'accepted' && (
              <span className="flex items-center gap-2 text-sm text-ocean-light">
                <UserCheck className="w-4 h-4" />
                Befreundet
              </span>
            )}
          </>
        )}
      </div>

      {/* Profile Card */}
      <div className="bg-white/[0.07] backdrop-blur-xl rounded-xl p-8 border border-white/[0.12] shadow-xl relative overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent pointer-events-none" />
        <div className="flex items-start gap-6">
          {/* Avatar */}
          <div className="w-24 h-24 flex-shrink-0 shadow-lg rounded-full ring-2 ring-white/20">
            <Avatar
              seed={profile.username || profile.id}
              src={profile.avatar_url}
              size={96}
              className="w-24 h-24"
              alt={`@${profile.username}`}
            />
          </div>

          {/* Info */}
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-white mb-2">
              @{profile.username}
            </h1>
            {profile.bio && (
              <p className="text-ocean-light mb-4">{profile.bio}</p>
            )}
            <div className="flex items-center gap-2 text-ocean-light text-sm">
              <Calendar className="w-4 h-4" />
              Mitglied seit {format(new Date(profile.created_at), 'MMMM yyyy', { locale: de })}
            </div>
            {/* Level Badge */}
            <Link
              href={isOwnProfile ? '/fishdex/achievements' : '#'}
              className={`inline-flex items-center gap-2 mt-3 px-3 py-1.5 rounded-full bg-gradient-to-r ${levelInfo.currentLevel.gradient} border border-white/20 hover:scale-105 transition-transform ${isOwnProfile ? 'cursor-pointer' : 'cursor-default pointer-events-none'}`}
            >
              <span className="text-base">{levelInfo.currentLevel.emoji}</span>
              <span className={`text-xs font-bold ${levelInfo.currentLevel.accent}`}>Lv.{levelInfo.currentLevel.level}</span>
              <span className="text-white/80 text-xs font-semibold">{levelInfo.currentLevel.title}</span>
              {isOwnProfile && <Zap className="w-3 h-3 text-yellow-400" />}
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-6 pt-6 border-t border-white/[0.08]">
          <div className="bg-white/[0.08] border border-white/[0.10] rounded-lg p-4">
            <div className="flex items-center gap-2 text-ocean-light text-sm mb-1">
              <Fish className="w-4 h-4" />
              Fänge
            </div>
            <div className="text-2xl font-bold text-white">{stats.totalCatches}</div>
          </div>
          <div className="bg-white/[0.08] border border-white/[0.10] rounded-lg p-4">
            <div className="flex items-center gap-2 text-ocean-light text-sm mb-1">
              <Award className="w-4 h-4" />
              Arten
            </div>
            <div className="text-2xl font-bold text-white">{stats.uniqueSpecies}</div>
          </div>
          <div className="bg-white/[0.08] border border-white/[0.10] rounded-lg p-4">
            <div className="text-ocean-light text-sm mb-1">Größter</div>
            <div className="text-2xl font-bold text-white">{stats.biggestCatch} cm</div>
          </div>
          <div className="bg-white/[0.08] border border-white/[0.10] rounded-lg p-4">
            <div className="text-ocean-light text-sm mb-1">Gewicht</div>
            <div className="text-2xl font-bold text-white">
              {(stats.totalWeight / 1000).toFixed(1)} kg
            </div>
          </div>
          <div className="bg-white/[0.08] border border-white/[0.10] rounded-lg p-4">
            <div className="flex items-center gap-2 text-ocean-light text-sm mb-1">
              <Star className="w-4 h-4 text-yellow-300" />
              Trophäen
            </div>
            <div className="text-2xl font-bold text-white">{stats.shinyCount}</div>
          </div>
        </div>

        {isOwnProfile && (
          <div className="mt-4 pt-4 border-t border-white/[0.06]">
            <Link
              href="/stats"
              className="inline-flex items-center gap-2 text-sm text-ocean-light hover:text-white transition-colors"
            >
              <BarChart3 className="w-4 h-4" />
              Detaillierte Statistiken ansehen →
            </Link>
          </div>
        )}
      </div>

      {/* Showcase */}
      {(isOwnProfile || pinnedCatches.length > 0) && (
        <div className="bg-white/[0.07] backdrop-blur-xl border border-white/[0.10] rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Star className="w-5 h-5 text-yellow-400" />
              Vitrine
            </h2>
            <div className="text-ocean-light text-sm">{pinnedCatches.length}/6</div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {(isOwnProfile ? showcaseSlots : pinnedCatches).map((catchData, index) =>
              catchData ? (
                <HolographicCard key={catchData.id} enabled={!!catchData.is_shiny} isLegendary={catchData.shiny_reason === 'legendary'}>
                <div
                  draggable={isOwnProfile}
                  onDragStart={(event) => isOwnProfile && handleDragStart(event, catchData.id)}
                  onDragOver={(event) => isOwnProfile && handleDragOver(event)}
                  onDrop={(event) => isOwnProfile && handleDrop(event, catchData.id)}
                  onDragEnd={() => isOwnProfile && handleDragEnd()}
                  className={`bg-white/[0.07] backdrop-blur-xl border border-white/[0.10] rounded-xl overflow-hidden transition-all duration-300 ${
                    isOwnProfile ? 'hover:bg-white/[0.12] hover:shadow-xl hover:scale-[1.02]' : 'hover:bg-white/[0.12]'
                  } ${draggingId === catchData.id ? 'ring-2 ring-white/40' : ''} ${
                    catchData.is_shiny ? (catchData.shiny_reason === 'legendary' ? 'legendary-ring' : 'shiny-ring') : ''
                  }`}
                >
                  <Link href={`/catch/${catchData.id}`}>
                    {catchData.photo_url ? (
                      <div className="relative h-40 bg-white/[0.05]">
                        <Image
                          src={catchData.photo_url}
                          alt={catchData.species}
                          fill
                          sizes="100vw"
                          className="object-cover"
                        />
                        <VerificationBadge
                          status={catchData.verification_status}
                          aiVerified={catchData.ai_verified}
                          className="absolute top-2 left-2"
                        />
                        {catchData.is_shiny && (
                          <div className={`absolute top-2 right-2 ${catchData.shiny_reason === 'legendary' ? 'legendary-badge text-white' : 'shiny-badge text-black'} rounded-full p-2 shadow-lg group`}>
                            <Star className="w-4 h-4" />
                            <div className="absolute bottom-full mb-2 right-0 bg-black/90 text-white text-xs px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                              {catchData.shiny_reason === 'legendary'
                                ? 'Legendär • Rekord'
                                : `Trophäe${catchData.shiny_reason ? ` • ${catchData.shiny_reason === 'trophy' ? 'Rekord' : 'Glück'}` : ''}`}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="h-40 bg-white/[0.05] flex items-center justify-center relative">
                        <Fish className="w-10 h-10 text-ocean-light/50" />
                        {catchData.is_shiny && (
                          <div className={`absolute top-2 right-2 ${catchData.shiny_reason === 'legendary' ? 'legendary-badge text-white' : 'shiny-badge text-black'} rounded-full p-2 shadow-lg group`}>
                            <Star className="w-4 h-4" />
                            <div className="absolute bottom-full mb-2 right-0 bg-black/90 text-white text-xs px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                              {catchData.shiny_reason === 'legendary'
                                ? 'Legendär • Rekord'
                                : `Trophäe${catchData.shiny_reason ? ` • ${catchData.shiny_reason === 'trophy' ? 'Rekord' : 'Glück'}` : ''}`}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </Link>
                  <div className="p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-lg font-bold text-white">{catchData.species}</h3>
                      {!catchData.photo_url && (
                        <VerificationBadge
                          status={catchData.verification_status}
                          aiVerified={catchData.ai_verified}
                          className="ml-1"
                        />
                      )}
                    </div>
                    <div className="text-ocean-light text-sm mb-3">
                      {catchData.length} cm
                      {catchData.weight && ` • ${catchData.weight > 1000 
                        ? `${(catchData.weight / 1000).toFixed(2)} kg`
                        : `${catchData.weight} g`
                      }`}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-ocean-light">
                      <span className="flex items-center gap-1">
                        <Heart className="w-4 h-4" />
                        {catchData.likes_count || 0}
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageCircle className="w-4 h-4" />
                        {catchData.comments_count || 0}
                      </span>
                      <span className="ml-auto">
                        {format(new Date(catchData.date), 'dd.MM.yyyy')}
                      </span>
                    </div>
                    {isOwnProfile && (
                      <div className="mt-3 flex items-center gap-2 text-ocean-light">
                        <GripVertical className="w-4 h-4" />
                        <button
                          onClick={() => handleUnpin(catchData.id)}
                          disabled={pinSaving}
                          className="p-1 rounded-md hover:bg-red-900/30 text-red-300 transition-colors disabled:opacity-60"
                          aria-label="Aus Vitrine entfernen"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                </HolographicCard>
              ) : (
                <div
                  key={`slot-${index}`}
                  className="border border-dashed border-white/[0.12] rounded-xl p-4 flex items-center justify-center text-white/30 text-sm bg-white/[0.03]"
                >
                  Leerer Platz
                </div>
              )
            )}
          </div>
          {isOwnProfile && pinnedCatches.length === 0 && (
            <div className="text-ocean-light text-sm mt-3">
              Du hast noch keine Fänge gepinnt. Gehe zu deinen Fängen und pinne bis zu 6 öffentliche Highlights.
            </div>
          )}
          {isOwnProfile && (
            <div className="text-ocean-light text-xs mt-3">
              Ziehe die Karten, um die Reihenfolge festzulegen. Nur öffentliche Fänge können angezeigt werden.
            </div>
          )}
        </div>
      )}

      {/* Gallery header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Fish className="w-5 h-5 text-ocean-light" />
          Galerie ({catches.length})
        </h2>
        {isOwnProfile && (
          <label className="inline-flex cursor-pointer items-center gap-2">
            <span className="text-ocean-light text-sm">Nur öffentlich</span>
            <input
              type="checkbox"
              className="sr-only"
              checked={showPublicOnly}
              onChange={() => setShowPublicOnly(prev => !prev)}
            />
            <span
              className={`relative inline-flex h-6 w-11 items-center rounded-full border transition-colors shadow-inner ${
                showPublicOnly ? 'bg-green-500/90 border-green-400/60' : 'bg-gray-700 border-gray-500/60'
              }`}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                  showPublicOnly ? 'translate-x-5' : 'translate-x-1'
                }`}
              />
            </span>
          </label>
        )}
      </div>

      {/* Gallery */}
      <div>
          {catches.length === 0 ? (
            <EmptyState
              icon={Fish}
              title={
                isOwnProfile
                  ? showPublicOnly
                    ? 'Keine öffentlichen Fänge'
                    : 'Keine Fänge'
                  : 'Noch keine öffentlichen Fänge'
              }
              description={
                isOwnProfile
                  ? showPublicOnly
                    ? 'Mache deine Fänge Öffentlich, um sie hier zu zeigen.'
                    : 'Du hast noch keine Fänge gespeichert.'
                  : 'Dieser Angler hat noch keine öffentlichen Fänge geteilt.'
              }
              actionLabel={isOwnProfile ? 'Zu meinen Fängen' : undefined}
              actionHref={isOwnProfile ? '/catches' : undefined}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {catches.map((catchData) => (
                <Link key={catchData.id} href={`/catch/${catchData.id}`}>
                  <div className="bg-white/[0.07] backdrop-blur-xl border border-white/[0.10] rounded-xl overflow-hidden hover:bg-white/[0.12] transition-all duration-300 cursor-pointer hover:shadow-xl hover:scale-105 animate-slide-up">
                    {catchData.photo_url ? (
                      <div className="relative h-48 bg-white/[0.05]">
                        <Image
                          src={catchData.photo_url}
                          alt={catchData.species}
                          fill
                          sizes="100vw"
            className="object-cover"
                        />
                        <VerificationBadge
                          status={catchData.verification_status}
                          aiVerified={catchData.ai_verified}
                          className="absolute top-2 left-2"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-ocean-deeper/60 to-transparent opacity-0 hover:opacity-100 transition-opacity" />
                      </div>
                    ) : (
                      <div className="h-48 bg-white/[0.05] flex items-center justify-center">
                        <Fish className="w-12 h-12 text-ocean-light/50" />
                      </div>
                    )}

                    <div className="p-4">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-lg font-bold text-white">
                        {catchData.species}
                        </h3>
                        {!catchData.photo_url && (
                          <VerificationBadge
                            status={catchData.verification_status}
                            aiVerified={catchData.ai_verified}
                            className="ml-1"
                          />
                        )}
                      </div>
                      <div className="text-ocean-light text-sm mb-3">
                        {catchData.length} cm
                        {catchData.weight && ` • ${catchData.weight > 1000 
                          ? `${(catchData.weight / 1000).toFixed(2)} kg`
                          : `${catchData.weight} g`
                        }`}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-ocean-light">
                        <span className="flex items-center gap-1">
                          <Heart className="w-4 h-4" />
                          {catchData.likes_count || 0}
                        </span>
                        <span className="flex items-center gap-1">
                          <MessageCircle className="w-4 h-4" />
                          {catchData.comments_count || 0}
                        </span>
                        <span className="ml-auto">
                          {format(new Date(catchData.date), 'dd.MM.yyyy')}
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
    </div>
  )
}


