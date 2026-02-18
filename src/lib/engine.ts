// Main orchestrator: owns Three.js scene, renderer, composer.
// Exposes init(), update(), dispose(), handle*() methods.
// NO DOM event listeners — those come from React.

import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';

import { AudioAnalyzer } from './audio';
import {
  PALETTE_HEX, BLOOM_STRENGTH, BLOOM_RADIUS, BLOOM_THRESHOLD,
  FOG_DENSITY, FOG_COLOR, TONE_MAPPING_EXPOSURE,
  AMBIENT_COLOR, AMBIENT_INTENSITY, LIGHT_POSITIONS,
  POINT_LIGHT_INTENSITY, POINT_LIGHT_DISTANCE, POINT_LIGHT_DECAY,
  PARTICLE_COUNT, BAND_KEYS,
} from './constants';
import { FLOOR_VERTEX, FLOOR_FRAGMENT, POST_FX_VERTEX, POST_FX_FRAGMENT } from './shaders';
import {
  buildFlowerOfLife, buildCrosses, buildBitcoins, buildLasers,
  buildRings, buildPillars, buildStarfield,
  type FlowerCircle,
} from './geometries';
import { buildParticles, updateParticles, updateTrails, type ParticleSystem, type Trail } from './particles';
import { createFxState, updateFx, triggerFx, type FxState } from './fx';
import { createCameraSystem, updateCamera, handleMouseMove, handleDragStart, handleDragEnd, type CameraSystem } from './camera';

export class LiteshowEngine {
  audio = new AudioAnalyzer();
  private clock = new THREE.Clock();
  time = 0;
  private running = false;
  private animId = 0;

  // Three.js core
  private renderer!: THREE.WebGLRenderer;
  private scene!: THREE.Scene;
  private composer!: EffectComposer;
  private bloomPass!: UnrealBloomPass;
  private fxPass!: ShaderPass;
  cam!: CameraSystem;

  // Palettes
  private palettes: THREE.Color[][] = [];
  paletteIdx = 0;
  private colorIdx = 0;
  private colorT = 0;
  activeColor = new THREE.Color(0xFFD700);
  private accentColor = new THREE.Color(0xFFF8DC);
  private _targetActive = new THREE.Color(0xFFD700);
  private _targetAccent = new THREE.Color(0xFFF8DC);

  // Visual elements
  private flowerGroup!: THREE.Group;
  private flowerCircles: FlowerCircle[] = [];
  private metatronLines!: THREE.LineSegments;
  private metatronDots!: THREE.Points;
  private outerCircle!: THREE.Line;
  private sacredGlow!: THREE.Mesh;
  private crosses: THREE.Group[] = [];
  private bitcoins: THREE.Sprite[] = [];
  private lasers: THREE.Mesh[] = [];
  private particleSys!: ParticleSystem;
  private rings: THREE.Mesh[] = [];
  private pillars: THREE.Mesh[] = [];
  private pointLights: THREE.PointLight[] = [];
  private starfield!: THREE.Points;
  private floor!: THREE.Mesh;

  // Effects
  fx: FxState = createFxState();
  private sacredScale = 1.0;
  beatFlash = 0;
  private camSpeed = 1.0;
  private bloomStrength = BLOOM_STRENGTH;

  // Trails
  private trailCtx: CanvasRenderingContext2D | null = null;
  private trailCanvas: HTMLCanvasElement | null = null;
  trails: Trail[] = [];

  // UI state
  uiIdle = 0;

  init(canvas: HTMLCanvasElement, trailCanvas: HTMLCanvasElement) {
    // Build palettes from hex
    this.palettes = PALETTE_HEX.map(pal => pal.map(hex => new THREE.Color(hex)));

    // Renderer
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = TONE_MAPPING_EXPOSURE;

    // Camera
    this.cam = createCameraSystem();

    // Scene
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(FOG_COLOR, FOG_DENSITY);
    this.scene.background = new THREE.Color(0x000000);

    // Starfield
    this.starfield = buildStarfield();
    this.scene.add(this.starfield);

    // Post-processing
    this.composer = new EffectComposer(this.renderer);
    this.composer.addPass(new RenderPass(this.scene, this.cam.camera));
    this.bloomPass = new UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      BLOOM_STRENGTH, BLOOM_RADIUS, BLOOM_THRESHOLD,
    );
    this.composer.addPass(this.bloomPass);

