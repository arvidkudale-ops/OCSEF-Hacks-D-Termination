import { useEffect, useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { CalendarCheck, Flame, Lock, RotateCcw, Star } from "lucide-react";
import { ACHIEVEMENTS } from "../data/achievements";
import { getLevel, LEVEL_ORDER, LEVELS } from "../data/levels";
import { useApp } from "../context/AppContext";
import { isLevelId } from "../lib/storage";
import type { LevelDef } from "../data/levels";
import type { ArcadeMode, LevelId, LevelResult } from "../types";
import { dayKey } from "../lib/day";
import { Arcade, ARCADE_INFO } from "../game/Arcade";
import { MissedList } from "../game/GameBits";
import { LevelThumb } from "../game/art";
import { BossLevel } from "../game/BossLevel";
import { NeighborhoodLevel } from "../game/NeighborhoodLevel";
import { TaskPlayer } from "../game/TaskPlayer";
import { buttonClass, Card, Modal, PageHeader } from "../components/ui";

const ARCADE_MODES: ArcadeMode[] = ["daily", "rush", "review"];

/** True for the daily, rush, and review routes, which are not story levels. */
function isArcadeMode(value: string): value is ArcadeMode {
  return ARCADE_MODES.includes(value as ArcadeMode);
}

/** Picks the level select, an arcade mode, or one story level from the URL. */
export function GamePage() {
  const { levelId } = useParams();
  useEffect(() => {
    const level = levelId ? getLevel(levelId) : undefined;
    const arcade =
      levelId && isArcadeMode(levelId) ? ARCADE_INFO[levelId] : undefined;
    document.title = level
      ? `${level.title} · D-Trashify`
      : arcade
        ? `${arcade.title} · D-Trashify`
        : "Recycling adventure · D-Trashify";
  }, [levelId]);
  if (!levelId) return <LevelSelect />;
  if (isArcadeMode(levelId)) return <Arcade key={levelId} mode={levelId} />;
  if (!isLevelId(levelId)) return <LevelSelect />;
  return <LevelRoute id={levelId} />;
}

/** Sends locked or unknown levels back to the level list. */
function LevelRoute({ id }: { id: LevelId }) {
  const { state } = useApp();
  const level = getLevel(id);
  if (!level || !state.game.levels[id].unlocked)
    return <Navigate to="/adventure" replace />;
  return <LevelHost key={id} level={level} />;
}

/** Runs one level, then shows the victory screen until the player picks what is next. */
function LevelHost({ level }: { level: LevelDef }) {
  const { state, completeLevel } = useApp();
  const [result, setResult] = useState<LevelResult | null>(null);
  const [previous, setPrevious] = useState({ score: 0, stars: 0 });
  const [run, setRun] = useState(0);

  function finish(value: LevelResult) {
    const progress = state.game.levels[level.id];
    setPrevious({ score: progress.bestScore, stars: progress.stars });
    completeLevel(level.id, value.score, value.stars, value.bestCombo);
    setResult(value);
  }

  if (result)
    return (
      <Results
        level={level}
        result={result}
        previous={previous}
        onReplay={() => {
          setResult(null);
          setRun((value) => value + 1);
        }}
      />
    );
  if (level.kind === "explore")
    return (
      <NeighborhoodLevel
        key={run}
        onComplete={finish}
        onRestart={() => setRun((value) => value + 1)}
      />
    );
  if (level.kind === "boss")
    return (
      <BossLevel
        key={run}
        onComplete={finish}
        onRestart={() => setRun((value) => value + 1)}
      />
    );
  return (
    <TaskPlayer
      key={run}
      level={level}
      onComplete={finish}
      onRestart={() => setRun((value) => value + 1)}
    />
  );
}

/** Level list, arcade shortcuts, achievements, and the how-to-play dialog. */
function LevelSelect() {
  const { state, markTutorialSeen } = useApp();
  const [open, setOpen] = useState(!state.game.tutorialSeen);
  const completed = LEVEL_ORDER.filter(
    (id) => state.game.levels[id].completed,
  ).length;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Practice, not a real pickup"
        title="Recycling Adventure"
        description="Five short levels use the same categories as the scanner. Points and stars stay in this browser and are not added to your environmental impact."
        action={
          <button
            className={buttonClass("secondary")}
            type="button"
            onClick={() => setOpen(true)}
          >
            How to play
          </button>
        }
      />
      <Card>
        <div className="mb-2 flex justify-between text-sm font-extrabold">
          <span>Levels finished</span>
          <span>
            {completed} of {LEVEL_ORDER.length}
          </span>
        </div>
        <div
          className="h-3 rounded-full bg-cream-100"
          role="progressbar"
          aria-valuenow={completed}
          aria-valuemin={0}
          aria-valuemax={LEVEL_ORDER.length}
          aria-label="Levels finished"
        >
          <div
            className="h-3 rounded-full bg-leaf-600"
            style={{ width: `${(completed / LEVEL_ORDER.length) * 100}%` }}
          />
        </div>
        <p className="mt-2 text-sm text-ink-soft">
          Best-score total: {state.game.points}. Replaying keeps your best stars
          and score.
        </p>
      </Card>
      <ArcadeCards />
      <h2 className="font-display text-2xl text-forest-900">Story levels</h2>
      <ol className="grid gap-3">
        {LEVELS.map((level, index) => {
          const progress = state.game.levels[level.id];
          return (
            <li key={level.id}>
              {progress.unlocked ? (
                <Link
                  className="block rounded-3xl bg-white p-4 ring-1 ring-forest-900/10 hover:bg-leaf-100"
                  to={`/adventure/${level.id}`}
                >
                  <LevelCardBody
                    index={index}
                    level={level}
                    stars={progress.stars}
                    score={progress.bestScore}
                    locked={false}
                  />
                </Link>
              ) : (
                <div className="rounded-3xl bg-white/70 p-4 ring-1 ring-forest-900/10">
                  <LevelCardBody
                    index={index}
                    level={level}
                    stars={0}
                    score={0}
                    locked
                  />
                </div>
              )}
            </li>
          );
        })}
      </ol>
      <section>
        <h2 className="font-display text-2xl text-forest-900">Achievements</h2>
        <ul className="mt-3 grid gap-2 sm:grid-cols-2">
          {ACHIEVEMENTS.map((achievement) => {
            const earned = state.game.achievements.includes(achievement.id);
            return (
              <li
                key={achievement.id}
                className={`rounded-2xl px-3 py-2 text-sm ${earned ? "bg-leaf-100" : "bg-white ring-1 ring-forest-900/10"}`}
              >
                <span className="font-extrabold text-forest-900">
                  {earned ? achievement.name : "Locked"}
                </span>
                <span className="mt-1 block text-ink-soft">
                  {achievement.description}
                </span>
              </li>
            );
          })}
        </ul>
      </section>
      {open ? (
        <Modal
          title="How to play"
          onClose={() => {
            markTutorialSeen();
            setOpen(false);
          }}
        >
          <ol className="list-decimal space-y-2 pl-5">
            <li>
              Move with the arrow keys, WASD, or the on-screen pad. Click a
              place on the map to walk there.
            </li>
            <li>
              Pick up litter and carry it to the recycling, compost, reuse, or
              trash bin. Reusable items stay out of the trash. The facility
              levels use buttons instead of walking.
            </li>
            <li>
              A wrong sort does not name the right bin. You can try again as
              many times as you need.
            </li>
            <li>
              In the neighborhood you can carry 3 items at a time, so plan trips
              to the depot. The bin is not named when you pick something up.
              Deciding is the point.
            </li>
            <li>
              Sorting several in a row builds a combo bonus. A later try is
              worth fewer points. Replays shuffle the items.
            </li>
            <li>
              Anything you get wrong goes into your review pile and shows up
              more often in Sort Rush and boss rematches until you get it right.
            </li>
            <li>
              Real programs differ. The messages say when a city rule can change
              the bin. Game points are not real-world impact.
            </li>
          </ol>
          <button
            className={`${buttonClass()} mt-4`}
            type="button"
            onClick={() => {
              markTutorialSeen();
              setOpen(false);
            }}
          >
            Start sorting
          </button>
        </Modal>
      ) : null}
    </div>
  );
}

