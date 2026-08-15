// Tiny fetch helper: JSON + timeout + graceful failure. Every upstream API is
// reached through the Vite dev proxy (see vite.config.js), so paths are relative.

export async function jget(url, { timeout = 14000 } = {}) {
  const ctl = new AbortController()
  const timer = setTimeout(() => ctl.abort(), timeout)
  try {
    const res = await fetch(url, { signal: ctl.signal, headers: { Accept: 'application/json' } })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const text = await res.text()
    try {
      return JSON.parse(text)
    } catch {
      throw new Error('non-JSON response')
    }
  } finally {
    clearTimeout(timer)
  }
}

export function timeAgo(input) {
  const d = input instanceof Date ? input : new Date(input)
  if (Number.isNaN(d.getTime())) return '—'
  const s = Math.floor((Date.now() - d.getTime()) / 1000)
  if (s < 0) return 'now'
  if (s < 60) return `${s}s ago`
  if (s < 3600) return `${Math.floor(s / 60)}m ago`
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`
  if (s < 86400 * 30) return `${Math.floor(s / 86400)}d ago`
  return d.toISOString().slice(0, 10)
}

// GDELT timestamps look like "20260814T063000Z"
export function parseGdeltDate(s) {
  if (!s) return null
  const m = String(s).match(/^(\d{4})(\d{2})(\d{2})T?(\d{2})?(\d{2})?(\d{2})?/)
  if (!m) return null
  return new Date(Date.UTC(+m[1], +m[2] - 1, +m[3], +(m[4] || 0), +(m[5] || 0), +(m[6] || 0)))
}

export function fmtNum(n) {
  if (n == null || Number.isNaN(+n)) return '—'
  const v = +n
  if (v >= 1e9) return (v / 1e9).toFixed(1) + 'B'
  if (v >= 1e6) return (v / 1e6).toFixed(1) + 'M'
  if (v >= 1e4) return Math.round(v / 1000) + 'K'
  return v.toLocaleString()
}