    const shader = {
      uniforms: { tDiffuse: { value: null }, uChroma: { value: 0 }, uVig: { value: 0.5 }, uDivine: { value: 0 } },
      vertexShader: POST_FX_VERTEX,
      fragmentShader: POST_FX_FRAGMENT,
    };
    this.fxPass = new ShaderPass(shader);
    this.composer.addPass(this.fxPass);

    // Build geometry
    const flower = buildFlowerOfLife();
    this.flowerGroup = flower.group;
    this.flowerCircles = flower.circles;
    this.metatronLines = flower.metatronLines;
    this.metatronDots = flower.metatronDots;
    this.outerCircle = flower.outerCircle;
    this.sacredGlow = flower.sacredGlow;
    this.scene.add(this.flowerGroup);
    this.scene.add(this.sacredGlow);

    this.crosses = buildCrosses();
    this.crosses.forEach(c => this.scene.add(c));

    this.bitcoins = buildBitcoins();
    this.bitcoins.forEach(b => this.scene.add(b));

    this.lasers = buildLasers();
    this.lasers.forEach(l => this.scene.add(l));

    this.particleSys = buildParticles();
    this.scene.add(this.particleSys.points);

    this.rings = buildRings();
    this.rings.forEach(r => this.scene.add(r));

    this.pillars = buildPillars();
    this.pillars.forEach(p => this.scene.add(p));

