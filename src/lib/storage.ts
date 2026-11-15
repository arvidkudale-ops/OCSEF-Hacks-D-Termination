import { LEVEL_ORDER } from "../data/levels";
import { getItem } from "../data/items";
import type { AppState, DisposalRecord, LevelId, ScanRecord } from "../types";

const STORAGE_KEY = "releaf-demo-v1";

/** Fresh level record. Only the neighborhood starts unlocked. */
function emptyLevels(): AppState["game"]["levels"] {
  return {
    neighborhood: { unlocked: true, completed: false, stars: 0, bestScore: 0 },
    sorting: { unlocked: false, completed: false, stars: 0, bestScore: 0 },
    compost: { unlocked: false, completed: false, stars: 0, bestScore: 0 },
    recycling: { unlocked: false, completed: false, stars: 0, bestScore: 0 },
    boss: { unlocked: false, completed: false, stars: 0, bestScore: 0 },
  };
}

/** Default settings and empty progress for a first visit. */
export function initialState(): AppState {
  return {
    version: 1,
    displayName: "",
    zip: "",
    sound: true,
    theme: "dark",
    scans: [],
    disposals: [],
    viewedItemIds: [],
    game: {
      tutorialSeen: false,
      points: 0,
      achievements: [],
      levels: emptyLevels(),
      missed: {},
      rushBest: 0,
      bestCombo: 0,
      daily: { lastDay: "", streak: 0, lastScore: 0, lastGrid: "" },
    },
  };
}

/** Drops saved scans that are missing fields or use an unknown method. */
function cleanScans(value: unknown): ScanRecord[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((row): row is ScanRecord => {
      if (!row || typeof row !== "object") return false;
      const scan = row as ScanRecord;
      return (
        typeof scan.id === "string" &&
        typeof scan.itemId === "string" &&
        typeof scan.at === "string" &&
        (scan.method === "manual" ||
          scan.method === "filename-hint" ||
          scan.method === "recognition") &&
        typeof scan.uncertain === "boolean"
      );
    })
    .slice(0, 200);
}

/** Drops saved disposal logs that do not match the expected shape. */
function cleanDisposals(value: unknown): DisposalRecord[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((row): row is DisposalRecord => {
      if (!row || typeof row !== "object") return false;
      const disposal = row as DisposalRecord;
      return (
        typeof disposal.id === "string" &&
        typeof disposal.itemId === "string" &&
        typeof disposal.at === "string" &&
        (disposal.source === "scanner" || disposal.source === "database")
      );
    })
    .slice(0, 500);
}

/** Keeps review weights only for items that still exist in the database. */
function cleanMissed(value: unknown): Record<string, number> {
  if (!value || typeof value !== "object") return {};
  const out: Record<string, number> = {};
  for (const [id, weight] of Object.entries(value as Record<string, unknown>)) {
    const n = Math.round(Number(weight));
    if (getItem(id) && n > 0) out[id] = Math.min(6, n);
  }
  return out;
}

/** Turns saved numbers into a safe non-negative integer. */
function cleanNumber(value: unknown) {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? Math.round(n) : 0;
}

/** Restores the daily-challenge streak, or a blank one if the save is junk. */
function cleanDaily(value: unknown): AppState["game"]["daily"] {
  const raw = (value && typeof value === "object" ? value : {}) as Record<
    string,
    unknown
  >;
  return {
    lastDay:
      typeof raw.lastDay === "string" && /^d{4}-d{2}-d{2}$/.test(raw.lastDay)
        ? raw.lastDay
        : "",
    streak: cleanNumber(raw.streak),
    lastScore: cleanNumber(raw.lastScore),
    lastGrid: typeof raw.lastGrid === "string" ? raw.lastGrid.slice(0, 80) : "",
  };
}

/** Reads local storage and repairs anything that no longer matches this version. */
export function loadState(): AppState {
  const base = initialState();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return base;
    const parsed = JSON.parse(raw) as Partial<AppState>;
    const levels = emptyLevels();
    const savedLevels = parsed.game?.levels;
    if (savedLevels) {
      for (const id of LEVEL_ORDER) {
        const saved = savedLevels[id];
        if (!saved) continue;
        levels[id] = {
          unlocked: Boolean(saved.unlocked) || id === "neighborhood",
          completed: Boolean(saved.completed),
          stars: Math.max(0, Math.min(3, Number(saved.stars) || 0)),
          bestScore: Math.max(0, Number(saved.bestScore) || 0),
        };
      }
    }
    const points = LEVEL_ORDER.reduce(
      (sum, id) => sum + levels[id].bestScore,
      0,
    );
    return {
      version: 1,
      displayName:
        typeof parsed.displayName === "string"
          ? parsed.displayName.slice(0, 40)
          : "",
      zip:
        typeof parsed.zip === "string" && /^\d{5}$/.test(parsed.zip)
          ? parsed.zip
          : "",
      sound: typeof parsed.sound === "boolean" ? parsed.sound : true,
      theme: parsed.theme === "light" ? "light" : "dark",
      scans: cleanScans(parsed.scans),
      disposals: cleanDisposals(parsed.disposals),
      viewedItemIds: Array.isArray(parsed.viewedItemIds)
        ? parsed.viewedItemIds
            .filter(
              (id): id is string =>
                typeof id === "string" && Boolean(getItem(id)),
            )
            .slice(0, 100)
        : [],
      game: {
        tutorialSeen: Boolean(parsed.game?.tutorialSeen),
        points,
        achievements: Array.isArray(parsed.game?.achievements)
          ? parsed.game.achievements.filter(
              (id): id is string => typeof id === "string",
            )
          : [],
        levels,
        missed: cleanMissed(parsed.game?.missed),
        rushBest: cleanNumber(parsed.game?.rushBest),
        bestCombo: cleanNumber(parsed.game?.bestCombo),
        daily: cleanDaily(parsed.game?.daily),
      },
    };
  } catch {
    return base;
  }
}

/** Writes the whole app state. Fails quietly if storage is full or blocked. */
export function saveState(state: AppState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Private mode or full storage: progress just won't persist this visit.
  }
}

/** Sum of best scores. Replays do not add on top of the previous best. */
export function pointsFor(levels: AppState["game"]["levels"]) {
  return LEVEL_ORDER.reduce((sum, id) => sum + levels[id].bestScore, 0);
}

/** True when a URL segment is one of the five story levels. */
export function isLevelId(value: string): value is LevelId {
  return LEVEL_ORDER.includes(value as LevelId);
}
