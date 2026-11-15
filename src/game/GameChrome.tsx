import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { Pause, Play, Volume2, VolumeX } from "lucide-react";
import { buttonClass } from "../components/ui";

export function GameChrome({
  title,
  place,
  detail,
  sound,
  paused,
  message,
  tone,
  onToggleSound,
  onPause,
  onResume,
  onRestart,
  onExit,
  children,
}: {
  title: string;
  place: string;
  detail: string;
  sound: boolean;
  paused: boolean;
  message?: string;
  tone?: "info" | "ok" | "bad";
  onToggleSound: () => void;
  onPause: () => void;
  onResume: () => void;
  onRestart: () => void;
  onExit: () => void;
  children: ReactNode;
}) {
  const [confirm, setConfirm] = useState<null | "restart">(null);
  const [gameOver, setGameOver] = useState(false);
  // Forget a pending restart question once the game resumes.
  useEffect(() => {
    if (!paused) setConfirm(null);
  }, [paused]);
  const toneClass =
    tone === "ok"
      ? "bg-leaf-100 text-forest-900"
      : tone === "bad"
        ? "status-bad"
        : "bg-cream-100 text-ink";

  function openGameOver() {
    onPause();
    setGameOver(true);
  }

  return (
    <section className="relative space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-extrabold uppercase tracking-wide text-leaf-700">
            {place}
          </p>
          <h1 className="font-display text-3xl text-forest-900">{title}</h1>
          <p className="text-sm font-bold text-ink-soft">{detail}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            className={buttonClass("secondary")}
            type="button"
            onClick={onToggleSound}
            aria-pressed={sound}
          >
            {sound ? (
              <Volume2 aria-hidden size={16} />
            ) : (
              <VolumeX aria-hidden size={16} />
            )}
            {sound ? "Sound on" : "Sound off"}
          </button>
          <button
            className={buttonClass("secondary")}
            type="button"
            onClick={paused ? onResume : onPause}
          >
            {paused ? (
              <Play aria-hidden size={16} />
            ) : (
              <Pause aria-hidden size={16} />
            )}
            {paused ? "Resume" : "Pause"}
          </button>
          <button
            className={buttonClass("ghost")}
            type="button"
            onClick={openGameOver}
          >
            Quit
          </button>
        </div>
      </div>
      {message ? (
        <p
          className={`rounded-2xl px-4 py-3 text-sm leading-6 ${toneClass}`}
          role="status"
        >
          {message}
        </p>
      ) : null}
      <div className="relative">
        {children}
        {paused && !gameOver ? (
          <div className="absolute inset-0 z-20 flex items-center justify-center rounded-3xl bg-forest-950/55 p-4">
            <div className="w-full max-w-sm rounded-3xl bg-white p-5 text-center">
              <h2 className="font-display text-3xl text-forest-900">Paused</h2>
              {confirm === "restart" ? (
                <p className="mt-2 text-sm text-ink-soft">
                  Start this level over? The current attempt will be discarded.
                </p>
              ) : null}
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                {confirm === null ? (
                  <>
                    <button
                      className={buttonClass()}
                      type="button"
                      onClick={onResume}
                    >
                      Resume
                    </button>
                    <button
                      className={buttonClass("secondary")}
                      type="button"
                      onClick={() => setConfirm("restart")}
                    >
                      Restart
                    </button>
                    <button
                      className={buttonClass("ghost")}
                      type="button"
                      onClick={openGameOver}
                    >
                      Quit
                    </button>
                  </>
                ) : null}
                {confirm === "restart" ? (
                  <>
                    <button
                      className={buttonClass("secondary")}
                      type="button"
                      onClick={() => setConfirm(null)}
                    >
                      Stay
                    </button>
                    <button
                      className={buttonClass()}
                      type="button"
                      onClick={() => {
                        setConfirm(null);
                        onRestart();
                      }}
                    >
                      Restart level
                    </button>
                  </>
                ) : null}
              </div>
            </div>
          </div>
        ) : null}
      </div>
      {gameOver ? (
        <div className="game-over fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 px-6 text-center">
          <h2 className="font-display text-6xl">Game Over</h2>
          <p className="max-w-sm text-sm leading-6">
            This attempt ends here. Nothing from it is saved.
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            <button
              className="game-over-btn game-over-btn-light"
              type="button"
              onClick={() => {
                setGameOver(false);
                onResume();
              }}
            >
              Keep playing
            </button>
            <button
              className="game-over-btn game-over-btn-line"
              type="button"
              onClick={onExit}
            >
              Leave
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
