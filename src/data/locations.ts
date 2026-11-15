export interface LocationProfile {
  id: string
  name: string
  area: string
  zips: string[]
  center: { lat: number; lng: number }
  verified: boolean
  lastVerified: string | null
  sourceName: string
  sourceUrl: string
  summary: string
  curbsideRecycling: string[]
  notAcceptedCurbside: string[]
  compost: string[]
  notAcceptedCompost: string[]
  specialDropoff: string[]
  preparation: string[]
  restrictions: string[]
}

export const OFFICIAL_LINKS = [
  {
    name: 'LA Sanitation & Environment',
    url: 'https://www.lacitysan.org/',
    note: 'City of Los Angeles collection programs',
  },
  {
    name: 'LA County Public Works',
    url: 'https://pw.lacounty.gov/',
    note: 'County and unincorporated-community programs',
  },
  {
    name: 'CalRecycle',
    url: 'https://calrecycle.ca.gov/',
    note: 'California recycling and organics information',
  },
]

export const ZIP_CENTERS: Record<string, { lat: number; lng: number; label: string }> = {
  '90012': { lat: 34.061, lng: -118.24, label: 'Downtown Los Angeles' },
  '90015': { lat: 34.039, lng: -118.266, label: 'Downtown Los Angeles' },
  '90026': { lat: 34.078, lng: -118.261, label: 'Echo Park' },
  '90027': { lat: 34.104, lng: -118.292, label: 'Los Feliz' },
  '90036': { lat: 34.07, lng: -118.349, label: 'Mid-Wilshire' },
  '90046': { lat: 34.098, lng: -118.354, label: 'Hollywood' },
  '90064': { lat: 34.036, lng: -118.425, label: 'Rancho Park' },
  '90066': { lat: 34.002, lng: -118.43, label: 'Mar Vista' },
  '91601': { lat: 34.166, lng: -118.376, label: 'North Hollywood' },
  '90401': { lat: 34.019, lng: -118.491, label: 'Santa Monica' },
  '90405': { lat: 34.007, lng: -118.474, label: 'Santa Monica' },
  '90210': { lat: 34.09, lng: -118.406, label: 'Beverly Hills' },
  '91101': { lat: 34.148, lng: -118.145, label: 'Pasadena' },
  '90802': { lat: 33.767, lng: -118.193, label: 'Long Beach' },
}

/**
 * City of Los Angeles lines follow widely published LASAN curbside guidance.
 * They are stored as unverified because this build did not re-check the live
 * municipal pages. Neighboring cities point at official sites without a material list.
 */
