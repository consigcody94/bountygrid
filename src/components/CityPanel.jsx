import React, { useEffect, useState } from 'react'
import { motion } from 'motion/react'
import { CountUp, scoreColor, scoreTier, TIER_COLORS } from './ui.jsx'
import { fmtNum, timeAgo } from '../api/client.js'
import { playBeep, playLock } from '../utils/audio.js'
import { fetchCityCrimeStats, isUsCity } from '../api/cityStats.js'

/* Live FBI verification panel. The bundled matrix carries estimates; for US
   cities the CDE agency endpoint gives the real reported rate, so we show the
   measurement and label the estimate as an estimate. */
function FbiVerified({ city }) {
  const [state, setState] = useState({ loading: true })
  useEffect(() => {
    let live = true
    setState({ loading: true })
    fetchCityCrimeStats(city).then(r => { if (live) setState({ loading: false, ...r }) })
    return () => { live = false }
  }, [city.name, city.country])

  if (state.loading) return <div className="empty-note">QUERYING FBI CRIME DATA EXPLORER…</div>
  if (!state.ok) {
    return (
      <div className="fbi-verify unverified">
        <div className="fbi-tag">◇ NOT FBI-VERIFIED</div>
        <div className="fbi-why">{state.reason}</div>
      </div>
    )
  }
  const cmp = (v, n) => (v != null && n ? `${(v / n).toFixed(2)}× national` : '')
  return (
    <div className="fbi-verify verified">
      <div className="fbi-tag">✓ FBI-VERIFIED · {state.year} · {state.agency}</div>
      <div className="fbi-rows">
        <div className="fbi-row">
          <span>Violent crime / 100k</span>
          <b>{state.violent ?? '—'}</b>
          <em>{cmp(state.violent, state.nationalViolent)}</em>
        </div>
        <div className="fbi-row">
          <span>Property crime / 100k</span>
          <b>{state.property ?? '—'}</b>
          <em>{cmp(state.property, state.nationalProperty)}</em>
        </div>
        <div className="fbi-row">
          <span>National benchmark</span>
          <b>{state.nationalViolent ?? '—'} / {state.nationalProperty ?? '—'}</b>
          <em>violent / property</em>
        </div>
      </div>
      <a className="fbi-src" href={state.sourceUrl} target="_blank" rel="noreferrer">{state.source} ↗</a>
    </div>
  )
}

function Gauge({ score, grade }) {
  const color = scoreColor(score)
  const frac = score == null ? 0 : score / 100
  return (
    <div className="gauge-wrap">
      <svg width="220" height="126" viewBox="0 0 220 126">
        <path d="M 22 116 A 88 88 0 0 1 198 116" fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="10" strokeLinecap="round" />
        <motion.path
          d="M 22 116 A 88 88 0 0 1 198 116"
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeLinecap="round"
          style={{ filter: `drop-shadow(0 0 8px ${color})` }}
          initial={{ pathLength: 0 }}
          animate={{ pathLength: frac }}
          transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
        />
        {[0, 25, 50, 75, 100].map(t => {
          const a = Math.PI * (1 - t / 100)
          const x1 = 110 + 78 * Math.cos(a), y1 = 116 - 78 * Math.sin(a)
          const x2 = 110 + 88 * Math.cos(a), y2 = 116 - 88 * Math.sin(a)
          return <line key={t} x1={x1} y1={y1} x2={x2} y2={y2} stroke="rgba(215,230,245,0.25)" strokeWidth="1.5" />
        })}
      </svg>
      <div className="gauge-score">
        <div className="n" style={{ color }}>{score == null ? '—' : <CountUp value={score} />}</div>
        <div className="of">SAFETY INDEX / 100 {grade ? `· GRADE ${grade}` : ''}</div>
      </div>
    </div>
  )
}

