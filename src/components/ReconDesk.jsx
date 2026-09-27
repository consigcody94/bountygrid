import React, { useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { buildPivots, waybackHistory, traceAddress, searchRedNotices, TIP_CHANNELS, REWARD_RULES } from '../api/osint.js'
import { searchCourts, fetchCityNews } from '../api/feeds.js'
import { playBeep, playLock } from '../utils/audio.js'
import { timeAgo } from '../api/client.js'
import { desksForTarget, nativeQueries, LANGUAGES } from '../api/multilingual.js'
import { INTEL, COMPILED } from '../data/intel.js'

/* Replaces the old "biometric matcher", which fabricated a match percentage
   against a randomly-chosen real person. Everything here is a real query
   against a real source, or an explicitly-labelled link for the operator to
   run themselves. No invented findings. */

const TABS = [
  { id: 'intel', label: '★ VERIFIED INTEL' },
  { id: 'global', label: '🌍 NON-ENGLISH DESKS' },
  { id: 'pivots', label: '⌖ SEARCH PIVOTS' },
  { id: 'archive', label: '🕰 ARCHIVE RECON' },
  { id: 'chain', label: '⛓ CHAIN TRACE' },
  { id: 'interpol', label: '🌐 RED NOTICES' },
  { id: 'payout', label: 'TIP & REWARD' },
]

function AutoIntel({ target }) {
  const [state, setState] = useState({ loading: true, cases: [], news: [] })

  useEffect(() => {
    let live = true
    setState({ loading: true, cases: [], news: [] })
    Promise.all([
      searchCourts(`"${target.name}"`).catch(() => ({ results: [] })),
      fetchCityNews(target.name).catch(() => ({ items: [] })),
    ]).then(([courts, news]) => {
      if (!live) return
      setState({ loading: false, cases: (courts.results || []).slice(0, 4), news: (news.items || []).slice(0, 5) })
    })
    return () => { live = false }
  }, [target.name])

  return (
    <div className="recon-auto">
      <div className="recon-sub">◈ AUTOMATED SWEEP — federal dockets + global news, run live for this subject</div>
      {state.loading && <div className="empty-note">QUERYING COURTLISTENER + GDELT…</div>}

      {!state.loading && (
        <>
          <div className="recon-block">
            <div className="recon-block-title">FEDERAL COURT HITS ({state.cases.length})</div>
            {!state.cases.length && <div className="empty-note">No opinion matched this exact name. Dockets (type=r) and sealed indictments may still exist — check RECAP manually.</div>}
            {state.cases.map((c, i) => (
              <a key={i} className="recon-hit" href={c.url} target="_blank" rel="noreferrer">
                <b>{c.caseName}</b>
                <span>{c.court}{c.dateFiled ? ` · ${c.dateFiled}` : ''}{c.docketNumber ? ` · No. ${c.docketNumber}` : ''}</span>
              </a>
            ))}
          </div>

          <div className="recon-block">
            <div className="recon-block-title">NEWS MESH HITS ({state.news.length})</div>
            {!state.news.length && <div className="empty-note">No recent coverage in the last 7 days.</div>}
            {state.news.map((n, i) => (
              <a key={i} className="recon-hit" href={n.url} target="_blank" rel="noreferrer">
                <b>{n.title}</b>
                <span>{n.domain}{n.date ? ` · ${timeAgo(n.date)}` : ''}</span>
              </a>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

export default function ReconDesk({ wanted, onCaseFiles }) {
  const items = wanted?.items || []
  const [targetId, setTargetId] = useState('')
  const [tab, setTab] = useState('intel')

  const target = useMemo(
    () => items.find(i => i.uid === targetId) || items[0] || null,
    [items, targetId],
  )

  // --- archive recon ---
  const [domain, setDomain] = useState('')
  const [archive, setArchive] = useState(null)
  const [archiveBusy, setArchiveBusy] = useState(false)
  const runArchive = async () => {
    if (!domain.trim()) return
    setArchiveBusy(true); playBeep()
    setArchive(await waybackHistory(domain.trim()))
    setArchiveBusy(false)
  }

  // --- chain trace ---
  const [addr, setAddr] = useState('')
  const [chain, setChain] = useState(null)
  const [chainBusy, setChainBusy] = useState(false)
  const runChain = async () => {
    if (!addr.trim()) return
    setChainBusy(true); playLock()
    setChain(await traceAddress(addr.trim()))
    setChainBusy(false)
  }

  // --- interpol ---
  const [red, setRed] = useState(null)
  const [redBusy, setRedBusy] = useState(false)
  const runRed = async () => {
    setRedBusy(true); playBeep()
    const parts = String(target?.name || '').split(/[\s,]+/).filter(Boolean)
    setRed(await searchRedNotices({ name: parts[parts.length - 1] || '', forename: parts[0] || '' }))
    setRedBusy(false)
  }

  const pivots = useMemo(() => (target ? buildPivots(target) : []), [target])

  const dossier = useMemo(() => {
    if (!target) return null
    const slug = String(target.url || '').match(/\/wanted\/[^/]+\/([^/?#]+)/)?.[1] || ''
    return INTEL.find(d => d.slug === slug) || null
  }, [target])

  const desks = useMemo(() => (target ? desksForTarget(target) : []), [target])

  if (!target) {
    return <div className="panel"><div className="empty-note">NO TARGET BOARD LOADED — WAITING ON THE FBI UPLINK.</div></div>
  }

  return (
    <div className="panel recon-panel">
      <div className="panel-title">
        🔬 TARGET RECON DESK
        <span className="meta">LIVE QUERIES ONLY — NO SIMULATED RESULTS</span>
      </div>

      <div className="recon-targetbar">
        <label>ACTIVE TARGET:</label>
        <select
          value={target.uid}
          onChange={e => { setTargetId(e.target.value); playBeep(); setArchive(null); setChain(null); setRed(null) }}
        >
          {items.slice(0, 60).map(p => (
            <option key={p.uid} value={p.uid}>
              {p.name}{p.reward ? ` — ${p.reward}` : ''}
            </option>
          ))}
        </select>
        {target.reward && <span className="recon-bounty">{target.reward}</span>}
      </div>

      <div className="recon-idcard">
        {target.image
          ? <img src={target.image} alt={target.name} referrerPolicy="no-referrer" />
          : <div className="recon-noimg">NO IMAGE</div>}
        <div className="recon-idfacts">
          {[
            ['ALIASES', target.aliases],
            ['DOB', target.dob],
            ['BORN', target.placeOfBirth],
            ['NATIONALITY', target.nationality],
            ['LANGUAGES', target.languages],
            ['SCARS / MARKS', target.scarsAndMarks],
            ['KNOWN TIES', target.remarks],
            ['FIELD OFFICE', target.offices],
            ['NCIC', target.ncic],
          ].filter(([, v]) => v).map(([k, v]) => (
            <div key={k} className="recon-fact"><span>{k}</span><b>{v}</b></div>
          ))}
          <div className="recon-fact src">
            <span>SOURCE</span>
            <b><a href={target.url} target="_blank" rel="noreferrer">official FBI poster ↗</a></b>
          </div>
        </div>
      </div>

      <AutoIntel target={target} />

      <div className="recon-tabs">
        {TABS.map(t => (
          <button key={t.id} className={`class-btn ${tab === t.id ? 'active' : ''}`} onClick={() => { setTab(t.id); playBeep() }}>
            {t.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>

          {tab === 'intel' && (
            <div className="recon-tool">
              {!dossier && (
                <div className="empty-note">
                  NO COMPILED DOSSIER FOR THIS SUBJECT YET. Dossiers exist for the highest-value targets — switch target, or
                  use the other tabs to run live collection against this one.
                </div>
              )}
              {dossier && (
                <>
                  <div className={`collect-banner collect-${dossier.collectability.split(/[\s–-]/)[0].toLowerCase()}`}>
                    <div className="collect-head">
                      <span>COLLECTABILITY: <b>{dossier.collectability}</b></span>
                      <span className="collect-reward">{dossier.rewardLabel}</span>
                    </div>
                    <div className="collect-why">{dossier.collectabilityWhy}</div>
                    <div className="collect-note">↑ our assessment, not an official position</div>
                  </div>

                  <div className="recon-block-title">VERIFIED FINDINGS — every line sourced</div>
                  <div className="finding-list">
                    {dossier.findings.map((f, i) => (
                      <div key={i} className={`finding ${f.actionable ? 'actionable' : ''} ${f.disputed ? 'disputed' : ''} ${f.blocker ? 'blocker' : ''}`}>
                        <span className="finding-tag">
                          {f.actionable ? 'ACTIONABLE' : f.disputed ? 'DISPUTED' : f.blocker ? 'BLOCKER' : 'FACT'}
                        </span>
                        <span className="finding-body">{f.fact}</span>
                        <a className="finding-src" href={dossier.sources.find(s2 => s2.n === f.src)?.u} target="_blank" rel="noreferrer">
                          [{f.src}]
                        </a>
                      </div>
                    ))}
                  </div>

                  <div className="recon-block-title" style={{ marginTop: 16 }}>WHERE TO DIG NEXT</div>
                  <ul className="pivot-list">
                    {dossier.pivots.map((p2, i) => <li key={i}>{p2}</li>)}
                  </ul>

                  <div className="recon-block-title" style={{ marginTop: 16 }}>SOURCES</div>
                  <div className="src-list-block">
                    {dossier.sources.map(s2 => (
                      <a key={s2.n} href={s2.u} target="_blank" rel="noreferrer">[{s2.n}] {s2.t} ↗</a>
                    ))}
                  </div>
                  <div className="compiled-note">COMPILED {COMPILED} · re-verify before acting; boards move.</div>
                </>
              )}
            </div>
          )}

          {tab === 'global' && (
            <div className="recon-tool">
              <div className="recon-sub">
                Built from this subject's <b>official</b> country ties. Every new finding on this board today came from
                non-English sources — this is where the unworked ground is.
              </div>
              {!desks.length && <div className="empty-note">NO FOREIGN COUNTRY TIES ON THE OFFICIAL RECORD FOR THIS SUBJECT.</div>}
              {desks.map(desk => (
                <div key={desk.country} className="desk-block">
                  <div className="desk-head">
                    {desk.country}
                    <span>{desk.langs.map(l => `${LANGUAGES[l]?.flag || ''} ${LANGUAGES[l]?.name || l}`).join(' · ')}</span>
                  </div>
                  <div className="pivot-links">
                    {nativeQueries(target, desk).map((q, i) => (
                      <a key={i} className="pivot-link" href={q.url} target="_blank" rel="noreferrer" onClick={() => playBeep()}>
                        <b>{q.label}</b><code>{q.q}</code>
                      </a>
                    ))}
                  </div>
                  <div className="desk-meta"><b>LOCAL OUTLETS:</b> {desk.outlets.join(' · ')}</div>
                  <div className="desk-meta"><b>REGISTRIES:</b> {desk.registries.join(' · ')}</div>
                </div>
              ))}
            </div>
          )}

          {tab === 'pivots' && (
            <div className="recon-pivots">
              <div className="recon-sub">
                Queries built from this subject's <b>official</b> aliases and known ties. These are launchers — the app does not
                claim to have found an account it hasn't seen.
              </div>
              {pivots.map(g => (
                <div key={g.group} className="pivot-group">
                  <div className="pivot-head">{g.group}</div>
                  <div className="pivot-why">{g.why}</div>
                  <div className="pivot-links">
                    {g.queries.map(q => (
                      <a key={q.label} className="pivot-link" href={q.url} target="_blank" rel="noreferrer" onClick={() => playBeep()}>
                        <b>{q.label}</b><code>{q.q}</code>
                      </a>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {tab === 'archive' && (
            <div className="recon-tool">
              <div className="recon-sub">
                Internet Archive CDX. Highest-yield passive move against a subject's old businesses: read what the site said
                <b> before it was scrubbed</b>. Enter a domain tied to the subject.
              </div>
              <div className="recon-inputrow">
                <input value={domain} placeholder="e.g. onecoin.eu" onChange={e => setDomain(e.target.value)} onKeyDown={e => e.key === 'Enter' && runArchive()} />
                <button className="btn" onClick={runArchive} disabled={archiveBusy}>{archiveBusy ? 'PULLING…' : 'PULL CAPTURES'}</button>
              </div>
              {archive && !archive.ok && <div className="empty-note">ARCHIVE UNREACHABLE OR NO CAPTURES.</div>}
              {archive?.ok && !archive.items.length && <div className="empty-note">NO CAPTURES INDEXED FOR THAT DOMAIN.</div>}
              {archive?.ok && !!archive.items.length && (
                <>
                  <div className="recon-stat-row">
                    <div><b>{archive.total}</b><span>CAPTURES</span></div>
                    <div><b>{archive.first?.when}</b><span>FIRST SEEN</span></div>
                    <div><b>{archive.last?.when}</b><span>LAST SEEN</span></div>
                  </div>
                  <div className="recon-list">
                    {archive.items.slice(0, 14).map(c => (
                      <a key={c.timestamp} className="recon-hit" href={c.snapshot} target="_blank" rel="noreferrer">
                        <b>{c.when}</b><span>HTTP {c.statuscode} · {c.mimetype} · {c.original}</span>
                      </a>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {tab === 'chain' && (
            <div className="recon-tool">
              <div className="recon-sub">
                Live Bitcoin ledger via Blockstream. Real balances and real transaction graphs — high fan-out transactions are
                flagged because that <b>is</b> the on-chain signature of splitting behaviour, not a guess about it.
              </div>
              <div className="recon-inputrow">
                <input value={addr} placeholder="Bitcoin address (bc1… / 1… / 3…)" onChange={e => setAddr(e.target.value)} onKeyDown={e => e.key === 'Enter' && runChain()} />
                <button className="btn" onClick={runChain} disabled={chainBusy}>{chainBusy ? 'TRACING…' : 'TRACE ADDRESS'}</button>
              </div>
              {chain && !chain.ok && <div className="empty-note">{chain.reason}</div>}
              {chain?.ok && (
                <>
                  <div className="recon-stat-row">
                    <div><b>{chain.balance.toLocaleString()}</b><span>BTC BALANCE</span></div>
                    <div><b>{chain.received.toLocaleString()}</b><span>TOTAL RECEIVED</span></div>
                    <div><b>{chain.txCount.toLocaleString()}</b><span>TRANSACTIONS</span></div>
                    <div><b style={{ color: chain.highFanOut ? 'var(--amber)' : undefined }}>{chain.highFanOut}</b><span>HIGH FAN-OUT TX</span></div>
                  </div>
                  <div className="recon-list">
                    {chain.transactions.map(t => (
                      <a key={t.txid} className="recon-hit" href={t.url} target="_blank" rel="noreferrer">
                        <b>{t.value} BTC {t.fanOut && <span style={{ color: 'var(--amber)' }}>· FAN-OUT ×{t.outputs}</span>}</b>
                        <span>{t.time ? t.time.toISOString().slice(0, 10) : 'unconfirmed'} · {t.inputs} in / {t.outputs} out · {t.txid.slice(0, 24)}…</span>
                      </a>
                    ))}
                  </div>
                  <a className="btn ghost sm" href={chain.explorer} target="_blank" rel="noreferrer">OPEN FULL LEDGER ↗</a>
                </>
              )}
            </div>
          )}

          {tab === 'interpol' && (
            <div className="recon-tool">
              <div className="recon-sub">
                INTERPOL publishes public Red Notices. A matching notice means an international arrest warrant exists — which
                widens where a tip can be actioned.
              </div>
              <button className="btn" onClick={runRed} disabled={redBusy}>
                {redBusy ? 'QUERYING…' : `SEARCH RED NOTICES FOR ${target.name}`}
              </button>
              {red && !red.ok && <div className="empty-note">{red.reason}</div>}
              {red?.ok && !red.items.length && <div className="empty-note">NO PUBLIC RED NOTICE MATCHED THIS NAME. (Many notices are not published publicly.)</div>}
              {red?.ok && red.items.map(n => (
                <a key={n.id} className="recon-hit" href={n.url} target="_blank" rel="noreferrer">
                  <b>{n.name}</b>
                  <span>{[n.dob, n.nationalities, n.charges].filter(Boolean).join(' · ')}</span>
                </a>
              ))}
            </div>
          )}

          {tab === 'payout' && (
            <div className="recon-tool">
              <div className="recon-sub">
                <b>How this actually converts to money.</b> Read this before doing anything in the field.
              </div>
              <div className="payout-rules">
                {REWARD_RULES.map((r, i) => <div key={i} className="payout-rule">▸ {r}</div>)}
              </div>
              <div className="recon-block-title" style={{ marginTop: 18 }}>WHERE TO FILE FOR THIS TARGET</div>
              <div className="tip-grid">
                {TIP_CHANNELS.map(c => (
                  <div key={c.agency} className="tip-card">
                    <div className="tip-agency">{c.agency}</div>
                    <div className="tip-when">{c.when}</div>
                    {c.note && <div className="tip-note">{c.note}</div>}
                    <div className="tip-actions">
                      <a className="btn sm danger" href={c.url} target="_blank" rel="noreferrer">FILE TIP ↗</a>
                      {c.phone && <span className="tip-phone">{c.phone}</span>}
                    </div>
                  </div>
                ))}
              </div>
              <div className="recon-sub" style={{ marginTop: 14 }}>
                For <b>{target.name}</b>: {target.rewardText || 'no published reward on the official poster.'}
              </div>
              <button className="btn ghost" style={{ marginTop: 10 }} onClick={() => onCaseFiles(target.name)}>
                ⚖ PULL THIS SUBJECT'S COURT FILES
              </button>
            </div>
          )}

        </motion.div>
      </AnimatePresence>
    </div>
  )
}
