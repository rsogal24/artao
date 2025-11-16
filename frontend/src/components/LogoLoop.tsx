import type React from 'react'
type Logo = { src?: string; alt?: string; node?: React.ReactNode }

export default function LogoLoop({ logos }: { logos: Logo[] }) {
  const repeat = [...logos, ...logos, ...logos]
  return (
    <div style={{ width: '100%', overflow: 'hidden' }}>
      <div
        style={{
          display: 'flex',
          gap: 24,
          alignItems: 'center',
          animation: 'logo-marquee 16s linear infinite',
          willChange: 'transform',
        }}
      >
        {repeat.map((l, i) => (
          <div key={i} style={{
            flex: '0 0 auto',
            width: 200,
            height: 80,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'transparent',
            border: 'none',
            borderRadius: 16,
            backdropFilter: 'none',
            overflow: 'hidden'
          }}>
            {l.node ? (
              l.node
            ) : (
              <img src={l.src!} alt={l.alt || 'logo'} style={{ height: 48, width: 'auto', maxWidth: '100%', objectFit: 'contain', display: 'block' }} />
            )}
          </div>
        ))}
      </div>
      <style>{`
        @keyframes logo-marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-33.333%); }
        }
      `}</style>
    </div>
  )
}


