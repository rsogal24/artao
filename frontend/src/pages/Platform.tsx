import { useEffect, useState } from 'react'
// import PillSearch from '../components/PillSearch'
// import SearchBar from '../components/SearchBar'
import SwipeDeck, { type SwipeItem } from '../components/SwipeDeck'
import { searchImages, recommendImages, type BackendPhoto } from '../services/backend'
import Loader from '../components/Loader'
import OnboardingModal from '../components/OnboardingModal'
import TypeText from '../TypeText'

function Platform() {
  const [selected, setSelected] = useState<string[]>([])
  const [query, setQuery] = useState<string>('')
  const [showDeck, setShowDeck] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [items, setItems] = useState<SwipeItem[]>([])
  const [showOnboard, setShowOnboard] = useState(true)

  useEffect(() => {
    // Do not fetch anything while onboarding is visible
    if (showOnboard) {
      setShowDeck(false)
      return
    }
    const runSearch = async () => {
      if (!query && selected.length === 0) {
        // load recommendations based on saved prefs
        setShowDeck(true)
        setLoading(true)
        try {
          const res = await recommendImages({ per_page: 20 })
          const mapped: SwipeItem[] = res.photos.map((p: BackendPhoto) => ({
            id: p.id,
            title: p.title || p.alt,
            alt: p.alt,
            image: (p.src as any).original || (p.src as any).large || (p.src as any).large2x || (p.src as any).medium || (p.src as any).small,
            meta: { publisher: p.publisher, width: p.width, height: p.height, avg_color: p.avg_color, attribution: p.attribution, url: p.url },
          }))
          setItems(mapped)
        } catch (e: any) {
          setError(e?.message || 'Failed to load recommendations')
        } finally {
          setLoading(false)
        }
        return
      }
      setShowDeck(true)
      setLoading(true)
      setError(null)
      try {
        const q = (query || selected.join(' ')).trim()
        const res = await searchImages({ q })
        const mapped: SwipeItem[] = res.photos.map((p: BackendPhoto) => ({
          id: p.id,
          title: p.title || p.alt,
          alt: p.alt,
          image: (p.src as any).original || (p.src as any).large || (p.src as any).large2x || (p.src as any).medium || (p.src as any).small,
          meta: {
            publisher: p.publisher,
            width: p.width,
            height: p.height,
            avg_color: p.avg_color,
            attribution: p.attribution,
            url: p.url,
          },
        }))
        setItems(mapped)
      } catch (e: any) {
        setError(e?.message || 'Failed to load images')
      } finally {
        setLoading(false)
      }
    }
    runSearch()
  }, [selected, query, showOnboard])

  return (
    <div className="section-content" style={{ position: 'relative', zIndex: 10 }}>
      <OnboardingModal open={showOnboard} onClose={() => setShowOnboard(false)} />
      {!showDeck && (
        <h2 className="fade-in-top" style={{ 
          position: 'relative', 
          zIndex: 10,
          background: 'linear-gradient(90deg, #1A237E, #FADADD, #1A237E)',
          backgroundClip: 'text',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>Platform</h2>
      )}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 120,
          display: 'grid',
          placeItems: 'center',
          zIndex: 10,
          pointerEvents: 'auto',
        }}
      >
        <div style={{ marginLeft: '-14vw'}}>
          <div style={{ width: '100%', maxWidth: 560, padding: '0 16px', pointerEvents: 'auto' }}>
            {loading ? (
              <>
                <div style={{ position: 'fixed', inset: 0, backdropFilter: 'blur(10px)', background: 'rgba(250,218,221,0.25)', zIndex: 20 }} />
                <div style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 30, flexDirection: 'column', gap: 12 }}>
                  <div style={{ position: 'relative', width: 110, height: 110 }}>
                    <Loader />
                  </div>
                  <div style={{ marginTop: 4 }}>
                    <TypeText
                      text={[
                        'Finding Images Catered To You',
                        'Generating Recommendations',
                      ]}
                      as="p"
                      className="subtitle"
                      typingSpeed={80}
                      initialDelay={0}
                      showCursor={true}
                      cursorCharacter="|"
                      textColors={["#FADADD"]}
                      loop={true}
                      pauseDuration={1200}
                      deletingSpeed={50}
                    />
                  </div>
                </div>
              </>
            ) : error ? (
                <div style={{ color: '#B00020', textAlign: 'center', fontWeight: 600 }}>{error}</div>
              ) : items.length === 0 ? (
                <div style={{ color: '#1A237E', textAlign: 'center', fontWeight: 600 }}>No results</div>
              ) : (
                <SwipeDeck items={items} />
              )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Platform


