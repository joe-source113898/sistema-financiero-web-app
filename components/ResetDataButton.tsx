'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2 } from 'lucide-react'

export function ResetDataButton() {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleReset = async () => {
    if (loading) return
    const confirmed = window.confirm('¿Eliminar todas tus transacciones y datos? Esta acción no se puede deshacer.')
    if (!confirmed) return

    setLoading(true)
    try {
      const res = await fetch('/api/reset', {
        method: 'POST',
      })
      if (!res.ok) {
        const data = await res.json()
        alert(data.error || 'Error al limpiar los datos')
      } else {
        const currentUrl = window.location.pathname + window.location.search
        router.replace(currentUrl)
        router.refresh()
        alert('Datos eliminados correctamente')
        window.location.reload()
      }
    } catch (error) {
      console.error(error)
      alert('Error inesperado al limpiar datos')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleReset}
      disabled={loading}
      className="flex items-center gap-2 px-3 py-2 rounded-full text-sm font-semibold text-[var(--danger)] border border-[var(--danger)]/40 hover:bg-[var(--danger)]/10 transition-colors disabled:opacity-50"
    >
      <Trash2 className="w-4 h-4" />
      {loading ? 'Reseteando...' : 'Resetear datos'}
    </button>
  )
}
