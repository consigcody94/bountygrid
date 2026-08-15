import React, { useEffect, useState } from 'react'
import { toggleAudio, isAudioMuted, playBeep } from '../utils/audio.js'

const FEEDS = [
  ['fbi', 'FBI-CDE'],
  ['news', 'GDELT-2.0'],
  ['incidents', 'CITY-WIRE'],
  ['wanted', 'FBI-WANTED'],
  ['courts', 'COURTS'],
]

export default function HUDBar({ status, crtEnabled, onToggleCrt }) {
  const [now, setNow] = useState(new Date())
  const [muted, setMuted] = useState(false)

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  const handleAudioToggle = () => {
    const newState = toggleAudio()
    setMuted(!newState)
  }

  return (
    <header className="hud-bar">
      <div className="brand">
        <img className="brand-mark" src="/brand/mark-alpha-128.png" alt="" />
        <em className="brand-word">BOUNTY<span className="dot">.</span>GRID</em>
        <span className="tld"> // MANHUNT MATRIX</span>
      </div>

      <div className="hud-clock">
        <span className="clock-item">UTC <b>{now.toISOString().slice(11, 19)}</b></span>
        <span className="clock-item">LOCAL <b>{now.toLocaleTimeString([], { hour12: false })}</b></span>
      </div>

      <div className="hud-spacer" />

      <div className="hud-actions">
        <div className="hud-toggle-btn active" style={{ cursor: 'default', color: 'var(--mint)', borderColor: 'rgba(63,255,176,0.35)' }}>
          🌐 AUTO-TRANSLATE: EN [ON]
        </div>

        <button
          className={`hud-toggle-btn ${!muted ? 'active' : ''}`}
          onClick={handleAudioToggle}
          title="Toggle Synthesized Cyber Audio FX"
        >
          {!muted ? '🔊 AUDIO ON' : '🔇 AUDIO OFF'}
        </button>

        <button
          className={`hud-toggle-btn ${crtEnabled ? 'active' : ''}`}
          onClick={() => {
            playBeep()
            onToggleCrt()
          }}
          title="Toggle CRT Scanline Shader Overlay"
        >
          {crtEnabled ? '▦ CRT ON' : '▢ CRT OFF'}
        </button>
      </div>

      <div className="status-lights">
        {FEEDS.map(([key, label]) => {
          const st = status[key] || 'pending'
          return (
            <div key={key} className={`light ${st}`}>
              <span className="dot" />
              <span className="feed-name">{label}</span>
              <span className="feed-status">{st === 'online' ? '▮ LIVE' : st === 'offline' ? '▯ CACHE' : '…'}</span>
            </div>
          )
        })}
      </div>
    </header>
  )
}
