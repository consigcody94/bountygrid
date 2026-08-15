#!/usr/bin/env node
/*
 * Sync FBI wanted poster images to public/images/wanted/.
 *
 * Why this exists: www.fbi.gov sits behind an Akamai edge that fingerprints the
 * client. curl passes; Node's fetch/undici gets a blanket 403. So the Vite dev
 * proxy can never serve these images, no matter what headers it sets. We shell
 * out to curl (which the edge accepts) and cache the posters locally.
 *
 * api.fbi.gov (the JSON API) has no such guard and is fetched normally.
 *
 *   node scripts/sync-wanted-images.mjs [--pages 6] [--force]
 */
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { mkdir, writeFile, readdir, stat } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'

const run = promisify(execFile)
const ROOT = path.resolve(import.meta.dirname, '..')
const OUT_DIR = path.join(ROOT, 'public', 'images', 'wanted')
const MANIFEST = path.join(ROOT, 'src', 'data', 'wantedImages.json')

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
const args = process.argv.slice(2)
const PAGES = Number(args[args.indexOf('--pages') + 1]) || 6
const FORCE = args.includes('--force')
const CONCURRENCY = 6

function slugFromUrl(url) {
  const m = String(url || '').match(/\/wanted\/[^/]+\/([^/?#]+)/)
  return m ? m[1] : ''
}

async function fetchPage(page) {
  const res = await fetch(
    `https://api.fbi.gov/wanted/v1/list?pageSize=50&page=${page}&sort_on=modified&sort_order=desc`,
    { headers: { Accept: 'application/json', 'User-Agent': UA } },
  )
  if (!res.ok) throw new Error(`list page ${page}: HTTP ${res.status}`)
  return res.json()
}

async function download(url, dest) {
  // -f fail on HTTP error, -s silent, -S show errors, -L follow redirects
  await run('curl', [
    '-fsSL', '--max-time', '45',
    '-A', UA,
    '-H', 'Accept: image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
    '-H', 'Accept-Language: en-US,en;q=0.9',
    url, '-o', dest,
  ], { maxBuffer: 1024 * 1024 * 32 })
  const s = await stat(dest)
  if (s.size < 512) throw new Error('suspiciously small file')
  return s.size
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true })

  console.log(`▸ Pulling ${PAGES} page(s) of the live FBI wanted board…`)
  const items = []
  let total = 0
  for (let p = 1; p <= PAGES; p++) {
    try {
      const json = await fetchPage(p)
      total = json.total || total
      items.push(...(json.items || []))
      process.stdout.write(`  page ${p}: +${(json.items || []).length}\n`)
    } catch (e) {
      console.warn(`  page ${p} failed: ${e.message}`)
    }
  }
  console.log(`▸ ${items.length} records pulled (board total: ${total})`)

  const targets = []
  for (const it of items) {
    const img = (it.images || [])[0]
    const src = img?.large || img?.original || img?.thumb
    if (!src || !it.uid) continue
    const slug = slugFromUrl(it.url) || it.uid
    const file = `${slug}.jpg`
    targets.push({ uid: it.uid, slug, file, src, dest: path.join(OUT_DIR, file), name: it.title })
  }

  let downloaded = 0, skipped = 0, failed = 0
  const manifest = {}
  const queue = [...targets]

  await Promise.all(Array.from({ length: CONCURRENCY }, async () => {
    while (queue.length) {
      const t = queue.shift()
      manifest[t.slug] = `/images/wanted/${t.file}`
      if (!FORCE && existsSync(t.dest)) { skipped++; continue }
      try {
        await download(t.src, t.dest)
        downloaded++
        if (downloaded % 10 === 0) process.stdout.write(`  …${downloaded} downloaded\n`)
      } catch {
        failed++
        delete manifest[t.slug] // no local copy -> let the UI fall back
      }
    }
  }))

  await writeFile(MANIFEST, JSON.stringify(manifest, null, 2) + '\n', 'utf8')
  const onDisk = (await readdir(OUT_DIR)).filter(f => /\.(jpg|jpeg|png|webp)$/i.test(f)).length

  console.log(`\n✓ downloaded ${downloaded} · cached-skip ${skipped} · failed ${failed}`)
  console.log(`✓ ${onDisk} poster files in public/images/wanted/`)
  console.log(`✓ manifest: ${path.relative(ROOT, MANIFEST)} (${Object.keys(manifest).length} entries)`)
}

main().catch(e => { console.error(e); process.exit(1) })
