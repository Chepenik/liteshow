'use client';

import { useRef, useState, useCallback, useEffect } from 'react';
import { useEngine } from '@/hooks/useEngine';
import { useAudio } from '@/hooks/useAudio';
import { PAD_KEY_MAP } from '@/lib/constants';
import Transport from './Transport';
import DJPad from './DJPad';
import HintOverlay from './HintOverlay';
import FullscreenButton from './FullscreenButton';
import RefLinks from './RefLinks';

export default function Visualizer() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const trailCanvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useEngine(canvasRef, trailCanvasRef);
  const audio = useAudio(engineRef);

  const [overlayVisible, setOverlayVisible] = useState(true);
  const [uiVisible, setUiVisible] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [trackName, setTrackName] = useState('');
  const [loading, setLoading] = useState(false);
  const [hintOpacity, setHintOpacity] = useState(0);
  const [bodyDrop, setBodyDrop] = useState(false);

  // UI idle auto-hide
  useEffect(() => {
    let raf: number;
    const check = () => {
      raf = requestAnimationFrame(check);
      const engine = engineRef.current;
      if (engine && engine.uiIdle > 3) {
        document.body.classList.add('ui-idle');
      }
    };
    check();
    return () => cancelAnimationFrame(raf);
  }, [engineRef]);

  const showUI = useCallback(() => {
    setOverlayVisible(false);
    setUiVisible(true);
    setHintOpacity(1);
    setTimeout(() => setHintOpacity(0), 6000);
  }, []);

  // File load handler
  const handleFileLoad = useCallback(async (file: File) => {
    setLoading(true);
    try {
      const name = await audio.loadFile(file);
      setTrackName(name || file.name);
      setIsPlaying(true);
      showUI();
    } catch (e) {
      alert('Error: ' + (e instanceof Error ? e.message : String(e)));
    } finally {
      setLoading(false);
    }
  }, [audio, showUI]);

  // Stream load handler (Jamendo)
  const handleStreamLoad = useCallback(async (buffer: ArrayBuffer, name: string, artist: string) => {
    setLoading(true);
    try {
      await audio.loadBuffer(buffer);
      setTrackName(`${name} \u2014 ${artist}`);
      setIsPlaying(true);
      showUI();
    } catch (e) {
      alert('Error: ' + (e instanceof Error ? e.message : String(e)));
    } finally {
      setLoading(false);
    }
  }, [audio, showUI]);

  // Toggle play/pause
  const handleToggle = useCallback(() => {
    const playing = audio.toggle();
    setIsPlaying(playing);
  }, [audio]);

  // Upload button — back to overlay
  const handleUpload = useCallback(() => {
    audio.pause();
    setOverlayVisible(true);
    setIsPlaying(false);
  }, [audio]);

  // Global mouse events
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    const onUI = !!(e.target as HTMLElement).closest('#transport, #dj-pad, #seek-bar, #fs-btn, #upload-overlay');
    engineRef.current?.handleDragStart(e.clientX, e.clientY, onUI);
  }, [engineRef]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const engine = engineRef.current;
    if (!engine) return;
    engine.handleMouseMove(e.clientX, e.clientY, window.innerWidth, window.innerHeight);
    engine.addTrail(e.clientX, e.clientY);
    engine.uiIdle = 0;
    document.body.classList.remove('ui-idle');
  }, [engineRef]);

  const handleMouseUp = useCallback(() => {
    const engine = engineRef.current;
    if (!engine) return;
    const { wasCanvasClick } = engine.handleDragEnd();
    if (wasCanvasClick && engine.audio.isPlaying) {
      engine.handleBeat();
    }
    document.body.classList.remove('orbiting');
  }, [engineRef]);

  // Touch events
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const t = e.touches[0];
    const onUI = !!(e.target as HTMLElement).closest('#transport, #dj-pad, #seek-bar, #fs-btn, #upload-overlay');
    engineRef.current?.handleDragStart(t.clientX, t.clientY, onUI);
  }, [engineRef]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    const t = e.touches[0];
    engineRef.current?.handleMouseMove(t.clientX, t.clientY, window.innerWidth, window.innerHeight);
  }, [engineRef]);

  const handleTouchEnd = useCallback(() => {
    const engine = engineRef.current;
    if (!engine) return;
    const { wasCanvasClick } = engine.handleDragEnd();
    if (wasCanvasClick && engine.audio.isPlaying) {
      engine.handleBeat();
    }
  }, [engineRef]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const engine = engineRef.current;
      if (!engine) return;

      if (e.code === 'Space') {
        e.preventDefault();
        const playing = audio.toggle();
        setIsPlaying(playing);
      }
      if (e.code === 'KeyF') {
        if (!document.fullscreenElement) document.documentElement.requestFullscreen();
        else document.exitFullscreen();
      }
      if (e.key === '/' && overlayVisible) {
        e.preventDefault();
        document.getElementById('jamendo-search')?.focus();
      }

      const fxName = PAD_KEY_MAP[e.code];
      if (fxName) {
        engine.triggerFx(fxName);
        if (fxName === 'color') engine.paletteIdx = (engine.paletteIdx + 1) % 6;
        const btn = document.querySelector(`.pad[data-fx="${fxName}"]`);
        if (btn) { btn.classList.add('active'); setTimeout(() => btn.classList.remove('active'), 200); }
      }
    };

    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [engineRef, audio, overlayVisible]);

  // Body drop (drag files onto visualizer)
  useEffect(() => {
    const onDragOver = (e: DragEvent) => {
      e.preventDefault();
      if (!overlayVisible) setBodyDrop(true);
    };
    const onDragLeave = (e: DragEvent) => {
      if (e.relatedTarget) return;
      setBodyDrop(false);
    };
    const onDrop = (e: DragEvent) => {
      e.preventDefault();
      setBodyDrop(false);
      if (e.dataTransfer?.files[0]) handleFileLoad(e.dataTransfer.files[0]);
    };
    document.body.addEventListener('dragover', onDragOver);
    document.body.addEventListener('dragleave', onDragLeave);
    document.body.addEventListener('drop', onDrop);
    return () => {
      document.body.removeEventListener('dragover', onDragOver);
      document.body.removeEventListener('dragleave', onDragLeave);
      document.body.removeEventListener('drop', onDrop);
    };
  }, [overlayVisible, handleFileLoad]);

  // Beat flash effect
  useEffect(() => {
    let raf: number;
    const flashEl = document.getElementById('flash');
    const loop = () => {
      raf = requestAnimationFrame(loop);
      const engine = engineRef.current;
      if (!engine || !flashEl) return;
      flashEl.style.opacity = String(engine.beatFlash);
      flashEl.style.background = `radial-gradient(ellipse at center, ${engine.activeColor.getStyle()} 0%, transparent 70%)`;
    };
    loop();
    return () => cancelAnimationFrame(raf);
  }, [engineRef]);

  return (
    <div
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{ position: 'fixed', inset: 0 }}
    >
      <div id="flash" />
      <canvas ref={canvasRef} id="main-canvas" />
      <canvas ref={trailCanvasRef} id="trail-canvas" />

      <HintOverlay
        visible={overlayVisible}
        loading={loading}
        onFileLoad={handleFileLoad}
        onStreamLoad={handleStreamLoad}
      />

      <Transport
        engineRef={engineRef}
        isPlaying={isPlaying}
        trackName={trackName}
        onToggle={handleToggle}
        onUpload={handleUpload}
        onSeek={audio.seek}
        onVolumeChange={audio.setVolume}
        visible={uiVisible}
      />

      <DJPad engineRef={engineRef} visible={uiVisible} />
      <FullscreenButton visible={uiVisible} />
      <RefLinks />

      <div id="mouse-hint" style={{ opacity: hintOpacity }}>
        move mouse to interact &middot; click for beats &middot; drag to orbit
      </div>

      <div id="body-drop-overlay" className={bodyDrop ? 'active' : ''}>
        <span>Drop audio to play</span>
      </div>
    </div>
  );
}
