import type { NextConfig } from 'next'
import nextPWA from 'next-pwa'
import fs from 'fs'
import path from 'path'

const runtimeCaching = [
  {
    urlPattern: /^\/api\/.*$/,
    handler: 'NetworkOnly',
    method: 'GET',
    options: {
      cacheName: 'api-bypass',
    },
  },
  {
    urlPattern: /^https:\/\/mlvgadiaiwzohfoctitq\.supabase\.co\/.*/i,
    handler: 'NetworkFirst',
    method: 'GET',
    options: {
      cacheName: 'supabase-api',
      networkTimeoutSeconds: 10,
      expiration: {
        maxEntries: 20,
        maxAgeSeconds: 60,
      },
    },
  },
  {
    urlPattern: ({ url }: { url: URL }) => url.pathname.startsWith('/sw.js'),
    handler: 'NetworkOnly',
    options: {
      cacheName: 'sw',
    },
  },
]

const withPWA = nextPWA({
  dest: 'public',
  register: true,
  skipWaiting: true,
  runtimeCaching,
  disable: process.env.NODE_ENV === 'development',
  fallbacks: {
    document: '/offline.html',
  },
})

function collectApiRoutes(root: string, current = ''): { routePath: string; buildPath: string }[] {
  if (!fs.existsSync(root)) return []
  const entries = fs.readdirSync(root, { withFileTypes: true })
  const routes: { routePath: string; buildPath: string }[] = []
  for (const entry of entries) {
    const full = path.join(root, entry.name)
    const nextSegment = current ? path.join(current, entry.name) : entry.name
    if (entry.isDirectory()) {
      routes.push(...collectApiRoutes(full, nextSegment))
    } else if (/^route\.(ts|tsx|js)$/.test(entry.name) && current) {
      const normalized = current.split(path.sep).join('/')
      routes.push({
        routePath: `/api/${normalized}`,
        buildPath: `app/api/${normalized}/route.js`,
      })
    }
  }
  return routes
}

const apiRoutes = collectApiRoutes(path.join(__dirname, 'app', 'api'))

const nextConfig: NextConfig = {
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.plugins = config.plugins || []
      config.plugins.push({
        apply(compiler: any) {
          compiler.hooks.afterEmit.tap('EnsurePagesManifest', () => {
            const manifestPath = path.join(compiler.outputPath, 'server', 'pages-manifest.json')
            fs.mkdirSync(path.dirname(manifestPath), { recursive: true })
            let manifest: Record<string, string> = {}
            if (fs.existsSync(manifestPath)) {
              try {
                manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'))
              } catch {
                manifest = {}
              }
            }
            for (const route of apiRoutes) {
              manifest[route.routePath] = route.buildPath
            }
            fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2))
          })
        },
      })
    }
    return config
  },
}

export default withPWA(nextConfig)
