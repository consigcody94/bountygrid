import React, { useEffect, useMemo, useRef, useState } from 'react'
import Globe from 'react-globe.gl'
import { scoreColor } from './ui.jsx'
import { playBeep, playLock, playRadar } from '../utils/audio.js'

function webglAvailable() {
  try {
    const c = document.createElement('canvas')
    return !!(c.getContext('webgl2') || c.getContext('webgl'))
  } catch {
    return false
  }
}

// Regional camera coordinate presets
const REGION_PRESETS = [
  { id: 'global', label: 'GLOBAL', lat: 20, lng: 0, alt: 2.5 },
  { id: 'americas', label: 'AMERICAS', lat: 34, lng: -98, alt: 1.8 },
  { id: 'emea', label: 'EMEA / EUROPE', lat: 48, lng: 16, alt: 1.7 },
  { id: 'apac', label: 'ASIA-PACIFIC', lat: 25, lng: 120, alt: 1.8 },
]

export default function GlobeScene({ cities, incidents, selected, onSelect }) {
  const wrapRef = useRef(null)
  const globeRef = useRef(null)
  const [dims, setDims] = useState({ w: window.innerWidth, h: window.innerHeight })
  const [ready, setReady] = useState(false)
  const [activeRegion, setActiveRegion] = useState('global')
  const [showRings, setShowRings] = useState(true)
  const [autoRotate, setAutoRotate] = useState(true)
  const hasGL = useMemo(webglAvailable, [])

  useEffect(() => {
    const el = wrapRef.current
    if (!el) return
    const ro = new ResizeObserver(entries => {
      const r = entries[0].contentRect
      setDims({ w: r.width, h: r.height })
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // Manage auto-rotation
  useEffect(() => {
    if (!ready || !globeRef.current) return
    const controls = globeRef.current.controls()
    if (controls) {
      controls.autoRotate = autoRotate
      controls.autoRotateSpeed = 0.45
    }
  }, [ready, autoRotate])

  // Initial view point
  useEffect(() => {
    if (!ready || !globeRef.current) return
    globeRef.current.pointOfView({ lat: 24, lng: -38, altitude: 2.3 }, 0)
  }, [ready])

  // Fly to selection, hold, then resume rotation if enabled
  useEffect(() => {
    if (!ready || !globeRef.current || !selected) return
    const controls = globeRef.current.controls()
    if (controls) controls.autoRotate = false
    globeRef.current.pointOfView({ lat: selected.lat, lng: selected.lng, altitude: 1.45 }, 1200)
    const t = setTimeout(() => {
      if (controls && autoRotate) controls.autoRotate = true
    }, 7000)
    return () => clearTimeout(t)
  }, [ready, selected, autoRotate])

  const jumpToRegion = (reg) => {
    setActiveRegion(reg.id)
    playRadar()
    if (globeRef.current) {
      const controls = globeRef.current.controls()
      if (controls) controls.autoRotate = false
      globeRef.current.pointOfView({ lat: reg.lat, lng: reg.lng, altitude: reg.alt }, 1400)
      setTimeout(() => {
        if (controls && autoRotate) controls.autoRotate = true
      }, 8000)
    }
  }

  const points = useMemo(() => {
    const base = cities.map(c => ({ ...c, kind: 'city' }))
    if (selected && selected.adhoc) base.push({ ...selected, kind: 'city' })
    return base
  }, [cities, selected])

  const rings = useMemo(() => {
    if (!showRings) return []
    const r = []
    if (selected) {
      r.push({ lat: selected.lat, lng: selected.lng, maxR: 6, speed: 5, repeat: 800, color: '#00f0ff' })
    }
    for (const inc of (incidents || []).slice(0, 16)) {
      if (Number.isFinite(inc.lat) && Number.isFinite(inc.lng)) {
        r.push({ lat: inc.lat, lng: inc.lng, maxR: 2.2, speed: 2.5, repeat: 1600, color: '#ff2f5f' })
      }
    }
    return r
  }, [selected, incidents, showRings])

  const labels = useMemo(
    () => [...cities].sort((a, b) => (b.population || 0) - (a.population || 0)).slice(0, 20),
    [cities],
  )

  if (!hasGL) {
    return <div className="globe-fallback">⚠ WEBGL HARDWARE ACCELERATION UNAVAILABLE</div>
  }

  return (
    <div ref={wrapRef} className="globe-wrap">
      {/* Tactical Camera HUD Toolbar */}
      <div className="globe-hud-controls">
        <div className="hud-control-group">
          <span className="ctrl-label">CAMERA ORBIT:</span>
          {REGION_PRESETS.map(reg => (
            <button
              key={reg.id}
              className={`hud-ctrl-btn ${activeRegion === reg.id ? 'active' : ''}`}
              onClick={() => jumpToRegion(reg)}
            >
              {reg.label}
            </button>
          ))}
        </div>

        <div className="hud-control-group right">
          <button
            className={`hud-ctrl-btn ${autoRotate ? 'active' : ''}`}
            onClick={() => {
              playBeep()
              setAutoRotate(r => !r)
            }}
            title="Toggle Continuous Planetary Orbit"
          >
            {autoRotate ? '⟳ ROTATING' : '⏸ ROTATION PAUSED'}
          </button>
          <button
            className={`hud-ctrl-btn ${showRings ? 'active' : ''}`}
            onClick={() => {
              playBeep()
              setShowRings(r => !r)
            }}
            title="Toggle Live Municipal Pulse Rings"
          >
            {showRings ? '◎ PULSES ON' : '◎ PULSES OFF'}
          </button>
        </div>
      </div>

      <Globe
        ref={globeRef}
        width={dims.w}
        height={dims.h}
        onGlobeReady={() => setReady(true)}
        globeImageUrl="//unpkg.com/three-globe/example/img/earth-night.jpg"
        backgroundImageUrl="//unpkg.com/three-globe/example/img/night-sky.png"
        backgroundColor="rgba(2,4,10,1)"
        atmosphereColor="#00c8ff"
        atmosphereAltitude={0.22}
        pointsData={points}
        pointLat="lat"
        pointLng="lng"
        pointColor={d => scoreColor(d.safetyScore)}
        pointAltitude={d => 0.015 + (d.safetyScore == null ? 0.02 : (100 - d.safetyScore) / 1000)}
        pointRadius={d => 0.28 + Math.min(0.4, (d.population || 1e6) / 5.0e7)}
        pointResolution={14}
        pointLabel={d => `
          <div style="font-family:'Share Tech Mono',monospace;background:rgba(3,10,24,0.96);border:1px solid rgba(0,240,255,0.45);padding:10px 14px;color:#d7e6f5;font-size:12px;box-shadow:0 0 16px rgba(0,240,255,0.25);">
            <div style="color:#00f0ff;letter-spacing:0.12em;font-size:14px;font-weight:bold;">${d.name.toUpperCase()}</div>
            <div style="color:#8fa6c0;margin-bottom:4px;">${d.country || ''} · ${d.iso2 || ''}</div>
            <div style="margin-bottom:4px;">SAFETY INDEX: <b style="color:${scoreColor(d.safetyScore)}">${d.safetyScore ?? 'UNRATED'} / 100</b></div>
            <div style="color:#e8558f;">HOMICIDES: <b>${d.homicideRate != null ? d.homicideRate.toFixed(1) + '/100k' : '—'}</b></div>
            <div style="color:#55688a;font-size:10px;margin-top:6px;">▸ CLICK TO OPEN TACTICAL DOSSIER</div>
          </div>`}
        onPointClick={d => {
          playLock()
          if (onSelect) onSelect(d)
        }}
        ringsData={rings}
        ringColor={d => t => `rgba(${d.color === '#ff2f5f' ? '255,47,95' : '0,240,255'},${Math.max(0, 1 - t)})`}
        ringMaxRadius="maxR"
        ringPropagationSpeed="speed"
        ringRepeatPeriod="repeat"
        labelsData={labels}
        labelLat="lat"
        labelLng="lng"
        labelText="name"
        labelSize={0.88}
        labelDotRadius={0.24}
        labelColor={() => 'rgba(215,230,245,0.85)'}
        labelResolution={2}
      />
    </div>
  )
}
