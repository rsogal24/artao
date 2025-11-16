import { useEffect, useMemo, useState } from 'react'
import Masonry, { type MasonryItem } from '../components/Masonry'

type LikeEntry = { id: number | string; image: string; title?: string; alt?: string; meta?: any }

export default function Library() {
  const [likes, setLikes] = useState<LikeEntry[]>([])
  const [active, setActive] = useState<LikeEntry | null>(null)
  const [overlay, setOverlay] = useState<'confirm' | 'delete' | null>(null)
  const [overlayVisible, setOverlayVisible] = useState(false)

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem('likedPhotos')
      if (!raw) return
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) setLikes(parsed)
    } catch {}
  }, [])

  const items: MasonryItem[] = useMemo(() => {
    return likes.map((l, idx) => ({ id: String(l.id ?? idx), img: l.image, url: undefined, height: 400, meta: l.meta }))
  }, [likes])

  return (
    <div className="section-content" style={{ position: 'relative', zIndex: 10 }}>
      <h2 className="fade-in-top" style={{ 
        position: 'relative', 
        zIndex: 10,
        background: 'linear-gradient(90deg, #1A237E, #FADADD, #1A237E)',
        backgroundClip: 'text',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent'
      }}>Library</h2>
      <div style={{ padding: '24px 16px 128px 16px' }}>
        {items.length === 0 ? (
          <div style={{ display: 'grid', placeItems: 'center', height: '50vh', color: '#1A237E', fontWeight: 600 }}>No saved images yet.</div>
        ) : (
          <Masonry items={items} onItemClick={(it) => setActive(likes.find((l) => String(l.id) === it.id) || null)} />
        )}
      </div>

      {active && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backdropFilter: 'blur(10px)',
            background: 'rgba(0,0,0,0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
          }}
          onClick={() => setActive(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ position: 'relative', width: 'min(92vw, 860px)', height: 'min(82vh, 720px)', borderRadius: 20, overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.45)', background: '#111', border: '1px solid rgba(255,255,255,0.12)' }}
          >
            <img src={active.image} alt={active.alt || active.title || 'image'} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
            <div style={{ position: 'absolute', bottom: 16, left: 16, right: 16, display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button
                aria-label="Delete"
                onClick={() => {
                  setOverlay('delete'); setOverlayVisible(false); requestAnimationFrame(() => setOverlayVisible(true));
                  setTimeout(() => {
                    setLikes((prev) => {
                      const next = prev.filter((l) => l.id !== active.id)
                      try { sessionStorage.setItem('likedPhotos', JSON.stringify(next)) } catch {}
                      return next
                    })
                    setOverlayVisible(false); setOverlay(null); setActive(null)
                  }, 600)
                }}
                style={{ background: 'rgba(231,76,60,0.2)', color: '#e74c3c', padding: '10px 14px', borderRadius: 999, border: '1px solid rgba(255,255,255,0.2)', fontWeight: 700 }}
              >
                ✕
              </button>
              <button
                aria-label="Confirm"
                onClick={() => {
                  setOverlay('confirm'); setOverlayVisible(false); requestAnimationFrame(() => setOverlayVisible(true));
                  setTimeout(() => { setOverlayVisible(false); setOverlay(null); setActive(null); triggerConfetti() }, 650)
                }}
                style={{ background: 'rgba(46,204,113,0.2)', color: '#2ecc71', padding: '10px 14px', borderRadius: 999, border: '1px solid rgba(255,255,255,0.2)', fontWeight: 700 }}
              >
                ✓
              </button>
            </div>
          </div>
        </div>
      )}

      {overlay && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backdropFilter: 'blur(10px)',
            background: overlay === 'confirm' ? 'rgba(46,204,113,0.18)' : 'rgba(231,76,60,0.18)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            opacity: overlayVisible ? 1 : 0,
            transition: 'opacity 240ms ease',
            pointerEvents: 'none'
          }}
        >
          <div style={{ width: 160, height: 160, borderRadius: '50%', background: 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: overlay === 'confirm' ? '#2ecc71' : '#e74c3c', boxShadow: '0 10px 40px rgba(0,0,0,0.35)', transform: overlayVisible ? 'scale(1)' : 'scale(0.9)', transition: 'opacity 260ms ease, transform 260ms ease', opacity: overlayVisible ? 1 : 0 }}>
            {overlay === 'confirm' ? (
              <svg width="96" height="96" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>
            ) : (
              <svg width="96" height="96" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function triggerConfetti() {
  try {
    // lightweight confetti using canvas-confetti if available, else skip
    // @ts-ignore
    const confetti = window.confetti
    if (confetti) {
      confetti({ particleCount: 120, spread: 70, origin: { y: 0.7 } })
    }
  } catch {}
}



