// Sacred geometry builders → THREE.Group or THREE.Mesh per geometry type

import * as THREE from 'three';
import {
  FLOWER_RADIUS, FLOWER_LAYERS, FLOWER_LAYER_Z, FLOWER_LAYER_OPACITY,
  CROSS_COUNT, BITCOIN_COUNT, LASER_COUNT, PILLAR_COUNT, RING_RADII,
  STAR_COUNT,
} from './constants';

// --- Texture helpers ---

export function circleTexture(): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const x = c.getContext('2d')!;
  const g = x.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.25, 'rgba(255,255,255,0.7)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  x.fillStyle = g;
  x.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(c);
}

export function bitcoinTexture(): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const x = c.getContext('2d')!;
  x.clearRect(0, 0, 128, 128);
  x.font = 'bold 90px Arial';
  x.textAlign = 'center';
  x.textBaseline = 'middle';
  x.fillStyle = '#F7931A';
  x.fillText('\u20BF', 64, 68);
  const t = new THREE.CanvasTexture(c);
  t.premultiplyAlpha = true;
  return t;
}

// --- Geometry math helpers ---

export function flowerCenters(R: number, layers: number): { x: number; y: number }[] {
  const pts = [{ x: 0, y: 0 }];
  for (let i = 0; i < 6; i++) {
    const a = i * Math.PI / 3;
    pts.push({ x: Math.cos(a) * R, y: Math.sin(a) * R });
  }
  if (layers >= 2) {
    for (let i = 0; i < 6; i++) {
      const a = i * Math.PI / 3;
      pts.push({ x: Math.cos(a) * R * 2, y: Math.sin(a) * R * 2 });
    }
    for (let i = 0; i < 6; i++) {
      const a = i * Math.PI / 3 + Math.PI / 6;
      const r = R * Math.sqrt(3);
      pts.push({ x: Math.cos(a) * r, y: Math.sin(a) * r });
    }
  }
  return pts;
}

export function circlePoints(R: number, segs = 72): THREE.Vector3[] {
  const pts: THREE.Vector3[] = [];
  for (let i = 0; i <= segs; i++) {
    const t = (i / segs) * Math.PI * 2;
    pts.push(new THREE.Vector3(Math.cos(t) * R, Math.sin(t) * R, 0));
  }
  return pts;
}

// --- Flower of Life ---

export interface FlowerCircle {
  mesh: THREE.Line;
  layer: number;
  cx: number;
  cy: number;
}

export interface FlowerOfLifeResult {
  group: THREE.Group;
  circles: FlowerCircle[];
  outerCircle: THREE.Line;
  sacredGlow: THREE.Mesh;
  metatronLines: THREE.LineSegments;
  metatronDots: THREE.Points;
}

