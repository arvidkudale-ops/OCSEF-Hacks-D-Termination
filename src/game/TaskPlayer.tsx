import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getItem } from "../data/items";
import type { GameTask, LevelDef } from "../data/levels";
import { useApp } from "../context/AppContext";
import { shuffle } from "../lib/random";
import { playCorrect, playWrong } from "../lib/sound";
import { hit, miss, newTally, resultFrom, RETRY_POINTS } from "../lib/scoring";
import type { LevelResult } from "../types";
import { buttonClass } from "../components/ui";
import { GameChrome } from "./GameChrome";
import { ComboBadge, ItemCard } from "./GameBits";
import type { Fx } from "./GameBits";
import { BinButton, BinGrid, SceneBanner } from "./art";
import { Stage3D } from "./three/Stage3D";
import type { StageBin, StageEvent } from "./three/stage";

/** Shuffle what can be shuffled so a replay is not a memory test. */
function prepare(task: GameTask): GameTask {
  if (task.kind === "sort") return { ...task, rounds: shuffle(task.rounds) };
  if (task.kind === "yesno") return { ...task, rounds: shuffle(task.rounds) };
  if (task.kind === "build") return { ...task, choices: shuffle(task.choices) };
  return task;
}

/** Display order for order/match tasks. Never the answer order. */
function displayOrder(task: GameTask | undefined): string[] {
  if (!task) return [];
  const ids =
    task.kind === "order"
      ? task.steps.map((entry) => entry.id)
      : task.kind === "match"
        ? task.pairs.map((pair) => pair.id)
        : [];
  if (ids.length < 2) return ids;
  let next = shuffle(ids);
  for (
    let tries = 0;
    tries < 5 && next.every((id, i) => id === ids[i]);
    tries += 1
  )
    next = shuffle(ids);
  return next;
}

