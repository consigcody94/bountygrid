import React, { useEffect, useMemo, useRef, useState } from 'react'
import { playBeep } from '../utils/audio.js'

/* Real satellite/aerial imagery via Esri World Imagery (free, keyless, the same
   basemap countless GIS apps use).

   The previous version applied CSS hue filters and labelled them "FLIR Thermal"
   and "NVG Night Vision" with a drone telemetry HUD — a colour filter over a
   daytime satellite tile is not a thermal sensor, and presenting it as one is a
   fabricated capability. Basemap switching below is real (different providers,
   genuinely different imagery), and nothing claims to be a live sensor feed. */

const BASEMAPS = [
  {
    id: 'imagery',
    label: 'SATELLITE',
    attribution: 'Esri, Maxar, Earthstar Geographics',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    note: 'High-resolution aerial/satellite composite. Capture dates vary by region — this is not a live view.',
  },
  {
    id: 'streets',
    label: 'STREET',
    attribution: 'OpenStreetMap contributors',
    url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    note: 'Community-maintained street map — best for naming roads, exits and transit.',
  },
  {
    id: 'topo',
    label: 'TERRAIN',
    attribution: 'Esri, USGS, NOAA',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
    note: 'Topographic relief — useful for border, route and terrain assessment.',
  },
  {
    id: 'dark',
    label: 'REFERENCE',
    attribution: 'Esri',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}',
    note: 'Low-clutter dark basemap for overlaying other data.',
  },
]

const TILE = 256

function lngToTileX(lng, z) { return ((lng + 180) / 360) * Math.pow(2, z) }
function latToTileY(lat, z) {
  const r = (lat * Math.PI) / 180
  return ((1 - Math.log(Math.tan(r) + 1 / Math.cos(r)) / Math.PI) / 2) * Math.pow(2, z)
}

export default function SatelliteRecon({ selectedCity }) {
  const lat = selectedCity?.lat ?? 41.8781
  const lng = selectedCity?.lng ?? -87.6298
  const name = selectedCity?.name || 'Chicago'

  const [zoom, setZoom] = useState(13)
  const [base, setBase] = useState(BASEMAPS[0])
  const [cols, setCols] = useState(5)
  const wrapRef = useRef(null)

  useEffect(() => {
    const el = wrapRef.current
    if (!el) return
    const ro = new ResizeObserver(e => {
      const w = e[0].contentRect.width
      setCols(Math.max(3, Math.min(9, Math.round(w / TILE) | 1)))
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // Build a tile grid centred on the target.
  const tiles = useMemo(() => {
    const cx = lngToTileX(lng, zoom)
    const cy = latToTileY(lat, zoom)
    const half = Math.floor(cols / 2)
    const rows = Math.max(3, half * 2 - 1)
    const halfR = Math.floor(rows / 2)
    const max = Math.pow(2, zoom)
    const grid = []
    for (let dy = -halfR; dy <= halfR; dy++) {
      for (let dx = -half; dx <= half; dx++) {
        const x = ((Math.floor(cx) + dx) % max + max) % max
        const y = Math.min(max - 1, Math.max(0, Math.floor(cy) + dy))
        grid.push({
          key: `${zoom}-${x}-${y}`,
          src: base.url.replace('{z}', zoom).replace('{x}', x).replace('{y}', y),
        })
      }
    }
    return { grid, cols: half * 2 + 1 }
  }, [lat, lng, zoom, base, cols])

  const gmaps = `https://www.google.com/maps/@${lat},${lng},${zoom}z/data=!3m1!1e3`

  return (
    <div className="panel">
      <div className="panel-title">
        🛰 AERIAL IMAGERY — {name.toUpperCase()}
        <span className="meta">{lat.toFixed(4)}°, {lng.toFixed(4)}° · Z{zoom} · {base.attribution}</span>
      </div>

      <div className="recon-sub">
        Real satellite and map imagery. Capture dates vary by region and provider — <b>this is archival imagery, not a live
        feed</b>, and there is no thermal or night-vision sensor behind it.
      </div>

      <div className="court-pills">
        <span className="pills-label">BASEMAP:</span>
        {BASEMAPS.map(b => (
          <button key={b.id} className={`pill-btn ${base.id === b.id ? 'active' : ''}`}
            onClick={() => { playBeep(); setBase(b) }}>{b.label}</button>
        ))}
        <span className="pills-label" style={{ marginLeft: 12 }}>ZOOM:</span>
        <button className="pill-btn" onClick={() => { playBeep(); setZoom(z => Math.max(3, z - 1)) }}>−</button>
        <span className="pill-btn active">{zoom}</span>
        <button className="pill-btn" onClick={() => { playBeep(); setZoom(z => Math.min(18, z + 1)) }}>+</button>
      </div>

      <div className="sat-wrap" ref={wrapRef}>
        <div className="sat-grid" style={{ gridTemplateColumns: `repeat(${tiles.cols}, ${TILE}px)` }}>
          {tiles.grid.map(t => (
            <img key={t.key} src={t.src} width={TILE} height={TILE} loading="lazy" alt="" draggable={false} />
          ))}
        </div>
        <div className="sat-crosshair" aria-hidden>
          <div className="ch-v" /><div className="ch-h" /><div className="ch-ring" />
        </div>
        <div className="sat-readout">
          <div>LAT {lat.toFixed(5)}</div>
          <div>LNG {lng.toFixed(5)}</div>
          <div>ZOOM {zoom}</div>
          <div>{base.label}</div>
        </div>
      </div>

      <div className="desk-meta">{base.note}</div>

      <div className="wanted-actions" style={{ marginTop: 10 }}>
        <a className="btn ghost sm" href={gmaps} target="_blank" rel="noreferrer">GOOGLE EARTH VIEW ↗</a>
        <a className="btn ghost sm" href={`https://www.openstreetmap.org/#map=${zoom}/${lat}/${lng}`} target="_blank" rel="noreferrer">OPENSTREETMAP ↗</a>
        <a className="btn ghost sm" href={`https://www.bing.com/maps?cp=${lat}~${lng}&lvl=${zoom}&style=h`} target="_blank" rel="noreferrer">BING AERIAL ↗</a>
      </div>

      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10.5, color: 'var(--ink-mute)', marginTop: 12 }}>
        IMAGERY © {base.attribution.toUpperCase()}. COMPARING PROVIDERS IS USEFUL — THEY FLY ON DIFFERENT DATES.
      </div>
    </div>
  )
}
