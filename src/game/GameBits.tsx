import { Flame } from "lucide-react";
import { getItem } from "../data/items";
import type { WasteItem } from "../types";

export interface Fx {
  ok: boolean;
  /** Increments on every answer so the animation restarts. */
  n: number;
  earned?: number;
}

export function ItemCard({
  item,
  fx,
  hideMaterial = false,
  belt = false,
  enterKey,
}: {
  item: WasteItem | undefined;
  fx: Fx | null;
  hideMaterial?: boolean;
  /** Show the item riding a conveyor belt. */
  belt?: boolean;
  /** Changes whenever a new item arrives, so it slides in. */
  enterKey?: string | number;
}) {
  return (
    <div className="relative">
      <div key={enterKey ?? item?.id} className="fx-enter">
        <div
          key={fx?.n ?? 0}
          className={`flex items-center gap-4 rounded-3xl bg-white p-4 shadow-[0_10px_30px_-18px_rgba(27,67,50,0.8)] ${fx ? (fx.ok ? "fx-pop ring-2 ring-leaf-500" : "fx-shake ring-2 ring-red-300") : ""}`}
        >
          <span
            className="grid h-20 w-20 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-cream-50 to-leaf-100 text-5xl"
            aria-hidden
          >
            <span className="drop-shadow-[0_4px_3px_rgba(0,0,0,0.2)]">
              {item?.emoji ?? "♻️"}
            </span>
          </span>
          <span>
            <span className="block font-display text-2xl text-forest-900">
              {item?.name ?? "Unknown item"}
            </span>
            {!hideMaterial && item ? (
              <span className="text-sm font-bold text-ink-soft">
                {item.material}
              </span>
            ) : null}
          </span>
        </div>
      </div>
      {belt ? <div className="belt mx-3 mt-1" aria-hidden /> : null}
      {fx?.ok && fx.earned ? (
        <span
          key={`f${fx.n}`}
          className="fx-float rounded-full bg-leaf-700 px-3 py-1 text-sm font-extrabold text-white"
          aria-hidden
        >
          +{fx.earned}
        </span>
      ) : null}
    </div>
  );
}

export function ComboBadge({ combo }: { combo: number }) {
  if (combo < 2) return null;
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1 text-sm font-extrabold text-amber-900"
      aria-live="polite"
    >
      <Flame aria-hidden size={16} /> {combo} in a row
      {combo >= 6 ? " · max bonus" : ` · +${Math.min(5, combo) * 10} next`}
    </span>
  );
}

/** Items missed during a run. The right bin stays hidden so the review pile is still a puzzle. */
export function MissedList({ itemIds }: { itemIds: string[] }) {
  const items = itemIds
    .map((id) => getItem(id))
    .filter((item): item is WasteItem => Boolean(item));
  if (items.length === 0) return null;
  return (
    <div className="rounded-3xl bg-white p-5 ring-1 ring-forest-900/10">
      <h2 className="font-extrabold text-forest-900">Worth another look</h2>
      <p className="mt-1 text-sm text-ink-soft">
        These went in the wrong bin at least once. They are now in your review
        pile.
      </p>
      <ul className="mt-3 space-y-3">
        {items.map((item) => (
          <li key={item.id} className="flex items-center gap-3">
            <span className="text-2xl" aria-hidden>
              {item.emoji}
            </span>
            <span className="text-sm font-extrabold text-forest-900">
              {item.name}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
