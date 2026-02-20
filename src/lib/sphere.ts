// Pulsing 3D sphere centerpiece — three-layer energy orb
// Inner orb + wireframe overlay + glow halo

import * as THREE from 'three';
import type { FrequencyBands } from './audio';
import type { FxState } from './fx';
import {
  SPHERE_RADIUS, SPHERE_DETAIL, SPHERE_WIREFRAME_DETAIL,
  SPHERE_PULSE_BASS, SPHERE_PULSE_SUBBASS, SPHERE_DISPLACEMENT_AMP,
  SPHERE_FRESNEL_POWER, SPHERE_FRESNEL_INTENSITY, SPHERE_BEAT_PUNCH,
  SPHERE_HARD_BEAT_PUNCH, SPHERE_NOISE_SPEED, SPHERE_EMISSIVE_BASE,
  SPHERE_EMISSIVE_ENERGY, SPHERE_WIREFRAME_OPACITY, SPHERE_WIREFRAME_BEAT_BOOST,
  SPHERE_Y,
} from './constants';

// --- Interface ---

export interface PulseSphere {
  group: THREE.Group;
  inner: THREE.Mesh;
  wireframe: THREE.Mesh;
  glow: THREE.Mesh;
  beatPunch: number;   // current beat punch (decays each frame)
  rotationY: number;
}

// --- GLSL: Simplex 3D noise (Ashima) ---

const NOISE_3D = /* glsl */ `
vec3 mod289(vec3 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 mod289(vec4 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 permute(vec4 x){return mod289(((x*34.0)+1.0)*x);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-0.85373472095314*r;}

float snoise(vec3 v){
  const vec2 C=vec2(1.0/6.0,1.0/3.0);
  const vec4 D=vec4(0.0,0.5,1.0,2.0);
  vec3 i=floor(v+dot(v,C.yyy));
  vec3 x0=v-i+dot(i,C.xxx);
  vec3 g=step(x0.yzx,x0.xyz);
  vec3 l=1.0-g;
  vec3 i1=min(g.xyz,l.zxy);
  vec3 i2=max(g.xyz,l.zxy);
  vec3 x1=x0-i1+C.xxx;
  vec3 x2=x0-i2+C.yyy;
  vec3 x3=x0-D.yyy;
  i=mod289(i);
  vec4 p=permute(permute(permute(
    i.z+vec4(0.0,i1.z,i2.z,1.0))
    +i.y+vec4(0.0,i1.y,i2.y,1.0))
    +i.x+vec4(0.0,i1.x,i2.x,1.0));
  float n_=0.142857142857;
  vec3 ns=n_*D.wyz-D.xzx;
  vec4 j=p-49.0*floor(p*ns.z*ns.z);
  vec4 x_=floor(j*ns.z);
  vec4 y_=floor(j-7.0*x_);
  vec4 x=x_*ns.x+ns.yyyy;
  vec4 y=y_*ns.x+ns.yyyy;
  vec4 h=1.0-abs(x)-abs(y);
  vec4 b0=vec4(x.xy,y.xy);
  vec4 b1=vec4(x.zw,y.zw);
  vec4 s0=floor(b0)*2.0+1.0;
  vec4 s1=floor(b1)*2.0+1.0;
  vec4 sh=-step(h,vec4(0.0));
  vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy;
  vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
  vec3 p0=vec3(a0.xy,h.x);
  vec3 p1=vec3(a0.zw,h.y);
  vec3 p2=vec3(a1.xy,h.z);
  vec3 p3=vec3(a1.zw,h.w);
  vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
  p0*=norm.x;p1*=norm.y;p2*=norm.z;p3*=norm.w;
  vec4 m=max(0.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.0);
  m=m*m;
  return 42.0*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
}
`;

// --- Inner orb vertex shader ---

