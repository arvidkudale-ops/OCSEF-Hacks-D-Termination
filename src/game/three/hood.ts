import * as THREE from "three";
import { getItem } from "../../data/items";
import { seeded } from "../../lib/random";
import { BIN_LOOKS } from "../art";
import {
  HOUSES,
  SOLIDS,
  TREES,
  WORLD_H,
  WORLD_W,
  paintGround,
} from "../neighborhoodArt";
import type { PaintBin, PaintState } from "../neighborhoodArt";
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
  std,
} from "./kit";
import type { Bin3D } from "./kit";

/**
 * The neighborhood as a 3D world. Game rules still run on the flat map in
 * NeighborhoodLevel. This file only draws that state and turns clicks back
 * into map positions.
 */

/** Map pixels to world units. */
const S = 0.02;

export type HoodPick =
  | { kind: "item"; id: string }
  | { kind: "bin"; id: string }
  | { kind: "ground"; x: number; y: number };

export interface Hood {
  render: (s: PaintState, dt: number) => void;
  pick: (clientX: number, clientY: number, s: PaintState) => HoodPick | null;
  dispose: () => void;
}

export function createHood(host: HTMLElement, bins: PaintBin[]): Hood {
  const view = createView(host, true);
  const reduce = prefersReducedMotion();
  const scene = new THREE.Scene();
  const sky = new THREE.Color("#bfe3f7");
  scene.background = sky;
  scene.fog = new THREE.Fog(sky, 30, 62);
  const camera = new THREE.PerspectiveCamera(42, 1.6, 0.5, 120);

  scene.add(new THREE.HemisphereLight("#ffffff", "#7a9a6a", 1.2));
  const sun = new THREE.DirectionalLight("#fff1d6", 2.5);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.left = -20;
  sun.shadow.camera.right = 20;
  sun.shadow.camera.top = 20;
  sun.shadow.camera.bottom = -20;
  sun.shadow.camera.near = 1;
  sun.shadow.camera.far = 60;
  sun.shadow.bias = -0.0005;
  sun.shadow.normalBias = 0.03;
  scene.add(sun, sun.target);

  const animated: ((time: number) => void)[] = [];
  const at = (x: number, y: number, object: THREE.Object3D, height = 0) => {
    object.position.set(x * S, height, y * S);
    scene.add(object);
    return object;
  };

  /* ---------- ground ---------- */

  const scale = Math.min(1.5, view.renderer.capabilities.maxTextureSize / WORLD_W);
  const groundCanvas = document.createElement("canvas");
  groundCanvas.width = Math.floor(WORLD_W * scale);
  groundCanvas.height = Math.floor(WORLD_H * scale);
  const groundCtx = groundCanvas.getContext("2d");
  if (groundCtx) {
    groundCtx.scale(scale, scale);
    paintGround(groundCtx);
  }
  const groundTexture = new THREE.CanvasTexture(groundCanvas);
  groundTexture.colorSpace = THREE.SRGBColorSpace;
  groundTexture.anisotropy = view.renderer.capabilities.getMaxAnisotropy();
  const ground = mesh(
    new THREE.PlaneGeometry(WORLD_W * S, WORLD_H * S),
    std("#ffffff", { map: groundTexture, roughness: 1 }),
    (WORLD_W * S) / 2,
    0,
    (WORLD_H * S) / 2,
    false,
  );
  ground.rotation.x = -Math.PI / 2;
  scene.add(ground);
  const outer = mesh(
    new THREE.PlaneGeometry(500, 500),
    std("#86b96a", { roughness: 1 }),
    (WORLD_W * S) / 2,
    -0.03,
    (WORLD_H * S) / 2,
    false,
  );
  outer.rotation.x = -Math.PI / 2;
  scene.add(outer);

  /* ---------- buildings ---------- */

  const glass = std("#bfe0f2", { roughness: 0.2, metalness: 0.1 });
  const trim = std("#fef3c7");
  const doorMat = std("#7c4a2d");

  // Homes sit between the camera and the street, so each one turns see-through
  // while the player is standing behind it.
  const homes = SOLIDS.slice(0, 3).map((solid, index) => {
    const [, , wall, roof] = HOUSES[index];
    const house = makeHouse(solid.w * S, solid.h * S, 1.7, wall, roof);
    at(solid.x + solid.w / 2, solid.y + solid.h / 2, house);
    const materials = new Set<THREE.Material>();
    house.traverse((child) => {
      if (child instanceof THREE.Mesh) materials.add(child.material);
    });
    for (const material of materials) material.transparent = true;
    return { solid, materials, opacity: 1 };
  });

  {
    const solid = SOLIDS[3];
    const w = solid.w * S;
    const d = solid.h * S;
    const cafe = new THREE.Group();
    cafe.add(box(w, 2, d, std("#f6e9d6"), 0, 1, 0));
    cafe.add(box(w + 0.3, 0.26, d + 0.3, std("#8b3a3a"), 0, 2.13, 0));
    for (const x of [-2.6, -1.25, 2]) {
      cafe.add(box(1.12, 0.86, 0.05, doorMat, x, 1.05, d / 2 + 0.01, false));
      cafe.add(box(1, 0.74, 0.06, glass, x, 1.05, d / 2 + 0.02, false));
    }
    cafe.add(box(0.8, 1.3, 0.06, doorMat, 0.5, 0.65, d / 2 + 0.02, false));
    const stripes = document.createElement("canvas");
    stripes.width = 64;
    stripes.height = 8;
    const ctx = stripes.getContext("2d");
    if (ctx) {
      ctx.fillStyle = "#fff7ed";
      ctx.fillRect(0, 0, 64, 8);
      ctx.fillStyle = "#dc2626";
      ctx.fillRect(0, 0, 32, 8);
    }
    const awningTexture = new THREE.CanvasTexture(stripes);
    awningTexture.colorSpace = THREE.SRGBColorSpace;
    awningTexture.wrapS = THREE.RepeatWrapping;
    awningTexture.repeat.set(7, 1);
    const awning = box(w, 0.07, 1, std("#ffffff", { map: awningTexture }), 0, 1.72, d / 2 + 0.42);
    awning.rotation.x = 0.32;
    cafe.add(awning);
    const sign = labelSprite("CAFE", { lineHeight: 0.46, bg: "#8b3a3a", color: "#fef3c7", border: "#fef3c7" });
    sign.position.set(0, 2.85, 0);
    cafe.add(sign);
    at(solid.x + solid.w / 2, solid.y + solid.h / 2, cafe);
    const shades = ["#16a34a", "#dc2626", "#f59e0b"];
    const tables: [number, number][] = [
      [1100, 262],
      [1250, 270],
      [1385, 228],
    ];
    tables.forEach(([x, y], index) => {
      const set = new THREE.Group();
      set.add(mesh(new THREE.CylinderGeometry(0.36, 0.36, 0.05, 18), std("#f4efe2"), 0, 0.52, 0));
      set.add(mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.6, 8), std("#3f3f46"), 0, 0.8, 0));
      set.add(
        mesh(
          new THREE.ConeGeometry(0.78, 0.36, 8),
          std(shades[index], { flatShading: true }),
          0,
          1.7,
          0,
        ),
      );
      at(x, y, set);
    });
  }

  let flag: THREE.Mesh | null = null;
  {
    const solid = SOLIDS[4];
    const w = solid.w * S;
    const d = solid.h * S;
    const school = new THREE.Group();
    school.add(box(w, 2.6, d, std("#c56a46"), 0, 1.3, 0));
    school.add(box(w + 0.4, 0.3, d + 0.4, std("#24543f"), 0, 2.75, 0));
    for (let i = 0; i < 9; i += 1) {
      if (i === 4) continue;
      const x = -4.8 + i * 1.2;
      school.add(box(0.8, 0.7, 0.05, trim, x, 1.75, d / 2 + 0.01, false));
      school.add(box(0.66, 0.56, 0.06, glass, x, 1.75, d / 2 + 0.02, false));
    }
    school.add(box(0.95, 1.25, 0.06, doorMat, 0, 0.625, d / 2 + 0.02, false));
    const clock = mesh(new THREE.CylinderGeometry(0.33, 0.33, 0.06, 24), trim, 0, 1.95, d / 2 + 0.03, false);
    clock.rotation.x = Math.PI / 2;
    school.add(clock);
    school.add(box(0.03, 0.2, 0.02, std("#1c1917"), 0, 2.04, d / 2 + 0.07, false));
    school.add(box(0.16, 0.03, 0.02, std("#1c1917"), 0.07, 1.95, d / 2 + 0.07, false));
    const sign = labelSprite("SCHOOL", { lineHeight: 0.46, bg: "#24543f", color: "#fef3c7", border: "#fef3c7" });
    sign.position.set(0, 3.55, 0);
    school.add(sign);
    at(solid.x + solid.w / 2, solid.y + solid.h / 2, school);
    const pole = mesh(new THREE.CylinderGeometry(0.04, 0.05, 3.4, 8), std("#9ca3af", { metalness: 0.4 }), 0, 1.7, 0);
    at(2215, 170, pole, 1.7);
    flag = mesh(
      new THREE.PlaneGeometry(0.95, 0.56),
      std("#2d6a4f", { side: THREE.DoubleSide }),
      0,
      0,
      0,
    );
    flag.geometry.translate(0.475, 0, 0);
    at(2216, 170, flag, 3.05);
  }

  // sorting depot: a wall and canopy behind the bins, and the truck
  {
    const depot = new THREE.Group();
    const frame = std("#3f3f46");
    for (const x of [-5.7, 0, 5.7]) depot.add(box(0.16, 2.3, 0.16, frame, x, 1.15, 0));
    depot.add(box(11.9, 0.16, 1.5, std("#24543f"), 0, 2.38, 0.2));
    depot.add(box(11.4, 1.3, 0.1, std("#e2e8e4"), 0, 0.65, -0.3));
    depot.add(box(11.4, 0.2, 0.12, std("#24543f"), 0, 1.2, -0.3));
    const sign = labelSprite("Sorting depot", { lineHeight: 0.48, bg: "#fef3c7", color: "#1b4332", border: "#92400e" });
    sign.position.set(0, 3.1, 0.2);
    depot.add(sign);
    at(1940, 1096, depot);

    const truck = new THREE.Group();
    truck.add(box(2.6, 1.4, 1.5, std("#1e40af", { roughness: 0.5 }), -0.5, 1.05, 0));
    truck.add(box(1.1, 1, 1.5, std("#2563eb", { roughness: 0.5 }), 1.4, 0.85, 0));
    truck.add(box(0.06, 0.42, 1.2, glass, 1.96, 1.02, 0, false));
    const badge = emojiSprite("♻️", 0.8, true);
    badge.position.set(-0.5, 1.1, 0.78);
    truck.add(badge);
    const tyre = new THREE.CylinderGeometry(0.28, 0.28, 0.2, 16);
    for (const x of [-1.3, 0.1, 1.4])
      for (const z of [-0.72, 0.72]) {
        const wheel = mesh(tyre, std("#1c1917"), x, 0.28, z);
        wheel.rotation.x = Math.PI / 2;
        truck.add(wheel);
      }
    // parked beside the bins, clear of where the player stands to sort
    truck.rotation.y = Math.PI / 2;
    at(2292, 1150, truck);
  }

  /* ---------- park and street dressing ---------- */

  const water = mesh(
    new THREE.CircleGeometry(1, 40),
    std("#4aa3d8", { roughness: 0.12, metalness: 0.2, transparent: true, opacity: 0.93 }),
    0,
    0,
    0,
    false,
  );
  water.rotation.x = -Math.PI / 2;
  water.scale.set(72 * S, 45 * S, 1);
  at(430, 300, water, 0.03);
  const rippleMat = new THREE.MeshBasicMaterial({ color: "#ffffff", transparent: true, depthWrite: false });
  const ripple = new THREE.Mesh(new THREE.RingGeometry(0.86, 1, 40), rippleMat);
  ripple.rotation.x = -Math.PI / 2;
  at(450, 308, ripple, 0.045);
  const padMat = std("#3f8a5c");
  for (const [x, y] of [
    [392, 318],
    [470, 286],
    [410, 276],
  ]) {
    const pad = mesh(new THREE.CircleGeometry(0.15, 12), padMat, 0, 0, 0, false);
    pad.rotation.x = -Math.PI / 2;
    at(x, y, pad, 0.04);
  }
  const reedMat = std("#4d7c3a");
  for (const [x, y] of [
    [360, 282],
    [367, 276],
    [372, 288],
    [496, 322],
    [501, 314],
  ])
    at(x, y, mesh(new THREE.CylinderGeometry(0.02, 0.03, 0.6, 5), reedMat), 0.3);

  const benchWood = std("#7c4a2d");
  for (const [x, y] of [
    [250, 420],
    [640, 530],
  ]) {
    const bench = new THREE.Group();
    bench.add(box(1.2, 0.07, 0.36, benchWood, 0, 0.38, 0));
    bench.add(box(1.2, 0.36, 0.06, benchWood, 0, 0.62, -0.16));
    for (const side of [-0.5, 0.5]) bench.add(box(0.07, 0.38, 0.3, std("#3f3f46"), side, 0.19, 0));
    at(x, y, bench);
  }

  const bushGeo = new THREE.IcosahedronGeometry(0.34, 0);
  for (const [x, y] of [
    [560, 120],
    [90, 420],
    [1560, 640],
    [1020, 1200],
    [2330, 1440],
    [760, 1090],
    [1500, 1000],
    [60, 1010],
  ]) {
    const bush = new THREE.Group();
    bush.add(mesh(bushGeo, std("#3f8a5c", { flatShading: true }), -0.24, 0.24, 0));
    bush.add(mesh(bushGeo, std("#3f8a5c", { flatShading: true }), 0.24, 0.24, 0.05));
    bush.add(mesh(bushGeo, std("#4fa06c", { flatShading: true }), 0, 0.4, -0.04));
    at(x, y, bush);
  }

  for (const [label, x, y] of [
    ["Park", 160, 110],
    ["Homes", 790, 1000],
  ] as [string, number, number][]) {
    const post = new THREE.Group();
    post.add(box(0.1, 1, 0.1, std("#6b4f3a"), 0, 0.5, 0));
    const plate = labelSprite(label, { lineHeight: 0.34, bg: "#fef3c7", color: "#1b4332", border: "#92400e" });
    plate.position.set(0, 1.25, 0);
    post.add(plate);
    at(x, y, post);
  }

  const lampMetal = std("#3f3f46", { metalness: 0.4, roughness: 0.5 });
  const bulb = new THREE.MeshBasicMaterial({ color: "#fff7cc" });
  for (const [x, y] of [
    [760, 646],
    [1080, 846],
    [1560, 646],
    [2100, 846],
    [420, 846],
    [1010, 430],
    [830, 1200],
  ]) {
    const lamp = new THREE.Group();
    lamp.add(mesh(new THREE.CylinderGeometry(0.04, 0.06, 2.5, 8), lampMetal, 0, 1.25, 0));
    lamp.add(box(0.5, 0.05, 0.05, lampMetal, 0.2, 2.5, 0));
    lamp.add(mesh(new THREE.SphereGeometry(0.11, 10, 10), bulb, 0.42, 2.42, 0, false));
    at(x, y, lamp);
  }

  for (const [x, y, r] of TREES) {
    const tree = makeTree((r / 30) * 1.35);
    at(x, y, tree);
    if (!reduce) {
      const crown = tree.userData.crown as THREE.Group;
      animated.push((time) => {
        crown.rotation.z = Math.sin(time * 1.3 + x * 0.01) * 0.035;
      });
    }
  }

  // a ring of trees past the edge of the map, drawn as two instanced meshes
  {
    const rand = seeded("border-trees");
    const count = 90;
    const trunks = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.12, 0.18, 1.2, 6), std("#6b4f3a"), count);
    const crowns = new THREE.InstancedMesh(
      new THREE.IcosahedronGeometry(1, 0),
      std("#2f7354", { flatShading: true }),
      count,
    );
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const euler = new THREE.Euler();
    for (let i = 0; i < count; i += 1) {
      const side = i % 4;
      const along = rand();
      const depth = 1.2 + rand() * 9;
      const w = WORLD_W * S;
      const h = WORLD_H * S;
      const x = side === 0 ? -depth : side === 1 ? w + depth : -8 + along * (w + 16);
      const z = side === 2 ? -depth : side === 3 ? h + depth : -8 + along * (h + 16);
      const size = 0.9 + rand() * 0.8;
      m.compose(new THREE.Vector3(x, 0.6 * size, z), q.identity(), new THREE.Vector3(size, size, size));
      trunks.setMatrixAt(i, m);
      euler.set(rand() * 3, rand() * 3, rand() * 3);
      m.compose(
        new THREE.Vector3(x, 1.9 * size, z),
        q.setFromEuler(euler),
        new THREE.Vector3(size * 1.05, size * 1.25, size * 1.05),
      );
      crowns.setMatrixAt(i, m);
    }
    scene.add(trunks, crowns);
  }

  /* ---------- bins ---------- */

  const binModels = new Map<string, { bin: Bin3D; open: number }>();
  for (const entry of bins) {
    const bin = makeBin(BIN_LOOKS[entry.category] ?? BIN_LOOKS.trash);
    bin.group.scale.setScalar(1.3);
    at(entry.x, entry.y, bin.group);
    const label = labelSprite(entry.label, { lineHeight: 0.27 });
    at(entry.x, entry.y, label, 1.72);
    binModels.set(entry.id, { bin, open: 0 });
  }
  const nearRing = new THREE.Mesh(
    new THREE.RingGeometry(0.72, 0.9, 36),
    new THREE.MeshBasicMaterial({ color: "#f59e0b", transparent: true, depthWrite: false }),
  );
  nearRing.rotation.x = -Math.PI / 2;
  nearRing.visible = false;
  scene.add(nearRing);

  /* ---------- player ---------- */

  const player = new THREE.Group();
  const body = new THREE.Group();
  player.add(body);
  player.scale.setScalar(1.25);
  const skin = std("#f3d5b5");
  const shirt = std("#2d6a4f", { roughness: 0.7 });
  body.add(mesh(new THREE.CapsuleGeometry(0.19, 0.26, 6, 14), shirt, 0, 0.62, 0));
  body.add(mesh(new THREE.SphereGeometry(0.17, 18, 14), skin, 0, 1.02, 0));
  body.add(
    mesh(
      new THREE.SphereGeometry(0.185, 18, 10, 0, Math.PI * 2, 0, Math.PI / 2),
      std("#1b4332"),
      0,
      1.05,
      0,
    ),
  );
  body.add(box(0.24, 0.03, 0.17, std("#1b4332"), 0, 1.06, 0.2));
  body.add(mesh(new THREE.SphereGeometry(0.04, 8, 8), std("#52b788"), 0, 1.24, 0));
  body.add(box(0.26, 0.3, 0.13, std("#e9b949"), 0, 0.66, -0.2));
  const eyeMat = std("#1c1917");
  for (const side of [-1, 1])
    body.add(mesh(new THREE.SphereGeometry(0.024, 8, 8), eyeMat, side * 0.065, 1.0, 0.158, false));
  const legs: THREE.Group[] = [];
  const arms: THREE.Group[] = [];
  for (const side of [-1, 1]) {
    const leg = new THREE.Group();
    leg.position.set(side * 0.09, 0.42, 0);
    leg.add(mesh(new THREE.CylinderGeometry(0.065, 0.06, 0.36, 8), std("#334155"), 0, -0.18, 0));
    leg.add(box(0.11, 0.07, 0.19, std("#1c1917"), 0, -0.385, 0.035));
    body.add(leg);
    legs.push(leg);
    const arm = new THREE.Group();
    arm.position.set(side * 0.235, 0.8, 0);
    arm.add(mesh(new THREE.CylinderGeometry(0.05, 0.045, 0.3, 8), shirt, 0, -0.13, 0));
    arm.add(mesh(new THREE.SphereGeometry(0.052, 8, 8), skin, 0, -0.3, 0));
    body.add(arm);
    arms.push(arm);
  }
  scene.add(player);

  const carried = [0, 1, 2].map(() => {
    const sprite = emojiSprite("♻️", 0.5, true);
    sprite.visible = false;
    scene.add(sprite);
    return sprite;
  });

  /* ---------- litter, markers, score pops ---------- */

  const litterModels = new Map<string, { sprite: THREE.Sprite; glow: THREE.Mesh; seed: number }>();
  const glowGeo = new THREE.RingGeometry(0.36, 0.47, 28);
  function litterModel(id: string, itemId: string, x: number) {
    let model = litterModels.get(id);
    if (model) return model;
    const sprite = emojiSprite(getItem(itemId)?.emoji ?? "•", 0.82);
    const glow = new THREE.Mesh(
      glowGeo,
      new THREE.MeshBasicMaterial({ color: "#ffffff", transparent: true, depthWrite: false }),
    );
    glow.rotation.x = -Math.PI / 2;
    scene.add(sprite, glow);
    model = { sprite, glow, seed: x * 0.013 };
    litterModels.set(id, model);
    return model;
  }
  const keyHint = labelSprite("E", { lineHeight: 0.3 });
  keyHint.visible = false;
  scene.add(keyHint);

  const marker = new THREE.Mesh(
    new THREE.RingGeometry(0.3, 0.42, 28),
    new THREE.MeshBasicMaterial({ color: "#f59e0b", transparent: true, depthWrite: false }),
  );
  marker.rotation.x = -Math.PI / 2;
  marker.visible = false;
  scene.add(marker);

  const pops = new Map<object, THREE.Sprite>();

  /* ---------- per-frame ---------- */

  const focus = new THREE.Vector3();
  let placed = false;
  let clock = 0;
  let yaw = 0;
  let stride = 0;
  let lastX = 0;
  let lastY = 0;

  function render(s: PaintState, dt: number) {
    clock += dt;
    const px = s.player.x * S;
    const pz = s.player.y * S;
    if (!placed) {
      placed = true;
      focus.set(px, 0, pz);
      lastX = s.player.x;
      lastY = s.player.y;
    }
    focus.x += (px - focus.x) * (1 - Math.exp(-dt * 6));
    focus.z += (pz - focus.z) * (1 - Math.exp(-dt * 6));
    view.fit(camera);
    const pullBack = camera.aspect < 1.1 ? 1.25 : 1;
    camera.position.set(focus.x, 10.8 * pullBack, focus.z + 9.4 * pullBack);
    camera.lookAt(focus.x, 0.6, focus.z);
    sun.position.set(focus.x + 7, 15, focus.z + 6);
    sun.target.position.set(focus.x, 0, focus.z);

    for (const home of homes) {
      const hidden =
        s.player.x > home.solid.x - 30 &&
        s.player.x < home.solid.x + home.solid.w + 30 &&
        s.player.y > home.solid.y - 140 &&
        s.player.y < home.solid.y + 10;
      home.opacity += ((hidden ? 0.28 : 1) - home.opacity) * Math.min(1, dt * 8);
      for (const material of home.materials) material.opacity = home.opacity;
    }
    for (const run of animated) run(clock);
    if (flag && !reduce) flag.rotation.y = Math.sin(clock * 3) * 0.25;
    if (!reduce) {
      const phase = (clock * 0.5) % 1;
      ripple.scale.set(0.25 + phase * 0.6, 0.18 + phase * 0.35, 1);
      rippleMat.opacity = 0.6 * (1 - phase);
    } else {
      ripple.scale.set(0.5, 0.32, 1);
      rippleMat.opacity = 0.3;
    }

    // player
    const dx = s.player.x - lastX;
    const dy = s.player.y - lastY;
    lastX = s.player.x;
    lastY = s.player.y;
    if (Math.hypot(dx, dy) > 0.05) {
      const want = Math.atan2(dx, dy);
      let turn = want - yaw;
      while (turn > Math.PI) turn -= Math.PI * 2;
      while (turn < -Math.PI) turn += Math.PI * 2;
      yaw += turn * Math.min(1, dt * 14);
    }
    const walking = s.moving && !reduce;
    if (walking) stride += dt * 12;
    const swing = walking ? Math.sin(stride) : 0;
    legs[0].rotation.x = swing * 0.75;
    legs[1].rotation.x = -swing * 0.75;
    arms[0].rotation.x = -swing * 0.65;
    arms[1].rotation.x = swing * 0.65;
    const bob = reduce ? 0 : walking ? Math.abs(Math.sin(stride)) * 0.05 : Math.sin(clock * 3) * 0.012;
    player.position.set(px, 0, pz);
    player.rotation.y = yaw;
    body.position.y = bob;

    carried.forEach((sprite, index) => {
      const id = s.inventory[index];
      const held = id ? s.litters.find((entry) => entry.id === id) : undefined;
      sprite.visible = Boolean(held);
      if (!held) return;
      sprite.material.map = emojiTexture(getItem(held.itemId)?.emoji ?? "•", true);
      sprite.position.set(
        px + (index - (s.inventory.length - 1) / 2) * 0.54,
        2.0 + (reduce ? 0 : Math.sin(clock * 3 + index) * 0.04),
        pz,
      );
    });

    // litter
    keyHint.visible = false;
    for (const entry of s.litters) {
      const model = litterModel(entry.id, entry.itemId, entry.x);
      model.sprite.visible = model.glow.visible = !entry.taken;
      if (entry.taken) continue;
      const near = s.nearItemId === entry.id;
      const hop = reduce ? 0 : Math.sin(clock * 3 + model.seed * 60) * 0.08;
      model.sprite.position.set(entry.x * S, 0.62 + hop, entry.y * S);
      model.sprite.scale.setScalar(near ? 0.98 : 0.82);
      model.glow.position.set(entry.x * S, 0.035, entry.y * S);
      const pulse = reduce ? 0.5 : (Math.sin(clock * 4 + model.seed * 60) + 1) / 2;
      model.glow.scale.setScalar(near ? 1.45 : 1 + pulse * 0.15);
      const glowMat = model.glow.material as THREE.MeshBasicMaterial;
      glowMat.color.set(near ? "#f59e0b" : "#ffffff");
      glowMat.opacity = near ? 0.95 : 0.45 + pulse * 0.35;
      if (near) {
        keyHint.visible = true;
        keyHint.position.set(entry.x * S, 1.42, entry.y * S);
      }
    }

    // bins
    nearRing.visible = false;
    for (const entry of bins) {
      const model = binModels.get(entry.id);
      if (!model) continue;
      const near = s.nearBinId === entry.id;
      model.open += ((near ? 1 : 0) - model.open) * Math.min(1, dt * 10);
      model.bin.setOpen(model.open);
      if (near) {
        const pulse = reduce ? 0.5 : (Math.sin(clock * 5) + 1) / 2;
        nearRing.visible = true;
        nearRing.position.set(entry.x * S, 0.04, entry.y * S);
        nearRing.scale.setScalar(1 + pulse * 0.12);
        nearRing.material.opacity = 0.55 + pulse * 0.35;
      }
    }

    // click-to-walk marker
    marker.visible = Boolean(s.target);
    if (s.target) {
      const pulse = reduce ? 0.5 : (clock * 2) % 1;
      marker.position.set(s.target.x * S, 0.05, s.target.y * S);
      marker.scale.setScalar(0.7 + pulse * 0.9);
      marker.material.opacity = 1 - pulse * 0.8;
    }

    // score pops
    for (const effect of s.effects) {
      let pop = pops.get(effect);
      if (!pop) {
        pop = labelSprite(effect.text, {
          lineHeight: 0.42,
          bg: effect.text.startsWith("+") ? "#1b4332" : "#b91c1c",
        });
        scene.add(pop);
        pops.set(effect, pop);
      }
      pop.position.set(effect.x * S, 2.1 + (reduce ? 0 : effect.age * 1.1), effect.y * S + 0.6);
      pop.material.opacity = Math.max(0, 1 - effect.age / 1.1);
    }
    for (const [effect, pop] of pops) {
      if (s.effects.includes(effect as PaintState["effects"][number])) continue;
      scene.remove(pop);
      pop.material.map?.dispose();
      pop.material.dispose();
      pops.delete(effect);
    }

    view.renderer.render(scene, camera);
  }

  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  const probe = new THREE.Vector3();
  const floorPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);

  function pick(clientX: number, clientY: number, s: PaintState): HoodPick | null {
    const rect = view.canvas.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return null;
    const cx = clientX - rect.left;
    const cy = clientY - rect.top;
    const distance = (x: number, height: number, y: number) => {
      probe.set(x * S, height, y * S).project(camera);
      return Math.hypot((probe.x * 0.5 + 0.5) * rect.width - cx, (-probe.y * 0.5 + 0.5) * rect.height - cy);
    };
    let best: HoodPick | null = null;
    let bestD = 38;
    for (const entry of s.litters) {
      if (entry.taken) continue;
      const d = distance(entry.x, 0.6, entry.y);
      if (d < bestD) {
        bestD = d;
        best = { kind: "item", id: entry.id };
      }
    }
    if (best) return best;
    bestD = 48;
    for (const entry of bins) {
      const d = distance(entry.x, 0.7, entry.y);
      if (d < bestD) {
        bestD = d;
        best = { kind: "bin", id: entry.id };
      }
    }
    if (best) return best;
    pointer.set((cx / rect.width) * 2 - 1, -(cy / rect.height) * 2 + 1);
    raycaster.setFromCamera(pointer, camera);
    if (!raycaster.ray.intersectPlane(floorPlane, probe)) return null;
    const x = probe.x / S;
    const y = probe.z / S;
    if (x < 0 || y < 0 || x > WORLD_W || y > WORLD_H) return null;
    return { kind: "ground", x, y };
  }

  return {
    render,
    pick,
    dispose() {
      view.dispose();
    },
  };
}
