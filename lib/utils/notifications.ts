interface NotificationOptions {
  title: string
  body: string
  icon?: string
  image?: string
  badge?: string
  tag?: string
  data?: any
}

class NotificationService {
  private permission: NotificationPermission = 'default'

  async requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.warn('Browser does not support notifications')
      return false
    }

    const permission = await Notification.requestPermission()
    this.permission = permission
    return permission === 'granted'
  }

  async send(options: NotificationOptions): Promise<void> {
    if (this.permission !== 'granted') {
      const granted = await this.requestPermission()
      if (!granted) return
    }

    try {
      const notification = new Notification(options.title, {
        body: options.body,
        icon: options.icon || '/icon-192x192.png',
        image: options.image,
        badge: options.badge || '/icon-192x192.png',
        tag: options.tag,
        data: options.data,
        requireInteraction: false,
        silent: false,
      })

      notification.onclick = () => {
        window.focus()
        if (options.data?.url) {
          window.location.href = options.data.url
        }
        notification.close()
      }

      setTimeout(() => notification.close(), 5000)
    } catch (error) {
      console.error('Notification error:', error)
    }
  }

  // Rich notification templates
  async newLike(username: string, catchSpecies: string, photoUrl?: string, catchId?: string): Promise<void> {
    await this.send({
      title: '❤️ Neuer Like!',
      body: `${username} hat deinen ${catchSpecies} geliked`,
      image: photoUrl,
      tag: 'like',
      data: { url: catchId ? `/catch/${catchId}` : '/catches' },
    })
  }

  async newComment(username: string, catchSpecies: string, comment: string, photoUrl?: string, catchId?: string): Promise<void> {
    await this.send({
      title: '💬 Neuer Kommentar!',
      body: `${username} zu ${catchSpecies}: "${comment.substring(0, 50)}${comment.length > 50 ? '...' : ''}"`,
      image: photoUrl,
      tag: 'comment',
      data: { url: catchId ? `/catch/${catchId}` : '/catches' },
    })
  }

  async friendRequest(username: string): Promise<void> {
    await this.send({
      title: '👥 Neue Freundschaftsanfrage!',
      body: `${username} möchte dein Freund sein`,
      tag: 'friend-request',
      data: { url: '/friends' },
    })
  }

  async friendAccepted(username: string): Promise<void> {
    await this.send({
      title: '🤝 Freundschaftsanfrage angenommen!',
      body: `${username} hat deine Anfrage angenommen`,
      tag: 'friend-accepted',
      data: { url: `/user/${username}` },
    })
  }

  async friendCatch(username: string, species: string, length: number, photoUrl?: string, catchId?: string): Promise<void> {
    await this.send({
      title: '🎣 Freund hat gefangen!',
      body: `${username} hat einen ${species} (${length}cm) gefangen!`,
      image: photoUrl,
      tag: 'friend-catch',
      data: { url: catchId ? `/catch/${catchId}` : '/social' },
    })
  }

  async dailySummary(catchCount: number, likeCount: number, commentCount: number): Promise<void> {
    const parts: string[] = []
    if (catchCount > 0) parts.push(`${catchCount} neue Fänge`)
    if (likeCount > 0) parts.push(`${likeCount} Likes`)
    if (commentCount > 0) parts.push(`${commentCount} Kommentare`)

    if (parts.length === 0) return

    await this.send({
      title: '📊 Dein Tag auf FishBox',
      body: parts.join(' • '),
      tag: 'daily-summary',
      data: { url: '/dashboard' },
    })
  }

  async achievementUnlocked(achievement: string, description: string): Promise<void> {
    await this.send({
      title: '🏆 Achievement freigeschaltet!',
      body: `${achievement}: ${description}`,
      tag: 'achievement',
      data: { url: '/profile' },
    })
  }

  async reminder(title: string, body: string): Promise<void> {
    await this.send({
      title: `⏰ ${title}`,
      body,
      tag: 'reminder',
    })
  }

  async testNotification(): Promise<void> {
    await this.send({
      title: '🎣 FishBox Benachrichtigungen',
      body: 'Du erhältst jetzt Updates zu Likes, Kommentaren und mehr!',
      tag: 'test',
    })
  }
}

export const notificationService = new NotificationService()

export function getNotificationPreference(): boolean {
  if (typeof window === 'undefined') return false
  return localStorage.getItem('notifications-enabled') === 'true'
}

export function setNotificationPreference(enabled: boolean): void {
  if (typeof window === 'undefined') return
  localStorage.setItem('notifications-enabled', enabled ? 'true' : 'false')
}