export function buildFlowerOfLife(): FlowerOfLifeResult {
  const group = new THREE.Group();
  group.position.y = 3.5;

  const R = FLOWER_RADIUS;
  const centers = flowerCenters(R, FLOWER_LAYERS);
  const pts = circlePoints(R, 72);
  const circles: FlowerCircle[] = [];

  for (let li = 0; li < 3; li++) {
    const layerGroup = new THREE.Group();
    layerGroup.position.z = FLOWER_LAYER_Z[li];
    layerGroup.rotation.z = li * 0.05;
    for (const c of centers) {
      const geo = new THREE.BufferGeometry().setFromPoints(pts);
      const mat = new THREE.LineBasicMaterial({ color: 0xFFD700, transparent: true, opacity: FLOWER_LAYER_OPACITY[li] });
      const line = new THREE.Line(geo, mat);
      line.position.set(c.x, c.y, 0);
      layerGroup.add(line);
      circles.push({ mesh: line, layer: li, cx: c.x, cy: c.y });
    }
    group.add(layerGroup);
  }

  // Outer circles
  const outerPts = circlePoints(R * 3.1, 120);
  const outerGeo = new THREE.BufferGeometry().setFromPoints(outerPts);
  const outerCircle = new THREE.Line(outerGeo, new THREE.LineBasicMaterial({ color: 0xFFD700, transparent: true, opacity: 0.15 }));
  group.add(outerCircle);

  const outer2Pts = circlePoints(R * 3.3, 120);
  const outer2Geo = new THREE.BufferGeometry().setFromPoints(outer2Pts);
  group.add(new THREE.Line(outer2Geo, new THREE.LineBasicMaterial({ color: 0xFFD700, transparent: true, opacity: 0.08 })));

  // Metatron's Cube
  const nodes = [{ x: 0, y: 0 }];
  for (let i = 0; i < 6; i++) {
    const a = i * Math.PI / 3;
    nodes.push({ x: Math.cos(a) * R, y: Math.sin(a) * R });
  }
  for (let i = 0; i < 6; i++) {
    const a = i * Math.PI / 3;
    nodes.push({ x: Math.cos(a) * R * 2, y: Math.sin(a) * R * 2 });
  }

  const linePoints: THREE.Vector3[] = [];
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      linePoints.push(new THREE.Vector3(nodes[i].x, nodes[i].y, 0));
      linePoints.push(new THREE.Vector3(nodes[j].x, nodes[j].y, 0));
    }
  }
  const lineGeo = new THREE.BufferGeometry().setFromPoints(linePoints);
  const metatronLines = new THREE.LineSegments(lineGeo, new THREE.LineBasicMaterial({ color: 0xFFD700, transparent: true, opacity: 0.06 }));
  group.add(metatronLines);

  const dotGeo = new THREE.BufferGeometry();
  const dotPos = new Float32Array(nodes.length * 3);
  for (let i = 0; i < nodes.length; i++) {
    dotPos[i * 3] = nodes[i].x;
    dotPos[i * 3 + 1] = nodes[i].y;
    dotPos[i * 3 + 2] = 0;
  }
  dotGeo.setAttribute('position', new THREE.BufferAttribute(dotPos, 3));
  const metatronDots = new THREE.Points(dotGeo, new THREE.PointsMaterial({
    color: 0xFFD700, size: 0.15, transparent: true, opacity: 0.2,
    map: circleTexture(), blending: THREE.AdditiveBlending, depthWrite: false,
  }));
  group.add(metatronDots);

  // Sacred glow
  const sacredGlow = new THREE.Mesh(
    new THREE.SphereGeometry(4.5, 24, 24),
    new THREE.MeshBasicMaterial({ color: 0xFFD700, transparent: true, opacity: 0.04, side: THREE.BackSide }),
  );
  sacredGlow.position.y = 3.5;

  return { group, circles, outerCircle, sacredGlow, metatronLines, metatronDots };
}

// --- Crosses ---

export interface CrossData {
  group: THREE.Group;
}

export function buildCrosses(): THREE.Group[] {
  const crosses: THREE.Group[] = [];
  const vertGeo = new THREE.BoxGeometry(0.08, 0.7, 0.04);
  const horizGeo = new THREE.BoxGeometry(0.42, 0.08, 0.04);

  for (let i = 0; i < CROSS_COUNT; i++) {
    const mat = new THREE.MeshBasicMaterial({ color: 0xFFD700, transparent: true, opacity: 0.15, blending: THREE.AdditiveBlending, depthWrite: false });
    const group = new THREE.Group();
    const vert = new THREE.Mesh(vertGeo, mat);
    const horiz = new THREE.Mesh(horizGeo, mat.clone());
    horiz.position.y = 0.14;
    group.add(vert, horiz);
    const angle = (i / CROSS_COUNT) * Math.PI * 2;
    const r = 7 + (i % 3) * 3;
    const y = 2 + Math.sin(i * 1.3) * 3;
    group.position.set(Math.cos(angle) * r, y, Math.sin(angle) * r);
    group.userData = { angle, radius: r, baseY: y, speed: 0.15 + Math.random() * 0.25, phase: Math.random() * Math.PI * 2 };
    crosses.push(group);
  }
  return crosses;
}

// --- Bitcoins ---

export function buildBitcoins(): THREE.Sprite[] {
  const bitcoins: THREE.Sprite[] = [];
  const btcTex = bitcoinTexture();
  const btcMat = new THREE.SpriteMaterial({ map: btcTex, transparent: true, opacity: 0.12, blending: THREE.AdditiveBlending, depthWrite: false });

  for (let i = 0; i < BITCOIN_COUNT; i++) {
    const sprite = new THREE.Sprite(btcMat.clone());
    sprite.scale.set(1.2, 1.2, 1);
    const angle = (i / BITCOIN_COUNT) * Math.PI * 2 + 0.3;
    const r = 10 + (i % 2) * 4;
    const y = 1 + Math.sin(i * 2.1) * 4;
    sprite.position.set(Math.cos(angle) * r, y, Math.sin(angle) * r);
    sprite.userData = { angle, radius: r, baseY: y, speed: 0.1 + Math.random() * 0.2, phase: Math.random() * Math.PI * 2 };
    bitcoins.push(sprite);
  }
  return bitcoins;
}

