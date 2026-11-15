import { afterEach, describe, expect, it, vi } from "vitest";
import {
  createBackup,
  initialState,
  loadState,
  parseBackup,
} from "../src/lib/storage";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("loadState daily challenge data", () => {
  it("preserves a valid saved day and streak", () => {
    vi.stubGlobal("localStorage", {
      getItem: () =>
        JSON.stringify({
          game: { daily: { lastDay: "2026-11-15", streak: 4 } },
        }),
    });

    expect(loadState().game.daily).toMatchObject({
      lastDay: "2026-11-15",
      streak: 4,
    });
  });

  it("clears a malformed saved day", () => {
    vi.stubGlobal("localStorage", {
      getItem: () =>
        JSON.stringify({
          game: { daily: { lastDay: "yesterday", streak: 4 } },
        }),
    });

    expect(loadState().game.daily).toMatchObject({
      lastDay: "",
      streak: 4,
    });
  });
});

describe("D-Trashify backups", () => {
  it("round-trips saved app state", () => {
    const state = initialState();
    state.displayName = "Sam";
    state.zip = "90012";
    state.game.daily = {
      lastDay: "2026-11-15",
      streak: 3,
      lastScore: 820,
      lastGrid: "🟩🟩🟥",
    };

    expect(parseBackup(createBackup(state))).toEqual(state);
  });

  it("rejects files that are not D-Trashify backups", () => {
    expect(() => parseBackup(JSON.stringify({ app: "Other app" }))).toThrow(
      "This file is not a valid D-Trashify backup.",
    );
  });

  it("rejects incomplete backup data", () => {
    expect(() =>
      parseBackup(
        JSON.stringify({
          app: "D-Trashify",
          formatVersion: 1,
          state: {},
        }),
      ),
    ).toThrow("This backup is incomplete or from an unsupported version.");
  });
});
