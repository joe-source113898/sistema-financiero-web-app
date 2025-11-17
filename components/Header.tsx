'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { ThemeToggle } from './ThemeToggle'
import { LayoutDashboard, FileText, Repeat, PiggyBank, LogOut } from 'lucide-react'
import { useSupabaseClient, useSession } from '@supabase/auth-helpers-react'
import { ResetDataButton } from './ResetDataButton'

export function Header() {
  const pathname = usePathname()
  const supabase = useSupabaseClient()
  const session = useSession()
  const router = useRouter()

  const navItems = [
    { href: '/', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/registro', label: 'Registro', icon: FileText },
    { href: '/gastos-recurrentes', label: 'Recurrentes', icon: Repeat },
    { href: '/ahorro-inversion', label: 'Ahorro', icon: PiggyBank },
    // { href: '/corte-diario', label: 'Corte Diario', icon: Calendar },
    // { href: '/upload-excel', label: 'Upload CSV', icon: Upload },
  ]

  return (
    <header className="sticky top-0 z-50 backdrop-blur-xl border-b border-[var(--card-border)] shadow-lg bg-white/80 dark:bg-[#080b13]/90">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo/Title */}
          <Link href="/" className="flex items-center hover:opacity-80 transition-opacity">
            <h1 className="text-xl font-bold text-[var(--foreground)] tracking-tight">
              💰 Sistema financiero
            </h1>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex space-x-1">
            {navItems.map(({ href, label, icon: Icon }) => {
              const isActive = pathname === href
              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full font-medium transition-all ${
                    isActive
                      ? 'bg-[var(--accent)] text-[#04121c] shadow-md'
                      : 'text-[var(--foreground)]/70 hover:bg-[var(--muted-bg)] hover:text-[var(--foreground)]'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {label}
                </Link>
              )
            })}
         </nav>

          {/* Mobile Navigation */}
          <nav className="md:hidden flex gap-1">
            {navItems.map(({ href, icon: Icon }) => {
              const isActive = pathname === href
              return (
                <Link
                  key={href}
                  href={href}
                  className={`p-2 rounded-full ${
                    isActive
                      ? 'bg-[var(--accent-soft)] text-[var(--accent)]'
                      : 'text-[var(--muted)] hover:bg-[var(--muted-bg)] hover:text-[var(--foreground)]'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </Link>
              )
            })}
         </nav>

          <div className="flex items-center gap-2">
            {session && (
              <>
                <button
                  onClick={async () => {
                    const res = await fetch('/api/export')
                    if (!res.ok) {
                      alert('No se pudo exportar datos')
                      return
                    }
                    const blob = await res.blob()
                    const url = window.URL.createObjectURL(blob)
                    const a = document.createElement('a')
                    a.href = url
                    a.download = `respaldo-${new Date().toISOString()}.json`
                    a.click()
                    window.URL.revokeObjectURL(url)
                  }}
                  className="flex items-center gap-2 px-3 py-2 rounded-full text-sm font-semibold text-[var(--muted)] hover:bg-[var(--muted-bg)] hover:text-[var(--foreground)] transition-colors"
                >
                  Exportar
                </button>
                <label className="flex items-center gap-2 px-3 py-2 rounded-full text-sm font-semibold text-[var(--muted)] hover:bg-[var(--muted-bg)] hover:text-[var(--foreground)] transition-colors cursor-pointer">
                  Importar
                  <input
                    type="file"
                    accept="application/json,.json"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0]
                      if (!file) return
                      try {
                        const text = await file.text()
                        const res = await fetch('/api/import', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: text,
                        })
                        const data = await res.json()
                        if (!res.ok) {
                          alert(data.error || 'Error al importar datos')
                          return
                        }
                        alert(`Importados: ${data.summary?.transacciones || 0} transacciones, ${data.summary?.objetivos || 0} objetivos`)
                        const currentUrl = window.location.pathname + window.location.search
                        router.replace(currentUrl)
                        router.refresh()
                        window.location.reload()
                      } catch (err) {
                        alert('Archivo inválido')
                      } finally {
                        if (e.target) e.target.value = ''
                      }
                    }}
                  />
                </label>
                <ResetDataButton />
                <button
                  onClick={async () => {
                    await supabase.auth.signOut()
                    router.push('/login')
                  }}
                  className="flex items-center gap-2 px-3 py-2 rounded-full text-sm font-semibold text-[var(--muted)] hover:bg-[var(--muted-bg)] hover:text-[var(--foreground)] transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Salir
                </button>
              </>
            )}
            {!session && (
              <button
                onClick={() => router.push('/login')}
                className="flex items-center gap-2 px-3 py-2 rounded-full text-sm font-semibold text-[var(--muted)] hover:bg-[var(--muted-bg)] hover:text-[var(--foreground)] transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Entrar
              </button>
            )}
            <ThemeToggle />
          </div>
        </div>
      </div>
    </header>
  )
}
