'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import type { FishSpecies, Achievement } from '@/lib/types/fishdex'
import { getSpeciesRarity } from '@/lib/utils/speciesInfo'
import { Trophy, Star, ArrowRight, Radio, PartyPopper, Fish as FishIcon, X } from 'lucide-react'

interface ScanAnimationProps {
  species: FishSpecies
  newAchievements?: Achievement[]
  onClose: () => void
}

export default function ScanAnimation({ species, newAchievements = [], onClose }: ScanAnimationProps) {
  const [stage, setStage] = useState<'scanning' | 'reveal' | 'achievements'>('scanning')
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    console.log('ScanAnimation mounted', { species: species.name, achievements: newAchievements.length })
    return () => console.log('ScanAnimation unmounted')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (stage === 'scanning') {
      const interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval)
            setTimeout(() => setStage('reveal'), 300)
            return 100
          }
          return prev + 2
        })
      }, 30)
      return () => clearInterval(interval)
    }
  }, [stage])

  useEffect(() => {
    if (stage === 'reveal' && newAchievements.length > 0) {
      const timer = setTimeout(() => setStage('achievements'), 3000)
      return () => clearTimeout(timer)
    }
  }, [stage, newAchievements.length])

  const renderRarityStars = (value: number) => (
    <span className="inline-flex items-center gap-1">
      {Array.from({ length: value }).map((_, idx) => (
        <Star key={`rarity-star-${idx}`} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
      ))}
    </span>
  )

  const rarity = getSpeciesRarity({
    scientificName: species.scientific_name,
    germanName: species.name,
    fallback: species.rarity,
  })

  const getRegionLabel = (regions: string[]) => {
    if (regions.includes('deutschland')) return 'Deutschland'
    if (regions.includes('europa')) return 'Europa'
    return 'Weltweit'
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      {/* Card */}
      <div className="relative w-full max-w-sm max-h-[80dvh] overflow-x-hidden overflow-y-auto bg-ocean-deeper rounded-2xl shadow-2xl animate-catchModalIn">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-ocean-light hover:text-white transition-colors z-10 w-8 h-8 flex items-center justify-center rounded-full bg-ocean-dark/50"
          aria-label="Schließen"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-5">
          {/* Scanning Stage */}
          {stage === 'scanning' && (
            <div className="text-center py-4">
              <div className="mb-4 flex justify-center">
                <Radio className="w-10 h-10 text-ocean-light animate-bounce" />
              </div>
              <h2 className="text-xl font-bold text-white mb-1">Scanne Fischart...</h2>
              <p className="text-ocean-light text-sm mb-5">Analysiere DNA-Muster</p>

              <div className="w-full bg-ocean-dark rounded-full h-3 overflow-hidden mb-2">
                <div
                  className="bg-gradient-to-r from-ocean-light via-green-400 to-ocean h-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="text-ocean-light text-xs">{progress}%</div>

              <div className="relative h-20 mt-5 overflow-hidden rounded-lg">
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-ocean-light/20 to-transparent animate-scan" />
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-green-400/20 to-transparent animate-scan-slow" />
              </div>
            </div>
          )}

          {/* Reveal Stage */}
          {stage === 'reveal' && (
            <div className="text-center relative">
              {/* Confetti */}
              <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
                {[...Array(14)].map((_, i) => (
                  <span
                    key={i}
                    className="absolute animate-confetti"
                    style={{
                      left: `${(i * 37 + 11) % 100}%`,
                      animationDelay: `${(i * 0.13) % 1.2}s`,
                      animationDuration: `${1.2 + (i % 4) * 0.25}s`,
                      fontSize: i % 3 === 0 ? '1.2rem' : '0.9rem',
                    }}
                  >
                    {['⭐', '✨', '🎉', '🐟', '💫'][i % 5]}
                  </span>
                ))}
              </div>

              <div className="mb-4">
                <PartyPopper className="w-10 h-10 text-yellow-400 mx-auto mb-2 animate-bounce" />
                <h2 className="text-2xl font-bold text-white mb-1">NEUE ENTDECKUNG!</h2>
                <div className="inline-flex items-center gap-1.5 bg-green-900/30 text-green-400 px-3 py-1.5 rounded-full text-sm">
                  <Star className="w-4 h-4" />
                  <span className="font-bold">ERSTFANG!</span>
                </div>
              </div>

              {/* Species Card */}
              <div className="bg-ocean/30 rounded-xl p-4 mb-4 ring-1 ring-yellow-400/40">
                <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-ocean-dark mb-3">
                  {species.image_url ? (
                    <Image src={species.image_url} alt={species.name} fill sizes="100vw" className="object-contain" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <FishIcon className="w-16 h-16 text-ocean-light" />
                    </div>
                  )}
                </div>
                <h3 className="text-xl font-bold text-white mb-1">{species.name}</h3>
                {species.scientific_name && (
                  <p className="text-ocean-light text-xs italic mb-2">{species.scientific_name}</p>
                )}
                <div className="flex items-center justify-center gap-2">
                  <span className="text-ocean-light text-xs">Seltenheit:</span>
                  <span className="text-yellow-400">{renderRarityStars(rarity)}</span>
                </div>
              </div>

              <div className="bg-ocean-dark/50 rounded-lg px-4 py-2.5 mb-4 text-sm">
                <span className="text-green-400 font-bold">+100 XP</span>
                <span className="text-ocean-light ml-2">· +1 FinDex ({getRegionLabel(species.region || [])})</span>
              </div>

              <div className="flex gap-3">
                <Link
                  href={`/fishdex/${species.id}`}
                  onClick={onClose}
                  className="flex-1 bg-ocean hover:bg-ocean-light text-white font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm"
                >
                  Zur FinDex <ArrowRight className="w-4 h-4" />
                </Link>
                {newAchievements.length === 0 && (
                  <button
                    onClick={onClose}
                    className="px-5 py-3 bg-ocean-dark hover:bg-ocean text-white rounded-lg transition-colors text-sm"
                  >
                    Fertig
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Achievements Stage */}
          {stage === 'achievements' && newAchievements.length > 0 && (
            <div className="text-center">
              <Trophy className="w-12 h-12 text-yellow-400 mx-auto mb-2 animate-bounce" />
              <h2 className="text-xl font-bold text-white mb-4">ERFOLG FREIGESCHALTET!</h2>

              <div className="space-y-3 mb-4">
                {newAchievements.map(achievement => (
                  <div
                    key={achievement.id}
                    className="bg-ocean/30 rounded-xl p-4 border border-yellow-400/30"
                  >
                    <Trophy className="w-7 h-7 text-yellow-400 mx-auto mb-2" />
                    <h3 className="text-base font-bold text-white mb-1">{achievement.name}</h3>
                    <p className="text-ocean-light text-xs mb-2">{achievement.description}</p>
                    <span className="inline-block bg-yellow-900/30 text-yellow-400 px-3 py-1 rounded-full text-xs font-bold">
                      +{achievement.xp_reward} XP
                    </span>
                  </div>
                ))}
              </div>

              <div className="flex gap-3">
                <Link
                  href="/fishdex/achievements"
                  onClick={onClose}
                  className="flex-1 bg-ocean hover:bg-ocean-light text-white font-semibold py-3 px-4 rounded-lg transition-colors text-sm"
                >
                  Alle Erfolge
                </Link>
                <button
                  onClick={onClose}
                  className="px-5 py-3 bg-ocean-dark hover:bg-ocean text-white rounded-lg transition-colors text-sm"
                >
                  Fertig
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes scan {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(300%); }
        }
        @keyframes scan-slow {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(300%); }
        }
        .animate-scan {
          animation: scan 2s ease-in-out infinite;
        }
        .animate-scan-slow {
          animation: scan-slow 3s ease-in-out infinite;
          animation-delay: 0.5s;
        }
      `}</style>
    </div>
  )
}
