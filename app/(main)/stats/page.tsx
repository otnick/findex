'use client'

import { useMemo } from 'react'
import { useCatchStore } from '@/lib/store'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { format, startOfMonth, parseISO, getHours, getDay } from 'date-fns'
import { de } from 'date-fns/locale'
import { BarChart3, CloudSun } from 'lucide-react'

const COLORS = ['#4a90e2', '#2c5f8d', '#1a3a52', '#4a7c59', '#d4af37', '#c41e3a', '#8b7355']

export default function StatsPage() {
  const catches = useCatchStore((state) => state.catches)

  // Catches per Month
  const catchesPerMonth = useMemo(() => {
    const monthMap = new Map<string, number>()

    catches.forEach(c => {
      const month = format(startOfMonth(new Date(c.date)), 'MMM yyyy', { locale: de })
      monthMap.set(month, (monthMap.get(month) || 0) + 1)
    })

    return Array.from(monthMap.entries())
      .sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime())
      .slice(-6) // Last 6 months
      .map(([month, count]) => ({
        month,
        faenge: count,
      }))
  }, [catches])

  // Species Distribution
  const speciesDistribution = useMemo(() => {
    const speciesMap = new Map<string, number>()

    catches.forEach(c => {
      speciesMap.set(c.species, (speciesMap.get(c.species) || 0) + 1)
    })

    return Array.from(speciesMap.entries())
      .map(([species, count]) => ({
        name: species,
        value: count,
      }))
      .sort((a, b) => b.value - a.value)
  }, [catches])

  // Best Baits
  const baitSuccess = useMemo(() => {
    const baitMap = new Map<string, number>()

    catches.forEach(c => {
      if (c.bait) {
        baitMap.set(c.bait, (baitMap.get(c.bait) || 0) + 1)
      }
    })

    return Array.from(baitMap.entries())
      .map(([bait, count]) => ({
        koeder: bait,
        faenge: count,
      }))
      .sort((a, b) => b.faenge - a.faenge)
      .slice(0, 5)
  }, [catches])

  // Best Times (Hour of Day)
  const bestTimes = useMemo(() => {
    const hourMap = new Map<number, number>()

    catches.forEach(c => {
      const hour = getHours(new Date(c.date))
      hourMap.set(hour, (hourMap.get(hour) || 0) + 1)
    })

    const data = []
    for (let i = 0; i < 24; i++) {
      data.push({
        stunde: `${i}:00`,
        faenge: hourMap.get(i) || 0,
      })
    }

    return data
  }, [catches])

  // Average Size per Species
  const avgSizePerSpecies = useMemo(() => {
    const speciesData = new Map<string, { total: number; count: number }>()

    catches.forEach(c => {
      if (!speciesData.has(c.species)) {
        speciesData.set(c.species, { total: 0, count: 0 })
      }
      const data = speciesData.get(c.species)!
      data.total += c.length
      data.count++
    })

    return Array.from(speciesData.entries())
      .map(([species, data]) => ({
        art: species,
        durchschnitt: Math.round(data.total / data.count),
      }))
      .sort((a, b) => b.durchschnitt - a.durchschnitt)
      .slice(0, 8)
  }, [catches])

  // Weather Statistics
  const weatherStats = useMemo(() => {
    const catchesWithWeather = catches.filter(c => c.weather)
    
    if (catchesWithWeather.length === 0) return null

    // By Temperature Range
    const tempRanges = new Map<string, number>()
    catchesWithWeather.forEach(c => {
      const temp = c.weather!.temperature
      const range = temp < 10 ? '<10°C' : temp < 15 ? '10-15°C' : temp < 20 ? '15-20°C' : temp < 25 ? '20-25°C' : '25°C+'
      tempRanges.set(range, (tempRanges.get(range) || 0) + 1)
    })

    // By Weather Type
    const weatherTypes = new Map<string, number>()
    catchesWithWeather.forEach(c => {
      const desc = c.weather!.description
      weatherTypes.set(desc, (weatherTypes.get(desc) || 0) + 1)
    })

    // By weather source (historical/forecast/current)
    const sourceMap = new Map<string, number>()
    catchesWithWeather.forEach(c => {
      const source = c.weather?.source || 'unknown'
      sourceMap.set(source, (sourceMap.get(source) || 0) + 1)
    })

    const sourceEntries = Array.from(sourceMap.entries())
    const sourceLabel = (source: string) => {
      if (source === 'historical') return 'Archiv'
      if (source === 'forecast') return 'Prognose'
      if (source === 'current') return 'Aktuell'
      return 'Unbekannt'
    }

    return {
      byTemp: Array.from(tempRanges.entries())
        .map(([range, count]) => ({ bereich: range, faenge: count }))
        .sort((a, b) => b.faenge - a.faenge),
      byType: Array.from(weatherTypes.entries())
        .map(([type, count]) => ({ wetter: type, faenge: count }))
        .sort((a, b) => b.faenge - a.faenge)
        .slice(0, 5),
      avgTemp: Math.round(
        catchesWithWeather.reduce((sum, c) => sum + c.weather!.temperature, 0) / catchesWithWeather.length
      ),
      avgWind: Math.round(
        catchesWithWeather.reduce((sum, c) => sum + (c.weather!.windSpeed || 0), 0) / catchesWithWeather.length
      ),
      avgPressure: Math.round(
        catchesWithWeather.reduce((sum, c) => sum + (c.weather!.pressure || 0), 0) / catchesWithWeather.length
      ),
      avgHumidity: Math.round(
        catchesWithWeather.reduce((sum, c) => sum + (c.weather!.humidity || 0), 0) / catchesWithWeather.length
      ),
      bestTemp: Array.from(tempRanges.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] || '-',
      bySource: sourceEntries.map(([source, count]) => ({
        source,
        label: sourceLabel(source),
        faenge: count,
        anteil: Math.round((count / catchesWithWeather.length) * 100),
      })),
      historicalCount: sourceMap.get('historical') || 0,
    }
  }, [catches])

  if (catches.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
          <BarChart3 className="w-8 h-8 text-ocean-light" />
          Statistiken
        </h1>
        <div className="bg-ocean/30 backdrop-blur-sm rounded-xl p-12 text-center">
          <div className="mb-4 flex justify-center"><BarChart3 className="w-14 h-14 text-ocean-light" /></div>
          <h3 className="text-2xl font-bold text-white mb-2">
            Noch keine Daten
          </h3>
          <p className="text-ocean-light">
            Füge Fänge hinzu, um deine Statistiken zu sehen.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
          <BarChart3 className="w-8 h-8 text-ocean-light" />
          Statistiken
        </h1>
        <p className="text-ocean-light mt-1">Analyse deiner {catches.length} Fänge</p>
      </div>

      {/* Key Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-ocean/30 backdrop-blur-sm rounded-lg p-6">
          <div className="text-ocean-light text-sm">Ø Größe</div>
          <div className="text-3xl font-bold text-white mt-1">
            {Math.round(catches.reduce((sum, c) => sum + c.length, 0) / catches.length)}
          </div>
          <div className="text-ocean-light text-xs mt-1">cm</div>
        </div>

        <div className="bg-ocean/30 backdrop-blur-sm rounded-lg p-6">
          <div className="text-ocean-light text-sm">O Gewicht</div>
          <div className="text-3xl font-bold text-white mt-1">
            {catches.filter(c => c.weight).length > 0
              ? Math.round(
                  catches.filter(c => c.weight).reduce((sum, c) => sum + (c.weight || 0), 0) /
                    catches.filter(c => c.weight).length /
                    1000
                )
              : '-'}
          </div>
          <div className="text-ocean-light text-xs mt-1">kg</div>
        </div>

        <div className="bg-ocean/30 backdrop-blur-sm rounded-lg p-6">
          <div className="text-ocean-light text-sm">Top Art</div>
          <div className="text-2xl font-bold text-white mt-1">
            {speciesDistribution[0]?.name || '-'}
          </div>
          <div className="text-ocean-light text-xs mt-1">
            {speciesDistribution[0]?.value || 0}x gefangen
          </div>
        </div>

        <div className="bg-ocean/30 backdrop-blur-sm rounded-lg p-6">
          <div className="text-ocean-light text-sm">Top Köder</div>
          <div className="text-2xl font-bold text-white mt-1 truncate">
            {baitSuccess[0]?.koeder || '-'}
          </div>
          <div className="text-ocean-light text-xs mt-1">
            {baitSuccess[0]?.faenge || 0}x erfolgreich
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Catches per Month */}
        {catchesPerMonth.length > 0 && (
          <div className="bg-ocean/30 backdrop-blur-sm rounded-xl p-6">
            <h2 className="text-lg font-bold text-white mb-4">Fänge pro Monat</h2>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={catchesPerMonth}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2c5f8d" />
                <XAxis dataKey="month" stroke="#4a90e2" />
                <YAxis stroke="#4a90e2" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1a3a52', border: 'none', borderRadius: '8px' }}
                  labelStyle={{ color: '#4a90e2' }}
                />
                <Line type="monotone" dataKey="faenge" stroke="#4a90e2" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Species Distribution */}
        {speciesDistribution.length > 0 && (
          <div className="bg-ocean/30 backdrop-blur-sm rounded-xl p-6">
            <h2 className="text-lg font-bold text-white mb-4">Arten-Verteilung</h2>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={speciesDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {speciesDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#1a3a52', border: 'none', borderRadius: '8px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Best Baits */}
        {baitSuccess.length > 0 && (
          <div className="bg-ocean/30 backdrop-blur-sm rounded-xl p-6">
            <h2 className="text-lg font-bold text-white mb-4">Erfolgreichste Köder</h2>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={baitSuccess}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2c5f8d" />
                <XAxis dataKey="koeder" stroke="#4a90e2" />
                <YAxis stroke="#4a90e2" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1a3a52', border: 'none', borderRadius: '8px' }}
                />
                <Bar dataKey="faenge" fill="#4a90e2" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Best Times */}
        {bestTimes.some(t => t.faenge > 0) && (
          <div className="bg-ocean/30 backdrop-blur-sm rounded-xl p-6">
            <h2 className="text-lg font-bold text-white mb-4">Beste Fangzeiten</h2>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={bestTimes}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2c5f8d" />
                <XAxis dataKey="stunde" stroke="#4a90e2" />
                <YAxis stroke="#4a90e2" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1a3a52', border: 'none', borderRadius: '8px' }}
                />
                <Bar dataKey="faenge" fill="#2c5f8d" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Average Size per Species */}
        {avgSizePerSpecies.length > 0 && (
          <div className="bg-ocean/30 backdrop-blur-sm rounded-xl p-6 lg:col-span-2">
            <h2 className="text-lg font-bold text-white mb-4">Durchschnittsgröße pro Art</h2>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={avgSizePerSpecies}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2c5f8d" />
                <XAxis dataKey="art" stroke="#4a90e2" />
                <YAxis stroke="#4a90e2" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1a3a52', border: 'none', borderRadius: '8px' }}
                  formatter={(value) => [`${value} cm`, 'Ø Größe']}
                />
                <Bar dataKey="durchschnitt" fill="#4a7c59" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Weather Statistics */}
        {weatherStats && (
          <>
            {/* Weather Insight Card */}
            <div className="bg-ocean/30 backdrop-blur-sm rounded-xl p-6 lg:col-span-2">
              <h2 className="text-lg font-bold text-white mb-4 inline-flex items-center gap-2"><CloudSun className="w-5 h-5 text-ocean-light" />Wetter-Einblicke</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                <div>
                  <div className="text-ocean-light text-sm">O Temperatur</div>
                  <div className="text-2xl font-bold text-white">{weatherStats.avgTemp}°C</div>
                </div>
                <div>
                  <div className="text-ocean-light text-sm">Wind</div>
                  <div className="text-2xl font-bold text-white">{weatherStats.avgWind} km/h</div>
                </div>
                <div>
                  <div className="text-ocean-light text-sm">Luftdruck</div>
                  <div className="text-2xl font-bold text-white">{weatherStats.avgPressure} hPa</div>
                </div>
                <div>
                  <div className="text-ocean-light text-sm">Luftfeuchte</div>
                  <div className="text-2xl font-bold text-white">{weatherStats.avgHumidity}%</div>
                </div>
                <div>
                  <div className="text-ocean-light text-sm">Beste Temp</div>
                  <div className="text-2xl font-bold text-white">{weatherStats.bestTemp}</div>
                </div>
                <div>
                  <div className="text-ocean-light text-sm">Mit Wetter</div>
                  <div className="text-2xl font-bold text-white">
                    {catches.filter(c => c.weather).length}
                  </div>
                </div>
                <div>
                  <div className="text-ocean-light text-sm">Erfasst</div>
                  <div className="text-2xl font-bold text-white">
                    {Math.round((catches.filter(c => c.weather).length / catches.length) * 100)}%
                  </div>
                </div>
                <div>
                  <div className="text-ocean-light text-sm">Archivdaten</div>
                  <div className="text-2xl font-bold text-amber-300">{weatherStats.historicalCount}</div>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {weatherStats.bySource.map((entry) => (
                  <div
                    key={entry.source}
                    className="px-3 py-1.5 rounded-full bg-ocean-dark/60 text-xs text-ocean-light border border-ocean-light/20"
                  >
                    {entry.label}: <span className="text-white">{entry.faenge}</span> ({entry.anteil}%)
                  </div>
                ))}
              </div>
            </div>

            {/* Catches by Temperature */}
            <div className="bg-ocean/30 backdrop-blur-sm rounded-xl p-6">
              <h2 className="text-lg font-bold text-white mb-4">Fänge nach Temperatur</h2>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={weatherStats.byTemp}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2c5f8d" />
                  <XAxis dataKey="bereich" stroke="#4a90e2" />
                  <YAxis stroke="#4a90e2" />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1a3a52', border: 'none', borderRadius: '8px' }}
                  />
                  <Bar dataKey="faenge" fill="#d4af37" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Catches by Weather Type */}
            <div className="bg-ocean/30 backdrop-blur-sm rounded-xl p-6">
              <h2 className="text-lg font-bold text-white mb-4">Fänge nach Wetter</h2>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={weatherStats.byType}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2c5f8d" />
                  <XAxis dataKey="wetter" stroke="#4a90e2" />
                  <YAxis stroke="#4a90e2" />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1a3a52', border: 'none', borderRadius: '8px' }}
                  />
                  <Bar dataKey="faenge" fill="#4a7c59" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </>
        )}
      </div>
    </div>
  )
}


