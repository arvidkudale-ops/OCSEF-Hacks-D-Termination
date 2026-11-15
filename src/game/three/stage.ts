import * as THREE from "three";
import { binLook } from "../art";
import type { MonsterMood } from "../art";
import {
  box,
  createView,
  emojiSprite,
  emojiTexture,
  labelSprite,
  makeBin,
  makeHouse,
  makeTree,
  mesh,
  prefersReducedMotion,
  softDot,
  sparkleTexture,
  spriteOf,
  startLoop,
  std,
} from "./kit";
import type { Bin3D } from "./kit";

/**
 * The 3D stage behind the button levels: a themed room, a row of bins, and the
 * current item. It only shows what the React level tells it. Scoring stays in
 * the level component.
 */

export type StageTheme =
  | "sorting"
  | "compost"
  | "recycling"
  | "neighborhood"
  | "boss";

export interface StageBin {
  id: string;
  label: string;
}

/** One answer. `n` goes up every time so the same result can play twice. */
export interface StageEvent {
  n: number;
  ok: boolean;
  binId?: string;
  /** Item to show when no item is waiting on the stage. */
  emoji?: string;
}

export interface StageProps {
  bins: StageBin[];
  emoji: string | null;
  itemKey: string | number;
  event: StageEvent | null;
  steps: { total: number; done: number } | null;
  shield: number;
  mood: MonsterMood;
  bits: string[];
}

export interface Stage {
  update: (props: StageProps) => void;
  /** Bin under a screen point, if any. */
  pick: (clientX: number, clientY: number) => string | null;
  hover: (clientX: number, clientY: number) => void;
  dispose: () => void;
}

const THEMES: Record<StageTheme, { sky: string; floor: string }> = {
  sorting: { sky: "#dfe7ee", floor: "#a9b6c0" },
  compost: { sky: "#cfe8f3", floor: "#7fa35a" },
  recycling: { sky: "#dbeafe", floor: "#93a1b5" },
  neighborhood: { sky: "#cfe8f3", floor: "#8cbf6e" },
  boss: { sky: "#8f826a", floor: "#6b5a43" },
};

const BIN_Z = 1;
const PLATFORM_Y = 1.15;
const ITEM_SIZE = 0.95;

interface BinSlot {
  id: string;
  bin: Bin3D;
  x: number;
  open: number;
  hold: number;
  bounce: number;
  wobble: number;
}

interface Monster {
  set: (shield: number, mood: MonsterMood, bits: string[]) => void;
  hurt: () => void;
  grow: () => void;
  tick: (time: number, dt: number) => void;
}

const easeOut = (t: number) => 1 - (1 - t) ** 3;

