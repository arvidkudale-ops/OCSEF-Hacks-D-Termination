import { useCallback, useEffect, useRef, useState } from "react";
import type {
  MouseEvent as ReactMouseEvent,
  PointerEvent as ReactPointerEvent,
} from "react";
import { useNavigate } from "react-router-dom";
import { getItem } from "../data/items";
import type { Spawn } from "../data/levels";
import { useApp } from "../context/AppContext";
import { playCorrect, playPickup, playWrong } from "../lib/sound";
import { hit, miss, newTally, resultFrom, RETRY_POINTS } from "../lib/scoring";
import type { Tally } from "../lib/scoring";
import type { DisposalCategory, LevelResult } from "../types";
import { buttonClass } from "../components/ui";
import { GameChrome } from "./GameChrome";
import { ComboBadge } from "./GameBits";
import { neighborhoodLitter } from "./pools";
import { paintNeighborhood, SOLIDS, WORLD_H, WORLD_W } from "./neighborhoodArt";

const SPEED = 280;
/** How close the player can stand to a wall before the building stops them. */
const BODY = 14;
/** Two hands and a bag: you have to sort before you can grab more. */
const CARRY_LIMIT = 3;

const BINS: {
  id: string;
  category: DisposalCategory;
  x: number;
  y: number;
  label: string;
}[] = [
  { id: "recycle", category: "recycle", x: 1700, y: 1180, label: "Recycle" },
  { id: "compost", category: "compost", x: 1860, y: 1180, label: "Compost" },
  { id: "reuse", category: "reuse", x: 2020, y: 1180, label: "Reuse" },
  { id: "trash", category: "trash", x: 2180, y: 1180, label: "Trash" },
];

type Target =
  | { kind: "point"; x: number; y: number }
  | { kind: "item"; x: number; y: number; litterId: string }
  | { kind: "bin"; x: number; y: number; binId: string; deposit: boolean };

interface Litter {
  id: string;
  itemId: string;
  x: number;
  y: number;
  taken: boolean;
}

interface Runtime {
  player: { x: number; y: number };
  facing: 1 | -1;
  moving: boolean;
  target: Target | null;
  litters: Litter[];
  inventory: string[];
  selected: number;
  sorted: number;
  tally: Tally;
  retryIds: Set<string>;
  effects: { x: number; y: number; text: string; color: string; age: number }[];
  onAnswer: (itemId: string, correct: boolean) => void;
  paused: boolean;
  keys: Set<string>;
  message: string;
  tone: "info" | "ok" | "bad";
  nearItemId: string | null;
  nearBinId: string | null;
  done: boolean;
  time: number;
  cam: { x: number; y: number; w: number; h: number };
}

interface Hud {
  sorted: number;
  total: number;
  mistakes: number;
  points: number;
  combo: number;
  paused: boolean;
  message: string;
  tone: "info" | "ok" | "bad";
  inventory: { id: string; itemId: string }[];
  selected: number;
  remaining: { id: string; itemId: string }[];
  nearItemId: string | null;
  nearBinId: string | null;
  traveling: boolean;
}

function createRuntime(spawns: Spawn[]): Runtime {
  return {
    player: { x: 700, y: 760 },
    facing: 1,
    moving: false,
    target: null,
    litters: spawns.map((spawn) => ({ ...spawn, taken: false })),
    inventory: [],
    selected: 0,
    sorted: 0,
    tally: newTally(),
    retryIds: new Set(),
    effects: [],
    onAnswer: () => {},
    paused: false,
    keys: new Set(),
    message:
      "Walk the neighborhood, pick up litter, and sort it at the depot on the right.",
    tone: "info",
    nearItemId: null,
    nearBinId: null,
    done: false,
    time: 0,
    cam: { x: 0, y: 0, w: 800, h: 480 },
  };
}

