import { TrendingUp, TrendingDown, Wallet, Activity } from 'lucide-react'

interface KPICardProps {
  title: string
  value: number
  icon: 'income' | 'expense' | 'balance' | 'transactions'
  color: 'green' | 'red' | 'blue'
}

export function KPICard({ title, value, icon, color }: KPICardProps) {
  const colorClasses = {
    green: 'border-emerald-200/80 dark:border-emerald-400/60',
    red: 'border-rose-200/80 dark:border-rose-400/60',
    blue: 'border-cyan-200/80 dark:border-cyan-400/60',
  }

  const iconComponents = {
    income: TrendingUp,
    expense: TrendingDown,
    balance: Wallet,
    transactions: Activity,
  }

  const Icon = iconComponents[icon]

  const displayValue =
    icon === 'transactions'
      ? value.toLocaleString('es-MX')
      : `$${value.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`

  return (
    <div
      className={`
        relative overflow-hidden
        p-6 rounded-3xl border
        bg-[var(--card-bg)]
        ${colorClasses[color]}
        shadow-xl shadow-black/5 dark:shadow-black/40
        transition-all duration-300 ease-out
        group cursor-default
      `}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white/80 via-transparent to-white/20 dark:from-white/10 dark:via-transparent dark:to-white/8 backdrop-blur-xl -z-10" />

      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-semibold opacity-80 tracking-wide uppercase">{title}</p>
        <div className="p-2 rounded-2xl bg-[var(--accent-soft)]/50 text-[var(--accent)] group-hover:scale-110 transition-transform duration-300">
          <Icon className="w-6 h-6" />
        </div>
      </div>

      <p className="text-3xl sm:text-4xl font-bold break-all text-[var(--foreground)]">
        {displayValue}
      </p>
    </div>
  )
}
