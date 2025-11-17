import { TrendingUp, TrendingDown, Wallet, Activity } from 'lucide-react'

interface KPICardProps {
  title: string
  value: number
  icon: 'income' | 'expense' | 'balance' | 'transactions'
  color: 'green' | 'red' | 'blue'
}

export function KPICard({ title, value, icon, color }: KPICardProps) {
  const colorClasses = {
    green: 'from-emerald-50 to-white dark:from-emerald-500/10 dark:to-transparent text-emerald-600',
    red: 'from-rose-50 to-white dark:from-rose-500/10 dark:to-transparent text-rose-600',
    blue: 'from-cyan-50 to-white dark:from-cyan-500/10 dark:to-transparent text-cyan-500',
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
      className="kpi-card relative overflow-hidden p-5 rounded-[var(--app-radius)] bg-white dark:bg-[#0c101d] border border-white/40 dark:border-white/10 shadow-xl shadow-black/5 dark:shadow-black/40 transition-all duration-300 hover:-translate-y-0.5"
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${colorClasses[color]} opacity-80 pointer-events-none`} />
      <div className="absolute inset-0 backdrop-blur-[1px] border border-white/40 dark:border-white/5 rounded-[var(--app-radius)] pointer-events-none" />

      <div className="relative flex items-center justify-between mb-4">
        <p className="text-sm font-semibold text-gray-600 dark:text-gray-300 tracking-wide">{title}</p>
        <div className="p-2 rounded-full bg-white/70 dark:bg-white/10 text-[var(--foreground)] shadow">
          <Icon className="w-5 h-5" />
        </div>
      </div>

      <p className="relative text-3xl sm:text-4xl font-bold break-all text-gray-900 dark:text-white">
        {displayValue}
      </p>
    </div>
  )
}