function LevelCardBody({
  index,
  level,
  stars,
  score,
  locked,
}: {
  index: number;
  level: LevelDef;
  stars: number;
  score: number;
  locked: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <LevelThumb levelId={level.id} locked={locked} />
      <div className="min-w-0 flex-1">
        <p className="text-xs font-extrabold uppercase tracking-wide text-leaf-700">
          Level {index + 1}
        </p>
        <h2 className="font-display text-2xl text-forest-900">{level.title}</h2>
        <p className="mt-1 text-sm leading-6 text-ink-soft">{level.summary}</p>
        {locked ? (
          <p className="mt-2 text-sm font-bold text-ink-soft">
            Locked. Finish the previous level.
          </p>
        ) : null}
        {!locked && score > 0 ? (
          <p className="mt-2 text-sm font-bold text-forest-900">
            Best score {score}
          </p>
        ) : null}
      </div>
      <div className="shrink-0 text-right">
        {locked ? <Lock aria-label="Locked" /> : <Stars count={stars} />}
      </div>
    </div>
  );
}

function Stars({ count }: { count: number }) {
  return (
    <span className="inline-flex" aria-label={`${count} of 3 stars`}>
      {[1, 2, 3].map((star) => (
        <Star
          key={star}
          aria-hidden
          size={18}
          className={
            star <= count ? "fill-amber-400 text-amber-500" : "text-stone-300"
          }
        />
      ))}
    </span>
  );
}

