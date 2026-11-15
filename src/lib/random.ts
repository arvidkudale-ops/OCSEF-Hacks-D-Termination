/** Small seeded PRNG so every player gets the same daily challenge. */
/** Same seed always returns the same sequence, so the daily challenge matches for everyone. */
export function seeded(seedText: string) {
  let h = 1779033703 ^ seedText.length;
  for (let i = 0; i < seedText.length; i += 1) {
    h = Math.imul(h ^ seedText.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  let a = h >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Returns a new array in random order. Does not change the original list. */
export function shuffle<T>(
  list: readonly T[],
  rand: () => number = Math.random,
) {
  const next = [...list];
  for (let index = next.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(rand() * (index + 1));
    [next[index], next[swap]] = [next[swap], next[index]];
  }
  return next;
}

/** Weighted pick without replacement. */
/** Picks items without repeating them. Higher weight means a more likely pick. */
export function weightedSample<T>(
  items: readonly T[],
  weight: (item: T) => number,
  count: number,
  rand: () => number = Math.random,
) {
  const pool = items.map((item) => ({
    item,
    w: Math.max(0.0001, weight(item)),
  }));
  const out: T[] = [];
  while (out.length < count && pool.length > 0) {
    const total = pool.reduce((sum, entry) => sum + entry.w, 0);
    let roll = rand() * total;
    let index = 0;
    for (; index < pool.length - 1; index += 1) {
      roll -= pool[index].w;
      if (roll <= 0) break;
    }
    out.push(pool[index].item);
    pool.splice(index, 1);
  }
  return out;
}
