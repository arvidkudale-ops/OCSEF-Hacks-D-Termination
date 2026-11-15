import { getItem } from "../data/items";
import { seeded } from "../lib/random";
import type { DisposalCategory } from "../types";
import { BIN_LOOKS } from "./art";

export const WORLD_W = 2400;
export const WORLD_H = 1500;

export interface PaintBin {
  id: string;
  category: DisposalCategory;
  x: number;
  y: number;
  label: string;
}

export interface PaintState {
  player: { x: number; y: number };
  facing: 1 | -1;
  moving: boolean;
  target: { x: number; y: number } | null;
  litters: {
    id: string;
    itemId: string;
    x: number;
    y: number;
    taken: boolean;
  }[];
  inventory: string[];
  nearItemId: string | null;
  nearBinId: string | null;
  time: number;
  effects: { x: number; y: number; text: string; color: string; age: number }[];
  cam: { x: number; y: number; w: number; h: number };
}

type Ctx = CanvasRenderingContext2D;

/* ---------- helpers ---------- */

function rr(ctx: Ctx, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function ellipse(
  ctx: Ctx,
  x: number,
  y: number,
  rx: number,
  ry: number,
  fill: string,
) {
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
}

function circle(ctx: Ctx, x: number, y: number, r: number, fill: string) {
  ellipse(ctx, x, y, r, r, fill);
}

function text(
  ctx: Ctx,
  value: string,
  x: number,
  y: number,
  font: string,
  fill: string,
  align: CanvasTextAlign = "center",
) {
  ctx.font = font;
  ctx.textAlign = align;
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = fill;
  ctx.fillText(value, x, y);
}

const patterns = new WeakMap<
  Ctx,
  { grass: CanvasPattern | null; park: CanvasPattern | null }
>();

function makeGrass(
  ctx: Ctx,
  base: string,
  light: string,
  dark: string,
  seed: string,
) {
  const tile = document.createElement("canvas");
  tile.width = tile.height = 128;
  const g = tile.getContext("2d");
  if (!g) return null;
  const rand = seeded(seed);
  g.fillStyle = base;
  g.fillRect(0, 0, 128, 128);
  for (let i = 0; i < 14; i += 1) {
    g.fillStyle = rand() > 0.5 ? light : dark;
    g.globalAlpha = 0.25;
    g.beginPath();
    g.ellipse(
      rand() * 128,
      rand() * 128,
      10 + rand() * 18,
      6 + rand() * 10,
      rand() * 3,
      0,
      Math.PI * 2,
    );
    g.fill();
  }
  g.globalAlpha = 1;
  g.lineWidth = 1.4;
  g.lineCap = "round";
  for (let i = 0; i < 120; i += 1) {
    const x = rand() * 128;
    const y = rand() * 128;
    g.strokeStyle = rand() > 0.5 ? light : dark;
    g.beginPath();
    g.moveTo(x, y);
    g.lineTo(x + (rand() - 0.5) * 4, y - 3 - rand() * 4);
    g.stroke();
  }
  return ctx.createPattern(tile, "repeat");
}

function pats(ctx: Ctx) {
  let found = patterns.get(ctx);
  if (!found) {
    found = {
      grass: makeGrass(ctx, "#8cbf6e", "#a3d184", "#74a65a", "grass"),
      park: makeGrass(ctx, "#9ccf7c", "#b5e095", "#82b766", "park"),
    };
    patterns.set(ctx, found);
  }
  return found;
}

/* ---------- scenery ---------- */

function tree(
  ctx: Ctx,
  x: number,
  y: number,
  r: number,
  t: number,
  reduce: boolean,
) {
  const sway = reduce ? 0 : Math.sin(t * 1.3 + x * 0.01) * 1.5;
  ellipse(ctx, x + 10, y + r * 0.9, r * 1.05, r * 0.38, "rgba(0,0,0,0.16)");
  ctx.fillStyle = "#6b4f3a";
  rr(ctx, x - 5, y + 4, 10, r * 0.9, 3);
  ctx.fill();
  circle(ctx, x + sway - r * 0.45, y - r * 0.05, r * 0.7, "#2d6a4f");
  circle(ctx, x + sway + r * 0.45, y - r * 0.05, r * 0.7, "#2d6a4f");
  circle(ctx, x + sway, y - r * 0.45, r * 0.78, "#357a5a");
  circle(ctx, x + sway - r * 0.2, y - r * 0.6, r * 0.42, "#40916c");
  circle(
    ctx,
    x + sway - r * 0.32,
    y - r * 0.72,
    r * 0.16,
    "rgba(255,255,255,0.18)",
  );
}

function bush(ctx: Ctx, x: number, y: number) {
  ellipse(ctx, x + 4, y + 10, 22, 6, "rgba(0,0,0,0.12)");
  circle(ctx, x - 10, y, 12, "#3f8a5c");
  circle(ctx, x + 10, y, 12, "#3f8a5c");
  circle(ctx, x, y - 6, 14, "#4fa06c");
}

function flowers(ctx: Ctx, x: number, y: number, seed: string) {
  const rand = seeded(seed);
  const colors = ["#f9a8d4", "#fde047", "#ffffff", "#c4b5fd", "#fb923c"];
  for (let i = 0; i < 9; i += 1) {
    const fx = x + (rand() - 0.5) * 50;
    const fy = y + (rand() - 0.5) * 26;
    circle(ctx, fx, fy, 3.2, colors[Math.floor(rand() * colors.length)]);
    circle(ctx, fx, fy, 1.2, "#a16207");
  }
}

function bench(ctx: Ctx, x: number, y: number) {
  ctx.fillStyle = "rgba(0,0,0,0.15)";
  ctx.fillRect(x - 28, y + 10, 60, 6);
  ctx.fillStyle = "#7c4a2d";
  ctx.fillRect(x - 30, y - 8, 60, 6);
  ctx.fillRect(x - 30, y + 1, 60, 6);
  ctx.fillStyle = "#3f3f46";
  ctx.fillRect(x - 26, y + 6, 4, 10);
  ctx.fillRect(x + 22, y + 6, 4, 10);
}

function sign(ctx: Ctx, label: string, x: number, y: number) {
  ctx.font = "800 18px Nunito, sans-serif";
  const w = ctx.measureText(label).width + 28;
  ctx.fillStyle = "#6b4f3a";
  ctx.fillRect(x - 3, y, 6, 30);
  ctx.fillStyle = "rgba(0,0,0,0.15)";
  rr(ctx, x - w / 2 + 3, y - 30, w, 32, 8);
  ctx.fill();
  ctx.fillStyle = "#fef3c7";
  rr(ctx, x - w / 2, y - 33, w, 32, 8);
  ctx.fill();
  ctx.strokeStyle = "#92400e";
  ctx.lineWidth = 3;
  ctx.stroke();
  text(ctx, label, x, y - 11, "800 18px Nunito, sans-serif", "#1b4332");
}

function roads(ctx: Ctx) {
  // sidewalks
  ctx.fillStyle = "#d9d3c7";
  ctx.fillRect(0, 662, WORLD_W, 166);
  ctx.fillRect(842, 0, 156, WORLD_H);
  ctx.strokeStyle = "rgba(0,0,0,0.07)";
  ctx.lineWidth = 2;
  for (let x = 0; x < WORLD_W; x += 40) {
    ctx.beginPath();
    ctx.moveTo(x, 662);
    ctx.lineTo(x, 680);
    ctx.moveTo(x, 810);
    ctx.lineTo(x, 828);
    ctx.stroke();
  }
  for (let y = 0; y < WORLD_H; y += 40) {
    ctx.beginPath();
    ctx.moveTo(842, y);
    ctx.lineTo(860, y);
    ctx.moveTo(980, y);
    ctx.lineTo(998, y);
    ctx.stroke();
  }
  // asphalt
  ctx.fillStyle = "#5b5f66";
  ctx.fillRect(0, 680, WORLD_W, 130);
  ctx.fillRect(860, 0, 120, WORLD_H);
  // curbs
  ctx.fillStyle = "#9ca3af";
  ctx.fillRect(0, 678, 860, 3);
  ctx.fillRect(980, 678, WORLD_W, 3);
  ctx.fillRect(0, 809, 860, 3);
  ctx.fillRect(980, 809, WORLD_W, 3);
  ctx.fillRect(858, 0, 3, 680);
  ctx.fillRect(979, 0, 3, 680);
  ctx.fillRect(858, 810, 3, WORLD_H);
  ctx.fillRect(979, 810, 3, WORLD_H);
  // lane dashes
  ctx.fillStyle = "#f2c94c";
  for (let x = 10; x < WORLD_W; x += 64)
    if (x + 32 < 820 || x > 1020) ctx.fillRect(x, 743, 32, 4);
  for (let y = 10; y < WORLD_H; y += 64)
    if (y + 32 < 640 || y > 850) ctx.fillRect(918, y, 4, 32);
  // crosswalks
  ctx.fillStyle = "rgba(255,255,255,0.85)";
  for (let y = 690; y < 800; y += 18) ctx.fillRect(812, y, 40, 10);
  for (let y = 690; y < 800; y += 18) ctx.fillRect(988, y, 40, 10);
  for (let x = 870; x < 975; x += 18) ctx.fillRect(x, 632, 10, 40);
  for (let x = 870; x < 975; x += 18) ctx.fillRect(x, 818, 10, 40);
}

function park(ctx: Ctx, t: number, reduce: boolean) {
  const p = pats(ctx);
  ctx.fillStyle = p.park ?? "#9ccf7c";
  rr(ctx, 40, 40, 780, 560, 36);
  ctx.fill();
  ctx.strokeStyle = "#4d8b47";
  ctx.lineWidth = 12;
  ctx.stroke();
  // path
  ctx.strokeStyle = "#e8d6ad";
  ctx.lineWidth = 28;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(70, 590);
  ctx.bezierCurveTo(260, 420, 300, 140, 800, 80);
  ctx.stroke();
  ctx.strokeStyle = "rgba(0,0,0,0.06)";
  ctx.lineWidth = 2;
  ctx.stroke();
  // pond
  ellipse(ctx, 430, 304, 78, 50, "#c9b98f");
  ellipse(ctx, 430, 300, 72, 45, "#5aa5d0");
  ellipse(ctx, 418, 292, 50, 28, "#7cc0e3");
  const ripple = reduce ? 0.5 : (t * 0.6) % 1;
  ctx.strokeStyle = `rgba(255,255,255,${0.6 * (1 - ripple)})`;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(450, 310, 10 + ripple * 26, 5 + ripple * 12, 0, 0, Math.PI * 2);
  ctx.stroke();
  // lily pads and reeds
  ellipse(ctx, 392, 318, 9, 6, "#3f8a5c");
  ellipse(ctx, 470, 286, 7, 5, "#3f8a5c");
  ctx.strokeStyle = "#4d7c3a";
  ctx.lineWidth = 3;
  for (const [rx, ry] of [
    [360, 280],
    [366, 274],
    [372, 284],
    [495, 320],
    [500, 312],
  ]) {
    ctx.beginPath();
    ctx.moveTo(rx, ry + 14);
    ctx.lineTo(rx + (reduce ? 0 : Math.sin(t * 2 + rx) * 2), ry);
    ctx.stroke();
  }
  bench(ctx, 250, 420);
  bench(ctx, 640, 530);
  flowers(ctx, 120, 300, "f1");
  flowers(ctx, 700, 330, "f2");
  flowers(ctx, 300, 560, "f3");
  bush(ctx, 560, 120);
  bush(ctx, 90, 420);
  sign(ctx, "Park", 160, 110);
}

function cafe(ctx: Ctx) {
  // patio
  ctx.fillStyle = "#eadcc4";
  ctx.fillRect(1060, 170, 360, 140);
  ctx.strokeStyle = "rgba(0,0,0,0.06)";
  ctx.lineWidth = 2;
  for (let x = 1060; x <= 1420; x += 30) {
    ctx.beginPath();
    ctx.moveTo(x, 170);
    ctx.lineTo(x, 310);
    ctx.stroke();
  }
  for (let y = 170; y <= 310; y += 30) {
    ctx.beginPath();
    ctx.moveTo(1060, y);
    ctx.lineTo(1420, y);
    ctx.stroke();
  }
  // building
  ctx.fillStyle = "rgba(0,0,0,0.14)";
  ctx.fillRect(1068, 66, 360, 112);
  ctx.fillStyle = "#f6e9d6";
  ctx.fillRect(1060, 58, 360, 112);
  ctx.fillStyle = "#8b3a3a";
  ctx.fillRect(1060, 50, 360, 26);
  text(ctx, "CAFE", 1240, 70, "900 20px Nunito, sans-serif", "#fef3c7");
  for (const wx of [1085, 1165, 1315]) {
    ctx.fillStyle = "#7c4a2d";
    ctx.fillRect(wx - 3, 88, 66, 50);
    ctx.fillStyle = "#bfe0f2";
    ctx.fillRect(wx, 91, 60, 44);
    ctx.fillStyle = "rgba(255,255,255,0.5)";
    ctx.fillRect(wx + 6, 95, 10, 36);
  }
  ctx.fillStyle = "#7c4a2d";
  ctx.fillRect(1250, 100, 44, 70);
  circle(ctx, 1286, 138, 3, "#fde68a");
  // awning
  for (let i = 0; i < 12; i += 1) {
    ctx.fillStyle = i % 2 ? "#fff7ed" : "#dc2626";
    const ax = 1060 + i * 30;
    ctx.beginPath();
    ctx.moveTo(ax, 160);
    ctx.lineTo(ax + 30, 160);
    ctx.lineTo(ax + 30, 176);
    ctx.quadraticCurveTo(ax + 15, 186, ax, 176);
    ctx.closePath();
    ctx.fill();
  }
  // tables with umbrellas
  for (const [tx, ty] of [
    [1100, 262],
    [1250, 270],
    [1385, 228],
  ]) {
    ellipse(ctx, tx + 6, ty + 18, 26, 8, "rgba(0,0,0,0.15)");
    for (let s = 0; s < 8; s += 1) {
      ctx.fillStyle = s % 2 ? "#fff7ed" : "#16a34a";
      ctx.beginPath();
      ctx.moveTo(tx, ty);
      ctx.arc(tx, ty, 24, (s * Math.PI) / 4, ((s + 1) * Math.PI) / 4);
      ctx.closePath();
      ctx.fill();
    }
    circle(ctx, tx, ty, 3, "#3f3f46");
  }
}

function school(ctx: Ctx, t: number, reduce: boolean) {
  // yard
  ctx.fillStyle = "#676c73";
  rr(ctx, 1620, 140, 560, 240, 14);
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.8)";
  ctx.lineWidth = 3;
  ctx.strokeRect(1860, 180, 280, 170);
  ctx.beginPath();
  ctx.moveTo(2000, 180);
  ctx.lineTo(2000, 350);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(2000, 265, 30, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = "#facc15";
  for (let i = 0; i < 6; i += 1) {
    ctx.strokeStyle = "#facc15";
    ctx.strokeRect(1660 + (i % 2) * 34, 300 - Math.floor(i / 2) * 34, 30, 30);
  }
  text(ctx, "1", 1675, 322, "800 16px Nunito, sans-serif", "#facc15");
  // building
  ctx.fillStyle = "rgba(0,0,0,0.14)";
  ctx.fillRect(1628, 38, 560, 112);
  ctx.fillStyle = "#c56a46";
  ctx.fillRect(1620, 30, 560, 112);
  ctx.strokeStyle = "rgba(255,255,255,0.12)";
  ctx.lineWidth = 1;
  for (let y = 36; y < 142; y += 9) {
    ctx.beginPath();
    ctx.moveTo(1620, y);
    ctx.lineTo(2180, y);
    ctx.stroke();
  }
  ctx.fillStyle = "#24543f";
  ctx.fillRect(1610, 22, 580, 16);
  for (let i = 0; i < 9; i += 1) {
    const wx = 1640 + i * 60;
    if (wx > 1870 && wx < 1930) continue;
    ctx.fillStyle = "#fef3c7";
    ctx.fillRect(wx, 56, 34, 28);
    ctx.fillStyle = "#bfe0f2";
    ctx.fillRect(wx + 3, 59, 28, 22);
  }
  ctx.fillStyle = "#7c4a2d";
  ctx.fillRect(1878, 90, 44, 52);
  circle(ctx, 1900, 64, 16, "#fef3c7");
  ctx.strokeStyle = "#1c1917";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(1900, 64);
  ctx.lineTo(1900, 54);
  ctx.moveTo(1900, 64);
  ctx.lineTo(1908, 68);
  ctx.stroke();
  text(ctx, "SCHOOL", 1900, 134, "900 14px Nunito, sans-serif", "#fef3c7");
  // flag
  ctx.fillStyle = "#9ca3af";
  ctx.fillRect(2205, 40, 5, 110);
  const wave = reduce ? 0 : Math.sin(t * 4) * 4;
  ctx.fillStyle = "#2d6a4f";
  ctx.beginPath();
  ctx.moveTo(2210, 44);
  ctx.quadraticCurveTo(2232, 44 + wave, 2254, 50);
  ctx.lineTo(2254, 76);
  ctx.quadraticCurveTo(2232, 70 + wave, 2210, 72);
  ctx.closePath();
  ctx.fill();
  text(ctx, "♻", 2232, 66, "700 16px Nunito, sans-serif", "#fff");
}

export const HOUSES: [number, number, string, string][] = [
  [90, 170, "#f4d6b0", "#9b4d3a"],
  [300, 160, "#cfe3f2", "#355c7d"],
  [500, 180, "#f6e3a6", "#7a5c2e"],
];

export interface Solid {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** Building walls. Gaps between the houses stay open so the street is still a path. */
export const SOLIDS: Solid[] = [
  { x: 90, y: 836, w: 170, h: 154 },
  { x: 300, y: 836, w: 160, h: 154 },
  { x: 500, y: 836, w: 180, h: 154 },
  { x: 1060, y: 48, w: 360, h: 120 },
  { x: 1620, y: 22, w: 560, h: 116 },
];

function homes(ctx: Ctx) {
  for (const [x, w, wall, roof] of HOUSES) {
    const y = 880;
    const h = 110;
    // walkway to the sidewalk
    ctx.fillStyle = "#d9d3c7";
    ctx.fillRect(x + w / 2 - 12, 828, 24, 52);
    ctx.fillStyle = "rgba(0,0,0,0.14)";
    ctx.fillRect(x + 8, y + 8, w, h);
    ctx.fillStyle = wall;
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = roof;
    ctx.beginPath();
    ctx.moveTo(x - 12, y + 4);
    ctx.lineTo(x + w / 2, y - 44);
    ctx.lineTo(x + w + 12, y + 4);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = "rgba(0,0,0,0.15)";
    ctx.lineWidth = 2;
    for (let i = 1; i < 4; i += 1) {
      ctx.beginPath();
      ctx.moveTo(x - 12 + i * 12, y + 4 - i * 12);
      ctx.lineTo(x + w + 12 - i * 12, y + 4 - i * 12);
      ctx.stroke();
    }
    ctx.fillStyle = "#7a3e2e";
    ctx.fillRect(x + w - 40, y - 40, 16, 30);
    // door + windows
    ctx.fillStyle = "#7c4a2d";
    rr(ctx, x + w / 2 - 14, y + h - 50, 28, 50, 6);
    ctx.fill();
    circle(ctx, x + w / 2 + 7, y + h - 24, 2.5, "#fde68a");
    for (const wx of [x + 16, x + w - 50]) {
      ctx.fillStyle = "#fff";
      ctx.fillRect(wx - 3, y + 22, 40, 34);
      ctx.fillStyle = "#bfe0f2";
      ctx.fillRect(wx, y + 25, 34, 28);
      ctx.fillStyle = "#fff";
      ctx.fillRect(wx + 16, y + 25, 2, 28);
      ctx.fillRect(wx, y + 38, 34, 2);
    }
  }
  // picket fence
  ctx.fillStyle = "#fafaf9";
  for (let x = 60; x < 730; x += 14) {
    const gap = HOUSES.some(
      ([hx, hw]) => x > hx + hw / 2 - 26 && x < hx + hw / 2 + 18,
    );
    if (gap) continue;
    ctx.beginPath();
    ctx.moveTo(x, 1032);
    ctx.lineTo(x + 4, 1024);
    ctx.lineTo(x + 8, 1032);
    ctx.lineTo(x + 8, 1050);
    ctx.lineTo(x, 1050);
    ctx.closePath();
    ctx.fill();
  }
  ctx.fillRect(60, 1036, 670, 4);
  // mailbox
  ctx.fillStyle = "#6b4f3a";
  ctx.fillRect(742, 1010, 5, 30);
  ctx.fillStyle = "#2563eb";
  rr(ctx, 732, 998, 26, 16, 6);
  ctx.fill();
  flowers(ctx, 160, 1010, "h1");
  flowers(ctx, 600, 1012, "h2");
  sign(ctx, "Homes", 790, 880);
}

function wheelieBin(
  ctx: Ctx,
  bin: PaintBin,
  near: boolean,
  t: number,
  reduce: boolean,
) {
  const look = BIN_LOOKS[bin.category] ?? BIN_LOOKS.trash;
  const { x, y } = bin;
  if (near) {
    const pulse = reduce ? 0.5 : (Math.sin(t * 5) + 1) / 2;
    ellipse(
      ctx,
      x,
      y + 34,
      54 + pulse * 6,
      16 + pulse * 2,
      `rgba(245,158,11,${0.25 + pulse * 0.2})`,
    );
  }
  ellipse(ctx, x + 4, y + 36, 40, 9, "rgba(0,0,0,0.2)");
  // body
  ctx.fillStyle = look.body;
  ctx.beginPath();
  ctx.moveTo(x - 34, y - 36);
  ctx.lineTo(x + 34, y - 36);
  ctx.lineTo(x + 28, y + 30);
  ctx.lineTo(x - 28, y + 30);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "rgba(255,255,255,0.14)";
  ctx.fillRect(x - 33, y - 34, 66, 12);
  ctx.strokeStyle = "rgba(0,0,0,0.12)";
  ctx.lineWidth = 3;
  for (const dx of [-16, 0, 16]) {
    ctx.beginPath();
    ctx.moveTo(x + dx, y - 16);
    ctx.lineTo(x + dx * 0.9, y + 22);
    ctx.stroke();
  }
  // wheels
  circle(ctx, x - 22, y + 32, 7, "#1c1917");
  circle(ctx, x + 22, y + 32, 7, "#1c1917");
  // lid (lifts when you are close)
  ctx.save();
  ctx.translate(x - 38, y - 38);
  ctx.rotate(near ? -0.35 : 0);
  ctx.fillStyle = look.lid;
  rr(ctx, 0, -12, 76, 14, 4);
  ctx.fill();
  rr(ctx, 28, -18, 20, 8, 3);
  ctx.fill();
  ctx.restore();
  // emblem
  circle(ctx, x, y - 4, 17, "rgba(255,255,255,0.92)");
  ctx.font = "20px Nunito, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#000";
  ctx.fillText(look.symbol, x, y - 3);
  ctx.textBaseline = "alphabetic";
  // label plate
  ctx.fillStyle = "#1b4332";
  rr(ctx, x - 40, y + 46, 80, 24, 8);
  ctx.fill();
  text(ctx, bin.label, x, y + 63, "800 14px Nunito, sans-serif", "#fff");
}

function truck(ctx: Ctx, x: number, y: number) {
  ellipse(ctx, x + 10, y + 46, 100, 12, "rgba(0,0,0,0.18)");
  ctx.fillStyle = "#1e40af";
  rr(ctx, x - 90, y - 30, 130, 70, 10);
  ctx.fill();
  ctx.fillStyle = "#2563eb";
  rr(ctx, x + 40, y - 6, 56, 46, 10);
  ctx.fill();
  ctx.fillStyle = "#bfe0f2";
  rr(ctx, x + 56, y, 32, 18, 4);
  ctx.fill();
  text(ctx, "♻", x - 25, y + 16, "900 34px Nunito, sans-serif", "#fff");
  for (const wx of [x - 60, x + 10, x + 70]) {
    circle(ctx, wx, y + 42, 13, "#1c1917");
    circle(ctx, wx, y + 42, 5, "#9ca3af");
  }
}

function depot(ctx: Ctx) {
  ctx.fillStyle = "#cdd3d1";
  rr(ctx, 1580, 980, 760, 420, 24);
  ctx.fill();
  // hazard stripe
  ctx.save();
  rr(ctx, 1580, 980, 760, 16, 8);
  ctx.clip();
  for (let x = 1560; x < 2360; x += 28) {
    ctx.fillStyle = "#facc15";
    ctx.beginPath();
    ctx.moveTo(x, 996);
    ctx.lineTo(x + 14, 980);
    ctx.lineTo(x + 28, 980);
    ctx.lineTo(x + 14, 996);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
  // parking lines
  ctx.strokeStyle = "rgba(255,255,255,0.8)";
  ctx.lineWidth = 3;
  for (const x of [1680, 1860, 2060, 2260]) {
    ctx.beginPath();
    ctx.moveTo(x, 1250);
    ctx.lineTo(x, 1330);
    ctx.stroke();
  }
  // shelter
  ctx.fillStyle = "rgba(0,0,0,0.12)";
  ctx.fillRect(1672, 1094, 584, 28);
  ctx.fillStyle = "#24543f";
  ctx.fillRect(1664, 1082, 584, 26);
  ctx.fillStyle = "#1b4332";
  ctx.fillRect(1664, 1104, 584, 6);
  for (const px of [1672, 2236]) {
    ctx.fillStyle = "#3f3f46";
    ctx.fillRect(px, 1108, 6, 110);
  }
  sign(ctx, "Sorting depot", 1960, 1060);
  truck(ctx, 2200, 1330);
}

function cloudShadows(ctx: Ctx, t: number) {
  ctx.fillStyle = "rgba(20,40,30,0.06)";
  for (let i = 0; i < 3; i += 1) {
    const x = ((t * 18 + i * 900) % (WORLD_W + 600)) - 300;
    const y = 250 + i * 420;
    ctx.beginPath();
    ctx.ellipse(x, y, 220, 90, 0, 0, Math.PI * 2);
    ctx.ellipse(x + 140, y + 30, 150, 70, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

export const TREES: [number, number, number][] = [
  [130, 170, 34],
  [700, 200, 30],
  [180, 520, 32],
  [1500, 160, 34],
  [2310, 210, 36],
  [240, 1380, 34],
  [1040, 420, 28],
  [1480, 400, 26],
  [2320, 560, 30],
  [690, 1460, 30],
  [1460, 1310, 32],
  [1180, 1430, 30],
  [2350, 900, 28],
  [1100, 960, 30],
  [60, 1240, 30],
];

/* ---------- characters and items ---------- */

function sparkle(ctx: Ctx, x: number, y: number, size: number, alpha: number) {
  ctx.fillStyle = `rgba(255,255,255,${alpha})`;
  ctx.beginPath();
  ctx.moveTo(x, y - size);
  ctx.lineTo(x + size * 0.3, y - size * 0.3);
  ctx.lineTo(x + size, y);
  ctx.lineTo(x + size * 0.3, y + size * 0.3);
  ctx.lineTo(x, y + size);
  ctx.lineTo(x - size * 0.3, y + size * 0.3);
  ctx.lineTo(x - size, y);
  ctx.lineTo(x - size * 0.3, y - size * 0.3);
  ctx.closePath();
  ctx.fill();
}

/** Some browsers apply fillStyle alpha to color emoji, so always draw them opaque. */
function emoji(ctx: Ctx, glyph: string, x: number, y: number, size: number) {
  ctx.fillStyle = "#000";
  ctx.font = `${size}px Nunito, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.fillText(glyph, x, y);
}

function litter(
  ctx: Ctx,
  s: PaintState,
  reduce: boolean,
  entry: PaintState["litters"][number],
) {
  {
    const item = getItem(entry.itemId);
    const near = s.nearItemId === entry.id;
    const bob = reduce ? 0 : Math.sin(s.time * 3 + entry.x) * 3;
    ellipse(ctx, entry.x, entry.y + 10, 16 - bob, 5, "rgba(0,0,0,0.2)");
    if (near) {
      ctx.strokeStyle = "#fff";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.ellipse(entry.x, entry.y + 8, 26, 9, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
    emoji(ctx, item?.emoji ?? "•", entry.x, entry.y + bob, 30);
    if (!reduce) {
      const phase = (s.time * 1.5 + entry.x * 0.013) % 2;
      if (phase < 1)
        sparkle(
          ctx,
          entry.x + 14,
          entry.y - 22 + bob,
          6,
          Math.sin(phase * Math.PI) * 0.95,
        );
    }
    if (near) {
      ctx.fillStyle = "#1b4332";
      rr(ctx, entry.x - 14, entry.y - 58, 28, 24, 7);
      ctx.fill();
      text(
        ctx,
        "E",
        entry.x,
        entry.y - 40,
        "900 15px Nunito, sans-serif",
        "#fff",
      );
    }
  }
}

function player(ctx: Ctx, s: PaintState, reduce: boolean) {
  const { x, y } = s.player;
  const f = s.facing;
  const walk = s.moving && !reduce ? Math.sin(s.time * 12) : 0;
  const bob = reduce
    ? 0
    : s.moving
      ? Math.abs(Math.sin(s.time * 12)) * -2
      : Math.sin(s.time * 3) * 1;
  ellipse(ctx, x, y + 20, 15, 5, "rgba(0,0,0,0.22)");
  // legs
  ctx.lineCap = "round";
  ctx.lineWidth = 6;
  ctx.strokeStyle = "#334155";
  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(x + side * 4, y + 4 + bob);
    ctx.lineTo(x + side * 4 + walk * side * 5, y + 17);
    ctx.stroke();
  }
  ctx.fillStyle = "#1c1917";
  for (const side of [-1, 1])
    ellipse(
      ctx,
      x + side * 4 + walk * side * 5 + f * 2,
      y + 18,
      4.5,
      2.6,
      "#1c1917",
    );
  // backpack
  ctx.fillStyle = "#e9b949";
  rr(ctx, x - f * 15 - 6, y - 16 + bob, 12, 18, 4);
  ctx.fill();
  // body
  ctx.fillStyle = "#2d6a4f";
  rr(ctx, x - 11, y - 18 + bob, 22, 24, 8);
  ctx.fill();
  ctx.fillStyle = "rgba(255,255,255,0.85)";
  ctx.font = "700 10px Nunito, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("♻", x + f * 2, y - 2 + bob);
  // arms
  ctx.strokeStyle = "#f3d5b5";
  ctx.lineWidth = 5;
  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(x + side * 11, y - 12 + bob);
    ctx.lineTo(x + side * 13 - walk * side * 5, y + 1 + bob);
    ctx.stroke();
  }
  // head
  circle(ctx, x, y - 28 + bob, 10, "#f3d5b5");
  // cap with brim facing forward
  ctx.fillStyle = "#1b4332";
  ctx.beginPath();
  ctx.arc(x, y - 30 + bob, 10.5, Math.PI, 0);
  ctx.fill();
  ctx.fillRect(f > 0 ? x : x - 16, y - 32 + bob, 16, 4);
  circle(ctx, x - f * 3, y - 40 + bob, 2.5, "#52b788");
  // face
  ctx.fillStyle = "#1c1917";
  ctx.fillRect(x + f * 4 - 1, y - 27 + bob, 2.2, 2.6);
  ctx.fillRect(x - 1, y - 27 + bob, 2.2, 2.6);
  ctx.strokeStyle = "#9a3412";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(x + f * 2, y - 23 + bob, 2.5, 0.2, Math.PI - 0.2);
  ctx.stroke();
  // carried items in a bubble
  if (s.inventory.length > 0) {
    const bw = s.inventory.length * 22 + 10;
    ctx.fillStyle = "rgba(255,255,255,0.92)";
    rr(ctx, x - bw / 2, y - 76 + bob, bw, 28, 12);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(x - 5, y - 48 + bob);
    ctx.lineTo(x + 5, y - 48 + bob);
    ctx.lineTo(x, y - 42 + bob);
    ctx.fill();
    s.inventory.forEach((id, index) => {
      const carried = s.litters.find((entry) => entry.id === id);
      const item = carried ? getItem(carried.itemId) : undefined;
      ctx.font = "17px Nunito, sans-serif";
      ctx.textAlign = "center";
      emoji(
        ctx,
        item?.emoji ?? "•",
        x - bw / 2 + 16 + index * 22,
        y - 56 + bob,
        17,
      );
    });
  }
}

function targetMarker(ctx: Ctx, s: PaintState, reduce: boolean) {
  if (!s.target) return;
  const pulse = reduce ? 0.5 : (s.time * 2) % 1;
  ctx.strokeStyle = `rgba(245,158,11,${1 - pulse})`;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.ellipse(
    s.target.x,
    s.target.y + 10,
    10 + pulse * 14,
    4 + pulse * 5,
    0,
    0,
    Math.PI * 2,
  );
  ctx.stroke();
  // dotted trail
  ctx.setLineDash([2, 10]);
  ctx.strokeStyle = "rgba(255,255,255,0.7)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(s.player.x, s.player.y + 16);
  ctx.lineTo(s.target.x, s.target.y + 10);
  ctx.stroke();
  ctx.setLineDash([]);
}

function minimap(
  ctx: Ctx,
  s: PaintState,
  bins: PaintBin[],
  mx: number,
  my: number,
  w: number,
) {
  const scale = w / WORLD_W;
  const h = WORLD_H * scale;
  ctx.fillStyle = "rgba(255,255,255,0.88)";
  rr(ctx, mx - 4, my - 4, w + 8, h + 8, 10);
  ctx.fill();
  ctx.fillStyle = "#9ccf7c";
  ctx.fillRect(mx, my, w, h);
  ctx.fillStyle = "#6b7280";
  ctx.fillRect(mx, my + 680 * scale, w, 130 * scale);
  ctx.fillRect(mx + 860 * scale, my, 120 * scale, h);
  ctx.fillStyle = "#5aa5d0";
  ctx.fillRect(mx + 380 * scale, my + 270 * scale, 100 * scale, 60 * scale);
  ctx.fillStyle = "#cdd3d1";
  ctx.fillRect(mx + 1580 * scale, my + 980 * scale, 760 * scale, 420 * scale);
  for (const bin of bins)
    circle(
      ctx,
      mx + bin.x * scale,
      my + bin.y * scale,
      2.5,
      (BIN_LOOKS[bin.category] ?? BIN_LOOKS.trash).body,
    );
  for (const entry of s.litters)
    if (!entry.taken)
      circle(ctx, mx + entry.x * scale, my + entry.y * scale, 2.6, "#f97316");
  circle(ctx, mx + s.player.x * scale, my + s.player.y * scale, 3.6, "#fff");
  circle(ctx, mx + s.player.x * scale, my + s.player.y * scale, 2.4, "#1b4332");
  if (s.cam.w <= 0) return;
  ctx.strokeStyle = "rgba(27,67,50,0.8)";
  ctx.lineWidth = 1.5;
  ctx.strokeRect(
    mx + s.cam.x * scale,
    my + s.cam.y * scale,
    s.cam.w * scale,
    s.cam.h * scale,
  );
}

/* ---------- main ---------- */

export function paintNeighborhood(
  ctx: Ctx,
  canvas: HTMLCanvasElement,
  s: PaintState,
  bins: PaintBin[],
) {
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const cssW = Math.max(1, canvas.clientWidth);
  const cssH = Math.max(1, canvas.clientHeight);
  const pixelW = Math.floor(cssW * dpr);
  const pixelH = Math.floor(cssH * dpr);
  if (canvas.width !== pixelW || canvas.height !== pixelH) {
    canvas.width = pixelW;
    canvas.height = pixelH;
  }
  const camX = Math.min(
    Math.max(0, s.player.x - cssW / 2),
    Math.max(0, WORLD_W - cssW),
  );
  const camY = Math.min(
    Math.max(0, s.player.y - cssH / 2),
    Math.max(0, WORLD_H - cssH),
  );
  s.cam = { x: camX, y: camY, w: cssW, h: cssH };
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, cssW, cssH);
  ctx.save();
  ctx.translate(-camX, -camY);

  const p = pats(ctx);
  ctx.fillStyle = p.grass ?? "#8cbf6e";
  ctx.fillRect(0, 0, WORLD_W, WORLD_H);

  roads(ctx);
  park(ctx, s.time, reduce);
  cafe(ctx);
  school(ctx, s.time, reduce);
  homes(ctx);
  depot(ctx);
  bush(ctx, 1560, 640);
  bush(ctx, 1020, 1200);
  bush(ctx, 2330, 1440);
  flowers(ctx, 1400, 620, "g1");
  flowers(ctx, 2100, 560, "g2");

  // depth-sort trees, bins, litter, and the player by their feet
  const drawables: { y: number; draw: () => void }[] = [];
  for (const [tx, ty, tr] of TREES)
    drawables.push({
      y: ty + tr * 0.9,
      draw: () => tree(ctx, tx, ty, tr, s.time, reduce),
    });
  for (const bin of bins)
    drawables.push({
      y: bin.y + 30,
      draw: () => wheelieBin(ctx, bin, s.nearBinId === bin.id, s.time, reduce),
    });
  for (const entry of s.litters)
    if (!entry.taken)
      drawables.push({
        y: entry.y + 10,
        draw: () => litter(ctx, s, reduce, entry),
      });
  drawables.push({ y: -0.5, draw: () => targetMarker(ctx, s, reduce) });
  drawables.push({ y: s.player.y + 20, draw: () => player(ctx, s, reduce) });
  drawables.sort((a, b) => a.y - b.y);
  for (const entry of drawables) entry.draw();

  if (!reduce) cloudShadows(ctx, s.time);

  for (const effect of s.effects) {
    const rise = reduce ? 0 : effect.age * 44;
    ctx.globalAlpha = Math.max(0, 1 - effect.age / 1.1);
    ctx.font = "900 26px Nunito, sans-serif";
    ctx.textAlign = "center";
    ctx.lineWidth = 5;
    ctx.strokeStyle = "#fff";
    ctx.strokeText(effect.text, effect.x, effect.y - rise);
    ctx.fillStyle = effect.color;
    ctx.fillText(effect.text, effect.x, effect.y - rise);
  }
  ctx.globalAlpha = 1;
  ctx.restore();

  const mapW = Math.min(170, cssW * 0.28);
  minimap(ctx, s, bins, cssW - mapW - 10, 10, mapW);
}

/** Draws only the map onto its own small canvas. The 3D view lays it over the scene. */
export function paintMinimap(
  canvas: HTMLCanvasElement,
  s: PaintState,
  bins: PaintBin[],
) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const w = Math.max(40, canvas.clientWidth - 8);
  const h = (WORLD_H / WORLD_W) * w;
  const pixelW = Math.floor((w + 8) * dpr);
  const pixelH = Math.floor((h + 8) * dpr);
  if (canvas.width !== pixelW || canvas.height !== pixelH) {
    canvas.width = pixelW;
    canvas.height = pixelH;
  }
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, w + 8, h + 8);
  minimap(ctx, s, bins, 4, 4, w);
}

/**
 * Everything that lies flat: grass, roads, the park lawn, patio, school yard,
 * and depot pad. The 3D view uses this as the ground texture and builds the
 * upright things as real shapes.
 */
export function paintGround(ctx: Ctx) {
  const p = pats(ctx);
  ctx.fillStyle = p.grass ?? "#8cbf6e";
  ctx.fillRect(0, 0, WORLD_W, WORLD_H);
  roads(ctx);

  // park lawn, path, and the pond bank
  ctx.fillStyle = p.park ?? "#9ccf7c";
  rr(ctx, 40, 40, 780, 560, 36);
  ctx.fill();
  ctx.strokeStyle = "#6fa75a";
  ctx.lineWidth = 10;
  ctx.stroke();
  ctx.strokeStyle = "#e8d6ad";
  ctx.lineWidth = 30;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(70, 590);
  ctx.bezierCurveTo(260, 420, 300, 140, 800, 80);
  ctx.stroke();
  ctx.lineCap = "butt";
  ellipse(ctx, 430, 300, 86, 58, "#c9b98f");
  const beds: [number, number, string][] = [
    [120, 300, "f1"],
    [700, 330, "f2"],
    [300, 560, "f3"],
    [1400, 620, "g1"],
    [2100, 560, "g2"],
    [160, 1090, "h1"],
    [600, 1092, "h2"],
    [1250, 1250, "g3"],
    [640, 1300, "g4"],
  ];
  for (const [fx, fy, seed] of beds) flowers(ctx, fx, fy, seed);

  // cafe patio
  ctx.fillStyle = "#eadcc4";
  ctx.fillRect(1040, 168, 400, 150);
  ctx.strokeStyle = "rgba(0,0,0,0.07)";
  ctx.lineWidth = 2;
  for (let x = 1040; x <= 1440; x += 30) {
    ctx.beginPath();
    ctx.moveTo(x, 168);
    ctx.lineTo(x, 318);
    ctx.stroke();
  }
  for (let y = 168; y <= 318; y += 30) {
    ctx.beginPath();
    ctx.moveTo(1040, y);
    ctx.lineTo(1440, y);
    ctx.stroke();
  }

  // school yard with a court
  ctx.fillStyle = "#676c73";
  rr(ctx, 1620, 140, 560, 240, 14);
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.8)";
  ctx.lineWidth = 3;
  ctx.strokeRect(1860, 180, 280, 170);
  ctx.beginPath();
  ctx.moveTo(2000, 180);
  ctx.lineTo(2000, 350);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(2000, 265, 30, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = "#facc15";
  for (let i = 0; i < 6; i += 1)
    ctx.strokeRect(1660 + (i % 2) * 34, 300 - Math.floor(i / 2) * 34, 30, 30);

  // front paths for the homes
  ctx.fillStyle = "#d9d3c7";
  ctx.fillRect(150, 1022, 692, 26);
  for (const [hx, hw] of HOUSES) ctx.fillRect(hx + hw / 2 - 13, 990, 26, 34);

  // depot pad
  ctx.fillStyle = "#cdd3d1";
  rr(ctx, 1580, 980, 760, 420, 24);
  ctx.fill();
  ctx.save();
  rr(ctx, 1580, 980, 760, 16, 8);
  ctx.clip();
  for (let x = 1560; x < 2360; x += 28) {
    ctx.fillStyle = "#facc15";
    ctx.beginPath();
    ctx.moveTo(x, 996);
    ctx.lineTo(x + 14, 980);
    ctx.lineTo(x + 28, 980);
    ctx.lineTo(x + 14, 996);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
  ctx.strokeStyle = "rgba(255,255,255,0.8)";
  ctx.lineWidth = 3;
  for (const x of [1680, 1860, 2060, 2260]) {
    ctx.beginPath();
    ctx.moveTo(x, 1250);
    ctx.lineTo(x, 1330);
    ctx.stroke();
  }
}