export function TaskPlayer({
  level,
  onComplete,
  onRestart,
}: {
  level: LevelDef;
  onComplete: (result: LevelResult) => void;
  onRestart: () => void;
}) {
  const navigate = useNavigate();
  const { state, setSound, recordAnswer } = useApp();
  const [tasks] = useState(() => level.tasks.map(prepare));
  const [started, setStarted] = useState(false);
  const [paused, setPaused] = useState(false);
  const [taskIndex, setTaskIndex] = useState(0);
  const [step, setStep] = useState(0);
  const [feedback, setFeedback] = useState<{
    ok: boolean;
    text: string;
  } | null>(null);
  const [awaitContinue, setAwaitContinue] = useState(false);
  const [fx, setFx] = useState<Fx | null>(null);
  const [stageEvent, setStageEvent] = useState<StageEvent | null>(null);
  const [points, setPoints] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [combo, setCombo] = useState(0);
  const [retrying, setRetrying] = useState(false);
  const [leftId, setLeftId] = useState<string | null>(null);
  const [solved, setSolved] = useState<string[]>([]);
  const [placed, setPlaced] = useState<string[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [order, setOrder] = useState<string[]>(() => displayOrder(tasks[0]));
  const tally = useRef(newTally());
  const doneRef = useRef(false);
  const keyRef = useRef<(event: KeyboardEvent) => void>(() => {});
  const task = tasks[taskIndex];

  function sync() {
    setPoints(tally.current.points);
    setMistakes(tally.current.mistakes);
    setCombo(tally.current.combo);
  }

  /** Tells the 3D stage what just happened so it can play it. */
  function show(ok: boolean, binId?: string, emoji?: string) {
    setStageEvent((prev) => ({ n: (prev?.n ?? 0) + 1, ok, binId, emoji }));
  }

  function good(text: string, itemId?: string, binId?: string, emoji?: string) {
    show(true, binId, emoji);
    const earned = hit(tally.current, 0, retrying ? RETRY_POINTS : 100);
    if (itemId) recordAnswer(itemId, true);
    setRetrying(false);
    setFx((prev) => ({ ok: true, n: (prev?.n ?? 0) + 1, earned }));
    setFeedback({ ok: true, text });
    playCorrect(state.sound);
    sync();
  }

  function bad(text: string, itemId?: string, binId?: string, emoji?: string) {
    show(false, binId, emoji);
    miss(tally.current, itemId);
    if (itemId) recordAnswer(itemId, false);
    setRetrying(true);
    setFx((prev) => ({ ok: false, n: (prev?.n ?? 0) + 1 }));
    setFeedback({ ok: false, text });
    playWrong(state.sound);
    sync();
  }

  function finish() {
    if (doneRef.current) return;
    doneRef.current = true;
    onComplete(resultFrom(tally.current));
  }

  function continueForward() {
    if (!task) return;
    setFx(null);
    setRetrying(false);
    if (
      (task.kind === "sort" || task.kind === "yesno") &&
      step + 1 < task.rounds.length
    ) {
      setStep((value) => value + 1);
      setAwaitContinue(false);
      setFeedback(null);
      return;
    }
    if (taskIndex + 1 < tasks.length) {
      const nextIndex = taskIndex + 1;
      setTaskIndex(nextIndex);
      setStep(0);
      setFeedback(null);
      setAwaitContinue(false);
      setLeftId(null);
      setSolved([]);
      setPlaced([]);
      setCounts({});
      setOrder(displayOrder(tasks[nextIndex]));
      return;
    }
    finish();
  }

  function chooseBin(binId: string) {
    if (!task || task.kind !== "sort" || awaitContinue) return;
    const round = task.rounds[step];
    const item = getItem(round.itemId);
    const right = task.bins.find((bin) => bin.id === round.binId);
    if (binId === round.binId) {
      good(
        `Correct. ${item?.name ?? "This item"} belongs in ${right?.label}. ${item?.why ?? ""}`,
        round.itemId,
        binId,
      );
      setAwaitContinue(true);
      return;
    }
    bad("Not that station. Try another one.", round.itemId, binId);
  }

  function answerYesNo(belongs: boolean) {
    if (!task || task.kind !== "yesno" || awaitContinue) return;
    const round = task.rounds[step];
    if (belongs === round.belongs) {
      good(`Correct. ${round.explain}`, round.itemId, belongs ? "yes" : "no");
      setAwaitContinue(true);
      return;
    }
    bad(
      "Not quite. Look again and choose once more.",
      round.itemId,
      belongs ? "yes" : "no",
    );
  }

  function addToPile(
    choice: Extract<GameTask, { kind: "build" }>["choices"][number],
  ) {
    if (!task || task.kind !== "build" || awaitContinue) return;
    const emoji = getItem(choice.itemId)?.emoji;
    if (!choice.pile) {
      bad(
        "That does not go in the pile. Try something else.",
        choice.itemId,
        undefined,
        emoji,
      );
      return;
    }
    const need = task.need.find((entry) => entry.id === choice.pile);
    const have = counts[choice.pile] ?? 0;
    if (!need || have >= need.count) {
      setFeedback({
        ok: true,
        text: `The pile already has enough ${need?.label.toLowerCase() ?? "of those"}. Add the other kind if it is still short.`,
      });
      return;
    }
    const next = { ...counts, [choice.pile]: have + 1 };
    setCounts(next);
    good(choice.explain, choice.itemId, choice.pile, emoji);
    if (task.need.every((entry) => (next[entry.id] ?? 0) >= entry.count))
      setAwaitContinue(true);
  }

  function placeStep(id: string) {
    if (!task || task.kind !== "order" || awaitContinue) return;
    const expected = task.steps[placed.length];
    if (id === expected.id) {
      const next = [...placed, id];
      setPlaced(next);
      good(expected.detail);
      if (next.length === task.steps.length) setAwaitContinue(true);
      return;
    }
    bad("That is not the next step. Try a different one.");
  }

  function matchRight(id: string) {
    if (!task || task.kind !== "match" || !leftId || solved.includes(leftId))
      return;
    const pair = task.pairs.find((entry) => entry.id === leftId);
    if (!pair) return;
    setLeftId(null);
    if (pair.id === id) {
      const next = [...solved, pair.id];
      setSolved(next);
      good(pair.explain);
      if (next.length === task.pairs.length) setAwaitContinue(true);
      return;
    }
    bad("Those do not go together. Try a different match.");
  }

  keyRef.current = (event: KeyboardEvent) => {
    if (event.key === "Escape") {
      setPaused((value) => !value);
      return;
    }
    if (!started || !task || paused) return;
    const target = event.target as HTMLElement | null;
    if (
      awaitContinue &&
      event.key === "Enter" &&
      target?.tagName !== "BUTTON"
    ) {
      event.preventDefault();
      continueForward();
      return;
    }
    if (awaitContinue) return;
    const number = Number(event.key);
    if (!Number.isInteger(number) || number < 1) return;
    if (task.kind === "sort" && task.bins[number - 1]) {
      event.preventDefault();
      chooseBin(task.bins[number - 1].id);
    } else if (task.kind === "yesno" && number <= 2) {
      event.preventDefault();
      answerYesNo(number === 1);
    }
  };

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => keyRef.current(event);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // What the 3D stage shows for the current station.
  let stageBins: StageBin[] = [];
  let stageEmoji: string | null = null;
  let stageSteps: { total: number; done: number } | null = null;
  if (task?.kind === "sort") stageBins = task.bins;
  else if (task?.kind === "yesno")
    stageBins = [
      { id: "yes", label: task.yesLabel },
      { id: "no", label: task.noLabel },
    ];
  else if (task?.kind === "build")
    stageBins = task.need.map((need) => ({ id: need.id, label: need.label }));
  else if (task?.kind === "order")
    stageSteps = { total: task.steps.length, done: placed.length };
  else if (task?.kind === "match")
    stageSteps = { total: task.pairs.length, done: solved.length };
  if (task?.kind === "sort" || task?.kind === "yesno")
    stageEmoji = getItem(task.rounds[step].itemId)?.emoji ?? "♻️";

  function chooseOnStage(binId: string) {
    if (paused) return;
    if (task?.kind === "sort") chooseBin(binId);
    else if (task?.kind === "yesno") answerYesNo(binId === "yes");
  }

  const detail = started
    ? `Station ${taskIndex + 1} of ${tasks.length} · ${points} points · ${mistakes} mistakes`
    : "Tutorial for this place";
  const lastStep =
    taskIndex + 1 === tasks.length &&
    (task?.kind === "build" ||
      task?.kind === "match" ||
      task?.kind === "order" ||
      (task && "rounds" in task && step + 1 >= task.rounds.length));

  return (
    <GameChrome
      title={level.title}
      place={level.place}
      detail={detail}
      sound={state.sound}
      paused={paused}
      message={feedback?.text}
      tone={feedback ? (feedback.ok ? "ok" : "bad") : "info"}
      onToggleSound={() => setSound(!state.sound)}
      onPause={() => setPaused(true)}
      onResume={() => setPaused(false)}
      onRestart={onRestart}
      onExit={() => navigate("/adventure")}
    >
      {!started || !task ? (
        <div className="overflow-hidden rounded-3xl bg-white ring-1 ring-forest-900/10">
          <Stage3D
            theme={level.id}
            className="h-48 sm:h-64"
            fallback={
              <SceneBanner levelId={level.id} className="h-36 sm:h-44" />
            }
          />
          <div className="p-6">
            <p className="text-sm leading-6 text-ink-soft">{level.summary}</p>
            <p className="mt-2 text-sm font-bold text-forest-900">
              {level.teaches}
            </p>
            <p className="mt-2 text-sm text-ink-soft">
              Sorting several in a row builds a combo bonus. You can try again
              as many times as you need, and a later try is worth {RETRY_POINTS}{" "}
              points.
            </p>
            <button
              className={`${buttonClass()} mt-4`}
              type="button"
              onClick={() => setStarted(true)}
            >
              Start
            </button>
          </div>
        </div>
      ) : (
        <div
          className={`overflow-hidden rounded-3xl ring-1 ring-forest-900/10 ${backdrop(level.id)}`}
        >
          <Stage3D
            theme={level.id}
            className="h-64 sm:h-80"
            bins={stageBins}
            emoji={stageEmoji}
            itemKey={`${taskIndex}-${step}`}
            event={stageEvent}
            steps={stageSteps}
            onChoose={chooseOnStage}
            fallback={
              <SceneBanner levelId={level.id} className="h-20 sm:h-24" />
            }
          />
          <div className="p-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <h2 className="font-display text-2xl text-forest-900">
                  {task.title}
                </h2>
                <p className="mt-1 text-sm leading-6 text-ink-soft">
                  {task.prompt}
                </p>
              </div>
              <ComboBadge combo={combo} />
            </div>
            <StationDots total={tasks.length} current={taskIndex} />
            <div className="mt-4">{renderTask()}</div>
            {awaitContinue ? (
              <button
                className={`${buttonClass()} mt-4`}
                type="button"
                onClick={continueForward}
                autoFocus
              >
                {lastStep ? "Finish level" : "Continue"}
              </button>
            ) : null}
          </div>
        </div>
      )}
    </GameChrome>
  );

  function renderTask() {
    if (!task) return null;
    if (task.kind === "sort" || task.kind === "yesno") {
      const round = task.rounds[step];
      const item = getItem(round.itemId);
      return (
        <div className="space-y-4">
          <p className="text-sm font-bold text-ink-soft">
            Item {step + 1} of {task.rounds.length}
          </p>
          <ItemCard
            item={item}
            fx={fx}
            belt={level.id === "sorting"}
            enterKey={`${taskIndex}-${step}`}
          />
          {task.kind === "sort" ? (
            <BinGrid count={task.bins.length}>
              {task.bins.map((bin, index) => (
                <BinButton
                  key={bin.id}
                  binId={bin.id}
                  label={bin.label}
                  hotkey={index + 1}
                  disabled={awaitContinue}
                  onClick={() => chooseBin(bin.id)}
                />
              ))}
            </BinGrid>
          ) : (
            <div className="flex flex-wrap gap-2">
              <button
                className={buttonClass()}
                type="button"
                disabled={awaitContinue}
                onClick={() => answerYesNo(true)}
              >
                1. {task.yesLabel}
              </button>
              <button
                className={buttonClass("secondary")}
                type="button"
                disabled={awaitContinue}
                onClick={() => answerYesNo(false)}
              >
                2. {task.noLabel}
              </button>
            </div>
          )}
          <p className="text-xs text-ink-soft">
            Keyboard: press 1 through{" "}
            {task.kind === "sort" ? task.bins.length : 2}. Enter continues.
          </p>
        </div>
      );
    }
    if (task.kind === "build") {
      return (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {task.need.map((need) => {
              const have = counts[need.id] ?? 0;
              return (
                <span
                  key={need.id}
                  className={`rounded-full px-3 py-1 text-sm font-extrabold ${have >= need.count ? "bg-leaf-700 text-white" : "bg-white text-forest-900"}`}
                >
                  {need.label} {have}/{need.count}
                </span>
              );
            })}
          </div>
          <div key={fx?.n ?? 0} className={fx && !fx.ok ? "fx-shake" : ""}>
            <div className="grid gap-2 sm:grid-cols-2">
              {task.choices.map((choice) => {
                const item = getItem(choice.itemId);
                return (
                  <button
                    key={choice.itemId}
                    className={buttonClass("secondary")}
                    type="button"
                    disabled={awaitContinue}
                    onClick={() => addToPile(choice)}
                  >
                    {item?.emoji} Add {item?.name}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      );
    }
    if (task.kind === "order") {
      return (
        <div className="space-y-4">
          <ol className="space-y-2">
            {placed.map((id, index) => {
              const entry = task.steps.find((stepEntry) => stepEntry.id === id);
              return (
                <li
                  key={id}
                  className="fx-pop rounded-2xl bg-white px-3 py-2 text-sm font-bold"
                >
                  {index + 1}. {entry?.label}
                </li>
              );
            })}
            {Array.from(
              { length: task.steps.length - placed.length },
              (_, index) => (
                <li
                  key={`slot-${index}`}
                  className="rounded-2xl border border-dashed border-forest-900/20 px-3 py-2 text-sm text-ink-soft"
                >
                  {placed.length + index + 1}. ?
                </li>
              ),
            )}
          </ol>
          <div
            key={fx?.n ?? 0}
            className={`grid gap-2 ${fx && !fx.ok ? "fx-shake" : ""}`}
          >
            {order
              .filter((id) => !placed.includes(id))
              .map((id) => {
                const entry = task.steps.find(
                  (stepEntry) => stepEntry.id === id,
                );
                return (
                  <button
                    key={id}
                    className={buttonClass("secondary")}
                    type="button"
                    disabled={awaitContinue}
                    onClick={() => placeStep(id)}
                  >
                    {entry?.label}
                  </button>
                );
              })}
          </div>
        </div>
      );
    }
    return (
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <p className="text-sm font-extrabold">1. Pick a material</p>
          {task.pairs.map((pair) => (
            <button
              key={pair.id}
              type="button"
              disabled={solved.includes(pair.id)}
              aria-pressed={leftId === pair.id}
              className={`w-full ${leftId === pair.id ? buttonClass() : buttonClass("secondary")}`}
              onClick={() => setLeftId(pair.id)}
            >
              {solved.includes(pair.id) ? "✓ " : ""}
              {pair.left}
            </button>
          ))}
        </div>
        <div className="space-y-2">
          <p className="text-sm font-extrabold">2. Pick its process</p>
          {order.map((id) => {
            const pair = task.pairs.find((entry) => entry.id === id);
            return (
              <button
                key={id}
                className={`w-full ${buttonClass("secondary")}`}
                type="button"
                disabled={!leftId || solved.includes(id)}
                onClick={() => matchRight(id)}
              >
                {solved.includes(id) ? "✓ " : ""}
                {pair?.right}
              </button>
            );
          })}
        </div>
      </div>
    );
  }
}

function StationDots({ total, current }: { total: number; current: number }) {
  return (
    <div className="mt-3 flex gap-1.5" aria-hidden>
      {Array.from({ length: total }, (_, index) => (
        <span
          key={index}
          className={`h-2 flex-1 rounded-full ${index < current ? "bg-leaf-600" : index === current ? "bg-leaf-300" : "bg-white"}`}
        />
      ))}
    </div>
  );
}

function backdrop(id: LevelDef["id"]) {
  if (id === "compost") return "bg-[#e7f0d8]";
  if (id === "recycling") return "bg-[#e7eef8]";
  return "bg-[#f3f0e6]";
}
