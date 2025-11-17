'use client'

import { useEffect, useState } from 'react'
import { useSupabaseClient, useSession } from '@supabase/auth-helpers-react'
import { Loader2, CheckCircle2, XCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'

const CATEGORIAS_GASTOS = [
  'Alimentación', 'Transporte', 'Vivienda', 'Salud',
  'Entretenimiento', 'Educación', 'Ahorro/inversión', 'Otros gastos'
]

const CATEGORIAS_INGRESOS = [
  'Salario', 'Ventas', 'Servicios', 'Inversiones', 'Otros ingresos'
]

const METODOS_PAGO = ['Efectivo', 'Tarjeta', 'Transferencia']

export default function RegistroPage() {
  const supabase = useSupabaseClient()
  const session = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const [tipo, setTipo] = useState<'gasto' | 'ingreso'>('gasto')
  const [monto, setMonto] = useState('')
  const [categoria, setCategoria] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [metodo_pago, setMetodoPago] = useState('Efectivo')
  const [registrado_por, setRegistradoPor] = useState('')
  const categoriasActuales = tipo === 'gasto' ? CATEGORIAS_GASTOS : CATEGORIAS_INGRESOS

  useEffect(() => {
    if (session === null) {
      router.push('/login')
    }
  }, [session, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!session) {
      setError('Debes iniciar sesión')
      return
    }
    setLoading(true)
    setError('')
    setSuccess(false)

    try {
      // Validaciones
      if (!monto || parseFloat(monto) <= 0) {
        throw new Error('El monto debe ser mayor a 0')
      }
      if (!categoria) {
        throw new Error('Debe seleccionar una categoría')
      }

      // Insertar transacción en BD
      const { error: insertError } = await supabase
        .from('transacciones')
        .insert({
          tipo,
          monto: parseFloat(monto),
          categoria,
          concepto: descripcion || `${tipo === 'gasto' ? 'Gasto' : 'Ingreso'} - ${categoria}`,
          descripcion: descripcion || null,
          metodo_pago,
          registrado_por,
          foto_url: null,
          fecha: new Date().toISOString(),
          usuario_id: session.user.id,
        })

      if (insertError) throw insertError

      setSuccess(true)

      // Limpiar formulario
      setMonto('')
      setCategoria('')
      setDescripcion('')
      // Reset success después de 3 segundos
      setTimeout(() => setSuccess(false), 3000)
    } catch (err: any) {
      setError(err.message || 'Error al registrar transacción')
    } finally {
      setLoading(false)
    }
  }

  if (session === null) {
    return (
      <main className="p-4 sm:p-6 md:p-8 max-w-3xl mx-auto text-center text-gray-600">
        Redirigiendo al inicio de sesión...
      </main>
    )
  }

  if (!session) {
    return (
      <main className="p-4 sm:p-6 md:p-8 max-w-3xl mx-auto text-center text-gray-600">
        Cargando sesión...
      </main>
    )
  }

  return (
    <main className="p-4 sm:p-6 md:p-8 max-w-3xl mx-auto">
      <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-6">
        Registrar transacción
      </h2>

      <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 space-y-6">
        {/* Tipo de transacción */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Tipo de transacción
          </label>
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => {
                setTipo('gasto')
                setCategoria('')
              }}
              className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all shadow-md hover:shadow-lg ${
                tipo === 'gasto'
                  ? 'bg-red-500 text-white ring-2 ring-red-600'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              Gasto
            </button>
            <button
              type="button"
              onClick={() => {
                setTipo('ingreso')
                setCategoria('')
              }}
              className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all shadow-md hover:shadow-lg ${
                tipo === 'ingreso'
                  ? 'bg-green-500 text-white ring-2 ring-green-600'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              Ingreso
            </button>
          </div>
        </div>

        {/* Monto */}
        <div>
          <label htmlFor="monto" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Monto (MXN) *
          </label>
          <input
            type="number"
            id="monto"
            value={monto}
            onChange={(e) => setMonto(e.target.value)}
            step="0.01"
            min="0"
            required
            className="w-full p-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
            placeholder="0.00"
          />
        </div>

        {/* Categoría */}
        <div>
          <label htmlFor="categoria" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Categoría *
          </label>
          <select
            id="categoria"
            value={categoria}
            onChange={(e) => setCategoria(e.target.value)}
            required
            className="w-full p-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
          >
            <option value="">Seleccionar categoría...</option>
            {categoriasActuales.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {/* Descripción */}
        <div>
          <label htmlFor="descripcion" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Descripción
          </label>
          <textarea
            id="descripcion"
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            rows={3}
            className="w-full p-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
            placeholder="Detalles adicionales..."
          />
        </div>

        {/* Método de pago */}
        <div>
          <label htmlFor="metodo_pago" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Método de pago
          </label>
          <select
            id="metodo_pago"
            value={metodo_pago}
            onChange={(e) => setMetodoPago(e.target.value)}
            className="w-full p-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
          >
            {METODOS_PAGO.map((metodo) => (
              <option key={metodo} value={metodo}>
                {metodo}
              </option>
            ))}
          </select>
        </div>

        {/* Registrado por */}
        <div>
          <label htmlFor="registrado_por" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Registrado por (opcional)
          </label>
          <input
            type="text"
            id="registrado_por"
            value={registrado_por}
            onChange={(e) => setRegistradoPor(e.target.value)}
            placeholder="Tu nombre o quién registra"
            className="w-full p-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        {/* Nota temporal */}
        <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-900/30 text-gray-700 dark:text-gray-300 text-sm">
          La carga de fotos de tickets/facturas está deshabilitada temporalmente.
        </div>

        {/* Success/Error messages */}
        {success && (
          <div className="flex items-center gap-2 p-4 bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-400 rounded-lg">
            <CheckCircle2 className="w-5 h-5" />
            <span>¡Transacción registrada exitosamente!</span>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 p-4 bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-400 rounded-lg">
            <XCircle className="w-5 h-5" />
            <span>{error}</span>
          </div>
        )}

        {/* Submit button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 px-6 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white rounded-lg font-semibold hover:from-emerald-600 hover:to-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Registrando...
            </>
          ) : (
            <>Registrar {tipo === 'gasto' ? 'gasto' : 'ingreso'}</>
          )}
        </button>
      </form>
    </main>
  )
}
