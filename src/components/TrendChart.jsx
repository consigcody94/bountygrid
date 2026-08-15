import React, { useMemo, useRef, useState } from 'react'
import { motion } from 'motion/react'
import { playBeep } from '../utils/audio.js'

const W = 940, H = 380
const M = { l: 62, r: 116, t: 18, b: 42 }
const COLORS = { violent: '#e8558f', property: '#12a0c0', homicide: '#ffc857' }

export default function TrendChart({ trend }) {
  const { violent, property, homicide = [], source } = trend
  const shellRef = useRef(null)
  const [hover, setHover] = useState(null)
  const [metricView, setMetricView] = useState('both') // 'both', 'violent', 'property', 'homicide'

  const model = useMemo(() => {
    const years = [...new Set([...violent, ...property].map(d => d.year))].sort((a, b) => a - b)
    const y0 = years[0] || 1985, y1 = years[years.length - 1] || 2024
    
    let maxRate = 5500
    if (metricView === 'homicide') {
      maxRate = 12
    } else if (metricView === 'violent') {
      maxRate = 900
    } else {
      maxRate = Math.max(...property.map(d => d.rate), ...violent.map(d => d.rate), 5000)
    }
    
    const yMax = metricView === 'homicide' ? 12 : Math.ceil(maxRate / 1000) * 1000
    const x = yr => M.l + ((yr - y0) / (y1 - y0)) * (W - M.l - M.r)
    const y = r => M.t + (1 - r / yMax) * (H - M.t - M.b)
    
    const path = pts => pts.map((d, i) => `${i ? 'L' : 'M'}${x(d.year).toFixed(1)},${y(d.rate).toFixed(1)}`).join(' ')
    
    const vByYear = new Map(violent.map(d => [d.year, d.rate]))
    const pByYear = new Map(property.map(d => [d.year, d.rate]))
    const hByYear = new Map(homicide.map(d => [d.year, d.rate]))
    
    return {
      years,
      y0,
      y1,
      yMax,
      x,
      y,
      vPath: path(violent),
      pPath: path(property),
      hPath: path(homicide),
      vByYear,
      pByYear,
      hByYear,
    }
  }, [violent, property, homicide, metricView])

  const onMove = e => {
    const svg = e.currentTarget
    const rect = svg.getBoundingClientRect()
    const px = ((e.clientX - rect.left) / rect.width) * W
    const frac = Math.min(1, Math.max(0, (px - M.l) / (W - M.l - M.r)))
    const yr = Math.round(model.y0 + frac * (model.y1 - model.y0))
    if (!model.vByYear.has(yr) && !model.pByYear.has(yr) && !model.hByYear.has(yr)) return
    setHover({
      year: yr,
      v: model.vByYear.get(yr),
      p: model.pByYear.get(yr),
      h: model.hByYear.get(yr),
      cx: (model.x(yr) / W) * rect.width,
      cy: 30,
    })
  }

  const yTicks = useMemo(() => {
    const n = 5
    return Array.from({ length: n + 1 }, (_, i) => (model.yMax / n) * i)
  }, [model])

  const lastV = violent[violent.length - 1]
  const lastP = property[property.length - 1]
  const lastH = homicide[homicide.length - 1]

  return (
    <div className="chart-shell" ref={shellRef}>
      <div className="chart-controls-bar">
        <div className="chart-metric-toggles">
          {[
            { id: 'both', label: 'VIOLENT + PROPERTY' },
            { id: 'violent', label: 'VIOLENT CRIMES' },
            { id: 'property', label: 'PROPERTY CRIMES' },
            { id: 'homicide', label: 'HOMICIDE CURVE' },
          ].map(btn => (
            <button
              key={btn.id}
              className={`metric-btn ${metricView === btn.id ? 'active' : ''}`}
              onClick={() => {
                playBeep()
                setMetricView(btn.id)
              }}
            >
              {btn.label}
            </button>
          ))}
        </div>

        <div className="chart-legend">
          {(metricView === 'both' || metricView === 'violent') && (
            <span className="key">
              <span className="swatch" style={{ background: COLORS.violent }} /> Violent /100k
            </span>
          )}
          {(metricView === 'both' || metricView === 'property') && (
            <span className="key">
              <span className="swatch" style={{ background: COLORS.property }} /> Property /100k
            </span>
          )}
          {metricView === 'homicide' && (
            <span className="key">
              <span className="swatch" style={{ background: COLORS.homicide }} /> Homicides /100k
            </span>
          )}
          <span className={`src-badge ${source === 'live' ? 'live' : ''}`}>
            {source === 'live' ? '● FBI CDE API (LIVE UPLINK)' : '▯ FBI ESTIMATES (BUNDLED SNAPSHOT)'}
          </span>
        </div>
      </div>

      <svg
        viewBox={`0 0 ${W} ${H}`}
        style={{ width: '100%', height: 'auto', display: 'block' }}
        onMouseMove={onMove}
        onMouseLeave={() => setHover(null)}
      >
        {yTicks.map(t => (
          <g key={t}>
            <line x1={M.l} x2={W - M.r} y1={model.y(t)} y2={model.y(t)} stroke="rgba(0,240,255,0.09)" strokeWidth="1" />
            <text x={M.l - 10} y={model.y(t) + 4} textAnchor="end" fill="#55688a" fontSize="12" fontFamily="Share Tech Mono, monospace">
              {metricView === 'homicide' ? t.toFixed(1) : t.toLocaleString()}
            </text>
          </g>
        ))}

        {model.years.filter(yr => yr % 5 === 0).map(yr => (
          <text key={yr} x={model.x(yr)} y={H - 14} textAnchor="middle" fill="#55688a" fontSize="12" fontFamily="Share Tech Mono, monospace">
            {yr}
          </text>
        ))}

        <text x={14} y={M.t + 8} fill="#55688a" fontSize="11" fontFamily="Share Tech Mono, monospace" transform={`rotate(-90 14 ${M.t + 8})`} textAnchor="end">
          {metricView === 'homicide' ? 'HOMICIDES / 100K' : 'RATE PER 100K INHABITANTS'}
        </text>

        {/* Property Path */}
        {(metricView === 'both' || metricView === 'property') && (
          <motion.path
            d={model.pPath}
            fill="none"
            stroke={COLORS.property}
            strokeWidth="2.5"
            strokeLinejoin="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.5, ease: 'easeInOut' }}
          />
        )}

        {/* Violent Path */}
        {(metricView === 'both' || metricView === 'violent') && (
          <motion.path
            d={model.vPath}
            fill="none"
            stroke={COLORS.violent}
            strokeWidth="2.5"
            strokeLinejoin="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.5, ease: 'easeInOut', delay: 0.15 }}
          />
        )}

        {/* Homicide Path */}
        {metricView === 'homicide' && (
          <motion.path
            d={model.hPath}
            fill="none"
            stroke={COLORS.homicide}
            strokeWidth="3"
            strokeLinejoin="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.5, ease: 'easeInOut' }}
          />
        )}

        {/* Direct labels at line ends */}
        {lastP && (metricView === 'both' || metricView === 'property') && (
          <g>
            <circle cx={model.x(lastP.year)} cy={model.y(lastP.rate)} r="4" fill={COLORS.property} />
            <text x={model.x(lastP.year) + 10} y={model.y(lastP.rate) + 4} fill={COLORS.property} fontSize="12" fontFamily="Share Tech Mono, monospace">
              PROPERTY {Math.round(lastP.rate).toLocaleString()}
            </text>
          </g>
        )}
        {lastV && (metricView === 'both' || metricView === 'violent') && (
          <g>
            <circle cx={model.x(lastV.year)} cy={model.y(lastV.rate)} r="4" fill={COLORS.violent} />
            <text x={model.x(lastV.year) + 10} y={model.y(lastV.rate) + 4} fill={COLORS.violent} fontSize="12" fontFamily="Share Tech Mono, monospace">
              VIOLENT {Math.round(lastV.rate).toLocaleString()}
            </text>
          </g>
        )}
        {lastH && metricView === 'homicide' && (
          <g>
            <circle cx={model.x(lastH.year)} cy={model.y(lastH.rate)} r="4" fill={COLORS.homicide} />
            <text x={model.x(lastH.year) + 10} y={model.y(lastH.rate) + 4} fill={COLORS.homicide} fontSize="12" fontFamily="Share Tech Mono, monospace">
              HOMICIDE {lastH.rate.toFixed(1)}/100k
            </text>
          </g>
        )}

        {hover && (
          <g pointerEvents="none">
            <line x1={model.x(hover.year)} x2={model.x(hover.year)} y1={M.t} y2={H - M.b} stroke="rgba(215,230,245,0.35)" strokeDasharray="3 4" />
            {hover.v != null && (metricView === 'both' || metricView === 'violent') && (
              <circle cx={model.x(hover.year)} cy={model.y(hover.v)} r="5" fill="none" stroke={COLORS.violent} strokeWidth="2" />
            )}
            {hover.p != null && (metricView === 'both' || metricView === 'property') && (
              <circle cx={model.x(hover.year)} cy={model.y(hover.p)} r="5" fill="none" stroke={COLORS.property} strokeWidth="2" />
            )}
            {hover.h != null && metricView === 'homicide' && (
              <circle cx={model.x(hover.year)} cy={model.y(hover.h)} r="5" fill="none" stroke={COLORS.homicide} strokeWidth="2" />
            )}
          </g>
        )}
      </svg>

      {hover && (
        <div className="chart-tip" style={{ left: hover.cx, top: hover.cy }}>
          <span className="yr">YEAR {hover.year}</span>
          {hover.v != null && (metricView === 'both' || metricView === 'violent') && (
            <> · violent <b>{Math.round(hover.v).toLocaleString()}</b></>
          )}
          {hover.p != null && (metricView === 'both' || metricView === 'property') && (
            <> · property <b>{Math.round(hover.p).toLocaleString()}</b></>
          )}
          {hover.h != null && metricView === 'homicide' && (
            <> · homicide <b>{hover.h.toFixed(1)}</b></>
          )}
          <span style={{ color: '#55688a' }}> /100k</span>
        </div>
      )}

      <details className="data-table">
        <summary>VIEW DETAILED FBI CDE SUMMARY TABLE</summary>
        <table>
          <thead>
            <tr>
              <th>Year</th>
              <th>Violent Crime / 100k</th>
              <th>Property Crime / 100k</th>
              <th>National Trend Status</th>
            </tr>
          </thead>
          <tbody>
            {model.years.filter(yr => yr % 5 === 0 || yr === model.y1).map(yr => (
              <tr key={yr}>
                <td><b>{yr}</b></td>
                <td style={{ color: COLORS.violent }}>{model.vByYear.get(yr)?.toLocaleString() ?? '—'}</td>
                <td style={{ color: COLORS.property }}>{model.pByYear.get(yr)?.toLocaleString() ?? '—'}</td>
                <td>{yr > 2020 ? 'Post-Pandemic Moderation' : yr >= 2000 ? 'Historic Moderation Era' : 'Historic High Era'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </div>
  )
}
