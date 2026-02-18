// Camera: orbit, drag-orbit, shake, presets, auto-switch

import * as THREE from 'three';
import { CAM_PRESETS, DRAG_THRESHOLD } from './constants';
import type { FrequencyBands } from './audio';
import type { FxState } from './fx';

export interface MouseState {
  x: number;
  y: number;
  speed: number;
  px: number;
  py: number;
  idle: number;
  down: boolean;
}

export interface DragState {
  active: boolean;
  startX: number;
  startY: number;
  prevX: number;
  prevY: number;
  didDrag: boolean;
  onCanvas: boolean;
  camYOffset: number;
  returnBlend: number;
}

export interface CameraSystem {
  camera: THREE.PerspectiveCamera;
  angle: number;
  radius: number;
  height: number;
  shake: THREE.Vector3;
  preset: number;
  presetTimer: number;
  speed: number;
  mouse: MouseState;
  mouseInfluence: { x: number; y: number };
  drag: DragState;
}

export function createCameraSystem(): CameraSystem {
  const camera = new THREE.PerspectiveCamera(55, typeof window !== 'undefined' ? window.innerWidth / window.innerHeight : 16 / 9, 0.1, 500);
  camera.position.set(16, 5, 0);

  return {
    camera,
    angle: 0,
    radius: 16,
    height: 5,
    shake: new THREE.Vector3(),
    preset: 0,
    presetTimer: 0,
    speed: 1.0,
    mouse: { x: 0, y: 0, speed: 0, px: 0, py: 0, idle: 0, down: false },
    mouseInfluence: { x: 0, y: 0 },
    drag: { active: false, startX: 0, startY: 0, prevX: 0, prevY: 0, didDrag: false, onCanvas: false, camYOffset: 0, returnBlend: 0 },
  };
}

export function handleMouseMove(cam: CameraSystem, clientX: number, clientY: number, w: number, h: number): void {
  cam.mouse.px = cam.mouse.x;
  cam.mouse.py = cam.mouse.y;
  cam.mouse.x = (clientX / w) * 2 - 1;
  cam.mouse.y = (clientY / h) * 2 - 1;
  cam.mouse.speed = Math.hypot(cam.mouse.x - cam.mouse.px, cam.mouse.y - cam.mouse.py);
  cam.mouse.idle = 0;

  if (cam.mouse.down && cam.drag.onCanvas) {
    const dx = clientX - cam.drag.startX;
    const dy = clientY - cam.drag.startY;
    if (!cam.drag.didDrag && Math.hypot(dx, dy) > DRAG_THRESHOLD) {
      cam.drag.didDrag = true;
      cam.drag.active = true;
      cam.drag.prevX = clientX;
      cam.drag.prevY = clientY;
    }
    if (cam.drag.active) {
      const mdx = clientX - cam.drag.prevX;
      const mdy = clientY - cam.drag.prevY;
      cam.angle -= mdx * 0.005;
      cam.drag.camYOffset = Math.max(-6, Math.min(10, cam.drag.camYOffset + mdy * 0.03));
      cam.drag.prevX = clientX;
      cam.drag.prevY = clientY;
    }
  }
}

export function handleDragStart(cam: CameraSystem, clientX: number, clientY: number, onUI: boolean): void {
  cam.mouse.down = true;
  cam.drag.onCanvas = !onUI;
  if (!onUI) {
    cam.drag.startX = clientX;
    cam.drag.startY = clientY;
    cam.drag.didDrag = false;
  }
}

export function handleDragEnd(cam: CameraSystem): { wasDrag: boolean; wasCanvasClick: boolean } {
  cam.mouse.down = false;
  const wasDrag = cam.drag.active;
  const wasCanvasClick = cam.drag.onCanvas && !cam.drag.didDrag;

  if (cam.drag.active) {
    cam.drag.active = false;
    cam.drag.returnBlend = 1.0;
  }
  cam.drag.onCanvas = false;

  return { wasDrag, wasCanvasClick };
}

export function updateCamera(
  cam: CameraSystem,
  dt: number,
  time: number,
  smooth: FrequencyBands,
  isBeat: boolean,
  isHardBeat: boolean,
  fx: FxState,
): void {
  const b = smooth;

  // Mouse influence smoothing
  cam.mouseInfluence.x += (cam.mouse.x - cam.mouseInfluence.x) * dt * 3;
  cam.mouseInfluence.y += (cam.mouse.y - cam.mouseInfluence.y) * dt * 3;
  cam.mouse.idle += dt;

  // Drag return blend
  if (!cam.drag.active) {
    cam.drag.returnBlend *= Math.exp(-dt * 4);
    if (cam.drag.returnBlend < 0.001) cam.drag.returnBlend = 0;
    cam.drag.camYOffset *= Math.exp(-dt * 2);
    if (Math.abs(cam.drag.camYOffset) < 0.01) cam.drag.camYOffset = 0;
  }

  const autoFactor = cam.drag.active ? 0 : (1 - cam.drag.returnBlend);
  cam.angle += dt * 0.12 * cam.speed * (1 + b.mid * 0.4) * autoFactor;
  if (cam.mouse.idle < 2) cam.angle += cam.mouseInfluence.x * dt * 0.5 * autoFactor;

  // Preset auto-switch on hard beat
  cam.presetTimer += dt;
  if (isHardBeat && cam.presetTimer > 5 && !cam.drag.active) {
    cam.preset = (cam.preset + 1) % 5;
    cam.presetTimer = 0;
  }

  let [tR, tY, tFov] = CAM_PRESETS[cam.preset];
  if (fx.drop > 0) { tR = 5; tFov = 90; }

  cam.radius += (tR - cam.radius) * dt * 0.7;
  cam.height += (tY - cam.height) * dt * 0.7;
  cam.camera.fov += (tFov - cam.camera.fov) * dt * 0.7;
  cam.camera.updateProjectionMatrix();

  // Shake
  if (isBeat) {
    const intensity = isHardBeat ? 0.7 : 0.25;
    cam.shake.set(
      (Math.random() - 0.5) * intensity,
      (Math.random() - 0.5) * intensity * 0.4,
      (Math.random() - 0.5) * intensity,
    );
  }
  cam.shake.multiplyScalar(0.87);

  const yOff = cam.drag.camYOffset;
  cam.camera.position.set(
    Math.cos(cam.angle) * cam.radius + cam.shake.x,
    cam.height + yOff + cam.shake.y + Math.sin(time * 0.25) * 0.4,
    Math.sin(cam.angle) * cam.radius + cam.shake.z,
  );
  cam.camera.lookAt(
    0,
    3.5 + yOff * 0.5 + Math.sin(time * 0.18) * 0.4 + cam.mouseInfluence.y * -1.5,
    0,
  );
}
