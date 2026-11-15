import * as THREE from "three";
import type { BinLook } from "../art";

/** Shared three.js helpers for every 3D level. */

export function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export interface View {
  renderer: THREE.WebGLRenderer;
  canvas: HTMLCanvasElement;
  /** Matches the drawing buffer to the host box. True when the size changed. */
  fit: (camera: THREE.PerspectiveCamera) => boolean;
  dispose: () => void;
}

/**
 * Creates a canvas inside `host` and a renderer for it. Throws when WebGL is
 * not available, so callers can fall back to flat art.
 */
export function createView(host: HTMLElement, lockTouch: boolean): View {
  const canvas = document.createElement("canvas");
  canvas.style.cssText = `display:block;width:100%;height:100%;${lockTouch ? "touch-action:none;" : ""}`;
  canvas.setAttribute("aria-hidden", "true");
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.shadowMap.enabled = true;
  renderer.toneMapping = THREE.NeutralToneMapping;
  host.appendChild(canvas);
  let lastW = 0;
  let lastH = 0;
  return {
    renderer,
    canvas,
    fit(camera) {
      const w = Math.max(1, host.clientWidth);
      const h = Math.max(1, host.clientHeight);
      if (w === lastW && h === lastH) return false;
      lastW = w;
      lastH = h;
      // Cap device resolution to keep rendering sharp without excessive GPU work.
      renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      return true;
    },
    dispose() {
      renderer.dispose();
      renderer.forceContextLoss();
      canvas.remove();
    },
  };
}

/** Runs `frame(dt, time)` every animation frame until the returned stop is called. */
export function startLoop(frame: (dt: number, time: number) => void) {
  let alive = true;
  let handle = 0;
  let last = performance.now();
  let time = 0;
  let reported = false;
  const tick = (now: number) => {
    if (!alive) return;
    // Cap elapsed time so a stalled browser tab cannot cause a large animation jump.
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    time += dt;
    try {
      frame(dt, time);
    } catch (error) {
      if (!reported) {
        reported = true;
        console.error(error);
      }
    }
    if (alive) handle = requestAnimationFrame(tick);
  };
  handle = requestAnimationFrame(tick);
  return () => {
    alive = false;
    cancelAnimationFrame(handle);
  };
}

/* ---------- materials and meshes ---------- */

export function std(
  color: THREE.ColorRepresentation,
  extra: THREE.MeshStandardMaterialParameters = {},
) {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.82, ...extra });
}

export function mesh(
  geometry: THREE.BufferGeometry,
  material: THREE.Material,
  x = 0,
  y = 0,
  z = 0,
  shadow = true,
) {
  const out = new THREE.Mesh(geometry, material);
  out.position.set(x, y, z);
  out.castShadow = shadow;
  out.receiveShadow = true;
  return out;
}

export function box(
  w: number,
  h: number,
  d: number,
  material: THREE.Material,
  x = 0,
  y = 0,
  z = 0,
  shadow = true,
) {
  return mesh(new THREE.BoxGeometry(w, h, d), material, x, y, z, shadow);
}

/* ---------- canvas textures ---------- */

const EMOJI_FONT =
  '"Segoe UI Emoji","Apple Color Emoji","Noto Color Emoji",sans-serif';
const emojiCache = new Map<string, THREE.CanvasTexture>();

