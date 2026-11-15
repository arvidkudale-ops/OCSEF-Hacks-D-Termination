import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CATEGORY_META, CATEGORY_ORDER } from "../data/categories";
import { getItem } from "../data/items";
import { useApp } from "../context/AppContext";
import { usePrefersReducedMotion } from "../lib/motion";
import { playCorrect, playTone, playWrong } from "../lib/sound";
import { hit, miss, newTally, resultFrom, RETRY_POINTS } from "../lib/scoring";
import type { DisposalCategory, LevelResult } from "../types";
import { buttonClass } from "../components/ui";
import { GameChrome } from "./GameChrome";
import { ComboBadge, ItemCard } from "./GameBits";
import type { Fx } from "./GameBits";
import { bossQueue } from "./pools";
import { BinButton, BinGrid, MonsterArena, SceneBanner } from "./art";
import type { MonsterMood } from "./art";
import { Stage3D } from "./three/Stage3D";
import type { StageEvent } from "./three/stage";

const STAGE_BINS = CATEGORY_ORDER.map((category) => ({
  id: category as string,
  label: CATEGORY_META[category].label,
}));

const WAVE_SIZE = 4;

/** Where stuck-on items sit, in % of the monster box. Keeps the face clear. */
const BIT_SLOTS: [number, number][] = [
  [17, 56],
  [83, 56],
  [24, 74],
  [76, 74],
  [37, 85],
  [63, 85],
  [50, 89],
  [21, 38],
  [79, 38],
  [50, 24],
];

const TAUNTS = [
  "The Trash Monster rumbles. Sort the item it tosses forward.",
  "Wave 2. The monster is throwing faster. Quick sorts earn a bigger bonus.",
  "Final wave. Its shield is thin. Keep the bins clean.",
  "Keep going.",
];

