import { TrendingUp, TrendingDown, Wallet, Activity } from 'lucide-react'

interface KPICardProps {
  title: string
  value: number
  icon: 'income' | 'expense' | 'balance' | 'transactions'
  color: 'green' | 'red' | 'blue'
}

export function KPICard({ title, value, icon, color }: KPICardProps) {
  const colorClasses = {
    green: 'text-emerald-600 dark:text-emerald-300',
    red: 'text-rose-600 dark:text-rose-300',
    blue: 'text-cyan-600 dark:text-cyan-300',
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
      className="kpi-card relative overflow-hidden p-5 rounded-[var(--app-radius)] bg-[var(--card-bg)] border border-[var(--card-border)] transition-colors"
    >
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-semibold text-gray-600 dark:text-gray-300 tracking-wide">{title}</p>
        <div className="p-2 rounded-full bg-[var(--accent-soft)] text-[var(--accent)]">
          <Icon className="w-5 h-5" />
        </div>
      </div>

      <p className={`text-3xl sm:text-4xl font-bold break-all ${colorClasses[color]}`}>
        {displayValue}
      </p>
    </div>
  )
}
