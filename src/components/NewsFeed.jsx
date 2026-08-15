import React, { useState } from 'react'
import { motion } from 'motion/react'
import { timeAgo } from '../api/client.js'
import { playBeep } from '../utils/audio.js'

export function NewsTicker({ items }) {
  const [paused, setPaused] = useState(false)
  const [speed, setSpeed] = useState('slow') // 'slow' (140s) vs 'normal' (80s)

  if (!items || !items.length) return null
  const strip = items.slice(0, 24)

  const render = (keyPrefix) => strip.map((n, i) => (
    <React.Fragment key={keyPrefix + i}>
      <a href={n.url} target="_blank" rel="noreferrer" className="ticker-headline">
        {n._translated && <span className="ticker-en-badge">[EN]</span>}
        <span className="ticker-domain">{n.domain}:</span> {n.title}
        {n.date && <span className="ticker-time">({timeAgo(n.date)})</span>}
      </a>
      <span className="sep">◆</span>
    </React.Fragment>
  ))

  const animDuration = speed === 'slow' ? '160s' : '90s'

  return (
    <div className="ticker-shell">
      <div className="ticker-tag">
        <span className="dot" /> LIVE CRIME WIRE
      </div>

      <div className="ticker-view" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
        <div
          className="ticker-track"
          style={{
            animationDuration: animDuration,
            animationPlayState: paused ? 'paused' : 'running',
          }}
        >
          {render('a')}
          {render('b')}
        </div>
      </div>

      <div className="ticker-controls">
        <button
          className={`ticker-ctrl-btn ${paused ? 'active' : ''}`}
          onClick={() => {
            playBeep()
            setPaused(p => !p)
          }}
          title={paused ? 'Resume ticker scroll' : 'Pause ticker scroll'}
        >
          {paused ? '▶ RESUME' : '❚❚ PAUSE'}
        </button>
        <button
          className="ticker-ctrl-btn"
          onClick={() => {
            playBeep()
            setSpeed(s => s === 'slow' ? 'normal' : 'slow')
          }}
          title="Toggle ticker scroll speed"
        >
          {speed === 'slow' ? '⚡ SLOW' : '⏩ MED'}
        </button>
      </div>
    </div>
  )
}

export default function NewsFeed({ news, status }) {
  const items = news.items || []
  return (
    <div className="panel">
      <div className="panel-title">
        <span className="live-dot" /> GLOBAL SIGNAL INTERCEPTS
        <span className="meta">
          {status === 'online' ? `GDELT NEWS MESH · ${items.length} SIGNALS · AUTO-TRANSLATED (EN)` : 'UPLINK OFFLINE — CACHED'}
        </span>
      </div>
      <div className="news-grid">
        {items.slice(0, 14).map((n, i) => (
          <motion.a
            key={n.url + i}
            className="news-card"
            href={n.url}
            target="_blank"
            rel="noreferrer"
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: (i % 6) * 0.05, duration: 0.45 }}
          >
            <div className="meta-row">
              <span className="domain">
                {n.domain}
                {n._translated && <b style={{ color: 'var(--mint)', marginLeft: '6px' }}>[TRANSLATED TO EN]</b>}
              </span>
              <span className="ago">{n.date ? timeAgo(n.date) : ''}</span>
            </div>
            <div className="title">{n.title}</div>
            {n.country && <span className="src-badge cc-tag">{n.country}</span>}
          </motion.a>
        ))}
      </div>
    </div>
  )
}
