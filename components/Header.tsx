'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { ThemeToggle } from './ThemeToggle'
import { LayoutDashboard, FileText, Repeat, PiggyBank, LogOut, MoreHorizontal } from 'lucide-react'
import { useSupabaseClient, useSession } from '@supabase/auth-helpers-react'
import { ResetDataButton } from './ResetDataButton'

export function Header() {
  const pathname = usePathname()
  const supabase = useSupabaseClient()
  const session = useSession()
  const router = useRouter()
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const navItems = [
    { href: '/', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/registro', label: 'Registro', icon: FileText },
    { href: '/gastos-recurrentes', label: 'Recurrentes', icon: Repeat },
    { href: '/ahorro-inversion', label: 'Ahorro', icon: PiggyBank },
    // { href: '/corte-diario', label: 'Corte Diario', icon: Calendar },
    // { href: '/upload-excel', label: 'Upload CSV', icon: Upload },
  ]

  const actionButtons = session && (
    <div className="flex items-center gap-2">
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
        className="hidden md:flex items-center gap-2 px-3 py-2 rounded-full text-sm font-semibold text-[var(--muted)] hover:bg-[var(--muted-bg)] hover:text-[var(--foreground)] transition-colors"
      >
        Exportar
      </button>
      <label className="hidden md:flex items-center gap-2 px-3 py-2 rounded-full text-sm font-semibold text-[var(--muted)] hover:bg-[var(--muted-bg)] hover:text-[var(--foreground)] transition-colors cursor-pointer">
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
      <div className="hidden md:block">
        <ResetDataButton />
      </div>
      <button
        onClick={async () => {
          await supabase.auth.signOut()
          router.push('/login')
        }}
        className="flex items-center gap-2 px-3 py-2 rounded-full text-sm font-semibold text-[var(--muted)] hover:bg-[var(--muted-bg)] hover:text-[var(--foreground)] transition-colors"
      >
        <LogOut className="w-4 h-4" />
        <span className="hidden md:inline">Salir</span>
      </button>
    </div>
  )

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-[var(--card-border)] bg-[var(--card-bg)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center hover:opacity-80 transition-opacity">
              <h1 className="text-xl font-bold text-[var(--foreground)] tracking-tight">
                💰 Sistema financiero
              </h1>
            </Link>

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

            <div className="flex items-center gap-2">
              {actionButtons}
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
              {session && isMobile && (
                <button
                  onClick={() => setShowMobileMenu(!showMobileMenu)}
                  className="md:hidden p-2 rounded-full bg-[var(--muted-bg)] text-[var(--foreground)]"
                >
                  <MoreHorizontal className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {isMobile && session && (
        <>
          {showMobileMenu && (
            <div className="fixed inset-0 z-40 bg-black/40" onClick={() => setShowMobileMenu(false)}>
              <div
                className="absolute bottom-0 inset-x-0 bg-[var(--card-bg)] rounded-t-3xl p-6 space-y-4"
                onClick={(e) => e.stopPropagation()}
              >
                <h3 className="text-center font-semibold">Acciones rápidas</h3>
                <div className="flex flex-col gap-3">
                  <ResetDataButton />
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
                      setShowMobileMenu(false)
                    }}
                    className="w-full rounded-full border border-[var(--card-border)] py-3 text-sm font-semibold"
                  >
                    Descargar respaldo
                  </button>
                  <label className="w-full rounded-full border border-dashed border-[var(--card-border)] py-3 text-sm font-semibold text-center cursor-pointer">
                    Importar respaldo
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
                          setShowMobileMenu(false)
                        }
                      }}
                    />
                  </label>
                </div>
              </div>
            </div>
          )}

          <nav className="fixed bottom-4 inset-x-0 z-30 px-4">
            <div className="mx-auto max-w-lg flex justify-around py-3 rounded-3xl border border-[var(--card-border)] bg-[var(--nav-bg)] text-[var(--nav-icon)] shadow-[0px_18px_35px_rgba(15,23,42,0.08)]">
              {navItems.map(({ href, label, icon: Icon }) => {
                const isActive = pathname === href
                return (
                  <Link
                    key={href}
                    href={href}
                    className={`flex flex-col items-center text-xs font-semibold ${
                      isActive ? 'text-[var(--accent)]' : 'text-[var(--nav-icon)]/70'
                    }`}
                  >
                    <Icon className="w-5 h-5 mb-1" />
                    {label.split(' ')[0]}
                  </Link>
                )
              })}
            </div>
          </nav>
        </>
      )}
    </>
  )
}
