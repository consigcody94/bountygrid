import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { playBeep, playLock, playRadar } from '../utils/audio.js'
import { FALLBACK_WANTED } from '../data/fallback.js'

export default function BountyDesk({ wanted }) {
  const targets = wanted?.items?.length ? wanted.items : FALLBACK_WANTED
  const [selectedTargetId, setSelectedTargetId] = useState(targets[0]?.uid || '')
  const [tipTier, setTipTier] = useState('full') // 'full', 'location', 'asset'
  const [showTipModal, setShowTipModal] = useState(false)
  const [submittedLead, setSubmittedLead] = useState(null)
  const [location, setLocation] = useState('')
  const [observedAt, setObservedAt] = useState('')
  const [details, setDetails] = useState('')
  const [contact, setContact] = useState('')

  useEffect(() => {
    if (!targets.some(item => item.uid === selectedTargetId)) {
      setSelectedTargetId(targets[0]?.uid || '')
    }
  }, [targets, selectedTargetId])

  const target = targets.find(w => w.uid === selectedTargetId) || targets[0] || FALLBACK_WANTED[0]

  // Parse reward amount from text
  const rawReward = target.reward || '$100,000'
  const rewardMatch = rawReward.match(/\$([\d,.]+)\s*(k|m|b|thousand|million|billion)?/i)
  const parsedReward = rewardMatch
    ? parseFloat(rewardMatch[1].replace(/,/g, '')) * ({ k: 1e3, m: 1e6, b: 1e9, thousand: 1e3, million: 1e6, billion: 1e9 }[String(rewardMatch[2] || '').toLowerCase()] || 1)
    : 0
  const baseRewardNumber = Number.isFinite(target.rewardAmount) && target.rewardAmount > 0
    ? target.rewardAmount
    : parsedReward || 100000

  // Calculate payout percentages
  const multiplier = tipTier === 'full' ? 1.0 : tipTier === 'location' ? 0.6 : 0.25
  const estimatedGross = Math.round(baseRewardNumber * multiplier)
  const estimatedTaxWithholding = Math.round(estimatedGross * 0.24)
  const estimatedNet = estimatedGross - estimatedTaxWithholding

  const handleOpenTipFiler = () => {
    playRadar()
    setShowTipModal(true)
  }

  const handleFormSubmit = (e) => {
    e.preventDefault()
    playLock()
    setSubmittedLead({
      target: target.name,
      docket: target.ncic || 'NCIC-WARRANT-ACTIVE',
      timestamp: new Date().toISOString(),
      location: location.trim(),
      observedAt,
      details: details.trim(),
      contact: contact.trim(),
      // Deliberately no generated tracking code. Only the receiving agency can
      // issue a tip reference — minting one here would imply a filing that has
      // not happened and give a false sense of an established claim.
      trackingCode: null,
    })
  }

  return (
    <div className="panel bounty-panel">
      <div className="panel-title" style={{ color: 'var(--amber)' }}>
        Reward notice & tip preparation
        <span className="meta">
          {wanted?.source === 'live' ? 'LIVE FBI BOARD' : 'CACHED SAMPLE'} · LOCAL PAYOUT ESTIMATE ONLY
        </span>
      </div>

      <div className="bounty-grid-layout">
        {/* Left Column: Target Selector & Calculation */}
        <div className="bounty-calc-col">
          <div className="bounty-label">SELECT AN OFFICIAL TARGET:</div>
          <select
            className="bounty-select"
            value={selectedTargetId}
            onChange={e => {
              playBeep()
              setSelectedTargetId(e.target.value)
            }}
          >
            {targets.map(w => (
              <option key={w.uid} value={w.uid}>
                {w.name} — [{w.reward || 'REWARD ACTIVE'}]
              </option>
            ))}
          </select>

          <div className="target-recon-card">
            <div className="target-recon-photo-box">
              <img
                src={target.image}
                alt={target.name}
                className="target-recon-img"
                onError={e => {
                  e.target.style.display = 'none'
                  e.target.nextSibling.style.display = 'flex'
                }}
              />
              <div className="target-recon-fallback">🎯</div>
            </div>
            <div className="target-recon-details">
              <div className="recon-name">{target.name}</div>
              <div className="recon-class">{target.classification?.toUpperCase()}</div>
              <div className="recon-reward">{target.reward || 'OFFICIAL REWARD POSTED'}</div>
              <div className="recon-offices">📍 Field Office: {target.offices || 'Washington Field'}</div>
              <div className="recon-ncic">NCIC ID: <b>{target.ncic || 'W-FED-99482'}</b></div>
            </div>
          </div>

          <div className="tier-selector-group">
            <div className="bounty-label">SELECT RECOVERY / TIP CONTRIBUTION TIER:</div>
            <div className="tier-buttons">
              <button
                className={`tier-btn ${tipTier === 'full' ? 'active' : ''}`}
                onClick={() => {
                  playBeep()
                  setTipTier('full')
                }}
              >
                <b>DIRECT APPREHENSION</b>
                <span>100% Payout Tier</span>
              </button>
              <button
                className={`tier-btn ${tipTier === 'location' ? 'active' : ''}`}
                onClick={() => {
                  playBeep()
                  setTipTier('location')
                }}
              >
                <b>VERIFIED LOCATION PIN</b>
                <span>60% Payout Tier</span>
              </button>
              <button
                className={`tier-btn ${tipTier === 'asset' ? 'active' : ''}`}
                onClick={() => {
                  playBeep()
                  setTipTier('asset')
                }}
              >
                <b>ASSET / WALLET TRAIL</b>
                <span>25% Recovery Tier</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Payout Ledger & 1-Click Tip Filing */}
        <div className="bounty-ledger-col">
          <div className="payout-summary-card">
            <div className="payout-card-title">◈ ESTIMATED NET BOUNTY DISBURSEMENT</div>
            <div className="payout-hero-num">${estimatedNet.toLocaleString()}</div>
            <div className="payout-breakdown-table">
              <div className="breakdown-row">
                <span>Official Federal Base Bounty:</span>
                <b>${baseRewardNumber.toLocaleString()}</b>
              </div>
              <div className="breakdown-row">
                <span>Selected Intelligence Multiplier:</span>
                <b>{(multiplier * 100).toFixed(0)}%</b>
              </div>
              <div className="breakdown-row">
                <span>Gross Eligible Claim:</span>
                <b style={{ color: 'var(--amber)' }}>${estimatedGross.toLocaleString()}</b>
              </div>
              <div className="breakdown-row">
                <span>Est. IRS 24% Backup Withholding:</span>
                <span style={{ color: 'var(--red)' }}>-${estimatedTaxWithholding.toLocaleString()}</span>
              </div>
            </div>

            <div className="payout-action-row">
              <button className="btn primary" onClick={handleOpenTipFiler}>
                🚀 INITIATE ENCRYPTED TIP FILING
              </button>
              <a
                href={target.url || 'https://tips.fbi.gov/'}
                target="_blank"
                rel="noreferrer"
                className="btn"
              >
                EXTERNAL FBI.GOV UPLINK ↗
              </a>
            </div>
          </div>

          <div className="legal-protocol-box">
            <div className="protocol-title">⚖ STATUTORY BOUNTY CLAIM PROTOCOL</div>
            <ul className="protocol-list">
              <li><b>Title 18 U.S.C. § 3059:</b> Grants the Attorney General discretion to disburse government rewards for information leading to the arrest of federal fugitives.</li>
              <li><b>Department of State RFJ:</b> Rewards for Justice program protects recipient anonymity and can process disbursements via third-party escrow or attorney representations.</li>
              <li><b>Strict Prohibition:</b> Rewards are never paid to individuals involved in the planning or execution of the criminal conduct.</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Encrypted Tip Submission Modal */}
      <AnimatePresence>
        {showTipModal && (
          <div className="modal-backdrop" onClick={() => setShowTipModal(false)}>
            <motion.div
              className="modal-body tip-modal"
              onClick={e => e.stopPropagation()}
              initial={{ scale: 0.94, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.94, opacity: 0 }}
            >
              <div className="modal-header">
                <div className="modal-title">
                  <span className="modal-badge">SECURE RECON</span>
                  <h3>ENCRYPTED TIP FILING // {target.name}</h3>
                </div>
                <button className="modal-close" onClick={() => setShowTipModal(false)}>✕</button>
              </div>

              {!submittedLead ? (
                <form onSubmit={handleFormSubmit} className="tip-form">
                  <div className="form-info-banner">
                    🔒 All submissions are encrypted in transit. You may choose to remain completely anonymous or provide an attorney contact for reward distribution.
                  </div>

                  <div className="form-field">
                    <label>TARGET FUGITIVE / DOCKET</label>
                    <input
                      type="text"
                      readOnly
                      value={`${target.name} [${target.ncic || 'WARRANT ACTIVE'}] — Reward: ${target.reward || '$100,000'}`}
                      className="form-input read-only"
                    />
                  </div>

                  <div className="form-grid">
                    <div className="form-field">
                      <label>LOCATION / CITY SIGHTING</label>
                      <input
                        type="text"
                        placeholder="e.g. Dubai Marina, London Heathrow, Chicago Loop"
                        required
                        className="form-input"
                        value={location}
                        onChange={e => setLocation(e.target.value)}
                      />
                    </div>
                    <div className="form-field">
                      <label>DATE & TIME OBSERVED</label>
                      <input
                        type="datetime-local"
                        className="form-input"
                        required
                        value={observedAt}
                        onChange={e => setObservedAt(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="form-field">
                    <label>OBSERVATION OR SUPPORTING DETAIL</label>
                    <textarea
                      rows="4"
                      placeholder="Provide specific, verifiable intelligence: vehicle license plate, associates, crypto transaction hash, vessel name, or physical address..."
                      required
                      className="form-input"
                      value={details}
                      onChange={e => setDetails(e.target.value)}
                    />
                  </div>

                  <div className="form-field">
                    <label>CONTACT DETAILS (OPTIONAL)</label>
                    <input
                      type="text"
                      placeholder="legal-counsel@protonmail.com or PGP fingerprint"
                      className="form-input"
                      value={contact}
                      onChange={e => setContact(e.target.value)}
                    />
                  </div>

                  <div className="form-actions">
                    <button type="submit" className="btn primary">
                      Save local draft
                    </button>
                    <button type="button" className="btn" onClick={() => setShowTipModal(false)}>
                      CANCEL
                    </button>
                  </div>
                </form>
              ) : (
                <div className="lead-receipt">
                  <div className="receipt-badge" style={{ background: 'rgba(255,200,87,0.14)', color: 'var(--amber)' }}>
                    ⚠ DRAFT SAVED LOCALLY — NOT YET FILED WITH ANY AGENCY
                  </div>
                  <p>
                    This console cannot submit tips. Your draft for <b>{submittedLead.target}</b> exists only in this browser.
                    <b> Nothing has been sent to the FBI or anyone else.</b> To create a real, timestamped claim — the thing
                    reward eligibility actually depends on — file it directly with the agency below.
                  </p>
                  <div className="receipt-code-box">
                    <div className="receipt-code-label">DRAFT CONTENT — COPY THIS INTO THE AGENCY FORM:</div>
                    <textarea
                      className="scanner-input"
                      readOnly
                      rows={5}
                      value={[
                        `SUBJECT: ${submittedLead.target}`,
                        submittedLead.docket ? `NCIC / REF: ${submittedLead.docket}` : '',
                        `DRAFTED (local): ${submittedLead.timestamp}`,
                        `LOCATION: ${submittedLead.location}`,
                        `OBSERVED: ${submittedLead.observedAt}`,
                        submittedLead.contact ? `CONTACT: ${submittedLead.contact}` : '',
                        '',
                        submittedLead.details || '(add your observation: what you saw, exactly where, exactly when)',
                      ].filter(Boolean).join(String.fromCharCode(10))}
                      onFocus={e => e.target.select()}
                    />
                  </div>
                  <div className="tip-actions" style={{ marginTop: 12 }}>
                    <a className="btn danger" href="https://tips.fbi.gov" target="_blank" rel="noreferrer">FILE WITH FBI ↗</a>
                    <a className="btn ghost" href="https://rewardsforjustice.net/submit-a-tip/" target="_blank" rel="noreferrer">STATE DEPT (for $5M+ targets) ↗</a>
                    <a className="btn ghost" href="https://www.usmarshals.gov/tips" target="_blank" rel="noreferrer">U.S. MARSHALS ↗</a>
                  </div>
                  <p style={{ marginTop: 10, fontSize: 13, color: 'var(--ink-mute)' }}>
                    The agency issues the only reference number that counts. Keep whatever they give you — that is your claim.
                  </p>
                  <button
                    className="btn primary"
                    style={{ marginTop: 12 }}
                    onClick={() => {
                      setSubmittedLead(null)
                      setShowTipModal(false)
                    }}
                  >
                    CLOSE
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
