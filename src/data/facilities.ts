export type FacilityType = 'recycling' | 'compost' | 'e-waste' | 'hazardous' | 'donation'

export interface Facility {
  id: string
  name: string
  sample: true
  type: FacilityType
  area: string
  zip: string
  lat: number
  lng: number
  materials: string[]
  hours: null
  phone: null
  note: string
}

export const FACILITY_TYPES: { id: FacilityType; label: string }[] = [
  { id: 'recycling', label: 'Recycling center' },
  { id: 'compost', label: 'Composting facility' },
  { id: 'e-waste', label: 'E-waste drop-off' },
  { id: 'hazardous', label: 'Household hazardous waste' },
  { id: 'donation', label: 'Donation and textiles' },
]

export const FACILITY_MATERIALS = [
  'Paper',
  'Cardboard',
  'Plastic bottles',
  'Metal cans',
  'Glass',
  'Food scraps',
  'Yard trimmings',
  'Electronics',
  'Batteries',
  'Paint and oil',
  'Clothing',
]

/** Sample pins sit in public areas so the map demo does not invent a street address. */
export const FACILITIES: Facility[] = [
  {
    id: 'sample-echo',
    name: 'Sample: Echo Park recycling pin',
    sample: true,
    type: 'recycling',
    area: 'Echo Park, Los Angeles',
    zip: '90026',
    lat: 34.0781,
    lng: -118.2606,
    materials: ['Paper', 'Cardboard', 'Plastic bottles', 'Metal cans', 'Glass'],
    hours: null,
    phone: null,
    note: 'Sample pin placed near Echo Park Lake for the demo map. This is not a real drop-off site, and hours are not listed because none were verified.',
  },
  {
    id: 'sample-civic',
    name: 'Sample: Civic Center recycling pin',
    sample: true,
    type: 'recycling',
    area: 'Downtown Los Angeles',
    zip: '90012',
    lat: 34.0553,
    lng: -118.245,
    materials: ['Paper', 'Cardboard', 'Metal cans', 'Glass'],
    hours: null,
    phone: null,
    note: 'Sample pin in the civic center area. It does not represent a city facility at this spot.',
  },
  {
    id: 'sample-silver-lake',
    name: 'Sample: Silver Lake organics pin',
    sample: true,
    type: 'compost',
    area: 'Silver Lake, Los Angeles',
    zip: '90026',
    lat: 34.1002,
    lng: -118.2604,
    materials: ['Food scraps', 'Yard trimmings'],
    hours: null,
    phone: null,
    note: 'Sample organics pin near the Silver Lake reservoir park. Not a verified composting facility.',
  },
  {
    id: 'sample-mar-vista',
    name: 'Sample: Mar Vista organics pin',
    sample: true,
    type: 'compost',
    area: 'Mar Vista, Los Angeles',
    zip: '90066',
    lat: 34.0025,
    lng: -118.429,
    materials: ['Food scraps', 'Yard trimmings'],
    hours: null,
    phone: null,
    note: 'Sample pin for the directory filter. Do not drive here expecting a compost site.',
  },
  {
    id: 'sample-noho',
    name: 'Sample: North Hollywood e-waste pin',
    sample: true,
    type: 'e-waste',
    area: 'North Hollywood, Los Angeles',
    zip: '91601',
    lat: 34.171,
    lng: -118.376,
    materials: ['Electronics', 'Batteries'],
    hours: null,
    phone: null,
    note: 'Sample e-waste pin in a public North Hollywood area. Contact a real certified collector before you go.',
  },
  {
    id: 'sample-rancho',
    name: 'Sample: Rancho Park hazardous-waste pin',
    sample: true,
    type: 'hazardous',
    area: 'Rancho Park, Los Angeles',
    zip: '90064',
    lat: 34.039,
    lng: -118.424,
    materials: ['Paint and oil', 'Batteries'],
    hours: null,
    phone: null,
    note: 'Sample household-hazardous pin. Paint and oil need an official drop-off, not this demo coordinate.',
  },
  {
    id: 'sample-feliz',
    name: 'Sample: Los Feliz textile pin',
    sample: true,
    type: 'donation',
    area: 'Los Feliz, Los Angeles',
    zip: '90027',
    lat: 34.106,
    lng: -118.287,
    materials: ['Clothing'],
    hours: null,
    phone: null,
    note: 'Sample donation pin near a public Los Feliz area. It is not a store or a textile bin.',
  },
  {
    id: 'sample-macarthur',
    name: 'Sample: MacArthur Park recycling pin',
    sample: true,
    type: 'recycling',
    area: 'Westlake, Los Angeles',
    zip: '90057',
    lat: 34.058,
    lng: -118.277,
    materials: ['Paper', 'Plastic bottles', 'Metal cans', 'Glass'],
    hours: null,
    phone: null,
    note: 'Sample pin at MacArthur Park so the map has another public landmark. Not a recycling center.',
  },
]

export function facilityTypeLabel(type: FacilityType) {
  return FACILITY_TYPES.find((entry) => entry.id === type)?.label ?? type
}

export function distanceKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const toRad = (value: number) => (value * Math.PI) / 180
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const lat1 = toRad(a.lat)
  const lat2 = toRad(b.lat)
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2
  return 2 * 6371 * Math.asin(Math.min(1, Math.sqrt(h)))
}
