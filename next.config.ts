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
            if (!fs.existsSync(manifestPath)) {
              fs.mkdirSync(path.dirname(manifestPath), { recursive: true })
              fs.writeFileSync(manifestPath, '{}')
            }
          })
        },
      })
    }
    return config
  },
}

export default withPWA(nextConfig)
