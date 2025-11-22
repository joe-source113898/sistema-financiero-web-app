'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { useSupabaseClient, useSession } from '@supabase/auth-helpers-react'
import { KPICard } from '@/components/KPICard'
import { DataViews } from '@/components/DataViews'
import { TrendingUp } from 'lucide-react'

const TrendChart = dynamic(() => import('@/components/TrendChart').then(mod => ({ default: mod.TrendChart })), {
  ssr: false,
  loading: () => <div className="text-center py-12 text-[var(--text-muted)]">Cargando gráfica...</div>,
})

type Vista = 'diaria' | 'semanal' | 'mensual' | 'personalizada'

export default function HomePage() {
  const supabase = useSupabaseClient()
  const session = useSession()
  const [vista, setVista] = useState<Vista>('mensual')
  const [fechaInicio, setFechaInicio] = useState('')
  const [fechaFin, setFechaFin] = useState('')
  const [kpis, setKpis] = useState({ ingresos: 0, gastos: 0, balance: 0, transacciones: 0 })
  const [rangoFechas, setRangoFechas] = useState({ inicio: '', fin: '' })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!session) return
    fetchKPIs()
  }, [vista, fechaInicio, fechaFin, session])

  const fetchKPIs = async () => {
    setLoading(true)
    let startDate: Date
    const endDate = new Date()

    switch (vista) {
      case 'diaria':
        startDate = new Date()
        startDate.setHours(0, 0, 0, 0)
        break
      case 'semanal':
        startDate = new Date()
        startDate.setDate(startDate.getDate() - 7)
        break
      case 'personalizada':
        if (!fechaInicio || !fechaFin) {
          setLoading(false)
          return
        }
        startDate = new Date(fechaInicio)
        endDate.setTime(new Date(fechaFin).getTime())
        break
      default:
        startDate = new Date()
        startDate.setDate(startDate.getDate() - 30)
    }

    setRangoFechas({
      inicio: startDate.toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' }),
      fin: endDate.toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' }),
    })

    const { data } = await supabase
      .from('transacciones')
      .select('*')
      .gte('fecha', startDate.toISOString())
      .lte('fecha', endDate.toISOString())
      .eq('usuario_id', session?.user.id)
      .is('objetivo_id', null)

    if (data) {
      let totalIngresos = 0
      let totalGastos = 0
      data.forEach(row => {
        const monto = parseFloat(row.monto || 0)
        if (row.tipo === 'ingreso') totalIngresos += monto
        if (row.tipo === 'gasto') totalGastos += monto
      })

      setKpis({
        ingresos: totalIngresos,
        gastos: totalGastos,
        balance: totalIngresos - totalGastos,
        transacciones: data.length,
      })
    }

    setLoading(false)
  }

  const aplicarFechasPersonalizadas = () => {
    if (fechaInicio && fechaFin) setVista('personalizada')
  }

  const getVistaLabel = () => {
    switch (vista) {
      case 'diaria':
        return 'Hoy'
      case 'semanal':
        return 'Últimos 7 días'
      case 'mensual':
        return 'Últimos 30 días'
      case 'personalizada':
        return `${fechaInicio} - ${fechaFin}`
      default:
        return 'Últimos 30 días'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-[var(--text-main)]">Cargando...</div>
      </div>
    )
  }

  if (!session) {
    return (
      <main className="p-8 text-center text-[var(--text-muted)]">
        Cargando sesión...
      </main>
    )
  }

  return (
    <main className="max-w-6xl mx-auto space-y-6 px-4">
      <section className="panel space-y-2">
        <p className="text-sm uppercase tracking-[0.2em] text-[var(--text-muted)]">Bienvenido</p>
        <h1 className="text-3xl sm:text-4xl font-black text-[var(--text-main)] leading-tight">
          Dashboard financiero
        </h1>
        <p className="text-[var(--text-muted)]">
          Vista general de tus finanzas · {getVistaLabel()}
        </p>
        {rangoFechas.inicio && rangoFechas.fin && (
          <p className="text-[var(--accent)] text-sm font-semibold">
            📊 Del {rangoFechas.inicio} al {rangoFechas.fin}
          </p>
        )}
        <div className="flex flex-wrap gap-2 mt-4">
          {(['diaria', 'semanal', 'mensual', 'personalizada'] as Vista[]).map(tipo => (
            <button
              key={tipo}
              onClick={() => setVista(tipo)}
              className={`px-4 py-2 rounded-full text-sm font-semibold border transition ${
                vista === tipo
                  ? 'bg-[var(--accent)] text-white border-transparent shadow'
                  : 'text-[var(--text-muted)] border-[var(--border-soft)] hover:text-[var(--text-main)]'
              }`}
            >
              {tipo === 'diaria' && 'Diaria'}
              {tipo === 'semanal' && 'Semanal'}
              {tipo === 'mensual' && 'Mensual'}
              {tipo === 'personalizada' && 'Personalizada'}
            </button>
          ))}
        </div>
        {vista === 'personalizada' && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
            <input
              type="date"
              value={fechaInicio}
              onChange={(e) => setFechaInicio(e.target.value)}
              className="rounded-2xl border border-[var(--border-soft)] p-3 bg-[var(--card-bg)] text-sm text-[var(--text-main)]"
            />
            <input
              type="date"
              value={fechaFin}
              onChange={(e) => setFechaFin(e.target.value)}
              className="rounded-2xl border border-[var(--border-soft)] p-3 bg-[var(--card-bg)] text-sm text-[var(--text-main)]"
            />
            <button
              onClick={aplicarFechasPersonalizadas}
              className="rounded-2xl bg-[var(--accent)] text-white font-semibold text-sm"
            >
              Aplicar rango
            </button>
          </div>
        )}
      </section>

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title="Ingresos (últimos 30 días)" value={kpis.ingresos} icon="income" color="green" />
        <KPICard title="Gastos (últimos 30 días)" value={kpis.gastos} icon="expense" color="red" />
        <KPICard title="Balance neto" value={kpis.balance} icon="balance" color="blue" />
        <KPICard title="Total de transacciones" value={kpis.transacciones} icon="transactions" color="blue" />
      </section>

      <section className="panel space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold flex items-center gap-2 text-[var(--text-main)]">
            <TrendingUp className="w-5 h-5 text-[var(--accent)]" />
            Tendencia de los últimos días
          </h3>
          <span className="text-sm text-[var(--text-muted)]">{kpis.transacciones} transacciones analizadas</span>
        </div>
        <div className="min-h-[280px]">
          <TrendChart vista={vista} />
        </div>
      </section>

      <section className="panel">
        <DataViews vista={vista} fechaInicio={fechaInicio} fechaFin={fechaFin} hideControls />
      </section>
    </main>
  )
}
