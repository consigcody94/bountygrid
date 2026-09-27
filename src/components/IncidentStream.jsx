import React, { useState } from 'react'
import { motion } from 'motion/react'
import { timeAgo } from '../api/client.js'
import { playBeep } from '../utils/audio.js'

const CHIP_CLASS = { CHI: 'chi', NYC: 'nyc', LA: 'la', UK: 'uk' }

export default function IncidentStream({ incidents, status, lastSync }) {
  const [cityFilter, setCityFilter] = useState('ALL')
  const items = incidents.items || []

  const filtered = cityFilter === 'ALL'
    ? items
    : items.filter(inc => inc.city === cityFilter)

  return (
    <div className="panel incident-panel">
      <div className="panel-title">
        <span
          className="live-dot"
          style={status !== 'online' ? { background: '#ff2f5f', boxShadow: '0 0 8px #ff2f5f' } : undefined}
        />
        Municipal incident feed
        <span className="meta">
          {status === 'online'
            ? `${incidents.liveFeeds || 3}/3 ACTIVE CITY PORTALS · LAST SYNC ${lastSync ? lastSync.toLocaleTimeString([], { hour12: false }) : '—'}`
            : 'ALL FEEDS UNREACHABLE'}
        </span>
      </div>

      <div className="incident-city-tabs">
        {['ALL', 'CHI', 'NYC', 'LA'].map(c => (
          <button
            key={c}
            className={`inc-city-btn ${cityFilter === c ? 'active' : ''}`}
            onClick={() => {
              playBeep()
              setCityFilter(c)
            }}
          >
            {c === 'ALL' ? 'ALL CITIES' : c}
          </button>
        ))}
      </div>

      <div className="incident-list">
        {filtered.map((inc, i) => (
          <motion.div
            key={i}
            className="incident-row"
            initial={{ opacity: 0, x: -14 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: Math.min(i * 0.03, 0.6), duration: 0.25 }}
          >
            <span className={`chip ${CHIP_CLASS[inc.city] || 'chi'}`}>{inc.city}</span>
            <div className="inc-center">
              <span className="offense">{(inc.offense || 'INCIDENT REPORT').toUpperCase()}</span>
              <span className="place">{inc.place || 'METROPOLITAN SECTOR'}</span>
            </div>
            {inc.severity && (
              <span className={`severity-badge ${inc.severity}`}>{inc.severity.toUpperCase()}</span>
            )}
            <span className="when">{inc.date ? timeAgo(inc.date) : 'recent'}</span>
          </motion.div>
        ))}
      </div>

      <div className="incident-footer-note">
        SOURCES: CHICAGO CPD · NYC NYPD · LOS ANGELES LAPD OPEN-DATA SOCRATA PORTALS. MUNICIPAL REPORTING LAGS REAL TIME BY HOURS-TO-DAYS.
      </div>
    </div>
  )
}