export function BossLevel({
  onComplete,
  onRestart,
}: {
  onComplete: (result: LevelResult) => void;
  onRestart: () => void;
}) {
  const navigate = useNavigate();
  const { state, setSound, recordAnswer } = useApp();
  const reduceMotion = usePrefersReducedMotion();
  const [queue] = useState(() =>
    bossQueue(!state.game.levels.boss.completed, state.game.missed),
  );
  const [started, setStarted] = useState(false);
  const [paused, setPaused] = useState(false);
  const [index, setIndex] = useState(0);
  const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(null);
  const [awaitContinue, setAwaitContinue] = useState(false);
  const [won, setWon] = useState(false);
  const [fx, setFx] = useState<Fx | null>(null);
  const [stageEvent, setStageEvent] = useState<StageEvent | null>(null);
  const [, force] = useState(0);
  const tally = useRef(newTally());
  const retry = useRef(false);
  const doneRef = useRef(false);
  const keyRef = useRef<(event: KeyboardEvent) => void>(() => {});
  const advanceRef = useRef<() => void>(() => {});

  const item = getItem(queue[index] ?? "");
  const wave = Math.floor(index / WAVE_SIZE);
  const waveCount = Math.ceil(queue.length / WAVE_SIZE);
  const cleared = index + (awaitContinue || won ? 1 : 0);
  const shield = 1 - cleared / queue.length;
  function choose(category: DisposalCategory) {
    if (!item || awaitContinue || won || paused) return;
    const ok = item.category === category;
    setStageEvent((prev) => ({ n: (prev?.n ?? 0) + 1, ok, binId: category }));
    if (ok) {
      const earned = hit(tally.current, 0, retry.current ? RETRY_POINTS : 100);
      recordAnswer(item.id, true);
      retry.current = false;
      playCorrect(state.sound);
      setFx((prev) => ({ ok: true, n: (prev?.n ?? 0) + 1, earned }));
      setFeedback({
        ok: true,
        text: `The shield cracks. ${item.name} is ${CATEGORY_META[category].label.toLowerCase()}. ${item.why}`,
      });
      setAwaitContinue(true);
      return;
    }
    miss(tally.current, item.id);
    recordAnswer(item.id, false);
    retry.current = true;
    playWrong(state.sound);
    setFx((prev) => ({ ok: false, n: (prev?.n ?? 0) + 1 }));
    setFeedback({
      ok: false,
        text: "The shield holds. Try a different bin.",
    });
    force((n) => n + 1);
  }

  function advance() {
    const next = index + 1;
    if (next >= queue.length) {
      if (doneRef.current) return;
      doneRef.current = true;
      setWon(true);
      playTone(state.sound, 784, 0.25);
      window.setTimeout(() => onComplete(resultFrom(tally.current)), reduceMotion ? 0 : 900);
      return;
    }
    if (next % WAVE_SIZE === 0) playTone(state.sound, 330, 0.2, "square");
    setIndex(next);
    setAwaitContinue(false);
    setFeedback(null);
    setFx(null);
  }

  advanceRef.current = advance;

  useEffect(() => {
    if (!awaitContinue || paused || reduceMotion) return;
    const timer = window.setTimeout(() => advanceRef.current(), 1100);
    return () => window.clearTimeout(timer);
  }, [awaitContinue, paused, reduceMotion, index]);

  keyRef.current = (event: KeyboardEvent) => {
    if (event.key === "Escape") {
      setPaused((value) => !value);
      return;
    }
    if (!started || paused || won) return;
    if (awaitContinue) {
      if (event.key === "Enter") {
        event.preventDefault();
        advance();
      }
      return;
    }
    const category = CATEGORY_ORDER[Number(event.key) - 1];
    if (category) {
      event.preventDefault();
      choose(category);
    }
  };

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => keyRef.current(event);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const remainingBits = queue.slice(cleared, cleared + 10);
  const mood: MonsterMood = won
    ? "defeated"
    : fx && fx.ok
      ? "hurt"
      : shield < 0.34
        ? "tired"
        : "angry";
  /** Flat monster, shown only when the browser cannot draw the 3D arena. */
  const flatArena = (
    <MonsterArena
      shield={shield}
      mood={mood}
      fxKey={fx?.n ?? 0}
      fxClass={fx ? (fx.ok ? "fx-flash" : "fx-grow") : ""}
      bits={remainingBits.map((id, bitIndex) => {
        const [left, top] = BIT_SLOTS[bitIndex % BIT_SLOTS.length];
        return (
          <span
            key={id}
            className="monster-bit shadow"
            style={{ left: `calc(${left}% - 1rem)`, top: `calc(${top}% - 1rem)` }}
          >
            {getItem(id)?.emoji}
          </span>
        );
      })}
    />
  );

  return (
    <GameChrome
      title="The Trash Monster"
      place="A pile of mixed-up waste"
      detail={
        started
          ? `Wave ${Math.min(wave + 1, waveCount)} of ${waveCount} · ${tally.current.points} points · ${tally.current.mistakes} mistakes`
          : "Sort to lower the shield"
      }
      sound={state.sound}
      paused={paused}
      message={feedback?.text ?? (started ? TAUNTS[Math.min(wave, TAUNTS.length - 1)] : undefined)}
      tone={feedback ? (feedback.ok ? "ok" : "bad") : "info"}
      onToggleSound={() => setSound(!state.sound)}
      onPause={() => setPaused(true)}
      onResume={() => setPaused(false)}
      onRestart={onRestart}
      onExit={() => navigate("/adventure")}
    >
      {!started ? (
        <div className="overflow-hidden rounded-3xl bg-white ring-1 ring-forest-900/10">
          <Stage3D
            theme="boss"
            className="h-56 sm:h-72"
            bits={queue.slice(0, 10).map((id) => getItem(id)?.emoji ?? "♻️")}
            fallback={<SceneBanner levelId="boss" className="h-40 sm:h-48" />}
          />
          <div className="p-6">
          <p className="text-sm leading-6 text-ink-soft">
            This monster is built from {queue.length} pieces of badly sorted waste. There is nothing to hit. Each correct sort
            pulls one piece off and cracks its pollution shield. It comes in {waveCount} waves. Take as long as you need.
          </p>
          {state.game.levels.boss.completed && Object.keys(state.game.missed).length > 0 ? (
            <p className="mt-2 text-sm font-bold text-forest-900">
              Rematch: the monster has grabbed items from your review pile.
            </p>
          ) : null}
          <button className={`${buttonClass()} mt-4`} type="button" onClick={() => setStarted(true)}>
            Start the challenge
          </button>
          </div>
        </div>
      ) : (
        <div className="rounded-3xl bg-[#e7f0df] p-4 ring-1 ring-forest-900/10">
          <Stage3D
            theme="boss"
            className="h-72 rounded-3xl sm:h-96"
            bins={STAGE_BINS}
            emoji={item && !won ? item.emoji : null}
            itemKey={index}
            event={stageEvent}
            shield={shield}
            mood={mood}
            bits={remainingBits.map((id) => getItem(id)?.emoji ?? "♻️")}
            onChoose={(binId) => choose(binId as DisposalCategory)}
            fallback={flatArena}
          />
          <div className="mx-auto mt-4 flex max-w-xs items-center justify-between text-sm font-extrabold text-forest-900">
            <span>Pollution shield</span>
            <span>
              {queue.length - cleared} pieces left
            </span>
          </div>
          <div
            className="mx-auto mt-1 h-3 max-w-xs rounded-full bg-white"
            role="meter"
            aria-valuenow={Math.round(shield * 100)}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Pollution shield"
          >
            <div className="h-3 rounded-full bg-amber-800 transition-[width]" style={{ width: `${Math.max(0, shield * 100)}%` }} />
          </div>
          {item && !won ? (
            <div className="mx-auto mt-4 max-w-xl space-y-3">
              <ComboBadge combo={tally.current.combo} />
              <ItemCard item={item} fx={fx} enterKey={index} />
              <BinGrid count={CATEGORY_ORDER.length}>
                {CATEGORY_ORDER.map((category, categoryIndex) => (
                  <BinButton
                    key={category}
                    binId={category}
                    label={CATEGORY_META[category].label}
                    hotkey={categoryIndex + 1}
                    disabled={awaitContinue}
                    onClick={() => choose(category)}
                  />
                ))}
              </BinGrid>
              <p className="text-xs text-ink-soft">Keyboard: press 1 through {CATEGORY_ORDER.length}. Enter moves on.</p>
              {awaitContinue ? (
                <button className={buttonClass()} type="button" onClick={advance}>
                  {index + 1 === queue.length ? "Clear the shield" : "Next item"}
                </button>
              ) : null}
            </div>
          ) : (
            <p className="mt-4 text-center font-display text-2xl text-forest-900">The shield is gone. The block is clean.</p>
          )}
        </div>
      )}
    </GameChrome>
  );
}