function readHud(runtime: Runtime): Hud {
  return {
    sorted: runtime.sorted,
    total: runtime.litters.length,
    mistakes: runtime.tally.mistakes,
    points: runtime.tally.points,
    combo: runtime.tally.combo,
    paused: runtime.paused,
    message: runtime.message,
    tone: runtime.tone,
    inventory: runtime.inventory.map((id) => ({
      id,
      itemId: runtime.litters.find((litter) => litter.id === id)?.itemId ?? "",
    })),
    selected: runtime.selected,
    remaining: runtime.litters
      .filter((litter) => !litter.taken)
      .map((litter) => ({ id: litter.id, itemId: litter.itemId })),
    nearItemId: runtime.nearItemId,
    nearBinId: runtime.nearBinId,
    traveling: runtime.target !== null,
  };
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function pickup(runtime: Runtime, litterId: string, sound: boolean) {
  const litter = runtime.litters.find((entry) => entry.id === litterId);
  if (!litter || litter.taken) return false;
  if (runtime.inventory.length >= CARRY_LIMIT) {
    runtime.message = `Your hands are full (${CARRY_LIMIT} items). Sort something at the depot first.`;
    runtime.tone = "bad";
    playWrong(sound);
    return true;
  }
  litter.taken = true;
  runtime.inventory.push(litter.id);
  runtime.selected = runtime.inventory.length - 1;
  const item = getItem(litter.itemId);
  // Do not name the bin here. Deciding is the whole lesson.
  runtime.message = `Picked up ${item?.name ?? "an item"}. Which bin does it belong in? Carrying ${runtime.inventory.length} of ${CARRY_LIMIT}.`;
  runtime.tone = "info";
  playPickup(sound);
  return true;
}

function deposit(runtime: Runtime, binId: string, sound: boolean) {
  const bin = BINS.find((entry) => entry.id === binId);
  const litterId = runtime.inventory[runtime.selected];
  if (!bin || !litterId) {
    runtime.message =
      "Choose an item in your inventory, then sort it into a bin.";
    runtime.tone = "info";
    return true;
  }
  const litter = runtime.litters.find((entry) => entry.id === litterId);
  const item = litter ? getItem(litter.itemId) : undefined;
  if (!item) return false;
  if (item.category === bin.category) {
    runtime.inventory = runtime.inventory.filter((id) => id !== litterId);
    runtime.selected = Math.max(
      0,
      Math.min(runtime.selected, runtime.inventory.length - 1),
    );
    runtime.sorted += 1;
    const earned = hit(
      runtime.tally,
      0,
      runtime.retryIds.has(litterId) ? RETRY_POINTS : 100,
    );
    runtime.onAnswer(item.id, true);
    runtime.effects.push({
      x: bin.x,
      y: bin.y - 60,
      text: `+${earned}`,
      color: "#1b4332",
      age: 0,
    });
    runtime.message = `Yes. ${item.name} goes in ${bin.label}. ${item.why}`;
    runtime.tone = "ok";
    playCorrect(sound);
    if (runtime.sorted >= runtime.litters.length) {
      runtime.done = true;
      runtime.message =
        "The block is clean. Every item landed in the right bin.";
    }
    return true;
  }
  miss(runtime.tally, item.id);
  runtime.retryIds.add(litterId);
  runtime.onAnswer(item.id, false);
  runtime.effects.push({
    x: bin.x,
    y: bin.y - 60,
    text: "✗",
    color: "#991b1b",
    age: 0,
  });
  runtime.message = `Not this bin. Try another one.`;
  runtime.tone = "bad";
  playWrong(sound);
  return true;
}

/** True when the player's body would overlap a house, the cafe, or the school. */
function blockedAt(x: number, y: number) {
  return SOLIDS.some(
    (block) =>
      x + BODY > block.x &&
      x - BODY < block.x + block.w &&
      y + BODY > block.y &&
      y - BODY < block.y + block.h,
  );
}

/** Move on each axis on its own so the player slides along a wall instead of entering it. */
function place(runtime: Runtime, x: number, y: number) {
  const nx = clamp(x, 24, WORLD_W - 24);
  const ny = clamp(y, 24, WORLD_H - 24);
  if (!blockedAt(nx, ny)) {
    runtime.player.x = nx;
    runtime.player.y = ny;
    return true;
  }
  const xOk = !blockedAt(nx, runtime.player.y);
  if (xOk) runtime.player.x = nx;
  const yOk = !blockedAt(runtime.player.x, ny);
  if (yOk) runtime.player.y = ny;
  return xOk || yOk;
}

/** Step sideways when a clicked destination is on the far side of a building. */
function nudgeAround(runtime: Runtime, step: number, dx: number, dy: number) {
  const aheadX = runtime.player.x + Math.sign(dx || 1) * 8;
  const aheadY = runtime.player.y + Math.sign(dy || 1) * 8;
  const block = SOLIDS.find(
    (solid) =>
      aheadX + BODY > solid.x &&
      aheadX - BODY < solid.x + solid.w &&
      aheadY + BODY > solid.y &&
      aheadY - BODY < solid.y + solid.h,
  );
  if (!block) return;
  const slideX = runtime.player.x < block.x + block.w / 2 ? -step : step;
  if (!blockedAt(runtime.player.x + slideX, runtime.player.y)) {
    runtime.player.x = clamp(runtime.player.x + slideX, 24, WORLD_W - 24);
    return;
  }
  const slideY = runtime.player.y < block.y + block.h / 2 ? -step : step;
  if (!blockedAt(runtime.player.x, runtime.player.y + slideY)) {
    runtime.player.y = clamp(runtime.player.y + slideY, 24, WORLD_H - 24);
  }
}

function stepWorld(runtime: Runtime, dt: number, sound: boolean) {
  let changed = false;
  runtime.time += dt;
  for (const effect of runtime.effects) effect.age += dt;
  runtime.effects = runtime.effects.filter((effect) => effect.age < 1.1);
  const startX = runtime.player.x;
  const startY = runtime.player.y;
  let mx = 0;
  let my = 0;
  if (runtime.keys.has("up")) my -= 1;
  if (runtime.keys.has("down")) my += 1;
  if (runtime.keys.has("left")) mx -= 1;
  if (runtime.keys.has("right")) mx += 1;
  if (mx !== 0 || my !== 0) {
    if (runtime.target) changed = true;
    runtime.target = null;
    const length = Math.hypot(mx, my) || 1;
    place(
      runtime,
      runtime.player.x + (mx / length) * SPEED * dt,
      runtime.player.y + (my / length) * SPEED * dt,
    );
  } else if (runtime.target) {
    const dx = runtime.target.x - runtime.player.x;
    const dy = runtime.target.y - runtime.player.y;
    const distance = Math.hypot(dx, dy);
    if (distance < 12) {
      const target = runtime.target;
      runtime.target = null;
      changed = true;
      if (target.kind === "item") pickup(runtime, target.litterId, sound);
      if (target.kind === "bin" && target.deposit)
        deposit(runtime, target.binId, sound);
    } else {
      const step = Math.min(SPEED * dt, distance);
      const moved = place(
        runtime,
        runtime.player.x + (dx / distance) * step,
        runtime.player.y + (dy / distance) * step,
      );
      if (!moved) nudgeAround(runtime, step, dx, dy);
    }
  }

  const movedX = runtime.player.x - startX;
  runtime.moving = Math.hypot(movedX, runtime.player.y - startY) > 0.01;
  if (Math.abs(movedX) > 0.01) runtime.facing = movedX > 0 ? 1 : -1;

  const nearItem = runtime.litters
    .filter((litter) => !litter.taken)
    .map((litter) => ({
      litter,
      distance: Math.hypot(
        litter.x - runtime.player.x,
        litter.y - runtime.player.y,
      ),
    }))
    .filter((entry) => entry.distance < 56)
    .sort((a, b) => a.distance - b.distance)[0];
  const nearBin = BINS.map((bin) => ({
    bin,
    distance: Math.hypot(bin.x - runtime.player.x, bin.y - runtime.player.y),
  }))
    .filter((entry) => entry.distance < 78)
    .sort((a, b) => a.distance - b.distance)[0];
  const nearItemId = nearItem?.litter.id ?? null;
  const nearBinId = nearBin?.bin.id ?? null;
  if (nearItemId !== runtime.nearItemId || nearBinId !== runtime.nearBinId) {
    runtime.nearItemId = nearItemId;
    runtime.nearBinId = nearBinId;
    changed = true;
  }
  return changed;
}

export function NeighborhoodLevel({
  onComplete,
  onRestart,
}: {
  onComplete: (result: LevelResult) => void;
  onRestart: () => void;
}) {
  const navigate = useNavigate();
  const { state, setSound, recordAnswer } = useApp();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [initial] = useState(() =>
    createRuntime(
      neighborhoodLitter(
        !state.game.levels.neighborhood.completed,
        state.game.missed,
      ),
    ),
  );
  const runtime = useRef<Runtime>(initial);
  runtime.current.onAnswer = recordAnswer;
  const finished = useRef(false);
  const onCompleteRef = useRef(onComplete);
  const soundRef = useRef(state.sound);
  const actRef = useRef<() => void>(() => {});
  const [hud, setHud] = useState(() => readHud(runtime.current));
  onCompleteRef.current = onComplete;
  soundRef.current = state.sound;

  const sync = useCallback(() => setHud(readHud(runtime.current)), []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;
    let alive = true;
    let frame = 0;
    let last = performance.now();
    let reported = false;
    const loop = (now: number) => {
      if (!alive) return;
      try {
        const dt = Math.min(0.033, (now - last) / 1000);
        last = now;
        const current = runtime.current;
        if (!current.paused && !current.done) {
          if (stepWorld(current, dt, soundRef.current)) sync();
          if (current.done && !finished.current) {
            finished.current = true;
            onCompleteRef.current(resultFrom(current.tally));
          }
        }
        paintNeighborhood(context, canvas, current, BINS);
      } catch (error) {
        if (!reported) {
          reported = true;
          console.error(error);
        }
      }
      if (alive) frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);
    return () => {
      alive = false;
      cancelAnimationFrame(frame);
    };
  }, [sync]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" || target.tagName === "TEXTAREA")
      )
        return;
      const map: Record<string, string> = {
        ArrowUp: "up",
        KeyW: "up",
        ArrowDown: "down",
        KeyS: "down",
        ArrowLeft: "left",
        KeyA: "left",
        ArrowRight: "right",
        KeyD: "right",
      };
      if (event.key === "Escape") {
        runtime.current.paused = !runtime.current.paused;
        runtime.current.keys.clear();
        sync();
        return;
      }
      if (runtime.current.paused) return;
      const direction = map[event.code];
      if (direction) {
        event.preventDefault();
        runtime.current.keys.add(direction);
        return;
      }
      if (
        event.code === "KeyE" ||
        (event.code === "Space" && target?.tagName !== "BUTTON")
      ) {
        event.preventDefault();
        actRef.current();
      }
      if (event.code.startsWith("Digit")) {
        const index = Number(event.code.slice(5)) - 1;
        if (index >= 0 && index < runtime.current.inventory.length) {
          runtime.current.selected = index;
          sync();
        }
      }
    }
    function onKeyUp(event: KeyboardEvent) {
      const map: Record<string, string> = {
        ArrowUp: "up",
        KeyW: "up",
        ArrowDown: "down",
        KeyS: "down",
        ArrowLeft: "left",
        KeyA: "left",
        ArrowRight: "right",
        KeyD: "right",
      };
      const direction = map[event.code];
      if (direction) runtime.current.keys.delete(direction);
    }
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("blur", clearKeys);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", clearKeys);
    };
    function clearKeys() {
      runtime.current.keys.clear();
    }
  }, [sync]);

  function act() {
    const current = runtime.current;
    if (
      current.nearItemId &&
      pickup(current, current.nearItemId, soundRef.current)
    ) {
      sync();
      return;
    }
    if (
      current.nearBinId &&
      deposit(current, current.nearBinId, soundRef.current)
    ) {
      sync();
      return;
    }
    if (
      current.inventory.length >= CARRY_LIMIT ||
      (current.inventory.length > 0 &&
        current.litters.every((litter) => litter.taken))
    ) {
      current.target = { kind: "point", x: 1960, y: 1290 };
      current.message =
        "Heading to the sorting depot. Pick a bin when you get there.";
      current.tone = "info";
      sync();
      return;
    }
    const next = current.litters.find((litter) => !litter.taken);
    if (next) {
      current.target = {
        kind: "item",
        x: next.x,
        y: next.y,
        litterId: next.id,
      };
      sync();
    }
  }

  actRef.current = act;

  function hold(direction: string) {
    return {
      onPointerDown: (event: ReactPointerEvent<HTMLButtonElement>) => {
        event.preventDefault();
        event.currentTarget.setPointerCapture(event.pointerId);
        runtime.current.keys.add(direction);
        runtime.current.target = null;
      },
      onPointerUp: () => runtime.current.keys.delete(direction),
      onPointerCancel: () => runtime.current.keys.delete(direction),
    };
  }

  function onCanvasClick(event: ReactMouseEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    if (!canvas || runtime.current.paused) return;
    const rect = canvas.getBoundingClientRect();
    const current = runtime.current;
    const x =
      ((event.clientX - rect.left) / rect.width) * current.cam.w +
      current.cam.x;
    const y =
      ((event.clientY - rect.top) / rect.height) * current.cam.h +
      current.cam.y;
    const litter = current.litters
      .filter((entry) => !entry.taken)
      .find((entry) => Math.hypot(entry.x - x, entry.y - y) < 40);
    const bin = BINS.find((entry) => Math.hypot(entry.x - x, entry.y - y) < 50);
    if (litter)
      current.target = {
        kind: "item",
        x: litter.x,
        y: litter.y,
        litterId: litter.id,
      };
    else if (bin)
      current.target = {
        kind: "bin",
        x: bin.x,
        y: bin.y + 70,
        binId: bin.id,
        deposit: true,
      };
    else if (!blockedAt(x, y)) current.target = { kind: "point", x, y };
    sync();
  }

  const selected = hud.inventory[hud.selected];
  const selectedItem = selected ? getItem(selected.itemId) : undefined;

  return (
    <GameChrome
      title="The Neighborhood Cleanup"
      place="A few blocks around home"
      detail={`Sorted ${hud.sorted} of ${hud.total} · ${hud.points} points · ${hud.mistakes} mistakes`}
      sound={state.sound}
      paused={hud.paused}
      message={hud.traveling ? `On the way. ${hud.message}` : hud.message}
      tone={hud.tone}
      onToggleSound={() => setSound(!state.sound)}
      onPause={() => {
        runtime.current.paused = true;
        runtime.current.keys.clear();
        sync();
      }}
      onResume={() => {
        runtime.current.paused = false;
        sync();
      }}
      onRestart={onRestart}
      onExit={() => navigate("/adventure")}
    >
      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_17rem]">
        <div>
          <p className="sr-only">
            Top-down neighborhood with a park, cafe, school, homes, and a
            sorting depot. Use arrow keys or the pad to move. E or the action
            button picks up litter and sorts the selected item.
          </p>
          <div className="h-80 overflow-hidden rounded-3xl bg-[#8cbf6e] shadow-[inset_0_0_0_1px_rgba(27,67,50,0.15)] sm:h-[30rem]">
            <canvas
              ref={canvasRef}
              className="h-full w-full touch-none"
              aria-hidden
              onClick={onCanvasClick}
            />
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <div className="grid grid-cols-3 gap-1" aria-label="Movement pad">
              <span />
              <Pad label="Move up" {...hold("up")} />
              <span />
              <Pad label="Move left" {...hold("left")} />
              <Pad label="Move down" {...hold("down")} />
              <Pad label="Move right" {...hold("right")} />
            </div>
            <button className={buttonClass()} type="button" onClick={act}>
              {hud.nearItemId
                ? "Pick up"
                : hud.nearBinId
                  ? "Sort into this bin"
                  : hud.inventory.length >= CARRY_LIMIT ||
                      (hud.inventory.length > 0 && hud.remaining.length === 0)
                    ? "Walk to the depot"
                    : "Go to the next item"}
            </button>
          </div>
        </div>
        <div className="space-y-3 rounded-3xl bg-white p-3 ring-1 ring-forest-900/10">
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-sm font-extrabold text-forest-900">
                Carrying {hud.inventory.length} of {CARRY_LIMIT}
              </h2>
              <ComboBadge combo={hud.combo} />
            </div>
            {hud.inventory.length === 0 ? (
              <p className="mt-1 text-sm text-ink-soft">
                Empty. Pick something up.
              </p>
            ) : null}
            <div className="mt-2 flex flex-col gap-1">
              {hud.inventory.map((entry, index) => {
                const item = getItem(entry.itemId);
                return (
                  <button
                    key={entry.id}
                    type="button"
                    aria-pressed={index === hud.selected}
                    className={
                      index === hud.selected
                        ? buttonClass()
                        : buttonClass("secondary")
                    }
                    onClick={() => {
                      runtime.current.selected = index;
                      sync();
                    }}
                  >
                    {index + 1}. {item?.emoji} {item?.name}
                  </button>
                );
              })}
            </div>
          </div>
          <div>
            <h2 className="text-sm font-extrabold text-forest-900">Bins</h2>
            <div className="mt-2 flex flex-col gap-1">
              {BINS.map((bin) => (
                <button
                  key={bin.id}
                  className={buttonClass("secondary")}
                  type="button"
                  onClick={() => {
                    const current = runtime.current;
                    const distance = Math.hypot(
                      bin.x - current.player.x,
                      bin.y - current.player.y,
                    );
                    if (distance < 80) {
                      deposit(current, bin.id, soundRef.current);
                      sync();
                      return;
                    }
                    current.target = {
                      kind: "bin",
                      x: bin.x,
                      y: bin.y + 70,
                      binId: bin.id,
                      deposit: true,
                    };
                    sync();
                  }}
                >
                  {hud.nearBinId === bin.id && selectedItem
                    ? `Sort ${selectedItem.name} into ${bin.label}`
                    : `Walk to ${bin.label}`}
                </button>
              ))}
            </div>
          </div>
          <div>
            <h2 className="text-sm font-extrabold text-forest-900">
              Still outside
            </h2>
            <div className="mt-2 flex max-h-40 flex-col gap-1 overflow-auto">
              {hud.remaining.map((entry) => {
                const item = getItem(entry.itemId);
                return (
                  <button
                    key={entry.id}
                    className={buttonClass("ghost")}
                    type="button"
                    onClick={() => {
                      const litter = runtime.current.litters.find(
                        (candidate) => candidate.id === entry.id,
                      );
                      if (!litter) return;
                      runtime.current.target = {
                        kind: "item",
                        x: litter.x,
                        y: litter.y,
                        litterId: litter.id,
                      };
                      sync();
                    }}
                  >
                    Go to {item?.name}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </GameChrome>
  );
}

function Pad({
  label,
  onPointerDown,
  onPointerUp,
  onPointerCancel,
}: {
  label: string;
  onPointerDown: (event: ReactPointerEvent<HTMLButtonElement>) => void;
  onPointerUp: () => void;
  onPointerCancel: () => void;
}) {
  return (
    <button
      className="grid h-11 w-11 place-items-center rounded-2xl bg-white text-lg font-extrabold text-forest-900 ring-1 ring-forest-900/10"
      type="button"
      aria-label={label}
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
    >
      {label.includes("up")
        ? "↑"
        : label.includes("down")
          ? "↓"
          : label.includes("left")
            ? "←"
            : "→"}
    </button>
  );
}