export const LOCATIONS: LocationProfile[] = [
  {
    id: 'los-angeles',
    name: 'City of Los Angeles',
    area: 'Los Angeles',
    zips: ['90012', '90015', '90026', '90027', '90036', '90046', '90064', '90066', '91601'],
    center: { lat: 34.05, lng: -118.25 },
    verified: false,
    lastVerified: null,
    sourceName: 'LA Sanitation & Environment',
    sourceUrl: 'https://www.lacitysan.org/',
    summary:
      'Educational summary for the City of Los Angeles, based on widely published LA Sanitation curbside guidance. This demo did not re-check the live municipal pages. Treat every line as unverified until you confirm it.',
    curbsideRecycling: [
      'Clean, dry paper and cardboard',
      'Empty plastic bottles, jugs, tubs, and jars',
      'Glass bottles and jars',
      'Metal cans and clean aluminum foil',
    ],
    notAcceptedCurbside: [
      'Plastic bags and plastic film',
      'Foam cups and foam packaging',
      'Food scraps and yard trimmings',
      'Electronics, batteries, and household hazardous waste',
      'Textiles, hoses, and other items that tangle equipment',
      'Loose shredded paper',
    ],
    compost: [
      'Yard trimmings',
      'Food scraps',
      'Food-soiled paper, such as a greasy pizza box, where the green-bin program accepts it',
    ],
    notAcceptedCompost: [
      'Plastic, glass, and metal',
      'Plastic bags, even if they are labeled compostable, unless the city flyer allows them',
      'Household hazardous waste',
    ],
    specialDropoff: [
      'Batteries',
      'Phones, computers, and other electronics',
      'Paint, oil, fluorescent bulbs, and other household hazardous waste',
      'Clean plastic bags and film at a store take-back, not the blue bin',
      'Wearable clothing for donation or a textile collection',
    ],
    preparation: [
      'Empty and rinse containers',
      'Keep recyclables loose rather than sealed inside a plastic bag',
      'Flatten cardboard',
      'Follow the current flyer if it disagrees with a cap, lid, or tub rule you remember',
    ],
    restrictions: [
      'Apartment buildings and neighboring cities can use different haulers',
      'A material category in this app never overrides the local flyer',
      'Programs change. The official page is the rule that counts',
    ],
  },
  {
    id: 'santa-monica',
    name: 'Santa Monica',
    area: 'Santa Monica',
    zips: ['90401', '90402', '90403', '90404', '90405'],
    center: { lat: 34.019, lng: -118.491 },
    verified: false,
    lastVerified: null,
    sourceName: 'City of Santa Monica',
    sourceUrl: 'https://www.santamonica.gov/',
    summary:
      'Santa Monica runs its own collection programs. This demo does not include a verified material list for Santa Monica.',
    curbsideRecycling: [],
    notAcceptedCurbside: [],
    compost: [],
    notAcceptedCompost: [],
    specialDropoff: [],
    preparation: [],
    restrictions: ['Use the city site or your hauler flyer before you choose a bin.'],
  },
  {
    id: 'beverly-hills',
    name: 'Beverly Hills',
    area: 'Beverly Hills',
    zips: ['90210', '90211', '90212'],
    center: { lat: 34.09, lng: -118.406 },
    verified: false,
    lastVerified: null,
    sourceName: 'City of Beverly Hills',
    sourceUrl: 'https://www.beverlyhills.org/',
    summary:
      'Beverly Hills is not the City of Los Angeles program. This demo does not include a verified Beverly Hills material list.',
    curbsideRecycling: [],
    notAcceptedCurbside: [],
    compost: [],
    notAcceptedCompost: [],
    specialDropoff: [],
    preparation: [],
    restrictions: ['Confirm acceptance with the City of Beverly Hills or your hauler.'],
  },
  {
    id: 'pasadena',
    name: 'Pasadena',
    area: 'Pasadena',
    zips: ['91101', '91103', '91104', '91105', '91106', '91107'],
    center: { lat: 34.148, lng: -118.145 },
    verified: false,
    lastVerified: null,
    sourceName: 'City of Pasadena',
    sourceUrl: 'https://www.cityofpasadena.net/',
    summary:
      'Pasadena publishes its own recycling and organics rules. This demo does not include a verified material list.',
    curbsideRecycling: [],
    notAcceptedCurbside: [],
    compost: [],
    notAcceptedCompost: [],
    specialDropoff: [],
    preparation: [],
    restrictions: ['Start with the City of Pasadena site rather than Los Angeles guidance.'],
  },
  {
    id: 'long-beach',
    name: 'Long Beach',
    area: 'Long Beach',
    zips: ['90802', '90803', '90804', '90813', '90814', '90815'],
    center: { lat: 33.77, lng: -118.19 },
    verified: false,
    lastVerified: null,
    sourceName: 'City of Long Beach',
    sourceUrl: 'https://www.longbeach.gov/',
    summary:
      'Long Beach runs its own programs. This demo does not include a verified Long Beach material list.',
    curbsideRecycling: [],
    notAcceptedCurbside: [],
    compost: [],
    notAcceptedCompost: [],
    specialDropoff: [],
    preparation: [],
    restrictions: ['Check the City of Long Beach before using a Los Angeles rule.'],
  },
]

export function rulesForZip(zip: string) {
  if (!/^\d{5}$/.test(zip)) return null
  return LOCATIONS.find((location) => location.zips.includes(zip)) ?? null
}

export function normalizeZip(value: string) {
  const digits = value.replace(/\D/g, '')
  if (digits.length === 0) return ''
  if (digits.length < 5) return null
  return digits.slice(0, 5)
}
