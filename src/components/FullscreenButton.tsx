'use client';

import { useCallback } from 'react';

interface FullscreenButtonProps {
  visible: boolean;
}

export default function FullscreenButton({ visible }: FullscreenButtonProps) {
  const handleClick = useCallback(() => {
    if (!document.fullscreenElement) document.documentElement.requestFullscreen();
    else document.exitFullscreen();
  }, []);

  return (
    <button
      id="fs-btn"
      className={visible ? 'visible' : ''}
      onClick={handleClick}
      onMouseDown={e => e.stopPropagation()}
    >
      Fullscreen
    </button>
  );
}
