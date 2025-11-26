'use client'

import { useState, useEffect, useMemo } from 'react'
import { Calendar, TrendingUp, DollarSign } from 'lucide-react'

type Vista = 'diaria' | 'semanal' | 'mensual' | 'personalizada'

const CATEGORIAS_GASTOS = [
  'Alimentación',
  'Transporte',
  'Vivienda',
  'Salud',
  'Entretenimiento',
  'Educación',
  'Otros gastos',
]

const CATEGORIAS_INGRESOS = ['Salario', 'Ventas', 'Servicios', 'Inversiones', 'Otros ingresos']

const METODOS_PAGO = ['Efectivo', 'Tarjeta', 'Transferencia']

interface Transaccion {
  id: string
  fecha: string
  tipo: 'gasto' | 'ingreso'
  categoria: string
  monto: number
  descripcion: string | null
  metodo_pago: string | null
  concepto?: string
}

interface EditFormState {
  tipo: 'gasto' | 'ingreso'
  monto: string
  categoria: string
  descripcion: string
  metodo_pago: string
  fecha: string
}

interface DataViewsProps {
  vista?: Vista
  fechaInicio?: string
  fechaFin?: string
  hideControls?: boolean
}

export function DataViews({ vista: vistaProp, fechaInicio: fechaInicioProp, fechaFin: fechaFinProp, hideControls = false }: DataViewsProps = {}) {
  const [vista, setVista] = useState<Vista>(vistaProp || 'mensual')
  const [transacciones, setTransacciones] = useState<Transaccion[]>([])
  const [loading, setLoading] = useState(false)
  const [fechaInicio, setFechaInicio] = useState(fechaInicioProp || '')
  const [fechaFin, setFechaFin] = useState(fechaFinProp || '')
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [timeZone, setTimeZone] = useState('America/Mexico_City')
  const [editingTx, setEditingTx] = useState<Transaccion | null>(null)
  const [editForm, setEditForm] = useState<EditFormState>({
    tipo: 'gasto',
    monto: '',
    categoria: '',
    descripcion: '',
    metodo_pago: 'Efectivo',
    fecha: '',
  })
  const [savingEdit, setSavingEdit] = useState(false)
  const [editMessage, setEditMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Estados para filtros y sorting
  const [filtroTipo, setFiltroTipo] = useState<'todos' | 'gasto' | 'ingreso'>('todos')
  const [ordenColumna, setOrdenColumna] = useState<string | null>(null)
  const [ordenDireccion, setOrdenDireccion] = useState<'asc' | 'desc'>('desc')

  // Estados para paginación
  const [paginaActual, setPaginaActual] = useState(1)
  const [itemsPorPagina, setItemsPorPagina] = useState(20)

  useEffect(() => {
    if (vistaProp) setVista(vistaProp)
  }, [vistaProp])

  useEffect(() => {
    if (fechaInicioProp) setFechaInicio(fechaInicioProp)
  }, [fechaInicioProp])

  useEffect(() => {
    if (fechaFinProp) setFechaFin(fechaFinProp)
  }, [fechaFinProp])

  useEffect(() => {
    fetchData()
  }, [vista, fechaInicio, fechaFin])

  useEffect(() => {
    try {
      const detected = Intl.DateTimeFormat().resolvedOptions().timeZone
      if (detected) setTimeZone(detected)
    } catch (error) {
      setTimeZone('America/Mexico_City')
    }
  }, [])

  const parseDateValue = (value: string) => {
    if (!value) return null
    const trimmed = value.trim()
    const hasTimeZone = /([zZ]|[+-]\d{2}:?\d{2})$/.test(trimmed)
    const normalized = hasTimeZone ? trimmed : `${trimmed}Z`
    const date = new Date(normalized)
    if (Number.isNaN(date.getTime())) return null
    return date
  }

  const timeZoneLabel = useMemo(() => {
    try {
      const formatLabel = (timeZoneName: Intl.DateTimeFormatOptions['timeZoneName']) => {
        const formatter = new Intl.DateTimeFormat('es-MX', { timeZone, timeZoneName })
        const parts = formatter.formatToParts(new Date())
        return parts.find(part => part.type === 'timeZoneName')?.value
      }
      return formatLabel('longGeneric') || formatLabel('shortGeneric') || formatLabel('longOffset') || timeZone
    } catch (error) {
      return timeZone
    }
  }, [timeZone])

  const toDateTimeLocal = (value: string) => {
    const date = parseDateValue(value)
    if (!date) return ''
    const offset = date.getTimezoneOffset()
    const local = new Date(date.getTime() - offset * 60000)
    return local.toISOString().slice(0, 16)
  }

  const fromDateTimeLocal = (value: string) => {
    if (!value) return ''
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return ''
    return date.toISOString()
  }

  const formatDate = (value: string, options?: Intl.DateTimeFormatOptions) => {
    const target = parseDateValue(value)
    if (!target) return value || ''
    const defaultOptions: Intl.DateTimeFormatOptions = {
      dateStyle: 'medium',
      timeStyle: 'short',
    }
    const baseOptions: Intl.DateTimeFormatOptions = options ? { ...options } : defaultOptions
    return new Intl.DateTimeFormat('es-MX', { ...baseOptions, timeZone }).format(target)
  }

  const fetchData = async () => {
    setLoading(true)
    try {
      let url = `/api/transacciones?vista=${vista}`
      if (vista === 'personalizada' && fechaInicio && fechaFin) {
        url += `&fecha_inicio=${fechaInicio}&fecha_fin=${fechaFin}`
      }
      const res = await fetch(url)
      const json = await res.json()
      setTransacciones(json.data || [])
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const aplicarFechasPersonalizadas = () => {
    if (fechaInicio && fechaFin) {
      setVista('personalizada')
      setShowDatePicker(false)
    }
  }

  const openEditModal = (tx: Transaccion) => {
    setEditingTx(tx)
    setEditMessage(null)
    setEditForm({
      tipo: tx.tipo,
      monto: tx.monto.toString(),
      categoria: tx.categoria,
      descripcion: tx.descripcion || '',
      metodo_pago: tx.metodo_pago || 'Efectivo',
      fecha: toDateTimeLocal(tx.fecha),
    })
  }

  const closeEditModal = () => {
    setEditingTx(null)
    setEditMessage(null)
    setSavingEdit(false)
  }

  const handleEditChange = <K extends keyof EditFormState>(field: K, value: EditFormState[K]) => {
    setEditForm(prev => {
      const next = { ...prev, [field]: value }
      if (field === 'tipo') {
        const categorias = value === 'gasto' ? CATEGORIAS_GASTOS : CATEGORIAS_INGRESOS
        if (!categorias.includes(next.categoria)) {
          next.categoria = ''
        }
      }
      return next
    })
  }

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingTx) return

    const montoNumber = parseFloat(editForm.monto)
    if (!editForm.categoria) {
      setEditMessage({ type: 'error', text: 'Selecciona una categoría' })
      return
    }
    if (!editForm.fecha) {
      setEditMessage({ type: 'error', text: 'Selecciona fecha y hora' })
      return
    }
    if (Number.isNaN(montoNumber) || montoNumber <= 0) {
      setEditMessage({ type: 'error', text: 'El monto debe ser mayor a 0' })
      return
    }

    setSavingEdit(true)
    setEditMessage(null)

    try {
      const fechaISO = fromDateTimeLocal(editForm.fecha)
      if (!fechaISO) {
        throw new Error('Fecha u hora inválida')
      }

      const payload = {
        id: editingTx.id,
        tipo: editForm.tipo,
        monto: montoNumber,
        categoria: editForm.categoria,
        descripcion: editForm.descripcion.trim(),
        metodo_pago: editForm.metodo_pago,
        fecha: fechaISO,
      }

      const res = await fetch('/api/transacciones', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const json = await res.json()
      if (!res.ok) {
        throw new Error(json.error || 'No se pudo actualizar la transacción')
      }
      const updated: Transaccion = json.data
      setTransacciones(prev => {
        const next = prev.map(tx => (tx.id === updated.id ? updated : tx))
        return next.sort((a, b) => {
          const dateA = parseDateValue(a.fecha)?.getTime() || 0
          const dateB = parseDateValue(b.fecha)?.getTime() || 0
          return dateB - dateA
        })
      })
      setEditMessage({ type: 'success', text: 'Transacción actualizada correctamente' })
      setTimeout(() => {
        closeEditModal()
      }, 1000)
    } catch (error: any) {
      setEditMessage({ type: 'error', text: error.message || 'Error al actualizar la transacción' })
    } finally {
      setSavingEdit(false)
    }
  }

  // Calcular totales
  const totales = transacciones.reduce(
    (acc, t) => {
      if (t.tipo === 'ingreso') {
        acc.ingresos += t.monto
      } else {
        acc.gastos += t.monto
      }
      return acc
    },
    { ingresos: 0, gastos: 0 }
  )

  const balance = totales.ingresos - totales.gastos

  const categoriasEdicion = editForm.tipo === 'gasto' ? CATEGORIAS_GASTOS : CATEGORIAS_INGRESOS

  // Aplicar filtros y sorting
  const transaccionesFiltradas = transacciones
    .filter(t => filtroTipo === 'todos' || t.tipo === filtroTipo)
    .sort((a, b) => {
      if (!ordenColumna) return 0

      let valorA: any, valorB: any

      switch (ordenColumna) {
        case 'fecha':
          valorA = parseDateValue(a.fecha)?.getTime() || 0
          valorB = parseDateValue(b.fecha)?.getTime() || 0
          break
        case 'tipo':
          valorA = a.tipo
          valorB = b.tipo
          break
        case 'categoria':
          valorA = a.categoria
          valorB = b.categoria
          break
        case 'monto':
          valorA = a.monto
          valorB = b.monto
          break
        case 'metodo':
          valorA = a.metodo_pago
          valorB = b.metodo_pago
          break
        default:
          return 0
      }

      if (valorA < valorB) return ordenDireccion === 'asc' ? -1 : 1
      if (valorA > valorB) return ordenDireccion === 'asc' ? 1 : -1
      return 0
    })

  // Toggle sorting direction
  const toggleSort = (columna: string) => {
    if (ordenColumna === columna) {
      setOrdenDireccion(prev => prev === 'asc' ? 'desc' : 'asc')
    } else {
      setOrdenColumna(columna)
      setOrdenDireccion('asc')
    }
  }

  // Calcular paginación
  const indiceInicio = (paginaActual - 1) * itemsPorPagina
  const indiceFin = indiceInicio + itemsPorPagina
  const transaccionesPaginadas = transaccionesFiltradas.slice(indiceInicio, indiceFin)
  const totalPaginas = Math.ceil(transaccionesFiltradas.length / itemsPorPagina)

  // Reset página al cambiar filtros
  useEffect(() => {
    setPaginaActual(1)
  }, [filtroTipo, ordenColumna, ordenDireccion])

  // Agrupar por fecha según vista
  const agruparPorPeriodo = () => {
    const grupos: { [key: string]: Transaccion[] } = {}

    transaccionesPaginadas.forEach((t) => {
      const fecha = parseDateValue(t.fecha)
      if (!fecha) return
      let key = ''

      if (vista === 'diaria') {
        key = new Intl.DateTimeFormat('es-MX', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          timeZone,
        }).format(fecha)
      } else if (vista === 'semanal') {
        const weekNum = Math.ceil((fecha.getDate()) / 7)
        const label = new Intl.DateTimeFormat('es-MX', {
          month: 'long',
          year: 'numeric',
          timeZone,
        }).format(fecha)
        key = `${label} - Semana ${weekNum}`
      } else {
        key = new Intl.DateTimeFormat('es-MX', {
          month: 'long',
          year: 'numeric',
          timeZone,
        }).format(fecha)
      }

      if (!grupos[key]) grupos[key] = []
      grupos[key].push(t)
    })

    return Object.entries(grupos).sort((a, b) => b[0].localeCompare(a[0]))
  }

  const gruposData = agruparPorPeriodo()

  return (
    <div className="space-y-8">
      {/* Selector de Vista - Ocultar si hideControls es true */}
      {!hideControls && (
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
            📊 Vistas de datos
          </h3>
          <div className="flex gap-2 bg-[var(--card-bg)] p-1 rounded-full flex-wrap border border-[var(--card-border)]">
          <button
            onClick={() => setVista('diaria')}
            className={`px-4 py-2 rounded-full font-medium transition-all flex items-center gap-2 ${
              vista === 'diaria'
                ? 'bg-[var(--card-bg)] text-[var(--accent)] shadow-md'
                : 'text-[var(--muted)] hover:text-[var(--foreground)]'
            }`}
          >
            <Calendar className="w-4 h-4" />
            Diaria
          </button>
          <button
            onClick={() => setVista('semanal')}
            className={`px-4 py-2 rounded-full font-medium transition-all flex items-center gap-2 ${
              vista === 'semanal'
                ? 'bg-[var(--card-bg)] text-[var(--accent)] shadow-md'
                : 'text-[var(--muted)] hover:text-[var(--foreground)]'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            Semanal
          </button>
          <button
            onClick={() => setVista('mensual')}
            className={`px-4 py-2 rounded-full font-medium transition-all flex items-center gap-2 ${
              vista === 'mensual'
                ? 'bg-[var(--card-bg)] text-[var(--accent)] shadow-md'
                : 'text-[var(--muted)] hover:text-[var(--foreground)]'
            }`}
          >
            <DollarSign className="w-4 h-4" />
            Mensual
          </button>
          <button
            onClick={() => setShowDatePicker(!showDatePicker)}
            className={`px-4 py-2 rounded-full font-medium transition-all flex items-center gap-2 ${
              vista === 'personalizada'
                ? 'bg-[var(--card-bg)] text-[var(--accent)] shadow-md'
                : 'text-[var(--muted)] hover:text-[var(--foreground)]'
            }`}
          >
            <Calendar className="w-4 h-4" />
            Personalizada
          </button>
          </div>
        </div>
      )}

      {/* Selector de Fechas Personalizado */}
      {!hideControls && showDatePicker && (
        <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-xl p-6 border-2 border-blue-200 dark:border-blue-800">
          <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
            📅 Selecciona Periodo Personalizado
          </h4>
          <div className="flex flex-col sm:flex-row gap-4 items-end">
            <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Fecha de inicio
                </label>
              <input
                type="date"
                value={fechaInicio}
                onChange={(e) => setFechaInicio(e.target.value)}
                className="w-full p-3 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl text-[var(--foreground)] focus:ring-2 focus:ring-[var(--accent)]"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Fecha de fin
              </label>
              <input
                type="date"
                value={fechaFin}
                onChange={(e) => setFechaFin(e.target.value)}
                className="w-full p-3 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl text-[var(--foreground)] focus:ring-2 focus:ring-[var(--accent)]"
              />
            </div>
            <button
              onClick={aplicarFechasPersonalizadas}
              disabled={!fechaInicio || !fechaFin}
              className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white rounded-lg font-semibold hover:from-emerald-600 hover:to-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              Aplicar
            </button>
          </div>
        </div>
      )}

      {/* Filtros */}
      <div className="bg-[var(--card-bg)] rounded-2xl p-4 shadow-xl border border-[var(--card-border)]">
        <div className="flex flex-wrap gap-4 items-center">
          <span className="text-sm font-medium text-[var(--muted)]">Filtrar por tipo:</span>
          <div className="flex gap-2">
            <button
              onClick={() => setFiltroTipo('todos')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                filtroTipo === 'todos'
                  ? 'bg-[var(--accent)] text-white shadow-lg shadow-[var(--accent)]/30'
                  : 'bg-[var(--muted-bg)] text-[var(--muted)] hover:bg-[var(--accent-soft)] hover:text-[var(--accent)]'
              }`}
            >
              Todos
            </button>
            <button
              onClick={() => setFiltroTipo('ingreso')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                filtroTipo === 'ingreso'
                  ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30'
                  : 'bg-[var(--muted-bg)] text-[var(--muted)] hover:bg-[var(--accent-soft)] hover:text-[var(--accent)]'
              }`}
            >
              Ingresos
            </button>
            <button
              onClick={() => setFiltroTipo('gasto')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                filtroTipo === 'gasto'
                  ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/30'
                  : 'bg-[var(--muted-bg)] text-[var(--muted)] hover:bg-[var(--accent-soft)] hover:text-[var(--accent)]'
              }`}
            >
              Gastos
            </button>
          </div>
          <div className="ml-auto text-sm text-[var(--muted)]">
            {transaccionesFiltradas.length} transacciones
          </div>
        </div>
        <div className="mt-4 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between text-xs text-[var(--muted)]">
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-[var(--muted-bg)] text-[var(--foreground)]/70">
            Zona horaria detectada: <strong className="font-semibold text-[var(--foreground)]">{timeZoneLabel}</strong>
          </span>
          <span>Las fechas y horas se ajustan automáticamente a la configuración de tu dispositivo.</span>
        </div>
      </div>

      {/* Resumen de Totales */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[var(--card-bg)] p-6 rounded-2xl border border-[var(--card-border)] shadow-soft">
          <div className="text-sm text-[var(--success)] mb-1">Total de ingresos</div>
          <div className="text-2xl font-bold text-[var(--text-main)]">
            ${totales.ingresos.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
          </div>
        </div>

        <div className="bg-[var(--card-bg)] p-6 rounded-2xl border border-[var(--card-border)] shadow-soft">
          <div className="text-sm text-[var(--danger)] mb-1">Total de gastos</div>
          <div className="text-2xl font-bold text-[var(--text-main)]">
            ${totales.gastos.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
          </div>
        </div>

        <div className="bg-[var(--card-bg)] p-6 rounded-2xl border border-[var(--card-border)] shadow-soft">
          <div className="text-sm mb-1 text-[var(--accent)]">
            Balance neto
          </div>
          <div className="text-2xl font-bold text-[var(--text-main)]">
            ${balance.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
          </div>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Cargando datos...</p>
        </div>
      )}

      {/* Tablas agrupadas */}
      {!loading && gruposData.length === 0 && (
        <div className="text-center py-12 bg-[var(--muted-bg)] rounded-2xl border border-[var(--card-border)]">
          <p className="text-[var(--muted)]">No hay transacciones en este período</p>
        </div>
      )}

      {!loading && gruposData.map(([periodo, txs]) => {
        const totalPeriodo = txs.reduce((sum, t) => sum + (t.tipo === 'ingreso' ? t.monto : -t.monto), 0)

        return (
          <div key={periodo} className="bg-[var(--card-bg)] rounded-2xl shadow-[0_20px_45px_rgba(15,23,42,0.06)] border border-[var(--card-border)] overflow-hidden">
            <div className="px-6 py-4 bg-[var(--accent-soft)] border-b border-[var(--card-border)]">
              <div className="flex justify-between items-center">
                <h4 className="text-lg font-bold text-[var(--foreground)] dark:text-white">{periodo}</h4>
                <span className={`font-bold ${totalPeriodo >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                  ${totalPeriodo.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    <th
                      onClick={() => toggleSort('fecha')}
                      className="px-6 py-3 text-left text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider cursor-pointer"
                    >
                      <div className="flex items-center gap-1">
                        Fecha/Hora
                        {ordenColumna === 'fecha' && (
                          <span className="text-emerald-500">{ordenDireccion === 'asc' ? '↑' : '↓'}</span>
                        )}
                      </div>
                    </th>
                    <th
                      onClick={() => toggleSort('tipo')}
                      className="px-6 py-3 text-left text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider cursor-pointer"
                    >
                      <div className="flex items-center gap-1">
                        Tipo
                        {ordenColumna === 'tipo' && (
                          <span className="text-emerald-500">{ordenDireccion === 'asc' ? '↑' : '↓'}</span>
                        )}
                      </div>
                    </th>
                    <th
                      onClick={() => toggleSort('categoria')}
                      className="px-6 py-3 text-left text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider cursor-pointer"
                    >
                      <div className="flex items-center gap-1">
                        Categoría
                        {ordenColumna === 'categoria' && (
                          <span className="text-emerald-500">{ordenDireccion === 'asc' ? '↑' : '↓'}</span>
                        )}
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">
                      Descripción
                    </th>
                    <th
                      onClick={() => toggleSort('metodo')}
                      className="px-6 py-3 text-left text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider cursor-pointer"
                    >
                      <div className="flex items-center gap-1">
                        Método
                        {ordenColumna === 'metodo' && (
                          <span className="text-emerald-500">{ordenDireccion === 'asc' ? '↑' : '↓'}</span>
                        )}
                      </div>
                    </th>
                    <th
                      onClick={() => toggleSort('monto')}
                      className="px-6 py-3 text-right text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider cursor-pointer"
                    >
                      <div className="flex items-center justify-end gap-1">
                        Monto
                        {ordenColumna === 'monto' && (
                          <span className="text-emerald-500">{ordenDireccion === 'asc' ? '↑' : '↓'}</span>
                        )}
                      </div>
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-soft)]">
                  {txs.map((tx) => (
                    <tr
                      key={tx.id}
                      className={`transition-colors ${
                        tx.tipo === 'ingreso'
                          ? 'bg-[var(--accent-soft)]'
                          : 'bg-[var(--surface-muted)]'
                      }`}
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--text-main)]">
                        <div className="flex flex-col">
                          <span>
                            {formatDate(tx.fecha, {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                          <span className="text-xs text-[var(--muted)]">{timeZoneLabel}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-3 py-1 text-xs font-bold rounded-full ${
                            tx.tipo === 'ingreso'
                              ? 'bg-green-500 text-white dark:bg-green-600'
                              : 'bg-red-500 text-white dark:bg-red-600'
                          }`}
                        >
                          {tx.tipo === 'ingreso' ? 'Ingreso' : 'Gasto'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-[var(--text-main)]">
                        {tx.categoria}
                      </td>
                      <td className="px-6 py-4 text-sm text-[var(--text-main)] max-w-xs truncate">
                        {tx.descripcion || '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-[var(--text-main)] capitalize">
                        {tx.metodo_pago || '-'}
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm font-semibold text-right ${
                        tx.tipo === 'ingreso'
                          ? 'text-green-600 dark:text-green-400'
                          : 'text-red-600 dark:text-red-400'
                      }`}>
                        {tx.tipo === 'ingreso' ? '+' : '-'}${tx.monto.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => openEditModal(tx)}
                          className="inline-flex items-center gap-2 rounded-full border border-[var(--card-border)] px-4 py-1.5 text-sm font-semibold text-[var(--foreground)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors"
                        >
                          ✏️ Editar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      })}

      {/* Controles de Paginación */}
      <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 px-4 py-3 bg-[var(--card-bg)] rounded-2xl border border-[var(--card-border)] shadow-sm">
        {/* Info de registros */}
        <div className="text-sm text-[var(--muted)]">
          Mostrando{' '}
          <span className="font-semibold text-[var(--foreground)]">
            {transaccionesFiltradas.length === 0 ? 0 : indiceInicio + 1}
          </span>
          {' '}-{' '}
          <span className="font-semibold text-[var(--foreground)]">
            {Math.min(indiceFin, transaccionesFiltradas.length)}
          </span>
          {' '}de{' '}
          <span className="font-semibold text-[var(--foreground)]">
            {transaccionesFiltradas.length}
          </span>
          {' '}transacciones
        </div>

        {/* Controles de navegación */}
        <div className="flex flex-wrap items-center gap-4">
          {/* Items por página */}
          <div className="flex items-center gap-2 order-1">
            <label htmlFor="itemsPorPagina" className="text-sm text-[var(--muted)]">
              Por página:
            </label>
            <select
              id="itemsPorPagina"
              name="itemsPorPagina"
              value={itemsPorPagina}
              onChange={(e) => {
                setItemsPorPagina(Number(e.target.value))
                setPaginaActual(1)
              }}
              className="px-3 py-1.5 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl text-sm text-[var(--foreground)] focus:ring-2 focus:ring-[var(--accent)]"
            >
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
              <option value={500}>500</option>
            </select>
          </div>

          {/* Texto página */}
          <span className="order-2 flex-1 text-center text-sm text-[var(--muted)]">
            Página{' '}
            <span className="font-semibold text-[var(--foreground)]">
              {paginaActual}
            </span>
            {' '}de{' '}
            <span className="font-semibold text-[var(--foreground)]">
              {totalPaginas || 1}
            </span>
          </span>

          {/* Botones de navegación */}
          <div className="order-3 flex items-center gap-2 w-full justify-end sm:w-auto">
            <button
              onClick={() => setPaginaActual(prev => Math.max(1, prev - 1))}
              disabled={paginaActual === 1}
              className="px-3 py-1.5 bg-[var(--muted-bg)] border border-[var(--card-border)] rounded-full text-sm font-medium text-[var(--muted)] hover:bg-[var(--accent-soft)] hover:text-[var(--accent)] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              Anterior
            </button>

            <button
              onClick={() => setPaginaActual(prev => Math.min(totalPaginas, prev + 1))}
              disabled={paginaActual >= totalPaginas}
              className="px-3 py-1.5 bg-[var(--muted-bg)] border border-[var(--card-border)] rounded-full text-sm font-medium text-[var(--muted)] hover:bg-[var(--accent-soft)] hover:text-[var(--accent)] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              Siguiente
            </button>
          </div>
        </div>
      </div>

      {editingTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={closeEditModal} />
          <form
            onSubmit={handleEditSubmit}
            className="relative z-10 w-full max-w-2xl sm:max-w-lg rounded-3xl bg-[var(--card-bg)] border border-[var(--card-border)] p-4 sm:p-6 shadow-[0_25px_65px_rgba(15,23,42,0.65)] space-y-5 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-xl font-bold text-[var(--foreground)]">Editar transacción</h3>
                <p className="text-sm text-[var(--muted)]">
                  Ajusta los datos y guarda los cambios. Las fechas se guardan en tu zona horaria.
                </p>
              </div>
              <button
                type="button"
                onClick={closeEditModal}
                className="rounded-full p-2 text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--muted-bg)]"
                aria-label="Cerrar"
              >
                ✕
              </button>
            </div>

            <div className="bg-[var(--muted-bg)] rounded-2xl p-4 text-xs text-[var(--muted)]">
              Zona horaria detectada: <span className="font-semibold text-[var(--foreground)]">{timeZoneLabel}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="flex flex-col gap-2 text-sm font-medium text-[var(--foreground)]">
                Tipo
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleEditChange('tipo', 'gasto')}
                    className={`flex-1 rounded-xl py-2 font-semibold ${
                      editForm.tipo === 'gasto'
                        ? 'bg-red-500 text-white'
                        : 'bg-[var(--muted-bg)] text-[var(--muted)]'
                    }`}
                  >
                    Gasto
                  </button>
                  <button
                    type="button"
                    onClick={() => handleEditChange('tipo', 'ingreso')}
                    className={`flex-1 rounded-xl py-2 font-semibold ${
                      editForm.tipo === 'ingreso'
                        ? 'bg-emerald-500 text-white'
                        : 'bg-[var(--muted-bg)] text-[var(--muted)]'
                    }`}
                  >
                    Ingreso
                  </button>
                </div>
              </label>
              <label className="flex flex-col gap-2 text-sm font-medium text-[var(--foreground)]">
                Monto (MXN)
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={editForm.monto}
                  onChange={(e) => handleEditChange('monto', e.target.value)}
                  className="rounded-xl border border-[var(--card-border)] bg-transparent px-3 py-2 text-[var(--foreground)]"
                  required
                />
              </label>
            </div>

            <label className="flex flex-col gap-2 text-sm font-medium text-[var(--foreground)]">
              Categoría
              <select
                value={editForm.categoria}
                onChange={(e) => handleEditChange('categoria', e.target.value)}
                className="rounded-xl border border-[var(--card-border)] bg-transparent px-3 py-2 text-[var(--foreground)]"
                required
              >
                <option value="">Selecciona...</option>
                {categoriasEdicion.map((categoria) => (
                  <option key={categoria} value={categoria}>
                    {categoria}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-2 text-sm font-medium text-[var(--foreground)]">
              Descripción (opcional)
              <input
                type="text"
                value={editForm.descripcion}
                onChange={(e) => handleEditChange('descripcion', e.target.value)}
                placeholder="Descripción visible en reportes"
                className="rounded-xl border border-[var(--card-border)] bg-transparent px-3 py-2 text-[var(--foreground)]"
              />
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="flex flex-col gap-2 text-sm font-medium text-[var(--foreground)]">
                Método de pago
                <select
                  value={editForm.metodo_pago}
                  onChange={(e) => handleEditChange('metodo_pago', e.target.value)}
                  className="rounded-xl border border-[var(--card-border)] bg-transparent px-3 py-2 text-[var(--foreground)]"
                >
                  {METODOS_PAGO.map((metodo) => (
                    <option key={metodo} value={metodo}>
                      {metodo}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-2 text-sm font-medium text-[var(--foreground)]">
                Fecha y hora
                <input
                  type="datetime-local"
                  value={editForm.fecha}
                  onChange={(e) => handleEditChange('fecha', e.target.value)}
                  className="rounded-xl border border-[var(--card-border)] bg-transparent px-3 py-2 text-[var(--foreground)]"
                  required
                />
                {editForm.fecha && (
                  <span className="text-xs text-[var(--muted)]">
                    Se guardará como{' '}
                    <strong className="font-semibold text-[var(--foreground)]">
                      {formatDate(fromDateTimeLocal(editForm.fecha), {
                        dateStyle: 'long',
                        timeStyle: 'short',
                      })}
                    </strong>{' '}
                    ({timeZoneLabel})
                  </span>
                )}
              </label>
            </div>

            {editMessage && (
              <div
                className={`rounded-2xl px-4 py-3 text-sm ${
                  editMessage.type === 'success'
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                    : 'bg-red-500/10 text-red-300 border border-red-500/30'
                }`}
              >
                {editMessage.text}
              </div>
            )}

            <div className="flex flex-col sm:flex-row justify-end gap-3">
              <button
                type="button"
                onClick={closeEditModal}
                className="rounded-full border border-[var(--card-border)] px-5 py-2 font-semibold text-[var(--muted)] hover:text-[var(--foreground)] hover:border-[var(--accent)]"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={savingEdit}
                className="rounded-full bg-[var(--accent)] px-5 py-2 font-semibold text-white shadow-lg shadow-[var(--accent)]/40 disabled:opacity-70"
              >
                {savingEdit ? 'Guardando...' : 'Guardar cambios'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
