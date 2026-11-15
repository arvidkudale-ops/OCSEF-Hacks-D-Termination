import { Link } from "react-router-dom";
import { ACHIEVEMENTS } from "../data/achievements";
import { getLevel, LEVEL_ORDER } from "../data/levels";
import { getItem } from "../data/items";
import { useApp } from "../context/AppContext";
import { formatKg, summarize } from "../lib/impact";
import { dayKey } from "../lib/day";
import { buttonClass, Card } from "../components/ui";

/** Dashboard: greeting, progress counts, and shortcuts into the scanner and the game. */
export function HomePage() {
  const { state } = useApp();
  const summary = summarize(state.disposals);
  const current = LEVEL_ORDER.find(
    (id) => state.game.levels[id].unlocked && !state.game.levels[id].completed,
  );
  const levelLabel = current
    ? `Level ${LEVEL_ORDER.indexOf(current) + 1}: ${getLevel(current)?.title}`
    : "All levels complete";
  const earned = ACHIEVEMENTS.filter((achievement) =>
    state.game.achievements.includes(achievement.id),
  );
  const greeting = state.displayName.trim()
    ? `Hi, ${state.displayName.trim()}`
    : "Welcome";

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] bg-forest-900 px-6 py-8 text-cream-50 md:px-10 md:py-12">
        <p className="text-sm font-extrabold uppercase tracking-wide text-leaf-300">
          {greeting}
        </p>
        <h1 className="mt-2 max-w-xl font-display text-4xl leading-tight md:text-5xl">
          Know where it goes.
        </h1>
        <p className="mt-3 max-w-2xl text-base leading-7 text-cream-50/90">
          D-Trashify is two tools in one place: a scanner and database for real
          household waste, and a short adventure that shows what happens after
          the truck leaves.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link className={buttonClass()} to="/scanner">
            Scan an item
          </Link>
          <Link
            className="flat-pop inline-flex min-h-11 items-center justify-center rounded-xl bg-leaf-300 px-4 py-2 text-sm font-extrabold text-forest-950"
            to="/adventure"
          >
            Play the adventure
          </Link>
        </div>
      </section>

      <section
        aria-label="Your progress"
        className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"
      >
        <Card>
          <p className="text-sm font-extrabold text-ink-soft">Items scanned</p>
          <p className="mt-1 font-display text-4xl text-forest-900">
            {state.scans.length}
          </p>
          <p className="mt-1 text-xs text-ink-soft">
            Identifications only. Photos are not saved.
          </p>
        </Card>
        <Card>
          <p className="text-sm font-extrabold text-ink-soft">
            Items you logged
          </p>
          <p className="mt-1 font-display text-4xl text-forest-900">
            {state.disposals.length}
          </p>
          <p className="mt-1 text-xs text-ink-soft">
            Real-world sorts you chose to record.
          </p>
        </Card>
        <Card>
          <p className="text-sm font-extrabold text-ink-soft">Game level</p>
          <p className="mt-1 font-display text-2xl leading-tight text-forest-900">
            {levelLabel}
          </p>
          <p className="mt-1 text-xs text-ink-soft">
            {state.game.points} best-score points. Not real recycling.
          </p>
        </Card>
        <Card>
          <p className="text-sm font-extrabold text-ink-soft">
            Estimated waste diverted
          </p>
          <p className="mt-1 font-display text-4xl text-forest-900">
            {formatKg(summary.divertedKg)}
          </p>
          <p className="mt-1 text-xs text-ink-soft">
            From logged sorts only, using typical item weights.
          </p>
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card className="flex flex-col">
          <p className="text-sm font-extrabold uppercase tracking-wide text-leaf-700">
            Real life
          </p>
          <h2 className="mt-1 font-display text-3xl text-forest-900">
            Waste scanner and sorting
          </h2>
          <p className="mt-2 flex-1 text-sm leading-6 text-ink-soft">
            Check a bottle, a greasy box, a battery, or a bag against the
            database. Local notes for a few Los Angeles ZIP codes are included
            and clearly marked unverified.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link className={buttonClass()} to="/scanner">
              Open scanner
            </Link>
            <Link className={buttonClass("secondary")} to="/database">
              Browse items
            </Link>
          </div>
        </Card>
        <Card className="flex flex-col">
          <p className="text-sm font-extrabold uppercase tracking-wide text-leaf-700">
            Practice
          </p>
          <h2 className="mt-1 font-display text-3xl text-forest-900">
            Recycling adventure
          </h2>
          <p className="mt-2 flex-1 text-sm leading-6 text-ink-soft">
            Clean up a neighborhood, then walk through a sorting line, a compost
            yard, a recycling process, and a trash monster made of mixed-up
            waste. You win by sorting.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link className={buttonClass()} to="/adventure">
              Choose a level
            </Link>
            <Link className={buttonClass("secondary")} to="/adventure/daily">
              {state.game.daily.lastDay === dayKey()
                ? `Daily done ${state.game.daily.lastGrid}`
                : state.game.daily.streak > 0
                  ? `Daily challenge · ${state.game.daily.streak}-day streak`
                  : "Daily challenge"}
            </Link>
          </div>
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card>
          <h2 className="font-display text-2xl text-forest-900">
            Recent scans
          </h2>
          {state.scans.length === 0 ? (
            <p className="mt-2 text-sm text-ink-soft">No scans yet.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {state.scans.slice(0, 4).map((scan) => {
                const item = getItem(scan.itemId);
                return (
                  <li key={scan.id}>
                    <Link
                      className="flex items-center justify-between gap-3 rounded-2xl bg-cream-50 px-3 py-2 text-sm font-bold"
                      to={`/database/${scan.itemId}`}
                    >
                      <span>
                        {item?.emoji} {item?.name ?? "Removed item"}
                      </span>
                      <span className="text-ink-soft">
                        {scan.uncertain ? "Uncertain" : "Selected"}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
        <Card>
          <h2 className="font-display text-2xl text-forest-900">
            Achievements
          </h2>
          <p className="mt-1 text-sm text-ink-soft">
            {earned.length} of {ACHIEVEMENTS.length} earned. Game badges and
            scan badges stay in this browser.
          </p>
          {earned.length === 0 ? (
            <p className="mt-3 text-sm text-ink-soft">
              Scan an item or finish a level to earn the first one.
            </p>
          ) : (
            <ul className="mt-3 flex flex-wrap gap-2">
              {earned.slice(0, 6).map((achievement) => (
                <li
                  key={achievement.id}
                  className="rounded-full bg-leaf-100 px-3 py-1 text-xs font-extrabold text-forest-900"
                >
                  {achievement.name}
                </li>
              ))}
            </ul>
          )}
        </Card>
      </section>
    </div>
  );
}
