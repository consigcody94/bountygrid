import React, { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { fetchCityNews } from '../api/feeds.js'
import { timeAgo } from '../api/client.js'
import { playBeep, playLock, playRadar } from '../utils/audio.js'

// Procedural Cybernetic Biometric Silhouette for guaranteed 100% resilient rendering
function TacticalAvatar({ name, classification }) {
  const hash = Array.from(name || '').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  const isFemale = /RUJA|FEMALE|WOMAN/i.test(name || '')
  const color = classification?.toLowerCase().includes('cyber') ? '#8eafb9' : '#b87976'

  return (
    <div className="tactical-avatar-box" style={{ borderColor: color }}>
      <svg width="100%" height="100%" viewBox="0 0 96 124" className="avatar-svg" preserveAspectRatio="xMidYMid slice">
        <defs>
          <radialGradient id={`grad-${hash}`} cx="50%" cy="40%" r="50%">
            <stop offset="0%" stopColor={color} stopOpacity="0.35" />
            <stop offset="100%" stopColor="#02040a" stopOpacity="0.95" />
          </radialGradient>
        </defs>
        <rect width="96" height="124" fill={`url(#grad-${hash})`} />
        
        {/* Biometric reticle lines */}
        <circle cx="48" cy="46" r="32" fill="none" stroke={color} strokeWidth="0.8" strokeDasharray="3 4" opacity="0.6" />
        <circle cx="48" cy="46" r="20" fill="none" stroke={color} strokeWidth="0.5" opacity="0.4" />
        <line x1="48" y1="6" x2="48" y2="86" stroke={color} strokeWidth="0.5" strokeDasharray="2 3" opacity="0.5" />
        <line x1="8" y1="46" x2="88" y2="46" stroke={color} strokeWidth="0.5" strokeDasharray="2 3" opacity="0.5" />

        {/* Head and shoulders silhouette */}
        {isFemale ? (
          <path
            d="M 48 24 C 38 24 32 32 32 44 C 32 56 38 64 48 64 C 58 64 64 56 64 44 C 64 32 58 24 48 24 Z M 22 110 C 22 84 32 76 48 76 C 64 76 74 84 74 110 Z"
            fill={color}
            opacity="0.8"
          />
        ) : (
          <path
            d="M 48 22 C 37 22 30 30 30 42 C 30 54 37 62 48 62 C 59 62 66 54 66 42 C 66 30 59 22 48 22 Z M 18 112 C 18 82 30 74 48 74 C 66 74 78 82 78 112 Z"
            fill={color}
            opacity="0.8"
          />
        )}

        {/* Tactical Crosshair overlay */}
        <rect x="6" y="6" width="8" height="2" fill={color} />
        <rect x="6" y="6" width="2" height="8" fill={color} />
        <rect x="82" y="6" width="8" height="2" fill={color} />
        <rect x="88" y="6" width="2" height="8" fill={color} />
        <rect x="6" y="116" width="8" height="2" fill={color} />
        <rect x="6" y="110" width="2" height="8" fill={color} />
        <rect x="82" y="116" width="8" height="2" fill={color} />
        <rect x="88" y="110" width="2" height="8" fill={color} />

        <text x="48" y="118" textAnchor="middle" fill="#fff" fontSize="7.5" fontFamily="Share Tech Mono, monospace" letterSpacing="0.1em">
          BIOMETRIC TARGET
        </text>
      </svg>
      <div className="scanline-overlay" />
    </div>
  )
}

// Full-screen FBI Official Wanted Poster Inspection Modal
function PosterModal({ person, onClose, onCaseFiles }) {
  if (!person) return null
  return (
    <motion.div
      className="poster-modal-backdrop"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="poster-modal-content"
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        onClick={e => e.stopPropagation()}
      >
        <div className="poster-modal-header">
          <div className="poster-fbi-seal">★ FEDERAL BUREAU OF INVESTIGATION // WANTED POSTER ★</div>
          <button className="close-btn" onClick={onClose}>✕ CLOSE</button>
        </div>

        <div className="poster-inner-layout">
          <div className="poster-photo-col">
            <div className="poster-large-photo">
              {person.image ? (
                <img
                  src={person.image}
                  alt={person.name}
                  referrerPolicy="no-referrer"

                />
              ) : (
                <TacticalAvatar name={person.name} classification={person.classification} />
              )}
            </div>
            {person.reward && (
              <div className="poster-reward-badge">
                REWARD: <br /><b>{person.reward}</b>
              </div>
            )}
          </div>

          <div className="poster-data-col">
            <h2 className="poster-name">{person.name}</h2>
            {person.aliases && <div className="poster-aliases">ALIASES: <b>{person.aliases}</b></div>}
            
            <div className="poster-desc-box">
              <div className="desc-title">CHARGES & OFFENSES:</div>
              <p>{person.description}</p>
            </div>

            <div className="poster-specs-grid">
              {person.dob && <div><span>DOB:</span> <b>{person.dob}</b></div>}
              {person.height && <div><span>HEIGHT:</span> <b>{person.height}</b></div>}
              {person.weight && <div><span>WEIGHT:</span> <b>{person.weight}</b></div>}
              {person.hair && <div><span>HAIR:</span> <b>{person.hair}</b></div>}
              {person.eyes && <div><span>EYES:</span> <b>{person.eyes}</b></div>}
              {person.ncic && <div><span>NCIC #:</span> <b>{person.ncic}</b></div>}
              {person.offices && <div><span>FIELD OFFICE:</span> <b>{person.offices}</b></div>}
            </div>

            {person.caution && (
              <div className="poster-caution-box">
                <div className="caution-title">CAUTION & THREAT SUMMARY:</div>
                <p>{person.caution}</p>
              </div>
            )}

            {person.warning && (
              <div className="poster-warning-bar">
                ⚠ {person.warning}
              </div>
            )}

            <div className="poster-modal-actions">
              <button
                className="btn"
                onClick={() => {
                  playLock()
                  onCaseFiles(person.name)
                  onClose()
                }}
              >
                ⚖ PULL FEDERAL COURT FILES
              </button>
              <a
                className="btn danger"
                href="https://tips.fbi.gov"
                target="_blank"
                rel="noreferrer"
              >
                💰 SUBMIT TIP & CLAIM BOUNTY ↗
              </a>
              <a
                className="btn ghost"
                href={person.url}
                target="_blank"
                rel="noreferrer"
              >
                OFFICIAL FBI.GOV PAGE ↗
              </a>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

function WantedCard({ person, index, onCaseFiles, onOpenPoster }) {
  const [intel, setIntel] = useState(null)
  const [scanning, setScanning] = useState(false)
  const [imgFailed, setImgFailed] = useState(false)

  const pullIntel = async () => {
    if (intel || scanning) return
    setScanning(true)
    playBeep()
    const res = await fetchCityNews(person.name)
    setIntel(res.items || [])
    setScanning(false)
  }

  return (
    <motion.div
      className="wanted-card"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: (index % 4) * 0.05, duration: 0.4 }}
    >
      <div
        className="wanted-photo"
        onClick={() => {
          playRadar()
          onOpenPoster(person)
        }}
        style={{ cursor: 'pointer' }}
        title="Click to view full FBI Wanted Poster"
      >
        {person.image && !imgFailed ? (
          <img
            src={person.image}
            alt={person.name}
            loading="lazy"
            referrerPolicy="no-referrer"

            onError={() => setImgFailed(true)}
          />
        ) : (
          <TacticalAvatar name={person.name} classification={person.classification} />
        )}
        <div className="scanline-overlay" />
        {person.classification && (
          <span className="wanted-tag">{person.classification.toUpperCase()}</span>
        )}
      </div>
      <div className="wanted-body">
        <div
          className="wanted-name"
          onClick={() => {
            playRadar()
            onOpenPoster(person)
          }}
          style={{ cursor: 'pointer' }}
        >
          {person.name}
        </div>
        {person.subjects && <div className="wanted-subjects">{person.subjects}</div>}
        {person.reward && <div className="wanted-reward">💰 {person.reward}</div>}
        {person.warning && <div className="wanted-warning">⚠ {person.warning}</div>}
        {!person.warning && person.caution && (
          <div className="wanted-caution">{person.caution.slice(0, 150)}{person.caution.length > 150 ? '…' : ''}</div>
        )}
        {!person.warning && !person.caution && person.description && (
          <div className="wanted-caution">{person.description.slice(0, 150)}</div>
        )}
        {person.offices && <div className="wanted-office">FIELD OFFICE: {person.offices.toUpperCase()}</div>}

        <div className="wanted-actions">
          <button
            className="btn ghost sm"
            onClick={() => {
              playLock()
              onCaseFiles(person.name)
            }}
          >
            ⚖ CASE FILES
          </button>
          <button className="btn ghost sm" onClick={pullIntel} disabled={scanning}>
            {scanning ? 'SCANNING…' : '⌁ INTEL'}
          </button>
          <button
            className="btn ghost sm"
            onClick={() => {
              playRadar()
              onOpenPoster(person)
            }}
          >
            🔍 POSTER
          </button>
          <a className="btn sm danger" href="https://tips.fbi.gov" target="_blank" rel="noreferrer">
            CLAIM BOUNTY ↗
          </a>
        </div>

        {intel && (
          <div className="wanted-intel">
            {!intel.length && <div className="empty-note" style={{ padding: '6px 0' }}>NO NEWS SIGNALS INTERCEPTED.</div>}
            {intel.slice(0, 3).map((n, i) => (
              <a key={n.url + i} href={n.url} target="_blank" rel="noreferrer">
                ▸ {n.title} <span>({n.domain}{n.date ? ` · ${timeAgo(n.date)}` : ''})</span>
              </a>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  )
}

export default function MostWanted({ wanted, onCaseFiles }) {
  const [filterClass, setFilterClass] = useState('ALL')
  const [searchNeedle, setSearchNeedle] = useState('')
  const [activePoster, setActivePoster] = useState(null)

  const items = wanted.items || []

  const filteredItems = useMemo(() => {
    return items.filter(p => {
      if (filterClass !== 'ALL') {
        const c = (p.classification || '').toLowerCase()
        const s = (p.subjects || '').toLowerCase()
        if (filterClass === 'TEN' && !c.includes('ten')) return false
        if (filterClass === 'CYBER' && !c.includes('cyber') && !s.includes('cyber')) return false
        if (filterClass === 'VIOLENT' && !c.includes('violent') && !s.includes('violent')) return false
        if (filterClass === 'WHITE' && !c.includes('white') && !s.includes('fraud')) return false
        if (filterClass === 'HIGH_REWARD' && !(p.rewardAmount >= 1e6)) return false
      }
      if (searchNeedle.trim()) {
        const n = searchNeedle.toLowerCase()
        return (
          p.name.toLowerCase().includes(n) ||
          (p.caution || '').toLowerCase().includes(n) ||
          (p.description || '').toLowerCase().includes(n) ||
          (p.aliases || '').toLowerCase().includes(n) ||
          (p.offices || '').toLowerCase().includes(n) ||
          (p.subjects || '').toLowerCase().includes(n) ||
          (p.reward || '').toLowerCase().includes(n)
        )
      }
      return true
    })
  }, [items, filterClass, searchNeedle])

  // Real sum of the parsed reward amounts on the live board.
  const totalBountyString = useMemo(() => {
    const pool = wanted.bountyPool || 0
    if (!pool) return 'NOT PUBLISHED'
    return pool >= 1e6 ? `$${(pool / 1e6).toFixed(1)}M` : `$${pool.toLocaleString()}`
  }, [wanted.bountyPool])

  return (
    <div className="panel wanted-panel">
      <AnimatePresence>
        {activePoster && (
          <PosterModal
            person={activePoster}
            onClose={() => setActivePoster(null)}
            onCaseFiles={onCaseFiles}
          />
        )}
      </AnimatePresence>

      <div className="panel-title" style={{ color: 'var(--red)' }}>
        ☠ FBI MOST WANTED & ACTIVE BOUNTY BOARD
        <span className="meta">
          {wanted.source === 'live'
            ? <>LIVE · API.FBI.GOV · {wanted.total?.toLocaleString()} ACTIVE POSTERS · SHOWING {filteredItems.length}</>
            : <>⚠ UPLINK OFFLINE — CACHED SAMPLE ({filteredItems.length})</>}
          {' · '}PUBLISHED REWARDS: <b style={{ color: 'var(--amber)' }}>{totalBountyString}</b>
        </span>
      </div>

      <div className="wanted-toolbar">
        <div className="class-tabs">
          {[
            { id: 'ALL', label: 'ALL TARGETS' },
            { id: 'HIGH_REWARD', label: '💰 $1M+ TOP BOUNTIES' },
            { id: 'TEN', label: 'TEN MOST WANTED' },
            { id: 'CYBER', label: 'CYBER KINGPINS' },
            { id: 'VIOLENT', label: 'VIOLENT CRIMES' },
            { id: 'WHITE', label: 'FINANCIAL / FRAUD' },
          ].map(tab => (
            <button
              key={tab.id}
              className={`class-btn ${filterClass === tab.id ? 'active' : ''}`}
              onClick={() => {
                playBeep()
                setFilterClass(tab.id)
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <input
          className="wanted-filter-input"
          value={searchNeedle}
          placeholder="FILTER BY NAME, REWARD, OR OFFENSE…"
          onChange={e => setSearchNeedle(e.target.value)}
        />
      </div>

      <div className="wanted-grid">
        {filteredItems.slice(0, 24).map((p, i) => (
          <WantedCard
            key={p.uid || i}
            person={p}
            index={i}
            onCaseFiles={onCaseFiles}
            onOpenPoster={setActivePoster}
          />
        ))}
      </div>

      <div className="wanted-footer-note">
        {wanted.source === 'live'
          ? 'LIVE RECORDS PULLED FROM THE OFFICIAL FBI WANTED API (api.fbi.gov). ALL NAMES, REWARDS, ALIASES, NCIC NUMBERS AND DESCRIPTORS ARE AS PUBLISHED BY THE FBI.'
          : '⚠ UPLINK OFFLINE — SHOWING A SMALL BUNDLED SAMPLE. VERIFY EVERY FIELD AT FBI.GOV/WANTED BEFORE ACTING ON IT.'}
        {' '}IF YOU RECOGNIZE ANY SUBJECT, DO NOT APPROACH — SUBMIT A TIP AT TIPS.FBI.GOV OR CALL 1-800-CALL-FBI. REWARD ELIGIBILITY IS DETERMINED SOLELY BY THE FBI.
      </div>
    </div>
  )
}
