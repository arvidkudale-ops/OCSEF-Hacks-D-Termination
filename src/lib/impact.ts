import { WASTE_ITEMS, getItem } from "../data/items";
import type { DisposalRecord, ScanRecord } from "../types";

export type TimeRange = "week" | "month" | "all";

export interface ActivityBucket {
  label: string;
  scans: number;
  logged: number;
}

/** Short weight label for the impact cards. */
export function formatKg(kg: number) {
  if (kg <= 0) return "0 kg";
  if (kg < 0.01) return "under 0.01 kg";
  if (kg < 10) return `${kg.toFixed(2)} kg`;
  return `${kg.toFixed(1)} kg`;
}

/** Short emissions label. This is an illustration, not a measured saving. */
export function formatCo2(kg: number) {
  if (kg <= 0) return "0 kg CO2e";
  if (kg < 0.01) return "under 0.01 kg CO2e";
  if (kg < 10) return `${kg.toFixed(2)} kg CO2e`;
  return `${kg.toFixed(1)} kg CO2e`;
}

/** Midnight at the start of a local day, so buckets do not split at UTC. */
function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

/** True when an ISO timestamp falls inside a chart bucket. */
function inBucket(iso: string, start: Date, end: Date) {
  const time = new Date(iso).getTime();
  return !Number.isNaN(time) && time >= start.getTime() && time < end.getTime();
}

/** Counts scans and logs into week, month, or six-month chart columns. */
export function buildSeries(
  scans: ScanRecord[],
  disposals: DisposalRecord[],
  range: TimeRange,
  now = new Date(),
) {
  const buckets: { label: string; start: Date; end: Date }[] = [];
  const today = startOfDay(now);
  if (range === "week") {
    for (let index = 6; index >= 0; index -= 1) {
      const start = new Date(today);
      start.setDate(today.getDate() - index);
      const end = new Date(start);
      end.setDate(start.getDate() + 1);
      buckets.push({
        label: start.toLocaleDateString(undefined, { weekday: "short" }),
        start,
        end,
      });
    }
  } else if (range === "month") {
    for (let index = 3; index >= 0; index -= 1) {
      const start = new Date(today);
      start.setDate(today.getDate() - (index * 7 + 6));
      const end = new Date(today);
      end.setDate(today.getDate() - index * 7 + 1);
      buckets.push({
        label: start.toLocaleDateString(undefined, {
          month: "short",
          day: "numeric",
        }),
        start,
        end,
      });
    }
  } else {
    for (let index = 5; index >= 0; index -= 1) {
      const start = new Date(now.getFullYear(), now.getMonth() - index, 1);
      const end = new Date(now.getFullYear(), now.getMonth() - index + 1, 1);
      buckets.push({
        label: start.toLocaleDateString(undefined, { month: "short" }),
        start,
        end,
      });
    }
  }

  return buckets.map((bucket) => ({
    label: bucket.label,
    scans: scans.filter((scan) => inBucket(scan.at, bucket.start, bucket.end))
      .length,
    logged: disposals.filter((disposal) =>
      inBucket(disposal.at, bucket.start, bucket.end),
    ).length,
  }));
}

/** Keeps rows from the last 7 days, 30 days, or all time. */
export function filterByRange<T extends { at: string }>(
  rows: T[],
  range: TimeRange,
  now = new Date(),
) {
  if (range === "all") return rows;
  const days = range === "week" ? 7 : 30;
  const start = now.getTime() - days * 24 * 60 * 60 * 1000;
  return rows.filter((row) => {
    const time = new Date(row.at).getTime();
    return !Number.isNaN(time) && time >= start;
  });
}

/** Totals logged sorts by category. Trash is counted in the mix but not as diverted. */
export function summarize(disposals: DisposalRecord[]) {
  const byCategory = { recycle: 0, compost: 0, reuse: 0, trash: 0, special: 0 };
  const recoveredByMaterial = new Map<string, number>();
  let divertedKg = 0;
  let recoveredKg = 0;
  let emissionsKg = 0;
  let emissionsWeightKg = 0;

  for (const disposal of disposals) {
    const item = getItem(disposal.itemId);
    if (!item) continue;
    byCategory[item.category] += 1;
    if (item.category === "trash") continue;
    divertedKg += item.weightKg;
    if (item.category === "recycle") {
      recoveredKg += item.weightKg;
      recoveredByMaterial.set(
        item.material,
        (recoveredByMaterial.get(item.material) ?? 0) + item.weightKg,
      );
      if (item.emissionFactorPerKg) {
        emissionsKg += item.weightKg * item.emissionFactorPerKg;
        emissionsWeightKg += item.weightKg;
      }
    }
  }

  return {
    byCategory,
    divertedKg,
    recoveredKg,
    emissionsKg,
    emissionsWeightKg,
    recoveredByMaterial: [...recoveredByMaterial.entries()].sort(
      (a, b) => b[1] - a[1],
    ),
  };
}

/** Unique illustrative emission factors shown in the assumptions table. */
export function listEmissionFactors() {
  const groups = new Map<string, number>();
  for (const item of WASTE_ITEMS) {
    if (item.emissionFactorPerKg == null) continue;
    const label = item.id === "steel-can" ? "Steel cans" : item.material;
    const previous = groups.get(label);
    if (previous == null) groups.set(label, item.emissionFactorPerKg);
  }
  return [...groups.entries()];
}
