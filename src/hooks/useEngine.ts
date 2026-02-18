'use client';

import { useEffect, useRef } from 'react';
import { LiteshowEngine } from '@/lib/engine';

export function useEngine(
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  trailCanvasRef: React.RefObject<HTMLCanvasElement | null>,
) {
  const engineRef = useRef<LiteshowEngine | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const trailCanvas = trailCanvasRef.current;
    if (!canvas || !trailCanvas) return;

    const engine = new LiteshowEngine();
    engine.init(canvas, trailCanvas);
    engine.start();
    engineRef.current = engine;

    const onResize = () => engine.handleResize(window.innerWidth, window.innerHeight);
    window.addEventListener('resize', onResize);

    return () => {
      window.removeEventListener('resize', onResize);
      engine.dispose();
      engineRef.current = null;
    };
  }, [canvasRef, trailCanvasRef]);

  return engineRef;
}
