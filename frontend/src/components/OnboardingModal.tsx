import { useEffect, useState } from 'react'
import { validateHandle, upsertUser, savePrefs, loadPrefs } from '../services/backend'

type Props = { open: boolean; onClose: () => void; onDone?: () => void }

export default function OnboardingModal({ open, onClose, onDone }: Props) {
  const [handle, setHandle] = useState('')
  const [prefs, setPrefs] = useState<{ styles: string; subjects: string }>({ styles: '', subjects: '' })
  const [step, setStep] = useState<0 | 1 | 2>(0)
  const [returning, setReturning] = useState(false)

  useEffect(() => {
    if (!open) return
    loadPrefs().then((p) => {
      if (p && (p.styles || p.subjects)) setPrefs({ styles: p.styles || '', subjects: p.subjects || '' })
    })
  }, [open])

  const title = returning
    ? 'Enter Your Handle'
    : step === 0
      ? 'Choose a Handle'
      : step === 1
        ? 'What Style of Art Do You Like?'
        : 'What Do You Like to Make?'

  const subtitle = returning
    ? 'Enter your handle to continue.'
    : step === 0
      ? 'Pick a handle to represent you.'
      : step === 1
        ? 'Add styles you enjoy, comma separated.'
        : 'Add subjects you like to create, comma separated.'

  if (!open) return null
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(6px)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 'min(92vw, 560px)', background: '#FADADD', borderRadius: 16, padding: 20, boxShadow: '0 20px 60px rgba(0,0,0,0.35)', color: '#1A237E' }}>
        <h3 style={{ margin: 0 }}>{title}</h3>
        <p style={{ marginTop: 8 }}>{subtitle}</p>

        {returning ? (
          <div style={{ display: 'grid', gap: 12, marginTop: 12, animation: 'fadeDown 220ms ease' }}>
            <Field
              value={handle}
              placeholder="Enter your handle"
              onChange={(v) => setHandle(v)}
              isValid={handle.trim().length > 0}
              validateHint="Please enter a non-empty handle"
            />
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={onClose} style={{ padding: '10px 14px', borderRadius: 10, background: 'transparent', border: '1px solid #1A237E', color: '#1A237E' }}>Cancel</button>
              <button
                disabled={handle.trim().length === 0}
                onClick={async () => {
                  const h = handle.trim()
                  if (!h) return
                  
                  // Validate handle against backend
                  const validation = await validateHandle(h)
                  if (!validation.exists || !validation.userId) {
                    alert('Handle not found. Please check your handle or create a new account.')
                    return
                  }
                  
                  // Set the userId from the backend
                  localStorage.setItem('userId', validation.userId)
                  
                  // Load existing preferences for this user
                  const existingPrefs = await loadPrefs()
                  if (existingPrefs && (existingPrefs.styles || existingPrefs.subjects)) {
                    setPrefs({ styles: existingPrefs.styles || '', subjects: existingPrefs.subjects || '' })
                  }
                  
                  onDone?.()
                  onClose()
                }}
                style={{ padding: '10px 14px', borderRadius: 10, background: handle.trim().length ? '#1A237E' : 'rgba(26,35,126,0.4)', border: '1px solid #1A237E', color: '#fff', fontWeight: 700 }}
              >
                Continue
              </button>
            </div>
          </div>
        ) : (
          <>
            {step === 0 && (
              <div style={{ display: 'grid', gap: 12, marginTop: 12, animation: 'fadeDown 220ms ease' }}>
                <Field
                  value={handle}
                  placeholder="Handle (e.g., art_fox42)"
                  onChange={(v) => setHandle(v)}
                  isValid={handle.trim().length > 0}
                  validateHint="Please enter a non-empty handle"
                />
                <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                  <button onClick={onClose} style={{ padding: '10px 14px', borderRadius: 10, background: 'transparent', border: '1px solid #1A237E', color: '#1A237E' }}>Cancel</button>
                  <button
                    disabled={handle.trim().length === 0}
                    onClick={() => setStep(1)}
                    style={{ padding: '10px 14px', borderRadius: 10, background: handle.trim().length ? '#1A237E' : 'rgba(26,35,126,0.4)', border: '1px solid #1A237E', color: '#fff', fontWeight: 700 }}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}

            {step === 1 && (
              <div style={{ display: 'grid', gap: 12, marginTop: 12, animation: 'fadeDown 220ms ease' }}>
                <Field
                  value={prefs.styles}
                  placeholder="Favorite styles (comma separated)"
                  onChange={(v) => setPrefs((p) => ({ ...p, styles: v }))}
                  isValid={isCommaSeparated(prefs.styles)}
                  validateHint="Use commas: abstract, surreal, modern"
                />
                <div style={{ display: 'flex', gap: 10, justifyContent: 'space-between' }}>
                  <button onClick={() => setStep(0)} style={{ padding: '10px 14px', borderRadius: 10, background: 'transparent', border: '1px solid #1A237E', color: '#1A237E' }}>Back</button>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button onClick={onClose} style={{ padding: '10px 14px', borderRadius: 10, background: 'transparent', border: '1px solid #1A237E', color: '#1A237E' }}>Cancel</button>
                    <button
                      disabled={!isCommaSeparated(prefs.styles)}
                      onClick={() => setStep(2)}
                      style={{ padding: '10px 14px', borderRadius: 10, background: isCommaSeparated(prefs.styles) ? '#1A237E' : 'rgba(26,35,126,0.4)', border: '1px solid #1A237E', color: '#fff', fontWeight: 700 }}
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            )}

            {step === 2 && (
              <div style={{ display: 'grid', gap: 12, marginTop: 12, animation: 'fadeDown 220ms ease' }}>
                <Field
                  value={prefs.subjects}
                  placeholder="Favorite subjects (comma separated)"
                  onChange={(v) => setPrefs((p) => ({ ...p, subjects: v }))}
                  isValid={isCommaSeparated(prefs.subjects)}
                  validateHint="Use commas: mountains, lakes, portraits"
                />
                <div style={{ display: 'flex', gap: 10, justifyContent: 'space-between' }}>
                  <button onClick={() => setStep(1)} style={{ padding: '10px 14px', borderRadius: 10, background: 'transparent', border: '1px solid #1A237E', color: '#1A237E' }}>Back</button>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button onClick={onClose} style={{ padding: '10px 14px', borderRadius: 10, background: 'transparent', border: '1px solid #1A237E', color: '#1A237E' }}>Cancel</button>
                    <button
                      disabled={!isCommaSeparated(prefs.subjects)}
                      onClick={async () => {
                        const h = handle.trim() || 'guest'
                        await upsertUser(h)
                        await savePrefs(prefs)
                        onDone?.()
                        onClose()
                      }}
                      style={{ padding: '10px 14px', borderRadius: 10, background: isCommaSeparated(prefs.subjects) ? '#1A237E' : 'rgba(26,35,126,0.4)', border: '1px solid #1A237E', color: '#fff', fontWeight: 700 }}
                    >
                      Continue
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        <div style={{ marginTop: 12, textAlign: 'center', fontSize: 12 }}>
          <button
            type="button"
            onClick={() => setReturning((v) => !v)}
            style={{ background: 'transparent', border: 'none', color: '#1A237E', textDecoration: 'underline', cursor: 'pointer' }}
          >
            {returning ? 'New here?' : 'Already have a handle?'}
          </button>
        </div>

        <style>{`@keyframes fadeDown { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); }
          .onboard-input::placeholder { color: #1A237E; opacity: 0.7; }`}</style>
      </div>
    </div>
  )
}

function isCommaSeparated(v: string): boolean {
  const s = (v || '').trim()
  if (s.length === 0) return false
  if (!s.includes(',')) return false
  const parts = s.split(',').map((p) => p.trim())
  if (parts.some((p) => p.length === 0)) return false
  return true
}

function Field({ value, onChange, placeholder, isValid, validateHint }: { value: string; onChange: (v: string) => void; placeholder: string; isValid: boolean; validateHint: string }) {
  const borderColor = value.length === 0 ? '#1A237E' : isValid ? '#2ecc71' : '#e74c3c'
  const bg = value.length === 0 ? '#fff' : isValid ? 'rgba(46,204,113,0.12)' : 'rgba(231,76,60,0.12)'
  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <input
        className="onboard-input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{ height: 44, padding: '10px 36px 10px 12px', borderRadius: 10, border: `1px solid ${borderColor}`, background: bg, color: '#1A237E', width: '100%', boxSizing: 'border-box' as const }}
      />
      {value.length > 0 && (
        <span style={{ position: 'absolute', right: 10, top: 0, bottom: 0, display: 'flex', alignItems: 'center', color: isValid ? '#2ecc71' : '#e74c3c' }}>
          {isValid ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}><path d="M20 6L9 17l-5-5"/></svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}><path d="M18 6L6 18M6 6l12 12"/></svg>
          )}
        </span>
      )}
      {value.length > 0 && !isValid && (
        <div style={{ marginTop: 6, fontSize: 12, color: '#1A237E', opacity: 0.8 }}>{validateHint}</div>
      )}
    </div>
  )
}


