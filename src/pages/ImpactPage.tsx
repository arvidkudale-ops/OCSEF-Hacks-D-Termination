import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { CATEGORY_META, CATEGORY_ORDER } from "../data/categories";
import { useApp } from "../context/AppContext";
import {
  buildSeries,
  filterByRange,
  formatCo2,
  formatKg,
  listEmissionFactors,
  summarize,
  type TimeRange,
} from "../lib/impact";
import {
  buttonClass,
  Card,
  DemoNote,
  EmptyState,
  PageHeader,
} from "../components/ui";

/** Charts and totals for scans and logged sorts in the selected time range. */
export function ImpactPage() {
  const { state } = useApp();
  const [range, setRange] = useState<TimeRange>("week");
  const disposals = filterByRange(state.disposals, range);
  const scans = filterByRange(state.scans, range);
  const summary = summarize(disposals);
  const series = buildSeries(state.scans, state.disposals, range);
  const hasChart = series.some(
    (bucket) => bucket.logged > 0 || bucket.scans > 0,
  );
  const pie = CATEGORY_ORDER.map((category) => ({
    name: CATEGORY_META[category].label,
    value: summary.byCategory[category],
    color: CATEGORY_META[category].swatch,
  })).filter((entry) => entry.value > 0);
  const factors = listEmissionFactors();
  const rangeCopy =
    range === "week"
      ? "the last 7 days"
      : range === "month"
        ? "the last 4 weeks"
        : "all saved activity";

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Estimates"
        title="Environmental impact"
        description="These numbers come from items you logged as sorted. Scans and game points are shown separately and are not treated as recycling."
        action={
          <div
            className="flex flex-wrap gap-2"
            role="group"
            aria-label="Time range"
          >
            {(["week", "month", "all"] as TimeRange[]).map((entry) => (
              <button
                key={entry}
                className={
                  range === entry ? buttonClass() : buttonClass("secondary")
                }
                type="button"
                onClick={() => setRange(entry)}
              >
                {entry === "week"
                  ? "Week"
                  : entry === "month"
                    ? "Month"
                    : "All"}
              </button>
            ))}
          </div>
        }
      />
      <DemoNote>
        Weights are typical household averages. Emissions use rounded
        educational factors and are not a measurement of your impact. This view
        covers {rangeCopy}.
      </DemoNote>

      {state.disposals.length === 0 && state.scans.length === 0 ? (
        <EmptyState title="No activity yet">
          <p>
            Identify an item and log that you sorted it, or browse the database
            and log from an item page.
          </p>
          <Link className={`${buttonClass()} mt-4`} to="/scanner">
            Go to the scanner
          </Link>
        </EmptyState>
      ) : (
        <>
          <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <Card>
              <p className="text-sm font-extrabold text-ink-soft">
                Scans in view
              </p>
              <p className="font-display text-4xl text-forest-900">
                {scans.length}
              </p>
            </Card>
            <Card>
              <p className="text-sm font-extrabold text-ink-soft">
                Logged sorts
              </p>
              <p className="font-display text-4xl text-forest-900">
                {disposals.length}
              </p>
            </Card>
            <Card>
              <p className="text-sm font-extrabold text-ink-soft">
                Diverted from landfill
              </p>
              <p className="font-display text-4xl text-forest-900">
                {formatKg(summary.divertedKg)}
              </p>
              <p className="text-xs text-ink-soft">
                Recycling, compost, reusable items, and special drop-off. Trash
                is excluded.
              </p>
            </Card>
            <Card>
              <p className="text-sm font-extrabold text-ink-soft">
                Materials recovered
              </p>
              <p className="font-display text-4xl text-forest-900">
                {formatKg(summary.recoveredKg)}
              </p>
              <p className="text-xs text-ink-soft">Recycling logs only.</p>
            </Card>
          </section>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <h2 className="font-display text-2xl text-forest-900">
                Activity
              </h2>
              {hasChart ? (
                <div className="mt-4 h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={series}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                      <YAxis allowDecimals={false} width={32} />
                      <Tooltip />
                      <Bar
                        dataKey="scans"
                        name="Scans"
                        fill="#95d5b2"
                        radius={[6, 6, 0, 0]}
                      />
                      <Bar
                        dataKey="logged"
                        name="Logged sorts"
                        fill="#1b4332"
                        radius={[6, 6, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p className="mt-3 text-sm text-ink-soft">
                  No scans or logs in this chart window.
                </p>
              )}
            </Card>
            <Card>
              <h2 className="font-display text-2xl text-forest-900">
                Logged by category
              </h2>
              {pie.length === 0 ? (
                <p className="mt-3 text-sm text-ink-soft">
                  Log a sort to see the mix. Trash is included here so the mix
                  stays honest, and it is left out of diverted weight.
                </p>
              ) : (
                <div className="mt-4 h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pie}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={52}
                        outerRadius={80}
                      >
                        {pie.map((entry) => (
                          <Cell key={entry.name} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </Card>
          </div>

          <Card>
            <h2 className="font-display text-2xl text-forest-900">
              Illustrative emissions
            </h2>
            <p className="mt-2 text-sm leading-6 text-ink-soft">
              {formatCo2(summary.emissionsKg)} for about{" "}
              {formatKg(summary.emissionsWeightKg)} of logged recyclables that
              have a factor. Compost and special drop-off are not included. This
              is a simplified comparison, not a claim that you saved this
              amount.
            </p>
            <div className="mt-4 space-y-3">
              {summary.recoveredByMaterial.length === 0 ? (
                <p className="text-sm text-ink-soft">
                  No recovered materials in this view yet.
                </p>
              ) : (
                summary.recoveredByMaterial.map(([material, kg]) => {
                  const width = Math.max(
                    8,
                    Math.round((kg / summary.recoveredKg) * 100),
                  );
                  return (
                    <div key={material}>
                      <div className="mb-1 flex justify-between text-sm font-bold">
                        <span>{material}</span>
                        <span>{formatKg(kg)}</span>
                      </div>
                      <div className="h-3 rounded-full bg-cream-100">
                        <div
                          className="h-3 rounded-full bg-leaf-600"
                          style={{ width: `${width}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </Card>

          <Card>
            <h2 className="font-display text-2xl text-forest-900">
              Milestones
            </h2>
            <ul className="mt-3 space-y-3">
              <Milestone
                label="First scan"
                progress={Math.min(1, scans.length / 1)}
              />
              <Milestone
                label="5 scans in this view"
                progress={Math.min(1, scans.length / 5)}
              />
              <Milestone
                label="5 logged sorts in this view"
                progress={Math.min(1, disposals.length / 5)}
              />
              <Milestone
                label="1 kg diverted in this view"
                progress={Math.min(1, summary.divertedKg)}
              />
            </ul>
          </Card>
        </>
      )}

      <Card>
        <h2 className="font-display text-2xl text-forest-900">Assumptions</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-ink-soft">
          <li>
            A scan means you identified an item. It is not counted as waste
            diverted.
          </li>
          <li>
            A logged sort is the button “I sorted this as recommended.” Each
            press counts one item.
          </li>
          <li>
            Game scores, stars, and achievements are practice. They never enter
            these totals.
          </li>
          <li>
            Each database item has a typical weight, such as 0.015 kg for an
            aluminum can. Your real item may differ.
          </li>
          <li>
            Diverted weight adds recycling, compost, reusable items, and special
            drop-off. Trash stays out of that total. Reusable items are kept,
            not recovered as recycling.
          </li>
          <li>Recovered materials are recycling logs only.</li>
          <li>
            Emissions multiply those recycling weights by the factors below.
            Items without a factor contribute weight only.
          </li>
        </ul>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[20rem] text-left text-sm">
            <caption className="mb-2 text-left font-extrabold text-forest-900">
              Illustrative factors used
            </caption>
            <thead>
              <tr className="border-b border-forest-900/10">
                <th className="py-2">Group</th>
                <th className="py-2">Factor</th>
              </tr>
            </thead>
            <tbody>
              {factors.map(([label, factor]) => (
                <tr key={label} className="border-b border-forest-900/5">
                  <td className="py-2">{label}</td>
                  <td className="py-2">{factor} kg CO2e per kg</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-sm leading-6 text-ink-soft">
          The factors are rounded teaching numbers for recycling versus a rough
          virgin-material comparison. They are not a life-cycle assessment, and
          they are not your measured emissions.
        </p>
      </Card>
    </div>
  );
}

function Milestone({ label, progress }: { label: string; progress: number }) {
  const percent = Math.round(progress * 100);
  return (
    <li>
      <div className="mb-1 flex justify-between text-sm font-bold">
        <span>{label}</span>
        <span>{percent}%</span>
      </div>
      <div
        className="h-3 rounded-full bg-cream-100"
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label}
      >
        <div
          className="h-3 rounded-full bg-forest-900"
          style={{ width: `${percent}%` }}
        />
      </div>
    </li>
  );
}
