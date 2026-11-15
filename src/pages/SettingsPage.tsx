import { useEffect, useState } from "react";
import { useApp } from "../context/AppContext";
import { ZipField } from "../components/ZipField";
import {
  buttonClass,
  Card,
  DemoNote,
  Modal,
  PageHeader,
} from "../components/ui";

interface StatusBody {
  reason?: string;
  acceptsImages?: boolean;
}

/** Name, ZIP, theme, sound, recognition status, and the progress reset. */
export function SettingsPage() {
  const { state, setName, setSound, setTheme, resetProgress } = useApp();
  const dark = state.theme === "dark";
  const [confirm, setConfirm] = useState(false);
  const [status, setStatus] = useState<StatusBody | null>(null);
  const [statusError, setStatusError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/status", { signal: controller.signal })
      .then((response) => response.json() as Promise<StatusBody>)
      .then((body) => setStatus(body))
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError")
          return;
        setStatusError(
          "Could not reach the app server. Demo mode still works in the scanner.",
        );
      });
    return () => controller.abort();
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="This browser only"
        title="Settings"
        description="Your name, ZIP, sound, theme, and demo progress stay in local storage on this device. Photos are not saved."
      />
      <Card className="space-y-3">
        <label htmlFor="display-name" className="text-sm font-extrabold">
          Display name
        </label>
        <input
          id="display-name"
          value={state.displayName}
          maxLength={40}
          onChange={(event) => setName(event.target.value)}
          placeholder="Optional"
          className="min-h-11 w-full rounded-2xl border border-forest-900/15 px-3"
        />
        <p className="text-sm text-ink-soft">
          Shown on the dashboard. It is not an account.
        </p>
      </Card>
      <Card>
        <ZipField id="settings-zip" />
      </Card>
      <Card className="flex items-center justify-between gap-4">
        <div>
          <h2 className="font-extrabold text-forest-900" id="theme-label">
            Appearance
          </h2>
          <p className="text-sm text-ink-soft">
            {dark ? "Dark mode is on." : "Light mode is on."} This applies
            across the app on this device.
          </p>
        </div>
        <button
          type="button"
          role="switch"
          id="theme-switch"
          aria-labelledby="theme-label"
          aria-checked={dark}
          onClick={() => setTheme(dark ? "light" : "dark")}
          className={`relative h-8 w-14 shrink-0 rounded-full ${dark ? "bg-leaf-700" : "bg-stone-300"}`}
        >
          <span
            className={`theme-knob absolute top-1 left-1 h-6 w-6 rounded-full shadow ${dark ? "translate-x-6" : ""}`}
          />
          <span className="sr-only">
            {dark ? "Switch to light mode" : "Switch to dark mode"}
          </span>
        </button>
      </Card>
      <Card className="flex items-center justify-between gap-4">
        <div>
          <h2 className="font-extrabold text-forest-900">Game sound</h2>
          <p className="text-sm text-ink-soft">
            Short tones for pickups and correct or incorrect sorts.
          </p>
        </div>
        <button
          className={buttonClass(state.sound ? "primary" : "secondary")}
          type="button"
          aria-pressed={state.sound}
          onClick={() => setSound(!state.sound)}
        >
          {state.sound ? "Sound on" : "Sound off"}
        </button>
      </Card>
      <Card className="space-y-3">
        <h2 className="font-display text-2xl text-forest-900">
          Recognition service
        </h2>
        {statusError ? (
          <p role="alert" className="text-sm text-red-900">
            {statusError}
          </p>
        ) : null}
        {!status && !statusError ? (
          <p className="text-sm text-ink-soft">Checking the local server…</p>
        ) : null}
        {status ? (
          <DemoNote>
            {status.reason}{" "}
            {status.acceptsImages
              ? ""
              : "Photos are not accepted by the server."}
          </DemoNote>
        ) : null}
      </Card>
      <Card className="space-y-3">
        <h2 className="font-display text-2xl text-forest-900">
          Reset demo progress
        </h2>
        <p className="text-sm leading-6 text-ink-soft">
          Clears scans, logged disposals, viewed database items, game scores,
          stars, and achievements. Your name, ZIP, sound, and theme stay.
        </p>
        <button
          className={buttonClass("danger")}
          type="button"
          onClick={() => setConfirm(true)}
        >
          Reset progress
        </button>
      </Card>
      {confirm ? (
        <Modal title="Reset demo progress?" onClose={() => setConfirm(false)}>
          <p>
            This removes the sorting log and the adventure progress stored in
            this browser.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              className={buttonClass("secondary")}
              type="button"
              onClick={() => setConfirm(false)}
            >
              Cancel
            </button>
            <button
              className={buttonClass("danger")}
              type="button"
              onClick={() => {
                resetProgress();
                setConfirm(false);
              }}
            >
              Reset progress
            </button>
          </div>
        </Modal>
      ) : null}
    </div>
  );
}
