import React, { useEffect, useMemo, useState } from 'react'
import { motion } from 'motion/react'
import { shodanSearch, shodanHost, shodanInfo, QUERY_TEMPLATES, fillTemplate } from '../api/shodan.js'
import { playBeep, playLock } from '../utils/audio.js'

/* Real Shodan. With a key in .env.local this runs live host searches; without
   one it says so and stays useful as a query builder. It never displays a
   fabricated host, banner, or CVE. */

export default function ShodanRecon({ selectedCity }) {
  const city = selectedCity?.name || 'Chicago'
  const [info, setInfo] = useState(null)
  const [query, setQuery] = useState('')
  const [res, setRes] = useState(null)
  const [host, setHost] = useState(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => { shodanInfo().then(setInfo) }, [])

  const templates = useMemo(
    () => QUERY_TEMPLATES.map(g => ({ ...g, items: g.items.map(i => ({ ...i, filled: fillTemplate(i.q, city) })) })),
    [city],
  )

  const runSearch = async (q) => {
    const target = (q ?? query).trim()
    if (!target) return
    setBusy(true); playLock(); setHost(null)
    setQuery(target)
    setRes(await shodanSearch(target))
    setBusy(false)
  }

  const runHost = async (ip) => {
    setBusy(true); playBeep(); setRes(null)
    setHost(await shodanHost(ip))
    setBusy(false)
  }

  const keyed = info?.ok

  return (
    <div className="panel">
      <div className="panel-title">
        🛰 INFRASTRUCTURE RECON — SHODAN
        <span className="meta">
          {info == null ? 'CHECKING KEY…'
            : keyed ? `LIVE · PLAN ${String(info.plan).toUpperCase()} · ${info.queryCredits ?? '—'} QUERY CREDITS`
            : 'NO KEY — QUERY BUILDER MODE'}
        </span>
      </div>

      {!keyed && info && (
        <div className="collect-banner collect-low">
          <div className="collect-why">
            <b>Shodan is not connected.</b> {info.reason}
          </div>
          <div className="collect-note">
            Add <code>SHODAN_API_KEY=…</code> to <code>.env.local</code> and restart the dev server. The key is read only by
            the dev server and injected server-side — it never reaches the browser. Until then the queries below are still
            valid Shodan syntax you can paste into shodan.io.
          </div>
        </div>
      )}

      <div className="recon-sub">
        Searching internet-exposed infrastructure around <b>{city}</b>. Results are live host records from Shodan's scans —
        an exposed device is a fact about a network, not evidence about a person.
      </div>

      <div className="recon-inputrow">
        <input
          value={query}
          placeholder={`Shodan query — e.g. city:"${city}" port:554 has_screenshot:true`}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && runSearch()}
        />
        <button className="btn" onClick={() => runSearch()} disabled={busy}>{busy ? 'SCANNING…' : 'SEARCH'}</button>
      </div>

      {templates.map(g => (
        <div key={g.group} className="pivot-group">
          <div className="pivot-head">{g.group}</div>
          <div className="pivot-links">
            {g.items.map(i => (
              <button key={i.label} className="pivot-link" style={{ textAlign: 'left', cursor: 'pointer' }}
                onClick={() => runSearch(i.filled)}>
                <b>{i.label}</b><code>{i.filled}</code>
              </button>
            ))}
          </div>
        </div>
      ))}

      {res && !res.ok && <div className="empty-note">{res.reason}</div>}

      {res?.ok && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <div className="recon-stat-row">
            <div><b>{res.total.toLocaleString()}</b><span>TOTAL MATCHES</span></div>
            <div><b>{res.matches.length}</b><span>SHOWN</span></div>
          </div>
          <div className="recon-list">
            {res.matches.map((m, i) => (
              <div key={`${m.ip}-${m.port}-${i}`} className="recon-hit" style={{ cursor: 'pointer' }} onClick={() => runHost(m.ip)}>
                <b>
                  {m.ip}:{m.port} <span style={{ color: 'var(--ink-mute)' }}>{m.transport}</span>
                  {!!m.vulns.length && <span style={{ color: 'var(--red)' }}> · {m.vulns.length} CVE</span>}
                </b>
                <span>
                  {[m.product && `${m.product} ${m.version}`.trim(), m.org, [m.city, m.country].filter(Boolean).join(', ')]
                    .filter(Boolean).join(' · ')}
                  {m.hostnames ? ` · ${m.hostnames}` : ''}
                </span>
              </div>
            ))}
          </div>
          <div className="compiled-note">CLICK ANY ROW FOR THE FULL HOST RECORD.</div>
        </motion.div>
      )}

      {host && !host.ok && <div className="empty-note">{host.reason}</div>}

      {host?.ok && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ marginTop: 14 }}>
          <div className="recon-block-title">HOST RECORD — {host.ip}</div>
          <div className="recon-idfacts">
            {[
              ['ORG', host.org], ['ISP', host.isp], ['ASN', host.asn], ['OS', host.os],
              ['LOCATION', [host.city, host.country].filter(Boolean).join(', ')],
              ['HOSTNAMES', host.hostnames.join(', ')],
              ['OPEN PORTS', host.ports.join(', ')],
              ['CVEs', host.vulns.join(', ')],
              ['LAST SCAN', host.lastUpdate],
            ].filter(([, v]) => v).map(([k, v]) => (
              <div key={k} className="recon-fact"><span>{k}</span><b>{v}</b></div>
            ))}
          </div>
          <a className="btn ghost sm" href={host.url} target="_blank" rel="noreferrer" style={{ marginTop: 10 }}>
            OPEN ON SHODAN ↗
          </a>
        </motion.div>
      )}

      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10.5, color: 'var(--ink-mute)', marginTop: 14 }}>
        SHODAN INDEXES PUBLICLY-REACHABLE SERVICES. VIEWING AN INDEX ENTRY IS PASSIVE; CONNECTING TO A HOST YOU DO NOT OWN MAY NOT BE LAWFUL.
      </div>
    </div>
  )
}
