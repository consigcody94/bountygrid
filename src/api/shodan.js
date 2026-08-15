import { jget } from './client.js'

/* Real Shodan client. The API key lives in .env.local (SHODAN_API_KEY) and is
   injected by the Vite proxy server-side — it is never bundled into client
   code and never appears in a browser request URL.

   Without a key the proxy returns 401 NO_SHODAN_KEY and every function here
   reports that plainly. It never falls back to invented hosts. */

function reason(e) {
  const msg = String(e?.message || e)
  if (msg.includes('401')) return 'No Shodan API key configured. Add SHODAN_API_KEY to .env.local and restart the dev server.'
  if (msg.includes('403')) return 'Shodan rejected the key — check the plan tier (host search needs a paid membership).'
  if (msg.includes('429')) return 'Shodan rate limit hit. Wait a moment and retry.'
  return `Shodan unreachable (${msg}).`
}

export async function shodanInfo() {
  try {
    const j = await jget('/api/shodan/api-info', { timeout: 15000 })
    return {
      ok: true,
      plan: j.plan || 'unknown',
      queryCredits: j.query_credits ?? null,
      scanCredits: j.scan_credits ?? null,
      monitoredIps: j.monitored_ips ?? null,
      https: !!j.https,
      unlocked: !!j.unlocked,
    }
  } catch (e) {
    return { ok: false, reason: reason(e) }
  }
}

export async function shodanSearch(query, { facets = '', page = 1 } = {}) {
  const q = String(query || '').trim()
  if (!q) return { ok: false, reason: 'Empty query.' }
  try {
    const qs = new URLSearchParams({ query: q, page: String(page) })
    if (facets) qs.set('facets', facets)
    const j = await jget(`/api/shodan/shodan/host/search?${qs}`, { timeout: 25000 })
    const matches = (j.matches || []).slice(0, 25).map(m => ({
      ip: m.ip_str,
      port: m.port,
      transport: m.transport || 'tcp',
      product: m.product || '',
      version: m.version || '',
      org: m.org || '',
      isp: m.isp || '',
      os: m.os || '',
      city: m.location?.city || '',
      country: m.location?.country_name || '',
      lat: m.location?.latitude ?? null,
      lng: m.location?.longitude ?? null,
      hostnames: (m.hostnames || []).join(', '),
      domains: (m.domains || []).join(', '),
      timestamp: m.timestamp || '',
      banner: String(m.data || '').slice(0, 400),
      vulns: Object.keys(m.vulns || {}),
      url: `https://www.shodan.io/host/${m.ip_str}`,
    }))
    return { ok: true, total: j.total || matches.length, matches, facets: j.facets || null }
  } catch (e) {
    return { ok: false, reason: reason(e), matches: [], total: 0 }
  }
}

export async function shodanHost(ip) {
  const target = String(ip || '').trim()
  if (!/^\d{1,3}(\.\d{1,3}){3}$/.test(target)) {
    return { ok: false, reason: 'Not a valid IPv4 address.' }
  }
  try {
    const j = await jget(`/api/shodan/shodan/host/${target}`, { timeout: 25000 })
    return {
      ok: true,
      ip: j.ip_str,
      org: j.org || '',
      isp: j.isp || '',
      asn: j.asn || '',
      os: j.os || '',
      city: j.city || '',
      country: j.country_name || '',
      lat: j.latitude ?? null,
      lng: j.longitude ?? null,
      hostnames: j.hostnames || [],
      ports: j.ports || [],
      vulns: j.vulns || [],
      lastUpdate: j.last_update || '',
      services: (j.data || []).slice(0, 20).map(d => ({
        port: d.port,
        product: d.product || '',
        version: d.version || '',
        transport: d.transport || '',
        banner: String(d.data || '').slice(0, 300),
      })),
      url: `https://www.shodan.io/host/${j.ip_str}`,
    }
  } catch (e) {
    return { ok: false, reason: reason(e) }
  }
}

/* Query templates. These are real Shodan filter syntax — they run against the
   live API when a key is present, and remain copy-pasteable into shodan.io
   when it isn't. */
export const QUERY_TEMPLATES = [
  { group: 'Exposed cameras & surveillance', items: [
    { label: 'RTSP streams in a city', q: 'city:"{CITY}" port:554 has_screenshot:true' },
    { label: 'webcamXP / webcam7 panels', q: 'city:"{CITY}" http.title:"webcamXP"' },
    { label: 'Hikvision devices', q: 'city:"{CITY}" product:"Hikvision IP Camera"' },
    { label: 'Unauthenticated MJPEG', q: 'city:"{CITY}" "Server: IP Webcam Server"' },
  ]},
  { group: 'Industrial & municipal control', items: [
    { label: 'Modbus (SCADA)', q: 'city:"{CITY}" port:502' },
    { label: 'BACnet building automation', q: 'city:"{CITY}" port:47808' },
    { label: 'Niagara Fox controllers', q: 'city:"{CITY}" port:1911,4911 product:"Niagara"' },
  ]},
  { group: 'Remote access exposure', items: [
    { label: 'Open RDP', q: 'city:"{CITY}" port:3389 has_screenshot:true' },
    { label: 'VNC without auth', q: 'city:"{CITY}" port:5900 "RFB 003" -"authentication"' },
    { label: 'Exposed Telnet', q: 'city:"{CITY}" port:23' },
  ]},
  { group: 'Anonymity infrastructure', items: [
    { label: 'Tor relays', q: 'port:9001 product:"Tor"' },
    { label: 'Open SOCKS5 proxies', q: 'port:1080 "SOCKS5"' },
    { label: 'Open mail relays', q: 'city:"{CITY}" port:25 "220" "ESMTP"' },
  ]},
  { group: 'Databases left open', items: [
    { label: 'MongoDB no auth', q: 'city:"{CITY}" product:MongoDB' },
    { label: 'Elasticsearch open', q: 'city:"{CITY}" port:9200 product:"Elastic"' },
    { label: 'Exposed Redis', q: 'city:"{CITY}" port:6379' },
  ]},
]

export function fillTemplate(q, city) {
  return q.replace(/\{CITY\}/g, city || 'Chicago')
}
