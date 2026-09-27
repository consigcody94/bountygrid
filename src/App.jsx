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
import SocialRecon from './components/SocialRecon.jsx'
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
    fbi: 'pending',
    news: 'pending',
    incidents: 'pending',
    courts: 'pending',
    wanted: 'pending',
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
    setLight('news', res.source === 'live')
  }, [])

  const loadIncidents = useCallback(async () => {
    const res = await fetchIncidents()
    setIncidents(res)
    setLastSync(new Date())
    setLight('incidents', res.source === 'live')
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
    // Compiled dossiers are country-level research, not geolocated sightings.
    // Older UI code assumed every lead had primaryCity/targetCoords and crashed
    // when the button was clicked. Use a clearly labelled regional anchor when
    // a dossier does not contain a verified city coordinate.
    const requestedCity = String(lead.primaryCity || '').trim().toLowerCase()
    const targetCity = CITIES.find(c => c.name.toLowerCase() === requestedCity)
    const country = String(lead.country || '').split('/')[0].trim()
    const countryCity = CITIES.find(c => c.country.toLowerCase() === country.toLowerCase())
    const regionAnchors = {
      honduras: { name: 'Honduras region', lat: 14.0723, lng: -87.1921 },
      bulgaria: { name: 'Bulgaria region', lat: 42.6977, lng: 23.3219 },
      russia: { name: 'Russia region', lat: 55.7558, lng: 37.6173 },
      vietnam: { name: 'Vietnam region', lat: 21.0278, lng: 105.8342 },
      india: { name: 'India region', lat: 28.6139, lng: 77.2090 },
    }
    const anchor = targetCity || countryCity || regionAnchors[country.toLowerCase()]
    const target = lead.targetCoords && Number.isFinite(lead.targetCoords.lat) && Number.isFinite(lead.targetCoords.lng)
      ? { name: lead.primaryCity || lead.country || 'Research region', ...lead.targetCoords }
      : anchor

    if (!target) return

    const targetCityForDossier = {
      ...target,
      country: lead.country || target.country || 'Research region',
      iso2: target.iso2 || '',
      adhoc: !targetCity,
      population: target.population ?? null,
      safetyScore: target.safetyScore ?? null,
      homicideRate: target.homicideRate ?? null,
      tier: target.tier,
      grade: target.grade,
      briefing: lead.summary || `Country-level research lead for ${lead.country || target.name}. No person location is established by this dossier.`,
    }
    selectCity(targetCityForDossier)
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
              <div className="kicker">
                PUBLIC SAFETY RESEARCH / OPEN-SOURCE INTELLIGENCE
              </div>
              <h1 className="hero-title">
                BOUNTY<span className="glow">GRID</span>
              </h1>
              <p className="hero-sub">
                A research workspace for reviewing public wanted notices, court records, open news, and civic data. Every source is labelled by origin and confidence; no search result is treated as a finding without corroboration.
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
                  <div className="label">Cities in index</div>
                </div>
                <div className="stat">
                  <div className="num"><CountUp value={liveSignals} /></div>
                  <div className="label">Current signals</div>
                </div>
                <div className="stat">
                  <div className="num" style={{ color: 'var(--amber)' }}>$13.5M+</div>
                  <div className="label">Official reward notices</div>
                </div>
                <div className="stat">
                  <div className="num"><CountUp value={court.count} /></div>
                  <div className="label">Court records matched</div>
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

        {/* SECTION 01: RESEARCH QUERY TERMINAL */}
        <Section
          index="01"
          title="Research Query Terminal"
          sub="Run supported public-record queries from one place, with results routed to the relevant source module for review"
        >
          <SolverTerminal onCourtSearch={courtFromCity} onSelectCity={selectCity} />
        </Section>

        {/* SECTION 02: OPEN-SOURCE LEAD REVIEW */}
        <Section
          index="02"
          title="Open-Source Lead Review"
          sub="Review research leads against their cited sources, separate observations from assumptions, and open the underlying record before acting"
        >
          <LeadsTracer
            onTraceLead={handleTraceLead}
            onCourtSearch={courtFromCity}
          />
        </Section>

        {/* SECTION 03: FBI MOST WANTED NOTICES */}
        <Section
          index="03"
          title="FBI Most Wanted Notices"
          sub="Official public notices with poster images, identifying details, reward language, and links back to the FBI record"
        >
          <MostWanted wanted={wanted} onCaseFiles={courtFromCity} />
        </Section>

        {/* SECTION 04: CRYPTOCURRENCY TRANSACTION REVIEW */}
        <Section
          index="04"
          title="Cryptocurrency Transaction Review"
          sub="Inspect publicly available transaction histories and record the limits of address attribution; wallet activity does not identify a person by itself"
        >
          <CryptoTracker onCourtSearch={courtFromCity} />
        </Section>

        {/* SECTION 05: PUBLIC NETWORK REFERENCE */}
        <Section
          index="05"
          title="Public Network Reference"
          sub="Review public device-search examples and exposure indicators for research and defensive awareness; do not access or monitor systems without authorization"
        >
          <ShodanRecon selectedCity={selected} />
        </Section>

        {/* SECTION 06: PUBLIC-SOURCE SEARCH WORKBENCH */}
        <Section
          index="06"
          title="Public-Source Search Workbench"
          sub="Generate repeatable search queries for public records, news, corporate registries, usernames, and blockchain explorers"
        >
          <OsintWorkbench wanted={wanted} onCourtSearch={courtFromCity} />
        </Section>

        {/* SECTION 07: RESEARCH RECORD & HASHING */}
        <Section
          index="07"
          title="Research Record & Hashing"
          sub="Save locally entered research artifacts, calculate reproducible SHA-256 checksums, and export a clearly labelled worksheet"
        >
          <EvidenceLocker />
        </Section>

        {/* SECTION 08: TARGET RESEARCH DESK */}
        <Section
          index="08"
          title="Target Research Desk"
          sub="Select an official FBI notice to review associated public records, news, archive captures, and agency submission links"
        >
          <ReconDesk wanted={wanted} onCaseFiles={courtFromCity} />
        </Section>

        <Section
          index="08A"
          title="Public Social Recon"
          sub="Launch public-source searches from official aliases, record source URLs, and keep every lead explicitly unverified until corroborated"
        >
          <SocialRecon wanted={wanted} />
        </Section>

        {/* SECTION 09: REWARD NOTICE & TIP PREPARATION */}
        <Section
          index="09"
          title="Reward Notice & Tip Preparation"
          sub="Review reward language, prepare a local draft, and use the receiving agency's official site for any actual submission"
        >
          <BountyDesk wanted={wanted} />
        </Section>

        {/* SECTION 10: PUBLIC-SAFETY AUDIO REFERENCE */}
        <Section
          index="10"
          title="Public-Safety Audio Reference"
          sub="Review the interface's audio and code-reference tools; availability and legality of radio streams vary by jurisdiction"
        >
          <PoliceScanner onPlotIncident={handlePlotDispatch} />
        </Section>

        {/* SECTION 11: SATELLITE IMAGE REFERENCE */}
        <Section
          index="11"
          title="Satellite Image Reference"
          sub="Review available imagery around a selected city with clear separation between imagery, map context, and interpretation"
        >
          <SatelliteRecon selectedCity={selected} />
        </Section>

        {/* SECTION 12: CITY COMPARISON */}
        <div ref={compareRef}>
          <Section
            index="12"
            title="City Comparison"
            sub="Compare two global metros across six published indicators and inspect the assumptions behind the composite view"
          >
            <CityComparison
              cities={CITIES}
              defaultCityA={compareTarget || CITIES[0]}
              defaultCityB={CITIES[7] || CITIES[1]}
              onSelectCity={selectCity}
            />
          </Section>
        </div>

        {/* SECTION 13: FBI CRIME TRENDS */}
        <Section
          index="13"
          title="FBI Crime Trends"
          sub="Historical U.S. crime estimates, 1985–2024, presented per 100,000 residents from FBI UCR/NIBRS published data"
        >
          <div className="panel">
            <TrendChart trend={trend} />
          </div>
        </Section>

        {/* SECTION 14: NEWS & INCIDENT FEEDS */}
        <Section
          index="14"
          title="News & Incident Feeds"
          sub="Open news and municipal incident feeds with source timestamps, translation status, and cache indicators"
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

        {/* SECTION 15: FEDERAL COURT RECORDS */}
        <div ref={courtsRef}>
          <Section
            index="15"
            title="Federal Court Records"
            sub="Search opinions and docket-linked records from the CourtListener / RECAP public archive"
          >
            <CourtRecords court={court} onSearch={runCourtSearch} />
          </Section>
        </div>

        {/* SECTION 16: CITY SAFETY INDEX */}
        <Section
          index="16"
          title="City Safety Index"
          sub="Compare the composite index with homicide rate per 100,000, filter by region, and open the underlying city dossier"
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
        <b>BOUNTYGRID // PUBLIC SAFETY RESEARCH WORKSPACE</b>
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