/** An emoji drawn to a texture. `plate` puts it on a white disc, like a bin emblem. */
export function emojiTexture(glyph: string, plate = false) {
  const key = `${plate ? "p" : "e"}${glyph}`;
  const cached = emojiCache.get(key);
  if (cached) return cached;
  const size = 160;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    if (plate) {
      ctx.fillStyle = "rgba(0,0,0,0.18)";
      ctx.beginPath();
      ctx.arc(size / 2, size / 2 + 4, 72, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(size / 2, size / 2, 72, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = "#000";
    ctx.font = `${plate ? 84 : 118}px ${EMOJI_FONT}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(glyph, size / 2, size / 2 + (plate ? 6 : 10));
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  emojiCache.set(key, texture);
  return texture;
}

export function spriteOf(texture: THREE.Texture, size: number) {
  const sprite = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      depthWrite: false,
      toneMapped: false,
    }),
  );
  sprite.scale.set(size, size, 1);
  return sprite;
}

export function emojiSprite(glyph: string, size: number, plate = false) {
  return spriteOf(emojiTexture(glyph, plate), size);
}

function wrapWords(text: string, maxChars: number) {
  const lines: string[] = [];
  let line = "";
  for (const word of text.split(" ")) {
    if (line && (line + " " + word).length > maxChars) {
      lines.push(line);
      line = word;
    } else line = line ? `${line} ${word}` : word;
  }
  if (line) lines.push(line);
  return lines;
}

/** A rounded text plate that always faces the camera. `lineHeight` is in world units. */
export function labelSprite(
  text: string,
  opts: {
    lineHeight?: number;
    bg?: string;
    color?: string;
    maxChars?: number;
    border?: string;
  } = {},
) {
  const fontPx = 46;
  const font = `800 ${fontPx}px Nunito, ui-sans-serif, system-ui, sans-serif`;
  const lines = wrapWords(text, opts.maxChars ?? 99);
  const probe = document.createElement("canvas").getContext("2d");
  let textW = fontPx;
  if (probe) {
    probe.font = font;
    for (const line of lines)
      textW = Math.max(textW, probe.measureText(line).width);
  }
  const padX = 24;
  const padY = 14;
  const linePx = fontPx * 1.16;
  const canvas = document.createElement("canvas");
  canvas.width = Math.ceil(textW + padX * 2);
  canvas.height = Math.ceil(lines.length * linePx + padY * 2);
  const ctx = canvas.getContext("2d");
  if (ctx) {
    const r = Math.min(26, canvas.height / 2);
    ctx.beginPath();
    ctx.roundRect(2, 2, canvas.width - 4, canvas.height - 4, r);
    ctx.fillStyle = opts.bg ?? "#1b4332";
    ctx.fill();
    if (opts.border) {
      ctx.lineWidth = 4;
      ctx.strokeStyle = opts.border;
      ctx.stroke();
    }
    ctx.font = font;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = opts.color ?? "#ffffff";
    lines.forEach((line, index) =>
      ctx.fillText(line, canvas.width / 2, padY + linePx * (index + 0.5) + 2),
    );
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const sprite = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      depthWrite: false,
      toneMapped: false,
      fog: false,
    }),
  );
  const unit = (opts.lineHeight ?? 0.2) / fontPx;
  sprite.scale.set(canvas.width * unit, canvas.height * unit, 1);
  return sprite;
}

/** Soft round dot, used for steam, glows, and blob shadows. */
let dotTexture: THREE.CanvasTexture | null = null;
export function softDot() {
  if (dotTexture) return dotTexture;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 64;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    gradient.addColorStop(0, "rgba(255,255,255,1)");
    gradient.addColorStop(0.5, "rgba(255,255,255,0.55)");
    gradient.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 64, 64);
  }
  dotTexture = new THREE.CanvasTexture(canvas);
  return dotTexture;
}

/** Four-point sparkle. */
let starTexture: THREE.CanvasTexture | null = null;
export function sparkleTexture() {
  if (starTexture) return starTexture;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 64;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    const c = 32;
    const long = 30;
    const short = 8;
    for (let i = 0; i < 8; i += 1) {
      const radius = i % 2 === 0 ? long : short;
      const angle = (i * Math.PI) / 4;
      ctx.lineTo(c + Math.cos(angle) * radius, c + Math.sin(angle) * radius);
    }
    ctx.closePath();
    ctx.fill();
  }
  starTexture = new THREE.CanvasTexture(canvas);
  return starTexture;
}

/* ---------- props ---------- */

export interface Bin3D {
  group: THREE.Group;
  /** 0 is shut, 1 is fully open. */
  setOpen: (amount: number) => void;
}

/** A wheelie bin about 1 unit tall, standing on y = 0 and facing +z. */
export function makeBin(look: BinLook): Bin3D {
  const group = new THREE.Group();
  const bodyMat = std(look.body, { flatShading: true, roughness: 0.55 });
  const lidMat = std(look.lid, { roughness: 0.5 });
  const body = mesh(
    new THREE.CylinderGeometry(0.4, 0.31, 0.8, 4, 1),
    bodyMat,
    0,
    0.5,
    0,
  );
  body.rotation.y = Math.PI / 4;
  group.add(body);
  group.add(box(0.6, 0.05, 0.6, lidMat, 0, 0.9, 0));
  const wheelGeo = new THREE.CylinderGeometry(0.1, 0.1, 0.08, 14);
  const wheelMat = std("#1c1917", { roughness: 0.9 });
  for (const side of [-1, 1]) {
    const wheel = mesh(wheelGeo, wheelMat, side * 0.25, 0.1, -0.2);
    wheel.rotation.z = Math.PI / 2;
    group.add(wheel);
  }
  const hinge = new THREE.Group();
  hinge.position.set(0, 0.94, -0.31);
  hinge.add(box(0.66, 0.07, 0.66, lidMat, 0, 0, 0.32));
  hinge.add(box(0.24, 0.05, 0.08, lidMat, 0, 0.02, 0.68));
  group.add(hinge);
  const emblem = emojiSprite(look.symbol, 0.36, true);
  emblem.position.set(0, 0.58, 0.34);
  group.add(emblem);
  return {
    group,
    setOpen(amount) {
      hinge.rotation.x = -amount * 1.15;
    },
  };
}

/** Low-poly tree about 2 units tall. The crown is in `userData.crown` so it can sway. */
export function makeTree(scale = 1) {
  const group = new THREE.Group();
  group.add(
    mesh(
      new THREE.CylinderGeometry(0.09, 0.14, 0.9, 6),
      std("#6b4f3a"),
      0,
      0.45,
      0,
    ),
  );
  const crown = new THREE.Group();
  crown.position.y = 0.8;
  const leafGeo = new THREE.IcosahedronGeometry(0.55, 0);
  const blobs: [number, number, number, number, string][] = [
    [-0.3, 0.35, 0.05, 1, "#2d6a4f"],
    [0.32, 0.38, -0.05, 0.95, "#2f7354"],
    [0, 0.42, 0.3, 0.85, "#357a5a"],
    [0, 0.85, 0, 0.9, "#40916c"],
  ];
  for (const [x, y, z, s, color] of blobs) {
    const blob = mesh(leafGeo, std(color, { flatShading: true }), x, y, z);
    blob.scale.setScalar(s);
    blob.rotation.set(x * 3, y * 2, z * 5);
    crown.add(blob);
  }
  group.add(crown);
  group.userData.crown = crown;
  group.scale.setScalar(scale);
  return group;
}

/** A small house with a hip roof, centered on its footprint and facing +z. */
export function makeHouse(
  w: number,
  d: number,
  h: number,
  wall: string,
  roof: string,
) {
  const group = new THREE.Group();
  group.add(box(w, h, d, std(wall), 0, h / 2, 0));
  const roofMesh = mesh(
    new THREE.ConeGeometry(1, 1, 4),
    std(roof, { flatShading: true }),
    0,
    h + 0.55,
    0,
  );
  roofMesh.rotation.y = Math.PI / 4;
  roofMesh.scale.set((w / Math.SQRT2) * 1.12, 1.1, (d / Math.SQRT2) * 1.12);
  const roofHolder = new THREE.Group();
  roofHolder.add(roofMesh);
  group.add(roofHolder);
  group.add(box(0.3, 0.7, 0.3, std("#7a3e2e"), w * 0.28, h + 0.6, -d * 0.1));
  const trim = std("#ffffff");
  const glass = std("#bfe0f2", { roughness: 0.2, metalness: 0.1 });
  group.add(box(0.5, 0.95, 0.06, std("#7c4a2d"), 0, 0.475, d / 2 + 0.02));
  const knob = mesh(
    new THREE.SphereGeometry(0.04, 8, 8),
    std("#fde68a"),
    0.16,
    0.45,
    d / 2 + 0.07,
    false,
  );
  group.add(knob);
  for (const side of [-1, 1]) {
    const x = side * w * 0.3;
    group.add(box(0.62, 0.56, 0.05, trim, x, h * 0.58, d / 2 + 0.01, false));
    group.add(box(0.5, 0.44, 0.06, glass, x, h * 0.58, d / 2 + 0.02, false));
  }
  return group;
}
