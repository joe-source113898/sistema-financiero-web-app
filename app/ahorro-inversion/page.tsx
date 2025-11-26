'use client'

import { useEffect, useMemo, useState } from 'react'
import { useSupabaseClient, useSession } from '@supabase/auth-helpers-react'
import {
  PiggyBank,
  TrendingUp,
  Wallet,
  ArrowDownCircle,
  ArrowUpCircle,
  Loader2,
  RefreshCw,
  PlusCircle,
  Target,
  Activity,
  Edit3,
  Trash2,
} from 'lucide-react'
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
} from 'chart.js'
import { Doughnut, Line } from 'react-chartjs-2'

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement)

type Movimiento = {
  id: string
  fecha: string
  tipo: 'gasto' | 'ingreso'
  monto: number
  descripcion: string | null
  concepto: string | null
  objetivo_id: string | null
}

type Objetivo = {
  id: string
  nombre: string
  meta: number | null
  descripcion: string | null
  color: string | null
}

interface ResumenObjetivo {
  aportes: number
  retiros: number
  balance: number
}

export default function AhorroInversionPage() {
  const supabase = useSupabaseClient()
  const session = useSession()

  const [movimientos, setMovimientos] = useState<Movimiento[]>([])
  const [objetivos, setObjetivos] = useState<Objetivo[]>([])

  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [creatingGoal, setCreatingGoal] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [refreshing, setRefreshing] = useState(false)

  const [tipoMovimiento, setTipoMovimiento] = useState<'aporte' | 'retiro'>('aporte')
  const [monto, setMonto] = useState('')
  const [notas, setNotas] = useState('')
  const [objetivoSeleccionado, setObjetivoSeleccionado] = useState<string>('')

  const [nuevoNombre, setNuevoNombre] = useState('')
  const [nuevaMeta, setNuevaMeta] = useState('')
  const [nuevoColor, setNuevoColor] = useState('#0ea5e9')
  const [editingGoalId, setEditingGoalId] = useState<string | null>(null)
  const [goalFeedback, setGoalFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const [objetivoGrafica, setObjetivoGrafica] = useState<string>('todos')

  useEffect(() => {
    if (!session) return
    fetchObjetivos()
    fetchMovimientos()
  }, [session])

  const fetchObjetivos = async () => {
    const { data, error } = await supabase
      .from('objetivos_ahorro')
      .select('id, nombre, meta, descripcion, color')
      .eq('usuario_id', session?.user.id)
      .order('created_at', { ascending: true })

    if (error) {
      setError(error.message)
      return
    }

    setObjetivos(data || [])
    if (!objetivoSeleccionado && data && data.length > 0) {
      setObjetivoSeleccionado(data[0].id)
    }
  }

  const fetchMovimientos = async () => {
    setLoading(true)
    setError('')
    try {
      const { data, error: supabaseError } = await supabase
        .from('transacciones')
        .select('id, fecha, tipo, monto, descripcion, concepto, objetivo_id')
        .eq('categoria', 'Ahorro/inversión')
        .eq('usuario_id', session?.user.id)
        .order('fecha', { ascending: false })
        .limit(200)

      if (supabaseError) throw supabaseError
      setMovimientos(data || [])
    } catch (err: any) {
      setError(err.message || 'Error al cargar movimientos de ahorro e inversión')
    } finally {
      setLoading(false)
    }
  }

  const resumenPorObjetivo = useMemo(() => {
    const resumen: Record<string, ResumenObjetivo> = {}
    movimientos.forEach((mov) => {
      const key = mov.objetivo_id || 'sin_objetivo'
      if (!resumen[key]) {
        resumen[key] = { aportes: 0, retiros: 0, balance: 0 }
      }
      if (mov.tipo === 'gasto') {
        resumen[key].aportes += Number(mov.monto || 0)
        resumen[key].balance += Number(mov.monto || 0)
      } else {
        resumen[key].retiros += Number(mov.monto || 0)
        resumen[key].balance -= Number(mov.monto || 0)
      }
    })
    return resumen
  }, [movimientos])

  const totalAportado = useMemo(
    () => movimientos.filter((mov) => mov.tipo === 'gasto').reduce((sum, mov) => sum + Number(mov.monto || 0), 0),
    [movimientos]
  )

  const totalRetirado = useMemo(
    () => movimientos.filter((mov) => mov.tipo === 'ingreso').reduce((sum, mov) => sum + Number(mov.monto || 0), 0),
    [movimientos]
  )

  const balance = totalAportado - totalRetirado

  const handleRefresh = async () => {
    if (refreshing) return
    setRefreshing(true)
    try {
      await Promise.all([fetchObjetivos(), fetchMovimientos()])
    } finally {
      setRefreshing(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!monto || parseFloat(monto) <= 0) {
      setError('El monto debe ser mayor a 0')
      return
    }
    if (!objetivoSeleccionado) {
      setError('Selecciona un objetivo')
      return
    }

    setSubmitting(true)
    try {
      const tipoTransaccion = tipoMovimiento === 'aporte' ? 'gasto' : 'ingreso'
      const descripcion = notas.trim() ? notas.trim() : null
      const objetivo = objetivos.find((obj) => obj.id === objetivoSeleccionado)

      const { error: insertError } = await supabase.from('transacciones').insert({
        tipo: tipoTransaccion,
        monto: parseFloat(monto),
        categoria: 'Ahorro/inversión',
        concepto: `${tipoMovimiento === 'aporte' ? 'Aporte' : 'Retiro'} · ${objetivo?.nombre ?? 'Objetivo'}`,
        descripcion,
        metodo_pago: 'Transferencia',
        registrado_por: session?.user.email || 'Sistema',
        fecha: new Date().toISOString(),
        usuario_id: session!.user.id,
        objetivo_id: objetivoSeleccionado,
      })

      if (insertError) throw insertError

      setSuccess('Movimiento guardado correctamente')
      setMonto('')
      setNotas('')
      fetchMovimientos()
    } catch (err: any) {
      setError(err.message || 'Error al guardar el movimiento')
    } finally {
      setSubmitting(false)
      setTimeout(() => setSuccess(''), 2500)
    }
  }

  const iniciarEdicionObjetivo = (objetivo: Objetivo) => {
    setEditingGoalId(objetivo.id)
    setNuevoNombre(objetivo.nombre)
    setNuevaMeta(objetivo.meta ? objetivo.meta.toFixed(2) : '')
    setNuevoColor(objetivo.color || '#0ea5e9')
    setGoalFeedback({ type: 'success', message: 'Editando objetivo existente' })
  }

  const cancelarEdicionObjetivo = () => {
    setEditingGoalId(null)
    setNuevoNombre('')
    setNuevaMeta('')
    setGoalFeedback(null)
  }

  const handleEliminarObjetivo = async (id: string) => {
    const confirmado = window.confirm('¿Eliminar este objetivo y sus movimientos asociados?')
    if (!confirmado) return
    setGoalFeedback(null)
    try {
      const { error: deleteError } = await supabase
        .from('objetivos_ahorro')
        .delete()
        .eq('id', id)
        .eq('usuario_id', session!.user.id)
      if (deleteError) throw deleteError
      if (objetivoSeleccionado === id) setObjetivoSeleccionado('')
      if (objetivoGrafica === id) setObjetivoGrafica('todos')
      setGoalFeedback({ type: 'success', message: 'Objetivo eliminado' })
      fetchObjetivos()
      fetchMovimientos()
    } catch (err: any) {
      setGoalFeedback({ type: 'error', message: err.message || 'Error al eliminar objetivo' })
    } finally {
      setTimeout(() => setGoalFeedback(null), 3000)
    }
  }

  const handleCrearObjetivo = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nuevoNombre.trim()) {
      setGoalFeedback({ type: 'error', message: 'El nombre del objetivo es obligatorio' })
      return
    }
    setCreatingGoal(true)
    setGoalFeedback(null)
    try {
      if (editingGoalId) {
        const { error: updateError } = await supabase
          .from('objetivos_ahorro')
          .update({
            nombre: nuevoNombre.trim(),
            meta: nuevaMeta ? parseFloat(nuevaMeta) : null,
            color: nuevoColor,
          })
          .eq('id', editingGoalId)
          .eq('usuario_id', session!.user.id)
        if (updateError) throw updateError
        setGoalFeedback({ type: 'success', message: 'Objetivo actualizado correctamente' })
        setEditingGoalId(null)
      } else {
        const { error: insertError } = await supabase.from('objetivos_ahorro').insert({
          nombre: nuevoNombre.trim(),
          meta: nuevaMeta ? parseFloat(nuevaMeta) : null,
          descripcion: '',
          color: nuevoColor,
          usuario_id: session!.user.id,
        })
        if (insertError) throw insertError
        setGoalFeedback({ type: 'success', message: 'Nuevo objetivo creado' })
      }
      setNuevoNombre('')
      setNuevaMeta('')
      fetchObjetivos()
    } catch (err: any) {
      setGoalFeedback({ type: 'error', message: err.message || 'Error al guardar el objetivo' })
    } finally {
      setCreatingGoal(false)
      setTimeout(() => setGoalFeedback(null), 3000)
    }
  }

  const formatCurrency = (value: number) =>
    value.toLocaleString('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('es-MX', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })

  const donutData = useMemo(() => {
    let labels = objetivos.map((obj) => obj.nombre)
    let data = objetivos.map((obj) => Math.max(resumenPorObjetivo[obj.id]?.balance || 0, 0))
    let colors = objetivos.map((obj) => obj.color || '#0ea5e9')
    if (labels.length === 0) {
      labels = ['Sin objetivos']
      data = [1]
      colors = ['#94a3b8']
    }
    return {
      labels,
      datasets: [
        {
          data,
          backgroundColor: colors,
          borderWidth: 1,
        },
      ],
    }
  }, [objetivos, resumenPorObjetivo])

  const lineData = useMemo(() => {
    const filteredMovs =
      objetivoGrafica === 'todos'
        ? movimientos
        : movimientos.filter((mov) => mov.objetivo_id === objetivoGrafica)
    const agrupado: Record<string, { aportes: number; retiros: number }> = {}

    filteredMovs.forEach((mov) => {
      const fecha = new Date(mov.fecha).toISOString().split('T')[0]
      if (!agrupado[fecha]) agrupado[fecha] = { aportes: 0, retiros: 0 }
      if (mov.tipo === 'gasto') {
        agrupado[fecha].aportes += Number(mov.monto || 0)
      } else {
        agrupado[fecha].retiros += Number(mov.monto || 0)
      }
    })

    const fechas = Object.keys(agrupado).sort()
    return {
      labels: fechas.map((f) => new Date(f).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })),
      datasets: [
        {
          label: 'Aportes',
          data: fechas.map((f) => agrupado[f].aportes),
          borderColor: '#10b981',
          backgroundColor: 'rgba(16, 185, 129, 0.2)',
          tension: 0.3,
        },
        {
          label: 'Retiros',
          data: fechas.map((f) => agrupado[f].retiros),
          borderColor: '#f87171',
          backgroundColor: 'rgba(248, 113, 113, 0.2)',
          tension: 0.3,
        },
      ],
    }
  }, [movimientos, objetivoGrafica])

  if (session === null) {
    return <main className="p-8 text-center text-[var(--muted)]">Redirigiendo al inicio de sesión...</main>
  }

  if (!session) {
    return <main className="p-8 text-center text-[var(--muted)]">Cargando sesión...</main>
  }

  return (
    <main className="max-w-6xl mx-auto px-4 space-y-10">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-emerald-500 to-cyan-400 bg-clip-text text-transparent">
            Ahorro e inversión
          </h1>
          <p className="text-[var(--muted)]">
            Controla cada objetivo de ahorro y entiende cómo evoluciona tu colchón financiero.
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[var(--card-border)] text-[var(--foreground)] hover:bg-[var(--muted-bg)] transition-colors disabled:opacity-60"
        >
          {refreshing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          {refreshing ? 'Actualizando…' : 'Actualizar'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[var(--card-bg)] rounded-2xl shadow-xl border border-[var(--card-border)] p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-[var(--muted)]">Total aportado</span>
            <PiggyBank className="w-5 h-5 text-emerald-400" />
          </div>
          <p className="text-3xl font-bold text-[var(--foreground)]">{formatCurrency(totalAportado)}</p>
          <p className="text-xs text-[var(--muted)] mt-1">Movimientos marcados como aportes</p>
        </div>

        <div className="bg-[var(--card-bg)] rounded-2xl shadow-xl border border-[var(--card-border)] p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-[var(--muted)]">Total retirado</span>
            <Wallet className="w-5 h-5 text-rose-400" />
          </div>
          <p className="text-3xl font-bold text-[var(--foreground)]">{formatCurrency(totalRetirado)}</p>
          <p className="text-xs text-[var(--muted)] mt-1">Retiros o movimientos inversos</p>
        </div>

        <div className="bg-[var(--card-bg)] rounded-2xl shadow-xl border border-[var(--card-border)] p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-[var(--muted)]">Balance acumulado</span>
            <TrendingUp className="w-5 h-5 text-blue-400" />
          </div>
          <p
            className={`text-3xl font-bold ${
              balance >= 0 ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {formatCurrency(balance)}
          </p>
          <p className="text-xs text-[var(--muted)] mt-1">Aportes − retiros</p>
        </div>
      </div>

      <section className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl shadow-xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-[var(--foreground)]">Metas y objetivos</h2>
            <p className="text-sm text-[var(--muted)]">{objetivos.length} objetivos activos</p>
          </div>
          {objetivos.length === 0 ? (
            <div className="text-center py-8 text-[var(--muted)]">
              Aún no tienes objetivos. Crea el primero para empezar.
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-4">
              {objetivos.map((objetivo) => {
                const resumen = resumenPorObjetivo[objetivo.id] || { aportes: 0, retiros: 0, balance: 0 }
                const meta = objetivo.meta || 0
                const avance = meta > 0 ? Math.min((resumen.balance / meta) * 100, 100) : 0
                return (
                  <div
                    key={objetivo.id}
                    className="rounded-2xl border border-[var(--card-border)] bg-gradient-to-br from-[var(--card-bg)] to-[var(--muted-bg)] p-4 shadow"
                  >
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div>
                        <h3 className="text-lg font-semibold text-[var(--foreground)]">{objetivo.nombre}</h3>
                        {objetivo.meta && (
                          <p className="text-xs text-[var(--muted)]">Meta: {formatCurrency(objetivo.meta)}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => iniciarEdicionObjetivo(objetivo)}
                          className="p-2 rounded-full border border-[var(--card-border)] hover:bg-[var(--muted-bg)]"
                          title="Editar objetivo"
                        >
                          <Edit3 className="w-4 h-4 text-[var(--foreground)]" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleEliminarObjetivo(objetivo.id)}
                          className="p-2 rounded-full border border-red-200/40 hover:bg-red-50/70 dark:border-red-500/40 dark:hover:bg-red-900/30"
                          title="Eliminar objetivo"
                        >
                          <Trash2 className="w-4 h-4 text-rose-500" />
                        </button>
                      </div>
                    </div>
                    <Target className="w-5 h-5 text-[var(--accent)] mb-2" />
                    <p className="text-2xl font-bold text-[var(--foreground)]">
                      {formatCurrency(resumen.balance)}
                    </p>
                    <p className="text-xs text-[var(--muted)] mb-2">
                      Aportes: {formatCurrency(resumen.aportes)} · Retiros: {formatCurrency(resumen.retiros)}
                    </p>
                    {objetivo.meta && (
                      <div>
                        <div className="h-2 bg-[var(--muted-bg)] rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full bg-[var(--accent)] transition-all"
                            style={{ width: `${avance}%` }}
                          />
                        </div>
                        <p className="text-xs text-[var(--muted)] mt-1">{avance.toFixed(1)}% completado</p>
                      </div>
                    )}
                    <button
                      className="mt-3 text-xs text-[var(--accent)] underline"
                      onClick={() => setObjetivoSeleccionado(objetivo.id)}
                    >
                      Registrar movimiento aquí
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl shadow-xl p-6">
          <h2 className="text-lg font-semibold text-[var(--foreground)] mb-3 flex items-center gap-2">
            <PlusCircle className="w-5 h-5 text-[var(--accent)]" />
            {editingGoalId ? 'Editar objetivo' : 'Nuevo objetivo'}
          </h2>
          <form onSubmit={handleCrearObjetivo} className="space-y-4">
            <div>
              <label className="block text-sm text-[var(--muted)] mb-1">Nombre *</label>
              <input
                value={nuevoNombre}
                onChange={(e) => setNuevoNombre(e.target.value)}
                className="w-full p-3 rounded-xl border border-[var(--card-border)] bg-transparent text-[var(--foreground)] focus:ring-2 focus:ring-[var(--accent)]"
                placeholder="Fondo de emergencia"
              />
            </div>
            <div>
              <label className="block text-sm text-[var(--muted)] mb-1">Meta (MXN)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={nuevaMeta}
                onChange={(e) => setNuevaMeta(e.target.value)}
                className="w-full p-3 rounded-xl border border-[var(--card-border)] bg-transparent text-[var(--foreground)] focus:ring-2 focus:ring-[var(--accent)]"
                placeholder="5000.00"
              />
            </div>
            <div>
              <label className="block text-sm text-[var(--muted)] mb-1">Color</label>
              <input
                type="color"
                value={nuevoColor}
                onChange={(e) => setNuevoColor(e.target.value)}
                className="h-10 w-full rounded-xl border border-[var(--card-border)] bg-transparent"
              />
            </div>
            {goalFeedback && (
              <div
                className={`p-3 rounded-xl text-sm ${
                  goalFeedback.type === 'success'
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-200'
                    : 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-200'
                }`}
              >
                {goalFeedback.message}
              </div>
            )}
            <button
              type="submit"
              disabled={creatingGoal}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-[var(--accent)] to-[#0ea5e9] text-white font-semibold hover:opacity-90 transition-all disabled:opacity-60"
            >
              {creatingGoal ? 'Guardando...' : editingGoalId ? 'Actualizar objetivo' : 'Guardar objetivo'}
            </button>
            {editingGoalId && (
              <button
                type="button"
                onClick={cancelarEdicionObjetivo}
                className="w-full py-2 rounded-xl border border-[var(--card-border)] text-[var(--foreground)] hover:bg-[var(--muted-bg)]"
              >
                Cancelar edición
              </button>
            )}
          </form>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl shadow-xl p-6">
          <h3 className="text-lg font-semibold text-[var(--foreground)] mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-[var(--accent)]" />
            Distribución actual
          </h3>
          {objetivos.length === 0 ? (
            <p className="text-sm text-[var(--muted)]">Crea objetivos para ver la distribución.</p>
          ) : (
            <Doughnut data={donutData} />
          )}
        </div>
        <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl shadow-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-[var(--foreground)]">Historial de movimientos</h3>
            <select
              value={objetivoGrafica}
              onChange={(e) => setObjetivoGrafica(e.target.value)}
              className="px-3 py-1.5 rounded-full border border-[var(--card-border)] bg-transparent text-sm text-[var(--foreground)]"
            >
              <option value="todos">Todos</option>
              {objetivos.map((objetivo) => (
                <option key={objetivo.id} value={objetivo.id}>
                  {objetivo.nombre}
                </option>
              ))}
            </select>
          </div>
          <Line data={lineData} />
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <form
          onSubmit={handleSubmit}
          className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl shadow-xl p-6 space-y-5"
        >
          <h2 className="text-xl font-semibold text-[var(--foreground)]">Registrar movimiento</h2>
          <div>
            <label className="block text-sm text-[var(--muted)] mb-2">Objetivo</label>
            <select
              value={objetivoSeleccionado}
              onChange={(e) => setObjetivoSeleccionado(e.target.value)}
              className="w-full p-3 rounded-xl border border-[var(--card-border)] bg-transparent text-[var(--foreground)]"
              required
            >
              <option value="">Selecciona objetivo</option>
              {objetivos.map((objetivo) => (
                <option key={objetivo.id} value={objetivo.id}>
                  {objetivo.nombre}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm text-[var(--muted)] mb-2">Tipo de movimiento</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setTipoMovimiento('aporte')}
                className={`flex items-center justify-center gap-2 py-3 rounded-xl border font-semibold transition-all ${
                  tipoMovimiento === 'aporte'
                    ? 'border-emerald-400 bg-emerald-50 text-emerald-700 dark:border-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-200 shadow'
                    : 'border-[var(--card-border)] text-[var(--muted)] hover:border-emerald-300'
                }`}
              >
                <ArrowUpCircle className="w-5 h-5" />
                Aporte
              </button>
              <button
                type="button"
                onClick={() => setTipoMovimiento('retiro')}
                className={`flex items-center justify-center gap-2 py-3 rounded-xl border font-semibold transition-all ${
                  tipoMovimiento === 'retiro'
                    ? 'border-rose-400 bg-rose-50 text-rose-700 dark:border-rose-600 dark:bg-rose-900/40 dark:text-rose-200 shadow'
                    : 'border-[var(--card-border)] text-[var(--muted)] hover:border-rose-300'
                }`}
              >
                <ArrowDownCircle className="w-5 h-5" />
                Retiro
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm text-[var(--muted)] mb-2">Monto (MXN)</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={monto}
              onChange={(e) => setMonto(e.target.value)}
              className="w-full p-3 rounded-xl border border-[var(--card-border)] bg-transparent text-[var(--foreground)] focus:ring-2 focus:ring-[var(--accent)]"
              placeholder="0.00"
              required
            />
          </div>
          <div>
            <label className="block text-sm text-[var(--muted)] mb-2">Notas (opcional)</label>
            <textarea
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              rows={3}
              className="w-full p-3 rounded-xl border border-[var(--card-border)] bg-transparent text-[var(--foreground)] focus:ring-2 focus:ring-[var(--accent)]"
              placeholder="Detalles adicionales..."
            />
          </div>
          {error && <div className="p-3 rounded-xl bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-200">{error}</div>}
          {success && (
            <div className="p-3 rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-200">
              {success}
            </div>
          )}
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-semibold hover:opacity-90 transition-all disabled:opacity-60"
          >
            {submitting ? 'Guardando...' : 'Guardar movimiento'}
          </button>
        </form>

        <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl shadow-xl p-6">
          <h2 className="text-xl font-semibold text-[var(--foreground)] mb-4">Últimos movimientos</h2>
          {loading ? (
            <div className="text-center py-8 text-[var(--muted)]">Cargando...</div>
          ) : movimientos.length === 0 ? (
            <div className="text-center py-8 text-[var(--muted)]">Aún no registras movimientos.</div>
          ) : (
            <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
              {movimientos.map((mov) => {
                const objetivo = objetivos.find((obj) => obj.id === mov.objetivo_id)
                return (
                  <div
                    key={mov.id}
                    className="p-4 rounded-2xl border border-[var(--card-border)] bg-[var(--muted-bg)]/40 flex items-center justify-between"
                  >
                    <div>
                      <p className="text-sm font-semibold text-[var(--foreground)]">
                        {mov.concepto || objetivo?.nombre || 'Movimiento'}
                      </p>
                      <p className="text-xs text-[var(--muted)]">{formatDate(mov.fecha)}</p>
                    </div>
                    <p
                      className={`text-lg font-bold ${
                        mov.tipo === 'gasto' ? 'text-emerald-500' : 'text-rose-400'
                      }`}
                    >
                      {mov.tipo === 'gasto' ? '+' : '-'}
                      {formatCurrency(Number(mov.monto || 0))}
                    </p>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </section>
    </main>
  )
}
