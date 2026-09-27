import React, { useEffect, useState } from 'react'
import { motion } from 'motion/react'
import { playBeep, playLock, playRadar } from '../utils/audio.js'
import { FALLBACK_WANTED } from '../data/fallback.js'

export const OSINT_CATEGORIES = [
  {
    id: 'socmint',
    name: 'SOCMINT & DIGITAL FOOTPRINT',
    icon: '🔍',
    desc: 'Passive username enumeration, profile footprinting, and archived alias correlation.',
    tools: [
      { name: 'Sherlock / Maigret Syntax', queryType: 'Username Recon', tip: 'Checks 400+ public platforms for legacy handles, developer repos, and forum accounts.' },
      { name: 'WhatsMyName Web Grid', queryType: 'Alias Lookup', tip: 'Fast identification of live username registrations across social media and financial platforms.' },
      { name: 'Wayback Machine / Archive.today', queryType: 'Historical Snapshots', tip: 'Retrieves cached/deleted social media biographies, forum posts, and personal websites.' },
    ]
  },
  {
    id: 'corporate',
    name: 'CORPORATE REGISTRIES & ASSET FLIGHT',
    icon: '🏛',
    desc: 'Public business records, nominee directors, shell companies, and free-zone registry search.',
    tools: [
      { name: 'OpenCorporates / EDGAR', queryType: 'Entity Filings', tip: 'Global open corporate registry mapping beneficial ownership across 200M+ companies.' },
      { name: 'UAE National Economic Register (NER)', queryType: 'Free-Zone Registry', tip: 'Official UAE portal to verify registered trade licenses across DMCC, DIFC, and offshore zones.' },
      { name: 'UK Companies House', queryType: 'Director Disclosures', tip: 'Public record of directors, persons with significant control (PSC), and annual accounts.' },
    ]
  },
  {
    id: 'onchain',
    name: 'ON-CHAIN & CRYPTO FORENSICS',
    icon: '⛓',
    desc: 'Public blockchain ledgers, peeling chain tracing, and sanctioned cluster monitoring.',
    tools: [
      { name: 'Blockchain.com / Etherscan / TronScan', queryType: 'Public Explorer', tip: 'Inspects unhosted wallet transactions, gas token flows, and smart contract calls.' },
      { name: 'OFAC SDN Cryptocurrency Identifier Check', queryType: 'Sanctions Check', tip: 'Cross-references addresses against Treasury Specially Designated Nationals lists.' },
      { name: 'Chainabuse / BitcoinAbuse Database', queryType: 'Abuse Reports', tip: 'Community and law enforcement reporting database for ransomware and fraud addresses.' },
    ]
  },
  {
    id: 'geoint',
    name: 'GEOINT & IMAGE VERIFICATION',
    icon: '🛰',
    desc: 'Reverse visual search, metadata inspection, and geographical landmark cross-referencing.',
    tools: [
      { name: 'Yandex / Google / TinEye Reverse Search', queryType: 'Visual Matching', tip: 'Identifies uncropped or alternate angles of surveillance photos across indexed web pages.' },
      { name: 'SunCalc / Shadows Geolocation', queryType: 'Chrono-location', tip: 'Calculates sun angles and shadows in surveillance photos to establish timestamp/latitude.' },
      { name: 'Overpass Turbo / OpenStreetMap Query', queryType: 'Infrastructure Search', tip: 'Custom geospatial queries for unique street furniture, antenna towers, or architectural motifs.' },
    ]
  }
]

