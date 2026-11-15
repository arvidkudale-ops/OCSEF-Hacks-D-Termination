import type { CSSProperties, ReactNode } from "react";
import type { LevelId } from "../types";

/* ------------------------------------------------------------------ */
/* Bins                                                                */
/* ------------------------------------------------------------------ */

export interface BinLook {
  body: string;
  lid: string;
  symbol: string;
}

/** Look for every bin id used by levels and categories. */
export const BIN_LOOKS: Record<string, BinLook> = {
  recycle: { body: "#1e40af", lid: "#1e3a8a", symbol: "♻️" },
  compost: { body: "#2d6a4f", lid: "#1b4332", symbol: "🌱" },
  reuse: { body: "#0f766e", lid: "#115e59", symbol: "🔁" },
  trash: { body: "#57534e", lid: "#292524", symbol: "🗑️" },
  special: { body: "#b45309", lid: "#78350f", symbol: "⚠️" },
  paper: { body: "#2563eb", lid: "#1e40af", symbol: "📄" },
  cardboard: { body: "#a16207", lid: "#713f12", symbol: "📦" },
  plastic: { body: "#0e7490", lid: "#155e75", symbol: "🧴" },
  metal: { body: "#64748b", lid: "#334155", symbol: "🥫" },
  glass: { body: "#15803d", lid: "#14532d", symbol: "🍾" },
  out: { body: "#991b1b", lid: "#7f1d1d", symbol: "🚫" },
  yes: { body: "#1e40af", lid: "#1e3a8a", symbol: "✅" },
  no: { body: "#991b1b", lid: "#7f1d1d", symbol: "🚫" },
  greens: { body: "#2d6a4f", lid: "#1b4332", symbol: "🥬" },
  browns: { body: "#a16207", lid: "#713f12", symbol: "🍂" },
};

export function binLook(id: string): BinLook {
  return BIN_LOOKS[id] ?? BIN_LOOKS.trash;
}

export function BinIcon({
  look,
  size = 56,
  open = false,
}: {
  look: BinLook;
  size?: number;
  open?: boolean;
}) {
  return (
    <svg
      viewBox="0 0 64 74"
      width={size}
      height={size * (74 / 64)}
      aria-hidden
      className="bin-icon overflow-visible"
    >
      <ellipse cx="32" cy="71" rx="23" ry="3" fill="rgba(0,0,0,.18)" />
      <path
        d="M12 22 L52 22 L48 64 Q47.5 67 45 67 L19 67 Q16.5 67 16 64 Z"
        fill={look.body}
      />
      <path
        d="M13 22 L51 22 L50.2 31 L13.8 31 Z"
        fill="rgba(255,255,255,.14)"
      />
      <path
        d="M22 36 L23 60 M32 36 L32 60 M42 36 L41 60"
        stroke="rgba(0,0,0,.12)"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <circle cx="20" cy="67" r="4.5" fill="#1c1917" />
      <circle cx="44" cy="67" r="4.5" fill="#1c1917" />
      <circle cx="20" cy="67" r="1.6" fill="#78716c" />
      <circle cx="44" cy="67" r="1.6" fill="#78716c" />
      <g
        className="bin-lid"
        style={{ transform: open ? "rotate(-24deg)" : undefined }}
      >
        <rect x="8" y="13" width="48" height="10" rx="3" fill={look.lid} />
        <rect x="25" y="9" width="14" height="6" rx="2.5" fill={look.lid} />
      </g>
      <circle cx="32" cy="46" r="11" fill="rgba(255,255,255,.92)" />
      <text x="32" y="51.5" textAnchor="middle" fontSize="14">
        {look.symbol}
      </text>
    </svg>
  );
}

/** A big, tappable bin used for every sorting choice. */
export function BinButton({
  binId,
  label,
  hotkey,
  disabled,
  onClick,
}: {
  binId: string;
  label: string;
  hotkey: number;
  disabled?: boolean;
  onClick: () => void;
}) {
  const look = binLook(binId);
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="bin-btn group flex min-h-11 flex-col items-center gap-1 rounded-3xl bg-white px-2 pb-3 pt-2 text-center ring-1 ring-forest-900/10 hover:-translate-y-0.5 hover:shadow-lg hover:ring-2 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-none"
      style={{ "--bin-ring": look.body } as CSSProperties}
    >
      <BinIcon look={look} size={52} />
      <span className="text-sm font-extrabold leading-tight text-forest-900">
        {label}
      </span>
      <kbd className="rounded-md bg-cream-100 px-1.5 text-[11px] font-extrabold text-ink-soft">
        {hotkey}
      </kbd>
    </button>
  );
}

