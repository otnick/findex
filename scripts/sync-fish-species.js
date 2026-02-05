/* eslint-disable no-console */
const fs = require('fs')
const path = require('path')
const { createClient } = require('@supabase/supabase-js')

const args = process.argv.slice(2)
const shouldConfirm = args.includes('--confirm')
const tableArg = args.find((a) => a.startsWith('--table='))
const tableName = tableArg ? tableArg.split('=')[1] : 'fish_species'

const DEFAULT_REGION = 'weltweit'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const SERVICE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SERVICE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Missing SUPABASE env vars.')
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const infoPath = path.join(__dirname, '..', 'public', 'fish', 'species_info.json')
const speciesInfo = JSON.parse(fs.readFileSync(infoPath, 'utf8'))

function normalizeName(name) {
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

function toHabitat(wasser) {
  const waters = Array.isArray(wasser) ? wasser : []
  const hasFresh = waters.includes('süßwasser')
  const hasSalt = waters.includes('salzwasser')
  if (hasFresh && hasSalt) return 'brackish'
  if (hasFresh) return 'freshwater'
  if (hasSalt) return 'saltwater'
  return null
}

function toRarity(schwierigkeit) {
  if (typeof schwierigkeit !== 'number' || Number.isNaN(schwierigkeit)) return null
  if (schwierigkeit < 1) return 1
  if (schwierigkeit > 5) return 5
  return schwierigkeit
}

function toBestTime(tageszeit) {
  if (!Array.isArray(tageszeit) || tageszeit.length === 0) return null
  return tageszeit.join(', ')
}

function toBaits(koeder) {
  if (!Array.isArray(koeder) || koeder.length === 0) return null
  return koeder
}

function expandRegions(regions) {
  const set = new Set(regions)
  if (set.has('deutschland')) {
    set.add('europa')
    set.add('weltweit')
  }
  if (set.has('europa')) {
    set.add('weltweit')
  }
  return Array.from(set)
}

function toRegions(region) {
  let regions = []
  if (Array.isArray(region) && region.length > 0) {
    regions = region
  } else if (typeof region === 'string' && region.trim()) {
    regions = [region.trim()]
  } else {
    regions = [DEFAULT_REGION]
  }
  return expandRegions(regions)
}

function arraysEqual(a, b) {
  if (!Array.isArray(a) && !Array.isArray(b)) return true
  if (!Array.isArray(a) || !Array.isArray(b)) return false
  if (a.length !== b.length) return false
  const aSorted = [...a].sort()
  const bSorted = [...b].sort()
  return aSorted.every((val, idx) => val === bSorted[idx])
}

const sourceRows = Object.entries(speciesInfo).map(([latin, info]) => {
  const rarity = toRarity(info.schwierigkeit)
  const regions = toRegions(info.region)
  return {
    scientific_name: latin,
    name: info.name_de,
    rarity,
    habitat: toHabitat(info.wasser),
    baits: toBaits(info.köder),
    best_time: toBestTime(info.tageszeit),
    region: regions,
  }
}).filter((row) => row.name && row.rarity)

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false },
})

async function run() {
  console.log(`Table: ${tableName}`)
  console.log(`Mode: ${shouldConfirm ? 'UPDATE/INSERT' : 'DRY-RUN'}`)
  console.log(`Region default for missing: ${DEFAULT_REGION}`)

  const { data: rows, error } = await supabase
    .from(tableName)
    .select('id, name, scientific_name, region, rarity, habitat, baits, best_time')

  if (error) {
    console.error('Failed to read table:', error.message)
    process.exit(1)
  }

  const byScientific = new Map()
  const byGerman = new Map()

  for (const row of rows || []) {
    if (row.scientific_name) {
      byScientific.set(String(row.scientific_name).toLowerCase(), row)
    }
    if (row.name) {
      byGerman.set(normalizeName(String(row.name)), row)
    }
  }

  const toInsert = []
  const toUpdate = []

  for (const src of sourceRows) {
    const scientificKey = src.scientific_name.toLowerCase()
    const germanKey = normalizeName(src.name)
    const existing = byScientific.get(scientificKey) || byGerman.get(germanKey)

    if (!existing) {
      toInsert.push({
        name: src.name,
        scientific_name: src.scientific_name,
        region: src.region,
        rarity: src.rarity,
        habitat: src.habitat,
        baits: src.baits,
        best_time: src.best_time,
      })
      continue
    }

    const changes = {}

    if (existing.rarity !== src.rarity) changes.rarity = src.rarity
    if ((existing.habitat || null) !== (src.habitat || null)) changes.habitat = src.habitat
    if (!arraysEqual(existing.baits, src.baits)) changes.baits = src.baits
    if ((existing.best_time || null) !== (src.best_time || null)) changes.best_time = src.best_time
    if (!arraysEqual(existing.region, src.region)) changes.region = src.region

    if (Object.keys(changes).length > 0) {
      toUpdate.push({ id: existing.id, changes })
    }
  }

  console.log(`To insert: ${toInsert.length}`)
  console.log(`To update: ${toUpdate.length}`)

  if (!shouldConfirm) {
    console.log('Dry-run sample inserts (first 5):')
    console.log(toInsert.slice(0, 5))
    console.log('Dry-run sample updates (first 5):')
    console.log(toUpdate.slice(0, 5))
    console.log('Run with --confirm to apply.')
    return
  }

  if (toInsert.length > 0) {
    const chunkSize = 200
    let inserted = 0
    for (let i = 0; i < toInsert.length; i += chunkSize) {
      const chunk = toInsert.slice(i, i + chunkSize)
      const { error: insertError } = await supabase
        .from(tableName)
        .insert(chunk)

      if (insertError) {
        console.error('Insert failed:', insertError.message)
        process.exit(1)
      }

      inserted += chunk.length
      console.log(`Inserted ${inserted}/${toInsert.length}`)
    }
  }

  if (toUpdate.length > 0) {
    let updated = 0
    for (const row of toUpdate) {
      const { error: updateError } = await supabase
        .from(tableName)
        .update(row.changes)
        .eq('id', row.id)

      if (updateError) {
        console.error('Update failed:', updateError.message)
        process.exit(1)
      }

      updated += 1
      if (updated % 50 === 0 || updated === toUpdate.length) {
        console.log(`Updated ${updated}/${toUpdate.length}`)
      }
    }
  }

  console.log('Done.')
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
