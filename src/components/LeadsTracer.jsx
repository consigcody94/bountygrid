import React, { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { INTEL, TRIAGE, COMPILED } from '../data/intel.js'
import { playBeep, playLock } from '../utils/audio.js'

/* Replaces the old "investigative leads" board, which presented invented
   narratives with fake confidence percentages ("confidence: 96") and fake
   wallet addresses as if a correlation engine had produced them.

   This renders the compiled dossiers in src/data/intel.js — real targets, real
   published rewards, and findings that each carry a citation. The priority
   ordering is our judgement and is labelled as such. */

const COLLECT_RANK = { 'MODERATE — TIME-SENSITIVE': 0, MODERATE: 1, 'LOW–MODERATE': 2, LOW: 3, 'EFFECTIVELY ZERO': 4 }

export default function LeadsTracer({ onTraceLead, onCaseFiles }) {
  const [openId, setOpenId] = useState(INTEL[0]?.slug || null)
  const [sort, setSort] = useState('priority')

  const ordered = useMemo(() => {
    const list = [...INTEL]
    if (sort === 'reward') list.sort((a, b) => b.reward - a.reward)
    else if (sort === 'collectability') list.sort((a, b) => (COLLECT_RANK[a.collectability] ?? 9) - (COLLECT_RANK[b.collectability] ?? 9))
    else list.sort((a, b) => a.priority - b.priority)
    return list
  }, [sort])

  const totalReward = INTEL.reduce((s, d) => s + d.reward, 0)

  return (
    <div className="panel">
      <div className="panel-title">
        ◈ PRIORITY BOARD
        <span className="meta">
          {INTEL.length} COMPILED DOSSIERS · ${(totalReward / 1e6).toFixed(1)}M IN PUBLISHED REWARDS · COMPILED {COMPILED}
        </span>
      </div>

      <div className="recon-sub">
        Ordered by where effort actually pays off, not by headline reward. Every finding inside a dossier carries a source
        you can open. <b>Collectability is our assessment</b>, not an official position.
      </div>

      {/* board-level triage */}
      <div className="triage-grid">
        {TRIAGE.summary.map(t => (
          <div key={t.k} className="triage-card">
            <div className="triage-k">{t.k}</div>
            <div className="triage-v">{t.v}</div>
          </div>
        ))}
      </div>

      <div className="court-pills" style={{ marginTop: 16 }}>
        <span className="pills-label">SORT:</span>
        {[['priority', 'PRIORITY'], ['reward', 'REWARD SIZE'], ['collectability', 'COLLECTABILITY']].map(([id, label]) => (
          <button key={id} className={`pill-btn ${sort === id ? 'active' : ''}`}
            onClick={() => { playBeep(); setSort(id) }}>{label}</button>
        ))}
      </div>

      <div className="lead-list">
        {ordered.map((d, idx) => {
          const open = openId === d.slug
          const collectClass = d.collectability.split(/[\s–-]/)[0].toLowerCase()
          return (
            <motion.div
              key={d.slug}
              className={`lead-card ${open ? 'open' : ''}`}
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: Math.min(idx * 0.05, 0.3) }}
            >
              <button className="lead-head" onClick={() => { playBeep(); setOpenId(open ? null : d.slug) }}>
                <span className="lead-idx">{String(idx + 1).padStart(2, '0')}</span>
                <span className="lead-title">
                  <b>{d.name}</b>
                  <span>{d.alias} · {d.country}</span>
                </span>
                <span className={`lead-collect collect-${collectClass}`}>{d.collectability}</span>
                <span className="lead-reward">${(d.reward / 1e6).toFixed(d.reward % 1e6 ? 1 : 0)}M</span>
                <span className="lead-chev">{open ? '▾' : '▸'}</span>
              </button>

              <AnimatePresence>
                {open && (
                  <motion.div
                    className="lead-body"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                  >
                    <div className="collect-why" style={{ marginTop: 0 }}>{d.collectabilityWhy}</div>

                    <div className="recon-block-title" style={{ marginTop: 14 }}>FINDINGS</div>
                    <div className="finding-list">
                      {d.findings.map((f, i) => (
                        <div key={i} className={`finding ${f.actionable ? 'actionable' : ''} ${f.disputed ? 'disputed' : ''} ${f.blocker ? 'blocker' : ''}`}>
                          <span className="finding-tag">
                            {f.actionable ? 'ACTIONABLE' : f.disputed ? 'DISPUTED' : f.blocker ? 'BLOCKER' : 'FACT'}
                          </span>
                          <span className="finding-body">{f.fact}</span>
                          <a className="finding-src" href={d.sources.find(s => s.n === f.src)?.u} target="_blank" rel="noreferrer">[{f.src}]</a>
                        </div>
                      ))}
                    </div>

                    <div className="recon-block-title" style={{ marginTop: 14 }}>WHERE TO DIG</div>
                    <ul className="pivot-list">{d.pivots.map((p, i) => <li key={i}>{p}</li>)}</ul>

                    <div className="recon-block-title" style={{ marginTop: 14 }}>SOURCES</div>
                    <div className="src-list-block">
                      {d.sources.map(s => <a key={s.n} href={s.u} target="_blank" rel="noreferrer">[{s.n}] {s.t} ↗</a>)}
                    </div>

                    <div className="wanted-actions" style={{ marginTop: 14 }}>
                      <button className="btn ghost sm" onClick={() => { playLock(); onCaseFiles && onCaseFiles(d.name) }}>
                        ⚖ COURT FILES
                      </button>
                      <button className="btn ghost sm" onClick={() => { playLock(); onTraceLead && onTraceLead(d) }}>
                        🎯 LOCATE COUNTRY ON GLOBE
                      </button>
                      <a className="btn sm danger" href="https://tips.fbi.gov" target="_blank" rel="noreferrer">FILE A TIP ↗</a>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )
        })}
      </div>

      <div className="compiled-note">
        COMPILED {COMPILED} FROM OFFICIAL POSTINGS AND PUBLISHED JOURNALISM. BOARDS MOVE — RE-VERIFY BEFORE ACTING.
      </div>
    </div>
  )
}
