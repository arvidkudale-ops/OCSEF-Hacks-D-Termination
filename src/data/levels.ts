import type { LevelId } from '../types'

export const LEVEL_ORDER: LevelId[] = ['neighborhood', 'sorting', 'compost', 'recycling', 'boss']

export interface SortTask {
  kind: 'sort'
  title: string
  prompt: string
  bins: { id: string; label: string }[]
  rounds: { itemId: string; binId: string }[]
}

export interface YesNoTask {
  kind: 'yesno'
  title: string
  prompt: string
  yesLabel: string
  noLabel: string
  rounds: { itemId: string; belongs: boolean; explain: string }[]
}

export interface BuildTask {
  kind: 'build'
  title: string
  prompt: string
  need: { id: string; label: string; count: number }[]
  choices: { itemId: string; pile: string | null; explain: string }[]
}

export interface OrderTask {
  kind: 'order'
  title: string
  prompt: string
  steps: { id: string; label: string; detail: string }[]
}

export interface MatchTask {
  kind: 'match'
  title: string
  prompt: string
  pairs: { id: string; left: string; right: string; explain: string }[]
}

export type GameTask = SortTask | YesNoTask | BuildTask | OrderTask | MatchTask

export interface LevelDef {
  id: LevelId
  title: string
  place: string
  summary: string
  teaches: string
  kind: 'explore' | 'tasks' | 'boss'
  lessons: string[]
  tasks: GameTask[]
}

export interface Spawn {
  id: string
  itemId: string
  x: number
  y: number
}

export const NEIGHBORHOOD_SPAWNS: Spawn[] = [
  { id: 'n1', itemId: 'plastic-bottle', x: 240, y: 220 },
  { id: 'n2', itemId: 'aluminum-can', x: 520, y: 340 },
  { id: 'n3', itemId: 'cardboard-box', x: 380, y: 500 },
  { id: 'n4', itemId: 'banana-peel', x: 1160, y: 200 },
  { id: 'n5', itemId: 'apple-core', x: 1340, y: 320 },
  { id: 'n6', itemId: 'coffee-grounds', x: 1220, y: 460 },
  { id: 'n7', itemId: 'styrofoam-cup', x: 1760, y: 200 },
  { id: 'n8', itemId: 'chip-bag', x: 2040, y: 340 },
  { id: 'n9', itemId: 'newspaper', x: 220, y: 1120 },
  { id: 'n10', itemId: 'ceramic-plate', x: 520, y: 1240 },
  { id: 'n11', itemId: 'reusable-bottle', x: 900, y: 280 },
]

export const BOSS_QUEUE = [
  'plastic-bottle',
  'banana-peel',
  'chip-bag',
  'aluminum-can',
  'newspaper',
  'plastic-bag',
  'apple-core',
  'glass-jar',
  'aa-battery',
  'styrofoam-cup',
  'cardboard-box',
  'phone',
  'reusable-bottle',
]

const paperBins = [
  { id: 'paper', label: 'Paper and cardboard' },
  { id: 'plastic', label: 'Plastic bottles and tubs' },
  { id: 'metal', label: 'Metal' },
  { id: 'glass', label: 'Glass bottles and jars' },
  { id: 'out', label: 'Not on this line' },
]

