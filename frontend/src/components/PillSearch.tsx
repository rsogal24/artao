import { useEffect, useMemo, useRef, useState } from 'react'
import './PillSearch.css'

type PillSearchProps = {
  options?: string[]
  placeholder?: string
  onChange?: (selected: string[]) => void
}

const DEFAULT_OPTIONS = [
  'Mountains',
  'Oceans',
  'Animals',
  'Architecture',
  'Lakes',
]

export default function PillSearch({
  options = DEFAULT_OPTIONS,
  placeholder = '',
  onChange,
}: PillSearchProps) {
  const [query, setQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [selected, setSelected] = useState<string[]>([])

  const containerRef = useRef<HTMLDivElement | null>(null)
  const inputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    if (onChange) onChange(selected)
  }, [selected, onChange])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!containerRef.current) return
      if (!containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    window.addEventListener('mousedown', handleClickOutside)
    return () => window.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const filteredOptions = useMemo(() => {
    const q = query.trim().toLowerCase()
    return options.filter(
      (opt) => !selected.includes(opt) && (q.length === 0 || opt.toLowerCase().includes(q)),
    )
  }, [options, query, selected])

  const handleAdd = (opt: string) => {
    if (selected.includes(opt)) return
    setSelected((prev) => [...prev, opt])
    setQuery('')
    if (inputRef.current) inputRef.current.focus()
    setIsOpen(true)
  }

  const handleRemove = (opt: string) => {
    setSelected((prev) => prev.filter((v) => v !== opt))
  }

  const handleKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (e) => {
    if (e.key === 'Enter') {
      if (filteredOptions.length > 0) {
        handleAdd(filteredOptions[0])
      }
      e.preventDefault()
    } else if (e.key === 'Backspace' && query.length === 0 && selected.length > 0) {
      handleRemove(selected[selected.length - 1])
    }
  }

  return (
    <div className="pill-search" ref={containerRef}>
      <div className={`pill-search-input ${isOpen ? 'open' : ''}`} onClick={() => setIsOpen(true)}>
        <span className="pill-search-icon" aria-hidden="true">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <circle cx="11" cy="11" r="7" stroke="#1A237E" strokeWidth="2" />
            <line x1="16.65" y1="16.65" x2="22" y2="22" stroke="#1A237E" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </span>
        <div className="pill-search-pills">
          {selected.map((opt) => (
            <span key={opt} className="pill">
              <span className="pill-label">{opt}</span>
              <button
                type="button"
                aria-label={`Remove ${opt}`}
                className="pill-remove"
                onClick={(e) => {
                  e.stopPropagation()
                  handleRemove(opt)
                }}
              >
                ×
              </button>
            </span>
          ))}
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setIsOpen(true)}
            onKeyDown={handleKeyDown}
            placeholder={selected.length === 0 ? placeholder : ''}
            id="pillSearch"
            name="pillSearch"
            aria-label="Search keywords"
          />
        </div>

        <button
          type="button"
          className="pill-search-toggle"
          aria-label="Toggle options"
          onClick={(e) => {
            e.stopPropagation()
            setIsOpen((v) => {
              const next = !v
              if (next && inputRef.current) inputRef.current.focus()
              return next
            })
          }}
        >
          {isOpen ? '▲' : '▼'}
        </button>
      </div>

      {isOpen && (
        <div className="pill-search-dropdown">
          {filteredOptions.length === 0 ? (
            <div className="pill-search-empty">No matches</div>
          ) : (
            filteredOptions.map((opt) => (
              <button key={opt} type="button" className="pill-search-option" onClick={() => handleAdd(opt)}>
                {opt}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}


