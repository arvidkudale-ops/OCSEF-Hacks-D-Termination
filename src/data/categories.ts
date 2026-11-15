import type { DisposalCategory } from '../types'

export const CATEGORY_META: Record<
  DisposalCategory,
  { label: string; short: string; className: string; swatch: string }
> = {
  recycle: {
    label: 'Recycle',
    short: 'Recycling bin',
    className: 'bg-blue-800 text-white',
    swatch: '#1e40af',
  },
  compost: {
    label: 'Compost',
    short: 'Organics / green bin',
    className: 'bg-leaf-700 text-white',
    swatch: '#2d6a4f',
  },
  reuse: {
    label: 'Reusable',
    short: 'Keep and reuse',
    className: 'bg-teal-700 text-white',
    swatch: '#0f766e',
  },
  trash: {
    label: 'General trash',
    short: 'Trash bin',
    className: 'bg-stone-700 text-white',
    swatch: '#44403c',
  },
  special: {
    label: 'Special drop-off',
    short: 'Special drop-off',
    className: 'bg-amber-800 text-white',
    swatch: '#92400e',
  },
}

export const CATEGORY_ORDER: DisposalCategory[] = ['recycle', 'compost', 'reuse', 'trash', 'special']

export const MATERIALS = [
  'Paper',
  'Cardboard',
  'Plastic',
  'Metal',
  'Glass',
  'Food scraps',
  'Yard waste',
  'Textile',
  'Battery',
  'Electronics',
  'Other',
] as const
