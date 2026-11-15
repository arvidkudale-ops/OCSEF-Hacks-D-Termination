import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import type { MonsterMood } from "../art";
import { createStage } from "./stage";
import type { Stage, StageBin, StageEvent, StageTheme } from "./stage";

const NO_BINS: StageBin[] = [];
const NO_BITS: string[] = [];

/**
 * 3D scene for a button level. Clicking a bin in the scene is the same as
 * pressing its button. When WebGL is missing, `fallback` is shown instead.
 */
export function Stage3D({
  theme,
  bins = NO_BINS,
  emoji = null,
  itemKey = "",
  event = null,
  steps = null,
  shield = 1,
  mood = "angry",
  bits = NO_BITS,
  onChoose,
  className = "",
  fallback = null,
}: {
  theme: StageTheme;
  bins?: StageBin[];
  emoji?: string | null;
  itemKey?: string | number;
  event?: StageEvent | null;
  steps?: { total: number; done: number } | null;
  shield?: number;
  mood?: MonsterMood;
  bits?: string[];
  onChoose?: (binId: string) => void;
  className?: string;
  fallback?: ReactNode;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<Stage | null>(null);
  const [failed, setFailed] = useState(false);
  const props = { bins, emoji, itemKey, event, steps, shield, mood, bits };
  const latest = useRef(props);
  latest.current = props;

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    let stage: Stage;
    try {
      stage = createStage(host, theme);
    } catch (error) {
      console.warn("3D view unavailable, using flat art.", error);
      setFailed(true);
      return;
    }
    stageRef.current = stage;
    stage.update(latest.current);
    return () => {
      stageRef.current = null;
      stage.dispose();
    };
  }, [theme]);

  useEffect(() => {
    stageRef.current?.update(latest.current);
  });

  if (failed) return <>{fallback}</>;
  return (
    <div
      ref={hostRef}
      className={`overflow-hidden ${className}`}
      aria-hidden
      onClick={(pointer) => {
        const id = stageRef.current?.pick(pointer.clientX, pointer.clientY);
        if (id && onChoose) onChoose(id);
      }}
      onPointerMove={(pointer) =>
        stageRef.current?.hover(pointer.clientX, pointer.clientY)
      }
    />
  );
}
