// Particle systems + mouse trail logic

import * as THREE from 'three';
import { PARTICLE_COUNT, MAX_TRAILS } from './constants';
import { circleTexture } from './geometries';
import type { FrequencyBands } from './audio';

export interface Trail {
  x: number;
  y: number;
  age: number;
  life: number;
  vx: number;
  vy: number;
}

export interface ParticleSystem {
  points: THREE.Points;
  basePositions: Float32Array;
  burstVelocities: Float32Array;
}

export function buildParticles(): ParticleSystem {
  const n = PARTICLE_COUNT;
  const geo = new THREE.BufferGeometry();
  const pos = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    const t = Math.random() * Math.PI * 2;
    const p = Math.acos(2 * Math.random() - 1);
    const r = 2 + Math.random() * 28;
    pos[i * 3] = r * Math.sin(p) * Math.cos(t);
    pos[i * 3 + 1] = r * Math.sin(p) * Math.sin(t) * 0.6 + 3.5;
    pos[i * 3 + 2] = r * Math.cos(p);
  }
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));

  const points = new THREE.Points(geo, new THREE.PointsMaterial({
    color: 0xFFD700, size: 0.5, map: circleTexture(),
    transparent: true, opacity: 0.15,
    blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true,
  }));

  return {
    points,
    basePositions: pos.slice(),
    burstVelocities: new Float32Array(n * 3),
  };
}

export function updateParticles(
  ps: ParticleSystem,
  dt: number,
  time: number,
  smooth: FrequencyBands,
  activeColor: THREE.Color,
  burstFx: number,
): void {
  const b = smooth;
  const pos = ps.points.geometry.attributes.position as THREE.BufferAttribute;
  const base = ps.basePositions;
  const vel = ps.burstVelocities;
  const isBurst = burstFx > 0;

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const bx = base[i * 3], by = base[i * 3 + 1], bz = base[i * 3 + 2];
    const dist = Math.sqrt(bx * bx + (by - 3.5) * (by - 3.5) + bz * bz);
    const near = Math.max(0, 1 - dist / 15);
    const far = Math.min(1, dist / 10);

    if (isBurst && burstFx > 0.9) {
      vel[i * 3] = (bx / dist) * 2 * Math.random();
      vel[i * 3 + 1] = (by / dist) * 2 * Math.random();
      vel[i * 3 + 2] = (bz / dist) * 2 * Math.random();
    }

    const wave = Math.sin(time * 2 + dist * 0.5) * b.mid * 2 * near;
    const spark = Math.sin(time * 8 + i * 0.1) * b.high * 2.5 * far;

    (pos.array as Float32Array)[i * 3] = bx + Math.sin(time * 0.3 + i) * (0.15 + b.bass * near * 2) + vel[i * 3] * burstFx;
    (pos.array as Float32Array)[i * 3 + 1] = by + wave + spark * 0.5 + vel[i * 3 + 1] * burstFx;
    (pos.array as Float32Array)[i * 3 + 2] = bz + Math.cos(time * 0.3 + i) * (0.15 + b.bass * near * 2) + vel[i * 3 + 2] * burstFx;
  }
  pos.needsUpdate = true;

  const mat = ps.points.material as THREE.PointsMaterial;
  mat.color.copy(activeColor);
  mat.opacity = 0.08 + b.high * 0.12;
  mat.size = 0.3 + b.energy * 0.6;
  ps.points.rotation.y += dt * 0.015;
}

export function updateTrails(
  trails: Trail[],
  dt: number,
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  activeColor: THREE.Color,
): void {
  ctx.clearRect(0, 0, w, h);
  for (let i = trails.length - 1; i >= 0; i--) {
    const t = trails[i];
    t.age += dt;
    t.x += t.vx;
    t.y += t.vy;
    t.vy += 0.3;
    if (t.age > t.life) { trails.splice(i, 1); continue; }
    const alpha = 1 - t.age / t.life;
    const size = 3 * alpha;
    ctx.beginPath();
    ctx.arc(t.x, t.y, size, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(${Math.floor(activeColor.r * 255)},${Math.floor(activeColor.g * 255)},${Math.floor(activeColor.b * 255)},${alpha * 0.6})`;
    ctx.fill();
  }
  if (trails.length > MAX_TRAILS) trails.splice(0, trails.length - MAX_TRAILS);
}
