import {
  createContext,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useReducer,
} from "react";
import type { ReactNode } from "react";
import { ACHIEVEMENTS } from "../data/achievements";
import { LEVEL_ORDER } from "../data/levels";
import { previousDay } from "../lib/day";
import { initialState, loadState, pointsFor, saveState } from "../lib/storage";
import type {
  AppState,
  ArcadeMode,
  DisposalRecord,
  LevelId,
  ScanRecord,
  ThemeMode,
} from "../types";

type Action =
  | { type: "set-name"; name: string }
  | { type: "set-zip"; zip: string }
  | { type: "set-sound"; sound: boolean }
  | { type: "set-theme"; theme: ThemeMode }
  | { type: "add-scan"; scan: ScanRecord }
  | { type: "add-disposal"; disposal: DisposalRecord }
  | { type: "view-item"; itemId: string }
  | { type: "tutorial-seen" }
  | {
      type: "complete-level";
      levelId: LevelId;
      score: number;
      stars: number;
      bestCombo: number;
    }
  | { type: "answer"; itemId: string; correct: boolean }
  | {
      type: "finish-arcade";
      mode: ArcadeMode;
      score: number;
      bestCombo: number;
      day?: string;
      grid?: string;
    }
  | { type: "reset-progress" };

/** Adds a badge id once, and only if that badge exists. */
function addAchievement(current: string[], id: string) {
  if (
    !ACHIEVEMENTS.some((achievement) => achievement.id === id) ||
    current.includes(id)
  )
    return current;
  return [...current, id];
}

/** Awards the combo badge when a run reaches 10 in a row. */
function withCombo(achievements: string[], combo: number) {
  return combo >= 10 ? addAchievement(achievements, "combo-10") : achievements;
}

/** Applies one change to the saved app state and returns the next copy. */
function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case "set-name":
      return { ...state, displayName: action.name.slice(0, 40) };
    case "set-zip":
      return { ...state, zip: action.zip };
    case "set-sound":
      return { ...state, sound: action.sound };
    case "set-theme":
      return { ...state, theme: action.theme };
    case "add-scan": {
      const scans = [action.scan, ...state.scans].slice(0, 200);
      let achievements = state.game.achievements;
      if (scans.length >= 1)
        achievements = addAchievement(achievements, "first-scan");
      if (scans.length >= 5)
        achievements = addAchievement(achievements, "five-scans");
      return { ...state, scans, game: { ...state.game, achievements } };
    }
    case "add-disposal": {
      const disposals = [action.disposal, ...state.disposals].slice(0, 500);
      let achievements = state.game.achievements;
      if (disposals.length >= 1)
        achievements = addAchievement(achievements, "first-log");
      if (disposals.length >= 5)
        achievements = addAchievement(achievements, "five-logs");
      return { ...state, disposals, game: { ...state.game, achievements } };
    }
    case "view-item": {
      if (state.viewedItemIds.includes(action.itemId)) return state;
      const viewedItemIds = [...state.viewedItemIds, action.itemId].slice(
        0,
        100,
      );
      let achievements = state.game.achievements;
      if (viewedItemIds.length >= 5)
        achievements = addAchievement(achievements, "bookworm");
      return { ...state, viewedItemIds, game: { ...state.game, achievements } };
    }
    case "tutorial-seen":
      return { ...state, game: { ...state.game, tutorialSeen: true } };
    case "complete-level": {
      const levels = { ...state.game.levels };
      const current = levels[action.levelId];
      levels[action.levelId] = {
        ...current,
        unlocked: true,
        completed: true,
        stars: Math.max(current.stars, action.stars),
        bestScore: Math.max(current.bestScore, action.score),
      };
      const index = LEVEL_ORDER.indexOf(action.levelId);
      const nextId = LEVEL_ORDER[index + 1];
      if (nextId) levels[nextId] = { ...levels[nextId], unlocked: true };
      let achievements = state.game.achievements;
      achievements = addAchievement(achievements, `level-${action.levelId}`);
      if (action.stars === 3)
        achievements = addAchievement(achievements, "perfect");
      if (LEVEL_ORDER.every((id) => levels[id].completed))
        achievements = addAchievement(achievements, "all-levels");
      if (LEVEL_ORDER.every((id) => levels[id].stars === 3))
        achievements = addAchievement(achievements, "all-stars");
      achievements = withCombo(achievements, action.bestCombo);
      return {
        ...state,
        game: {
          ...state.game,
          levels,
          points: pointsFor(levels),
          achievements,
          bestCombo: Math.max(state.game.bestCombo, action.bestCombo),
        },
      };
    }
    case "answer": {
      const missed = { ...state.game.missed };
      const current = missed[action.itemId] ?? 0;
      const next = action.correct ? current - 1 : Math.min(6, current + 2);
      if (next > 0) missed[action.itemId] = next;
      else delete missed[action.itemId];
      if (next === current) return state;
      return { ...state, game: { ...state.game, missed } };
    }
    case "finish-arcade": {
      const game = { ...state.game };
      let achievements = withCombo(game.achievements, action.bestCombo);
      game.bestCombo = Math.max(game.bestCombo, action.bestCombo);
      if (action.mode === "rush") {
        game.rushBest = Math.max(game.rushBest, action.score);
        if (action.score >= 1500)
          achievements = addAchievement(achievements, "rush-1500");
      }
      if (action.mode === "review" && Object.keys(game.missed).length === 0) {
        achievements = addAchievement(achievements, "review-clear");
      }
      if (
        action.mode === "daily" &&
        action.day &&
        game.daily.lastDay !== action.day
      ) {
        const streak =
          game.daily.lastDay === previousDay(action.day)
            ? game.daily.streak + 1
            : 1;
        game.daily = {
          lastDay: action.day,
          streak,
          lastScore: action.score,
          lastGrid: action.grid ?? "",
        };
        achievements = addAchievement(achievements, "daily-first");
        if (streak >= 3) achievements = addAchievement(achievements, "daily-3");
      }
      game.achievements = achievements;
      return { ...state, game };
    }
    case "reset-progress":
      return {
        ...initialState(),
        displayName: state.displayName,
        zip: state.zip,
        sound: state.sound,
        theme: state.theme,
      };
    default:
      return state;
  }
}