export function BinGrid({
  children,
  count,
}: {
  children: ReactNode;
  count: number;
}) {
  const cols =
    count <= 2
      ? "grid-cols-2"
      : count === 3
        ? "grid-cols-3"
        : count === 4
          ? "grid-cols-2 sm:grid-cols-4"
          : "grid-cols-3 sm:grid-cols-6";
  return <div className={`grid gap-2 ${cols}`}>{children}</div>;
}

/* ------------------------------------------------------------------ */
/* Level scenes                                                        */
/* ------------------------------------------------------------------ */

function SortingScene() {
  return (
    <>
      <rect width="600" height="130" fill="#dfe7ee" />
      <rect y="0" width="600" height="22" fill="#9fb3c4" />
      {[60, 180, 300, 420, 540].map((x) => (
        <rect
          key={x}
          x={x - 30}
          y="4"
          width="60"
          height="12"
          rx="3"
          fill="#fef9c3"
          opacity=".9"
        />
      ))}
      <rect x="0" y="96" width="600" height="34" fill="#b8c4cc" />
      {/* conveyor */}
      <rect x="20" y="78" width="560" height="16" rx="8" fill="#374151" />
      <line
        x1="28"
        y1="86"
        x2="572"
        y2="86"
        stroke="#6b7280"
        strokeWidth="8"
        strokeDasharray="10 10"
        className="belt-stripes"
      />
      {[40, 120, 200, 280, 360, 440, 520, 560].map((x) => (
        <circle key={x} cx={x} cy="86" r="5" fill="#9ca3af" />
      ))}
      <g className="belt-items">
        <text x="40" y="74" fontSize="22">
          📦
        </text>
        <text x="130" y="74" fontSize="22">
          🥫
        </text>
        <text x="220" y="74" fontSize="22">
          🧴
        </text>
        <text x="310" y="74" fontSize="22">
          📰
        </text>
        <text x="400" y="74" fontSize="22">
          🍾
        </text>
        <text x="490" y="74" fontSize="22">
          📦
        </text>
      </g>
      {/* sorting arm */}
      <g className="arm-swing" style={{ transformOrigin: "300px 24px" }}>
        <rect x="296" y="22" width="8" height="34" fill="#f59e0b" />
        <rect x="286" y="54" width="28" height="6" rx="2" fill="#b45309" />
      </g>
      <rect x="250" y="20" width="100" height="8" rx="3" fill="#6b7280" />
      <text
        x="580"
        y="122"
        textAnchor="end"
        fontSize="11"
        fontWeight="800"
        fill="#1b4332"
      >
        MATERIALS RECOVERY FACILITY
      </text>
    </>
  );
}

function CompostScene() {
  return (
    <>
      <rect width="600" height="130" fill="#cfe8f3" />
      <circle cx="540" cy="30" r="16" fill="#fde68a" />
      <rect y="92" width="600" height="38" fill="#8a6a4a" />
      <rect y="92" width="600" height="6" fill="#6f8f4e" />
      {[90, 270, 450].map((x, i) => (
        <g key={x}>
          <path
            d={`M${x - 80} 100 Q${x} ${38 + i * 4} ${x + 80} 100 Z`}
            fill={i === 1 ? "#6b4b32" : "#5a3e2b"}
          />
          <path
            d={`M${x - 50} 90 Q${x} ${56 + i * 4} ${x + 50} 90`}
            fill="none"
            stroke="#7c5a3f"
            strokeWidth="3"
          />
          {[-30, 0, 30].map((dx) => (
            <path
              key={dx}
              className="steam"
              style={{ animationDelay: `${(dx + 30) / 30}s` }}
              d={`M${x + dx} ${60 + i * 4} q-6 -10 0 -18 q6 -8 0 -16`}
              fill="none"
              stroke="#fff"
              strokeWidth="3"
              strokeLinecap="round"
              opacity=".7"
            />
          ))}
        </g>
      ))}
      <text x="150" y="88" fontSize="16">
        🍌
      </text>
      <text x="300" y="80" fontSize="16">
        🍂
      </text>
      <text x="470" y="86" fontSize="16">
        🥚
      </text>
      <path
        d="M380 116 q8 -8 16 0 q8 8 16 0"
        fill="none"
        stroke="#f9a8d4"
        strokeWidth="5"
        strokeLinecap="round"
        className="worm"
      />
      <text x="20" y="122" fontSize="11" fontWeight="800" fill="#fef3c7">
        ORGANICS YARD
      </text>
    </>
  );
}

