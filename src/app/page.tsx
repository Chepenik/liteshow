'use client';

import dynamic from 'next/dynamic';

const Visualizer = dynamic(() => import('@/components/Visualizer'), { ssr: false });

export default function Home() {
  return <Visualizer />;
}
