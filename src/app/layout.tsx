import type { Metadata } from 'next';
import { Cinzel, Inter } from 'next/font/google';
import { Analytics } from '@vercel/analytics/react';
import './globals.css';

const cinzel = Cinzel({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-cinzel',
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  weight: ['300', '400', '500'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL('https://liteshow.vercel.app'),
  title: {
    default: 'liteshow — Sacred Geometry Audio Visualizer',
    template: '%s | liteshow',
  },
  description:
    'Turn any song into a living light show. Drop a track or search 600K+ free Creative Commons songs — watch Flower of Life patterns, lasers, particles, and custom shaders react to your music in real time.',
  keywords: [
    'audio visualizer',
    'music visualizer',
    'sacred geometry',
    'Flower of Life',
    'EDM visualizer',
    'three.js',
    'WebGL',
    'light show',
    'beat reactive',
    'Creative Commons music',
    'free music visualizer',
    'browser visualizer',
    'Jamendo',
    'DJ effects',
  ],
  authors: [{ name: 'Binmucker', url: 'https://www.binmucker.com' }],
  creator: 'Binmucker',
  openGraph: {
    type: 'website',
    siteName: 'liteshow',
    title: 'liteshow — Sacred Geometry Audio Visualizer',
    description:
      'Turn any song into a living light show. Flower of Life patterns, lasers, particles, and shaders react to your music in real time. 600K+ free tracks.',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'liteshow — Sacred Geometry Audio Visualizer',
    description:
      'Turn any song into a living light show. Flower of Life, lasers, particles & shaders react to your music. 600K+ free tracks.',
    creator: '@ConorChepenik',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  icons: {
    icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'><circle cx='16' cy='16' r='14' fill='none' stroke='%23FFD700' stroke-width='1.5'/><circle cx='16' cy='9' r='7' fill='none' stroke='%23FFD700' stroke-width='0.8' opacity='0.7'/><circle cx='22.06' cy='12.5' r='7' fill='none' stroke='%23FFD700' stroke-width='0.8' opacity='0.7'/><circle cx='22.06' cy='19.5' r='7' fill='none' stroke='%23FFD700' stroke-width='0.8' opacity='0.7'/><circle cx='16' cy='23' r='7' fill='none' stroke='%23FFD700' stroke-width='0.8' opacity='0.7'/><circle cx='9.94' cy='19.5' r='7' fill='none' stroke='%23FFD700' stroke-width='0.8' opacity='0.7'/><circle cx='9.94' cy='12.5' r='7' fill='none' stroke='%23FFD700' stroke-width='0.8' opacity='0.7'/><circle cx='16' cy='16' r='7' fill='none' stroke='%23FFD700' stroke-width='0.8' opacity='0.7'/></svg>",
  },
  other: {
    'theme-color': '#0f0520',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'liteshow',
    description:
      'Turn any song into a living light show. Sacred geometry audio visualizer with Flower of Life patterns, lasers, particles, and custom shaders reacting to music in real time.',
    url: 'https://liteshow.vercel.app',
    applicationCategory: 'MultimediaApplication',
    operatingSystem: 'Any',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    author: { '@type': 'Person', name: 'Binmucker', url: 'https://www.binmucker.com' },
  };

  return (
    <html lang="en" className={`${cinzel.variable} ${inter.variable}`}>
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        {children}
        <Analytics />
      </body>
    </html>
  );
}
