export interface Coordinates {
  lat: number
  lng: number
}

/**
 * Get current GPS position
 * @returns Promise with coordinates or null if failed
 */
export async function getCurrentPosition(): Promise<Coordinates | null> {
  if (!navigator.geolocation) {
    console.error('Geolocation is not supported by this browser.')
    return null
  }

  const tryGet = (highAccuracy: boolean): Promise<Coordinates | null> =>
    new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          })
        },
        (error) => {
          console.error(`Geolocation error (highAccuracy=${highAccuracy}):`, error)
          resolve(null)
        },
        {
          enableHighAccuracy: highAccuracy,
          timeout: highAccuracy ? 10000 : 5000,
          maximumAge: highAccuracy ? 0 : 60000,
        }
      )
    })

  // Try high accuracy first (GPS), fall back to low accuracy (network/WiFi)
  const result = await tryGet(true)
  if (result) return result
  return tryGet(false)
}

/**
 * Calculate distance between two coordinates (Haversine formula)
 * @param coord1 - First coordinate
 * @param coord2 - Second coordinate
 * @returns Distance in kilometers
 */
export function calculateDistance(coord1: Coordinates, coord2: Coordinates): number {
  const R = 6371 // Earth's radius in km
  const dLat = toRad(coord2.lat - coord1.lat)
  const dLng = toRad(coord2.lng - coord1.lng)

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(coord1.lat)) *
      Math.cos(toRad(coord2.lat)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2)

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  const distance = R * c

  return Math.round(distance * 100) / 100 // Round to 2 decimals
}

function toRad(degrees: number): number {
  return degrees * (Math.PI / 180)
}

/**
 * Get location name from coordinates using OpenStreetMap Nominatim
 * @param coordinates - GPS coordinates
 * @returns Location name or null
 */
export async function getLocationName(coordinates: Coordinates): Promise<string | null> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${coordinates.lat}&lon=${coordinates.lng}&zoom=10`
    )
    
    if (!response.ok) return null
    
    const data = await response.json()
    
    // Try to get a nice location name
    const address = data.address
    const locationParts = []
    
    if (address.water || address.lake || address.river) {
      locationParts.push(address.water || address.lake || address.river)
    }
    
    if (address.town || address.city || address.village) {
      locationParts.push(address.town || address.city || address.village)
    } else if (address.county) {
      locationParts.push(address.county)
    }
    
    return locationParts.length > 0 ? locationParts.join(', ') : data.display_name
  } catch (error) {
    console.error('Error fetching location name:', error)
    return null
  }
}

/**
 * Format coordinates for display
 * @param coordinates - GPS coordinates
 * @returns Formatted string
 */
export function formatCoordinates(coordinates: Coordinates): string {
  const latDir = coordinates.lat >= 0 ? 'N' : 'S'
  const lngDir = coordinates.lng >= 0 ? 'E' : 'W'
  
  return `${Math.abs(coordinates.lat).toFixed(6)}°${latDir}, ${Math.abs(coordinates.lng).toFixed(6)}°${lngDir}`
}
