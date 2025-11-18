import { TrendingUp, TrendingDown, Wallet, Activity } from 'lucide-react'

interface KPICardProps {
  title: string
  value: number
  icon: 'income' | 'expense' | 'balance' | 'transactions'
  color: 'green' | 'red' | 'blue'
}

export function KPICard({ title, value, icon, color }: KPICardProps) {
  const colorTokens: Record<typeof color, { bg: string; text: string }> = {
    green: { bg: 'bg-[var(--kpi-income)]', text: 'text-emerald-600' },
    red: { bg: 'bg-[var(--kpi-expense)]', text: 'text-rose-600' },
    blue: { bg: 'bg-[var(--kpi-balance)]', text: 'text-cyan-700' },
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
      className={`kpi-card relative overflow-hidden p-5 rounded-[var(--app-radius)] border border-transparent ${colorTokens[color].bg}`}
    >
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-semibold text-gray-600 dark:text-gray-300 tracking-wide">{title}</p>
        <div className="p-2 rounded-full bg-[var(--accent-soft)] text-[var(--accent)]">
          <Icon className="w-5 h-5" />
        </div>
      </div>

      <p className={`text-3xl sm:text-4xl font-bold break-all ${colorTokens[color].text}`}>
        {displayValue}
      </p>
    </div>
  )
}
