'use client'

import { useEffect, useMemo, useState } from 'react'
import { useCatchStore } from '@/lib/store'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
  Filler,
  type ChartOptions,
} from 'chart.js'
import { Line, Bar, Doughnut } from 'react-chartjs-2'
import { format, getHours, startOfMonth } from 'date-fns'
import { de } from 'date-fns/locale'
import { BarChart3, CloudSun, Fish, Thermometer, Wind, Gauge, Droplets } from 'lucide-react'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
  Filler
)

const ACCENT = '#4a90e2'
const ACCENT_SOFT = 'rgba(74, 144, 226, 0.25)'
const GRID = 'rgba(74, 144, 226, 0.18)'
const TICK = '#9dc9eb'
const SURFACE = 'rgba(18, 53, 80, 0.55)'
const PIE_COLORS = ['#4a90e2', '#2c5f8d', '#4a7c59', '#d4af37', '#c41e3a', '#8b7355', '#6ea7d3', '#3d8b6d']

const baseOptions: ChartOptions<'bar' | 'line' | 'doughnut'> = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      labels: {
        color: TICK,
      },
    },
    tooltip: {
      backgroundColor: '#0f3047',
      borderColor: '#2c5f8d',
      borderWidth: 1,
      titleColor: '#ffffff',
      bodyColor: '#e6f4ff',
    },
  },
}

function weatherSourceLabel(source?: string) {
  if (source === 'historical') return 'Archiv'
  if (source === 'current') return 'Aktuell'
  if (source === 'forecast') return 'Prognose'
  return 'Unbekannt'
}

function toMonthKey(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  return `${y}-${m}`
}

