import React, { useMemo, useState } from 'react'
import { motion } from 'motion/react'
import { POLICE_CODEBOOK } from '../utils/scannerEngine.js'
import { playBeep } from '../utils/audio.js'

/* Rewritten. The previous version invented police dispatches with Math.random()
   and presented them as a live intercept feed — reading fabricated "10-33 shots
   fired" traffic as real would be worse than having no scanner at all.

   What is real and kept:
     • the 10-code / penal-code lexicon (genuine reference data)
     • a decoder that runs against text YOU paste from a real feed
     • direct links to actual live scanner audio streams
   Live automated transcription would need an audio+ASR pipeline this app does
   not have, so it is not claimed. */

const LIVE_FEEDS = [
  { city: 'CHICAGO', agency: 'Chicago PD — citywide zones', url: 'https://www.broadcastify.com/listen/ctid/570', provider: 'Broadcastify' },
  { city: 'NEW YORK', agency: 'NYPD — all boroughs', url: 'https://www.broadcastify.com/listen/ctid/1855', provider: 'Broadcastify' },
  { city: 'LOS ANGELES', agency: 'LAPD — citywide', url: 'https://www.broadcastify.com/listen/ctid/263', provider: 'Broadcastify' },
  { city: 'ARCHIVE', agency: 'OpenMHz — recorded P25 calls by system', url: 'https://openmhz.com/', provider: 'OpenMHz' },
  { city: 'DIRECTORY', agency: 'Browse every public feed by county', url: 'https://www.broadcastify.com/listen/', provider: 'Broadcastify' },
]

const SEVERITY_ORDER = { critical: 0, high: 1, medium: 2, low: 3 }

export default function PoliceScanner({ onPlotDispatch }) {
  const [raw, setRaw] = useState('')
  const [query, setQuery] = useState('')

  // Decode whatever the operator pastes in from a real feed.
  const decoded = useMemo(() => {
    const text = raw.toUpperCase()
    if (!text.trim()) return []
    const hits = []
    for (const [code, meta] of Object.entries(POLICE_CODEBOOK)) {
      // word-boundary match so "10-4" doesn't match inside "10-41"
      const esc = code.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      const re = new RegExp(`(^|[^\\w-])${esc}([^\\w-]|$)`, 'i')
      if (re.test(text)) hits.push({ code, ...meta })
    }
    return hits.sort((a, b) => (SEVERITY_ORDER[a.severity] ?? 9) - (SEVERITY_ORDER[b.severity] ?? 9))
  }, [raw])

  const lexicon = useMemo(() => {
    const n = query.trim().toLowerCase()
    const all = Object.entries(POLICE_CODEBOOK).map(([code, m]) => ({ code, ...m }))
    if (!n) return all.slice(0, 24)
    return all.filter(e => e.code.toLowerCase().includes(n) || e.meaning.toLowerCase().includes(n) || (e.category || '').includes(n))
  }, [query])

  return (
    <div className="panel">
      <div className="panel-title">
        📻 SCANNER DESK & 10-CODE DECODER
        <span className="meta">REAL FEEDS + REAL LEXICON · NO SIMULATED TRAFFIC</span>
      </div>

      <div className="recon-sub">
        This panel does <b>not</b> fabricate dispatch traffic. Open a real stream below, and paste anything you hear into the
        decoder to have the codes broken down. Automated live transcription would require an audio and speech-recognition
        pipeline this console does not have — so it is not pretended.
      </div>

      <div className="recon-block-title">LIVE PUBLIC SCANNER STREAMS</div>
      <div className="tip-grid">
        {LIVE_FEEDS.map(f => (
          <div key={f.url} className="tip-card" style={{ borderColor: 'rgba(0,240,255,0.2)' }}>
            <div className="tip-agency">{f.city}</div>
            <div className="tip-when">{f.agency}</div>
            <div className="tip-note">{f.provider}</div>
            <div className="tip-actions">
              <a className="btn sm" href={f.url} target="_blank" rel="noreferrer" onClick={playBeep}>OPEN STREAM ↗</a>
            </div>
          </div>
        ))}
      </div>

      <div className="recon-block-title" style={{ marginTop: 20 }}>DECODE TRANSMISSION TEXT</div>
      <textarea
        className="scanner-input"
        value={raw}
        placeholder={'Paste what you heard, e.g.\n"units respond code 3, we have a 211 in progress, suspect vehicle 10-99, requesting 10-78"'}
        onChange={e => setRaw(e.target.value)}
        rows={4}
      />
      {!!decoded.length && (
        <>
          <div className="recon-block-title" style={{ marginTop: 12 }}>{decoded.length} CODE(S) IDENTIFIED</div>
          <div className="finding-list">
            {decoded.map(d => (
              <motion.div
                key={d.code}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                className={`finding ${d.severity === 'critical' ? 'blocker' : d.severity === 'high' ? 'disputed' : ''}`}
              >
                <span className="finding-tag">{d.code}</span>
                <span className="finding-body">{d.meaning}</span>
                <span className="finding-src">{d.severity?.[0]?.toUpperCase()}</span>
              </motion.div>
            ))}
          </div>
        </>
      )}
      {raw.trim() && !decoded.length && (
        <div className="empty-note">NO KNOWN CODES IN THAT TEXT. Codes vary by agency — check the local agency's own signal list.</div>
      )}

      <div className="recon-block-title" style={{ marginTop: 20 }}>
        LEXICON — {Object.keys(POLICE_CODEBOOK).length} APCO 10-CODES, PENAL CODES & SIGNALS
      </div>
      <div className="recon-inputrow">
        <input value={query} placeholder="Search codes or meanings — e.g. pursuit, 187, robbery…" onChange={e => setQuery(e.target.value)} />
      </div>
      <div className="lexicon-grid">
        {lexicon.map(e => (
          <div key={e.code} className={`lex-item sev-${e.severity}`}>
            <b>{e.code}</b>
            <span>{e.meaning}</span>
          </div>
        ))}
      </div>
      {!lexicon.length && <div className="empty-note">NO MATCH IN LEXICON.</div>}

      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10.5, color: 'var(--ink-mute)', marginTop: 14 }}>
        CODE MEANINGS VARY BY JURISDICTION — APCO IS A CONVENTION, NOT A STANDARD. VERIFY AGAINST THE SPECIFIC AGENCY BEFORE RELYING ON A DECODE.
      </div>
    </div>
  )
}
