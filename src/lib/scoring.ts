import type { LevelResult } from "../types";

/** 3 stars with no mistakes, 2 with one or two, otherwise 1. */
export function starsFor(mistakes: number): LevelResult["stars"] {
  if (mistakes <= 0) return 3;
  if (mistakes <= 2) return 2;
  return 1;
}

export const CLEAN_BONUS = 50;

/**
 * Running score for one attempt. Each correct sort is worth 100, plus a combo
 * bonus of 10 per item in the current streak (capped at +50), plus any extra
 * bonus such as speed. A mistake resets the combo.
 */
export interface Tally {
  correct: number;
  mistakes: number;
  combo: number;
  bestCombo: number;
  points: number;
  missed: Set<string>;
}

/** Empty score sheet for the start of a level. */
export function newTally(): Tally {
  return {
    correct: 0,
    mistakes: 0,
    combo: 0,
    bestCombo: 0,
    points: 0,
    missed: new Set(),
  };
}

/** Points for a correct answer given after the game already explained it. */
export const RETRY_POINTS = 25;

/** Records a correct answer and returns the points it earned. */
/** Adds points for a correct answer and grows the combo. */
export function hit(tally: Tally, bonus = 0, base = 100) {
  tally.correct += 1;
  tally.combo += 1;
  tally.bestCombo = Math.max(tally.bestCombo, tally.combo);
  const earned =
    base + Math.min(5, tally.combo - 1) * 10 + Math.max(0, Math.round(bonus));
  tally.points += earned;
  return earned;
}

/** Counts a mistake, breaks the combo, and remembers the item for review. */
export function miss(tally: Tally, itemId?: string) {
  tally.mistakes += 1;
  tally.combo = 0;
  if (itemId) tally.missed.add(itemId);
}

/** Points so far, plus a bonus when the run had no mistakes. */
export function finalScore(tally: Tally) {
  return (
    tally.points + (tally.mistakes === 0 && tally.correct > 0 ? CLEAN_BONUS : 0)
  );
}

/** Packages the tally into the object the results screen and save logic expect. */
export function resultFrom(tally: Tally): LevelResult {
  return {
    score: finalScore(tally),
    mistakes: tally.mistakes,
    stars: starsFor(tally.mistakes),
    bestCombo: tally.bestCombo,
    missedItemIds: [...tally.missed],
  };
}
