'use client'

import { Suspense, useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Eye, EyeOff } from 'lucide-react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#070a0f] to-[#0d1424] text-gray-200">
          Cargando formulario...
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  )
}

function LoginForm() {
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
      background: 'linear-gradient(160deg, #e6f0ff, #c0d4ff)',
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
        <div className="bg-white border border-white/60 rounded-3xl shadow-2xl shadow-sky-200/60 p-6 sm:p-8 space-y-8">
          <div className="text-center space-y-3">
            <div className="w-14 h-14 mx-auto rounded-full bg-[var(--accent-soft)] flex items-center justify-center text-2xl shadow">
              🏛️
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Sistema financiero
              </h1>
              <p className="text-sm text-gray-500">Dashboard financiero empresarial</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-600 mb-2">
                  Correo electrónico
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tucorreo@example.com"
                  className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition"
                  autoFocus
                  required
                  autoComplete="email"
                />
              </div>
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-600 mb-2">
                  Contraseña de acceso
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Ingresa tu contraseña"
                    className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 pr-12 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition"
                    required
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-gray-600"
                    aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
            </div>

            {error && (
              <div className="rounded-2xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600 text-center">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white py-3 font-semibold shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 transition active:scale-[0.99] disabled:opacity-60"
            >
              {loading ? 'Ingresando...' : 'Ingresar al dashboard'}
            </button>
          </form>

          <p className="text-center text-xs text-gray-500">Sistema protegido © 2025</p>
        </div>
      </section>
    </main>
  )
}
