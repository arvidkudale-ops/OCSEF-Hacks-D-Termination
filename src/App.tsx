import { Component, lazy, Suspense } from "react";
import type { ErrorInfo, ReactNode } from "react";
import { BrowserRouter, Link, Route, Routes } from "react-router-dom";
import { AppProvider } from "./context/AppContext";
import { Layout } from "./components/Layout";
import { buttonClass, EmptyState } from "./components/ui";
import { HomePage } from "./pages/HomePage";
import { ScannerPage } from "./pages/ScannerPage";
import { DatabasePage } from "./pages/DatabasePage";
import { ItemPage } from "./pages/ItemPage";
import { CentersPage } from "./pages/CentersPage";
import { ImpactPage } from "./pages/ImpactPage";
import { SettingsPage } from "./pages/SettingsPage";
/** The game brings the 3D engine with it, so it loads only when the game is opened. */
const GamePage = lazy(() =>
  import("./pages/GamePage").then((module) => ({ default: module.GamePage })),
);
const game = (
  <Suspense fallback={<p className="text-sm text-ink-soft">Loading the game…</p>}>
    <GamePage />
  </Suspense>
);

interface BoundaryState {
  error: Error | null;
}

/** Catches a render crash and offers a way back to the dashboard instead of a blank screen. */
class AppErrorBoundary extends Component<
  { children: ReactNode },
  BoundaryState
> {
  state: BoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): BoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="mx-auto max-w-lg px-6 py-16">
          <h1 className="font-display text-4xl text-forest-900">
            Something went wrong
          </h1>
          <p className="mt-3 text-sm leading-6 text-ink-soft">
            {this.state.error.message}
          </p>
          <button
            className={`${buttonClass()} mt-4`}
            type="button"
            onClick={() => window.location.assign("/")}
          >
            Back to the dashboard
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

/** Shown for any URL that does not match a route above. */
function MissingPage() {
  return (
    <EmptyState title="Page not found">
      <p>That page is not part of D-Trashify.</p>
      <Link className={`${buttonClass()} mt-4`} to="/">
        Back to the dashboard
      </Link>
    </EmptyState>
  );
}

/** Wires saved app state, the router, and one route per screen. */
export default function App() {
  return (
    <AppErrorBoundary>
      <AppProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<Layout />}>
              <Route index element={<HomePage />} />
              <Route path="scanner" element={<ScannerPage />} />
              <Route path="database" element={<DatabasePage />} />
              <Route path="database/:itemId" element={<ItemPage />} />
              <Route path="centers" element={<CentersPage />} />
              <Route path="impact" element={<ImpactPage />} />
              <Route path="adventure" element={game} />
              <Route path="adventure/:levelId" element={game} />
              <Route path="settings" element={<SettingsPage />} />
              <Route path="*" element={<MissingPage />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AppProvider>
    </AppErrorBoundary>
  );
}
