import React, { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { playBeep, playLock, playRadar } from '../utils/audio.js'

export const INITIAL_CASES = [
  {
    id: 'case-local',
    caseNumber: 'LOCAL-DRAFT-001',
    title: 'LOCAL EVIDENCE WORKSPACE',
    target: 'UNASSIGNED SUBJECT',
    bounty: 'NOT SET',
    leadInvestigator: 'LOCAL OPERATOR',
    status: 'DRAFT',
    items: []
  }
]

export default function EvidenceLocker() {
  const [cases, setCases] = useState(INITIAL_CASES)
  const [activeCaseId, setActiveCaseId] = useState(INITIAL_CASES[0].id)
  const [showAddModal, setShowAddModal] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newType, setNewType] = useState('WALLET HASH')
  const [newNotes, setNewNotes] = useState('')
  const [exportedReport, setExportedReport] = useState(null)

  const activeCase = cases.find(c => c.id === activeCaseId) || cases[0]

  const handleAddEvidence = async (e) => {
    e.preventDefault()
    if (!newTitle.trim()) return
    playLock()

    // REAL SHA-256 over the record's canonical content via Web Crypto.
    // A chain-of-custody log that invents its checksums is worse than no log at
    // all — the hash must actually be recomputable from the content it covers.
    const captured = new Date().toISOString()
    const canonical = JSON.stringify({
      type: newType,
      title: newTitle.trim(),
      notes: newNotes.trim(),
      captured,
    })
    const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(canonical))
    const hash = Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2, '0')).join('')

    const newEv = {
      canonical,
      captured,
      id: `ev-${Date.now()}`,
      type: newType,
      title: newTitle.trim(),
      date: new Date().toISOString().slice(0, 10),
      sha256: hash,
      notes: newNotes.trim(),
    }

    setCases(prev => prev.map(c => {
      if (c.id === activeCase.id) {
        return { ...c, items: [newEv, ...c.items] }
      }
      return c
    }))

    setNewTitle('')
    setNewNotes('')
    setShowAddModal(false)
  }

  const handleExportReport = () => {
    playRadar()
    const reportText = `
========================================================================================
◈ BOUNTY.GRID // LOCAL OSINT EVIDENCE WORKSHEET
◈ NOT AN OFFICIAL GOVERNMENT FORM OR LAW-ENFORCEMENT RECORD
========================================================================================
CASE NUMBER:    ${activeCase.caseNumber}
OPERATION:      ${activeCase.title}
TARGET SUBJECT: ${activeCase.target}
BOUNTY POSTED:  ${activeCase.bounty}
INVESTIGATOR:   ${activeCase.leadInvestigator}
DATE COMPILED:  ${new Date().toUTCString()}
STATUS:         ${activeCase.status}

----------------------------------------------------------------------------------------
CHAIN OF CUSTODY & EVIDENCE LEDGER (${activeCase.items.length} ITEMS LOGGED)
----------------------------------------------------------------------------------------
${activeCase.items.map((it, i) => `
[ITEM ${i + 1}] TYPE: ${it.type}
TITLE:       ${it.title}
DATE RECORD: ${it.date}
SHA-256:     ${it.sha256}
NOTES:       ${it.notes}
`).join('\n')}

----------------------------------------------------------------------------------------
AUTHENTICATION & INTEGRITY NOTE:
SHA-256 values above are hashes of the locally entered record text. They do not prove
source authenticity, custody, identity, or compliance with any government standard.
========================================================================================
`
    setExportedReport(reportText)
  }

  return (
    <div className="panel evidence-panel">
      <div className="panel-title" style={{ color: 'var(--mint)' }}>
        📁 DIGITAL EVIDENCE VAULT & CHAIN OF CUSTODY MANAGER
        <span className="meta">
          LOCAL WORKSHEET · SHA-256 INTEGRITY HASHING · MULTI-ITEM CASE VAULT
        </span>
      </div>

      <div className="evidence-layout">
        {/* Left: Case Selector */}
        <div className="evidence-cases-col">
          <div className="ev-label">ACTIVE INVESTIGATIVE CASE FILES:</div>
          <div className="cases-list">
            {cases.map(c => {
              const isActive = c.id === activeCase.id
              return (
                <div
                  key={c.id}
                  className={`case-vault-card ${isActive ? 'active' : ''}`}
                  onClick={() => {
                    playBeep()
                    setActiveCaseId(c.id)
                  }}
                >
                  <div className="case-num">{c.caseNumber}</div>
                  <div className="case-vault-title">{c.title}</div>
                  <div className="case-vault-bottom">
                    <span className="case-target">{c.target}</span>
                    <span className="case-count">{c.items.length} Items Logged</span>
                  </div>
                </div>
              )
            })}
          </div>

          <button
            className="btn primary"
            style={{ marginTop: '12px' }}
            onClick={() => {
              playBeep()
              setShowAddModal(true)
            }}
          >
            ➕ ADD EVIDENCE ITEM TO CASE
          </button>
        </div>

        {/* Right: Evidence Items Ledger */}
        <div className="evidence-items-col">
          <div className="active-case-header">
            <div>
              <h3>{activeCase.title}</h3>
              <div className="case-sub-meta">
                Case #: <b>{activeCase.caseNumber}</b> · Target: <b>{activeCase.target}</b> · Bounty: <b style={{ color: 'var(--amber)' }}>{activeCase.bounty}</b>
              </div>
            </div>

            <button className="btn" onClick={handleExportReport}>
              📄 EXPORT LOCAL WORKSHEET ↗
            </button>
          </div>

          <div className="evidence-items-stream">
            {activeCase.items.map((it, i) => (
              <motion.div
                key={it.id}
                className="evidence-item-card"
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <div className="ev-item-top">
                  <span className="ev-type-badge">{it.type}</span>
                  <span className="ev-title">{it.title}</span>
                  <span className="ev-date">{it.date}</span>
                </div>
                <div className="ev-notes">"{it.notes}"</div>
                <div className="ev-hash-box">
                  <span className="hash-label">SHA-256 CHECKSUM:</span>
                  <code className="hash-code">{it.sha256}</code>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Add Evidence Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="modal-backdrop" onClick={() => setShowAddModal(false)}>
            <motion.div
              className="modal-body ev-modal"
              onClick={e => e.stopPropagation()}
              initial={{ scale: 0.94, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.94, opacity: 0 }}
            >
              <div className="modal-header">
                <div className="modal-title">
                  <span className="modal-badge">CHAIN OF CUSTODY</span>
                  <h3>LOG NEW EVIDENCE // {activeCase.caseNumber}</h3>
                </div>
                <button className="modal-close" onClick={() => setShowAddModal(false)}>✕</button>
              </div>

              <form onSubmit={handleAddEvidence} className="ev-form">
                <div className="form-field">
                  <label>EVIDENCE CLASSIFICATION</label>
                  <select
                    className="form-input"
                    value={newType}
                    onChange={e => setNewType(e.target.value)}
                  >
                    <option value="WALLET HASH">UNHOSTED WALLET ADDRESS / PEELING CHAIN TX</option>
                    <option value="SURVEILLANCE">CCTV / AIS / FLIR SURVEILLANCE STILL</option>
                    <option value="COURT DOCKET">FEDERAL COURT DOCKET / SEIZURE WARRANT</option>
                    <option value="CORPORATE FILING">OFFSHORE BENEFICIAL OWNERSHIP FILING</option>
                    <option value="AUDIO LOG">POLICE SCANNER / INTERCEPT AUDIO LOG</option>
                  </select>
                </div>

                <div className="form-field">
                  <label>EVIDENCE TITLE / IDENTIFIER</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. ChipMixer Outflow Hop #3 to Dubai OTC Broker"
                    className="form-input"
                    value={newTitle}
                    onChange={e => setNewTitle(e.target.value)}
                  />
                </div>

                <div className="form-field">
                  <label>INVESTIGATIVE NOTES & CHAIN OF CUSTODY CONTEXT</label>
                  <textarea
                    rows="3"
                    placeholder="Describe source, timestamp, GPS coordinates, or cross-referencing agent..."
                    className="form-input"
                    value={newNotes}
                    onChange={e => setNewNotes(e.target.value)}
                  />
                </div>

                <div className="form-actions">
                  <button type="submit" className="btn primary">
                    ✔ COMMIT TO EVIDENCE VAULT & COMPUTE SHA-256
                  </button>
                  <button type="button" className="btn" onClick={() => setShowAddModal(false)}>
                    CANCEL
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Export Report Modal */}
      <AnimatePresence>
        {exportedReport && (
          <div className="modal-backdrop" onClick={() => setExportedReport(null)}>
            <motion.div
              className="modal-body report-modal"
              onClick={e => e.stopPropagation()}
              initial={{ scale: 0.94, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.94, opacity: 0 }}
            >
              <div className="modal-header">
                <div className="modal-title">
                  <span className="modal-badge">LOCAL WORKSHEET</span>
                  <h3>OSINT EVIDENCE WORKSHEET</h3>
                </div>
                <button className="modal-close" onClick={() => setExportedReport(null)}>✕</button>
              </div>

              <pre className="report-pre">{exportedReport}</pre>

              <div className="report-modal-actions">
                <button
                  className="btn primary"
                  onClick={() => {
                    navigator.clipboard?.writeText(exportedReport)
                    alert('Local OSINT worksheet copied to clipboard.')
                  }}
                >
                  📋 COPY DOSSIER TO CLIPBOARD
                </button>
                <button className="btn" onClick={() => setExportedReport(null)}>
                  CLOSE
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
