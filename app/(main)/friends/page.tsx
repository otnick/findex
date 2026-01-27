'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useCatchStore } from '@/lib/store'

interface Friend {
  id: string
  friend_id: string
  friend_email: string
  status: 'pending' | 'accepted' | 'rejected'
  created_at: string
}

export default function FriendsPage() {
  const [friends, setFriends] = useState<Friend[]>([])
  const [requests, setRequests] = useState<Friend[]>([])
  const [searchEmail, setSearchEmail] = useState('')
  const [loading, setLoading] = useState(true)
  const user = useCatchStore((state) => state.user)

  useEffect(() => {
    fetchFriends()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const fetchFriends = async () => {
    if (!user) return

    try {
      // Get outgoing friendships
      const { data: outgoing } = await supabase
        .from('friendships')
        .select('*')
        .eq('user_id', user.id)

      // Get incoming friendships
      const { data: incoming } = await supabase
        .from('friendships')
        .select('*')
        .eq('friend_id', user.id)

      // Get unique user IDs
      const allUserIds = [
        ...(outgoing?.map(f => f.friend_id) || []),
        ...(incoming?.map(f => f.user_id) || []),
      ]

      // Fetch profiles
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, username')
        .in('id', allUserIds)

      const friendsList = outgoing
        ?.filter(f => f.status === 'accepted')
        .map(f => {
          const profile = profiles?.find(p => p.id === f.friend_id)
          return {
            ...f,
            friend_email: `@${profile?.username || 'angler'}`,
          }
        }) || []

      const requestsList = incoming
        ?.filter(f => f.status === 'pending')
        .map(f => {
          const profile = profiles?.find(p => p.id === f.user_id)
          return {
            ...f,
            friend_id: f.user_id,
            friend_email: `@${profile?.username || 'angler'}`,
          }
        }) || []

      setFriends(friendsList)
      setRequests(requestsList)
    } catch (error) {
      console.error('Error fetching friends:', error)
    } finally {
      setLoading(false)
    }
  }

  const sendRequest = async () => {
    if (!searchEmail.trim() || !user) return

    try {
      // Search by username or email in profiles
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, username')
        .or(`username.ilike.%${searchEmail.trim()}%`)
        .limit(1)

      if (!profiles || profiles.length === 0) {
        alert('Benutzer nicht gefunden. Suche nach Username.')
        return
      }

      const targetUser = profiles[0]

      if (targetUser.id === user.id) {
        alert('Du kannst dich nicht selbst hinzufügen')
        return
      }

      const { error } = await supabase
        .from('friendships')
        .insert({
          user_id: user.id,
          friend_id: targetUser.id,
          status: 'pending',
        })

      if (error) {
        if (error.code === '23505') {
          alert('Freundschaftsanfrage existiert bereits')
        } else {
          throw error
        }
        return
      }

      setSearchEmail('')
      alert('Freundschaftsanfrage gesendet!')
      await fetchFriends()
    } catch (error) {
      console.error('Error sending request:', error)
      alert('Fehler beim Senden')
    }
  }

  const handleRequest = async (friendshipId: string, accept: boolean) => {
    try {
      const { error } = await supabase
        .from('friendships')
        .update({ status: accept ? 'accepted' : 'rejected' })
        .eq('id', friendshipId)

      if (error) throw error

      await fetchFriends()
    } catch (error) {
      console.error('Error handling request:', error)
    }
  }

  const removeFriend = async (friendshipId: string) => {
    if (!confirm('Freund entfernen?')) return

    try {
      const { error } = await supabase
        .from('friendships')
        .delete()
        .eq('id', friendshipId)

      if (error) throw error

      await fetchFriends()
    } catch (error) {
      console.error('Error removing friend:', error)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">👥 Freunde</h1>
        <p className="text-ocean-light mt-1">Verbinde dich mit anderen Anglern</p>
      </div>

      {/* Add Friend */}
      <div className="bg-ocean/30 backdrop-blur-sm rounded-xl p-6">
        <h2 className="text-lg font-bold text-white mb-4">Freund hinzufügen</h2>
        <div className="flex gap-2">
          <input
            type="text"
            value={searchEmail}
            onChange={(e) => setSearchEmail(e.target.value)}
            placeholder="Username suchen..."
            className="flex-1 px-4 py-2 rounded-lg bg-ocean-dark text-white border border-ocean-light/30 focus:border-ocean-light focus:outline-none"
          />
          <button
            onClick={sendRequest}
            disabled={!searchEmail.trim()}
            className="bg-ocean hover:bg-ocean-light text-white font-semibold px-6 py-2 rounded-lg transition-colors disabled:opacity-50"
          >
            Anfrage senden
          </button>
        </div>
      </div>

      {/* Friend Requests */}
      {requests.length > 0 && (
        <div className="bg-ocean/30 backdrop-blur-sm rounded-xl p-6">
          <h2 className="text-lg font-bold text-white mb-4">
            Freundschaftsanfragen ({requests.length})
          </h2>
          <div className="space-y-3">
            {requests.map((request) => (
              <div
                key={request.id}
                className="flex items-center justify-between bg-ocean-dark/50 rounded-lg p-4"
              >
                <div className="font-semibold text-white">
                  {request.friend_email}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleRequest(request.id, true)}
                    className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
                  >
                    Annehmen
                  </button>
                  <button
                    onClick={() => handleRequest(request.id, false)}
                    className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
                  >
                    Ablehnen
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Friends List */}
      <div className="bg-ocean/30 backdrop-blur-sm rounded-xl p-6">
        <h2 className="text-lg font-bold text-white mb-4">
          Meine Freunde ({friends.length})
        </h2>
        {friends.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">👥</div>
            <p className="text-ocean-light">Noch keine Freunde hinzugefügt</p>
          </div>
        ) : (
          <div className="space-y-3">
            {friends.map((friend) => (
              <div
                key={friend.id}
                className="flex items-center justify-between bg-ocean-dark/50 rounded-lg p-4"
              >
                <div className="font-semibold text-white">
                  {friend.friend_email}
                </div>
                <button
                  onClick={() => removeFriend(friend.id)}
                  className="text-red-400 hover:text-red-300 text-sm transition-colors"
                >
                  Entfernen
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
