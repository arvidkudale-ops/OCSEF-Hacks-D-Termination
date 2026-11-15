import { useEffect, useState } from "react";
import { Download, Upload } from "lucide-react";
import { useApp } from "../context/AppContext";
import { ZipField } from "../components/ZipField";
import { dayKey } from "../lib/day";
import { createBackup, parseBackup } from "../lib/storage";
import type { AppState } from "../types";
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
  const {
    state,
    setName,
    setSound,
    setTheme,
    restoreState,
    resetProgress,
  } = useApp();
  const dark = state.theme === "dark";
  const [confirm, setConfirm] = useState(false);
  const [backupToRestore, setBackupToRestore] = useState<AppState | null>(null);
  const [backupError, setBackupError] = useState("");
  const [backupNotice, setBackupNotice] = useState("");
  const [status, setStatus] = useState<StatusBody | null>(null);
  const [statusError, setStatusError] = useState("");

  function downloadBackup() {
    const blob = new Blob([createBackup(state)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `d-trashify-backup-${dayKey()}.json`;
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    setBackupNotice("Backup downloaded. Keep the file somewhere safe.");
    setBackupError("");
  }

  async function loadBackup(file: File) {
    setBackupToRestore(null);
    setBackupNotice("");
    setBackupError("");
    if (file.size > 5 * 1024 * 1024) {
      setBackupError("That file is too large to be a D-Trashify backup.");
      return;
    }
    try {
      setBackupToRestore(parseBackup(await file.text()));
    } catch (error) {
      setBackupError(
        error instanceof Error
          ? error.message
          : "Could not read that backup file.",
      );
    }
  }

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
          Back up your data
        </h2>
        <p className="text-sm leading-6 text-ink-soft">
          Download your settings, scans, disposal log, and game progress as a
          file. The backup stays on your device unless you choose to share it.
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            className={buttonClass("secondary")}
            type="button"
            onClick={downloadBackup}
          >
            <Download aria-hidden size={16} />
            Download backup
          </button>
          <label className={buttonClass("secondary")}>
            <Upload aria-hidden size={16} />
            Choose backup to restore
            <input
              className="sr-only"
              type="file"
              accept="application/json,.json"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void loadBackup(file);
                event.target.value = "";
              }}
            />
          </label>
        </div>
        {backupError ? (
          <p role="alert" className="text-sm text-red-900">
            {backupError}
          </p>
        ) : null}
        {backupNotice ? (
          <p role="status" className="text-sm text-forest-900">
            {backupNotice}
          </p>
        ) : null}
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
      {backupToRestore ? (
        <Modal
          title="Replace this browser's data?"
          onClose={() => setBackupToRestore(null)}
        >
          <p>
            This backup contains {backupToRestore.scans.length} scans,{" "}
            {backupToRestore.disposals.length} logged sorts, and{" "}
            {backupToRestore.game.points} game points. Restoring replaces the
            current settings and progress in this browser.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              className={buttonClass("secondary")}
              type="button"
              onClick={() => setBackupToRestore(null)}
            >
              Cancel
            </button>
            <button
              className={buttonClass("danger")}
              type="button"
              onClick={() => {
                restoreState(backupToRestore);
                setBackupToRestore(null);
                setBackupNotice("Backup restored to this browser.");
              }}
            >
              Replace with backup
            </button>
          </div>
        </Modal>
      ) : null}
    </div>
  );
}
