import type { Metadata } from 'next';
import { Cinzel, Inter } from 'next/font/google';
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
  title: 'liteshow',
  description: 'liteshow — sacred geometry audio visualizer reacting to music',
  icons: {
    icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'><circle cx='16' cy='16' r='14' fill='none' stroke='%23FFD700' stroke-width='1.5'/><circle cx='16' cy='9' r='7' fill='none' stroke='%23FFD700' stroke-width='0.8' opacity='0.7'/><circle cx='22.06' cy='12.5' r='7' fill='none' stroke='%23FFD700' stroke-width='0.8' opacity='0.7'/><circle cx='22.06' cy='19.5' r='7' fill='none' stroke='%23FFD700' stroke-width='0.8' opacity='0.7'/><circle cx='16' cy='23' r='7' fill='none' stroke='%23FFD700' stroke-width='0.8' opacity='0.7'/><circle cx='9.94' cy='19.5' r='7' fill='none' stroke='%23FFD700' stroke-width='0.8' opacity='0.7'/><circle cx='9.94' cy='12.5' r='7' fill='none' stroke='%23FFD700' stroke-width='0.8' opacity='0.7'/><circle cx='16' cy='16' r='7' fill='none' stroke='%23FFD700' stroke-width='0.8' opacity='0.7'/></svg>",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${cinzel.variable} ${inter.variable}`}>
      <body>{children}</body>
    </html>
  );
}
