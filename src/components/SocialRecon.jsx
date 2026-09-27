import React, { useEffect, useMemo, useState } from 'react'
import { motion } from 'motion/react'
import { playBeep, playLock } from '../utils/audio.js'

const SEARCH_DOMAINS = ['reddit.com', 'youtube.com', 'github.com', 'bsky.app', 'tiktok.com']

const PLATFORM_LINKS = [
  {
    name: 'Google public index',
    detail: 'Broad web search restricted to common public platforms.',
    build: query => `https://www.google.com/search?q=${encodeURIComponent(query)}`,
  },
  {
    name: 'Reddit',
    detail: 'Public posts and profile pages. Relevance is unverified.',
    build: query => `https://www.reddit.com/search/?q=${encodeURIComponent(query)}`,
  },
  {
    name: 'YouTube',
    detail: 'Public channels, videos, and captions where indexed.',
    build: query => `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`,
  },
  {
    name: 'GitHub',
    detail: 'Public user profiles and repositories only.',
    build: query => `https://github.com/search?q=${encodeURIComponent(query)}&type=users`,
  },
  {
    name: 'Bluesky',
    detail: 'Public search where the service makes results available.',
    build: query => `https://bsky.app/search?q=${encodeURIComponent(query)}`,
  },
  {
    name: 'TikTok',
    detail: 'Public search pages only. Do not infer identity from a handle.',
    build: query => `https://www.tiktok.com/search?q=${encodeURIComponent(query)}`,
  },
]

function aliasesFor(target) {
  return String(target?.aliases || '')
    .split(',')
    .map(alias => alias.replace(/["']/g, '').trim())
    .filter(Boolean)
    .slice(0, 5)
}

function queryTerms(target) {
  return [target?.name, ...aliasesFor(target)]
    .filter(Boolean)
    .map(value => `"${value}"`)
}

export default function SocialRecon({ wanted }) {
  const items = wanted?.items || []
  const [targetId, setTargetId] = useState('')
  const [sourceUrl, setSourceUrl] = useState('')
  const [sourceNote, setSourceNote] = useState('')
  const [captures, setCaptures] = useState([])
  const [formError, setFormError] = useState('')

  useEffect(() => {
    if (!items.some(item => item.uid === targetId)) setTargetId(items[0]?.uid || '')
  }, [items, targetId])

  const target = items.find(item => item.uid === targetId) || items[0] || null
  const terms = useMemo(() => queryTerms(target), [target])
  const exactSearch = terms.join(' OR ')
  const indexedQuery = `${exactSearch} (${SEARCH_DOMAINS.map(domain => `site:${domain}`).join(' OR ')})`.trim()

  const pivots = useMemo(() => PLATFORM_LINKS.map((platform, index) => {
    const query = index === 0 ? indexedQuery : exactSearch
    return { ...platform, queryText: query, href: platform.build(query) }
  }), [exactSearch, indexedQuery])

  const addCapture = event => {
    event.preventDefault()
    const url = sourceUrl.trim()
    const note = sourceNote.trim()
    if (!/^https?:\/\//i.test(url)) {
      setFormError('Enter a public http(s) URL so the source can be revisited.')
      return
    }
    if (!note) {
      setFormError('Add a short note describing what the page actually shows.')
      return
    }
    setCaptures(current => [{
      id: globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`,
      target: target?.name || 'Unknown target',
      url,
      note,
      capturedAt: new Date().toISOString(),
    }, ...current])
    setSourceUrl('')
    setSourceNote('')
    setFormError('')
    playLock()
  }

  if (!target) {
    return (
      <div className="panel social-panel">
        <div className="panel-title">Public social recon <span className="meta">Awaiting official target data</span></div>
        <p className="empty-note">The public target board has not returned a target yet. No social search is generated without an official source record.</p>
      </div>
    )
  }

  return (
    <div className="panel social-panel">
      <div className="panel-title">
        <span>Public social recon</span>
        <span className="meta">Public sources only · search links, not findings</span>
      </div>

      <div className="social-safety-note">
        <b>Scope:</b> open search pages and local research notes. This workspace does not access private accounts, scrape platforms, identify faces, infer live location, or establish that a social profile belongs to a target.
      </div>

      <div className="recon-targetbar">
        <label htmlFor="social-target">Official target</label>
        <select id="social-target" value={target.uid} onChange={event => setTargetId(event.target.value)}>
          {items.map(item => <option key={item.uid} value={item.uid}>{item.name}</option>)}
        </select>
        {target.posterUrl && <a className="btn ghost sm" href={target.posterUrl} target="_blank" rel="noreferrer" onClick={() => playBeep()}>Open official record</a>}
      </div>

      <div className="social-target-context">
        <div><span>Subject</span><b>{target.name}</b></div>
        <div><span>Official aliases</span><b>{aliasesFor(target).join(' · ') || 'None listed'}</b></div>
        <div className="social-unverified"><span>Interpretation</span><b>Unverified until corroborated</b></div>
      </div>

      <div className="recon-block">
        <div className="recon-block-title">Public search launchers</div>
        <p className="recon-sub">Open a platform search using the official name and aliases. Review results manually; a name match is not an identity match.</p>
        <div className="social-pivot-grid">
          {pivots.map(pivot => (
            <motion.a
              key={pivot.name}
              className="social-pivot"
              href={pivot.href}
              target="_blank"
              rel="noreferrer"
              whileHover={{ y: -2 }}
              onClick={() => playBeep()}
            >
              <b>{pivot.name}</b>
              <code>{pivot.queryText || 'official target name'}</code>
              <span>{pivot.detail}</span>
            </motion.a>
          ))}
        </div>
      </div>

      <div className="recon-block">
        <div className="recon-block-title">Local public-source log</div>
        <p className="recon-sub">Save a URL and a factual note for your own review. Entries are kept in this browser session and are not submitted to an agency.</p>
        <form className="social-capture-form" onSubmit={addCapture}>
          <input value={sourceUrl} onChange={event => setSourceUrl(event.target.value)} placeholder="https://public-source.example/item" aria-label="Public source URL" />
          <textarea value={sourceNote} onChange={event => setSourceNote(event.target.value)} placeholder="What does the page show? Record observations, not conclusions." rows="3" aria-label="Source observation" />
          <div className="social-form-footer">
            <button className="btn ghost sm" type="submit">Save unverified source</button>
            {formError && <span className="social-form-error">{formError}</span>}
          </div>
        </form>
      </div>

      {captures.length > 0 && (
        <div className="social-capture-list">
          {captures.map(capture => (
            <article className="social-capture" key={capture.id}>
              <div className="social-capture-head">
                <span>UNVERIFIED · {capture.target}</span>
                <time dateTime={capture.capturedAt}>{new Date(capture.capturedAt).toLocaleString()}</time>
              </div>
              <a href={capture.url} target="_blank" rel="noreferrer">{capture.url}</a>
              <p>{capture.note}</p>
            </article>
          ))}
        </div>
      )}

      <p className="social-footer-note">Do not contact, confront, or publish a suspected identity. Send credible information through the official agency channel listed on the source record.</p>
    </div>
  )
}
