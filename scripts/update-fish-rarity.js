/* eslint-disable no-console */
const fs = require('fs')
const path = require('path')
const { createClient } = require('@supabase/supabase-js')

const args = process.argv.slice(2)
const shouldConfirm = args.includes('--confirm')
const tableArg = args.find((a) => a.startsWith('--table='))
const tableName = tableArg ? tableArg.split('=')[1] : 'fish_species'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const SERVICE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SERVICE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  ""
//  Fish API Configuration

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

const latinToRarity = {}
const germanToRarity = {}

Object.entries(speciesInfo).forEach(([latin, info]) => {
  if (!info || typeof info.schwierigkeit !== 'number') return
  const rarity = Math.max(1, Math.min(5, info.schwierigkeit))
  latinToRarity[latin.toLowerCase()] = rarity
  if (info.name_de) {
    germanToRarity[normalizeName(info.name_de)] = rarity
  }
})

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false },
})

async function run() {
  console.log(`Table: ${tableName}`)
  console.log(`Mode: ${shouldConfirm ? 'UPDATE' : 'DRY-RUN'}`)

  const { data: rows, error } = await supabase
    .from(tableName)
    .select('id, name, scientific_name, rarity')

  if (error) {
    console.error('Failed to read table:', error.message)
    process.exit(1)
  }

  const updates = []

  for (const row of rows || []) {
    const scientific = row.scientific_name ? String(row.scientific_name).toLowerCase() : ''
    const german = row.name ? normalizeName(String(row.name)) : ''
    const desired =
      (scientific && latinToRarity[scientific]) ||
      (german && germanToRarity[german]) ||
      undefined

    if (!desired) continue

    if (row.rarity !== desired) {
      updates.push({ id: row.id, rarity: desired })
    }
  }

  console.log(`Found ${updates.length} rows to update.`)

  if (!shouldConfirm) {
    console.log('Dry-run sample (first 10):')
    console.log(updates.slice(0, 10))
    console.log('Run with --confirm to apply.')
    return
  }

  let totalUpdated = 0
  for (const row of updates) {
    const { error: updateError } = await supabase
      .from(tableName)
      .update({ rarity: row.rarity })
      .eq('id', row.id)

    if (updateError) {
      console.error('Update failed:', updateError.message)
      process.exit(1)
    }

    totalUpdated += 1
    if (totalUpdated % 50 === 0 || totalUpdated === updates.length) {
      console.log(`Updated ${totalUpdated}/${updates.length}`)
    }
  }

  console.log('Done.')
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