/** Falling paper for a finished level. */
function Confetti() {
  const colors = [
    "#95d5b2",
    "#d8f3dc",
    "#f6e7b4",
    "#f4c7c3",
    "#b7e4c7",
    "#ffe8a3",
  ];
  return (
    <div className="confetti" aria-hidden>
      {colors
        .concat(colors, colors, colors, colors, colors)
        .map((color, index) => (
          <span
            key={index}
            style={{
              left: `${(index * 17) % 100}%`,
              animationDelay: `${(index % 12) * 0.12}s`,
              background: color,
            }}
          />
        ))}
    </div>
  );
}

/** Victory screen: stars, score, what the level taught, and the way to the next level. */
function Results({
  level,
  result,
  previous,
  onReplay,
}: {
  level: LevelDef;
  result: LevelResult;
  previous: { score: number; stars: number };
  onReplay: () => void;
}) {
  const navigate = useNavigate();
  const index = LEVEL_ORDER.indexOf(level.id);
  const next = LEVEL_ORDER[index + 1];
  const nextLevel = next ? getLevel(next) : undefined;
  const goNext = () =>
    navigate(`/adventure/${next}`, { state: { pull: true } });
  return (
    <div className="you-won relative mx-auto max-w-2xl space-y-4 overflow-hidden rounded-3xl px-4 py-8 sm:px-8">
      <Confetti />
      <p className="relative text-center text-xs font-extrabold uppercase tracking-widest">
        Level {index + 1} complete
      </p>
      <h1 className="relative text-center font-display text-6xl">Victory!</h1>
      <p className="relative text-center text-sm font-extrabold">
        {level.title}
      </p>
      <div className="victory-stars relative flex justify-center gap-2">
        {[1, 2, 3].map((star) => (
          <Star
            key={star}
            aria-hidden
            size={52}
            style={{ animationDelay: `${star * 0.18}s` }}
            className={
              star <= result.stars
                ? "fill-amber-300 text-amber-400"
                : "text-white/35"
            }
          />
        ))}
        <span className="sr-only">{result.stars} of 3 stars</span>
      </div>
      {next ? (
        <div className="relative flex justify-center">
          <button
            className="victory-next"
            type="button"
            onClick={goNext}
            autoFocus
          >
            Next level{nextLevel ? `: ${nextLevel.title}` : ""} →
          </button>
        </div>
      ) : (
        <p className="relative text-center text-sm font-extrabold">
          That was the last level. The whole adventure is clear.
        </p>
      )}
      <div className="relative grid gap-3 sm:grid-cols-3">
        <Card>
          <p className="text-sm font-extrabold text-ink-soft">Score</p>
          <p className="font-display text-4xl text-forest-900">
            {result.score}
          </p>
          {previous.score > 0 && result.score > previous.score ? (
            <p className="text-sm font-extrabold text-amber-800">
              New best (was {previous.score})
            </p>
          ) : previous.score > 0 ? (
            <p className="text-sm text-ink-soft">Best {previous.score}</p>
          ) : null}
        </Card>
        <Card>
          <p className="text-sm font-extrabold text-ink-soft">Mistakes</p>
          <p className="font-display text-4xl text-forest-900">
            {result.mistakes}
          </p>
          <p className="text-sm text-ink-soft">
            {result.mistakes === 0 ? "Clean run: +50" : "0 for 3 stars"}
          </p>
        </Card>
        <Card>
          <p className="text-sm font-extrabold text-ink-soft">Best combo</p>
          <p className="font-display text-4xl text-forest-900">
            {result.bestCombo}
          </p>
          <p className="text-sm text-ink-soft">in a row</p>
        </Card>
      </div>
      <p className="relative text-center text-sm">
        This score is practice and is not added to your real-world impact.
      </p>
      <div className="relative space-y-4">
        <MissedList itemIds={result.missedItemIds} />
      </div>
      <Card className="relative">
        <h2 className="font-extrabold text-forest-900">
          What this level was teaching
        </h2>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-6 text-ink-soft">
          {level.lessons.map((lesson) => (
            <li key={lesson}>{lesson}</li>
          ))}
        </ul>
      </Card>
      <div className="relative flex flex-wrap justify-center gap-2">
        {next ? (
          <button className={buttonClass()} type="button" onClick={goNext}>
            Next level
          </button>
        ) : (
          <Link className={buttonClass()} to="/">
            Back to the dashboard
          </Link>
        )}
        <button
          className={buttonClass("secondary")}
          type="button"
          onClick={onReplay}
        >
          {result.stars < 3 ? "Replay for 3 stars" : "Replay with new items"}
        </button>
        {result.missedItemIds.length > 0 ? (
          <Link className={buttonClass("secondary")} to="/adventure/review">
            Review missed items
          </Link>
        ) : null}
        <Link className={buttonClass("secondary")} to="/adventure">
          All levels
        </Link>
      </div>
    </div>
  );
}

