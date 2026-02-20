import { ImageResponse } from 'next/og';

export const alt = 'liteshow — Sacred Geometry Audio Visualizer';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function Image() {
  // Flower of Life geometry — CSS circles positioned absolutely
  const R = 62;
  const centerX = 600;
  const centerY = 250;
  const D = R * 2; // diameter

  // Build circle positions: center + inner ring + outer ring
  const circles: { x: number; y: number; opacity: number; width: number }[] = [];

  // Center circle
  circles.push({ x: 0, y: 0, opacity: 0.65, width: 1.2 });

  // Inner ring (6 circles)
  for (let i = 0; i < 6; i++) {
    const a = i * Math.PI / 3;
    circles.push({ x: Math.cos(a) * R, y: Math.sin(a) * R, opacity: 0.45, width: 1 });
  }

  // Outer ring (12 circles)
  for (let i = 0; i < 6; i++) {
    const a = i * Math.PI / 3;
    circles.push({ x: Math.cos(a) * R * 2, y: Math.sin(a) * R * 2, opacity: 0.18, width: 0.8 });
  }
  for (let i = 0; i < 6; i++) {
    const a = i * Math.PI / 3 + Math.PI / 6;
    const r = R * Math.sqrt(3);
    circles.push({ x: Math.cos(a) * r, y: Math.sin(a) * r, opacity: 0.18, width: 0.8 });
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'flex-end',
          paddingBottom: '80px',
          background: 'radial-gradient(ellipse at 50% 40%, #0f0520 0%, #030108 55%, #000000 100%)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Soft center glow */}
        <div
          style={{
            position: 'absolute',
            left: centerX - 160,
            top: centerY - 160,
            width: 320,
            height: 320,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(255,215,0,0.06) 0%, transparent 70%)',
          }}
        />

        {/* Outer boundary circle */}
        <div
          style={{
            position: 'absolute',
            left: centerX - R * 3.15,
            top: centerY - R * 3.15,
            width: R * 6.3,
            height: R * 6.3,
            borderRadius: '50%',
            border: '1.5px solid rgba(255,215,0,0.1)',
          }}
        />

        {/* Second outer ring */}
        <div
          style={{
            position: 'absolute',
            left: centerX - R * 3.35,
            top: centerY - R * 3.35,
            width: R * 6.7,
            height: R * 6.7,
            borderRadius: '50%',
            border: '1px solid rgba(255,215,0,0.05)',
          }}
        />

        {/* Flower of Life circles */}
        {circles.map((c, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: centerX + c.x - R,
              top: centerY + c.y - R,
              width: D,
              height: D,
              borderRadius: '50%',
              border: `${c.width}px solid rgba(255,215,0,${c.opacity})`,
            }}
          />
        ))}

        {/* Title */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            zIndex: 10,
          }}
        >
          <div
            style={{
              fontSize: '56px',
              letterSpacing: '0.35em',
              color: '#FFD700',
              fontWeight: 400,
            }}
          >
            LITESHOW
          </div>
          <div
            style={{
              fontSize: '14px',
              letterSpacing: '0.45em',
              color: 'rgba(255,215,0,0.35)',
              marginTop: '12px',
            }}
          >
            SACRED GEOMETRY AUDIO VISUALIZER
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
