import { jget } from './client.js'

/* ============================================================================
   REAL OSINT ENGINE
   Every function here hits a live, keyless, publicly documented source and
   returns what that source actually said. Nothing in this file invents a
   finding, a score, a match, or a location. If a source is unreachable the
   caller gets ok:false — never a plausible-looking fabrication.
   ========================================================================== */

/* ---------- 1. INTERPOL Red Notices (international warrants) ---------- */

export async function searchRedNotices({ forename = '', name = '', nationality = '' } = {}) {
  const qs = new URLSearchParams({ resultPerPage: '12' })
  if (forename) qs.set('forename', forename)
  if (name) qs.set('name', name)
  if (nationality) qs.set('nationality', nationality)
  try {
    const json = await jget(`/api/interpol/notices/v1/red?${qs}`, { timeout: 18000 })
    const list = json?._embedded?.notices || []
    return {
      ok: true,
      total: json?.total ?? list.length,
      items: list.map(n => ({
        id: n.entity_id,
        name: [n.forename, n.name].filter(Boolean).join(' '),
        dob: n.date_of_birth || '',
        nationalities: (n.nationalities || []).join(', '),
        charges: (n.arrest_warrants || []).map(w => w.charge).filter(Boolean).join('; '),
        issuer: (n.arrest_warrants || []).map(w => w.issuing_country_id).filter(Boolean).join(', '),
        image: n._links?.thumbnail?.href ? n._links.thumbnail.href.replace(/^https?:\/\/ws-public\.interpol\.int/, '/api/interpol') : '',
        url: n._links?.self?.href
          ? `https://www.interpol.int/en/How-we-work/Notices/Red-Notices/View-Red-Notices#${n.entity_id}`
          : 'https://www.interpol.int/en/How-we-work/Notices/Red-Notices',
      })),
    }
  } catch {
    // INTERPOL's edge (Akamai) blocks some networks outright — say so plainly.
    return { ok: false, total: 0, items: [], reason: 'INTERPOL edge refused the request from this network (HTTP 403). Query manually at interpol.int.' }
  }
}

/* ---------- 2. Internet Archive: historical web footprint ----------
   The single highest-yield passive technique against a fugitive's old
   businesses and sites: what the page said BEFORE it was scrubbed. */

