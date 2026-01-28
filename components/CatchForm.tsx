'use client'

import { useState } from 'react'
import Image from 'next/image'
import { useCatchStore } from '@/lib/store'
import { uploadPhoto, compressImage } from '@/lib/utils/photoUpload'
import { getCurrentPosition, getLocationName, formatCoordinates } from '@/lib/utils/geolocation'
import { getCurrentWeather } from '@/lib/utils/weather'
import { X, Upload, MapPin, Cloud } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { Coordinates } from '@/lib/utils/geolocation'

interface CatchFormProps {
  onSuccess: () => void
}

const FISH_SPECIES = [
  'Hecht',
  'Zander',
  'Barsch',
  'Karpfen',
  'Forelle',
  'Aal',
  'Wels',
  'Döbel',
  'Rotauge',
  'Brassen',
  'Schleie',
  'Andere',
]

interface PhotoWithPreview {
  file: File
  preview: string
  caption?: string
}

export default function CatchForm({ onSuccess }: CatchFormProps) {
  const addCatch = useCatchStore((state) => state.addCatch)
  const user = useCatchStore((state) => state.user)
  
  const [formData, setFormData] = useState({
    species: '',
    length: '',
    weight: '',
    location: '',
    bait: '',
    notes: '',
    date: new Date().toISOString().slice(0, 16), // YYYY-MM-DDTHH:mm format
  })

  const [photos, setPhotos] = useState<PhotoWithPreview[]>([])
  const [coordinates, setCoordinates] = useState<Coordinates | null>(null)
  const [gettingLocation, setGettingLocation] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [weather, setWeather] = useState<any>(null)
  const [fetchingWeather, setFetchingWeather] = useState(false)

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    
    files.forEach(file => {
      const reader = new FileReader()
      reader.onloadend = () => {
        setPhotos(prev => [...prev, {
          file,
          preview: reader.result as string,
        }])
      }
      reader.readAsDataURL(file)
    })
  }

  const removePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index))
  }

  const updateCaption = (index: number, caption: string) => {
    setPhotos(prev => prev.map((photo, i) => 
      i === index ? { ...photo, caption } : photo
    ))
  }

  const getLocation = async () => {
    setGettingLocation(true)
    try {
      const position = await getCurrentPosition()
      setCoordinates(position)
      
      const locationName = await getLocationName(position)
      setFormData(prev => ({ ...prev, location: locationName }))

      // Also fetch weather for this location
      const weatherData = await getCurrentWeather(position)
      setWeather(weatherData)
    } catch (error) {
      console.error('Location error:', error)
      alert('Konnte Standort nicht ermitteln')
    } finally {
      setGettingLocation(false)
    }
  }

  const getWeatherData = async () => {
    if (!coordinates) {
      alert('Bitte zuerst Standort aktivieren')
      return
    }

    setFetchingWeather(true)
    try {
      const weatherData = await getCurrentWeather(coordinates)
      setWeather(weatherData)
    } catch (error) {
      console.error('Weather error:', error)
      alert('Konnte Wetter nicht laden')
    } finally {
      setFetchingWeather(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user) {
      alert('Bitte melde dich an')
      return
    }

    if (!formData.species || !formData.length) {
      alert('Bitte Fischart und Länge angeben')
      return
    }

    setUploading(true)

    try {
      // Upload all photos
      let photoUrls: string[] = []
      if (photos.length > 0) {
        for (const photo of photos) {
          const compressed = await compressImage(photo.file)
          const url = await uploadPhoto(compressed, user.id)
          photoUrls.push(url)
        }
      }

      // Create catch with first photo (backward compatibility)
      const catchData = {
        species: formData.species,
        length: parseInt(formData.length),
        weight: formData.weight ? parseInt(formData.weight) : undefined,
        location: formData.location || undefined,
        bait: formData.bait || undefined,
        notes: formData.notes || undefined,
        date: new Date(formData.date).toISOString(),
        photo: photoUrls[0] || undefined, // First photo
        coordinates: coordinates || undefined,
        weather: weather || undefined,
      }

      const newCatch = await addCatch(catchData)

      // If multiple photos, save to catch_photos table
      if (photoUrls.length > 0 && newCatch) {
        const catchPhotos = photoUrls.map((url, index) => ({
          catch_id: newCatch.id,
          photo_url: url,
          caption: photos[index]?.caption || null,
          order_index: index,
        }))

        const { error } = await supabase
          .from('catch_photos')
          .insert(catchPhotos)

        if (error) {
          console.error('Error saving photos:', error)
          // Don't fail the whole operation, photos are stored in catches.photo_url
        }
      }

      // Reset form
      setFormData({
        species: '',
        length: '',
        weight: '',
        location: '',
        bait: '',
        notes: '',
        date: new Date().toISOString().slice(0, 16),
      })
      setPhotos([])
      setCoordinates(null)
      setWeather(null)

      onSuccess()
    } catch (error) {
      console.error('Submit error:', error)
      alert('Fehler beim Speichern')
    } finally {
      setUploading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Photo Upload - Multiple */}
      <div>
        <label className="block text-ocean-light text-sm mb-2">
          Fotos ({photos.length})
        </label>
        
        {/* Photo Grid */}
        {photos.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
            {photos.map((photo, index) => (
              <div key={index} className="relative group">
                <div className="relative aspect-square rounded-lg overflow-hidden bg-ocean-dark">
                  <Image
                    src={photo.preview}
                    alt={`Photo ${index + 1}`}
                    fill
                    className="object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => removePhoto(index)}
                    className="absolute top-2 right-2 p-1 bg-red-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-4 h-4 text-white" />
                  </button>
                  {index === 0 && (
                    <div className="absolute top-2 left-2 bg-ocean-light px-2 py-1 rounded text-white text-xs">
                      Hauptfoto
                    </div>
                  )}
                </div>
                <input
                  type="text"
                  placeholder="Beschreibung (optional)"
                  value={photo.caption || ''}
                  onChange={(e) => updateCaption(index, e.target.value)}
                  className="mt-2 w-full px-3 py-1 rounded bg-ocean-dark text-white text-sm border border-ocean-light/30 focus:border-ocean-light focus:outline-none"
                />
              </div>
            ))}
          </div>
        )}

        {/* Upload Button */}
        <label className="flex items-center justify-center gap-2 px-4 py-3 bg-ocean/30 hover:bg-ocean/50 rounded-lg cursor-pointer transition-colors border-2 border-dashed border-ocean-light/30">
          <Upload className="w-5 h-5 text-ocean-light" />
          <span className="text-ocean-light">
            {photos.length === 0 ? 'Fotos hochladen' : 'Weitere Fotos hinzufügen'}
          </span>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handlePhotoChange}
            className="hidden"
          />
        </label>
        <p className="text-xs text-ocean-light mt-1">
          Mehrere Fotos auswählen. Erstes Foto = Hauptfoto
        </p>
      </div>

      {/* Species */}
      <div>
        <label className="block text-ocean-light text-sm mb-2">
          Fischart *
        </label>
        <select
          value={formData.species}
          onChange={(e) => setFormData({ ...formData, species: e.target.value })}
          className="w-full px-4 py-2 rounded-lg bg-ocean-dark text-white border border-ocean-light/30 focus:border-ocean-light focus:outline-none"
          required
        >
          <option value="">Wähle eine Art</option>
          {FISH_SPECIES.map((species) => (
            <option key={species} value={species}>
              {species}
            </option>
          ))}
        </select>
      </div>

      {/* Length & Weight */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-ocean-light text-sm mb-2">
            Länge (cm) *
          </label>
          <input
            type="number"
            value={formData.length}
            onChange={(e) => setFormData({ ...formData, length: e.target.value })}
            className="w-full px-4 py-2 rounded-lg bg-ocean-dark text-white border border-ocean-light/30 focus:border-ocean-light focus:outline-none"
            required
            min="1"
          />
        </div>
        <div>
          <label className="block text-ocean-light text-sm mb-2">
            Gewicht (g)
          </label>
          <input
            type="number"
            value={formData.weight}
            onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
            className="w-full px-4 py-2 rounded-lg bg-ocean-dark text-white border border-ocean-light/30 focus:border-ocean-light focus:outline-none"
            min="1"
          />
        </div>
      </div>

      {/* Date & Time */}
      <div>
        <label className="block text-ocean-light text-sm mb-2">
          Datum & Uhrzeit
        </label>
        <input
          type="datetime-local"
          value={formData.date}
          onChange={(e) => setFormData({ ...formData, date: e.target.value })}
          className="w-full px-4 py-2 rounded-lg bg-ocean-dark text-white border border-ocean-light/30 focus:border-ocean-light focus:outline-none"
        />
        <p className="text-xs text-ocean-light mt-1">
          Standardmäßig aktuelle Zeit - anpassbar
        </p>
      </div>

      {/* Location */}
      <div>
        <label className="block text-ocean-light text-sm mb-2">
          Standort
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={formData.location}
            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            className="flex-1 px-4 py-2 rounded-lg bg-ocean-dark text-white border border-ocean-light/30 focus:border-ocean-light focus:outline-none"
            placeholder="z.B. Müggelsee, Berlin"
          />
          <button
            type="button"
            onClick={getLocation}
            disabled={gettingLocation}
            className="px-4 py-2 bg-ocean hover:bg-ocean-light text-white rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            <MapPin className="w-4 h-4" />
            {gettingLocation ? '...' : 'GPS'}
          </button>
        </div>
        {coordinates && (
          <p className="text-xs text-ocean-light mt-1">
            📍 {formatCoordinates(coordinates)}
          </p>
        )}
      </div>

      {/* Weather */}
      {coordinates && (
        <div>
          <button
            type="button"
            onClick={getWeatherData}
            disabled={fetchingWeather}
            className="flex items-center gap-2 text-ocean-light hover:text-white transition-colors"
          >
            <Cloud className="w-4 h-4" />
            <span className="text-sm">
              {weather ? 'Wetter aktualisieren' : 'Wetter laden'}
            </span>
          </button>
          {weather && (
            <div className="mt-2 p-3 bg-ocean-dark/50 rounded-lg text-sm">
              <div className="text-white">
                🌡️ {weather.temperature}°C • 💨 {weather.windSpeed} km/h
              </div>
            </div>
          )}
        </div>
      )}

      {/* Bait */}
      <div>
        <label className="block text-ocean-light text-sm mb-2">
          Köder
        </label>
        <input
          type="text"
          value={formData.bait}
          onChange={(e) => setFormData({ ...formData, bait: e.target.value })}
          className="w-full px-4 py-2 rounded-lg bg-ocean-dark text-white border border-ocean-light/30 focus:border-ocean-light focus:outline-none"
          placeholder="z.B. Wobbler, Gummifisch, Wurm"
        />
      </div>

      {/* Notes */}
      <div>
        <label className="block text-ocean-light text-sm mb-2">
          Notizen
        </label>
        <textarea
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          rows={3}
          className="w-full px-4 py-2 rounded-lg bg-ocean-dark text-white border border-ocean-light/30 focus:border-ocean-light focus:outline-none resize-none"
          placeholder="Zusätzliche Infos..."
        />
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={uploading}
        className="w-full bg-gradient-to-r from-ocean-light to-ocean hover:from-ocean hover:to-ocean-dark text-white font-semibold py-3 rounded-lg transition-all disabled:opacity-50 shadow-lg hover:shadow-xl"
      >
        {uploading ? 'Speichern...' : 'Fang speichern'}
      </button>
    </form>
  )
}
