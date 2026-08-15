import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// Every external data source is proxied through the dev server so the browser
// never hits a CORS wall. Each key below maps to one upstream API.
export default defineConfig(({ mode }) => {
// Secrets live in .env.local (gitignored) and are read here, in the dev server
// process. They are injected into upstream requests by the proxy and are never
// bundled into client code — the browser never sees a key.
const env = loadEnv(mode, process.cwd(), '')
const SHODAN_KEY = env.SHODAN_API_KEY || ''

return {
  plugins: [react()],
  resolve: {
    dedupe: ['three'],
  },
  build: {
    chunkSizeWarningLimit: 1600,
    rollupOptions: {
      output: {
        manualChunks: {
          globe: ['three', 'react-globe.gl'],
          motion: ['motion'],
          react: ['react', 'react-dom'],
        },
      },
    },
  },
  server: {
    port: 5173,
    strictPort: true,
    proxy: {
      // NOTE: key must not be a prefix of /api/fbiwanted or /api/fbimg —
      // Vite matches proxy keys by prefix, so '/api/fbi' would swallow both.
      '/api/cde': {
        target: 'https://api.usa.gov',
        changeOrigin: true,
        rewrite: p => p.replace(/^\/api\/cde/, '/crime/fbi/cde'),
      },
      '/api/fbiwanted': {
        target: 'https://api.fbi.gov',
        changeOrigin: true,
        rewrite: p => p.replace(/^\/api\/fbiwanted/, ''),
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'application/json',
        },
      },
      // www.fbi.gov blocks hotlinked poster images unless the request carries
      // browser-like UA + Accept headers. Proxy them so every one of the ~1,200
      // live posters renders, not just the ones cached to disk.
      '/api/fbimg': {
        target: 'https://www.fbi.gov',
        changeOrigin: true,
        rewrite: p => p.replace(/^\/api\/fbimg/, ''),
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
        },
        configure: proxy => {
          // fbi.gov's hotlink guard 403s any image request carrying a foreign
          // Referer/Origin. The browser attaches localhost:5173 automatically,
          // so strip those before the request leaves the dev server.
          proxy.on('proxyReq', proxyReq => {
            for (const h of ['referer', 'origin', 'sec-fetch-site', 'sec-fetch-mode',
                             'sec-fetch-dest', 'sec-ch-ua', 'sec-ch-ua-mobile',
                             'sec-ch-ua-platform', 'cookie']) {
              proxyReq.removeHeader(h)
            }
            // setHeader must win over whatever the browser sent.
            proxyReq.setHeader('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36')
            proxyReq.setHeader('Accept', 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8')
            proxyReq.setHeader('Accept-Language', 'en-US,en;q=0.9')
          })
        },
      },
      // Shodan — key injected server-side from .env.local (SHODAN_API_KEY).
      // Returns 401 with a clear message when no key is configured.
      '/api/shodan': {
        target: 'https://api.shodan.io',
        changeOrigin: true,
        rewrite: p => {
          const stripped = p.replace(/^\/api\/shodan/, '')
          const [path, qs = ''] = stripped.split('?')
          const params = new URLSearchParams(qs)
          if (SHODAN_KEY) params.set('key', SHODAN_KEY)
          return `${path}?${params}`
        },
        configure: proxy => {
          proxy.on('proxyReq', (proxyReq, req, res) => {
            if (!SHODAN_KEY) {
              res.writeHead(401, { 'Content-Type': 'application/json' })
              res.end(JSON.stringify({
                error: 'NO_SHODAN_KEY',
                detail: 'Add SHODAN_API_KEY=your_key to .env.local and restart the dev server.',
              }))
              proxyReq.destroy()
            }
          })
        },
      },
      // OpenMHz — real recorded P25 police radio calls (Cloudflare-fronted).
      '/api/openmhz': {
        target: 'https://api.openmhz.com',
        changeOrigin: true,
        rewrite: p => p.replace(/^\/api\/openmhz/, ''),
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'application/json, text/plain, */*',
        },
      },
      '/api/gdelt': {
        target: 'https://api.gdeltproject.org',
        changeOrigin: true,
        rewrite: p => p.replace(/^\/api\/gdelt/, '/api/v2'),
      },
      '/api/courts': {
        target: 'https://www.courtlistener.com',
        changeOrigin: true,
        rewrite: p => p.replace(/^\/api\/courts/, '/api/rest/v4'),
        headers: { 'User-Agent': 'howsafeismycity-dev/0.1 (educational demo)' },
      },
      '/api/ukpolice': {
        target: 'https://data.police.uk',
        changeOrigin: true,
        rewrite: p => p.replace(/^\/api\/ukpolice/, '/api'),
      },
      '/api/chicago': {
        target: 'https://data.cityofchicago.org',
        changeOrigin: true,
        rewrite: p => p.replace(/^\/api\/chicago/, ''),
      },
      '/api/nyc': {
        target: 'https://data.cityofnewyork.us',
        changeOrigin: true,
        rewrite: p => p.replace(/^\/api\/nyc/, ''),
      },
      '/api/la': {
        target: 'https://data.lacity.org',
        changeOrigin: true,
        rewrite: p => p.replace(/^\/api\/la/, ''),
      },
      // --- Real, keyless OSINT sources (verified reachable) ---
      '/api/chain': {           // Blockstream: live BTC address + tx graph
        target: 'https://blockstream.info',
        changeOrigin: true,
        rewrite: p => p.replace(/^\/api\/chain/, '/api'),
      },
      '/api/wayback': {         // Internet Archive CDX: historical site captures
        target: 'https://web.archive.org',
        changeOrigin: true,
        rewrite: p => p.replace(/^\/api\/wayback/, ''),
      },
      '/api/interpol': {        // INTERPOL public Red Notices (may be edge-blocked)
        target: 'https://ws-public.interpol.int',
        changeOrigin: true,
        rewrite: p => p.replace(/^\/api\/interpol/, ''),
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'application/json',
        },
      },
      '/api/geo': {
        target: 'https://nominatim.openstreetmap.org',
        changeOrigin: true,
        rewrite: p => p.replace(/^\/api\/geo/, ''),
        headers: { 'User-Agent': 'howsafeismycity-dev/0.1 (educational demo)' },
      },
      '/api/translate': {
        target: 'https://translate.googleapis.com',
        changeOrigin: true,
        rewrite: p => p.replace(/^\/api\/translate/, ''),
      },
      '/api/mymemory': {
        target: 'https://api.mymemory.translated.net',
        changeOrigin: true,
        rewrite: p => p.replace(/^\/api\/mymemory/, ''),
      },
    },
  },
}
})