function ArcadeCards() {
  const { state } = useApp();
  const playedToday = state.game.daily.lastDay === dayKey();
  const reviewCount = Object.keys(state.game.missed).length;
  const cards = [
    {
      mode: "daily" as const,
      icon: <CalendarCheck aria-hidden />,
      stat: playedToday
        ? `Done today: ${state.game.daily.lastGrid}`
        : state.game.daily.streak > 0
          ? `Keep your ${state.game.daily.streak}-day streak`
          : "New items every day",
      highlight: !playedToday,
    },
    {
      mode: "rush" as const,
      icon: <Flame aria-hidden />,
      stat:
        state.game.rushBest > 0
          ? `Best ${state.game.rushBest}`
          : "No clock. Try until you get it",
      highlight: false,
    },
    {
      mode: "review" as const,
      icon: <RotateCcw aria-hidden />,
      stat:
        reviewCount > 0
          ? `${reviewCount} item${reviewCount === 1 ? "" : "s"} to review`
          : "Nothing to review yet",
      highlight: reviewCount > 0,
    },
  ];
  return (
    <section aria-labelledby="arcade-heading" className="space-y-3">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <h2
          id="arcade-heading"
          className="font-display text-2xl text-forest-900"
        >
          Quick play
        </h2>
        {state.game.bestCombo > 0 ? (
          <p className="inline-flex items-center gap-1 text-sm font-bold text-ink-soft">
            <Flame aria-hidden size={16} /> Best combo ever:{" "}
            {state.game.bestCombo}
          </p>
        ) : null}
      </div>
      <ul className="grid gap-3 sm:grid-cols-3">
        {cards.map((card) => (
          <li key={card.mode}>
            <Link
              to={`/adventure/${card.mode}`}
              className={`flex h-full flex-col gap-1 rounded-3xl p-4 ring-1 ring-forest-900/10 hover:bg-leaf-100 ${card.highlight ? "bg-leaf-100" : "bg-white"}`}
            >
              <span className="text-leaf-700">{card.icon}</span>
              <span className="font-display text-xl text-forest-900">
                {ARCADE_INFO[card.mode].title}
              </span>
              <span className="text-sm font-bold text-ink-soft">
                {card.stat}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