export default function CityPanel({
  city,
  rank,
  totalCities,
  news,
  newsLoading,
  ukCrime,
  onClose,
  onCourtSearch,
  onCompareWith,
}) {
  const [tab, setTab] = useState('overview')
  if (!city) return null

  const tier = scoreTier(city.safetyScore)
  const tierColor = tier ? TIER_COLORS[tier] : '#8fa6c0'

  return (
    <motion.aside
      className="dossier"
      initial={{ x: 460, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 460, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 260, damping: 30 }}
    >
      <div className="dossier-top">
        <div className="dossier-header">
          <div className="kicker">INTELLIGENCE DOSSIER // {city.iso2 || 'GEO'}</div>
          <h3>{city.name.toUpperCase()}</h3>
          <div className="country-line">
            {city.country} {city.iso2 ? `· ${city.iso2}` : ''} · {city.lat.toFixed(2)}°, {city.lng.toFixed(2)}°
          </div>
        </div>
        <button
          className="close-btn"
          onClick={() => {
            playBeep()
            onClose()
          }}
        >
          ✕
        </button>
      </div>

      <div className="dossier-tabs">
        <button
          className={`tab-btn ${tab === 'overview' ? 'active' : ''}`}
          onClick={() => {
            setTab('overview')
            playBeep()
          }}
        >
          METRICS
        </button>
        <button
          className={`tab-btn ${tab === 'intel' ? 'active' : ''}`}
          onClick={() => {
            setTab('intel')
            playBeep()
          }}
        >
          INTEL & ZONES
        </button>
        <button
          className={`tab-btn ${tab === 'news' ? 'active' : ''}`}
          onClick={() => {
            setTab('news')
            playBeep()
          }}
        >
          NEWS MESH ({news?.length || 0})
        </button>
        {ukCrime?.ok && (
          <button
            className={`tab-btn ${tab === 'police' ? 'active' : ''}`}
            onClick={() => {
              setTab('police')
              playBeep()
            }}
          >
            STREET WIRE
          </button>
        )}
      </div>

      {tab === 'overview' && (
        <div className="tab-content">
          <div className="tier-badge-row">
            {tier ? (
              <span className="tier-chip" style={{ color: tierColor, borderColor: tierColor }}>
                ◈ {tier.toUpperCase().replace('-', ' ')}
              </span>
            ) : (
              <span className="tier-chip" style={{ color: '#ffc857', borderColor: '#ffc857' }}>
                ◈ UNRATED TARGET
              </span>
            )}
            {city.grade && <span className="grade-chip">GRADE {city.grade}</span>}
          </div>

          <Gauge score={city.safetyScore} grade={city.grade} />

          {city.adhoc && (
            <div className="unrated-note">
              ⚠ AD-HOC COORDINATE TARGET — Geocoded from satellite matrix. Live news intercepts and court queries active.
            </div>
          )}

          <div className="fact-grid">
            <div className="fact">
              <div className="v">{fmtNum(city.population)}</div>
              <div className="k">Population</div>
            </div>
            <div className="fact">
              <div className="v" style={{ color: city.homicideRate != null && city.homicideRate > 10 ? '#ff7a3d' : undefined }}>
                {city.homicideRate != null ? city.homicideRate.toFixed(1) : '—'}
              </div>
              <div className="k">Homicides / 100k</div>
            </div>
            <div className="fact">
              <div className="v">{rank ? `#${rank}` : '—'}</div>
              <div className="k">Rank of {totalCities}</div>
            </div>
            <div className="fact">
              <div className="v">
                {city.homicideRate != null ? (city.homicideRate / 5.8).toFixed(1) + '×' : '—'}
              </div>
              <div className="k">vs Global Avg (5.8)</div>
            </div>
          </div>

          <div className="sub-block">
            <div className="sub-title">◈ MEASURED — FBI CRIME DATA EXPLORER</div>
            <FbiVerified city={city} />
          </div>

          {/* Sub-indices — these are composite estimates, not measurements. */}
          <div className="sub-block">
            <div className="sub-title">◇ ESTIMATED SUB-INDICES <span style={{ color: 'var(--ink-mute)', letterSpacing: 0 }}>— not measured</span></div>
            <div className="estimate-warn">
              These three indices are composite estimates for orientation only. They are not derived from any official
              statistic. Treat the FBI figures above as the measurement and these as opinion.
            </div>
            <div className="vector-row">
              <div className="v-label"><span>Night Pedestrian Safety</span><span>{city.nightSafety ?? 50}/100</span></div>
              <div className="v-track"><div className="v-fill" style={{ width: `${city.nightSafety ?? 50}%`, background: scoreColor(city.nightSafety ?? 50) }} /></div>
            </div>
            <div className="vector-row">
              <div className="v-label"><span>Public Transit Security</span><span>{city.transitSafety ?? 50}/100</span></div>
              <div className="v-track"><div className="v-fill" style={{ width: `${city.transitSafety ?? 50}%`, background: scoreColor(city.transitSafety ?? 50) }} /></div>
            </div>
            <div className="vector-row">
              <div className="v-label"><span>Emergency Response Index</span><span>{city.emergencyIndex ?? 70}/100</span></div>
              <div className="v-track"><div className="v-fill" style={{ width: `${city.emergencyIndex ?? 70}%`, background: '#00f0ff' }} /></div>
            </div>
            {city.policeRatio && (
              <div className="police-ratio-text">POLICE COVERAGE: <b>{city.policeRatio}</b></div>
            )}
          </div>
        </div>
      )}

      {tab === 'intel' && (
        <div className="tab-content">
          <div className="intel-briefing-box">
            <div className="box-tag">◇ GENERAL ORIENTATION NOTE — not a live assessment</div>
            <p className="briefing-p">
              {city.briefing || 'Intelligence gathering active for this metropolitan sector. Follow local municipal advisories and keep high situational awareness.'}
            </p>
          </div>

          {city.safeZones && city.safeZones.length > 0 && (
            <div className="zone-section safe">
              <div className="zone-title">✔ RECOMMENDED SECURE CORRIDORS</div>
              <div className="zone-tags">
                {city.safeZones.map((z, i) => (
                  <span key={i} className="zone-pill safe">{z}</span>
                ))}
              </div>
            </div>
          )}

          {city.cautionZones && city.cautionZones.length > 0 && (
            <div className="zone-section caution">
              <div className="zone-title">⚠ ELEVATED THREAT & CAUTION SECTORS</div>
              <div className="zone-tags">
                {city.cautionZones.map((z, i) => (
                  <span key={i} className="zone-pill caution">{z}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {tab === 'news' && (
        <div className="tab-content">
          <div className="sub-title">⌁ GDELT 2.0 SIGNAL INTERCEPTS (AUTO-TRANSLATED TO EN)</div>
          {newsLoading && <div className="empty-note">SCANNING GLOBAL SATELLITE & NEWS MESH…</div>}
          {!newsLoading && (!news || !news.length) && (
            <div className="empty-note">NO RECENT CRIME SIGNALS INTERCEPTED FOR THIS TARGET.</div>
          )}
          <div className="mini-news">
            {(news || []).map((n, i) => (
              <motion.div key={n.url + i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <a href={n.url} target="_blank" rel="noreferrer">
                  {n._translated && <span style={{ color: 'var(--mint)', marginRight: '6px' }}>[EN]</span>}
                  {n.title}
                </a>
                <div className="m">{n.domain} · {n.date ? timeAgo(n.date) : 'recent'}{n._translated ? ' · Translated' : ''}</div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {tab === 'police' && ukCrime && ukCrime.ok && (
        <div className="tab-content">
          <div className="sub-title">
            <span className="live-dot" /> LIVE STREET-LEVEL FEED · {ukCrime.month} · {ukCrime.total} INCIDENTS
          </div>
          {ukCrime.top.map(({ cat, count }) => (
            <div key={cat} className="cat-bar-row">
              <span>{cat}</span>
              <div className="cat-bar-track">
                <motion.div
                  className="cat-bar"
                  initial={{ width: 0 }}
                  animate={{ width: `${(count / ukCrime.top[0].count) * 100}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                />
              </div>
              <span style={{ textAlign: 'right' }}>{count}</span>
            </div>
          ))}
          <div className="src-hint">SOURCE: DATA.POLICE.UK OPEN-DATA API</div>
        </div>
      )}

      <div className="cta-row">
        <button
          className="btn ghost sm"
          onClick={() => {
            playLock()
            onCourtSearch(city.name)
          }}
        >
          ⚖ PULL COURT DOCKETS
        </button>
        {onCompareWith && (
          <button
            className="btn ghost sm"
            onClick={() => {
              playBeep()
              onCompareWith(city)
            }}
          >
            ⚔ DUEL RADAR
          </button>
        )}
      </div>
    </motion.aside>
  )
}