    // Floor
    const floorMat = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false,
      uniforms: { uTime: { value: 0 }, uBass: { value: 0 }, uColor: { value: new THREE.Color(0xFFD700) } },
      vertexShader: FLOOR_VERTEX,
      fragmentShader: FLOOR_FRAGMENT,
    });
    this.floor = new THREE.Mesh(new THREE.PlaneGeometry(130, 130), floorMat);
    this.floor.rotation.x = -Math.PI / 2;
    this.floor.position.y = -2;
    this.scene.add(this.floor);

    // Lights
    this.scene.add(new THREE.AmbientLight(AMBIENT_COLOR, AMBIENT_INTENSITY));
    this.pointLights = [];
    for (const p of LIGHT_POSITIONS) {
      const l = new THREE.PointLight(0xFFD700, POINT_LIGHT_INTENSITY, POINT_LIGHT_DISTANCE, POINT_LIGHT_DECAY);
      l.position.set(...p);
      this.scene.add(l);
      this.pointLights.push(l);
    }

    // Trail canvas
    this.trailCanvas = trailCanvas;
    this.trailCanvas.width = window.innerWidth;
    this.trailCanvas.height = window.innerHeight;
    this.trailCtx = this.trailCanvas.getContext('2d')!;
  }

  start() {
    if (this.running) return;
    this.running = true;
    this.clock.start();
    const loop = () => {
      if (!this.running) return;
      this.animId = requestAnimationFrame(loop);
      this.update();
    };
    loop();
  }

  stop() {
    this.running = false;
    cancelAnimationFrame(this.animId);
  }

  dispose() {
    this.stop();
    this.renderer?.dispose();
    this.scene?.traverse(obj => {
      if (obj instanceof THREE.Mesh) {
        obj.geometry?.dispose();
        if (Array.isArray(obj.material)) obj.material.forEach(m => m.dispose());
        else obj.material?.dispose();
      }
    });
  }

  handleResize(w: number, h: number) {
    this.cam.camera.aspect = w / h;
    this.cam.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
    this.composer.setSize(w, h);
    if (this.trailCanvas) {
      this.trailCanvas.width = w;
      this.trailCanvas.height = h;
    }
  }

  handleMouseMove(clientX: number, clientY: number, w: number, h: number) {
    handleMouseMove(this.cam, clientX, clientY, w, h);
    this.uiIdle = 0;
  }

  handleDragStart(clientX: number, clientY: number, onUI: boolean) {
    handleDragStart(this.cam, clientX, clientY, onUI);
  }

  handleDragEnd(): { wasDrag: boolean; wasCanvasClick: boolean } {
    return handleDragEnd(this.cam);
  }

  handleBeat() {
    this.audio.isBeat = true;
    this.audio.isHardBeat = true;
    this.audio.timeSinceBeat = 0;
  }

  triggerFx(name: string) {
    triggerFx(this.fx, name as import('./constants').FxName);
  }

  addTrail(clientX: number, clientY: number) {
    if (this.audio.isPlaying && this.cam.mouse.speed > 0.005) {
      for (let i = 0; i < 3; i++) {
        this.trails.push({
          x: clientX + (Math.random() - 0.5) * 10,
          y: clientY + (Math.random() - 0.5) * 10,
          age: 0,
          life: 0.8 + Math.random() * 0.5,
          vx: (Math.random() - 0.5) * 2,
          vy: (Math.random() - 0.5) * 2 - 1,
        });
      }
    }
  }

  private update() {
    const dt = Math.min(this.clock.getDelta(), 0.05);
    this.time += dt;

    this.audio.update(dt);
    this.updateAutoParams(dt);
    updateFx(this.fx, dt);
    this.updateColors(dt);
    this.updateFlower(dt);
    this.updateCrosses(dt);
    this.updateBitcoins(dt);
    this.updateLasers(dt);
    updateParticles(this.particleSys, dt, this.time, this.audio.smooth, this.activeColor, this.fx.burst);
    this.updateRings(dt);
    this.updatePillars(dt);
    this.updateFloor();
    this.updateLights();
    updateCamera(this.cam, dt, this.time, this.audio.smooth, this.audio.isBeat, this.audio.isHardBeat, this.fx);
    this.updatePostFX();
    this.updateBeatFlash();

    if (this.trailCtx && this.trailCanvas) {
      updateTrails(this.trails, dt, this.trailCtx, this.trailCanvas.width, this.trailCanvas.height, this.activeColor);
    }

    this.starfield.rotation.y += dt * 0.003;
    this.uiIdle += dt;
    this.composer.render();
  }

  // --- Update subsystems (private) ---

  private updateAutoParams(dt: number) {
    const t = this.time;
    const e = this.audio.smooth.energy || 0;
    const bass = this.audio.smooth.bass || 0;
    this.audio.sensitivity = 0.8 + Math.sin(t * 0.07) * 0.15 + e * 0.15;
    this.bloomStrength = 0.2 + Math.sin(t * 0.11) * 0.08 + bass * 0.1;
    this.cam.speed = 0.8 + Math.sin(t * 0.05) * 0.4 + e * 0.6;
    this.sacredScale = 1.0 + Math.sin(t * 0.09) * 0.15 + (this.audio.smooth.subBass || 0) * 0.2;
  }

  private updateColors(dt: number) {
    const pal = this.palettes[this.paletteIdx];
    if (!pal) return;
    this.colorT += dt * 0.06;
    if (this.audio.isHardBeat) this.colorT += 0.15;
    if (this.fx.color > 0) this.colorT += dt * 3;
    if (this.colorT >= 1) { this.colorT -= 1; this.colorIdx = (this.colorIdx + 1) % pal.length; }
    const c1 = pal[this.colorIdx], c2 = pal[(this.colorIdx + 1) % pal.length];
    this._targetActive.copy(c1).lerp(c2, this.colorT);
    this._targetAccent.copy(c2).lerp(c1, this.colorT);
    const colorRate = 1 - Math.exp(-dt * 5);
    this.activeColor.lerp(this._targetActive, colorRate);
    this.accentColor.lerp(this._targetAccent, colorRate);
  }

  private updateFlower(dt: number) {
    const b = this.audio.smooth;
    const scale = this.sacredScale * (1 + b.subBass * 0.25);
    const spinMult = this.fx.freeze > 0 ? 0.05 : (1 + (this.fx.spin > 0 ? 8 : 0));
    this.flowerGroup.scale.setScalar(scale);
    const children = this.flowerGroup.children;
    for (let i = 0; i < children.length - 2; i++) {
      children[i].rotation.z += dt * (0.03 + i * 0.02) * spinMult * (i % 2 ? -1 : 1) * (1 + b.mid);
    }
    const divineBoost = this.fx.divine > 0 ? 2 : 0;
    for (const fc of this.flowerCircles) {
      const dist = Math.hypot(fc.cx, fc.cy);
      const wave = Math.sin(this.time * 2 + dist * 0.8) * 0.15;
      const baseOp = fc.layer === 1 ? 0.2 : 0.08;
      (fc.mesh.material as THREE.LineBasicMaterial).opacity = Math.min(0.4, baseOp + b.energy * 0.12 + wave * 0.5 + divineBoost * 0.08);
      (fc.mesh.material as THREE.LineBasicMaterial).color.copy(this.activeColor);
    }
    (this.metatronLines.material as THREE.LineBasicMaterial).opacity = 0.03 + b.mid * 0.15 + (this.audio.isBeat ? 0.1 : 0);
    (this.metatronLines.material as THREE.LineBasicMaterial).color.copy(this.accentColor);
    const dotMat = this.metatronDots.material as THREE.PointsMaterial;
    dotMat.color.copy(this.activeColor);
    dotMat.opacity = 0.15 + b.energy * 0.2;
    dotMat.size = 0.12 + b.bass * 0.15;
    (this.outerCircle.material as THREE.LineBasicMaterial).color.copy(this.activeColor);
    (this.outerCircle.material as THREE.LineBasicMaterial).opacity = 0.08 + b.bass * 0.2;
    const glowMat = this.sacredGlow.material as THREE.MeshBasicMaterial;
    glowMat.color.copy(this.activeColor);
    glowMat.opacity = 0.02 + b.energy * 0.1 + divineBoost * 0.15;
    this.sacredGlow.scale.setScalar(1 + b.bass * 0.5 + divineBoost);
    this.flowerGroup.rotation.x = this.cam.mouseInfluence.y * 0.3;
    this.flowerGroup.rotation.y += this.cam.mouseInfluence.x * dt * 0.5;
  }

  private updateCrosses(dt: number) {
    const b = this.audio.smooth;
    const freeze = this.fx.freeze > 0 ? 0.05 : 1;
    for (const cross of this.crosses) {
      const ud = cross.userData;
      ud.angle += dt * ud.speed * freeze * (1 + b.mid);
      const r = ud.radius + Math.sin(this.time * 0.5 + ud.phase) * 1.5;
      cross.position.set(Math.cos(ud.angle) * r, ud.baseY + Math.sin(this.time * 0.7 + ud.phase) * 1.5, Math.sin(ud.angle) * r);
      cross.lookAt(this.cam.camera.position);
      cross.scale.setScalar(0.8 + b.bass * 0.8 + (this.audio.isBeat ? 0.5 : 0));
      cross.children.forEach(c => {
        const m = (c as THREE.Mesh).material as THREE.MeshBasicMaterial;
        m.color.copy(this.activeColor);
        m.opacity = 0.1 + b.energy * 0.15;
      });
    }
  }

  private updateBitcoins(dt: number) {
    const b = this.audio.smooth;
    for (const btc of this.bitcoins) {
      const ud = btc.userData;
      ud.angle += dt * ud.speed * (1 + b.highMid);
      const r = ud.radius + Math.sin(this.time * 0.4 + ud.phase) * 2;
      btc.position.set(Math.cos(ud.angle) * r, ud.baseY + Math.sin(this.time * 0.6 + ud.phase) * 2, Math.sin(ud.angle) * r);
      const scale = 1 + b.high * 0.8;
      btc.scale.set(scale, scale, 1);
      btc.material.opacity = 0.1 + b.energy * 0.15;
    }
  }

  private updateLasers(dt: number) {
    const b = this.audio.smooth;
    const bandKeys = BAND_KEYS;
    for (const laser of this.lasers) {
      const ud = laser.userData;
      const bv = b[bandKeys[ud.band] as keyof typeof b] as number;
      const a = ud.baseAngle + this.time * ud.speed * 0.25;
      const r = 9 + Math.sin(this.time * ud.speed + ud.phase) * 2.5;
      laser.position.x = Math.cos(a) * r;
      laser.position.z = Math.sin(a) * r;
      laser.lookAt(
        Math.sin(this.time * 0.25 + ud.phase) * 2,
        3.5 + Math.sin(this.time * 0.4 + ud.phase) * 2.5,
        Math.cos(this.time * 0.25 + ud.phase) * 2,
      );
      laser.rotateX(Math.PI / 2);
      const mat = laser.material as THREE.MeshBasicMaterial;
      mat.opacity = (0.02 + bv * 0.12) * (this.audio.isBeat ? 1.3 : 1);
      mat.color.copy(this.activeColor);
      laser.scale.set(1 + bv * 1.0, 0.5 + bv * 0.4, 1 + bv * 1.0);
    }
  }

  private updateRings(dt: number) {
    const b = this.audio.smooth;
    for (const ring of this.rings) {
      const ud = ring.userData;
      const v = b[ud.band as keyof typeof b] as number;
      ring.rotation[ud.axis as 'x' | 'z'] += dt * ud.speed * (1 + v * 3) * (this.fx.freeze > 0 ? 0.05 : 1);
      ring.scale.setScalar(1 + v * 0.25);
      (ring.material as THREE.MeshBasicMaterial).color.copy(this.activeColor);
      (ring.material as THREE.MeshBasicMaterial).opacity = 0.03 + v * 0.1;
    }
  }

  private updatePillars(dt: number) {
    const b = this.audio.smooth;
    const bandKeys = BAND_KEYS;
    for (const p of this.pillars) {
      const v = b[bandKeys[p.userData.band] as keyof typeof b] as number;
      (p.material as THREE.MeshBasicMaterial).color.copy(this.activeColor);
      (p.material as THREE.MeshBasicMaterial).opacity = 0.006 + v * 0.04;
      p.scale.y = 0.4 + v * 1.2;
      p.scale.x = p.scale.z = 0.7 + v * 0.4;
    }
  }

  private updateFloor() {
    const mat = this.floor.material as THREE.ShaderMaterial;
    mat.uniforms.uTime.value = this.time;
    mat.uniforms.uBass.value = this.audio.smooth.bass;
    mat.uniforms.uColor.value.copy(this.activeColor);
  }

  private updateLights() {
    for (const l of this.pointLights) {
      l.color.copy(this.activeColor);
      l.intensity = 0.3 + this.audio.smooth.energy * 0.5 + (this.fx.divine > 0 ? 0.4 : 0);
    }
  }

  private updatePostFX() {
    this.bloomPass.strength = this.bloomStrength + this.audio.smooth.energy * 0.08 + (this.fx.bloom > 0 ? 0.3 : 0) + (this.fx.divine > 0 ? 0.2 : 0);
    const chTarget = this.audio.isHardBeat ? 4 : this.audio.isBeat ? 1.5 : 0;
    const ch = this.fxPass.uniforms.uChroma;
    ch.value += (chTarget - ch.value) * 0.3;
    ch.value *= 0.9;
    this.fxPass.uniforms.uDivine.value += ((this.fx.divine > 0 ? 1 : 0) - this.fxPass.uniforms.uDivine.value) * 0.1;
  }

  private updateBeatFlash() {
    if (this.fx.strobe > 0) this.beatFlash = Math.sin(this.time * 40) > 0 ? 0.15 : 0;
    else if (this.audio.isHardBeat) this.beatFlash = 0.06;
    else if (this.audio.isBeat) this.beatFlash = Math.max(this.beatFlash, 0.02);
    this.beatFlash *= this.fx.strobe > 0 ? 0.95 : 0.85;
  }

  // Waveform rendering (called from React component)
  renderWaveform(canvas: HTMLCanvasElement) {
    if (!this.audio.isPlaying || !this.audio.timeData) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const data = this.audio.timeData;
    const sliceW = canvas.width / 128;
    ctx.strokeStyle = this.activeColor.getStyle();
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    for (let i = 0; i < 128; i++) {
      const v = data[i * 4] / 128;
      const y = v * canvas.height / 2;
      if (i === 0) ctx.moveTo(0, y); else ctx.lineTo(i * sliceW, y);
    }
    ctx.stroke();
  }
}