export const LEVELS: LevelDef[] = [
  {
    id: 'neighborhood',
    title: 'The Neighborhood Cleanup',
    place: 'A few blocks around home',
    summary: 'Pick up litter in the park, cafe, school, and on your street, then walk each piece to the right bin.',
    teaches: 'Name an item and match it to recycling, compost, reuse, or trash.',
    kind: 'explore',
    lessons: [
      'Empty bottles, cans, clean cardboard, and newspaper go in recycling.',
      'Food scraps go in compost, not in with the paper and containers.',
      'Foam, chip bags, and broken ceramic are trash. Ceramic is not bottle glass.',
      'A reusable bottle, bag, or cup stays with you. It does not go in the trash.',
    ],
    tasks: [],
  },
  {
    id: 'sorting',
    title: 'The Waste Sorting Facility',
    place: 'Inside a materials recovery facility',
    summary: 'Send incoming items to the right station, pull contaminants off the line, and put the facility steps in order.',
    teaches: 'Sorting only works when the wrong materials stay out.',
    kind: 'tasks',
    lessons: [
      'A recovery facility separates paper, plastic, metal, and glass.',
      'Bags, batteries, and food are contamination, not extra recycling.',
      'After sorting, materials are baled and sent on to be processed.',
    ],
    tasks: [
      {
        kind: 'sort',
        title: 'Incoming load',
        prompt: 'Send each item to the station that can actually handle it.',
        bins: paperBins,
        rounds: [
          { itemId: 'newspaper', binId: 'paper' },
          { itemId: 'milk-jug', binId: 'plastic' },
          { itemId: 'aluminum-can', binId: 'metal' },
          { itemId: 'glass-jar', binId: 'glass' },
          { itemId: 'plastic-bag', binId: 'out' },
          { itemId: 'aa-battery', binId: 'out' },
        ],
      },
      {
        kind: 'yesno',
        title: 'Contamination check',
        prompt: 'Does this item belong on the recycling line?',
        yesLabel: 'It belongs',
        noLabel: 'Pull it off',
        rounds: [
          {
            itemId: 'plastic-bottle',
            belongs: true,
            explain: 'An empty plastic bottle is a target material for the line.',
          },
          {
            itemId: 'banana-peel',
            belongs: false,
            explain: 'Food belongs in organics. On a recycling line it soils paper and containers.',
          },
          {
            itemId: 'glass-bottle',
            belongs: true,
            explain: 'An empty glass bottle stays on the line with other bottle glass.',
          },
          {
            itemId: 'chip-bag',
            belongs: false,
            explain: 'A chip bag is not a rigid plastic bottle. It is a contaminant here.',
          },
          {
            itemId: 'pizza-box-greasy',
            belongs: false,
            explain: 'Grease keeps this cardboard out of recycling. Organics may take it locally, otherwise it is trash.',
          },
          {
            itemId: 'magazine',
            belongs: true,
            explain: 'A dry magazine is paper, so it can stay on the line.',
          },
        ],
      },
      {
        kind: 'order',
        title: 'What happens next',
        prompt: 'Put the facility steps in the order they happen.',
        steps: [
          { id: 'unload', label: 'Trucks unload', detail: 'Collection trucks tip their loads onto the facility floor.' },
          { id: 'remove', label: 'People and machines remove contaminants', detail: 'Bags, batteries, and other hazards come off before they damage the line.' },
          { id: 'separate', label: 'Materials are separated', detail: 'Paper, plastic, metal, and glass move into their own streams.' },
          { id: 'bale', label: 'Sorted materials are baled', detail: 'Compact bales are easier to ship than loose bottles and paper.' },
          { id: 'ship', label: 'Bales go to processors', detail: 'A processor turns the sorted material into feedstock for new products.' },
        ],
      },
    ],
  },
  {
    id: 'compost',
    title: 'The Compost Facility',
    place: 'An organics yard',
    summary: 'Keep non-compostable materials out, build a balanced pile, and follow the process from scraps to soil.',
    teaches: 'Organics break down. Plastic, glass, and batteries do not belong in the pile.',
    kind: 'tasks',
    lessons: [
      'Food scraps and yard trimmings are the materials a compost site wants.',
      'A pile needs wet greens and dry browns, not a bag of plastic.',
      'City organics programs and backyard piles do not always accept the same things.',
    ],
    tasks: [
      {
        kind: 'sort',
        title: 'What can go in',
        prompt: 'Sort each item into the compost pile or the not-compost pile. This game uses a municipal organics rule of thumb.',
        bins: [
          { id: 'compost', label: 'Compost' },
          { id: 'out', label: 'Not compost' },
        ],
        rounds: [
          { itemId: 'banana-peel', binId: 'compost' },
          { itemId: 'yard-trimmings', binId: 'compost' },
          { itemId: 'eggshells', binId: 'compost' },
          { itemId: 'plastic-utensil', binId: 'out' },
          { itemId: 'glass-jar', binId: 'out' },
          { itemId: 'aa-battery', binId: 'out' },
        ],
      },
      {
        kind: 'build',
        title: 'Build a batch',
        prompt: 'Add 3 greens and 2 browns. Greens are fresh food scraps. Browns are dry leaves and clean paper or cardboard.',
        need: [
          { id: 'greens', label: 'Greens', count: 3 },
          { id: 'browns', label: 'Browns', count: 2 },
        ],
        choices: [
          { itemId: 'banana-peel', pile: 'greens', explain: 'A peel is a wet food scrap, so it counts as a green.' },
          { itemId: 'apple-core', pile: 'greens', explain: 'An apple core is a green.' },
          { itemId: 'coffee-grounds', pile: 'greens', explain: 'Coffee grounds act like a green in a compost recipe.' },
          { itemId: 'dry-leaves', pile: 'browns', explain: 'Dry leaves are the classic brown. They balance wet food.' },
          { itemId: 'cardboard-box', pile: 'browns', explain: 'Clean, dry cardboard can be a brown. Greasy cardboard is a separate question for your city.' },
          { itemId: 'plastic-bottle', pile: null, explain: 'Plastic does not break down into compost. Keep it out of the pile.' },
          { itemId: 'aluminum-can', pile: null, explain: 'Metal does not belong in compost. It is a recyclable.' },
          { itemId: 'chip-bag', pile: null, explain: 'A chip bag is trash, not a brown, even though it is dry.' },
        ],
      },
      {
        kind: 'order',
        title: 'From scraps to soil',
        prompt: 'Order the composting process. Your local program may skip or rename a step.',
        steps: [
          { id: 'collect', label: 'Organics are collected', detail: 'Food scraps and yard trimmings are kept separate from trash and recycling.' },
          { id: 'mix', label: 'Greens are mixed with browns', detail: 'The mix gives microbes food, air, and a balance of wet and dry material.' },
          { id: 'heat', label: 'Microbes heat the pile', detail: 'A working pile warms up as microbes break the material down.' },
          { id: 'cure', label: 'The pile cures', detail: 'Curing lets the compost finish and cool before anyone uses it.' },
          { id: 'soil', label: 'Finished compost can feed soil', detail: 'The result is a soil amendment, not the original banana peel.' },
        ],
      },
    ],
  },
  {
    id: 'recycling',
    title: 'The Recycling Facility',
    place: 'Where sorted materials are processed',
    summary: 'Sort materials into their own bays, match each one to a recovery process, and close the loop.',
    teaches: 'Recycling is a process with several steps, and it depends on sorting.',
    kind: 'tasks',
    lessons: [
      'Paper, cardboard, metal, glass, and accepted plastics are different streams.',
      'Batteries and electronics are a special drop-off, even at a recycling plant.',
      'Recovered material only becomes a new product after it is processed and used.',
    ],
    tasks: [
      {
        kind: 'sort',
        title: 'Five streams',
        prompt: 'Put each item in the bay that matches its material. Use special drop-off when it does not belong in those streams.',
        bins: [
          { id: 'paper', label: 'Paper' },
          { id: 'cardboard', label: 'Cardboard' },
          { id: 'metal', label: 'Metal' },
          { id: 'glass', label: 'Glass' },
          { id: 'plastic', label: 'Plastic' },
          { id: 'special', label: 'Special drop-off' },
        ],
        rounds: [
          { itemId: 'newspaper', binId: 'paper' },
          { itemId: 'cardboard-box', binId: 'cardboard' },
          { itemId: 'aluminum-can', binId: 'metal' },
          { itemId: 'glass-bottle', binId: 'glass' },
          { itemId: 'milk-jug', binId: 'plastic' },
          { itemId: 'phone', binId: 'special' },
        ],
      },
      {
        kind: 'match',
        title: 'Recovery process',
        prompt: 'Match each material to the process that usually comes next.',
        pairs: [
          { id: 'metal', left: 'Aluminum cans', right: 'Melted and rolled into new metal', explain: 'Aluminum is melted and formed again. Food left in the can makes that harder.' },
          { id: 'paper', left: 'Newspaper', right: 'Pulped, cleaned, and pressed', explain: 'Paper is mixed with water, cleaned, and pressed into new sheets.' },
          { id: 'glass', left: 'Glass bottles', right: 'Crushed into cullet and melted', explain: 'Bottle glass is crushed into cullet, then melted. Ceramic cannot join that melt.' },
          { id: 'plastic', left: 'Plastic bottles', right: 'Washed, flaked, and remolded', explain: 'Accepted plastic is washed, chopped, and molded. Bags are not part of that bottle stream.' },
        ],
      },
      {
        kind: 'order',
        title: 'Close the loop',
        prompt: 'Put the recycling loop in order.',
        steps: [
          { id: 'sort', label: 'Sort materials into the right stream', detail: 'The loop starts with the bin choice and the facility sort.' },
          { id: 'process', label: 'Process them into clean feedstock', detail: 'Washing, pulping, melting, or flaking turns a bale into something a factory can use.' },
          { id: 'make', label: 'A manufacturer uses that feedstock', detail: 'Someone has to buy the recovered material and make a product.' },
          { id: 'product', label: 'A new product is made', detail: 'A can, sheet of paper, or bottle can come back as a new thing.' },
          { id: 'buy', label: 'Buying recycled products keeps the loop going', detail: 'Collection alone is not the end. Demand for the new product matters.' },
        ],
      },
    ],
  },
  {
    id: 'boss',
    title: 'The Trash Monster',
    place: 'A pile of mixed-up waste',
    summary: 'The monster is a pollution shield made of poorly sorted waste. Clear it by sorting every item. There is no fighting.',
    teaches: 'Contamination is what gives the mess its power. Correct sorting takes that shield down.',
    kind: 'boss',
    lessons: [
      'The categories are recycle, compost, reusable, trash, and special drop-off.',
      'A wrong guess does not end the challenge. The explanation tells you the category, and you try again.',
      'Real bins still follow local rules. The game uses the same categories as the scanner.',
    ],
    tasks: [],
  },
]

export function getLevel(id: string) {
  return LEVELS.find((level) => level.id === id)
}

export function gameItemIds() {
  const ids = new Set<string>()
  for (const spawn of NEIGHBORHOOD_SPAWNS) ids.add(spawn.itemId)
  for (const id of BOSS_QUEUE) ids.add(id)
  for (const level of LEVELS) {
    for (const task of level.tasks) {
      if (task.kind === 'sort' || task.kind === 'yesno') {
        for (const round of task.rounds) ids.add(round.itemId)
      }
      if (task.kind === 'build') {
        for (const choice of task.choices) ids.add(choice.itemId)
      }
    }
  }
  return ids
}
