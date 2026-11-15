/** Where an item belongs. Reuse means keep it, not throw it away. */
export type DisposalCategory =
  | "recycle"
  | "compost"
  | "reuse"
  | "trash"
  | "special";

/** Light or dark appearance saved with the rest of the local settings. */

export type ThemeMode = "light" | "dark";

export interface WasteItem {
  id: string;
  name: string;
  keywords: string[];
  material: string;
  category: DisposalCategory;
  preparation: string;
  why: string;
  environmentalNote: string;
  emoji: string;
  weightKg: number;
  /** Illustrative kg CO2e avoided per kg recycled. Omitted when we do not show an emissions figure. */
  emissionFactorPerKg?: number;
}

export interface ScanRecord {
  id: string;
  itemId: string;
  at: string;
  method: "manual" | "filename-hint" | "recognition";
  uncertain: boolean;
}

export interface DisposalRecord {
  id: string;
  itemId: string;
  at: string;
  source: "scanner" | "database";
}

export type LevelId =
  | "neighborhood"
  | "sorting"
  | "compost"
  | "recycling"
  | "boss";

export interface LevelProgress {
  unlocked: boolean;
  completed: boolean;
  stars: number;
  bestScore: number;
}

export interface DailyState {
  /** Local date (YYYY-MM-DD) of the last counted daily challenge. */
  lastDay: string;
  streak: number;
  lastScore: number;
  /** Emoji result row, e.g. 🟩🟩🟥, for sharing. */
  lastGrid: string;
}

export type ArcadeMode = "rush" | "daily" | "review";

export interface GameState {
  tutorialSeen: boolean;
  points: number;
  achievements: string[];
  levels: Record<LevelId, LevelProgress>;
  /** Review weight per item id. Wrong answers raise it, right answers lower it. */
  missed: Record<string, number>;
  rushBest: number;
  bestCombo: number;
  daily: DailyState;
}

export interface AppState {
  version: 1;
  displayName: string;
  zip: string;
  sound: boolean;
  theme: ThemeMode;
  scans: ScanRecord[];
  disposals: DisposalRecord[];
  viewedItemIds: string[];
  game: GameState;
}

export interface LevelResult {
  score: number;
  mistakes: number;
  stars: 1 | 2 | 3;
  bestCombo: number;
  /** Item ids answered wrong at least once during the run. */
  missedItemIds: string[];
}