export function createStage(host: HTMLElement, theme: StageTheme): Stage {
  const view = createView(host, false);
  const reduce = prefersReducedMotion();
  const boss = theme === "boss";
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, 2, 0.1, 90);
  const sky = new THREE.Color(THEMES[theme].sky);
  scene.background = sky;
  const fog = new THREE.Fog(sky.clone(), 18, 48);
  scene.fog = fog;

  scene.add(new THREE.HemisphereLight("#ffffff", "#8a8f80", 1.25));
  const sun = new THREE.DirectionalLight("#fff3dd", 2.3);
  sun.position.set(4, 8, 7);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  sun.shadow.camera.left = -9;
  sun.shadow.camera.right = 9;
  sun.shadow.camera.top = 8;
  sun.shadow.camera.bottom = -5;
  sun.shadow.camera.near = 1;
  sun.shadow.camera.far = 30;
  sun.shadow.bias = -0.0006;
  sun.shadow.normalBias = 0.02;
  scene.add(sun);

  const floorMat = std(THEMES[theme].floor, { roughness: 0.95 });
  const floor = mesh(new THREE.PlaneGeometry(90, 50), floorMat, 0, 0, -8, false);
  floor.rotation.x = -Math.PI / 2;
  scene.add(floor);

  const tickers: ((time: number, dt: number) => void)[] = [];
  const home = boss
    ? new THREE.Vector3(0, 1.15, 0.1)
    : new THREE.Vector3(0, PLATFORM_Y + 0.55, -0.9);

  /* ---------- scenery ---------- */

  function conveyor(frameColor: string) {
    scene.add(box(15, 0.2, 1.05, std(frameColor), 0, PLATFORM_Y - 0.12, -0.9));
    const stripes = document.createElement("canvas");
    stripes.width = stripes.height = 64;
    const ctx = stripes.getContext("2d");
    if (ctx) {
      ctx.fillStyle = "#3b424d";
      ctx.fillRect(0, 0, 64, 64);
      ctx.fillStyle = "#505966";
      ctx.fillRect(0, 0, 26, 64);
    }
    const texture = new THREE.CanvasTexture(stripes);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.wrapS = THREE.RepeatWrapping;
    texture.repeat.set(26, 1);
    const belt = mesh(
      new THREE.PlaneGeometry(15, 0.86),
      std("#ffffff", { map: texture, roughness: 0.9 }),
      0,
      PLATFORM_Y - 0.015,
      -0.9,
      false,
    );
    belt.rotation.x = -Math.PI / 2;
    scene.add(belt);
    const rail = std("#f2c94c", { roughness: 0.5 });
    scene.add(box(15, 0.08, 0.06, rail, 0, PLATFORM_Y + 0.02, -0.4));
    scene.add(box(15, 0.08, 0.06, rail, 0, PLATFORM_Y + 0.02, -1.4));
    const leg = std("#59616d");
    for (let x = -6; x <= 6; x += 3) {
      scene.add(box(0.14, PLATFORM_Y - 0.2, 0.14, leg, x, 0.48, -0.5));
      scene.add(box(0.14, PLATFORM_Y - 0.2, 0.14, leg, x, 0.48, -1.3));
    }
    if (!reduce) tickers.push((_, dt) => (texture.offset.x -= dt * 0.7));
  }

  function table() {
    const wood = std("#a8794f");
    const dark = std("#7c5433");
    scene.add(box(3, 0.12, 1.1, wood, 0, PLATFORM_Y - 0.07, -0.9));
    for (const x of [-1.35, 1.35])
      for (const z of [-0.45, -1.35])
        scene.add(box(0.12, PLATFORM_Y - 0.13, 0.12, dark, x, 0.51, z));
  }

  function backWall(color: string, band: string) {
    const wall = mesh(
      new THREE.PlaneGeometry(60, 14),
      std(color, { roughness: 1 }),
      0,
      7,
      -4.2,
      false,
    );
    scene.add(wall);
    scene.add(box(60, 0.5, 0.12, std(band), 0, 3.5, -4.1, false));
    scene.add(box(60, 0.35, 0.16, std(band), 0, 0.17, -4.08, false));
  }

  function hills() {
    const geo = new THREE.SphereGeometry(7, 24, 12);
    const spots: [number, number, string][] = [
      [-13, -15, "#93c47a"],
      [2, -17, "#86b96d"],
      [15, -15, "#9bcb82"],
    ];
    for (const [x, z, color] of spots) {
      const hill = mesh(geo, std(color, { roughness: 1 }), x, -0.6, z, false);
      hill.scale.set(1.5, 0.4, 1);
      scene.add(hill);
    }
    const sunBall = mesh(
      new THREE.SphereGeometry(0.9, 20, 20),
      new THREE.MeshBasicMaterial({ color: "#fde68a", fog: false }),
      9,
      5.2,
      -16,
      false,
    );
    scene.add(sunBall);
  }

  function swayTrees(spots: [number, number, number][]) {
    for (const [x, z, scale] of spots) {
      const tree = makeTree(scale);
      tree.position.set(x, 0, z);
      scene.add(tree);
      if (!reduce) {
        const crown = tree.userData.crown as THREE.Group;
        tickers.push((time) => {
          crown.rotation.z = Math.sin(time * 1.3 + x) * 0.03;
        });
      }
    }
  }

  function sortingRoom() {
    backWall("#cfd9e2", "#9fb3c4");
    const pillar = std("#8fa3b5");
    for (const x of [-9, -3, 3, 9])
      scene.add(box(0.5, 9, 0.5, pillar, x, 4.5, -3.9));
    scene.add(box(60, 0.02, 0.14, std("#f2c94c"), 0, 0.011, 0.1, false));
    // a second line of boxes rolling along the back wall
    scene.add(box(40, 0.16, 0.8, std("#4b5563"), 0, 0.62, -3.2));
    const crateMat = [std("#c9a66b"), std("#b98d55"), std("#d8b98a")];
    const crates: THREE.Mesh[] = [];
    for (let i = 0; i < 9; i += 1) {
      const size = 0.42 + (i % 3) * 0.08;
      const crate = box(size, size, size, crateMat[i % 3], -10 + i * 2.4, 0.7 + size / 2, -3.2);
      crates.push(crate);
      scene.add(crate);
    }
    if (!reduce)
      tickers.push((_, dt) => {
        for (const crate of crates) {
          crate.position.x += dt * 0.7;
          if (crate.position.x > 11) crate.position.x -= 21.6;
        }
      });
    for (const x of [-6, 0, 6]) {
      const shade = mesh(
        new THREE.ConeGeometry(0.42, 0.3, 16, 1, true),
        std("#374151", { side: THREE.DoubleSide }),
        x,
        3.05,
        -2,
        false,
      );
      scene.add(shade);
      scene.add(
        mesh(
          new THREE.SphereGeometry(0.14, 12, 12),
          new THREE.MeshBasicMaterial({ color: "#fef3c7" }),
          x,
          2.95,
          -2,
          false,
        ),
      );
      scene.add(box(0.03, 3, 0.03, std("#374151"), x, 4.7, -2, false));
    }
    conveyor("#374151");
  }

  function compostYard() {
    hills();
    const dirt = mesh(
      new THREE.CircleGeometry(9, 32),
      std("#8a6a4a", { roughness: 1 }),
      0,
      0.01,
      -3.4,
      false,
    );
    dirt.rotation.x = -Math.PI / 2;
    dirt.scale.set(1.3, 0.32, 1);
    scene.add(dirt);
    const moundGeo = new THREE.IcosahedronGeometry(1.5, 1);
    const mounds: [number, number, string][] = [
      [-5.2, -3.3, "#5a3e2b"],
      [-0.3, -3.9, "#6b4b32"],
      [4.9, -3.2, "#5f432e"],
    ];
    const steamTex = softDot();
    for (const [x, z, color] of mounds) {
      const mound = mesh(moundGeo, std(color, { flatShading: true, roughness: 1 }), x, 0.15, z);
      mound.scale.set(1.25, 0.62, 1);
      scene.add(mound);
      const scraps = ["#f6d860", "#9bcb5a", "#e07a4d", "#f4efe2"];
      scraps.forEach((scrap, index) => {
        const angle = index * 1.7 + x;
        scene.add(
          mesh(
            new THREE.IcosahedronGeometry(0.1, 0),
            std(scrap, { flatShading: true }),
            x + Math.cos(angle) * 0.9,
            0.75 - Math.abs(Math.cos(angle)) * 0.25,
            z + 0.5 + Math.sin(angle) * 0.3,
          ),
        );
      });
      if (reduce) continue;
      for (let i = 0; i < 3; i += 1) {
        const puff = spriteOf(steamTex, 0.6);
        puff.material.opacity = 0;
        scene.add(puff);
        const offset = i * 0.9 + x;
        tickers.push((time) => {
          const phase = (time * 0.35 + offset) % 1;
          puff.position.set(
            x + (i - 1) * 0.5 + Math.sin(time + offset) * 0.1,
            1.1 + phase * 1.3,
            z,
          );
          puff.material.opacity = Math.sin(phase * Math.PI) * 0.55;
          puff.scale.setScalar(0.5 + phase * 0.6);
        });
      }
    }
    const wood = std("#a8794f");
    for (let x = -13; x <= 13; x += 1.6)
      scene.add(box(0.14, 1, 0.14, wood, x, 0.5, -6));
    scene.add(box(27, 0.1, 0.08, wood, 0, 0.75, -6));
    scene.add(box(27, 0.1, 0.08, wood, 0, 0.4, -6));
    swayTrees([
      [-9, -5, 1.7],
      [9.5, -5.2, 1.9],
      [-12.5, -7.5, 1.5],
    ]);
    table();
  }

  function gear(radius: number, teeth: number, color: string) {
    const group = new THREE.Group();
    const material = std(color, { roughness: 0.5, metalness: 0.35 });
    const wheel = mesh(new THREE.CylinderGeometry(radius, radius, 0.26, 28), material);
    wheel.rotation.x = Math.PI / 2;
    group.add(wheel);
    for (let i = 0; i < teeth; i += 1) {
      const angle = (i / teeth) * Math.PI * 2;
      const tooth = box(radius * 0.3, radius * 0.3, 0.26, material, Math.cos(angle) * radius, Math.sin(angle) * radius, 0);
      tooth.rotation.z = angle;
      group.add(tooth);
    }
    const hub = mesh(
      new THREE.CylinderGeometry(radius * 0.32, radius * 0.32, 0.34, 16),
      std("#e2e8f0", { roughness: 0.4, metalness: 0.4 }),
    );
    hub.rotation.x = Math.PI / 2;
    group.add(hub);
    return group;
  }

  function recyclingPlant() {
    backWall("#c7d6ea", "#8ea3c0");
    const gears: [number, number, number, number, string, number][] = [
      [-5.6, 2.2, 1.15, 10, "#64748b", 0.5],
      [-3.95, 1.25, 0.72, 7, "#94a3b8", -0.8],
      [5.5, 2.3, 0.95, 9, "#94a3b8", -0.6],
      [6.95, 1.5, 0.66, 6, "#64748b", 0.86],
    ];
    for (const [x, y, radius, teeth, color, speed] of gears) {
      const wheel = gear(radius, teeth, color);
      wheel.position.set(x, y, -3.9);
      scene.add(wheel);
      if (!reduce) tickers.push((_, dt) => (wheel.rotation.z += dt * speed));
    }
    const strap = std("#1f2937");
    const bales: [number, number, number, string][] = [
      [-8.2, 0.3, -2.6, "#60a5fa"],
      [-7.1, 0.3, -2.6, "#a3a3a3"],
      [-7.65, 0.9, -2.6, "#4ade80"],
      [3.2, 0.3, -3, "#facc15"],
      [8.4, 0.3, -2.4, "#f87171"],
      [9.5, 0.3, -2.4, "#60a5fa"],
      [8.95, 0.9, -2.4, "#facc15"],
    ];
    for (const [x, y, z, color] of bales) {
      scene.add(box(1, 0.58, 0.8, std(color, { roughness: 1 }), x, y, z));
      for (const dx of [-0.25, 0.25])
        scene.add(box(0.05, 0.6, 0.82, strap, x + dx, y, z, false));
    }
    const pipe = std("#475569", { roughness: 0.45, metalness: 0.4 });
    scene.add(mesh(new THREE.CylinderGeometry(0.22, 0.22, 9, 14), pipe, 1.6, 4.5, -3.8));
    const cross = mesh(new THREE.CylinderGeometry(0.16, 0.16, 26, 12), pipe, 0, 3.05, -3.85);
    cross.rotation.z = Math.PI / 2;
    scene.add(cross);
    conveyor("#334155");
  }

  function street() {
    hills();
    const road = mesh(
      new THREE.PlaneGeometry(90, 2.2),
      std("#5b5f66", { roughness: 1 }),
      0,
      0.01,
      -3,
      false,
    );
    road.rotation.x = -Math.PI / 2;
    scene.add(road);
    for (let x = -14; x <= 14; x += 2)
      scene.add(box(0.9, 0.01, 0.08, std("#f2c94c"), x, 0.02, -3, false));
    const houses: [number, string, string][] = [
      [-6.5, "#f4d6b0", "#9b4d3a"],
      [-1, "#cfe3f2", "#355c7d"],
      [5.5, "#f6e3a6", "#7a5c2e"],
    ];
    for (const [x, wall, roof] of houses) {
      const house = makeHouse(3.2, 2.4, 1.8, wall, roof);
      house.position.set(x, 0, -6.4);
      scene.add(house);
    }
    swayTrees([
      [-10.5, -5.6, 1.8],
      [2.3, -5.8, 1.6],
      [10, -5.4, 1.9],
    ]);
    table();
  }

  function buildMonster(): Monster {
    const root = new THREE.Group();
    root.position.set(0, 0.45, -2.3);
    scene.add(root);
    const heap = mesh(
      new THREE.IcosahedronGeometry(2.3, 1),
      std("#4b4237", { flatShading: true, roughness: 1 }),
      0,
      -0.6,
      0,
    );
    heap.scale.set(1.7, 0.32, 1);
    root.add(heap);

    const blob = new THREE.Group();
    blob.scale.setScalar(1.3);
    root.add(blob);
    const core = new THREE.Group();
    core.position.y = 0.98;
    blob.add(core);

    const geometry = new THREE.SphereGeometry(1.5, 48, 32);
    const position = geometry.attributes.position;
    const v = new THREE.Vector3();
    const n = new THREE.Vector3();
    for (let i = 0; i < position.count; i += 1) {
      v.fromBufferAttribute(position, i);
      n.copy(v).normalize();
      const lump =
        1 +
        0.05 * Math.sin(n.x * 6 + 1.3) * Math.sin(n.y * 5 + 0.4) +
        0.04 * Math.sin(n.z * 7 + n.x * 3);
      v.multiplyScalar(lump);
      if (v.y < -0.75) {
        const under = -0.75 - v.y;
        v.y = -0.75 - under * 0.3;
        v.x *= 1 + under * 0.35;
        v.z *= 1 + under * 0.35;
      }
      position.setXYZ(i, v.x, v.y, v.z);
    }
    geometry.computeVertexNormals();
    const clean = new THREE.Color("#a3b18a");
    const dirty = new THREE.Color("#3f5e3a");
    const bodyMat = std(dirty, { roughness: 0.5 });
    const body = mesh(geometry, bodyMat);
    core.add(body);

    const white = std("#ffffff", { roughness: 0.25 });
    const black = std("#1c1917", { roughness: 0.3 });
    const eyes: THREE.Group[] = [];
    const brows: THREE.Mesh[] = [];
    const browMat = std("#1f3a26");
    for (const side of [-1, 1]) {
      const eye = new THREE.Group();
      eye.position.set(side * 0.52, 0.45, 1.22);
      eye.add(mesh(new THREE.SphereGeometry(0.31, 20, 16), white, 0, 0, 0, false));
      eye.add(mesh(new THREE.SphereGeometry(0.15, 16, 12), black, -side * 0.05, -0.04, 0.22, false));
      eye.add(mesh(new THREE.SphereGeometry(0.05, 8, 8), white, -side * 0.02, 0.03, 0.34, false));
      core.add(eye);
      eyes.push(eye);
      const brow = box(0.6, 0.11, 0.12, browMat, side * 0.52, 0.9, 1.22, false);
      core.add(brow);
      brows.push(brow);
    }
    const mouth = mesh(
      new THREE.SphereGeometry(1, 20, 14),
      std("#3b0a0a", { roughness: 0.6 }),
      0,
      -0.22,
      1.42,
      false,
    );
    core.add(mouth);
    const teeth = new THREE.Group();
    for (let i = 0; i < 5; i += 1) {
      const tooth = mesh(
        new THREE.ConeGeometry(0.07, 0.16, 4),
        white,
        (i - 2) * 0.19,
        -0.13 - Math.abs(i - 2) * 0.025,
        1.5,
        false,
      );
      tooth.rotation.x = Math.PI;
      teeth.add(tooth);
    }
    core.add(teeth);

    const wire = new THREE.Mesh(
      new THREE.IcosahedronGeometry(2.2, 1),
      new THREE.MeshBasicMaterial({
        color: "#f59e0b",
        wireframe: true,
        transparent: true,
        fog: false,
      }),
    );
    const glow = new THREE.Mesh(
      new THREE.SphereGeometry(2.15, 24, 16),
      new THREE.MeshBasicMaterial({
        color: "#fbbf24",
        transparent: true,
        depthWrite: false,
        fog: false,
      }),
    );
    core.add(wire, glow);

    const slotSpots: [number, number][] = [
      [-1.08, 0.1],
      [1.08, 0.1],
      [-0.98, -0.45],
      [0.98, -0.45],
      [-0.92, 0.68],
      [0.92, 0.68],
      [-0.48, 1.08],
      [0.48, 1.08],
      [0, 1.27],
      [-1.2, -0.2],
    ];
    const bitSprites = slotSpots.map(([x, y]) => {
      const sprite = emojiSprite("♻️", 0.44, true);
      sprite.position.set(x, y, Math.sqrt(Math.max(0.05, 2.4 - x * x - y * y)) + 0.1);
      sprite.visible = false;
      core.add(sprite);
      return sprite;
    });

    const smogMat = new THREE.MeshBasicMaterial({
      color: "#57534e",
      transparent: true,
      depthWrite: false,
    });
    const smog: THREE.Mesh[] = [];
    for (let i = 0; i < 6; i += 1) {
      const puff = new THREE.Mesh(new THREE.SphereGeometry(0.55 + (i % 3) * 0.12, 12, 10), smogMat);
      root.add(puff);
      smog.push(puff);
    }

    const piles: THREE.Mesh[] = [];
    const pileSpots: [number, number, number][] = [
      [-6.5, -3.5, 1.5],
      [-9.5, -5, 2],
      [6.8, -3.8, 1.6],
      [10, -5.5, 2.2],
      [-3.8, -6, 1.2],
      [4, -6.4, 1.3],
    ];
    for (const [x, z, size] of pileSpots) {
      const pile = mesh(
        new THREE.IcosahedronGeometry(size, 1),
        std("#57493a", { flatShading: true, roughness: 1 }),
        x,
        0,
        z,
      );
      pile.userData.size = size;
      scene.add(pile);
      piles.push(pile);
    }
    const sunBall = new THREE.Mesh(
      new THREE.SphereGeometry(0.9, 20, 20),
      new THREE.MeshBasicMaterial({ color: "#fde68a", transparent: true, fog: false }),
    );
    sunBall.position.set(8, 5.4, -16);
    scene.add(sunBall);

    const skyClean = new THREE.Color("#bfe3f7");
    const skyDirty = new THREE.Color("#8f826a");
    const groundClean = new THREE.Color("#7fb069");
    const groundDirty = new THREE.Color("#6b5a43");
    let target = 1;
    let shown = 1;
    let mood: MonsterMood = "angry";
    let flash = 0;
    let pulse = 0;
    let squash = 1;
    let bitKey = "";
    const mouthGoal: Record<MonsterMood, [number, number]> = {
      angry: [0.56, 0.24],
      hurt: [0.22, 0.22],
      tired: [0.45, 0.06],
      defeated: [0.3, 0.05],
    };
    const browGoal: Record<MonsterMood, number> = {
      angry: 0.42,
      hurt: -0.3,
      tired: 0,
      defeated: 0,
    };
    mouth.scale.set(0.56, 0.24, 0.12);

    return {
      set(shield, nextMood, bits) {
        target = shield;
        mood = nextMood;
        const key = bits.join("|");
        if (key === bitKey) return;
        bitKey = key;
        bitSprites.forEach((sprite, index) => {
          const glyph = bits[index];
          sprite.visible = Boolean(glyph);
          if (glyph) sprite.material.map = emojiTexture(glyph, true);
        });
      },
      hurt() {
        flash = 0.4;
      },
      grow() {
        pulse = 0.45;
      },
      tick(time, dt) {
        const ease = Math.min(1, dt * 5);
        shown += (target - shown) * (reduce ? 1 : Math.min(1, dt * 3));
        flash = Math.max(0, flash - dt);
        pulse = Math.max(0, pulse - dt);
        const defeated = mood === "defeated";
        squash += ((defeated ? 0.55 : 1) - squash) * ease;

        bodyMat.color.lerpColors(clean, dirty, shown);
        bodyMat.emissive.setScalar(reduce ? 0 : (flash / 0.4) * 0.55);
        const breathe = reduce ? 0 : Math.sin(time * 2) * 0.02;
        const swell = reduce ? 0 : Math.sin((pulse / 0.45) * Math.PI) * 0.08;
        core.scale.set(1 - breathe + swell, (1 + breathe + swell) * squash, 1 + swell);
        core.position.y = 0.98 * squash;
        core.rotation.z = reduce ? 0 : Math.sin(flash * 40) * 0.07 * (flash / 0.4);

        const blink = !reduce && time % 4.5 > 4.38;
        const eyeY = defeated ? 0.12 : blink ? 0.1 : mood === "tired" ? 0.7 : 1;
        eyes.forEach((eye) => (eye.scale.y += (eyeY - eye.scale.y) * Math.min(1, dt * 18)));
        brows.forEach((brow, index) => {
          const side = index === 0 ? -1 : 1;
          brow.visible = !defeated;
          brow.rotation.z += (browGoal[mood] * side - brow.rotation.z) * ease;
          brow.position.y += ((mood === "tired" ? 0.78 : 0.9) - brow.position.y) * ease;
        });
        const [mw, mh] = mouthGoal[mood];
        mouth.scale.x += (mw - mouth.scale.x) * ease;
        mouth.scale.y += (mh - mouth.scale.y) * ease;
        teeth.visible = mood === "angry";

        const up = shown > 0.02 && !defeated;
        wire.visible = glow.visible = up;
        wire.material.opacity = 0.2 + shown * 0.6;
        glow.material.opacity = 0.04 + shown * 0.1;
        if (!reduce) {
          wire.rotation.y = time * 0.35;
          wire.rotation.x = time * 0.2;
        }
        wire.scale.setScalar(1 + (reduce ? 0 : (flash / 0.4) * 0.08));

        smogMat.opacity = 0.34 * shown;
        smog.forEach((puff, index) => {
          const angle = (reduce ? 0 : time * 0.25) + index * 1.05;
          puff.position.set(
            Math.cos(angle) * 3.2,
            3.6 + Math.sin(angle * 2 + index) * 0.4,
            Math.sin(angle) * 1.2 - 0.4,
          );
          puff.visible = shown > 0.05;
        });
        for (const pile of piles) {
          const size = 0.25 + shown * 0.75;
          pile.scale.set(1.5 * size, 0.5 * size, size);
        }
        sunBall.material.opacity = Math.max(0, Math.min(1, 1 - shown * 1.6));
        sky.lerpColors(skyClean, skyDirty, shown);
        fog.color.copy(sky);
        floorMat.color.lerpColors(groundClean, groundDirty, shown);
      },
    };
  }

  let monster: Monster | null = null;
  if (theme === "sorting") sortingRoom();
  else if (theme === "compost") compostYard();
  else if (theme === "recycling") recyclingPlant();
  else if (theme === "neighborhood") street();
  else {
    monster = buildMonster();
    tickers.push(monster.tick);
  }

  /* ---------- bins ---------- */

  const binRoot = new THREE.Group();
  scene.add(binRoot);
  let slots: BinSlot[] = [];
  let binKey = "";
  let hoverId: string | null = null;

  function setBins(bins: StageBin[]) {
    const key = bins.map((entry) => `${entry.id}:${entry.label}`).join("|");
    if (key === binKey) return;
    binKey = key;
    binRoot.clear();
    hoverId = null;
    const gap = bins.length > 4 ? 1.38 : 1.8;
    slots = bins.map((entry, index) => {
      const x = (index - (bins.length - 1) / 2) * gap;
      const bin = makeBin(binLook(entry.id));
      bin.group.position.set(x, 0, BIN_Z);
      bin.group.scale.setScalar(1.12);
      const label = labelSprite(entry.label, {
        lineHeight: 0.17,
        maxChars: bins.length > 4 ? 12 : 16,
      });
      const shrink = Math.min(1, (gap * 0.94) / label.scale.x, 0.52 / label.scale.y);
      label.scale.multiplyScalar(shrink);
      label.scale.z = 1;
      label.center.set(0.5, 0);
      label.position.set(x, 0.03, BIN_Z + 0.52);
      binRoot.add(bin.group, label);
      bin.group.traverse((child) => (child.userData.binId = entry.id));
      label.userData.binId = entry.id;
      return { id: entry.id, bin, x, open: 0, hold: 0, bounce: 0, wobble: 0 };
    });
    frameCamera();
  }

  /* ---------- progress crates for order and match stations ---------- */

  const stepRoot = new THREE.Group();
  scene.add(stepRoot);
  let crates: { cube: THREE.Mesh; mark: THREE.Sprite; ask: THREE.Sprite; pop: number }[] = [];
  let stepTotal = 0;
  let stepDone = -1;
  const pendingMat = std("#d9cfb8");
  const doneMat = std("#52b788", { emissive: "#1b4332", emissiveIntensity: 0.25 });

  function setSteps(steps: StageProps["steps"]) {
    const total = steps?.total ?? 0;
    const done = steps?.done ?? 0;
    if (total !== stepTotal) {
      stepTotal = total;
      stepDone = -1;
      stepRoot.clear();
      crates = [];
      const gap = Math.min(0.95, 5.4 / Math.max(1, total));
      for (let i = 0; i < total; i += 1) {
        const x = (i - (total - 1) / 2) * gap;
        const cube = box(gap * 0.78, gap * 0.78, gap * 0.78, pendingMat, x, PLATFORM_Y + gap * 0.39, -0.9);
        const mark = labelSprite(String(i + 1), { lineHeight: gap * 0.42, bg: "#1b4332" });
        const ask = labelSprite("?", { lineHeight: gap * 0.42, bg: "#8a8272" });
        for (const sprite of [mark, ask])
          sprite.position.set(x, PLATFORM_Y + gap * 0.39, -0.9 + gap * 0.5);
        stepRoot.add(cube, mark, ask);
        crates.push({ cube, mark, ask, pop: 0 });
      }
    }
    if (done !== stepDone) {
      crates.forEach((crate, index) => {
        const finished = index < done;
        crate.cube.material = finished ? doneMat : pendingMat;
        crate.mark.visible = finished;
        crate.ask.visible = !finished;
        if (finished && stepDone >= 0 && index >= stepDone) crate.pop = 0.4;
      });
      stepDone = done;
    }
  }

  /* ---------- the item ---------- */

  const item = spriteOf(emojiTexture("♻️"), ITEM_SIZE);
  item.visible = false;
  const flyer = spriteOf(emojiTexture("♻️"), ITEM_SIZE);
  flyer.visible = false;
  const shadowDisc = new THREE.Mesh(
    new THREE.CircleGeometry(0.34, 20),
    new THREE.MeshBasicMaterial({ color: "#000000", transparent: true, opacity: 0.22, depthWrite: false }),
  );
  shadowDisc.rotation.x = -Math.PI / 2;
  shadowDisc.position.set(0, boss ? 0.012 : PLATFORM_Y, home.z);
  shadowDisc.visible = false;
  scene.add(item, flyer, shadowDisc);

  let itemState: "hidden" | "enter" | "idle" | "shake" = "hidden";
  let itemT = 0;
  let fly: {
    mode: "fly" | "reject";
    t: number;
    from: THREE.Vector3;
    to: THREE.Vector3;
    slot: BinSlot | null;
  } | null = null;

  const cross = labelSprite("✗", { lineHeight: 0.42, bg: "#b91c1c" });
  cross.visible = false;
  scene.add(cross);
  let crossT = 0;
  let shake = 0;

  const sparks = Array.from({ length: 16 }, () => {
    const sprite = spriteOf(sparkleTexture(), 0.2);
    sprite.material.color.set("#fde047");
    sprite.visible = false;
    scene.add(sprite);
    return { sprite, velocity: new THREE.Vector3(), life: 0 };
  });

  function burst(at: THREE.Vector3) {
    if (reduce) return;
    for (const spark of sparks) {
      spark.sprite.position.copy(at);
      spark.velocity.set((Math.random() - 0.5) * 3.4, 1.4 + Math.random() * 2.6, (Math.random() - 0.5) * 2);
      spark.life = 0.5 + Math.random() * 0.3;
      spark.sprite.visible = true;
    }
  }

  function play(event: StageEvent) {
    const slot = slots.find((entry) => entry.id === event.binId) ?? null;
    const live = item.visible && itemState !== "hidden";
    const texture = live
      ? item.material.map
      : event.emoji
        ? emojiTexture(event.emoji)
        : null;
    if (event.ok) {
      monster?.hurt();
      if (slot && texture) {
        flyer.material.map = texture;
        flyer.material.opacity = 1;
        flyer.visible = true;
        fly = {
          mode: "fly",
          t: 0,
          from: live ? item.position.clone() : home.clone(),
          to: new THREE.Vector3(slot.x, 1.2, BIN_Z),
          slot,
        };
        flyer.position.copy(fly.from);
        slot.hold = 0.75;
        if (live) {
          item.visible = false;
          itemState = "hidden";
        }
      } else burst(live ? item.position : home);
      return;
    }
    monster?.grow();
    shake = 0.3;
    if (live) {
      itemState = "shake";
      itemT = 0;
    } else if (texture) {
      flyer.material.map = texture;
      flyer.material.opacity = 1;
      flyer.visible = true;
      fly = { mode: "reject", t: 0, from: home.clone(), to: home.clone(), slot: null };
    }
    if (slot) {
      slot.wobble = 0.45;
      cross.position.set(slot.x, 1.55, BIN_Z + 0.1);
      cross.visible = true;
      crossT = 0.7;
    }
  }

  /* ---------- camera ---------- */

  const probe = new THREE.Vector3();
  let camBase = new THREE.Vector3();

  function frameCamera() {
    const halfW = Math.max(boss ? 3.3 : 2.7, slots.length > 0 ? Math.abs(slots[0].x) + 0.85 : 0);
    // With no bins on the floor, move in on the platform instead.
    const close = slots.length === 0 && !boss;
    const centerY = boss ? 1.8 : close ? 1.4 : 1.05;
    const top: [number, number, number] = boss ? [0, 4.05, -2.3] : [0, 2.45, -0.9];
    const must: [number, number, number][] = close
      ? [[-3.3, 0.55, -0.3], [3.3, 0.55, -0.3], top]
      : [
          [-halfW, 0, BIN_Z + 0.55],
          [halfW, 0, BIN_Z + 0.55],
          [-halfW, 1.2, BIN_Z],
          [halfW, 1.2, BIN_Z],
          top,
        ];
    const pitch = 0.17;
    for (let dist = 4.5; dist <= 30; dist += 0.25) {
      camera.position.set(0, centerY + Math.sin(pitch) * dist, Math.cos(pitch) * dist);
      camera.lookAt(0, centerY, 0);
      camera.updateMatrixWorld();
      const fits = must.every(([x, y, z]) => {
        probe.set(x, y, z).project(camera);
        return Math.abs(probe.x) <= 0.97 && Math.abs(probe.y) <= 0.95;
      });
      if (fits) break;
    }
    camBase = camera.position.clone();
  }

  /* ---------- loop ---------- */

  view.fit(camera);
  frameCamera();

  const stop = startLoop((dt, time) => {
    if (view.fit(camera)) frameCamera();
    for (const ticker of tickers) ticker(time, dt);

    if (itemState === "enter") {
      itemT += dt / (reduce ? 0.01 : 0.45);
      const e = easeOut(Math.min(1, itemT));
      if (boss) {
        item.position.set(0, home.y + (1 - e) * 1.1, home.z - (1 - e) * 1.4);
        item.scale.setScalar(ITEM_SIZE * (0.3 + 0.7 * e));
      } else {
        item.position.set(-5.5 * (1 - e), home.y, home.z);
        item.scale.setScalar(ITEM_SIZE);
      }
      if (itemT >= 1) itemState = "idle";
    } else if (itemState === "idle") {
      item.position.set(0, home.y + (reduce ? 0 : Math.sin(time * 2.4) * 0.05), home.z);
      item.material.rotation = reduce ? 0 : Math.sin(time * 1.7) * 0.07;
    } else if (itemState === "shake") {
      itemT += dt / 0.42;
      item.position.x = reduce ? 0 : Math.sin(itemT * Math.PI * 6) * 0.16 * (1 - itemT);
      if (itemT >= 1) itemState = "idle";
    }
    shadowDisc.visible = item.visible;
    shadowDisc.position.x = item.position.x;

    if (fly) {
      fly.t += dt / (reduce ? 0.01 : 0.5);
      const e = Math.min(1, fly.t);
      if (fly.mode === "fly") {
        flyer.position.lerpVectors(fly.from, fly.to, e);
        flyer.position.y += Math.sin(e * Math.PI) * 0.9;
        flyer.scale.setScalar(ITEM_SIZE * (1 - e * 0.62));
        flyer.material.rotation = e * 2.5;
      } else {
        flyer.position.copy(fly.from);
        flyer.position.x += reduce ? 0 : Math.sin(e * Math.PI * 6) * 0.16;
        flyer.scale.setScalar(ITEM_SIZE);
        flyer.material.opacity = 1 - e * e;
        flyer.material.rotation = 0;
      }
      if (e >= 1) {
        flyer.visible = false;
        if (fly.mode === "fly") {
          if (fly.slot) fly.slot.bounce = 0.35;
          burst(fly.to);
        }
        fly = null;
      }
    }

    for (const slot of slots) {
      slot.hold = Math.max(0, slot.hold - dt);
      const goal = slot.hold > 0 || hoverId === slot.id ? 1 : 0;
      slot.open += (goal - slot.open) * Math.min(1, dt * 12);
      slot.bin.setOpen(slot.open);
      slot.bounce = Math.max(0, slot.bounce - dt);
      slot.wobble = Math.max(0, slot.wobble - dt);
      const squash = reduce ? 0 : Math.sin((slot.bounce / 0.35) * Math.PI) * 0.12;
      slot.bin.group.scale.set(1.12 * (1 + squash * 0.6), 1.12 * (1 - squash), 1.12 * (1 + squash * 0.6));
      slot.bin.group.rotation.z = reduce ? 0 : Math.sin(slot.wobble * 32) * 0.13 * (slot.wobble / 0.45);
    }

    for (const crate of crates) {
      crate.pop = Math.max(0, crate.pop - dt);
      const pop = 1 + (reduce ? 0 : Math.sin((crate.pop / 0.4) * Math.PI) * 0.3);
      crate.cube.scale.setScalar(pop);
    }

    if (crossT > 0) {
      crossT -= dt;
      cross.position.y += reduce ? 0 : dt * 0.5;
      cross.material.opacity = Math.min(1, crossT / 0.3);
      if (crossT <= 0) cross.visible = false;
    }

    for (const spark of sparks) {
      if (spark.life <= 0) continue;
      spark.life -= dt;
      spark.velocity.y -= dt * 6;
      spark.sprite.position.addScaledVector(spark.velocity, dt);
      spark.sprite.material.opacity = Math.max(0, spark.life / 0.5);
      spark.sprite.material.rotation += dt * 5;
      if (spark.life <= 0) spark.sprite.visible = false;
    }

    shake = Math.max(0, shake - dt);
    camera.position.copy(camBase);
    if (shake > 0 && !reduce) camera.position.x += Math.sin(shake * 60) * 0.05 * (shake / 0.3);

    view.renderer.render(scene, camera);
  });

  /* ---------- api ---------- */

  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  let started = false;
  let lastEvent = -1;
  let lastItem: string | null = null;

  function pick(clientX: number, clientY: number) {
    const rect = view.canvas.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return null;
    pointer.set(
      ((clientX - rect.left) / rect.width) * 2 - 1,
      -((clientY - rect.top) / rect.height) * 2 + 1,
    );
    raycaster.setFromCamera(pointer, camera);
    const hit = raycaster.intersectObjects(binRoot.children, true)[0];
    return (hit?.object.userData.binId as string | undefined) ?? null;
  }

  return {
    update(props) {
      setBins(props.bins);
      setSteps(props.steps);
      monster?.set(props.shield, props.mood, props.bits);
      const eventN = props.event?.n ?? -1;
      if (started && props.event && eventN !== lastEvent) play(props.event);
      lastEvent = eventN;
      const itemId = props.emoji ? `${props.itemKey}|${props.emoji}` : null;
      if (itemId !== lastItem) {
        lastItem = itemId;
        if (props.emoji) {
          item.material.map = emojiTexture(props.emoji);
          item.material.rotation = 0;
          item.visible = true;
          itemState = "enter";
          itemT = 0;
          item.position.set(boss ? 0 : -5.5, home.y, home.z);
        } else {
          item.visible = false;
          itemState = "hidden";
        }
      }
      started = true;
    },
    pick,
    hover(clientX, clientY) {
      hoverId = pick(clientX, clientY);
      view.canvas.style.cursor = hoverId ? "pointer" : "";
    },
    dispose() {
      stop();
      view.dispose();
    },
  };
}
