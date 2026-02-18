// All GLSL shader strings extracted verbatim from the single-file app

export const FLOOR_VERTEX = /* glsl */ `
  varying vec3 vWP;
  void main() {
    vec4 wp = modelMatrix * vec4(position, 1.0);
    vWP = wp.xyz;
    gl_Position = projectionMatrix * viewMatrix * wp;
  }
`;

export const FLOOR_FRAGMENT = /* glsl */ `
  uniform float uTime;
  uniform float uBass;
  uniform vec3 uColor;
  varying vec3 vWP;
  void main() {
    vec2 p = vWP.xz;
    vec2 h = p * 0.4;
    vec2 a = mod(h, 2.0) - 1.0;
    vec2 b = mod(h + 1.0, 2.0) - 1.0;
    float d = min(dot(a, a), dot(b, b));
    float hex = smoothstep(0.85, 0.9, d);
    vec2 grid = abs(fract(p * 0.5) - 0.5);
    vec2 lw = fwidth(p * 0.5);
    vec2 dr = smoothstep(lw * 0.5, lw * 1.5, grid);
    float line = 1.0 - min(dr.x, dr.y);
    float dist = length(p);
    float pulse = smoothstep(2.0, 0.0, abs(dist - uTime * 8.0)) * uBass;
    float alpha = (line * 0.12 + hex * 0.2) * (0.03 + uBass * 0.12 + pulse * 0.1);
    alpha *= smoothstep(45.0, 4.0, dist);
    gl_FragColor = vec4(uColor * (0.2 + uBass * 0.35), alpha);
  }
`;

export const POST_FX_VERTEX = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const POST_FX_FRAGMENT = /* glsl */ `
  uniform sampler2D tDiffuse;
  uniform float uChroma;
  uniform float uVig;
  uniform float uDivine;
  varying vec2 vUv;
  void main() {
    vec2 off = (vUv - 0.5) * uChroma * 0.012;
    float r = texture2D(tDiffuse, vUv + off).r;
    float g = texture2D(tDiffuse, vUv).g;
    float b = texture2D(tDiffuse, vUv - off).b;
    vec3 c = vec3(r, g, b);
    c = mix(c, vec3(1.0, 0.97, 0.9), uDivine * 0.2);
    float vig = 1.0 - smoothstep(0.35, 1.4, length(vUv - 0.5) * (1.0 + uVig));
    c *= vig;
    gl_FragColor = vec4(c, 1.0);
  }
`;
