// All magic numbers, colors, presets, thresholds extracted from the single-file app

export const FFT_SIZE = 2048;
export const PARTICLE_COUNT = 7000;
export const FLOWER_LAYERS = 2;
export const FLOWER_RADIUS = 2.8;
export const CROSS_COUNT = 8;
export const BITCOIN_COUNT = 6;
export const LASER_COUNT = 12;
export const PILLAR_COUNT = 8;
export const STAR_COUNT = 12000;

// Color palettes — raw hex values, instantiated as THREE.Color in engine
export const PALETTE_HEX = [
  [0xFFD700, 0xFFF8DC, 0xDAA520, 0xFFE4B5], // Divine Gold
  [0x9966FF, 0xCC99FF, 0x6633CC, 0xE0B0FF], // Sacred Violet
  [0x66CCFF, 0x00BFFF, 0x3399FF, 0xB0E0FF], // Heavenly Blue
  [0xF7931A, 0xFFAA33, 0xFF6600, 0xFFCC66], // Bitcoin Orange
  [0xFF6B9D, 0xFF99BB, 0xCC3366, 0xFFB6C1], // Rose of Sharon
  [0xFFFFFF, 0xEEEEFF, 0xCCCCFF, 0xFFFFEE], // Sacred White
] as const;

// Bloom defaults
export const BLOOM_STRENGTH = 0.3;
export const BLOOM_RADIUS = 0.2;
export const BLOOM_THRESHOLD = 0.45;

// Camera presets: [radius, height, fov]
export const CAM_PRESETS: [number, number, number][] = [
  [16, 5, 55],
  [9, 3.5, 65],
  [20, 1, 48],
  [12, 9, 52],
  [6, 4, 80],
];

// Ring radii
export const RING_RADII = [4.5, 7, 9.5, 12.5];
export const RING_BANDS = ['subBass', 'bass', 'mid', 'high'] as const;

// Band keys for frequency mapping
export const BAND_KEYS = ['subBass', 'bass', 'lowMid', 'mid', 'highMid', 'high'] as const;
export type BandKey = (typeof BAND_KEYS)[number];

// Frequency band ranges (FFT bin indices)
export const BAND_RANGES: Record<BandKey, [number, number]> = {
  subBass: [1, 5],
  bass: [5, 12],
  lowMid: [12, 40],
  mid: [40, 100],
  highMid: [100, 200],
  high: [200, 500],
};

// Beat detection thresholds
export const BEAT_THRESHOLD = 1.4;
export const HARD_BEAT_THRESHOLD = 1.8;
export const BEAT_MIN_ENERGY = 0.15;
export const HARD_BEAT_MIN_ENERGY = 0.3;
export const BEAT_COOLDOWN = 0.12;
export const HARD_BEAT_COOLDOWN = 0.15;
export const BEAT_HISTORY_SIZE = 60;

// Smoothing attack rates per band type
export const SMOOTH_ATTACK_HIGH = 0.5;
export const SMOOTH_ATTACK_LOW = 0.35;
export const SMOOTH_ATTACK_MID = 0.3;
export const SMOOTH_DECAY = 0.08;
export const PEAK_DECAY = 0.96;

// Light positions
export const LIGHT_POSITIONS: [number, number, number][] = [
  [0, 10, 0], [6, 4, 6], [-6, 4, -6], [6, 4, -6], [-6, 4, 6], [0, 3.5, 0],
];

// Layer depths and opacities for flower of life
export const FLOWER_LAYER_Z = [-0.3, 0, 0.3];
export const FLOWER_LAYER_OPACITY = [0.08, 0.2, 0.08];

// Scene config
export const FOG_DENSITY = 0.006;
export const FOG_COLOR = 0x010005;
export const TONE_MAPPING_EXPOSURE = 0.55;
export const AMBIENT_COLOR = 0x0A0818;
export const AMBIENT_INTENSITY = 0.15;
export const POINT_LIGHT_INTENSITY = 0.4;
export const POINT_LIGHT_DISTANCE = 35;
export const POINT_LIGHT_DECAY = 1.5;

// Drag threshold in pixels before drag-orbit starts
export const DRAG_THRESHOLD = 8;

// Trail particle limit
export const MAX_TRAILS = 300;

// DJ effect names
export const FX_NAMES = ['strobe', 'drop', 'bloom', 'spin', 'color', 'freeze', 'burst', 'divine'] as const;
export type FxName = (typeof FX_NAMES)[number];

// Keyboard mapping for DJ effects
export const PAD_KEY_MAP: Record<string, FxName> = {
  Digit1: 'strobe',
  Digit2: 'drop',
  Digit3: 'bloom',
  Digit4: 'spin',
  Digit5: 'color',
  Digit6: 'freeze',
  Digit7: 'burst',
  Digit8: 'divine',
};

// Featured Jamendo tracks
export const FEATURED_TRACKS = [
  { id: '1214935', name: 'Wish You Were Here', artist_name: 'The.madpix.project', duration: 270, image: 'https://usercontent.jamendo.com?type=album&id=145774&width=300&trackid=1214935' },
  { id: '1587010', name: 'Loaded Gun', artist_name: 'THE SAME PERSONS', duration: 184, image: 'https://usercontent.jamendo.com?type=album&id=296618&width=300&trackid=1587010' },
  { id: '1234661', name: 'Waves', artist_name: 'studyBreak', duration: 252, image: 'https://usercontent.jamendo.com?type=album&id=148029&width=300&trackid=1234661' },
] as const;

// Pulse sphere
export const SPHERE_RADIUS = 2.2;
export const SPHERE_DETAIL = 5;           // IcosahedronGeometry detail → 2562 verts
export const SPHERE_WIREFRAME_DETAIL = 3; // Lower detail → visible facets
export const SPHERE_PULSE_BASS = 0.35;
export const SPHERE_PULSE_SUBBASS = 0.25;
export const SPHERE_DISPLACEMENT_AMP = 0.6;
export const SPHERE_FRESNEL_POWER = 2.5;
export const SPHERE_FRESNEL_INTENSITY = 1.2;
export const SPHERE_BEAT_PUNCH = 0.20;
export const SPHERE_HARD_BEAT_PUNCH = 0.40;
export const SPHERE_NOISE_SPEED = 0.4;
export const SPHERE_EMISSIVE_BASE = 0.15;
export const SPHERE_EMISSIVE_ENERGY = 0.6;
export const SPHERE_WIREFRAME_OPACITY = 0.18;
export const SPHERE_WIREFRAME_BEAT_BOOST = 0.6;
export const SPHERE_Y = 3.5;             // Same height as flower group

// Jamendo API defaults (client-side safe — no API key)
export const JAMENDO_SEARCH_LIMIT = 10;
export const JAMENDO_MIN_QUERY_LENGTH = 2;