interface AppApi {
  state: AppState;
  setName: (name: string) => void;
  setZip: (zip: string) => void;
  setSound: (sound: boolean) => void;
  setTheme: (theme: ThemeMode) => void;
  addScan: (scan: ScanRecord) => void;
  addDisposal: (disposal: DisposalRecord) => void;
  viewItem: (itemId: string) => void;
  markTutorialSeen: () => void;
  completeLevel: (
    levelId: LevelId,
    score: number,
    stars: number,
    bestCombo: number,
  ) => void;
  recordAnswer: (itemId: string, correct: boolean) => void;
  finishArcade: (result: {
    mode: ArcadeMode;
    score: number;
    bestCombo: number;
    day?: string;
    grid?: string;
  }) => void;
  resetProgress: () => void;
}

const AppContext = createContext<AppApi | null>(null);

/** Holds state, saves it, and applies the theme class before the browser paints. */
export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, loadState);

  useLayoutEffect(() => {
    document.documentElement.classList.toggle("dark", state.theme === "dark");
    document.documentElement.style.colorScheme = state.theme;
  }, [state.theme]);

  useEffect(() => {
    saveState(state);
  }, [state]);

  const api = useMemo<AppApi>(
    () => ({
      state,
      setName: (name) => dispatch({ type: "set-name", name }),
      setZip: (zip) => dispatch({ type: "set-zip", zip }),
      setSound: (sound) => dispatch({ type: "set-sound", sound }),
      setTheme: (theme) => dispatch({ type: "set-theme", theme }),
      addScan: (scan) => dispatch({ type: "add-scan", scan }),
      addDisposal: (disposal) => dispatch({ type: "add-disposal", disposal }),
      viewItem: (itemId) => dispatch({ type: "view-item", itemId }),
      markTutorialSeen: () => dispatch({ type: "tutorial-seen" }),
      completeLevel: (levelId, score, stars, bestCombo) =>
        dispatch({ type: "complete-level", levelId, score, stars, bestCombo }),
      recordAnswer: (itemId, correct) =>
        dispatch({ type: "answer", itemId, correct }),
      finishArcade: (result) => dispatch({ type: "finish-arcade", ...result }),
      resetProgress: () => dispatch({ type: "reset-progress" }),
    }),
    [state],
  );

  return <AppContext.Provider value={api}>{children}</AppContext.Provider>;
}

/** Reads the app state. Throws if a component forgot the provider. */
export function useApp() {
  const value = useContext(AppContext);
  if (!value) throw new Error("useApp must be used inside AppProvider");
  return value;
}
