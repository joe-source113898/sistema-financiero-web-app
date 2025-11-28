'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Eye, EyeOff } from 'lucide-react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

export function LoginClient() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClientComponentClient()

  useEffect(() => {
    document.body.classList.add('login-view')
    return () => {
      document.body.classList.remove('login-view')
    }
  }, [])

  const safeAreaStyle = useMemo(
    () => ({
      paddingTop: 'calc(2rem + env(safe-area-inset-top))',
      paddingBottom: 'calc(2rem + env(safe-area-inset-bottom))',
      background:
        'radial-gradient(circle at 10% 10%, rgba(99, 179, 237, 0.45), transparent 50%), radial-gradient(circle at 90% 0%, rgba(248, 113, 113, 0.4), transparent 45%), linear-gradient(180deg, #040813 0%, #0f1728 100%)',
    }),
    []
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    const redirectTo = searchParams.get('redirectTo') || '/'
    router.push(redirectTo)
    router.refresh()
  }

  return (
    <main className="min-h-svh flex items-center justify-center" style={safeAreaStyle}>
      <section className="w-full max-w-md mx-auto px-4">
        <div className="rounded-3xl border border-white/25 bg-[rgba(20,28,58,0.85)] shadow-[0_30px_80px_rgba(3,7,18,0.65)] backdrop-blur-3xl p-6 sm:p-8 space-y-8 text-white">
          <div className="text-center space-y-3">
            <div className="w-14 h-14 mx-auto rounded-full bg-gradient-to-br from-sky-400 to-blue-600 flex items-center justify-center text-2xl shadow-lg shadow-blue-500/40">
              💰
            </div>
            <div>
              <h1 className="text-3xl font-black text-white tracking-tight drop-shadow-[0_5px_25px_rgba(14,165,233,0.45)]">Sistema financiero</h1>
              <p className="text-base text-white/90 drop-shadow-lg">Dashboard financiero empresarial</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-white drop-shadow mb-2 tracking-wide">
                  Correo electrónico
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tucorreo@example.com"
                  className="w-full rounded-2xl border border-white/40 bg-white/15 px-4 py-3 text-white placeholder-white/70 focus:ring-2 focus:ring-sky-300/80 focus:border-transparent ring-offset-2 ring-offset-white/10 transition-shadow drop-shadow-[0_10px_30px_rgba(59,130,246,0.25)]"
                  autoFocus
                  required
                  autoComplete="email"
                />
              </div>
              <div>
                <label htmlFor="password" className="block text-sm font-semibold text-white drop-shadow mb-2 tracking-wide">
                  Contraseña de acceso
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Ingresa tu contraseña"
                    className="w-full rounded-2xl border border-white/40 bg-white/15 px-4 py-3 pr-12 text-white placeholder-white/70 focus:ring-2 focus:ring-sky-300/80 focus:border-transparent ring-offset-2 ring-offset-white/10 transition-shadow drop-shadow-[0_10px_30px_rgba(59,130,246,0.25)]"
                    required
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-3 flex items-center text-white/70 hover:text-white"
                    aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
            </div>

            {error && (
              <div className="rounded-2xl bg-red-500/10 border border-red-500/30 px-4 py-3 text-sm text-red-200 text-center">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
                  className="w-full rounded-2xl bg-gradient-to-r from-sky-400 via-blue-500 to-indigo-500 hover:from-sky-300 hover:via-blue-400 hover:to-indigo-400 text-white py-3 font-semibold shadow-[0_15px_45px_rgba(59,130,246,0.45)] transition active:scale-[0.985] disabled:opacity-60"
            >
              {loading ? 'Ingresando...' : 'Ingresar al dashboard'}
            </button>
          </form>

          <p className="text-center text-xs text-white/80 tracking-wide">Sistema protegido © 2025</p>
        </div>
      </section>
    </main>
  )
}
