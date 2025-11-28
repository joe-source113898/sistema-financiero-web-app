import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/components/ThemeProvider'
import { Header } from '@/components/Header'
import { SupabaseProvider } from '@/components/SupabaseProvider'

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: 'Sistema financiero · dashboard',
  description: 'Sistema de gestión financiera personal y familiar',
  applicationName: 'Sistema financiero',
  manifest: '/manifest.webmanifest',
  icons: {
    icon: '/icons/icon-192x192.png',
    apple: '/apple-touch-icon.png',
    shortcut: '/favicon.ico',
  },
  appleWebApp: {
    capable: true,
    title: 'Sistema financiero',
    statusBarStyle: 'default',
  },
  formatDetection: {
    telephone: false,
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f8fafc' },
    { media: '(prefers-color-scheme: dark)', color: '#020617' },
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          storageKey="sistema-financiero-theme"
          disableTransitionOnChange
        >
          <SupabaseProvider>
            <div className="app-shell min-h-svh bg-[var(--bg-page)] text-[var(--text-main)] transition-colors">
              <Header />
              <main className="app-content">{children}</main>
            </div>
          </SupabaseProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