function RecyclingScene() {
  return (
    <>
      <rect width="600" height="130" fill="#dbeafe" />
      <rect y="100" width="600" height="30" fill="#94a3b8" />
      {/* factory */}
      <path
        d="M60 100 L60 60 L110 40 L110 60 L160 40 L160 60 L210 40 L210 100 Z"
        fill="#475569"
      />
      <rect x="180" y="18" width="16" height="40" fill="#334155" />
      <circle className="smoke" cx="188" cy="12" r="8" fill="#e2e8f0" />
      <circle
        className="smoke"
        style={{ animationDelay: "1.2s" }}
        cx="188"
        cy="12"
        r="8"
        fill="#e2e8f0"
      />
      {[80, 120, 160].map((x) => (
        <rect
          key={x}
          x={x}
          y="72"
          width="18"
          height="14"
          rx="2"
          fill="#fde68a"
        />
      ))}
      {/* gears */}
      <g className="gear" style={{ transformOrigin: "300px 62px" }}>
        <circle cx="300" cy="62" r="24" fill="#64748b" />
        {Array.from({ length: 8 }, (_, i) => (
          <rect
            key={i}
            x="296"
            y="32"
            width="8"
            height="12"
            fill="#64748b"
            transform={`rotate(${i * 45} 300 62)`}
          />
        ))}
        <circle cx="300" cy="62" r="9" fill="#dbeafe" />
      </g>
      <g className="gear-rev" style={{ transformOrigin: "342px 84px" }}>
        <circle cx="342" cy="84" r="15" fill="#94a3b8" />
        {Array.from({ length: 6 }, (_, i) => (
          <rect
            key={i}
            x="339"
            y="64"
            width="6"
            height="9"
            fill="#94a3b8"
            transform={`rotate(${i * 60} 342 84)`}
          />
        ))}
        <circle cx="342" cy="84" r="5" fill="#dbeafe" />
      </g>
      {/* bales */}
      {[
        [420, 76, "#60a5fa"],
        [470, 76, "#a3a3a3"],
        [520, 76, "#facc15"],
        [445, 52, "#4ade80"],
        [495, 52, "#f87171"],
      ].map(([x, y, c]) => (
        <g key={`${x}-${y}`}>
          <rect
            x={x as number}
            y={y as number}
            width="46"
            height="24"
            rx="3"
            fill={c as string}
          />
          <path
            d={`M${(x as number) + 12} ${y} v24 M${(x as number) + 34} ${y} v24`}
            stroke="rgba(0,0,0,.25)"
            strokeWidth="2"
          />
        </g>
      ))}
      <text
        x="580"
        y="122"
        textAnchor="end"
        fontSize="11"
        fontWeight="800"
        fill="#0f172a"
      >
        RECYCLING PLANT
      </text>
    </>
  );
}

function NeighborhoodScene() {
  return (
    <>
      <rect width="600" height="130" fill="#cfe8f3" />
      <rect y="86" width="600" height="44" fill="#8fbc74" />
      <rect y="104" width="600" height="14" fill="#5d6168" />
      <path
        d="M0 111 H600"
        stroke="#f2c94c"
        strokeWidth="2"
        strokeDasharray="14 12"
      />
      {[
        [70, "#f4d6b0", "#9b4d3a"],
        [190, "#cfe3f2", "#355c7d"],
        [310, "#f6e3a6", "#7a5c2e"],
      ].map(([x, wall, roof]) => (
        <g key={x as number}>
          <rect
            x={x as number}
            y="58"
            width="70"
            height="40"
            fill={wall as string}
          />
          <path
            d={`M${(x as number) - 6} 60 L${(x as number) + 35} 32 L${(x as number) + 76} 60 Z`}
            fill={roof as string}
          />
          <rect
            x={(x as number) + 29}
            y="76"
            width="12"
            height="22"
            fill="#7c4a2d"
          />
          <rect
            x={(x as number) + 8}
            y="68"
            width="12"
            height="10"
            fill="#bfdbfe"
          />
          <rect
            x={(x as number) + 50}
            y="68"
            width="12"
            height="10"
            fill="#bfdbfe"
          />
        </g>
      ))}
      {[440, 520].map((x) => (
        <g key={x}>
          <rect x={x - 3} y="74" width="6" height="16" fill="#6b4f3a" />
          <circle cx={x} cy="64" r="18" fill="#2d6a4f" />
          <circle cx={x - 6} cy="58" r="8" fill="#40916c" />
        </g>
      ))}
      <text x="400" y="100" fontSize="16">
        🥤
      </text>
      <text x="560" y="98" fontSize="16">
        🍌
      </text>
    </>
  );
}

