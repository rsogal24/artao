import { useMemo, useRef, useState } from 'react'
import TinderCard from 'react-tinder-card'

export type SwipeItem = {
  id: number | string
  title?: string
  alt?: string
  image: string
  meta?: Record<string, unknown>
}

type SwipeDeckProps = {
  items: SwipeItem[]
  onSwipe?: (dir: 'left' | 'right' | 'up' | 'down', item: SwipeItem, index: number) => void
  onOutOfFrame?: (item: SwipeItem) => void
}

export default function SwipeDeck({ items, onSwipe, onOutOfFrame }: SwipeDeckProps) {
  const childRefs = useMemo(
    () => items.map(() => ({ current: null }) as unknown as React.RefObject<any>),
    [items],
  )
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
  const [current, setCurrent] = useState(0)
  const [palettes, setPalettes] = useState<Record<number, { hex: string; weight: number }[]>>({})
  const [overlay, setOverlay] = useState<null | 'like' | 'nope'>(null)
  const [overlayVisible, setOverlayVisible] = useState(false)

  // Reset when items change
  if (current >= items.length && items.length > 0) setCurrent(0)

  return (
    <div style={{ position: 'relative', width: 'min(96vw, 720px)', height: 'min(80vh, 860px)', margin: '0 auto' }}>
      {items[current] && (() => {
        const index = current
        const item = items[index]
        const z = items.length - index
        return (
          <TinderCard
            key={item.id}
            ref={childRefs[index]}
            onSwipe={(dir) => {
              onSwipe?.(dir as any, item, index)
              const type = dir === 'right' ? 'like' : 'nope'
              setOverlay(type)
              setOverlayVisible(false)
              requestAnimationFrame(() => setOverlayVisible(true))
              setTimeout(() => {
                setOverlayVisible(false)
                setOverlay(null)
                setCurrent((c) => Math.min(c + 1, items.length))
              }, 650)
              if (dir === 'right') {
                try {
                  const key = 'likedPhotos'
                  const prev = JSON.parse(sessionStorage.getItem(key) || '[]')
                  const exists = Array.isArray(prev) && prev.some((p: any) => p && p.id === item.id)
                  const entry = { id: item.id, title: item.title, alt: item.alt, image: item.image, meta: item.meta }
                  const next = exists ? prev : [...prev, entry]
                  sessionStorage.setItem(key, JSON.stringify(next))
                } catch {}
              }
            }}
            onCardLeftScreen={() => onOutOfFrame?.(item)}
            preventSwipe={['up']}
            flickOnSwipe
            style={{ position: 'absolute', inset: 0, zIndex: z }}
          >
            <div
              style={{
                position: 'relative',
                height: 'min(78vh, 820px)',
                width: 'auto',
                aspectRatio: `${(item.meta as any)?.width || 4} / ${(item.meta as any)?.height || 3}`,
                borderRadius: 20,
                boxShadow: '0 20px 50px rgba(0,0,0,0.25)',
                overflow: 'hidden',
                backgroundColor: 'transparent',
                border: '1px solid rgba(255,255,255,0.12)',
                display: 'grid',
                placeItems: 'center',
                margin: '0 auto',
              }}
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex((v) => (v === index ? null : v))}
              onTouchStart={() => setHoveredIndex(index)}
            >
              <img
                src={item.image}
                alt={item.alt || item.title || 'image'}
                style={{ maxWidth: '100%', maxHeight: '100%', width: '100%', height: '100%', objectFit: 'contain', display: 'block', margin: 0, backgroundColor: 'transparent' }}
                crossOrigin="anonymous"
                onLoad={(e) => {
                  const imgEl = e.currentTarget as HTMLImageElement
                  extractPalette(imgEl, 3)
                    .then((cols) => setPalettes((prev) => ({ ...prev, [index]: cols })))
                    .catch(() => {
                      const fallback = (item.meta as any)?.avg_color
                      if (fallback) setPalettes((prev) => ({ ...prev, [index]: [{ hex: fallback, weight: 1 }] }))
                    })
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  bottom: 0,
                  padding: '14px 16px',
                  background: 'linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.55) 40%, rgba(0,0,0,0.8) 100%)',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12,
                  opacity: hoveredIndex === index ? 1 : 0.0,
                  transition: 'opacity 180ms ease',
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 16, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {(item.meta as any)?.publisher?.name || 'Unknown'}
                  </div>
                  <div style={{ opacity: 0.9, fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span>
                      {(item.meta as any)?.width} × {(item.meta as any)?.height}
                    </span>
                  </div>
                  {palettes[index] && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 12, opacity: 0.85 }}>Colors</span>
                      <div style={{ flex: 1, height: 12, borderRadius: 999, overflow: 'hidden', background: 'rgba(255,255,255,0.12)' }}>
                        <div style={{ display: 'flex', width: '100%', height: '100%' }}>
                          {palettes[index].map((c, i) => (
                            <div key={i} style={{ width: `${Math.max(5, Math.round(c.weight * 100))}%`, background: c.hex }} />
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                <a
                  href={(item.meta as any)?.url || '#'}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    background: 'rgba(255,255,255,0.12)',
                    color: '#fff',
                    padding: '8px 12px',
                    borderRadius: 999,
                    textDecoration: 'none',
                    fontSize: 13,
                    fontWeight: 600,
                    whiteSpace: 'nowrap',
                  }}
                >
                  View
                </a>
              </div>
            </div>
          </TinderCard>
        )
      })()}

      {overlay && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backdropFilter: 'blur(12px)',
            background: overlay === 'like' ? 'rgba(46,204,113,0.18)' : 'rgba(231,76,60,0.18)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            pointerEvents: 'none',
            opacity: overlayVisible ? 1 : 0,
            transition: 'opacity 220ms ease',
          }}
        >
          <div style={{
            width: 160,
            height: 160,
            borderRadius: '50%',
            background: 'rgba(0,0,0,0.35)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: overlay === 'like' ? '#2ecc71' : '#e74c3c',
            boxShadow: '0 10px 40px rgba(0,0,0,0.35)',
            transform: overlayVisible ? 'scale(1)' : 'scale(0.9)',
            opacity: overlayVisible ? 1 : 0,
            transition: 'opacity 260ms ease, transform 260ms ease'
          }}>
            {overlay === 'like' ? (
              <svg width="96" height="96" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6L9 17l-5-5" />
              </svg>
            ) : (
              <svg width="96" height="96" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

async function extractPalette(img: HTMLImageElement, k = 3): Promise<{ hex: string; weight: number }[]> {
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  if (!ctx) return []
  const w = 80
  const h = Math.max(1, Math.round((img.naturalHeight / Math.max(1, img.naturalWidth)) * w))
  canvas.width = w
  canvas.height = h
  try {
    ctx.drawImage(img, 0, 0, w, h)
    const data = ctx.getImageData(0, 0, w, h).data
    const pixels: number[][] = []
    for (let i = 0; i < data.length; i += 4) {
      const a = data[i + 3]
      if (a < 200) continue
      pixels.push([data[i], data[i + 1], data[i + 2]])
    }
    if (pixels.length === 0) return []
    const centroids: number[][] = []
    for (let i = 0; i < k; i++) centroids.push(pixels[Math.floor(Math.random() * pixels.length)].slice())
    const assignments = new Array(pixels.length).fill(0)
    for (let iter = 0; iter < 6; iter++) {
      for (let p = 0; p < pixels.length; p++) {
        let best = 0
        let bestD = Number.POSITIVE_INFINITY
        for (let c = 0; c < k; c++) {
          const d = dist2(pixels[p], centroids[c])
          if (d < bestD) { bestD = d; best = c }
        }
        assignments[p] = best
      }
      const sums = new Array(k).fill(0).map(() => [0, 0, 0])
      const counts = new Array(k).fill(0)
      for (let p = 0; p < pixels.length; p++) {
        const a = assignments[p]
        sums[a][0] += pixels[p][0]
        sums[a][1] += pixels[p][1]
        sums[a][2] += pixels[p][2]
        counts[a]++
      }
      for (let c = 0; c < k; c++) {
        if (counts[c] === 0) continue
        centroids[c][0] = Math.round(sums[c][0] / counts[c])
        centroids[c][1] = Math.round(sums[c][1] / counts[c])
        centroids[c][2] = Math.round(sums[c][2] / counts[c])
      }
    }
    const weights = new Array(k).fill(0)
    for (let p = 0; p < pixels.length; p++) weights[assignments[p]]++
    const total = weights.reduce((a, b) => a + b, 0) || 1
    const palette = centroids
      .map((rgb, i) => ({ hex: toHex(rgb[0], rgb[1], rgb[2]), weight: weights[i] / total }))
      .filter((c) => c.weight > 0)
      .sort((a, b) => b.weight - a.weight)
    return palette
  } catch {
    return []
  }
}

function dist2(a: number[], b: number[]): number {
  const dr = a[0] - b[0]
  const dg = a[1] - b[1]
  const db = a[2] - b[2]
  return dr * dr + dg * dg + db * db
}

function toHex(r: number, g: number, b: number): string {
  const h = (n: number) => n.toString(16).padStart(2, '0')
  return `#${h(r)}${h(g)}${h(b)}`
}


