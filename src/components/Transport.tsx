'use client';

import { useRef, useEffect, useCallback } from 'react';
import type { LiteshowEngine } from '@/lib/engine';

interface TransportProps {
  engineRef: React.RefObject<LiteshowEngine | null>;
  isPlaying: boolean;
  trackName: string;
  onToggle: () => void;
  onUpload: () => void;
  onSeek: (t: number) => void;
  onVolumeChange: (v: number) => void;
  visible: boolean;
}

function fmtTime(s: number) {
  return `${Math.floor(s / 60)}:${Math.floor(s % 60).toString().padStart(2, '0')}`;
}

export default function Transport({ engineRef, isPlaying, trackName, onToggle, onUpload, onSeek, onVolumeChange, visible }: TransportProps) {
  const waveRef = useRef<HTMLCanvasElement>(null);
  const seekRef = useRef<HTMLDivElement>(null);
  const seekFillRef = useRef<HTMLDivElement>(null);
  const timeRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    let raf: number;
    const loop = () => {
      raf = requestAnimationFrame(loop);
      const engine = engineRef.current;
      if (!engine) return;
      // Waveform
      if (waveRef.current) engine.renderWaveform(waveRef.current);
      // Seek fill
      if (seekFillRef.current && engine.audio.isPlaying && engine.audio.duration > 0) {
        seekFillRef.current.style.width = (engine.audio.currentTime / engine.audio.duration * 100) + '%';
      }
      // Time display
      if (timeRef.current && engine.audio.isPlaying) {
        timeRef.current.textContent = `${fmtTime(engine.audio.currentTime)} / ${fmtTime(engine.audio.duration)}`;
      }
    };
    loop();
    return () => cancelAnimationFrame(raf);
  }, [engineRef]);

  const handleSeekClick = useCallback((e: React.MouseEvent) => {
    const engine = engineRef.current;
    if (!engine?.audio.audioBuffer) return;
    const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    onSeek(pct * engine.audio.duration);
  }, [engineRef, onSeek]);

  return (
    <>
      <div
        id="transport"
        className={visible ? 'visible' : ''}
        onMouseDown={e => e.stopPropagation()}
        onTouchStart={e => e.stopPropagation()}
      >
        <button id="play-btn" title="Play / Pause" onClick={onToggle}>
          {isPlaying ? '\u23F8' : '\u25B6'}
        </button>
        <span id="track-name">{trackName}</span>
        <canvas ref={waveRef} id="waveform" width={160} height={32} />
        <span ref={timeRef} id="time-display">0:00</span>
        <input
          type="range" id="vol-slider" min={0} max={1} step={0.01} defaultValue={1}
          title="Volume"
          onChange={e => onVolumeChange(parseFloat(e.target.value))}
        />
        <button id="upload-btn" title="Load Track" onClick={onUpload}>+</button>
      </div>

      <div
        ref={seekRef}
        id="seek-bar"
        className={visible ? 'visible' : ''}
        onClick={handleSeekClick}
        onMouseDown={e => e.stopPropagation()}
      >
        <div ref={seekFillRef} id="seek-fill" />
      </div>
    </>
  );
}
