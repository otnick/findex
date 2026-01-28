'use client'

import { useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import type { Coordinates } from '@/lib/utils/geolocation'

// Fix default marker icon issue in Next.js
const icon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
})

interface MapProps {
  coordinates: Coordinates
  location?: string
  zoom?: number
  height?: string
  markers?: Array<{
    position: Coordinates
    title: string
  }>
}

function RecenterMap({ coordinates }: { coordinates: Coordinates }) {
  const map = useMap()
  
  useEffect(() => {
    map.setView([coordinates.lat, coordinates.lng], map.getZoom())
  }, [coordinates, map])
  
  return null
}

export default function Map({ coordinates, location, zoom = 13, height = '300px', markers }: MapProps) {
  const displayMarkers = markers || [{ position: coordinates, title: location || 'Fangort' }]
  
  return (
    <div style={{ height, width: '100%' }} className="rounded-lg overflow-hidden">
      <MapContainer
        center={[coordinates.lat, coordinates.lng]}
        zoom={zoom}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {displayMarkers.map((marker, index) => (
          <Marker key={index} position={[marker.position.lat, marker.position.lng]} icon={icon}>
            <Popup>
              {marker.title || 'Fang-Spot'}
              <br />
              <small>
                {marker.position.lat.toFixed(6)}, {marker.position.lng.toFixed(6)}
              </small>
            </Popup>
          </Marker>
        ))}
        <RecenterMap coordinates={coordinates} />
      </MapContainer>
    </div>
  )
}
