/**
 * Real recycling points mapped by OpenStreetMap volunteers, fetched from the
 * public Overpass API. No key is needed. Coverage and accuracy vary, so the UI
 * always tells people to confirm before they go.
 */
export interface RealSite {
  id: string
  name: string
  lat: number
  lng: number
  kind: 'centre' | 'container' | 'other'
  materials: string[]
  hours: string | null
  website: string | null
  osmUrl: string
}

const ENDPOINTS = ['https://overpass-api.de/api/interpreter', 'https://overpass.kumi.systems/api/interpreter']

const MATERIAL_LABELS: Record<string, string> = {
  glass: 'Glass',
  glass_bottles: 'Glass bottles',
  cans: 'Cans',
  aluminium: 'Aluminum',
  scrap_metal: 'Scrap metal',
  paper: 'Paper',
  newspaper: 'Paper',
  magazines: 'Paper',
  cardboard: 'Cardboard',
  paper_packaging: 'Cardboard',
  plastic: 'Plastic',
  plastic_bottles: 'Plastic bottles',
  plastic_packaging: 'Plastic',
  plastic_bags: 'Plastic bags',
  beverage_cartons: 'Cartons',
  batteries: 'Batteries',
  car_batteries: 'Batteries',
  electrical_appliances: 'Electronics',
  small_appliances: 'Electronics',
  computers: 'Electronics',
  mobile_phones: 'Phones',
  clothes: 'Clothing',
  shoes: 'Shoes',
  textiles: 'Clothing',
  green_waste: 'Yard trimmings',
  garden_waste: 'Yard trimmings',
  organic: 'Food scraps',
  food_waste: 'Food scraps',
  cooking_oil: 'Cooking oil',
  engine_oil: 'Motor oil',
  oil: 'Motor oil',
  paint: 'Paint',
  hazardous_waste: 'Hazardous waste',
  low_energy_bulbs: 'Light bulbs',
  fluorescent_tubes: 'Light bulbs',
  printer_cartridges: 'Ink cartridges',
}

function materialsFrom(tags: Record<string, string>) {
  const out = new Set<string>()
  for (const [key, value] of Object.entries(tags)) {
    if (!key.startsWith('recycling:') || value !== 'yes') continue
    const raw = key.slice('recycling:'.length)
    out.add(MATERIAL_LABELS[raw] ?? raw.replace(/_/g, ' ').replace(/^\w/, (c) => c.toUpperCase()))
  }
  return [...out].sort()
}

interface OverpassElement {
  type: 'node' | 'way' | 'relation'
  id: number
  lat?: number
  lon?: number
  center?: { lat: number; lon: number }
  tags?: Record<string, string>
}

export async function fetchRealSites(lat: number, lng: number, radiusMeters: number, signal?: AbortSignal): Promise<RealSite[]> {
  const around = `(around:${Math.round(radiusMeters)},${lat.toFixed(4)},${lng.toFixed(4)})`
  const query = `[out:json][timeout:20];(node["amenity"="recycling"]${around};way["amenity"="recycling"]${around};);out center 80;`
  let lastError: unknown = null
  for (const endpoint of ENDPOINTS) {
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `data=${encodeURIComponent(query)}`,
        signal,
      })
      if (!response.ok) throw new Error(`OpenStreetMap search returned ${response.status}.`)
      const body = (await response.json()) as { elements?: OverpassElement[] }
      return (body.elements ?? [])
        .map((element): RealSite | null => {
          const point = element.center ?? (element.lat !== undefined && element.lon !== undefined ? { lat: element.lat, lon: element.lon } : null)
          if (!point) return null
          const tags = element.tags ?? {}
          const kind = tags.recycling_type === 'centre' ? 'centre' : tags.recycling_type === 'container' ? 'container' : 'other'
          const materials = materialsFrom(tags)
          const fallback = kind === 'centre' ? 'Recycling center' : kind === 'container' ? 'Recycling drop-off container' : 'Recycling point'
          return {
            id: `${element.type}/${element.id}`,
            name: tags.name || tags.operator || fallback,
            lat: point.lat,
            lng: point.lon,
            kind,
            materials,
            hours: tags.opening_hours ?? null,
            website: tags.website ?? tags['contact:website'] ?? null,
            osmUrl: `https://www.openstreetmap.org/${element.type}/${element.id}`,
          }
        })
        .filter((site): site is RealSite => site !== null)
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') throw error
      lastError = error
    }
  }
  throw lastError instanceof Error ? lastError : new Error('OpenStreetMap search failed.')
}
