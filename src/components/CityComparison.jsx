import React, { useState } from 'react'
import { motion } from 'motion/react'
import { scoreColor, scoreTier, TIER_COLORS } from './ui.jsx'
import { playBeep, playLock } from '../utils/audio.js'

export default function CityComparison({ cities, defaultCityA, defaultCityB, onSelectCity }) {
  const [cityAName, setCityAName] = useState(defaultCityA?.name || 'Tokyo')
  const [cityBName, setCityBName] = useState(defaultCityB?.name || 'Chicago')

  const cityA = cities.find(c => c.name === cityAName) || cities[0]
  const cityB = cities.find(c => c.name === cityBName) || cities[1]

  const metrics = [
    { label: 'Overall Safety', getVal: c => c.safetyScore ?? 50 },
    { label: 'Violent Resistance', getVal: c => Math.max(10, Math.min(100, Math.round(100 - (c.violentRate || 300) / 20))) },
    { label: 'Property Security', getVal: c => Math.max(10, Math.min(100, Math.round(100 - (c.propertyRate || 2500) / 60))) },
    { label: 'Night Walker Safety', getVal: c => c.nightSafety ?? 50 },
    { label: 'Transit Security', getVal: c => c.transitSafety ?? 50 },
    { label: 'Emergency Response', getVal: c => c.emergencyIndex ?? 70 },
  ]

  // SVG Radar computation
  const size = 340
  const center = size / 2
  const radius = 120
  const numAxes = metrics.length

  const getCoordinates = (val, index) => {
    const angle = (Math.PI * 2 / numAxes) * index - Math.PI / 2
    const r = (val / 100) * radius
    return {
      x: center + r * Math.cos(angle),
      y: center + r * Math.sin(angle),
    }
  }

  const polygonPath = (city) => {
    return metrics
      .map((m, i) => {
        const val = m.getVal(city)
        const { x, y } = getCoordinates(val, i)
        return `${x.toFixed(1)},${y.toFixed(1)}`
      })
      .join(' ')
  }

  const colorA = '#00f0ff'
  const colorB = '#ff2f5f'

  const scoreDiff = (cityA.safetyScore || 0) - (cityB.safetyScore || 0)
  const saferCity = scoreDiff >= 0 ? cityA : cityB
  const gapAbs = Math.abs(scoreDiff)

  return (
    <div className="panel comparison-panel">
      <div className="panel-title">
        ⚔ TACTICAL THREAT DUEL // HEAD-TO-HEAD CITY RADAR
        <span className="meta">MULTI-VECTOR COMPARISON ENGINE</span>
      </div>

      <div className="compare-selectors">
        <div className="city-select-box a-side">
          <span className="side-badge" style={{ borderColor: colorA, color: colorA }}>TARGET ALPHA</span>
          <select
            value={cityAName}
            onChange={e => {
              setCityAName(e.target.value)
              playBeep()
            }}
          >
            {cities.map(c => (
              <option key={'a-' + c.name} value={c.name}>
                {c.name} ({c.iso2 || c.country}) — Score: {c.safetyScore ?? '—'}
              </option>
            ))}
          </select>
        </div>

        <div className="vs-tag">VS</div>

        <div className="city-select-box b-side">
          <span className="side-badge" style={{ borderColor: colorB, color: colorB }}>TARGET BRAVO</span>
          <select
            value={cityBName}
            onChange={e => {
              setCityBName(e.target.value)
              playBeep()
            }}
          >
            {cities.map(c => (
              <option key={'b-' + c.name} value={c.name}>
                {c.name} ({c.iso2 || c.country}) — Score: {c.safetyScore ?? '—'}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="compare-grid">
        {/* SVG Radar Chart */}
        <div className="radar-col">
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="radar-svg">
            {/* Background concentric webs */}
            {[0.25, 0.5, 0.75, 1].map((lvl, lIdx) => (
              <polygon
                key={lIdx}
                points={Array.from({ length: numAxes }).map((_, i) => {
                  const angle = (Math.PI * 2 / numAxes) * i - Math.PI / 2
                  const r = lvl * radius
                  return `${(center + r * Math.cos(angle)).toFixed(1)},${(center + r * Math.sin(angle)).toFixed(1)}`
                }).join(' ')}
                fill="none"
                stroke="rgba(0, 240, 255, 0.12)"
                strokeWidth="1"
              />
            ))}

            {/* Axis spokes */}
            {metrics.map((m, i) => {
              const angle = (Math.PI * 2 / numAxes) * i - Math.PI / 2
              const x2 = center + radius * Math.cos(angle)
              const y2 = center + radius * Math.sin(angle)
              const labelX = center + (radius + 24) * Math.cos(angle)
              const labelY = center + (radius + 24) * Math.sin(angle)
              return (
                <g key={i}>
                  <line x1={center} y1={center} x2={x2} y2={y2} stroke="rgba(215, 230, 245, 0.18)" strokeWidth="1" strokeDasharray="2 3" />
                  <text
                    x={labelX}
                    y={labelY + 4}
                    textAnchor="middle"
                    fill="#8fa6c0"
                    fontSize="10"
                    fontFamily="Share Tech Mono, monospace"
                  >
                    {m.label.toUpperCase()}
                  </text>
                </g>
              )
            })}

            {/* City A Polygon */}
            <motion.polygon
              points={polygonPath(cityA)}
              fill="rgba(0, 240, 255, 0.22)"
              stroke={colorA}
              strokeWidth="2.5"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6 }}
            />

            {/* City B Polygon */}
            <motion.polygon
              points={polygonPath(cityB)}
              fill="rgba(255, 47, 95, 0.22)"
              stroke={colorB}
              strokeWidth="2.5"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6 }}
            />
          </svg>

          <div className="radar-legend">
            <span className="legend-item" style={{ color: colorA }}>
              <span className="swatch" style={{ background: colorA }} /> {cityA.name} ({cityA.safetyScore}/100)
            </span>
            <span className="legend-item" style={{ color: colorB }}>
              <span className="swatch" style={{ background: colorB }} /> {cityB.name} ({cityB.safetyScore}/100)
            </span>
          </div>
        </div>

        {/* Vector breakdown table & AI Assessment */}
        <div className="metrics-col">
          <div className="assessment-card">
            <div className="assess-tag">◈ COMPARATIVE TACTICAL ASSESSMENT</div>
            <div className="assess-body">
              <b>{saferCity.name}</b> holds a <b>{gapAbs} point</b> safety advantage over <b>{scoreDiff >= 0 ? cityB.name : cityA.name}</b>.
              {gapAbs > 25
                ? ` High statistical disparity. ${saferCity.name} maintains markedly superior violent crime suppression and night pedestrian security.`
                : ` Both cities operate within comparable risk bands with localized variance across transit and property security.`}
            </div>
          </div>

          <div className="metric-rows">
            {metrics.map((m, idx) => {
              const valA = m.getVal(cityA)
              const valB = m.getVal(cityB)
              const diff = valA - valB
              return (
                <div key={idx} className="comp-row">
                  <span className="comp-name">{m.label}</span>
                  <div className="comp-bars">
                    <div className="bar-track a-track">
                      <div className="bar-fill a-fill" style={{ width: `${valA}%`, background: colorA }} />
                    </div>
                    <span className="val-a" style={{ color: colorA }}>{valA}</span>
                    <span className="val-b" style={{ color: colorB }}>{valB}</span>
                    <div className="bar-track b-track">
                      <div className="bar-fill b-fill" style={{ width: `${valB}%`, background: colorB }} />
                    </div>
                  </div>
                  <span className={`diff-pill ${diff > 0 ? 'a-win' : diff < 0 ? 'b-win' : 'tie'}`}>
                    {diff > 0 ? `+${diff} (A)` : diff < 0 ? `+${Math.abs(diff)} (B)` : 'EQ'}
                  </span>
                </div>
              )
            })}
          </div>

          <div className="comp-actions">
            <button
              className="btn ghost sm"
              onClick={() => {
                onSelectCity(cityA)
                playLock()
              }}
            >
              ⌕ OPEN {cityA.name.toUpperCase()} DOSSIER
            </button>
            <button
              className="btn ghost sm"
              onClick={() => {
                onSelectCity(cityB)
                playLock()
              }}
            >
              ⌕ OPEN {cityB.name.toUpperCase()} DOSSIER
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
