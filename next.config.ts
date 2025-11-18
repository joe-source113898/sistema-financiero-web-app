import type { NextConfig } from 'next'
import nextPWA from 'next-pwa'

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
}

export default withPWA(nextConfig)
