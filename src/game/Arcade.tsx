import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { CATEGORY_META, CATEGORY_ORDER } from "../data/categories";
import { getItem } from "../data/items";
import { useApp } from "../context/AppContext";
import { dayKey, previousDay } from "../lib/day";
import { usePrefersReducedMotion } from "../lib/motion";
import { playCorrect, playTone, playWrong } from "../lib/sound";
import { finalScore, hit, miss, newTally, RETRY_POINTS } from "../lib/scoring";
import type { ArcadeMode, DisposalCategory } from "../types";
import { buttonClass, Card } from "../components/ui";
import { GameChrome } from "./GameChrome";
import { ComboBadge, ItemCard, MissedList } from "./GameBits";
import type { Fx } from "./GameBits";
import { dailyItems, reviewItems, rushPicker } from "./pools";
import { BinButton, BinGrid, SceneBanner } from "./art";

const BANNER = {
  rush: "sorting",
  daily: "neighborhood",
  review: "recycling",
} as const;

export const ARCADE_INFO: Record<
  ArcadeMode,
  { title: string; place: string; intro: string }
> = {
  rush: {
    title: "Sort Rush",
    place: "Arcade",
    intro:
      "Sort as many items as you can. There is no clock and no limit on tries. A wrong bin never tells you the right one. Quit when you want to stop.",
  },
  daily: {
    title: "Daily Challenge",
    place: "Arcade",
    intro:
      "Ten items, the same for everyone today. You can try each one again. The right bin stays hidden until you find it.",
  },
  review: {
    title: "Review Pile",
    place: "Practice",
    intro:
      "Items you have put in the wrong bin come back here. Sort one correctly to shrink its weight. Clear the pile to earn an achievement.",
  },
};

type Phase = "intro" | "play" | "over";

