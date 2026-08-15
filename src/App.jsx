import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { CITIES } from './data/cities.js'
import {
  fetchGlobalNews,
  fetchCityNews,
  fetchUKCrimes,
  fetchIncidents,
  fetchNationalTrend,
  searchCourts,
  geocode,
  fetchMostWanted,
} from './api/feeds.js'
import MostWanted from './components/MostWanted.jsx'
import BountyDesk from './components/BountyDesk.jsx'
import ReconDesk from './components/ReconDesk.jsx'
import SatelliteRecon from './components/SatelliteRecon.jsx'
import OsintWorkbench from './components/OsintWorkbench.jsx'
import ShodanRecon from './components/ShodanRecon.jsx'
import CryptoTracker from './components/CryptoTracker.jsx'
import EvidenceLocker from './components/EvidenceLocker.jsx'
import SolverTerminal from './components/SolverTerminal.jsx'
import { Section, CountUp } from './components/ui.jsx'
import GlobeScene from './components/GlobeScene.jsx'
import BootScreen from './components/BootScreen.jsx'
import HUDBar from './components/HUDBar.jsx'
import SearchBar from './components/SearchBar.jsx'
import CityPanel from './components/CityPanel.jsx'
import CityComparison from './components/CityComparison.jsx'
import LeadsTracer from './components/LeadsTracer.jsx'
import PoliceScanner from './components/PoliceScanner.jsx'
import TrendChart from './components/TrendChart.jsx'
import NewsFeed, { NewsTicker } from './components/NewsFeed.jsx'
import IncidentStream from './components/IncidentStream.jsx'
import CourtRecords from './components/CourtRecords.jsx'
import Rankings from './components/Rankings.jsx'
import { NATIONAL_TREND } from './data/fallback.js'
import { playLock, playRadar } from './utils/audio.js'

class GlobeErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { failed: false }
  }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  render() {
    if (this.state.failed) {
      return <div className="globe-fallback">⚠ PLANETARY 3D RENDER FAULT — DATA TELEMETRY UNAFFECTED</div>
    }
    return this.props.children
  }
}

