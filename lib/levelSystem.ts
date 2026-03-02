export interface LevelDef {
  level: number
  title: string
  xpRequired: number
  emoji: string
  /** Tailwind gradient classes for hero bg */
  gradient: string
  /** Tailwind ring/accent color */
  accent: string
}

export const LEVELS: LevelDef[] = [
  { level: 1,  title: 'Uferneuling',      xpRequired: 0,      emoji: '🎣',  gradient: 'from-gray-700 to-gray-800',        accent: 'text-gray-300' },
  { level: 2,  title: 'Jungangler',       xpRequired: 150,    emoji: '🪱',  gradient: 'from-green-900 to-green-950',      accent: 'text-green-400' },
  { level: 3,  title: 'Köderkenner',      xpRequired: 400,    emoji: '🪝',  gradient: 'from-green-800 to-green-900',      accent: 'text-green-300' },
  { level: 4,  title: 'Rutenführer',      xpRequired: 800,    emoji: '🎣',  gradient: 'from-blue-900 to-blue-950',        accent: 'text-blue-300' },
  { level: 5,  title: 'Gewässerfreund',   xpRequired: 1400,   emoji: '💧',  gradient: 'from-blue-800 to-blue-900',        accent: 'text-blue-200' },
  { level: 6,  title: 'Spotsucher',       xpRequired: 2200,   emoji: '🎯',  gradient: 'from-violet-900 to-violet-950',    accent: 'text-violet-300' },
  { level: 7,  title: 'Revierkenner',     xpRequired: 3500,   emoji: '🗺️',  gradient: 'from-violet-800 to-violet-900',    accent: 'text-violet-200' },
  { level: 8,  title: 'Strömungsleser',   xpRequired: 5500,   emoji: '🌊',  gradient: 'from-yellow-800 to-amber-900',     accent: 'text-yellow-300' },
  { level: 9,  title: 'Erfahrener Angler',xpRequired: 8000,   emoji: '⭐',  gradient: 'from-yellow-700 to-amber-800',     accent: 'text-yellow-200' },
  { level: 10, title: 'Fangspezialist',   xpRequired: 12000,  emoji: '🐟',  gradient: 'from-orange-800 to-red-900',       accent: 'text-orange-300' },
  { level: 11, title: 'Trophäenangler',   xpRequired: 17000,  emoji: '🏆',  gradient: 'from-pink-900 to-rose-950',        accent: 'text-pink-300' },
  { level: 12, title: 'Gewässerprofi',    xpRequired: 25000,  emoji: '💎',  gradient: 'from-pink-800 to-pink-900',        accent: 'text-pink-200' },
  { level: 13, title: 'Angelmeister',     xpRequired: 35000,  emoji: '👑',  gradient: 'from-purple-800 to-purple-900',    accent: 'text-purple-200' },
  { level: 14, title: 'Revierexperte',    xpRequired: 50000,  emoji: '🦈',  gradient: 'from-purple-700 to-purple-800',    accent: 'text-purple-100' },
  { level: 15, title: 'Fischerlegende',   xpRequired: 75000,  emoji: '🔥',  gradient: 'from-orange-600 to-red-700',       accent: 'text-orange-100' },
]

export interface LevelInfo {
  currentLevel: LevelDef
  nextLevel: LevelDef | null
  totalXP: number
  xpInCurrentLevel: number
  xpForNextLevel: number
  progressPercent: number
}

export function getLevelInfo(totalXP: number): LevelInfo {
  let currentLevel = LEVELS[0]
  for (const level of LEVELS) {
    if (totalXP >= level.xpRequired) currentLevel = level
    else break
  }

  const currentIndex = LEVELS.indexOf(currentLevel)
  const nextLevel = currentIndex < LEVELS.length - 1 ? LEVELS[currentIndex + 1] : null

  const xpInCurrentLevel = totalXP - currentLevel.xpRequired
  const xpForNextLevel = nextLevel ? nextLevel.xpRequired - currentLevel.xpRequired : 1
  const progressPercent = nextLevel ? Math.min(100, (xpInCurrentLevel / xpForNextLevel) * 100) : 100

  return { currentLevel, nextLevel, totalXP, xpInCurrentLevel, xpForNextLevel, progressPercent }
}

export const XP_PER_CATCH = 10
export const XP_PER_SPECIES = 50
export const XP_PER_SHINY = 100
