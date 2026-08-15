import React, { useEffect, useRef, useState } from 'react'
import { traceAddress, waybackHistory, searchRedNotices, buildPivots } from '../api/osint.js'
import { searchCourts, fetchMostWanted, fetchCityNews } from '../api/feeds.js'
import { shodanSearch, shodanHost } from '../api/shodan.js'
import { desksForTarget, nativeQueries } from '../api/multilingual.js'
import { INTEL } from '../data/intel.js'
import { playBeep, playLock } from '../utils/audio.js'

/* Every command below performs a real network call and prints what came back.
   The previous version matched on a keyword and printed a pre-written paragraph
   that looked like a query result. Nothing here is canned: if a source is down,
   the terminal says so rather than inventing output. */

const BANNER = [
  { t: 'sys', v: 'BOUNTY.GRID TACTICAL TERMINAL — every command hits a live source.' },
  { t: 'dim', v: 'Type `help` for commands. Results are raw source output, not summaries.' },
]

const HELP = [
  ['wanted <text>', 'Search the live FBI wanted board (1,200+ posters).'],
  ['intel <name>', 'Show the compiled, sourced dossier for a target.'],
  ['docket <query>', 'Search CourtListener / RECAP federal opinions.'],
  ['trace <btc-addr>', 'Live Bitcoin ledger: balance, tx graph, fan-out.'],
  ['archive <domain>', 'Internet Archive captures — what a site said before scrubbing.'],
  ['redn <surname>', 'INTERPOL public Red Notices.'],
  ['news <subject>', 'GDELT global news mesh (all languages).'],
  ['lang <name>', 'Native-language query pack from official country ties.'],
  ['dork <name>', 'Passive search pivots (court, registry, handle, image).'],
  ['shodan <query>', 'Shodan host search. Needs SHODAN_API_KEY in .env.local.'],
  ['host <ip>', 'Shodan host lookup for one IP.'],
  ['clear', 'Clear the terminal.'],
]

