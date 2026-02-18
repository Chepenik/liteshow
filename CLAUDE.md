# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start dev server at http://localhost:3000
npm run build    # Production build
npm run lint     # ESLint (next/core-web-vitals + next/typescript)
```

## Environment

Requires `JAMENDO_CLIENT_ID` env var for music search (see `.env.example`). The Jamendo API key is kept server-side only, proxied through Next.js API routes. Get a free key at https://devportal.jamendo.com/signup.

## Architecture

**liteshow** is a browser-based 3D sacred geometry audio visualizer built with Next.js 16, React 19, Three.js, and Tailwind CSS 4. The React Compiler is enabled (`reactCompiler: true` in next.config.ts). Path alias `@/*` maps to `./src/*`.

### Rendering Split: React UI vs Imperative Engine

The app separates concerns between React (UI controls, state) and an imperative Three.js engine class. The engine runs its own `requestAnimationFrame` loop independent of React renders.

- **`src/lib/engine.ts` — `LiteshowEngine`**: The main orchestrator. Owns the Three.js scene, renderer, post-processing composer, and animation loop. Exposes `init(canvas, trailCanvas)`, `start()`, `stop()`, `dispose()`, and input handler methods. Has NO DOM event listeners — all input comes from React.
- **`src/components/Visualizer.tsx`**: The root client component. Dynamically imported with `ssr: false` in `page.tsx`. Wires React event handlers to engine methods and manages UI state (playing, track name, loading).
- **`src/hooks/useEngine.ts`**: Creates and manages the `LiteshowEngine` lifecycle tied to canvas refs. Returns a `RefObject<LiteshowEngine>`.
- **`src/hooks/useAudio.ts`**: Wraps engine audio methods (load, play, pause, seek, volume) as stable React callbacks.

### Engine Subsystems (`src/lib/`)

Each subsystem follows a `build*()` / `update*()` pattern — initialization separated from per-frame updates:

- **`audio.ts` — `AudioAnalyzer`**: Web Audio API wrapper. FFT analysis extracts 6 frequency bands (subBass, bass, lowMid, mid, highMid, high) plus energy. Rolling-average beat detection with standard/hard beat thresholds.
- **`constants.ts`**: All magic numbers, thresholds, color palettes, camera presets. Change tuning here, not in engine code.
- **`geometries.ts`**: Static geometry builders (Flower of Life, Metatron's Cube, crosses, Bitcoin symbols, lasers, rings, pillars, starfield). Each returns Three.js objects ready to add to the scene.
- **`particles.ts`**: 7000-particle spherical cloud with burst velocity support + 2D mouse trail system (rendered to a separate canvas overlay).
- **`camera.ts`**: Orbit camera with mouse influence, drag-orbit, shake on beats, 5 auto-switching presets triggered by hard beats.
- **`fx.ts`**: DJ effects system — 8 effects (strobe, drop, bloom, spin, color, freeze, burst, divine) stored as 0-1 intensities that decay over time.
- **`shaders.ts`**: GLSL shaders — floor (hexagonal grid with bass-reactive pulses) and post-processing (chromatic aberration, vignette, divine light).

### API Routes

- **`/api/jamendo`**: Proxies Jamendo track search API, injecting `JAMENDO_CLIENT_ID` server-side.
- **`/api/proxy-audio`**: Proxies audio file downloads from `*.jamendo.com` only (domain-validated SSRF protection).

### UI Components

- **`HintOverlay`**: Landing screen with Jamendo search, featured tracks, and file drop zone.
- **`Transport`**: Play/pause, track name, waveform canvas, seek bar, volume slider.
- **`DJPad`**: 8 effect trigger buttons mapped to keyboard keys 1-8.
- **`FullscreenButton`**: Fullscreen toggle (also triggered by F key).

### Keyboard Shortcuts

Space: play/pause, F: fullscreen, 1-8: DJ effects, /: focus search (on overlay), click: manual beat trigger.

### Color System

6 palettes in `constants.ts` (`PALETTE_HEX`), each with 4 colors. Active palette smoothly interpolates; hard beats advance color transitions. The `color` DJ effect cycles palettes.

### Styling

All CSS is in `globals.css` — uses Tailwind 4 import but most styles are hand-written with ID/class selectors. Fonts loaded via `next/font` (Cinzel for headings, Inter for UI).
