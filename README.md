# liteshow

**A sacred geometry audio visualizer that turns any song into a living light show.**

Drop in a track or search 600,000+ free songs — watch Flower of Life patterns explode with color, lasers sync to the bass, 7,000 particles dance to the beat, and the whole scene breathes with your music. Built with love for the intersection of art, music, math, and code.

Technology is a gift. Music is a universal language. Sacred geometry is the architecture of the cosmos. **liteshow** brings all three together in your browser — no downloads, no installs, no friction. Just vibes.

https://github.com/user-attachments/assets/placeholder

## What It Does

- Real-time FFT audio analysis across 6 frequency bands with beat detection
- Flower of Life sacred geometry with Metatron's Cube, 3 parallax depth layers
- 7,000 particles in a spherical cloud that burst on hard beats
- 12 lasers synced to individual frequency bands
- Custom GLSL shaders — hexagonal floor grid, bloom, chromatic aberration, divine light
- 8 live DJ effect pads (strobe, drop, bloom, spin, color, freeze, burst, divine)
- 6 color palettes that shift on hard beats (Divine Gold, Sacred Violet, Heavenly Blue, Bitcoin Orange, Rose of Sharon, Sacred White)
- Jamendo integration — search and stream 600K+ Creative Commons tracks instantly
- Drag-and-drop your own audio files
- Mouse trail particles, camera orbit, auto-switching camera presets
- Full keyboard control, fullscreen mode, auto-hiding UI

## Get Started

```bash
git clone https://github.com/Chepenik/liteshow.git
cd liteshow
npm install
```

Create `.env.local` with your free [Jamendo API key](https://devportal.jamendo.com/signup):

```
JAMENDO_CLIENT_ID=your_key_here
```

Then run it:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Drop a song or search for one. Move your mouse. Click for beats. Press 1-8 for effects. Let the light show begin.

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Space` | Play / Pause |
| `F` | Fullscreen |
| `1`-`8` | Trigger DJ effects |
| `/` | Focus search bar (on landing screen) |
| `Click` | Manual beat trigger |
| `Drag` | Orbit camera |

## Tech Stack

- **Next.js 16** with App Router and React Compiler
- **React 19.2** with TypeScript
- **Three.js** for WebGL 3D rendering + post-processing
- **Web Audio API** for real-time FFT analysis and beat detection
- **Tailwind CSS 4**
- **Jamendo API** for free Creative Commons music streaming

## Architecture

```
src/
  app/
    api/jamendo/       Server-side Jamendo API proxy (keeps key secret)
    api/proxy-audio/   Audio stream proxy (CORS bypass, domain-validated)
    globals.css        All styles
    layout.tsx         Fonts + metadata
    page.tsx           Dynamic import of Visualizer (SSR disabled)
  components/
    Visualizer.tsx     Root component — events, state, canvas refs
    Transport.tsx      Play/pause, seek, volume, waveform
    DJPad.tsx          8 effect pad buttons
    HintOverlay.tsx    Landing screen with search + file drop
    FullscreenButton.tsx
  hooks/
    useEngine.ts       Three.js engine lifecycle
    useAudio.ts        Audio API wrapper for React
  lib/
    engine.ts          Main orchestrator (scene, renderer, RAF loop)
    audio.ts           FFT analysis, beat detection, 6 frequency bands
    geometries.ts      Sacred geometry builders
    particles.ts       Particle system + mouse trails
    camera.ts          Orbit, drag, shake, presets
    fx.ts              DJ effects state machine
    constants.ts       Every tunable value lives here
    shaders.ts         GLSL (floor + post-processing)
```

The engine runs its own `requestAnimationFrame` loop completely independent of React renders. React handles UI state and passes events down. No DOM listeners in the engine — clean separation.

## Contributing

PRs welcome. If you make something beautiful with it, share it. Music is meant to be experienced together.

## License

MIT

---

*Built with mass amounts of love, mass amounts of music, mass amounts of sacred geometry, and mass amounts of [Claude Code](https://claude.ai/code).*

*The future is bright. The future is open source. The future sounds incredible.*
