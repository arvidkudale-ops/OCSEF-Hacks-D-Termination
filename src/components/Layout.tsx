import { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import {
  Gamepad2,
  Home,
  Leaf,
  MapPin,
  Menu,
  Recycle,
  Settings,
  Sprout,
  X,
} from "lucide-react";
import { useApp } from "../context/AppContext";
import { cx } from "../lib/cx";

/** Sidebar and mobile menu entries, in the order they should be read. */
const NAV = [
  { to: "/", label: "Home", icon: Home, end: true },
  {
    to: "/adventure",
    label: "Recycling Adventure",
    icon: Gamepad2,
    end: false,
  },
  { to: "/scanner", label: "Waste Scanner", icon: Recycle, end: false },
  { to: "/database", label: "Waste Database", icon: Leaf, end: false },
  { to: "/centers", label: "Recycling Centers", icon: MapPin, end: false },
  { to: "/impact", label: "Environmental Impact", icon: Sprout, end: false },
  { to: "/settings", label: "Settings", icon: Settings, end: false },
];

/** Shell around every page: sidebar, mobile menu, and the animated page body. */
export function Layout() {
  const { state } = useApp();
  const location = useLocation();
  const pull =
    typeof location.state === "object" &&
    location.state !== null &&
    "pull" in location.state &&
    Boolean((location.state as { pull?: boolean }).pull);
  const [open, setOpen] = useState(false);
  const [menuPath, setMenuPath] = useState(location.pathname);
  /* Close the mobile menu when the route changes, during render so it does not flash open. */
  if (location.pathname !== menuPath) {
    setMenuPath(location.pathname);
    setOpen(false);
  }

  /* Keep the browser tab title in sync and start each top-level page at the top. */
  useEffect(() => {
    if (
      location.pathname.startsWith("/database/") ||
      location.pathname.startsWith("/adventure/")
    )
      return;
    const titles: Record<string, string> = {
      "/": "D-Trashify",
      "/scanner": "Waste scanner · D-Trashify",
      "/database": "Waste database · D-Trashify",
      "/centers": "Recycling centers · D-Trashify",
      "/impact": "Environmental impact · D-Trashify",
      "/adventure": "Recycling adventure · D-Trashify",
      "/settings": "Settings · D-Trashify",
    };
    document.title = titles[location.pathname] ?? "D-Trashify";
    if (!location.hash) window.scrollTo(0, 0);
  }, [location.pathname, location.hash]);

  const nav = (
    <nav aria-label="Primary" className="flex flex-col gap-1">
      {NAV.map((item) => {
        const Icon = item.icon;
        return (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              cx(
                "flex min-h-11 items-center gap-3 rounded-lg px-3 py-2 text-sm font-extrabold",
                isActive ? "flat-nav-active" : "flat-nav text-forest-900/80",
              )
            }
          >
            <Icon aria-hidden size={18} />
            {item.label}
          </NavLink>
        );
      })}
    </nav>
  );

  return (
    <div className="min-h-svh bg-cream-50 text-ink">
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-forest-900/10 bg-cream-50/95 px-4 py-3 backdrop-blur md:hidden">
        <NavLink
          to="/"
          end
          className="flex items-center gap-2 font-display text-xl text-forest-900"
        >
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-forest-900 text-leaf-300">
            <Leaf aria-hidden size={18} />
          </span>
          D-Trashify
        </NavLink>
        <button
          className="grid h-11 w-11 place-items-center rounded-2xl bg-white ring-1 ring-forest-900/10"
          type="button"
          aria-expanded={open}
          aria-controls="mobile-nav"
          onClick={() => setOpen((value) => !value)}
        >
          {open ? <X aria-hidden /> : <Menu aria-hidden />}
          <span className="sr-only">{open ? "Close menu" : "Open menu"}</span>
        </button>
      </header>
      {open ? (
        <div
          className="fixed inset-0 z-40 bg-forest-950/40 md:hidden"
          onMouseDown={() => setOpen(false)}
        >
          <div
            id="mobile-nav"
            className="h-full w-72 overflow-auto bg-cream-50 p-4"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <p className="mb-3 font-display text-2xl text-forest-900">D-Trashify</p>
            {nav}
          </div>
        </div>
      ) : null}
      <div className="md:grid md:grid-cols-[16rem_minmax(0,1fr)]">
        <aside className="sticky top-0 hidden h-svh flex-col gap-6 border-r border-forest-900/10 bg-cream-50 p-4 md:flex">
          <NavLink
            to="/"
            end
            className="flex items-center gap-2 font-display text-2xl text-forest-900"
          >
            <span className="grid h-10 w-10 place-items-center rounded-2xl bg-forest-900 text-leaf-300">
              <Leaf aria-hidden size={20} />
            </span>
            D-Trashify
          </NavLink>
          {nav}
          <p className="mt-auto text-xs leading-5 text-ink-soft">
            {state.zip ? `ZIP ${state.zip}` : "No ZIP saved"}
            <br />
            Local rules win.
          </p>
        </aside>
        <div className="min-w-0 overflow-x-clip">
          <main
            id="main"
            className="mx-auto w-full max-w-6xl px-4 py-6 md:px-8 md:py-8"
          >
            {/* Remount on each path so the entrance animation runs again. */}
            <div
              key={location.pathname}
              className={pull ? "page-stage page-pull" : "page-stage"}
            >
              <Outlet />
            </div>
          </main>
          <footer className="mx-auto w-full max-w-6xl px-4 pb-8 text-xs leading-5 text-ink-soft md:px-8">
            <p>
              Sample facilities are not real drop-off sites. Game actions are
              not counted as real recycling.
            </p>
            <p className="mt-2">
              Built by Veeram Dugar, Arvid Kudale, and Vince Nguyen
            </p>
          </footer>
        </div>
      </div>
    </div>
  );
}