export async function waybackHistory(domainOrUrl) {
  const target = String(domainOrUrl || '').trim().replace(/^https?:\/\//, '')
  if (!target) return { ok: false, items: [] }
  try {
    // NOTE: the CDX endpoint 503s when `collapse` and `fl` are combined, so we
    // take the default column set and read positions off the header row rather
    // than assuming an order.
    const rows = await jget(
      // The archive's CDX latency swings wildly (2s to 30s+) independent of
      // limit — it's server load. Give it room rather than failing a good query.
      `/api/wayback/cdx/search/cdx?url=${encodeURIComponent(target)}&output=json&limit=120`,
      { timeout: 45000 },
    )
    if (!Array.isArray(rows) || rows.length < 2) return { ok: true, items: [], total: 0 }

    const [header, ...data] = rows
    const col = name => header.indexOf(name)
    const iTs = col('timestamp'), iUrl = col('original')
    const iStatus = col('statuscode'), iMime = col('mimetype')

    // Collapse client-side to roughly one capture per month.
    const seen = new Set()
    const items = []
    for (const r of data) {
      const timestamp = r[iTs]
      if (!timestamp) continue
      const bucket = timestamp.slice(0, 6)
      if (seen.has(bucket)) continue
      seen.add(bucket)
      const original = r[iUrl]
      items.push({
        timestamp,
        when: `${timestamp.slice(0, 4)}-${timestamp.slice(4, 6)}-${timestamp.slice(6, 8)}`,
        original,
        statuscode: r[iStatus] || '—',
        mimetype: r[iMime] || '',
        snapshot: `https://web.archive.org/web/${timestamp}/${original}`,
      })
    }
    items.reverse() // newest first
    return { ok: true, total: items.length, first: items[items.length - 1], last: items[0], items }
  } catch {
    return { ok: false, items: [], total: 0 }
  }
}

/* ---------- 3. Bitcoin chain forensics (Blockstream, keyless) ----------
   Real balances and real transaction graphs. No invented "peeling chains". */

const SATS = 1e8

export async function traceAddress(address) {
  const addr = String(address || '').trim()
  if (!/^(bc1|[13])[a-zA-HJ-NP-Z0-9]{20,70}$/.test(addr)) {
    return { ok: false, reason: 'Not a valid Bitcoin address format.' }
  }
  try {
    const [stats, txs] = await Promise.all([
      jget(`/api/chain/address/${addr}`, { timeout: 20000 }),
      jget(`/api/chain/address/${addr}/txs`, { timeout: 20000 }).catch(() => []),
    ])
    const cs = stats.chain_stats || {}
    const received = (cs.funded_txo_sum || 0) / SATS
    const spent = (cs.spent_txo_sum || 0) / SATS
    const transactions = (Array.isArray(txs) ? txs : []).slice(0, 15).map(t => {
      const value = (t.vout || []).reduce((s, o) => s + (o.value || 0), 0) / SATS
      return {
        txid: t.txid,
        time: t.status?.block_time ? new Date(t.status.block_time * 1000) : null,
        height: t.status?.block_height || null,
        confirmed: !!t.status?.confirmed,
        value: +value.toFixed(8),
        inputs: (t.vin || []).length,
        outputs: (t.vout || []).length,
        // A high fan-out is the actual on-chain signature of splitting behaviour.
        fanOut: (t.vout || []).length >= 10,
        counterparties: (t.vout || [])
          .map(o => o.scriptpubkey_address)
          .filter(Boolean)
          .slice(0, 6),
        url: `https://blockstream.info/tx/${t.txid}`,
      }
    })
    return {
      ok: true,
      address: addr,
      received: +received.toFixed(8),
      spent: +spent.toFixed(8),
      balance: +(received - spent).toFixed(8),
      txCount: cs.tx_count || 0,
      transactions,
      explorer: `https://blockstream.info/address/${addr}`,
      highFanOut: transactions.filter(t => t.fanOut).length,
    }
  } catch {
    return { ok: false, reason: 'Chain API unreachable.' }
  }
}

/* ---------- 4. Passive search pivots ----------
   These build the exact query a human runs. They are LINKS, not results —
   the app never claims to have found an account it has not seen. */

export function buildPivots(target) {
  const name = String(target?.name || '').trim()
  const quoted = `"${name}"`
  const aliasList = String(target?.aliases || '')
    .split(',').map(a => a.trim().replace(/^"|"$/g, '')).filter(Boolean)
  const aliasOr = aliasList.length
    ? `(${aliasList.map(a => `"${a}"`).join(' OR ')})`
    : ''
  const enc = q => encodeURIComponent(q)

  return [
    {
      group: 'Court & charging documents',
      why: 'Indictments name co-defendants, shell entities and seized assets — the richest single source of new pivots.',
      queries: [
        { label: 'CourtListener / RECAP', url: `https://www.courtlistener.com/?q=${enc(quoted)}&type=r`, q: quoted },
        { label: 'DOJ press releases', url: `https://www.google.com/search?q=${enc(`site:justice.gov ${quoted}`)}`, q: `site:justice.gov ${quoted}` },
        { label: 'Indictment PDFs', url: `https://www.google.com/search?q=${enc(`${quoted} (indictment OR affidavit OR complaint) filetype:pdf`)}`, q: `${quoted} (indictment OR affidavit OR complaint) filetype:pdf` },
      ],
    },
    {
      group: 'Corporate & beneficial ownership',
      why: 'Fugitives who still need income leave director/shareholder records. These registries are public and searchable by name.',
      queries: [
        { label: 'OpenCorporates', url: `https://opencorporates.com/officers?q=${enc(name)}`, q: name },
        { label: 'UK Companies House', url: `https://find-and-update.company-information.service.gov.uk/search?q=${enc(name)}`, q: name },
        { label: 'SEC EDGAR full-text', url: `https://efts.sec.gov/LATEST/search-index?q=${enc(quoted)}`, q: quoted },
        { label: 'OpenSanctions', url: `https://www.opensanctions.org/search/?q=${enc(name)}`, q: name },
      ],
    },
    {
      group: 'Identity & handle correlation',
      why: 'Aliases on the official poster are the seed. Re-used handles are the most common operational mistake.',
      queries: [
        { label: 'WhatsMyName (handle sweep)', url: 'https://whatsmyname.app/', q: aliasList[0] || name },
        { label: 'Alias + contact surface', url: `https://www.google.com/search?q=${enc(aliasOr || quoted)}`, q: aliasOr || quoted },
        { label: 'Archived social profiles', url: `https://www.google.com/search?q=${enc(`${quoted} (site:archive.org OR site:archive.ph)`)}`, q: `${quoted} site:archive.org` },
      ],
    },
    {
      group: 'Image & media provenance',
      why: 'Reverse-searching the official poster photo surfaces press coverage, older uncropped originals, and sometimes personal accounts.',
      queries: [
        { label: 'Yandex reverse image', url: 'https://yandex.com/images/', q: 'upload the poster image' },
        { label: 'TinEye', url: 'https://tineye.com/', q: 'upload the poster image' },
        { label: 'Google Lens', url: 'https://lens.google.com/', q: 'upload the poster image' },
      ],
    },
    {
      group: 'News & leak corpora',
      why: 'Investigative journalists frequently locate fugitives before agencies confirm it publicly.',
      queries: [
        { label: 'GDELT global news', url: `https://api.gdeltproject.org/api/v2/doc/doc?query=${enc(quoted)}&mode=ArtList&format=html&timespan=12m`, q: quoted },
        { label: 'OCCRP Aleph', url: `https://aleph.occrp.org/search?q=${enc(name)}`, q: name },
        { label: 'ICIJ Offshore Leaks', url: `https://offshoreleaks.icij.org/search?q=${enc(name)}`, q: name },
      ],
    },
  ]
}

/* ---------- 5. Tip routing — the only path that actually pays ---------- */

export const TIP_CHANNELS = [
  {
    agency: 'FBI',
    when: 'Any subject with an FBI poster. Default channel.',
    url: 'https://tips.fbi.gov',
    phone: '1-800-CALL-FBI (1-800-225-5324)',
    note: 'Reward eligibility is determined solely by the FBI. Include the subject\'s poster URL and NCIC number if published.',
  },
  {
    agency: 'U.S. Dept. of State — Rewards for Justice / TOCRP / NRP',
    when: 'Subjects with a State Department reward (typically $5M–$10M): transnational organized crime, narcotics, terrorism.',
    url: 'https://rewardsforjustice.net/submit-a-tip/',
    phone: 'Signal/Telegram tip lines listed on the RFJ site',
    note: 'State runs its own reward programs separate from the FBI. For a $5M/$10M target, submit here as well as to the FBI.',
  },
  {
    agency: 'U.S. Marshals Service',
    when: 'Fugitive apprehension, escapees, sex-offender registry violations.',
    url: 'https://www.usmarshals.gov/tips',
    phone: '1-877-WANTED-2',
    note: 'USMS leads most physical fugitive task forces.',
  },
  {
    agency: 'ICE HSI',
    when: 'Cross-border smuggling, trafficking, immigration-linked crime.',
    url: 'https://www.ice.gov/webform/ice-tip-form',
    phone: '1-866-347-2423',
    note: '',
  },
  {
    agency: 'INTERPOL / local police',
    when: 'Subject sighted outside the United States.',
    url: 'https://www.interpol.int/en/Contacts/Contact-INTERPOL',
    phone: 'Local emergency number for an active sighting',
    note: 'INTERPOL does not take public tips directly — report to local police, referencing the Red Notice.',
  },
]

/* Legal framing that determines whether a tip converts to money. */
export const REWARD_RULES = [
  'You cannot collect by locating and confronting someone yourself. Rewards pay on information that leads to arrest and/or conviction — the arrest must be made by law enforcement.',
  'Bounty-hunting authority (bail enforcement) is a state-licensed activity that applies to bail-bond skips, NOT to federal fugitives. It gives you no authority over anyone on this board.',
  'File the tip BEFORE acting. The timestamped submission is what establishes your claim; an uncredited sighting pays nothing.',
  'Federal reward payments are taxable income and are reported to the IRS.',
  'Approaching a subject flagged "armed and dangerous" risks your safety and can compromise a live investigation — which disqualifies the tip.',
  'Multiple tipsters on the same capture split at the agency\'s discretion; being first and specific matters more than being detailed.',
]