export function Arcade({ mode }: { mode: ArcadeMode }) {
  const navigate = useNavigate();
  const { state, setSound, recordAnswer, finishArcade } = useApp();
  const reduceMotion = usePrefersReducedMotion();
  const info = ARCADE_INFO[mode];
  const [today] = useState(() => dayKey());
  const alreadyPlayed = mode === "daily" && state.game.daily.lastDay === today;
  const [phase, setPhase] = useState<Phase>("intro");
  const [paused, setPaused] = useState(false);
  const [queue, setQueue] = useState<string[]>([]);
  const [index, setIndex] = useState(0);
  const [feedback, setFeedback] = useState<{
    ok: boolean;
    text: string;
  } | null>(null);
  const [awaitContinue, setAwaitContinue] = useState(false);
  const [fx, setFx] = useState<Fx | null>(null);
  const [grid, setGrid] = useState<string[]>([]);
  const [summary, setSummary] = useState<{
    score: number;
    prevBest: number;
    streak: number;
    missed: string[];
    combo: number;
  } | null>(null);
  const tally = useRef(newTally());
  const retry = useRef(false);
  const pickRef = useRef<() => string>(() => "");
  const keyRef = useRef<(event: KeyboardEvent) => void>(() => {});
  const advanceRef = useRef<() => void>(() => {});
  const endedRef = useRef(false);

  const item = getItem(queue[index] ?? "");
  const reviewCount = Object.keys(state.game.missed).length;

  function start() {
    tally.current = newTally();
    retry.current = false;
    endedRef.current = false;
    setGrid([]);
    setIndex(0);
    setFeedback(null);
    setFx(null);
    setAwaitContinue(false);
    setSummary(null);
    setPaused(false);
    if (mode === "rush") {
      pickRef.current = rushPicker(
        state.game.missed,
        state.scans.map((scan) => scan.itemId),
      );
      setQueue([pickRef.current()]);
    } else if (mode === "daily") {
      setQueue(dailyItems(today));
    } else {
      setQueue(reviewItems(state.game.missed));
    }
    setPhase("play");
  }

  function end(finalGrid = grid) {
    if (endedRef.current) return;
    endedRef.current = true;
    const score = finalScore(tally.current);
    const prevBest = state.game.rushBest;
    const counted = mode !== "daily" || !alreadyPlayed;
    const streak =
      state.game.daily.lastDay === previousDay(today)
        ? state.game.daily.streak
        : 0;
    finishArcade({
      mode,
      score,
      bestCombo: tally.current.bestCombo,
      day: mode === "daily" && counted ? today : undefined,
      grid: finalGrid.join(""),
    });
    playTone(state.sound, 660, 0.2);
    setSummary({
      score,
      prevBest,
      streak:
        mode === "daily" && counted ? streak + 1 : state.game.daily.streak,
      missed: [...tally.current.missed],
      combo: tally.current.bestCombo,
    });
    setPhase("over");
  }

  function choose(category: DisposalCategory) {
    if (!item || phase !== "play" || paused || awaitContinue) return;
    const ok = item.category === category;
    const label = CATEGORY_META[item.category].label.toLowerCase();
    if (ok) {
      const earned = hit(tally.current, 0, retry.current ? RETRY_POINTS : 100);
      recordAnswer(item.id, true);
      playCorrect(state.sound);
      setFx((prev) => ({ ok: true, n: (prev?.n ?? 0) + 1, earned }));
      setFeedback({ ok: true, text: `${item.name}: ${label}. ${item.why}` });
    } else {
      miss(tally.current, item.id);
      recordAnswer(item.id, false);
      playWrong(state.sound);
      setFx((prev) => ({ ok: false, n: (prev?.n ?? 0) + 1 }));
      setFeedback({ ok: false, text: "Not that bin. Try another one." });
      retry.current = true;
      return;
    }

    retry.current = false;
    if (mode === "rush") {
      setQueue((current) => [...current, pickRef.current()]);
      setIndex((value) => value + 1);
      return;
    }

    if (mode === "daily") {
      setGrid([...grid, "🟩"]);
      setAwaitContinue(true);
      return;
    }

    setAwaitContinue(true);
  }

  function advance() {
    if (phase !== "play") return;
    retry.current = false;
    if (index + 1 >= queue.length) {
      end();
      return;
    }
    setIndex((value) => value + 1);
    setAwaitContinue(false);
    setFeedback(null);
    setFx(null);
  }

  advanceRef.current = advance;

  useEffect(() => {
    if (!awaitContinue || paused || reduceMotion) return;
    const timer = window.setTimeout(() => advanceRef.current(), 1600);
    return () => window.clearTimeout(timer);
  }, [awaitContinue, paused, reduceMotion, index]);

  keyRef.current = (event: KeyboardEvent) => {
    if (event.key === "Escape" && phase === "play") {
      setPaused((value) => !value);
      return;
    }
    if (phase !== "play" || paused) return;
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

  if (phase === "over" && summary) {
    return (
      <ArcadeResults
        mode={mode}
        summary={summary}
        grid={grid}
        today={today}
        counted={mode !== "daily" || !alreadyPlayed}
        onAgain={start}
        canAgain={mode !== "review" || reviewCount > 0}
      />
    );
  }

  const progress =
    mode === "rush"
      ? `${tally.current.points} points`
      : `Item ${Math.min(index + 1, queue.length)} of ${queue.length} · ${tally.current.points} points`;

  return (
    <GameChrome
      title={info.title}
      place={info.place}
      detail={
        phase === "play"
          ? progress
          : mode === "daily"
            ? `Challenge for ${today}`
            : info.place
      }
      sound={state.sound}
      paused={paused}
      message={feedback?.text}
      tone={feedback ? (feedback.ok ? "ok" : "bad") : "info"}
      onToggleSound={() => setSound(!state.sound)}
      onPause={() => setPaused(true)}
      onResume={() => setPaused(false)}
      onRestart={start}
      onExit={() => navigate("/adventure")}
    >
      {phase === "intro" ? (
        <div className="overflow-hidden rounded-3xl bg-white ring-1 ring-forest-900/10">
          <SceneBanner levelId={BANNER[mode]} className="h-32 sm:h-40" />
          <div className="p-6">
            <p className="text-sm leading-6 text-ink-soft">{info.intro}</p>
            {mode === "rush" && state.game.rushBest > 0 ? (
              <p className="mt-2 text-sm font-bold text-forest-900">
                Your best: {state.game.rushBest}
              </p>
            ) : null}
            {mode === "daily" && alreadyPlayed ? (
              <p className="mt-2 rounded-2xl bg-leaf-100 px-3 py-2 text-sm text-forest-900">
                You already finished today's challenge with{" "}
                {state.game.daily.lastScore} points {state.game.daily.lastGrid}.
                Another run is practice and will not change your streak. Come
                back tomorrow for new items.
              </p>
            ) : null}
            {mode === "daily" && state.game.daily.streak > 0 ? (
              <p className="mt-2 text-sm font-bold text-forest-900">
                Current streak: {state.game.daily.streak} day
                {state.game.daily.streak === 1 ? "" : "s"}
              </p>
            ) : null}
            {mode === "review" && reviewCount === 0 ? (
              <p className="mt-2 rounded-2xl bg-leaf-100 px-3 py-2 text-sm text-forest-900">
                Your review pile is empty. Items appear here after you put them
                in the wrong bin in any level or mode.
              </p>
            ) : null}
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                className={buttonClass()}
                type="button"
                onClick={start}
                disabled={mode === "review" && reviewCount === 0}
              >
                {mode === "daily" && alreadyPlayed
                  ? "Practice today's items"
                  : "Start"}
              </button>
              <Link className={buttonClass("ghost")} to="/adventure">
                Back
              </Link>
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-3xl bg-[#eef3e6] p-4 ring-1 ring-forest-900/10">
          <div className="mx-auto max-w-xl space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <ComboBadge combo={tally.current.combo} />
              {mode === "daily" ? (
                <span
                  className="text-lg tracking-wider"
                  aria-label="Results so far"
                >
                  {grid.join("") || " "}
                </span>
              ) : null}
            </div>
            {mode === "rush" ? null : (
              <div className="flex gap-1" aria-hidden>
                {queue.map((id, i) => (
                  <span
                    key={`${id}-${i}`}
                    className={`h-2 flex-1 rounded-full ${i < index ? "bg-leaf-600" : i === index ? "bg-leaf-300" : "bg-white"}`}
                  />
                ))}
              </div>
            )}
            <ItemCard
              item={item}
              fx={fx}
              belt={mode === "rush"}
              enterKey={index}
            />
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
            <p className="text-xs text-ink-soft">
              Keyboard: press 1 through {CATEGORY_ORDER.length}.
              {mode !== "rush" ? " Enter moves on." : ""}
            </p>
            {awaitContinue ? (
              <button className={buttonClass()} type="button" onClick={advance}>
                {index + 1 >= queue.length ? "See results" : "Next item"}
              </button>
            ) : null}
          </div>
        </div>
      )}
    </GameChrome>
  );
}

function ArcadeResults({
  mode,
  summary,
  grid,
  today,
  counted,
  onAgain,
  canAgain,
}: {
  mode: ArcadeMode;
  summary: {
    score: number;
    prevBest: number;
    streak: number;
    missed: string[];
    combo: number;
  };
  grid: string[];
  today: string;
  counted: boolean;
  onAgain: () => void;
  canAgain: boolean;
}) {
  const { state } = useApp();
  const [copied, setCopied] = useState("");
  const info = ARCADE_INFO[mode];
  const newBest = mode === "rush" && summary.score > summary.prevBest;
  const shareText = `ReLeaf Daily ${today}\n${grid.join("")}\n${summary.score} points · ${summary.streak}-day streak`;

  async function share() {
    try {
      await navigator.clipboard.writeText(shareText);
      setCopied("Copied. Paste it anywhere.");
    } catch {
      setCopied("Could not copy automatically. Select the text above instead.");
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <p className="text-sm font-extrabold uppercase tracking-wide text-leaf-700">
        {info.place} · round over
      </p>
      <h1 className="font-display text-4xl text-forest-900">{info.title}</h1>
      <Card>
        <p className="font-display text-5xl text-forest-900">{summary.score}</p>
        <p className="mt-1 text-sm text-ink-soft">
          points · best combo {summary.combo}
          {mode === "rush"
            ? ` · best ever ${Math.max(summary.score, summary.prevBest)}`
            : ""}
        </p>
        {newBest ? (
          <p className="mt-2 font-extrabold text-amber-800">
            New personal best!
          </p>
        ) : null}
        {mode === "daily" ? (
          <>
            <p
              className="mt-3 text-2xl tracking-wider"
              aria-label={`${grid.filter((g) => g === "🟩").length} of ${grid.length} correct`}
            >
              {grid.join("")}
            </p>
            <p className="mt-1 text-sm font-bold text-forest-900">
              {counted
                ? `Streak: ${summary.streak} day${summary.streak === 1 ? "" : "s"}`
                : "Practice run. Your streak was not changed."}
            </p>
            <pre className="mt-3 whitespace-pre-wrap rounded-2xl bg-cream-50 p-3 text-sm">
              {shareText}
            </pre>
            <button
              className={`${buttonClass("secondary")} mt-2`}
              type="button"
              onClick={() => void share()}
            >
              Copy result
            </button>
            {copied ? (
              <p className="mt-1 text-sm text-ink-soft" role="status">
                {copied}
              </p>
            ) : null}
          </>
        ) : null}
        {mode === "review" ? (
          <p className="mt-2 text-sm text-ink-soft">
            {Object.keys(state.game.missed).length === 0
              ? "Your review pile is clear."
              : `${Object.keys(state.game.missed).length} item(s) still in your review pile.`}
          </p>
        ) : null}
        <p className="mt-2 text-xs text-ink-soft">
          Practice points. Not added to your real-world impact.
        </p>
      </Card>
      <MissedList itemIds={summary.missed} />
      <div className="flex flex-wrap gap-2">
        {canAgain ? (
          <button className={buttonClass()} type="button" onClick={onAgain}>
            {mode === "daily" ? "Practice again" : "Play again"}
          </button>
        ) : null}
        {mode !== "review" && Object.keys(state.game.missed).length > 0 ? (
          <Link className={buttonClass("secondary")} to="/adventure/review">
            Review missed items
          </Link>
        ) : null}
        <Link className={buttonClass("ghost")} to="/adventure">
          All modes
        </Link>
      </div>
    </div>
  );
}
