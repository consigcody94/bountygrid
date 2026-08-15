import React, { useState } from 'react'
import { motion } from 'motion/react'
import { traceAddress } from '../api/osint.js'
import { playBeep, playLock } from '../utils/audio.js'

/* Rewritten to hit the real Bitcoin ledger via Blockstream.
   The previous version displayed invented addresses ("1ZeusRansom...9482") and
   Math.random() risk scores. Everything below is either a live ledger response
   or a documented, real, publicly-known address labelled as such. */

// Real addresses from public court records / published research. Each is
// verifiable on any block explorer — they are here as known-good test vectors.
const KNOWN_ADDRESSES = [
  {
    label: 'Silk Road — seized cluster',
    addr: '1F1tAaz5x1HUXrCNLbtMDqcw6o5GNn4xqX',
    note: 'Long-known Silk Road-associated address; heavily studied in public chain research.',
  },
  {
    label: 'Genesis block (Satoshi)',
    addr: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
    note: 'The first Bitcoin address ever. Useful as a sanity check that the ledger feed is live.',
  },
]

function fmt(n) {
  return Number(n).toLocaleString(undefined, { maximumFractionDigits: 8 })
}

export default function CryptoTracker({ onCourtSearch }) {
  const [addr, setAddr] = useState('')
  const [res, setRes] = useState(null)
  const [busy, setBusy] = useState(false)

  const run = async (value) => {
    const target = (value ?? addr).trim()
    if (!target) return
    setBusy(true); playLock()
    setRes(await traceAddress(target))
    setBusy(false)
  }

  return (
    <div className="panel">
      <div className="panel-title">
        ⛓ ON-CHAIN LEDGER TRACE
        <span className="meta">BLOCKSTREAM · LIVE BITCOIN LEDGER · NO KEY REQUIRED</span>
      </div>

      <div className="recon-sub">
        Queries the live Bitcoin chain. Balances, transaction counts and counterparties are read straight off the ledger.
        Transactions with ten or more outputs are flagged as <b>high fan-out</b> because that is the actual on-chain
        signature of value-splitting — it is a measurement, not an inference about intent.
      </div>

      <div className="recon-inputrow">
        <input
          value={addr}
          placeholder="Bitcoin address — bc1… / 1… / 3…"
          onChange={e => setAddr(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && run()}
        />
        <button className="btn" onClick={() => run()} disabled={busy}>{busy ? 'TRACING…' : 'TRACE'}</button>
      </div>

      <div className="court-pills">
        <span className="pills-label">KNOWN TEST VECTORS:</span>
        {KNOWN_ADDRESSES.map(k => (
          <button key={k.addr} className="pill-btn" title={k.note}
            onClick={() => { playBeep(); setAddr(k.addr); run(k.addr) }}>
            {k.label}
          </button>
        ))}
      </div>

      {res && !res.ok && <div className="empty-note">{res.reason}</div>}

      {res?.ok && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="recon-stat-row">
            <div><b>{fmt(res.balance)}</b><span>BTC BALANCE</span></div>
            <div><b>{fmt(res.received)}</b><span>TOTAL RECEIVED</span></div>
            <div><b>{fmt(res.spent)}</b><span>TOTAL SPENT</span></div>
            <div><b>{res.txCount.toLocaleString()}</b><span>TRANSACTIONS</span></div>
            <div><b style={{ color: res.highFanOut ? 'var(--amber)' : undefined }}>{res.highFanOut}</b><span>HIGH FAN-OUT</span></div>
          </div>

          <div className="recon-block-title">MOST RECENT TRANSACTIONS</div>
          <div className="recon-list">
            {res.transactions.map(t => (
              <a key={t.txid} className="recon-hit" href={t.url} target="_blank" rel="noreferrer">
                <b>
                  {fmt(t.value)} BTC
                  {t.fanOut && <span style={{ color: 'var(--amber)' }}> · FAN-OUT ×{t.outputs}</span>}
                  {!t.confirmed && <span style={{ color: 'var(--red)' }}> · UNCONFIRMED</span>}
                </b>
                <span>
                  {t.time ? t.time.toISOString().slice(0, 16).replace('T', ' ') : 'pending'} ·
                  {' '}{t.inputs} in / {t.outputs} out · block {t.height || '—'} · {t.txid.slice(0, 28)}…
                </span>
              </a>
            ))}
          </div>

          <div className="recon-block-title" style={{ marginTop: 14 }}>NEXT STEPS</div>
          <ul className="pivot-list">
            <li>Open the full ledger to walk counterparties outward — the graph, not the single address, is where attribution lives.</li>
            <li>Check the address against the OFAC SDN crypto list; a sanctions hit changes who you report to.</li>
            <li>If an address appears in a charging document, pull that docket — indictments name the exchange and the account holder.</li>
          </ul>

          <div className="wanted-actions" style={{ marginTop: 10 }}>
            <a className="btn ghost sm" href={res.explorer} target="_blank" rel="noreferrer">OPEN FULL LEDGER ↗</a>
            <a className="btn ghost sm" href="https://sanctionssearch.ofac.treas.gov/" target="_blank" rel="noreferrer">OFAC SDN SEARCH ↗</a>
            <button className="btn ghost sm" onClick={() => onCourtSearch && onCourtSearch(res.address)}>
              ⚖ SEARCH DOCKETS FOR THIS ADDRESS
            </button>
          </div>
        </motion.div>
      )}

      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10.5, color: 'var(--ink-mute)', marginTop: 12 }}>
        LIVE DATA: BLOCKSTREAM.INFO PUBLIC API. AN ADDRESS APPEARING HERE IS NOT EVIDENCE OF WRONGDOING — IT IS LEDGER DATA.
      </div>
    </div>
  )
}