export default function OsintWorkbench({ wanted, onCourtSearch }) {
  const targets = wanted?.items?.length ? wanted.items : FALLBACK_WANTED
  const [activeCategory, setActiveCategory] = useState(OSINT_CATEGORIES[0].id)
  const [selectedTarget, setSelectedTarget] = useState(targets[0]?.name || '')
  const [generatedDorks, setGeneratedDorks] = useState([])

  useEffect(() => {
    if (!targets.some(target => target.name === selectedTarget)) {
      setSelectedTarget(targets[0]?.name || '')
    }
  }, [targets, selectedTarget])

  const currentCategory = OSINT_CATEGORIES.find(c => c.id === activeCategory) || OSINT_CATEGORIES[0]

  // Generate target-specific passive Google dorks / query templates
  const generateDorkPack = (targetName) => {
    playRadar()
    setSelectedTarget(targetName)
    const clean = targetName.replace(/[^a-zA-Z0-9 ]/g, '').trim()
    const parts = clean.split(' ')
    const lastName = parts[parts.length - 1]

    setGeneratedDorks([
      {
        title: 'Federal Docket & Judicial Ruling Recon',
        dork: `"${clean}" ("indictment" OR "docket" OR "seizure" OR "affidavit") filetype:pdf`,
        engine: 'https://www.google.com/search?q=',
      },
      {
        title: 'Public Corporate & Trade Filings',
        dork: `"${clean}" ("director" OR "shareholder" OR "limited" OR "LLC" OR "registered agent")`,
        engine: 'https://www.google.com/search?q=',
      },
      {
        title: 'Archived Documents & Leaks',
        dork: `site:archive.org "${clean}" OR "${lastName}"`,
        engine: 'https://www.google.com/search?q=',
      },
      {
        title: 'Offshore Registry & Free-Zone Lookups',
        dork: `"${clean}" ("DMCC" OR "DIFC" OR "Dubai" OR "Cyprus" OR "BVI" OR "Panama")`,
        engine: 'https://www.google.com/search?q=',
      },
    ])
  }

  return (
    <div className="panel osint-panel">
      <div className="panel-title" style={{ color: 'var(--cyan)' }}>
        🔬 OSINT RECON WORKBENCH & INVESTIGATIVE METHODOLOGY DESK
        <span className="meta">
          PASSIVE RESEARCH PROTOCOLS · PUBLIC REGISTRY MAPPING · SEARCH SYNTAX GENERATOR
        </span>
      </div>

      {/* Target Dork Generator Bar */}
      <div className="osint-target-bar">
        <div className="target-bar-label">TARGET FUGITIVE / ENTITY TO CONSTRUCT QUERY PACK:</div>
        <div className="target-input-row">
          <select
            className="osint-select"
            value={selectedTarget}
            onChange={e => generateDorkPack(e.target.value)}
          >
            {targets.map(w => (
              <option key={w.uid} value={w.name}>{w.name} — [{w.offices || 'Federal Warrant'}]</option>
            ))}
          </select>
          <button className="btn primary" onClick={() => generateDorkPack(selectedTarget)}>
            ⚡ GENERATE OSINT QUERY PACK
          </button>
        </div>
      </div>

      {/* Generated Dork Queries Grid */}
      {generatedDorks.length > 0 && (
        <motion.div
          className="dorks-results-box"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="dorks-title">Generated public-source queries</div>
          <div className="dorks-grid">
            {generatedDorks.map((d, i) => (
              <div key={i} className="dork-card">
                <div className="dork-name">{d.title}</div>
                <code className="dork-code">{d.dork}</code>
                <div className="dork-actions">
                  <a
                    href={`${d.engine}${encodeURIComponent(d.dork)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="dork-link-btn"
                  >
                    SEARCH WEB ↗
                  </a>
                  {onCourtSearch && (
                    <button
                      className="dork-link-btn alt"
                      onClick={() => {
                        playBeep()
                        onCourtSearch(selectedTarget)
                      }}
                    >
                      COURT DOCKET SEARCH ↗
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Category Navigation Tabs */}
      <div className="osint-category-tabs">
        {OSINT_CATEGORIES.map(cat => (
          <button
            key={cat.id}
            className={`osint-cat-btn ${activeCategory === cat.id ? 'active' : ''}`}
            onClick={() => {
              playBeep()
              setActiveCategory(cat.id)
            }}
          >
            <span className="cat-icon">{cat.icon}</span>
            <span className="cat-text">{cat.name}</span>
          </button>
        ))}
      </div>

      {/* Category Tools Breakdown */}
      <div className="osint-tools-grid">
        {currentCategory.tools.map((tool, i) => (
          <div key={i} className="osint-tool-card">
            <div className="tool-card-top">
              <span className="tool-name">{tool.name}</span>
              <span className="tool-type">{tool.queryType}</span>
            </div>
            <div className="tool-tip">{tool.tip}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
