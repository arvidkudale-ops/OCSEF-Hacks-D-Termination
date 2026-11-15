import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { MATERIALS, CATEGORY_META, CATEGORY_ORDER } from "../data/categories";
import { WASTE_ITEMS } from "../data/items";
import { cx } from "../lib/cx";
import { CategoryBadge, EmptyState, PageHeader } from "../components/ui";
import type { DisposalCategory } from "../types";

/** Searchable list of every teaching item, filtered by material and disposal category. */
export function DatabasePage() {
  const [query, setQuery] = useState("");
  const [material, setMaterial] = useState("all");
  const [category, setCategory] = useState<"all" | DisposalCategory>("all");

  const results = useMemo(() => {
    const term = query.trim().toLowerCase();
    return WASTE_ITEMS.filter((item) => {
      if (material !== "all" && item.material !== material) return false;
      if (category !== "all" && item.category !== category) return false;
      if (!term) return true;
      return [
        item.name,
        item.material,
        item.environmentalNote,
        item.why,
        ...item.keywords,
      ]
        .join(" ")
        .toLowerCase()
        .includes(term);
    });
  }, [query, material, category]);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={`${WASTE_ITEMS.length} household items`}
        title="Waste database"
        description="Search by name or keyword, then filter by material and disposal category. These are teaching entries, and your local program can disagree."
      />
      <div className="space-y-3 rounded-3xl bg-white p-4 ring-1 ring-forest-900/10">
        <div>
          <label htmlFor="database-search" className="text-sm font-extrabold">
            Search
          </label>
          <input
            id="database-search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search batteries, pizza, foil…"
            className="mt-2 min-h-11 w-full rounded-2xl border border-forest-900/15 px-3"
          />
        </div>
        <div>
          <p className="text-sm font-extrabold">Material</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <FilterChip
              active={material === "all"}
              onClick={() => setMaterial("all")}
              label="All materials"
            />
            {MATERIALS.map((entry) => (
              <FilterChip
                key={entry}
                active={material === entry}
                onClick={() => setMaterial(entry)}
                label={entry}
              />
            ))}
          </div>
        </div>
        <div>
          <p className="text-sm font-extrabold">Disposal category</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <FilterChip
              active={category === "all"}
              onClick={() => setCategory("all")}
              label="All categories"
            />
            {CATEGORY_ORDER.map((entry) => (
              <FilterChip
                key={entry}
                active={category === entry}
                onClick={() => setCategory(entry)}
                label={CATEGORY_META[entry].label}
              />
            ))}
          </div>
        </div>
        <p className="text-sm text-ink-soft" role="status">
          Showing {results.length} of {WASTE_ITEMS.length}
        </p>
      </div>

      {results.length === 0 ? (
        <EmptyState title="Nothing matches">
          Clear a filter or try a broader word such as plastic, paper, or
          battery.
        </EmptyState>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {results.map((item) => (
            <li key={item.id}>
              <Link
                className="block h-full rounded-3xl bg-white p-4 ring-1 ring-forest-900/10 hover:bg-leaf-100"
                to={`/database/${item.id}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="text-3xl" aria-hidden>
                    {item.emoji}
                  </span>
                  <CategoryBadge category={item.category} />
                </div>
                <h2 className="mt-3 font-display text-2xl text-forest-900">
                  {item.name}
                </h2>
                <p className="mt-1 text-sm font-bold text-ink-soft">
                  {item.material}
                </p>
                <p className="mt-2 line-clamp-3 text-sm leading-6 text-ink-soft">
                  {item.why}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** One material or category toggle. Pressed means that filter is the one in use. */
function FilterChip({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cx(
        "min-h-10 rounded-lg border-2 px-3 py-1 text-sm font-extrabold",
        active
          ? "border-forest-950 bg-leaf-500 text-forest-950"
          : "border-transparent bg-cream-100 text-forest-900",
      )}
    >
      {label}
    </button>
  );
}