const SPHERE_VERTEX = /* glsl */ `
${NOISE_3D}

uniform float uTime;
uniform float uSubBass;
uniform float uBass;
uniform float uMid;
uniform float uHigh;
uniform float uEnergy;
uniform float uDisplacementAmp;
uniform float uNoiseSpeed;

varying vec3 vNormal;
varying vec3 vWorldPos;
varying float vDisplacement;
varying float vNY;

void main() {
  vNormal = normalize(normalMatrix * normal);
  vNY = normal.y;

  // Band-mapped latitude zones
  float bassZone = pow(1.0 - abs(normal.y), 1.5);
  float highZone = pow(abs(normal.y), 2.0);
  float midZone = pow(1.0 - abs(abs(normal.y) - 0.5) * 2.0, 1.5);
  float subBassZone = 1.0; // everywhere

  // Noise-based displacement
  float n = snoise(normal * 2.0 + uTime * uNoiseSpeed) * 0.5 + 0.5;
  float n2 = snoise(normal * 4.0 - uTime * uNoiseSpeed * 0.7) * 0.5 + 0.5;

  // Combine bands
  float disp = 0.0;
  disp += uSubBass * subBassZone * 0.3;
  disp += uBass * bassZone * 0.5;
  disp += uMid * midZone * n * 0.4;
  disp += uHigh * highZone * n2 * 0.6;
  disp += uEnergy * n * 0.2;
  disp *= uDisplacementAmp;

  vDisplacement = disp;

  vec3 displaced = position + normal * disp;
  vWorldPos = (modelMatrix * vec4(displaced, 1.0)).xyz;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(displaced, 1.0);
}
`;

// --- Inner orb fragment shader ---

const SPHERE_FRAGMENT = /* glsl */ `
uniform vec3 uColor;
uniform vec3 uAccentColor;
uniform float uTime;
uniform float uEnergy;
uniform float uFresnelPower;
uniform float uFresnelIntensity;
uniform float uEmissiveBase;
uniform float uEmissiveEnergy;
uniform float uBeatFlash;
uniform float uStrobe;

varying vec3 vNormal;
varying vec3 vWorldPos;
varying float vDisplacement;
varying float vNY;

void main() {
  // View direction for Fresnel
  vec3 viewDir = normalize(cameraPosition - vWorldPos);
  float fresnel = pow(1.0 - max(dot(viewDir, vNormal), 0.0), uFresnelPower);
  fresnel *= uFresnelIntensity;

  // Emissive core — brighter where displaced
  float emissive = uEmissiveBase + uEnergy * uEmissiveEnergy + vDisplacement * 0.4;

  // Color mixing: core color + accent at edges
  vec3 baseColor = mix(uColor, uAccentColor, fresnel * 0.5);

  // Shimmer
  float shimmer = sin(vNY * 12.0 + uTime * 3.0) * 0.05 + 0.05;

  // Beat flash — additive white
  float flash = uBeatFlash;

  // Strobe
  float strobe = uStrobe * step(0.0, sin(uTime * 251.327)); // 40Hz

  vec3 finalColor = baseColor * emissive + baseColor * fresnel + vec3(shimmer) * uColor;
  finalColor += vec3(flash + strobe);

  float alpha = 0.6 + fresnel * 0.35 + emissive * 0.15;
  alpha = clamp(alpha, 0.0, 1.0);

  gl_FragColor = vec4(finalColor, alpha);
}
`;

// --- Wireframe vertex shader (same displacement, simpler) ---

const WIRE_VERTEX = /* glsl */ `
${NOISE_3D}

uniform float uTime;
uniform float uSubBass;
uniform float uBass;
uniform float uMid;
uniform float uHigh;
uniform float uEnergy;
uniform float uDisplacementAmp;
uniform float uNoiseSpeed;

varying float vDisplacement;

void main() {
  float bassZone = pow(1.0 - abs(normal.y), 1.5);
  float highZone = pow(abs(normal.y), 2.0);
  float midZone = pow(1.0 - abs(abs(normal.y) - 0.5) * 2.0, 1.5);

  float n = snoise(normal * 2.0 + uTime * uNoiseSpeed) * 0.5 + 0.5;
  float n2 = snoise(normal * 4.0 - uTime * uNoiseSpeed * 0.7) * 0.5 + 0.5;

  float disp = 0.0;
  disp += uSubBass * 0.3;
  disp += uBass * bassZone * 0.5;
  disp += uMid * midZone * n * 0.4;
  disp += uHigh * highZone * n2 * 0.6;
  disp += uEnergy * n * 0.2;
  disp *= uDisplacementAmp;

  vDisplacement = disp;

  vec3 displaced = position + normal * disp;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(displaced, 1.0);
}
`;

