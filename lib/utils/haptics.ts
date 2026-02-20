import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics'

async function safe(fn: () => Promise<void>) {
  try { await fn() } catch { /* web or unsupported device — silently ignore */ }
}

/** Light tap — tab switches, likes, small actions */
export const hapticLight = () => safe(() => Haptics.impact({ style: ImpactStyle.Light }))

/** Medium tap — pull-to-refresh trigger, pin/unpin */
export const hapticMedium = () => safe(() => Haptics.impact({ style: ImpactStyle.Medium }))

/** Heavy tap — destructive or important confirmations */
export const hapticHeavy = () => safe(() => Haptics.impact({ style: ImpactStyle.Heavy }))

/** Success notification — catch saved, friend accepted */
export const hapticSuccess = () => safe(() => Haptics.notification({ type: NotificationType.Success }))

/** Warning notification — errors, rejections */
export const hapticWarning = () => safe(() => Haptics.notification({ type: NotificationType.Warning }))

/** Selection changed — small UI selections */
export const hapticSelection = () => safe(() => Haptics.selectionChanged())