export default function StatsPage() {
  const catches = useCatchStore((state) => state.catches)
  const [tab, setTab] = useState<'overview' | 'species'>('overview')

  const speciesOptions = useMemo(() => {
    return Array.from(new Set(catches.map((c) => c.species))).sort((a, b) => a.localeCompare(b, 'de'))
  }, [catches])

  const [selectedSpecies, setSelectedSpecies] = useState<string>('')

  useEffect(() => {
    if (!speciesOptions.length) {
      setSelectedSpecies('')
      return
    }
    if (!selectedSpecies || !speciesOptions.includes(selectedSpecies)) {
      setSelectedSpecies(speciesOptions[0])
    }
  }, [speciesOptions, selectedSpecies])

  const overview = useMemo(() => {
    const monthMap = new Map<string, number>()
    const speciesMap = new Map<string, number>()
    const baitMap = new Map<string, number>()
    const hourMap = new Map<number, number>()

    catches.forEach((c) => {
      const d = new Date(c.date)
      const monthKey = toMonthKey(startOfMonth(d))
      monthMap.set(monthKey, (monthMap.get(monthKey) || 0) + 1)
      speciesMap.set(c.species, (speciesMap.get(c.species) || 0) + 1)
      hourMap.set(getHours(d), (hourMap.get(getHours(d)) || 0) + 1)
      if (c.bait) baitMap.set(c.bait, (baitMap.get(c.bait) || 0) + 1)
    })

    const sortedMonths = Array.from(monthMap.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-12)

    const catchesPerMonth = {
      labels: sortedMonths.map(([k]) => format(new Date(`${k}-01T00:00:00`), 'MMM yy', { locale: de })),
      values: sortedMonths.map(([, v]) => v),
    }

    const speciesDist = Array.from(speciesMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)

    const baitTop = Array.from(baitMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)

    const hours = Array.from({ length: 24 }, (_, h) => ({
      label: `${h}:00`,
      value: hourMap.get(h) || 0,
    }))

    const catchesWithWeather = catches.filter((c) => c.weather)
    const tempRanges = new Map<string, number>()
    const weatherTypes = new Map<string, number>()
    const sourceMap = new Map<string, number>()

    catchesWithWeather.forEach((c) => {
      const w = c.weather!
      const t = w.temperature
      const range = t < 10 ? '<10°C' : t < 15 ? '10-15°C' : t < 20 ? '15-20°C' : t < 25 ? '20-25°C' : '25°C+'
      tempRanges.set(range, (tempRanges.get(range) || 0) + 1)
      weatherTypes.set(w.description || 'Unbekannt', (weatherTypes.get(w.description || 'Unbekannt') || 0) + 1)
      sourceMap.set(w.source || 'unknown', (sourceMap.get(w.source || 'unknown') || 0) + 1)
    })

    const avgLength = Math.round(catches.reduce((sum, c) => sum + c.length, 0) / catches.length)
    const catchesWithWeight = catches.filter((c) => c.weight)
    const avgWeightKg = catchesWithWeight.length
      ? Math.round((catchesWithWeight.reduce((sum, c) => sum + (c.weight || 0), 0) / catchesWithWeight.length) / 1000)
      : null

    const weatherAvg = catchesWithWeather.length
      ? {
          temp: Math.round(catchesWithWeather.reduce((sum, c) => sum + (c.weather?.temperature || 0), 0) / catchesWithWeather.length),
          wind: Math.round(catchesWithWeather.reduce((sum, c) => sum + (c.weather?.windSpeed || 0), 0) / catchesWithWeather.length),
          pressure: Math.round(catchesWithWeather.reduce((sum, c) => sum + (c.weather?.pressure || 0), 0) / catchesWithWeather.length),
          humidity: Math.round(catchesWithWeather.reduce((sum, c) => sum + (c.weather?.humidity || 0), 0) / catchesWithWeather.length),
        }
      : null

    return {
      catchesPerMonth,
      speciesDist,
      baitTop,
      hours,
      tempByRange: Array.from(tempRanges.entries()).map(([label, value]) => ({ label, value })),
      weatherTypes: Array.from(weatherTypes.entries()).sort((a, b) => b[1] - a[1]).slice(0, 8),
      weatherSources: Array.from(sourceMap.entries()).map(([source, value]) => ({
        source,
        label: weatherSourceLabel(source),
        value,
        percent: catchesWithWeather.length ? Math.round((value / catchesWithWeather.length) * 100) : 0,
      })),
      avgLength,
      avgWeightKg,
      topSpecies: speciesDist[0] || null,
      topBait: baitTop[0] || null,
      weatherAvg,
      weatherCount: catchesWithWeather.length,
    }
  }, [catches])

  const speciesStats = useMemo(() => {
    if (!selectedSpecies) return null
    const list = catches.filter((c) => c.species === selectedSpecies)
    if (!list.length) return null

    const monthMap = new Map<string, number>()
    const hourMap = new Map<number, number>()
    const weatherTypeMap = new Map<string, number>()
    const sourceMap = new Map<string, number>()
    const lengthBuckets = new Map<string, number>([
      ['<20cm', 0],
      ['20-39cm', 0],
      ['40-59cm', 0],
      ['60-79cm', 0],
      ['80cm+', 0],
    ])

    list.forEach((c) => {
      const d = new Date(c.date)
      const mKey = toMonthKey(startOfMonth(d))
      monthMap.set(mKey, (monthMap.get(mKey) || 0) + 1)
      hourMap.set(getHours(d), (hourMap.get(getHours(d)) || 0) + 1)

      if (c.length < 20) lengthBuckets.set('<20cm', (lengthBuckets.get('<20cm') || 0) + 1)
      else if (c.length < 40) lengthBuckets.set('20-39cm', (lengthBuckets.get('20-39cm') || 0) + 1)
      else if (c.length < 60) lengthBuckets.set('40-59cm', (lengthBuckets.get('40-59cm') || 0) + 1)
      else if (c.length < 80) lengthBuckets.set('60-79cm', (lengthBuckets.get('60-79cm') || 0) + 1)
      else lengthBuckets.set('80cm+', (lengthBuckets.get('80cm+') || 0) + 1)

      if (c.weather) {
        const wt = c.weather.description || 'Unbekannt'
        weatherTypeMap.set(wt, (weatherTypeMap.get(wt) || 0) + 1)
        const src = c.weather.source || 'unknown'
        sourceMap.set(src, (sourceMap.get(src) || 0) + 1)
      }
    })

    const sortedMonths = Array.from(monthMap.entries()).sort((a, b) => a[0].localeCompare(b[0])).slice(-12)
    const weights = list.filter((c) => c.weight)

    return {
      total: list.length,
      avgLength: Math.round(list.reduce((sum, c) => sum + c.length, 0) / list.length),
      avgWeight: weights.length
        ? Math.round((weights.reduce((sum, c) => sum + (c.weight || 0), 0) / weights.length) / 1000)
        : null,
      biggest: Math.max(...list.map((c) => c.length)),
      monthly: {
        labels: sortedMonths.map(([k]) => format(new Date(`${k}-01T00:00:00`), 'MMM yy', { locale: de })),
        values: sortedMonths.map(([, v]) => v),
      },
      hourly: Array.from({ length: 24 }, (_, h) => ({ label: `${h}:00`, value: hourMap.get(h) || 0 })),
      lengthBuckets: Array.from(lengthBuckets.entries()).map(([label, value]) => ({ label, value })),
      weatherTypes: Array.from(weatherTypeMap.entries()).sort((a, b) => b[1] - a[1]).slice(0, 6),
      weatherSources: Array.from(sourceMap.entries()).map(([source, value]) => ({
        source,
        label: weatherSourceLabel(source),
        value,
      })),
    }
  }, [catches, selectedSpecies])

  if (!catches.length) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
          <BarChart3 className="w-8 h-8 text-ocean-light" />
          Statistiken
        </h1>
        <div className="bg-ocean/30 backdrop-blur-sm rounded-xl p-12 text-center">
          <div className="mb-4 flex justify-center"><BarChart3 className="w-14 h-14 text-ocean-light" /></div>
          <h3 className="text-2xl font-bold text-white mb-2">Noch keine Daten</h3>
          <p className="text-ocean-light">Füge Fänge hinzu, um deine Statistiken zu sehen.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-20 md:pb-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <BarChart3 className="w-8 h-8 text-ocean-light" />
            Statistiken
          </h1>
          <p className="text-ocean-light mt-1">Analyse deiner {catches.length} Fänge</p>
        </div>
        <div className="inline-flex bg-ocean/30 border border-ocean-light/20 rounded-xl p-1">
          <button
            onClick={() => setTab('overview')}
            className={`px-4 py-2 rounded-lg text-sm transition-colors ${tab === 'overview' ? 'bg-ocean text-white' : 'text-ocean-light hover:text-white'}`}
          >
            Übersicht
          </button>
          <button
            onClick={() => setTab('species')}
            className={`px-4 py-2 rounded-lg text-sm transition-colors ${tab === 'species' ? 'bg-ocean text-white' : 'text-ocean-light hover:text-white'}`}
          >
            Art-Detail
          </button>
        </div>
      </div>

      {tab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-ocean/30 backdrop-blur-sm rounded-lg p-5 border border-ocean-light/10">
              <div className="text-ocean-light text-sm">Ø Größe</div>
              <div className="text-3xl font-bold text-white mt-1">{overview.avgLength}</div>
              <div className="text-ocean-light text-xs mt-1">cm</div>
            </div>
            <div className="bg-ocean/30 backdrop-blur-sm rounded-lg p-5 border border-ocean-light/10">
              <div className="text-ocean-light text-sm">Ø Gewicht</div>
              <div className="text-3xl font-bold text-white mt-1">{overview.avgWeightKg ?? '-'}</div>
              <div className="text-ocean-light text-xs mt-1">kg</div>
            </div>
            <div className="bg-ocean/30 backdrop-blur-sm rounded-lg p-5 border border-ocean-light/10">
              <div className="text-ocean-light text-sm">Top Art</div>
              <div className="text-xl font-bold text-white mt-1 truncate">{overview.topSpecies?.[0] || '-'}</div>
              <div className="text-ocean-light text-xs mt-1">{overview.topSpecies?.[1] || 0}x</div>
            </div>
            <div className="bg-ocean/30 backdrop-blur-sm rounded-lg p-5 border border-ocean-light/10">
              <div className="text-ocean-light text-sm">Top Köder</div>
              <div className="text-xl font-bold text-white mt-1 truncate">{overview.topBait?.[0] || '-'}</div>
              <div className="text-ocean-light text-xs mt-1">{overview.topBait?.[1] || 0}x</div>
            </div>
          </div>

          {overview.weatherAvg && (
            <div className="bg-ocean/30 backdrop-blur-sm rounded-xl p-6 border border-ocean-light/10">
              <h2 className="text-lg font-bold text-white mb-4 inline-flex items-center gap-2"><CloudSun className="w-5 h-5 text-ocean-light" />Wetter-Einblicke</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <div className="text-ocean-light text-sm inline-flex items-center gap-1"><Thermometer className="w-4 h-4" />Temperatur</div>
                  <div className="text-2xl font-bold text-white">{overview.weatherAvg.temp}°C</div>
                </div>
                <div>
                  <div className="text-ocean-light text-sm inline-flex items-center gap-1"><Wind className="w-4 h-4" />Wind</div>
                  <div className="text-2xl font-bold text-white">{overview.weatherAvg.wind} km/h</div>
                </div>
                <div>
                  <div className="text-ocean-light text-sm inline-flex items-center gap-1"><Gauge className="w-4 h-4" />Luftdruck</div>
                  <div className="text-2xl font-bold text-white">{overview.weatherAvg.pressure} hPa</div>
                </div>
                <div>
                  <div className="text-ocean-light text-sm inline-flex items-center gap-1"><Droplets className="w-4 h-4" />Luftfeuchte</div>
                  <div className="text-2xl font-bold text-white">{overview.weatherAvg.humidity}%</div>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {overview.weatherSources.map((entry) => (
                  <div key={entry.source} className="px-3 py-1.5 rounded-full bg-ocean-dark/60 text-xs text-ocean-light border border-ocean-light/20">
                    {entry.label}: <span className="text-white">{entry.value}</span> ({entry.percent}%)
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <div className="bg-ocean/30 backdrop-blur-sm rounded-xl p-6 border border-ocean-light/10">
              <h2 className="text-lg font-bold text-white mb-4">Fänge pro Monat</h2>
              <div className="h-72">
                <Line
                  options={{
                    ...baseOptions,
                    scales: {
                      x: { ticks: { color: TICK }, grid: { color: GRID } },
                      y: { ticks: { color: TICK }, grid: { color: GRID }, beginAtZero: true },
                    },
                  }}
                  data={{
                    labels: overview.catchesPerMonth.labels,
                    datasets: [
                      {
                        label: 'Fänge',
                        data: overview.catchesPerMonth.values,
                        borderColor: ACCENT,
                        backgroundColor: ACCENT_SOFT,
                        tension: 0.35,
                        fill: true,
                      },
                    ],
                  }}
                />
              </div>
            </div>

            <div className="bg-ocean/30 backdrop-blur-sm rounded-xl p-6 border border-ocean-light/10">
              <h2 className="text-lg font-bold text-white mb-4">Arten-Verteilung (Top 10)</h2>
              <div className="h-72">
                <Doughnut
                  options={{
                    ...baseOptions,
                    cutout: '58%',
                  }}
                  data={{
                    labels: overview.speciesDist.map((s) => s[0]),
                    datasets: [
                      {
                        label: 'Fänge',
                        data: overview.speciesDist.map((s) => s[1]),
                        backgroundColor: overview.speciesDist.map((_, i) => PIE_COLORS[i % PIE_COLORS.length]),
                        borderColor: SURFACE,
                        borderWidth: 1,
                      },
                    ],
                  }}
                />
              </div>
            </div>

            <div className="bg-ocean/30 backdrop-blur-sm rounded-xl p-6 border border-ocean-light/10">
              <h2 className="text-lg font-bold text-white mb-4">Beste Fangzeiten</h2>
              <div className="h-72">
                <Bar
                  options={{
                    ...baseOptions,
                    scales: {
                      x: { ticks: { color: TICK, maxRotation: 0, autoSkip: true, maxTicksLimit: 12 }, grid: { display: false } },
                      y: { ticks: { color: TICK }, grid: { color: GRID }, beginAtZero: true },
                    },
                  }}
                  data={{
                    labels: overview.hours.map((h) => h.label),
                    datasets: [
                      {
                        label: 'Fänge',
                        data: overview.hours.map((h) => h.value),
                        backgroundColor: 'rgba(74, 124, 89, 0.8)',
                        borderRadius: 6,
                      },
                    ],
                  }}
                />
              </div>
            </div>

            <div className="bg-ocean/30 backdrop-blur-sm rounded-xl p-6 border border-ocean-light/10">
              <h2 className="text-lg font-bold text-white mb-4">Erfolgreichste Köder</h2>
              <div className="h-72">
                <Bar
                  options={{
                    ...baseOptions,
                    indexAxis: 'y',
                    scales: {
                      x: { ticks: { color: TICK }, grid: { color: GRID }, beginAtZero: true },
                      y: { ticks: { color: TICK }, grid: { display: false } },
                    },
                  }}
                  data={{
                    labels: overview.baitTop.map((b) => b[0]),
                    datasets: [
                      {
                        label: 'Fänge',
                        data: overview.baitTop.map((b) => b[1]),
                        backgroundColor: 'rgba(212, 175, 55, 0.8)',
                        borderRadius: 6,
                      },
                    ],
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === 'species' && (
        <div className="space-y-6">
          <div className="bg-ocean/30 backdrop-blur-sm rounded-xl p-4 border border-ocean-light/10 flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="text-white font-semibold inline-flex items-center gap-2"><Fish className="w-4 h-4 text-ocean-light" />Fischart auswählen</div>
            <select
              value={selectedSpecies}
              onChange={(e) => setSelectedSpecies(e.target.value)}
              className="bg-ocean-dark text-white border border-ocean-light/30 rounded-lg px-3 py-2 focus:outline-none focus:border-ocean-light"
            >
              {speciesOptions.map((species) => (
                <option key={species} value={species}>{species}</option>
              ))}
            </select>
          </div>

          {speciesStats && (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-ocean/30 backdrop-blur-sm rounded-lg p-5 border border-ocean-light/10">
                  <div className="text-ocean-light text-sm">Fänge</div>
                  <div className="text-3xl font-bold text-white">{speciesStats.total}</div>
                </div>
                <div className="bg-ocean/30 backdrop-blur-sm rounded-lg p-5 border border-ocean-light/10">
                  <div className="text-ocean-light text-sm">Ø Länge</div>
                  <div className="text-3xl font-bold text-white">{speciesStats.avgLength}</div>
                  <div className="text-ocean-light text-xs">cm</div>
                </div>
                <div className="bg-ocean/30 backdrop-blur-sm rounded-lg p-5 border border-ocean-light/10">
                  <div className="text-ocean-light text-sm">Ø Gewicht</div>
                  <div className="text-3xl font-bold text-white">{speciesStats.avgWeight ?? '-'}</div>
                  <div className="text-ocean-light text-xs">kg</div>
                </div>
                <div className="bg-ocean/30 backdrop-blur-sm rounded-lg p-5 border border-ocean-light/10">
                  <div className="text-ocean-light text-sm">Größter Fang</div>
                  <div className="text-3xl font-bold text-white">{speciesStats.biggest}</div>
                  <div className="text-ocean-light text-xs">cm</div>
                </div>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <div className="bg-ocean/30 backdrop-blur-sm rounded-xl p-6 border border-ocean-light/10">
                  <h2 className="text-lg font-bold text-white mb-4">Monatlicher Trend ({selectedSpecies})</h2>
                  <div className="h-72">
                    <Line
                      options={{
                        ...baseOptions,
                        scales: {
                          x: { ticks: { color: TICK }, grid: { color: GRID } },
                          y: { ticks: { color: TICK }, grid: { color: GRID }, beginAtZero: true },
                        },
                      }}
                      data={{
                        labels: speciesStats.monthly.labels,
                        datasets: [
                          {
                            label: selectedSpecies,
                            data: speciesStats.monthly.values,
                            borderColor: '#7fb5ff',
                            backgroundColor: 'rgba(127, 181, 255, 0.25)',
                            tension: 0.35,
                            fill: true,
                          },
                        ],
                      }}
                    />
                  </div>
                </div>

                <div className="bg-ocean/30 backdrop-blur-sm rounded-xl p-6 border border-ocean-light/10">
                  <h2 className="text-lg font-bold text-white mb-4">Fangzeiten ({selectedSpecies})</h2>
                  <div className="h-72">
                    <Bar
                      options={{
                        ...baseOptions,
                        scales: {
                          x: { ticks: { color: TICK, maxRotation: 0, autoSkip: true, maxTicksLimit: 12 }, grid: { display: false } },
                          y: { ticks: { color: TICK }, grid: { color: GRID }, beginAtZero: true },
                        },
                      }}
                      data={{
                        labels: speciesStats.hourly.map((h) => h.label),
                        datasets: [
                          {
                            label: 'Fänge',
                            data: speciesStats.hourly.map((h) => h.value),
                            backgroundColor: 'rgba(74, 124, 89, 0.8)',
                            borderRadius: 6,
                          },
                        ],
                      }}
                    />
                  </div>
                </div>

                <div className="bg-ocean/30 backdrop-blur-sm rounded-xl p-6 border border-ocean-light/10">
                  <h2 className="text-lg font-bold text-white mb-4">Längenverteilung ({selectedSpecies})</h2>
                  <div className="h-72">
                    <Bar
                      options={{
                        ...baseOptions,
                        scales: {
                          x: { ticks: { color: TICK }, grid: { display: false } },
                          y: { ticks: { color: TICK }, grid: { color: GRID }, beginAtZero: true },
                        },
                      }}
                      data={{
                        labels: speciesStats.lengthBuckets.map((b) => b.label),
                        datasets: [
                          {
                            label: 'Fänge',
                            data: speciesStats.lengthBuckets.map((b) => b.value),
                            backgroundColor: 'rgba(212, 175, 55, 0.8)',
                            borderRadius: 6,
                          },
                        ],
                      }}
                    />
                  </div>
                </div>

                <div className="bg-ocean/30 backdrop-blur-sm rounded-xl p-6 border border-ocean-light/10">
                  <h2 className="text-lg font-bold text-white mb-4">Wetter & Quelle ({selectedSpecies})</h2>
                  <div className="h-72 mb-4">
                    <Doughnut
                      options={{ ...baseOptions, cutout: '62%' }}
                      data={{
                        labels: speciesStats.weatherTypes.map((w) => w[0]),
                        datasets: [
                          {
                            label: 'Fänge',
                            data: speciesStats.weatherTypes.map((w) => w[1]),
                            backgroundColor: speciesStats.weatherTypes.map((_, i) => PIE_COLORS[i % PIE_COLORS.length]),
                            borderColor: SURFACE,
                            borderWidth: 1,
                          },
                        ],
                      }}
                    />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {speciesStats.weatherSources.map((s) => (
                      <div key={s.source} className="px-3 py-1.5 rounded-full bg-ocean-dark/60 text-xs text-ocean-light border border-ocean-light/20">
                        {s.label}: <span className="text-white">{s.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