// --- Wireframe fragment shader ---

const WIRE_FRAGMENT = /* glsl */ `
uniform vec3 uColor;
uniform float uOpacity;
uniform float uBeatFlash;

varying float vDisplacement;

void main() {
  float bright = 0.5 + vDisplacement * 0.8;
  vec3 c = uColor * bright + vec3(uBeatFlash);
  gl_FragColor = vec4(c, uOpacity + uBeatFlash * 0.5);
}
`;

// --- Build ---

export function buildPulseSphere(): PulseSphere {
  const group = new THREE.Group();
  group.position.y = SPHERE_Y;

  // Shared uniform set (audio-driven, updated each frame)
  const makeAudioUniforms = () => ({
    uTime: { value: 0 },
    uSubBass: { value: 0 },
    uBass: { value: 0 },
    uMid: { value: 0 },
    uHigh: { value: 0 },
    uEnergy: { value: 0 },
    uDisplacementAmp: { value: SPHERE_DISPLACEMENT_AMP },
    uNoiseSpeed: { value: SPHERE_NOISE_SPEED },
  });

  // 1) Inner orb
  const innerGeo = new THREE.IcosahedronGeometry(SPHERE_RADIUS, SPHERE_DETAIL);
  const innerMat = new THREE.ShaderMaterial({
    uniforms: {
      ...makeAudioUniforms(),
      uColor: { value: new THREE.Color(0xFFD700) },
      uAccentColor: { value: new THREE.Color(0xFFF8DC) },
      uFresnelPower: { value: SPHERE_FRESNEL_POWER },
      uFresnelIntensity: { value: SPHERE_FRESNEL_INTENSITY },
      uEmissiveBase: { value: SPHERE_EMISSIVE_BASE },
      uEmissiveEnergy: { value: SPHERE_EMISSIVE_ENERGY },
      uBeatFlash: { value: 0 },
      uStrobe: { value: 0 },
    },
    vertexShader: SPHERE_VERTEX,
    fragmentShader: SPHERE_FRAGMENT,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.FrontSide,
  });
  const inner = new THREE.Mesh(innerGeo, innerMat);
  group.add(inner);

  // 2) Wireframe overlay (lower detail)
  const wireGeo = new THREE.IcosahedronGeometry(SPHERE_RADIUS * 1.005, SPHERE_WIREFRAME_DETAIL);
  const wireMat = new THREE.ShaderMaterial({
    uniforms: {
      ...makeAudioUniforms(),
      uColor: { value: new THREE.Color(0xFFD700) },
      uOpacity: { value: SPHERE_WIREFRAME_OPACITY },
      uBeatFlash: { value: 0 },
    },
    vertexShader: WIRE_VERTEX,
    fragmentShader: WIRE_FRAGMENT,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    wireframe: true,
  });
  const wireframe = new THREE.Mesh(wireGeo, wireMat);
  group.add(wireframe);

  // 3) Glow halo (BackSide, larger)
  const glowGeo = new THREE.SphereGeometry(SPHERE_RADIUS * 1.8, 32, 32);
  const glowMat = new THREE.MeshBasicMaterial({
    color: 0xFFD700,
    transparent: true,
    opacity: 0.08,
    side: THREE.BackSide,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const glow = new THREE.Mesh(glowGeo, glowMat);
  group.add(glow);

  return { group, inner, wireframe, glow, beatPunch: 0, rotationY: 0 };
}

// --- Per-frame update ---

export function updatePulseSphere(
  sphere: PulseSphere,
  dt: number,
  time: number,
  smooth: FrequencyBands,
  isBeat: boolean,
  isHardBeat: boolean,
  fx: FxState,
  activeColor: THREE.Color,
  accentColor: THREE.Color,
): void {
  // Beat punch (decaying spring)
  if (isHardBeat) sphere.beatPunch = SPHERE_HARD_BEAT_PUNCH;
  else if (isBeat) sphere.beatPunch = Math.max(sphere.beatPunch, SPHERE_BEAT_PUNCH);
  sphere.beatPunch *= Math.pow(0.04, dt); // fast decay

  // Scale: base breathing + bass pulse + beat punch + burst effect
  const breathe = 1.0 + Math.sin(time * 0.8) * 0.03;
  const bassPulse = 1.0 + smooth.bass * SPHERE_PULSE_BASS + smooth.subBass * SPHERE_PULSE_SUBBASS;
  const burstBoost = fx.burst > 0 ? 1.12 : 1.0;
  const scale = breathe * bassPulse * (1.0 + sphere.beatPunch) * burstBoost;
  sphere.group.scale.setScalar(scale);

  // Rotation
  const spinMult = fx.spin > 0 ? 5.0 : 1.0;
  const freezeMult = fx.freeze > 0 ? 0.05 : 1.0;
  sphere.rotationY += dt * 0.15 * spinMult * freezeMult;
  sphere.inner.rotation.y = sphere.rotationY;
  sphere.inner.rotation.x = Math.sin(time * 0.3) * 0.1;
  sphere.wireframe.rotation.y = sphere.rotationY * 0.7;
  sphere.wireframe.rotation.x = Math.sin(time * 0.3) * 0.1;

  // Displacement amp (burst = +50%)
  const dispAmp = SPHERE_DISPLACEMENT_AMP * (1.0 + (fx.burst > 0 ? 0.5 * fx.burst : 0));

  // Divine effect: fresnel boost + glow
  const divineBoost = fx.divine > 0 ? fx.divine : 0;

  // Beat flash for fragment shaders
  let beatFlash = sphere.beatPunch * 0.8;
  if (isHardBeat) beatFlash = 0.5;

  // Strobe
  const strobe = fx.strobe > 0 ? fx.strobe : 0;

  // --- Update inner orb uniforms ---
  const iu = (sphere.inner.material as THREE.ShaderMaterial).uniforms;
  iu.uTime.value = time;
  iu.uSubBass.value = smooth.subBass;
  iu.uBass.value = smooth.bass;
  iu.uMid.value = smooth.mid;
  iu.uHigh.value = smooth.high;
  iu.uEnergy.value = smooth.energy;
  iu.uDisplacementAmp.value = dispAmp;
  iu.uNoiseSpeed.value = SPHERE_NOISE_SPEED;
  iu.uColor.value.copy(activeColor);
  iu.uAccentColor.value.copy(accentColor);
  iu.uFresnelIntensity.value = SPHERE_FRESNEL_INTENSITY + divineBoost * 1.5;
  iu.uEmissiveBase.value = SPHERE_EMISSIVE_BASE;
  iu.uEmissiveEnergy.value = SPHERE_EMISSIVE_ENERGY;
  iu.uBeatFlash.value = beatFlash;
  iu.uStrobe.value = strobe;

  // --- Update wireframe uniforms ---
  const wu = (sphere.wireframe.material as THREE.ShaderMaterial).uniforms;
  wu.uTime.value = time;
  wu.uSubBass.value = smooth.subBass;
  wu.uBass.value = smooth.bass;
  wu.uMid.value = smooth.mid;
  wu.uHigh.value = smooth.high;
  wu.uEnergy.value = smooth.energy;
  wu.uDisplacementAmp.value = dispAmp;
  wu.uNoiseSpeed.value = SPHERE_NOISE_SPEED;
  wu.uColor.value.copy(activeColor);
  wu.uOpacity.value = SPHERE_WIREFRAME_OPACITY + (isBeat ? SPHERE_WIREFRAME_BEAT_BOOST : 0);
  wu.uBeatFlash.value = beatFlash;

  // --- Update glow halo ---
  const glowMat = sphere.glow.material as THREE.MeshBasicMaterial;
  glowMat.color.copy(activeColor);
  glowMat.opacity = 0.06 + smooth.energy * 0.12 + sphere.beatPunch * 0.15 + divineBoost * 0.1;
  sphere.glow.scale.setScalar(1.0 + smooth.bass * 0.3 + smooth.energy * 0.15 + divineBoost * 0.3);
}
