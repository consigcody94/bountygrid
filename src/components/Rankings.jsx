import React, { useMemo, useState } from 'react'
import { motion } from 'motion/react'
import { playBeep, playLock } from '../utils/audio.js'
import { scoreColor } from './ui.jsx'

function RankPanel({ title, rows, color, valueOf, formatVal, onSelect }) {
  const max = Math.max(...rows.map(valueOf), 1)
  return (
    <div className="panel">
      <div className="panel-title">{title}</div>
      <div className="rank-list">
        {rows.map((c, i) => (
          <div
            key={c.name + c.iso2}
            className="rank-row"
            onClick={() => {
              playLock()
              onSelect(c)
            }}
          >
            <span className="pos">{String(i + 1).padStart(2, '0')}</span>
            <div className="city-info">
              <span className="city-name">{c.name}</span>
              <span className="city-country">{c.country} <small>{c.iso2}</small></span>
            </div>
            <div className="rank-bar-track">
              <motion.div
                className="rank-bar"
                style={{ background: color, boxShadow: `0 0 10px ${color}55` }}
                initial={{ width: 0 }}
                whileInView={{ width: `${(valueOf(c) / max) * 100}%` }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: i * 0.03, ease: 'easeOut' }}
              />
            </div>
            <span className="val">{formatVal ? formatVal(c) : valueOf(c)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function Rankings({ cities, onSelect }) {
  const [regionFilter, setRegionFilter] = useState('ALL')

  const filtered = useMemo(() => {
    if (regionFilter === 'ALL') return cities
    return cities.filter(c => c.region === regionFilter)
  }, [cities, regionFilter])

  const rated = filtered.filter(c => c.safetyScore != null)
  const safest = [...rated].sort((a, b) => b.safetyScore - a.safetyScore).slice(0, 12)
  const riskiest = [...rated].sort((a, b) => (b.homicideRate ?? 0) - (a.homicideRate ?? 0)).slice(0, 12)
  const nightSafest = [...rated].sort((a, b) => (b.nightSafety ?? 0) - (a.nightSafety ?? 0)).slice(0, 12)

  return (
    <div className="rankings-wrapper">
      <div className="rankings-region-bar">
        <span className="filter-title">REGION FILTER:</span>
        {[
          { id: 'ALL', label: 'ALL CITIES' },
          { id: 'Americas', label: 'AMERICAS' },
          { id: 'EMEA', label: 'EMEA' },
          { id: 'APAC', label: 'ASIA-PACIFIC' },
        ].map(r => (
          <button
            key={r.id}
            className={`region-btn ${regionFilter === r.id ? 'active' : ''}`}
            onClick={() => {
              playBeep()
              setRegionFilter(r.id)
            }}
          >
            {r.label}
          </button>
        ))}
      </div>

      <div className="rank-grid">
        <RankPanel
          title="Safest cities (overall index /100)"
          rows={safest}
          color="#8eafb9"
          valueOf={c => c.safetyScore}
          formatVal={c => `${c.safetyScore}/100`}
          onSelect={onSelect}
        />

        <RankPanel
          title="Highest homicide rates (annual /100k)"
          rows={riskiest}
          color="#b87976"
          valueOf={c => Math.round(c.homicideRate ?? 0)}
          formatVal={c => `${c.homicideRate?.toFixed(1) ?? '—'}/100k`}
          onSelect={onSelect}
        />
      </div>
    </div>
  )
}