function BossScene({ shield = 1 }: { shield?: number }) {
  return (
    <>
      <rect
        width="600"
        height="130"
        fill={mixColor("#cfe8f3", "#a39274", shield)}
      />
      <rect y="100" width="600" height="30" fill="#7a6a52" />
      <g transform="translate(240 8) scale(0.55)">
        <MonsterBody shield={shield} mood="angry" />
      </g>
    </>
  );
}

export function SceneBanner({
  levelId,
  className = "",
}: {
  levelId: LevelId;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 600 130"
      preserveAspectRatio="xMidYMid slice"
      className={`block w-full ${className}`}
      aria-hidden
    >
      {levelId === "sorting" ? <SortingScene /> : null}
      {levelId === "compost" ? <CompostScene /> : null}
      {levelId === "recycling" ? <RecyclingScene /> : null}
      {levelId === "neighborhood" ? <NeighborhoodScene /> : null}
      {levelId === "boss" ? <BossScene /> : null}
    </svg>
  );
}

export function LevelThumb({
  levelId,
  locked,
}: {
  levelId: LevelId;
  locked: boolean;
}) {
  return (
    <div
      className={`relative h-20 w-32 shrink-0 overflow-hidden rounded-2xl ring-1 ring-forest-900/10 sm:h-24 sm:w-44 ${locked ? "grayscale" : ""}`}
    >
      <SceneBanner levelId={levelId} className="h-full" />
      {locked ? <div className="absolute inset-0 bg-white/50" /> : null}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Trash Monster                                                        */
/* ------------------------------------------------------------------ */

function hex(c: string) {
  const n = parseInt(c.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/** Blend from `a` (t = 0) to `b` (t = 1). */
export function mixColor(a: string, b: string, t: number) {
  const [r1, g1, b1] = hex(a);
  const [r2, g2, b2] = hex(b);
  const k = Math.max(0, Math.min(1, t));
  return `rgb(${Math.round(r1 + (r2 - r1) * k)}, ${Math.round(g1 + (g2 - g1) * k)}, ${Math.round(b1 + (b2 - b1) * k)})`;
}

export type MonsterMood = "angry" | "hurt" | "tired" | "defeated";

/** The monster itself, drawn in a 240 x 210 box. */
export function MonsterBody({
  shield,
  mood,
}: {
  shield: number;
  mood: MonsterMood;
}) {
  const body = mixColor("#a3b18a", "#3f5e3a", shield);
  const dark = mixColor("#6b7a5a", "#1f3a26", shield);
  const eyeY = mood === "defeated" ? 92 : 88;
  return (
    <g>
      <ellipse cx="120" cy="200" rx="92" ry="9" fill="rgba(0,0,0,.22)" />
      {/* shield ring */}
      {shield > 0.02 ? (
        <circle
          cx="120"
          cy="110"
          r="106"
          fill="none"
          stroke="#f59e0b"
          strokeWidth="5"
          strokeDasharray="18 10"
          strokeOpacity={0.25 + shield * 0.6}
          className="shield-spin"
          style={{ transformOrigin: "120px 110px" }}
        />
      ) : null}
      <path
        d="M30 190 C14 140 26 52 120 40 C214 52 226 140 210 190 Q196 200 182 188 Q168 203 152 189 Q136 203 120 190 Q104 203 88 189 Q72 203 58 188 Q44 200 30 190 Z"
        fill={body}
      />
      <path
        d="M58 70 C80 52 100 48 120 47"
        stroke="rgba(255,255,255,.25)"
        strokeWidth="8"
        strokeLinecap="round"
        fill="none"
      />
      {/* drips */}
      <path className="drip" d="M64 190 q4 14 0 20 q-4 -6 0 -20" fill={dark} />
      <path
        className="drip"
        style={{ animationDelay: "0.8s" }}
        d="M168 190 q4 12 0 18 q-4 -6 0 -18"
        fill={dark}
      />
      {/* blotches */}
      <circle cx="62" cy="140" r="10" fill={dark} opacity=".5" />
      <circle cx="182" cy="128" r="7" fill={dark} opacity=".5" />
      <circle cx="150" cy="166" r="8" fill={dark} opacity=".4" />
      {/* eyes */}
      {[92, 148].map((x, i) => (
        <g key={x}>
          <circle cx={x} cy={eyeY} r="20" fill="#fff" />
          {mood === "defeated" ? (
            <path
              d={`M${x - 9} ${eyeY - 9} l18 18 M${x + 9} ${eyeY - 9} l-18 18`}
              stroke="#1c1917"
              strokeWidth="5"
              strokeLinecap="round"
            />
          ) : (
            <g
              className="eye-blink"
              style={{ transformOrigin: `${x}px ${eyeY}px` }}
            >
              <circle
                cx={x + (i === 0 ? 4 : -4)}
                cy={eyeY + 3}
                r="9"
                fill="#1c1917"
              />
              <circle cx={x + (i === 0 ? 7 : -1)} cy={eyeY} r="3" fill="#fff" />
            </g>
          )}
        </g>
      ))}
      {/* brows */}
      {mood === "angry" ? (
        <path
          d="M68 62 L108 74 M172 62 L132 74"
          stroke={dark}
          strokeWidth="8"
          strokeLinecap="round"
        />
      ) : mood === "hurt" ? (
        <path
          d="M70 70 L108 62 M170 70 L132 62"
          stroke={dark}
          strokeWidth="8"
          strokeLinecap="round"
        />
      ) : mood === "tired" ? (
        <path
          d="M72 70 L108 70 M168 70 L132 70"
          stroke={dark}
          strokeWidth="7"
          strokeLinecap="round"
        />
      ) : null}
      {/* mouth */}
      {mood === "angry" ? (
        <g>
          <path d="M78 136 Q120 112 162 136 Q120 162 78 136 Z" fill="#3b0a0a" />
          <path
            d="M86 132 l8 9 l8 -11 l8 11 l8 -12 l8 12 l8 -11 l8 11 l8 -9"
            fill="#fff"
          />
        </g>
      ) : mood === "hurt" ? (
        <ellipse cx="120" cy="140" rx="20" ry="14" fill="#3b0a0a" />
      ) : mood === "tired" ? (
        <path
          d="M86 142 q12 -10 24 0 q12 10 24 0 q12 -10 24 0"
          stroke="#3b0a0a"
          strokeWidth="6"
          fill="none"
          strokeLinecap="round"
        />
      ) : (
        <path
          d="M90 146 q30 -18 60 0"
          stroke="#3b0a0a"
          strokeWidth="6"
          fill="none"
          strokeLinecap="round"
        />
      )}
      {/* smog puffs */}
      {shield > 0.05
        ? [
            [28, 40],
            [210, 34],
            [196, 4],
            [46, 10],
          ].map(([x, y], i) => (
            <circle
              key={i}
              className="smog"
              style={{ animationDelay: `${i * 0.7}s` }}
              cx={x}
              cy={y}
              r={12 + shield * 8}
              fill="#78716c"
              opacity={0.35 * shield}
            />
          ))
        : null}
    </g>
  );
}

export function MonsterArena({
  shield,
  mood,
  fxKey,
  fxClass,
  bits,
}: {
  shield: number;
  mood: MonsterMood;
  fxKey: number;
  fxClass: string;
  bits: ReactNode;
}) {
  const sky = `linear-gradient(180deg, ${mixColor("#bfe3f7", "#8f826a", shield)} 0%, ${mixColor("#e8f6ee", "#b6a585", shield)} 70%, ${mixColor("#7fb069", "#6b5a43", shield)} 70%)`;
  return (
    <div
      className="relative overflow-hidden rounded-3xl"
      style={{ background: sky }}
    >
      {shield < 0.5 ? (
        <div
          className="absolute right-6 top-4 h-10 w-10 rounded-full bg-amber-200"
          style={{ opacity: 1 - shield * 2 }}
          aria-hidden
        />
      ) : null}
      <div
        key={fxKey}
        className={`relative mx-auto w-[min(260px,72vw)] ${fxClass}`}
      >
        <svg
          viewBox="-10 -10 260 230"
          className="block w-full overflow-visible"
          aria-hidden
        >
          <MonsterBody shield={shield} mood={mood} />
        </svg>
        <div className="pointer-events-none absolute inset-0">{bits}</div>
      </div>
    </div>
  );
}