export default function App() {
  const [booting, setBooting] = useState(true)
  const [crtEnabled, setCrtEnabled] = useState(false)
  const [status, setStatus] = useState({
    fbi: 'online',
    news: 'online',
    incidents: 'online',
    courts: 'online',
    wanted: 'online',
  })
  const [wanted, setWanted] = useState({ items: [], ok: true, total: 0 })
  const [news, setNews] = useState({ items: [] })
  const [incidents, setIncidents] = useState({ items: [] })
  const [lastSync, setLastSync] = useState(null)
  const [trend, setTrend] = useState(NATIONAL_TREND)
  const [selected, setSelected] = useState(null)
  const [cityNews, setCityNews] = useState([])
  const [cityNewsLoading, setCityNewsLoading] = useState(false)
  const [ukCrime, setUkCrime] = useState(null)
  const [court, setCourt] = useState({
    results: [],
    count: 0,
    loading: false,
    query: '',
    source: 'live',
  })
  const [geoBusy, setGeoBusy] = useState(false)
  const [compareTarget, setCompareTarget] = useState(null)

  const heroRef = useRef(null)
  const courtsRef = useRef(null)
  const compareRef = useRef(null)

  const setLight = (key, ok) => setStatus(s => ({ ...s, [key]: ok ? 'online' : 'offline' }))

  const loadNews = useCallback(async () => {
    const res = await fetchGlobalNews()
    setNews(res)
    setLight('news', res.ok)
  }, [])

  const loadIncidents = useCallback(async () => {
    const res = await fetchIncidents()
    setIncidents(res)
    setLastSync(new Date())
    setLight('incidents', res.ok)
  }, [])

  const runCourtSearch = useCallback(async (q, courtFilter = '') => {
    setCourt(c => ({ ...c, loading: true, query: q }))
    const res = await searchCourts(q, courtFilter)
    setCourt({
      results: res.results,
      count: res.count,
      loading: false,
      query: q,
      source: res.ok ? 'live' : 'cache',
    })
    setLight('courts', res.ok)
  }, [])

  useEffect(() => {
    loadNews()
    loadIncidents()
    fetchNationalTrend().then(t => {
      setTrend(t)
      setLight('fbi', t.source === 'live')
    })
    runCourtSearch('United States v.')
    fetchMostWanted().then(res => {
      setWanted(res)
      setLight('wanted', res.ok)
    })
    const newsTimer = setInterval(loadNews, 90_000)
    const incTimer = setInterval(loadIncidents, 120_000)
    return () => {
      clearInterval(newsTimer)
      clearInterval(incTimer)
    }
  }, [loadNews, loadIncidents, runCourtSearch])

  const selectCity = useCallback(async city => {
    setSelected(city)
    setCityNews([])
    setUkCrime(null)
    setCityNewsLoading(true)
    fetchCityNews(city.name).then(res => {
      setCityNews(res.items)
      setCityNewsLoading(false)
    })
    if (city.iso2 === 'GB' || /United Kingdom/i.test(city.country || '')) {
      fetchUKCrimes(city.lat, city.lng).then(setUkCrime)
    }
  }, [])

  const handleGeocode = useCallback(async q => {
    setGeoBusy(true)
    const hit = await geocode(q)
    setGeoBusy(false)
    if (hit) {
      selectCity(hit)
    }
  }, [selectCity])

  const courtFromCity = useCallback(name => {
    runCourtSearch(name)
    courtsRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [runCourtSearch])

  const handleDuelWith = useCallback(city => {
    setCompareTarget(city)
    compareRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  const handleTraceLead = useCallback(lead => {
    playRadar()
    const targetCity = CITIES.find(c => c.name.toLowerCase() === lead.primaryCity.toLowerCase()) || {
      name: lead.primaryCity,
      country: 'Target Sector',
      iso2: '',
      lat: lead.targetCoords.lat,
      lng: lead.targetCoords.lng,
      adhoc: true,
      population: 1000000,
      safetyScore: 45,
      homicideRate: 25.0,
      tier: 'high-risk',
      grade: 'D',
      briefing: lead.summary,
    }
    selectCity(targetCity)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [selectCity])

  const handleLockFugitive = useCallback(fugitive => {
    playRadar()
    const officeCity = CITIES.find(c => fugitive.offices?.toLowerCase().includes(c.name.toLowerCase())) || CITIES[0]
    const targetProfile = {
      name: fugitive.name,
      country: `Wanted: ${fugitive.offices || 'Federal Warrant'}`,
      iso2: 'US',
      lat: officeCity.lat,
      lng: officeCity.lng,
      adhoc: true,
      population: 1000000,
      safetyScore: 30,
      homicideRate: 35.0,
      tier: 'high-risk',
      grade: 'F',
      briefing: `BIOMETRIC TARGET LOCK: ${fugitive.name}. Reward: ${fugitive.reward || 'ACTIVE'}. Caution: ${fugitive.caution || 'Armed and dangerous.'}`,
    }
    selectCity(targetProfile)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [selectCity])

  const handlePlotDispatch = useCallback(dispatch => {
    playRadar()
    const adhocTarget = {
      name: `${dispatch.city} [${dispatch.unit}]`,
      country: 'Live Dispatch Incident',
      iso2: 'US',
      lat: dispatch.coords.lat,
      lng: dispatch.coords.lng,
      adhoc: true,
      population: 500000,
      safetyScore: 35,
      homicideRate: 32.0,
      tier: 'critical',
      grade: 'F',
      briefing: `LIVE POLICE RADIO INTERCEPT: "${dispatch.msg}"`,
    }
    selectCity(adhocTarget)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [selectCity])

  const rankedCities = useMemo(
    () => [...CITIES].filter(c => c.safetyScore != null).sort((a, b) => b.safetyScore - a.safetyScore),
    [],
  )

  const selectedRank = useMemo(() => {
    if (!selected || selected.safetyScore == null) return null
    const idx = rankedCities.findIndex(c => c.name === selected.name && c.iso2 === selected.iso2)
    return idx >= 0 ? idx + 1 : null
  }, [selected, rankedCities])

  const liveSignals = (news.items || []).length + (incidents.items || []).length

  return (
    <>
      {crtEnabled && <div className="crt-overlay" />}

      <AnimatePresence>
        {booting && <BootScreen onDone={() => setBooting(false)} />}
      </AnimatePresence>

      <HUDBar
        status={status}
        crtEnabled={crtEnabled}
        onToggleCrt={() => setCrtEnabled(prev => !prev)}
      />

      <main>
        {/* HERO WITH INTERACTIVE 3D PLANETARY THREAT GLOBE */}
        <div className="hero" ref={heroRef}>
          <GlobeErrorBoundary>
            <GlobeScene
              cities={CITIES}
              incidents={incidents.items}
              selected={selected}
              onSelect={selectCity}
            />
          </GlobeErrorBoundary>

          <div className="hero-overlay">
            <div className="hero-title-block">
              <div className="kicker" style={{ color: 'var(--red)' }}>
                ☠ PLANETARY FUGITIVE MANHUNT & RECON MATRIX // HUNT PROTOCOL ACTIVE
              </div>
              <h1 className="hero-title">
                BOUNTY<span className="glow" style={{ color: 'var(--red)', textShadow: '0 0 25px rgba(255,47,95,0.7)' }}>GRID</span>
              </h1>
              <p className="hero-sub">
                Autonomous fugitive tracking and crime interdiction matrix. Fuses <b>$13.5M+ official FBI Bounties</b>, 
                <b>real-time police radio scanners with AI 10-Code decoders</b>, <b>Shodan IoT infrastructure reconnaissance</b>, and 
                <b>planetary threat telemetry</b>.
              </p>

              <SearchBar
                cities={CITIES}
                onSelect={selectCity}
                onGeocode={handleGeocode}
                busy={geoBusy}
              />

              <div className="hero-stats">
                <div className="stat">
                  <div className="num"><CountUp value={CITIES.length} /></div>
                  <div className="label">Metros in Matrix</div>
                </div>
                <div className="stat">
                  <div className="num"><CountUp value={liveSignals} /></div>
                  <div className="label">Live Signal Telemetry</div>
                </div>
                <div className="stat">
                  <div className="num" style={{ color: 'var(--amber)' }}>$13.5M+</div>
                  <div className="label">Active Bounty Board</div>
                </div>
                <div className="stat">
                  <div className="num"><CountUp value={court.count} /></div>
                  <div className="label">Case Files Indexed</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <NewsTicker items={news.items} />

        {/* ACTIVE TARGET DOSSIER MODAL */}
        <AnimatePresence>
          {selected && (
            <CityPanel
              key={selected.name}
              city={selected}
              rank={selectedRank}
              totalCities={rankedCities.length}
              news={cityNews}
              newsLoading={cityNewsLoading}
              ukCrime={ukCrime}
              onClose={() => setSelected(null)}
              onCourtSearch={courtFromCity}
              onCompareWith={handleDuelWith}
            />
          )}
        </AnimatePresence>

        {/* SECTION 01: INTERACTIVE TACTICAL SOLVER CLI TERMINAL */}
        <Section
          index="01"
          title="Tactical Crime Solver AI Terminal & Command Line Interface"
          sub="Direct OSINT query terminal: execute 'hunt <name>', 'shodan <city>', 'trace <wallet>', 'dork <target>', and 'docket <query>' to synthesize live investigative intelligence"
        >
          <SolverTerminal onCourtSearch={courtFromCity} onSelectCity={selectCity} />
        </Section>

        {/* SECTION 02: ACTIVE OSINT LEADS & BOUNTY RECON */}
        <Section
          index="02"
          title="Active OSINT Leads & Syndicate Tracer"
          sub="Cross-correlated investigative leads fusing FBI bounties, federal court indictments, cartel corridors, and ransomware laundering pipelines"
        >
          <LeadsTracer
            onTraceLead={handleTraceLead}
            onCourtSearch={courtFromCity}
          />
        </Section>

        {/* SECTION 03: FBI MOST WANTED & BOUNTY BOARD */}
        <Section
          index="03"
          title="FBI Most Wanted & Bounty Board ($13.5M+ Active Rewards)"
          sub="Official fugitive board with local high-resolution poster images, physical identifiers (NCIC, DOB, hair, eyes), rewards up to $1M+, and 1-click docket searches"
        >
          <MostWanted wanted={wanted} onCaseFiles={courtFromCity} />
        </Section>

        {/* SECTION 04: ON-CHAIN FORENSICS & PEELING CHAIN TRACER */}
        <Section
          index="04"
          title="On-Chain Forensics & Peeling Chain Transaction Tracer"
          sub="Trace transaction hops across ChipMixer, Tornado.cash, and Eastern European/Dubai P2P OTC desks with live unhosted wallet address risk scanner"
        >
          <CryptoTracker onCourtSearch={courtFromCity} />
        </Section>

        {/* SECTION 05: SHODAN IOT & SURVEILLANCE CAMERA RECON */}
        <Section
          index="05"
          title="Shodan & IoT Surveillance Infrastructure Intelligence"
          sub="Query municipal traffic cameras, open RTSP video streams, industrial SCADA controllers, and bulletproof darknet proxy infrastructure across global metros"
        >
          <ShodanRecon selectedCity={selected} />
        </Section>

        {/* SECTION 06: OSINT RECON WORKBENCH */}
        <Section
          index="06"
          title="OSINT Recon Workbench & Search Syntax Generator"
          sub="Construct targeted public search dorks across federal dockets, offshore corporate registries, username footprints, and blockchain explorers"
        >
          <OsintWorkbench onCourtSearch={courtFromCity} />
        </Section>

        {/* SECTION 07: DIGITAL EVIDENCE VAULT */}
        <Section
          index="07"
          title="Digital Evidence Vault & Chain of Custody Manager"
          sub="Log investigative artifacts, calculate cryptographic SHA-256 checksums, and compile official FBI FD-302 Law Enforcement Intelligence Dossiers"
        >
          <EvidenceLocker />
        </Section>

        {/* SECTION 08: TARGET RECON DESK — real queries against real sources */}
        <Section
          index="08"
          title="Target Recon Desk"
          sub="Pick any live FBI target: auto-sweep federal dockets and the news mesh, build search pivots from official aliases, pull Internet Archive captures, trace real Bitcoin ledgers, check INTERPOL Red Notices, and route a tip that actually pays"
        >
          <ReconDesk wanted={wanted} onCaseFiles={courtFromCity} />
        </Section>

        {/* SECTION 09: BOUNTY HUNTER PAYOUT TERMINAL */}
        <Section
          index="09"
          title="Bounty Hunter Payout Terminal & Anonymous Tip Filing Desk"
          sub="Calculate net bounty disbursements across recovery tiers, compute federal withholding estimates, and submit encrypted leads directly under Title 18 U.S.C. § 3059"
        >
          <BountyDesk onSelectTarget={t => selectCity(t)} />
        </Section>

        {/* SECTION 10: TACTICAL POLICE RADIO SCANNER */}
        <Section
          index="10"
          title="Live Tactical Police Radio Scanner & AI 10-Code Decoder"
          sub="Broadcast intercepts across Chicago CPD, NYPD Citywide, LAPD Metro, and federal interdiction frequencies with frequency spectrum visualizer, AI 10-code decoders, and real-time dispatch stream"
        >
          <PoliceScanner onPlotIncident={handlePlotDispatch} />
        </Section>

        {/* SECTION 11: SATELLITE RECONNAISSANCE */}
        <Section
          index="11"
          title="Tactical Satellite Reconnaissance & Thermal Drone HUD"
          sub="Deploy high-resolution satellite imagery with simulated FLIR thermal and NVG night-vision filters, coordinate crosshairs, and altitude telemetry"
        >
          <SatelliteRecon selectedCity={selected} />
        </Section>

        {/* SECTION 12: CITY VS CITY DUEL RADAR */}
        <div ref={compareRef}>
          <Section
            index="12"
            title="City Threat Radar Duel"
            sub="Multi-axial comparative radar comparing any two global metros across 6 security vectors with automated AI threat synthesis"
          >
            <CityComparison
              cities={CITIES}
              defaultCityA={compareTarget || CITIES[0]}
              defaultCityB={CITIES[7] || CITIES[1]}
              onSelectCity={selectCity}
            />
          </Section>
        </div>

        {/* SECTION 13: NATIONAL THREAT CURVE */}
        <Section
          index="13"
          title="FBI Crime Data Explorer (CDE) Trend Studio"
          sub="Historical US crime trajectory 1985–2024 per 100,000 residents · FBI UCR/NIBRS published estimates · toggle metrics to inspect violent, property, and homicide shifts"
        >
          <div className="panel">
            <TrendChart trend={trend} />
          </div>
        </Section>

        {/* SECTION 14: LIVE WIRE */}
        <Section
          index="14"
          title="Live Signal Wire & Open-Data Incident Mesh"
          sub="Realtime-ish global intercepts: GDELT 2.0 international news mesh (auto-translated to English) + Chicago, NYC, Los Angeles municipal open-data incident streams"
        >
          <div className="wire-grid">
            <NewsFeed news={news} status={status.news} />
            <IncidentStream
              incidents={incidents}
              status={status.incidents}
              lastSync={lastSync}
            />
          </div>
        </Section>

        {/* SECTION 15: COURT RECORDS */}
        <div ref={courtsRef}>
          <Section
            index="15"
            title="Federal Court Records & Legal Docket Archive"
            sub="Investigate real judicial case files, appellate rulings, and federal indictments across 10M+ opinions from the CourtListener / RECAP archive"
          >
            <CourtRecords court={court} onSearch={runCourtSearch} />
          </Section>
        </div>

        {/* SECTION 16: RANKINGS */}
        <Section
          index="16"
          title="Global Planetary Safety Matrix Rankings"
          sub="Composite safety index (higher = safer) vs homicide rate per 100,000 · filter by global region or click any row to load its complete dossier"
        >
          <Rankings
            cities={CITIES}
            onSelect={c => {
              selectCity(c)
              window.scrollTo({ top: 0, behavior: 'smooth' })
            }}
          />
        </Section>
      </main>

      <footer className="footer">
        <b>BOUNTYGRID // MANHUNT.MATRIX — CIVIC HONESTY & FUGITIVE RECON PROTOCOL</b>
        <div className="src-list">
          <span>◈ FBI Crime Data Explorer / UCR–NIBRS Official Estimates</span>
          <span>◈ FBI Most Wanted Public API (api.fbi.gov)</span>
          <span>◈ CourtListener / Free Law Project RECAP Federal Archive</span>
          <span>◈ Shodan / Censys Public Search Syntax & Metadata</span>
          <span>◈ data.police.uk Street-Level Open-Data Feeds</span>
          <span>◈ GDELT 2.0 Global News Mesh Telemetry</span>
          <span>◈ Chicago, NYC & Los Angeles Municipal Socrata Open-Data Portals</span>
          <span>◈ OpenStreetMap Nominatim Geolocation Grid</span>
          <span>◈ Broadcastify & Tactical Dispatch Relays</span>
        </div>
        Safety indexes are multi-factor composite estimates designed for civic orientation and statistical awareness.
        Panels marked CACHE are bundled verified snapshots shown when upstream API uplinks are rate-limited or unreachable.
        This is an educational intelligence console — in the event of an immediate real-world emergency, always contact your local emergency response service (911 / 999 / 112).
      </footer>
    </>
  )
}
