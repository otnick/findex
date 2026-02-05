import speciesInfo from '@/public/fish/species_info.json'

export type WaterType = 'fresh' | 'salt' | 'both'
export type FishType = 'predator' | 'peace'

export interface SpeciesTags {
  water?: WaterType
  type?: FishType
}

type RawSpeciesInfo = {
  name_de?: string
  wasser?: string[]
  typ?: string
}

const SPECIES_TAGS: Record<string, SpeciesTags> = Object.values(
  speciesInfo as Record<string, RawSpeciesInfo>
).reduce((acc, info) => {
  if (!info?.name_de) return acc

  const waters = Array.isArray(info.wasser) ? info.wasser : []
  const hasFresh = waters.includes('süßwasser')
  const hasSalt = waters.includes('salzwasser')
  const water: WaterType | undefined = hasFresh && hasSalt
    ? 'both'
    : hasFresh
      ? 'fresh'
      : hasSalt
        ? 'salt'
        : undefined

  const type: FishType | undefined = info.typ === 'raubfisch'
    ? 'predator'
    : info.typ === 'friedfisch'
      ? 'peace'
      : undefined

  acc[normalizeSpeciesName(info.name_de)] = { water, type }
  return acc
}, {} as Record<string, SpeciesTags>)

export function normalizeSpeciesName(name: string) {
  return name
    .toLowerCase()
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function getSpeciesTags(name: string): SpeciesTags | undefined {
  const normalized = normalizeSpeciesName(name)
  return SPECIES_TAGS[normalized]
}
