import React, { useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { scoreColor } from './ui.jsx'
import { playLock } from '../utils/audio.js'

export default function SearchBar({ cities, onSelect, onGeocode, busy }) {
  const [q, setQ] = useState('')
  const [open, setOpen] = useState(false)
  const inputRef = useRef(null)

  const matches = useMemo(() => {
    const needle = q.trim().toLowerCase()
    if (!needle) return []
    return cities
      .filter(c => c.name.toLowerCase().includes(needle) || c.country.toLowerCase().includes(needle) || (c.iso2 || '').toLowerCase().includes(needle))
      .sort((a, b) => (b.population || 0) - (a.population || 0))
      .slice(0, 8)
  }, [q, cities])

  const pick = city => {
    playLock()
    onSelect(city)
    setQ('')
    setOpen(false)
    inputRef.current?.blur()
  }

  const submit = () => {
    if (matches.length) {
      pick(matches[0])
    } else if (q.trim()) {
      playLock()
      onGeocode(q.trim())
      setQ('')
      setOpen(false)
    }
  }

  return (
    <div className="search-zone">
      <div className="search-box">
        <span className="prompt">&gt;_</span>
        <input
          ref={inputRef}
          value={q}
          placeholder="Search a city, country, or coordinates"
          onChange={e => {
            setQ(e.target.value)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={e => {
            if (e.key === 'Enter') submit()
            if (e.key === 'Escape') setOpen(false)
          }}
        />
        <button className="btn" onClick={submit} disabled={busy}>
          {busy ? 'Searching…' : 'Search'}
        </button>
      </div>

      <AnimatePresence>
        {open && q.trim() && (
          <motion.div
            className="search-drop"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.16 }}
          >
            {matches.map(c => (
              <div
                key={`${c.name}-${c.iso2}`}
                className="row"
                onMouseDown={() => pick(c)}
              >
                <span className="cc">{c.iso2 || '··'}</span>
                <span className="name">{c.name}, {c.country}</span>
                {c.grade && <span className="grade-badge">GR {c.grade}</span>}
                <span className="score" style={{ color: scoreColor(c.safetyScore) }}>
                  {c.safetyScore != null ? `${c.safetyScore}/100` : '—'}
                </span>
              </div>
            ))}
            <div className="hint">
              {matches.length
                ? 'Press Enter to open the city record'
                : 'No indexed match — press Enter to search coordinates'}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
