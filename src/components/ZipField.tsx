import { useState } from "react";
import { rulesForZip } from "../data/locations";
import { useApp } from "../context/AppContext";
import { buttonClass } from "./ui";

export function ZipField({ id = "zip-code" }: { id?: string }) {
  const { state, setZip } = useApp();
  const [draft, setDraft] = useState(state.zip);
  const [message, setMessage] = useState("");
  const [seenZip, setSeenZip] = useState(state.zip);
  if (state.zip !== seenZip) {
    setSeenZip(state.zip);
    setDraft(state.zip);
  }

  const rules = rulesForZip(state.zip);

  function commit() {
    const digits = draft.replace(/\D/g, "");
    if (digits.length === 0) {
      setZip("");
      setMessage("ZIP cleared. Local notes are hidden until you add one.");
      return;
    }
    if (digits.length < 5) {
      setMessage("Enter a 5-digit ZIP code.");
      return;
    }
    const zip = digits.slice(0, 5);
    setZip(zip);
    setDraft(zip);
    const match = rulesForZip(zip);
    setMessage(
      match
        ? `Matched ${match.name}. The notes are unverified in this demo.`
        : "No stored rule set for that ZIP. Use an official source.",
    );
  }

  return (
    <form
      className="space-y-3"
      onSubmit={(event) => {
        event.preventDefault();
        commit();
      }}
    >
      <div>
        <label htmlFor={id} className="text-sm font-extrabold text-forest-900">
          ZIP code
        </label>
        <div className="mt-2 flex flex-col gap-2 sm:flex-row">
          <input
            id={id}
            name="zip"
            inputMode="numeric"
            autoComplete="postal-code"
            maxLength={10}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="90026"
            className="min-h-11 w-full rounded-2xl border border-forest-900/15 bg-white px-3 text-base"
          />
          <button className={buttonClass()} type="submit">
            Save ZIP
          </button>
        </div>
      </div>
      <p className="text-sm text-ink-soft" role="status">
        {message ||
          (state.zip
            ? rules
              ? `Current location: ${rules.name}. Not verified in this build.`
              : `Current ZIP ${state.zip} has no stored rule set.`
            : "No ZIP saved yet.")}
      </p>
    </form>
  );
}
