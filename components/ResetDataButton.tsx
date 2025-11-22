'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2 } from 'lucide-react'

type ResetButtonVariant = 'default' | 'card'

export function ResetDataButton({ variant = 'default' }: { variant?: ResetButtonVariant }) {
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

  const baseClasses = 'flex items-center gap-2 font-semibold transition-colors disabled:opacity-50'
  const variantClasses: Record<ResetButtonVariant, string> = {
    default:
      'px-3 py-2 rounded-full text-sm text-[var(--danger)] border border-[var(--danger)]/40 hover:bg-[var(--danger)]/10',
    card:
      'w-full justify-center rounded-2xl px-4 py-4 text-base text-red-600 dark:text-red-300 bg-red-50/80 dark:bg-red-950/30 border border-red-500/30 shadow-md shadow-red-900/10 hover:bg-red-100/95 dark:hover:bg-red-900/50',
  }

  return (
    <button
      onClick={handleReset}
      disabled={loading}
      className={`${baseClasses} ${variantClasses[variant]}`}
    >
      <Trash2 className="w-4 h-4" />
      {loading ? 'Reseteando...' : 'Resetear datos'}
    </button>
  )
}
