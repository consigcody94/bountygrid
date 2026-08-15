import React, { useState } from 'react'
import { motion } from 'motion/react'
import { playBeep, playLock } from '../utils/audio.js'

const PRESET_QUERIES = [
  'United States v.',
  'RICO Conspiracy',
  'Darknet Narcotics',
  'Securities Fraud',
  'Firearms Trafficking',
  'Cyber Intrusions',
  'Public Corruption',
  'Bank Robbery',
]

const COURT_TYPES = [
  { id: '', label: 'ALL JURISDICTIONS' },
  { id: 'scotus', label: 'SUPREME COURT (SCOTUS)' },
  { id: 'ca2', label: '2ND CIRCUIT (NYC)' },
  { id: 'ca9', label: '9TH CIRCUIT (WEST)' },
  { id: 'dcd', label: 'D.C. DISTRICT' },
]

export default function CourtRecords({ court, onSearch }) {
  const [q, setQ] = useState('')
  const [selectedCourt, setSelectedCourt] = useState('')
  const { results = [], count = 0, loading, query, source } = court

  const handleSearch = (searchTerm, courtFilter = selectedCourt) => {
    if (!searchTerm.trim()) return
    playLock()
    onSearch(searchTerm.trim(), courtFilter)
  }

  return (
    <div className="panel court-panel">
      <div className="panel-title">
        ⚖ FEDERAL COURT RECORDS & CASE DOCKET ARCHIVE
        <span className="meta">
          {source === 'live'
            ? `COURTLISTENER / RECAP · ${count.toLocaleString()} MATCHES FOR “${query}”`
            : 'ARCHIVE UPLINK (CACHED INTELLIGENCE SAMPLES)'}
        </span>
      </div>

      <div className="court-search-row">
        <div className="court-input-wrap">
          <input
            value={q}
            placeholder={`SEARCH 10M+ OPINIONS & DOCKETS… (e.g., "${query || 'United States v.'}")`}
            onChange={e => setQ(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') {
                handleSearch(q || query || 'United States v.')
                setQ('')
              }
            }}
          />
        </div>

        <select
          className="court-select"
          value={selectedCourt}
          onChange={e => {
            setSelectedCourt(e.target.value)
            playBeep()
            handleSearch(query || 'United States v.', e.target.value)
          }}
        >
          {COURT_TYPES.map(c => (
            <option key={c.id} value={c.id}>{c.label}</option>
          ))}
        </select>

        <button
          className="btn"
          onClick={() => {
            handleSearch(q || query || 'United States v.')
            setQ('')
          }}
          disabled={loading}
        >
          {loading ? 'PULLING…' : 'PULL DOSSIERS'}
        </button>
      </div>

      {/* Quick topic tags */}
      <div className="court-pills">
        <span className="pills-label">QUICK INVESTIGATE:</span>
        {PRESET_QUERIES.map(topic => (
          <button
            key={topic}
            className={`pill-btn ${query === topic ? 'active' : ''}`}
            onClick={() => {
              playBeep()
              handleSearch(topic)
            }}
          >
            {topic}
          </button>
        ))}
      </div>

      {loading && <div className="empty-note">ACCESSING FEDERAL DOCKET & OPINION ARCHIVES…</div>}
      {!loading && !results.length && (
        <div className="empty-note">NO CASE FILES MATCHED “{query}”. TRY A CITY NAME, DEFENDANT, OR OFFENSE KEYWORD.</div>
      )}

      <div className="case-grid">
        {results.map((c, i) => (
          <motion.div
            key={c.url + i}
            className="case-card"
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: (i % 3) * 0.06, duration: 0.4 }}
          >
            <div className="case-top">
              <span className="case-badge">{c.jurisdiction || c.offenseType || 'FEDERAL CASE'}</span>
              {c.dateFiled && <span className="case-date">FILED {c.dateFiled}</span>}
            </div>
            <div className="case-name">{c.caseName}</div>
            <div className="case-meta">
              <span>{c.court}</span>
              {c.docketNumber && c.docketNumber !== '—' && <span> · DOCKET: {c.docketNumber}</span>}
            </div>
            {c.snippet && <div className="snippet">{c.snippet}</div>}
            <div className="case-actions">
              <a className="open-file" href={c.url} target="_blank" rel="noreferrer">
                ▸ OPEN FULL LEGAL OPINION & DOCKET ↗
              </a>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