export default function SolverTerminal() {
  const [lines, setLines] = useState(BANNER)
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [history, setHistory] = useState([])
  const [hIdx, setHIdx] = useState(-1)
  const endRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => { endRef.current?.scrollIntoView({ block: 'end' }) }, [lines])

  const push = (...entries) => setLines(l => [...l, ...entries])
  const ok = v => ({ t: 'ok', v })
  const dim = v => ({ t: 'dim', v })
  const err = v => ({ t: 'err', v })
  const out = v => ({ t: 'out', v })
  const link = (v, href) => ({ t: 'link', v, href })

  async function run(raw) {
    const [cmd, ...rest] = raw.trim().split(/\s+/)
    const arg = rest.join(' ').trim()
    const c = (cmd || '').toLowerCase()

    if (c === 'clear') { setLines(BANNER); return }
    if (c === 'help' || !c) {
      push(ok('COMMANDS'))
      HELP.forEach(([k, d]) => push(out(`  ${k.padEnd(20)} ${d}`)))
      return
    }

    const needsArg = () => { push(err(`  ${c}: missing argument. See \`help\`.`)); }

    switch (c) {
      case 'wanted': {
        if (!arg) return needsArg()
        push(dim(`  querying api.fbi.gov …`))
        const res = await fetchMostWanted()
        if (!res.ok) return push(err('  FBI uplink unreachable.'))
        const n = arg.toLowerCase()
        const hits = res.items.filter(p =>
          p.name.toLowerCase().includes(n) || (p.aliases || '').toLowerCase().includes(n) ||
          (p.subjects || '').toLowerCase().includes(n) || (p.offices || '').toLowerCase().includes(n))
        push(ok(`  ${hits.length} match(es) of ${res.total.toLocaleString()} active posters`))
        hits.slice(0, 8).forEach(p => {
          push(out(`  ▸ ${p.name}${p.reward ? `  [${p.reward}]` : ''}`))
          if (p.aliases) push(dim(`      aliases: ${p.aliases}`))
          if (p.remarks) push(dim(`      ties: ${p.remarks.slice(0, 150)}`))
          push(link(`      ${p.url}`, p.url))
        })
        if (!hits.length) push(dim('  no match — try a surname, field office, or offense keyword.'))
        return
      }

      case 'intel': {
        if (!arg) return needsArg()
        const n = arg.toLowerCase()
        const d = INTEL.find(x => x.name.toLowerCase().includes(n) || x.slug.includes(n.replace(/\s+/g, '-')))
        if (!d) {
          push(err(`  no compiled dossier for "${arg}".`))
          push(dim(`  available: ${INTEL.map(x => x.name.split(/[\s,]+/)[0].toLowerCase()).join(', ')}`))
          return
        }
        push(ok(`  ${d.name}  —  ${d.rewardLabel}`))
        push(out(`  COLLECTABILITY: ${d.collectability}`))
        push(dim(`  ${d.collectabilityWhy}`))
        push(out('  FINDINGS:'))
        d.findings.forEach(f => {
          const tag = f.actionable ? 'ACTIONABLE' : f.disputed ? 'DISPUTED  ' : f.blocker ? 'BLOCKER   ' : 'FACT      '
          push(out(`   [${tag}] ${f.fact}`))
        })
        push(out('  SOURCES:'))
        d.sources.forEach(s => push(link(`   [${s.n}] ${s.t}`, s.u)))
        return
      }

      case 'docket': {
        if (!arg) return needsArg()
        push(dim('  querying courtlistener.com …'))
        const r = await searchCourts(arg)
        if (!r.ok) return push(err('  CourtListener unreachable — showing nothing rather than guessing.'))
        push(ok(`  ${r.count.toLocaleString()} result(s)`))
        r.results.slice(0, 6).forEach(x => {
          push(out(`  ▸ ${x.caseName}`))
          push(dim(`      ${x.court}${x.dateFiled ? ` · filed ${x.dateFiled}` : ''}${x.docketNumber ? ` · No. ${x.docketNumber}` : ''}`))
          push(link(`      ${x.url}`, x.url))
        })
        return
      }

      case 'trace': {
        if (!arg) return needsArg()
        push(dim('  querying blockstream.info …'))
        const r = await traceAddress(arg)
        if (!r.ok) return push(err(`  ${r.reason}`))
        push(ok(`  ${r.address}`))
        push(out(`   balance ${r.balance} BTC · received ${r.received} · spent ${r.spent} · ${r.txCount} tx`))
        if (r.highFanOut) push(out(`   ${r.highFanOut} high fan-out transaction(s) — the on-chain signature of value splitting`))
        r.transactions.slice(0, 6).forEach(t =>
          push(dim(`   ${t.time ? t.time.toISOString().slice(0, 10) : 'pending'}  ${String(t.value).padStart(12)} BTC  ${t.inputs}in/${t.outputs}out  ${t.txid.slice(0, 20)}…`)))
        push(link(`   ${r.explorer}`, r.explorer))
        return
      }

      case 'archive': {
        if (!arg) return needsArg()
        push(dim('  querying web.archive.org …'))
        const r = await waybackHistory(arg)
        if (!r.ok) return push(err('  archive unreachable.'))
        if (!r.items.length) return push(dim('  no captures indexed for that domain.'))
        push(ok(`  ${r.total} capture(s) · first ${r.first?.when} · last ${r.last?.when}`))
        r.items.slice(0, 8).forEach(x => push(link(`   ${x.when}  HTTP ${x.statuscode}  ${x.original}`, x.snapshot)))
        return
      }

      case 'redn': {
        if (!arg) return needsArg()
        push(dim('  querying ws-public.interpol.int …'))
        const r = await searchRedNotices({ name: arg })
        if (!r.ok) return push(err(`  ${r.reason}`))
        push(ok(`  ${r.total} public Red Notice(s)`))
        r.items.slice(0, 8).forEach(n => {
          push(out(`  ▸ ${n.name}`))
          push(dim(`      ${[n.dob, n.nationalities, n.charges].filter(Boolean).join(' · ').slice(0, 160)}`))
        })
        if (!r.items.length) push(dim('  none published publicly under that surname.'))
        return
      }

      case 'news': {
        if (!arg) return needsArg()
        push(dim('  querying GDELT (rate-limited, may take a few seconds) …'))
        const r = await fetchCityNews(arg)
        if (!r.items.length) return push(dim('  no coverage in the last 7 days.'))
        push(ok(`  ${r.items.length} article(s)`))
        r.items.forEach(a => {
          push(out(`  ▸ ${a.title}`))
          push(link(`      ${a.domain} — ${a.url}`, a.url))
        })
        return
      }

      case 'lang': {
        if (!arg) return needsArg()
        const res = await fetchMostWanted()
        const t = (res.items || []).find(p => p.name.toLowerCase().includes(arg.toLowerCase()))
        if (!t) return push(err(`  "${arg}" not on the live board.`))
        const desks = desksForTarget(t)
        if (!desks.length) return push(dim('  no foreign country ties on the official record.'))
        desks.forEach(d => {
          push(ok(`  ${d.country} — ${d.langs.join(', ')}`))
          nativeQueries(t, d).forEach(q => {
            push(out(`   ${q.label}`))
            push(link(`      ${q.q}`, q.url))
          })
          push(dim(`   outlets: ${d.outlets.join(', ')}`))
          push(dim(`   registries: ${d.registries.join(' · ')}`))
        })
        return
      }

      case 'dork': {
        if (!arg) return needsArg()
        const res = await fetchMostWanted()
        const t = (res.items || []).find(p => p.name.toLowerCase().includes(arg.toLowerCase())) || { name: arg, aliases: '' }
        buildPivots(t).forEach(g => {
          push(ok(`  ${g.group}`))
          push(dim(`   ${g.why}`))
          g.queries.forEach(q => push(link(`   ${q.label}: ${q.q}`, q.url)))
        })
        return
      }

      case 'shodan': {
        if (!arg) return needsArg()
        push(dim('  querying api.shodan.io …'))
        const r = await shodanSearch(arg)
        if (!r.ok) return push(err(`  ${r.reason}`))
        push(ok(`  ${r.total.toLocaleString()} result(s) — showing ${r.matches.length}`))
        r.matches.forEach(m => {
          push(out(`  ▸ ${m.ip}:${m.port}  ${m.product || ''} ${m.org ? `(${m.org})` : ''}`))
          push(dim(`      ${[m.city, m.country].filter(Boolean).join(', ')}${m.hostnames ? ` · ${m.hostnames}` : ''}`))
        })
        return
      }

      case 'host': {
        if (!arg) return needsArg()
        push(dim('  querying api.shodan.io …'))
        const r = await shodanHost(arg)
        if (!r.ok) return push(err(`  ${r.reason}`))
        push(ok(`  ${r.ip}  ${r.org || ''}`))
        push(out(`   ${[r.city, r.country].filter(Boolean).join(', ')} · ${r.ports.length} open port(s): ${r.ports.join(', ')}`))
        if (r.vulns.length) push(err(`   CVEs: ${r.vulns.join(', ')}`))
        return
      }

      default:
        push(err(`  unknown command: ${c}. Type \`help\`.`))
    }
  }

  const submit = async e => {
    e?.preventDefault()
    const raw = input.trim()
    if (!raw || busy) return
    playLock()
    push({ t: 'cmd', v: `bountygrid:~$ ${raw}` })
    setHistory(h => [raw, ...h].slice(0, 60))
    setHIdx(-1)
    setInput('')
    setBusy(true)
    try {
      await run(raw)
    } catch (e2) {
      push(err(`  command failed: ${e2.message}`))
    }
    setBusy(false)
    inputRef.current?.focus()
  }

  const onKey = e => {
    if (e.key === 'ArrowUp') {
      e.preventDefault()
      const i = Math.min(hIdx + 1, history.length - 1)
      if (history[i] != null) { setHIdx(i); setInput(history[i]) }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      const i = Math.max(hIdx - 1, -1)
      setHIdx(i); setInput(i === -1 ? '' : history[i])
    }
  }

  return (
    <div className="panel term-panel">
      <div className="panel-title">
        ▮ TACTICAL TERMINAL
        <span className="meta">EVERY COMMAND HITS A LIVE SOURCE</span>
      </div>

      <div className="term-body" onClick={() => inputRef.current?.focus()}>
        {lines.map((l, i) =>
          l.t === 'link'
            ? <a key={i} className="term-line term-link" href={l.href} target="_blank" rel="noreferrer">{l.v}</a>
            : <div key={i} className={`term-line term-${l.t}`}>{l.v}</div>,
        )}
        {busy && <div className="term-line term-dim">  …working</div>}
        <div ref={endRef} />
      </div>

      <form className="term-input-row" onSubmit={submit}>
        <span className="term-prompt">bountygrid:~$</span>
        <input
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={onKey}
          placeholder="help"
          spellCheck={false}
          autoComplete="off"
        />
        <button className="btn" type="submit" disabled={busy}>{busy ? '…' : 'RUN'}</button>
      </form>

      <div className="term-quick">
        {['help', 'intel ruja', 'wanted archaga', 'trace 1F1tAaz5x1HUXrCNLbtMDqcw6o5GNn4xqX', 'archive onecoin.eu', 'redn ignatova', 'docket RICO'].map(q => (
          <button key={q} className="pill-btn" onClick={() => { playBeep(); setInput(q); inputRef.current?.focus() }}>{q}</button>
        ))}
      </div>
    </div>
  )
}
