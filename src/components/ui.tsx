import { useEffect } from "react";
import type { ReactNode } from "react";
import { CATEGORY_META } from "../data/categories";
import { cx } from "../lib/cx";
import type { DisposalCategory } from "../types";

/** Shared button styles. Primary, secondary, and danger share the soft press. */
export function buttonClass(
  variant: "primary" | "secondary" | "ghost" | "danger" = "primary",
) {
  const base =
    "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-extrabold disabled:cursor-not-allowed disabled:opacity-50";
  if (variant === "secondary")
    return cx(base, "flat-pop bg-white text-forest-950 hover:bg-leaf-300");
  if (variant === "ghost")
    return cx(base, "bg-transparent text-forest-900 hover:bg-leaf-100");
  if (variant === "danger")
    return cx(base, "flat-pop bg-red-700 text-white hover:bg-red-600");
  return cx(base, "flat-pop bg-leaf-500 text-forest-950 hover:bg-leaf-300");
}

/** A flat panel with a solid edge. Pages drop this in wherever a group of content sits. */
export function Card({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cx("flat-card bg-white p-5", className)}>{children}</div>
  );
}

/** Colored label for recycle, compost, reuse, trash, or special drop-off. */
export function CategoryBadge({ category }: { category: DisposalCategory }) {
  const meta = CATEGORY_META[category];
  return (
    <span
      className={cx(
        "inline-flex rounded-md px-2.5 py-1 text-xs font-extrabold",
        meta.className,
      )}
    >
      {meta.label}
    </span>
  );
}

/** Amber note used for demo-mode and unverified guidance. */
export function DemoNote({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-lg border-2 border-amber-800 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-950">
      {children}
    </p>
  );
}

/** Dashed panel for an empty list or a missing page. */
export function EmptyState({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-xl border-2 border-dashed border-forest-900 bg-white/70 px-6 py-10 text-center">
      <h2 className="font-display text-2xl text-forest-900">{title}</h2>
      <div className="mx-auto mt-2 max-w-md text-sm leading-6 text-ink-soft">
        {children}
      </div>
    </div>
  );
}

/** Dialog that locks page scroll and closes on Escape or a click outside the panel. */
export function Modal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
}) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-forest-950/60 p-4 sm:items-center"
      onMouseDown={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
        className="flat-card w-full max-w-md bg-white p-6"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <h2 id="dialog-title" className="font-display text-2xl text-forest-900">
          {title}
        </h2>
        <div className="mt-3 text-sm leading-6 text-ink-soft">{children}</div>
      </div>
    </div>
  );
}

/** Title block at the top of a page, with an optional button on the right. */
export function PageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow ? (
          <p className="text-sm font-extrabold uppercase tracking-wide text-leaf-700">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="font-display text-3xl text-forest-900 md:text-4xl">
          {title}
        </h1>
        {description ? (
          <p className="mt-2 max-w-2xl leading-7 text-ink-soft">
            {description}
          </p>
        ) : null}
      </div>
      {action}
    </div>
  );
}
