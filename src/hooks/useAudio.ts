'use client';

import { useCallback } from 'react';
import type { LiteshowEngine } from '@/lib/engine';

export function useAudio(engineRef: React.RefObject<LiteshowEngine | null>) {
  const loadFile = useCallback(async (file: File) => {
    const engine = engineRef.current;
    if (!engine) return;
    const buf = await file.arrayBuffer();
    await engine.audio.init(buf);
    engine.audio.play();
    return file.name.replace(/\.[^.]+$/, '');
  }, [engineRef]);

  const loadBuffer = useCallback(async (buffer: ArrayBuffer) => {
    const engine = engineRef.current;
    if (!engine) return;
    await engine.audio.init(buffer);
    engine.audio.play();
  }, [engineRef]);

  const toggle = useCallback(() => {
    engineRef.current?.audio.toggle();
    return engineRef.current?.audio.isPlaying ?? false;
  }, [engineRef]);

  const pause = useCallback(() => {
    engineRef.current?.audio.pause();
  }, [engineRef]);

  const seek = useCallback((t: number) => {
    engineRef.current?.audio.seek(t);
  }, [engineRef]);

  const setVolume = useCallback((v: number) => {
    const gain = engineRef.current?.audio.gainNode;
    if (gain) gain.gain.value = v;
  }, [engineRef]);

  return { loadFile, loadBuffer, toggle, pause, seek, setVolume };
}