// --- Lasers ---

export function buildLasers(): THREE.Mesh[] {
  const lasers: THREE.Mesh[] = [];
  const geo = new THREE.CylinderGeometry(0.015, 0.05, 35, 6, 1, true);

  for (let i = 0; i < LASER_COUNT; i++) {
    const mat = new THREE.MeshBasicMaterial({ color: 0xFFD700, transparent: true, opacity: 0.06, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, depthWrite: false });
    const laser = new THREE.Mesh(geo, mat);
    const a = (i / LASER_COUNT) * Math.PI * 2;
    laser.position.set(Math.cos(a) * 9, 16, Math.sin(a) * 9);
    laser.lookAt(0, 3.5, 0);
    laser.rotateX(Math.PI / 2);
    laser.userData = { baseAngle: a, speed: 0.2 + Math.random() * 0.5, phase: Math.random() * Math.PI * 2, band: i % 6 };
    lasers.push(laser);
  }
  return lasers;
}

// --- Rings ---

export function buildRings(): THREE.Mesh[] {
  const rings: THREE.Mesh[] = [];
  for (let i = 0; i < 4; i++) {
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(RING_RADII[i], 0.025, 8, 120),
      new THREE.MeshBasicMaterial({ color: 0xFFD700, transparent: true, opacity: 0.06, blending: THREE.AdditiveBlending, depthWrite: false }),
    );
    ring.position.y = 3.5;
    ring.rotation.x = Math.PI / 2 + (i * 0.18 - 0.27);
    ring.userData = { speed: (0.15 + i * 0.12) * (i % 2 ? 1 : -1), axis: i % 2 ? 'z' : 'x', band: ['subBass', 'bass', 'mid', 'high'][i] };
    rings.push(ring);
  }
  return rings;
}

// --- Pillars ---

export function buildPillars(): THREE.Mesh[] {
  const pillars: THREE.Mesh[] = [];
  const geo = new THREE.CylinderGeometry(0.25, 0.7, 22, 8, 1, true);

  for (let i = 0; i < PILLAR_COUNT; i++) {
    const a = (i / PILLAR_COUNT) * Math.PI * 2;
    const pillar = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: 0xFFD700, transparent: true, opacity: 0.04, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, depthWrite: false }));
    pillar.position.set(Math.cos(a) * 16, 9, Math.sin(a) * 16);
    pillar.userData = { band: i % 6 };
    pillars.push(pillar);
  }
  return pillars;
}

// --- Starfield ---

export function buildStarfield(): THREE.Points {
  const sg = new THREE.BufferGeometry();
  const sp = new Float32Array(STAR_COUNT * 3);
  const starSizes = new Float32Array(STAR_COUNT);
  const starColors = new Float32Array(STAR_COUNT * 3);

  for (let i = 0; i < STAR_COUNT; i++) {
    const t = Math.random() * Math.PI * 2;
    const p = Math.acos(2 * Math.random() - 1);
    const r = 40 + Math.random() * 180;
    sp[i * 3] = r * Math.sin(p) * Math.cos(t);
    sp[i * 3 + 1] = r * Math.sin(p) * Math.sin(t) * 0.6 + 10;
    sp[i * 3 + 2] = r * Math.cos(p);
    starSizes[i] = Math.random() < 0.05 ? 1.5 + Math.random() * 1.5 : 0.15 + Math.random() * 0.6;
    const temp = Math.random();
    if (temp < 0.6) { starColors[i * 3] = 0.9; starColors[i * 3 + 1] = 0.92; starColors[i * 3 + 2] = 1.0; }
    else if (temp < 0.8) { starColors[i * 3] = 0.7; starColors[i * 3 + 1] = 0.75; starColors[i * 3 + 2] = 1.0; }
    else if (temp < 0.92) { starColors[i * 3] = 1.0; starColors[i * 3 + 1] = 0.85; starColors[i * 3 + 2] = 0.6; }
    else { starColors[i * 3] = 1.0; starColors[i * 3 + 1] = 0.95; starColors[i * 3 + 2] = 0.8; }
  }

  sg.setAttribute('position', new THREE.BufferAttribute(sp, 3));
  sg.setAttribute('size', new THREE.BufferAttribute(starSizes, 1));
  sg.setAttribute('color', new THREE.BufferAttribute(starColors, 3));

  return new THREE.Points(sg, new THREE.PointsMaterial({ size: 0.4, vertexColors: true, transparent: true, opacity: 0.85, sizeAttenuation: true }));
}
