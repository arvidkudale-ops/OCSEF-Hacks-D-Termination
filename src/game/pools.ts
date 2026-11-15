import { CATEGORY_ORDER } from "../data/categories";
import { WASTE_ITEMS } from "../data/items";
import { BOSS_QUEUE, NEIGHBORHOOD_SPAWNS } from "../data/levels";
import type { Spawn } from "../data/levels";
import { seeded, shuffle, weightedSample } from "../lib/random";
import type { DisposalCategory, WasteItem } from "../types";

type Missed = Record<string, number>;

/** Items the player has trouble with show up more often. */
/** Items the player missed, and recently scanned items, show up more often. */
function weightFor(missed: Missed, boost: Set<string> = new Set()) {
  return (item: WasteItem) =>
    1 + (missed[item.id] ?? 0) * 1.5 + (boost.has(item.id) ? 1 : 0);
}

/** Database items that belong in one disposal category. */
function byCategory(category: DisposalCategory) {
  return WASTE_ITEMS.filter((item) => item.category === category);
}

/** Open spots on the neighborhood map: park, cafe, school, street, and homes. */
const LITTER_SPOTS: { x: number; y: number }[] = [
  ...NEIGHBORHOOD_SPAWNS.map(({ x, y }) => ({ x, y })),
  { x: 640, y: 420 },
  { x: 1500, y: 560 },
  { x: 1080, y: 760 },
  { x: 1900, y: 520 },
  { x: 760, y: 1380 },
  { x: 1300, y: 1100 },
];

/**
 * First play uses the hand-picked teaching set. Replays draw a fresh mix of
 * recycling, compost, reuse, and trash so the level stays worth replaying.
 */
/** First visit uses the fixed teaching litter. Later visits mix a new set. */
export function neighborhoodLitter(
  firstPlay: boolean,
  missed: Missed,
): Spawn[] {
  if (firstPlay) return NEIGHBORHOOD_SPAWNS;
  const pick = [
    ...weightedSample(byCategory("recycle"), weightFor(missed), 4),
    ...weightedSample(byCategory("compost"), weightFor(missed), 2),
    ...weightedSample(byCategory("reuse"), weightFor(missed), 2),
    ...weightedSample(byCategory("trash"), weightFor(missed), 2),
  ];
  const spots = shuffle(LITTER_SPOTS);
  return shuffle(pick).map((item, index) => ({
    id: `r${index}`,
    itemId: item.id,
    ...spots[index],
  }));
}

/** At least two of each category, the player's trouble items first, then a random fill. */
/** Boss item order. Rematches pull in items the player has been getting wrong. */
export function bossQueue(
  firstPlay: boolean,
  missed: Missed,
  size = 12,
): string[] {
  if (firstPlay) return BOSS_QUEUE;
  const trouble = Object.entries(missed)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([id]) => id);
  const chosen = new Set(trouble);
  for (const category of CATEGORY_ORDER) {
    const have = [...chosen].filter(
      (id) => WASTE_ITEMS.find((item) => item.id === id)?.category === category,
    ).length;
    const pool = byCategory(category).filter((item) => !chosen.has(item.id));
    for (const item of weightedSample(
      pool,
      weightFor(missed),
      Math.max(0, 2 - have),
    ))
      chosen.add(item.id);
  }
  const rest = WASTE_ITEMS.filter((item) => !chosen.has(item.id));
  for (const item of weightedSample(
    rest,
    weightFor(missed),
    size - chosen.size,
  ))
    chosen.add(item.id);
  return shuffle([...chosen]);
}

/** Same ten items for everyone on a given day. */
/** Ten items that stay the same for every player on a given local day. */
export function dailyItems(day: string): string[] {
  const rand = seeded(`releaf-daily-${day}`);
  const picks: WasteItem[] = [];
  for (const category of CATEGORY_ORDER)
    picks.push(...weightedSample(byCategory(category), () => 1, 2, rand));
  const rest = WASTE_ITEMS.filter((item) => !picks.includes(item));
  picks.push(...weightedSample(rest, () => 1, 10 - picks.length, rand));
  return shuffle(picks, rand).map((item) => item.id);
}

/** The player's most-missed items, heaviest weights first. */
export function reviewItems(missed: Missed, max = 10): string[] {
  return Object.entries(missed)
    .sort((a, b) => b[1] - a[1])
    .slice(0, max)
    .map(([id]) => id);
}

/** Endless picker for Sort Rush. Avoids recent repeats and favors trouble items and things you scanned. */
/** Next Sort Rush item. Avoids the last few picks so the round does not repeat. */
export function rushPicker(missed: Missed, scannedIds: string[]) {
  const boost = new Set(scannedIds);
  const recent: string[] = [];
  return () => {
    const pool = WASTE_ITEMS.filter((item) => !recent.includes(item.id));
    const [item] = weightedSample(pool, weightFor(missed, boost), 1);
    recent.push(item.id);
    if (recent.length > 8) recent.shift();
    return item.id;
  };
}
