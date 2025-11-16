import { useEffect, useRef, useState } from 'react'
import { suggestTerms } from '../services/backend'
import './SearchBar.css'

type SearchBarProps = {
  placeholder?: string
  onSubmit: (q: string) => void
  defaultValue?: string
}

export default function SearchBar({ placeholder = 'Search…', onSubmit, defaultValue = '' }: SearchBarProps) {
  const [q, setQ] = useState(defaultValue)
  const [expanded, setExpanded] = useState(Boolean(defaultValue))
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [showSuggest, setShowSuggest] = useState(false)
  const [debounceId, setDebounceId] = useState<number | undefined>(undefined)

  useEffect(() => {
    if (expanded && inputRef.current) inputRef.current.focus()
  }, [expanded])

  return (
    <div className={`search-pill ${expanded ? 'expanded' : ''}`} onClick={() => setExpanded(true)}>
      <span className="search-icon" aria-hidden="true">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <circle cx="11" cy="11" r="7" stroke="#1A237E" strokeWidth="2" />
          <line x1="16.65" y1="16.65" x2="22" y2="22" stroke="#1A237E" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </span>
      <input
        ref={inputRef}
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder={expanded ? placeholder : ''}
        aria-label="Search"
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault()
            onSubmit(q.trim())
            setShowSuggest(false)
          } else if (e.key === 'Escape') {
            if (q.trim().length === 0) setExpanded(false)
          }
        }}
        onBlur={() => {
          // Collapse only if empty; keep open if user typed something
          if (q.trim().length === 0) setExpanded(false)
          setTimeout(() => setShowSuggest(false), 120)
        }}
        onFocus={() => {
          if (q.trim().length > 0) setShowSuggest(true)
        }}
        onInput={() => {
          if (debounceId) clearTimeout(debounceId)
          const id = window.setTimeout(async () => {
            const text = q.trim()
            if (text.length === 0) { setSuggestions([]); setShowSuggest(false); return }
            const s = await suggestTerms(text, 3).catch(() => [])
            setSuggestions(s)
            setShowSuggest(true)
          }, 250)
          setDebounceId(id)
        }}
      />
      {showSuggest && suggestions.length > 0 && (
        <div className="search-suggest" role="listbox">
          <div className="search-suggest-title">Suggested searches</div>
          {suggestions.map((s) => (
            <button key={s} type="button" className="search-suggest-item" onClick={() => { setQ(s); onSubmit(s); setShowSuggest(false) }}>
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}


