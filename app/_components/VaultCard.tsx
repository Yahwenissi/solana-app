'use client'

import type { DcaVaultInfo } from '../_lib/types'

const INTERVAL_NAMES: Record<number, string> = {
  86400: 'Daily',
  604800: 'Weekly',
  2592000: 'Monthly',
}

function formatTime(ts: number): string {
  const d = new Date(ts * 1000)
  const now = Date.now()
  const diff = d.getTime() - now
  if (diff < 0) return 'Due now'
  if (diff < 3600000) return `${Math.round(diff / 60000)}m`
  if (diff < 86400000) return `${Math.round(diff / 3600000)}h`
  return `${Math.round(diff / 86400000)}d`
}

export function VaultCard({
  vault,
  onExecute,
  onClose,
  isExecuting,
}: {
  vault: DcaVaultInfo
  onExecute: (address: string) => void
  onClose: (address: string) => void
  isExecuting?: boolean
}) {
  // eslint-disable-next-line react-hooks/purity
  const now = Math.floor(Date.now() / 1000)
  const isDue = now >= vault.nextExecution
  const progress = vault.totalDeposited > 0
    ? Math.min((vault.totalExecuted / vault.totalDeposited) * 100, 100)
    : 0

  return (
    <div className="glass-card rounded-xl p-4 border border-gray-200/80 hover:border-[#9945FF]/20 transition-all">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={`h-2 w-2 rounded-full ${isDue ? 'bg-[#14F195] animate-pulse' : 'bg-gray-300'}`} />
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            {INTERVAL_NAMES[vault.intervalSeconds] ?? `${vault.intervalSeconds}s`}
          </span>
        </div>
        <span className="text-xs text-gray-400 font-mono">
          {vault.address.slice(0, 4)}...{vault.address.slice(-4)}
        </span>
      </div>

      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-bold text-gray-900">
          {vault.amountPerInterval / 10 ** vault.tokenDecimals} · {vault.recipient.slice(0, 4)}...{vault.recipient.slice(-4)}
        </span>
        <span className="text-xs text-gray-500">
          {isDue ? '🔔 Due' : `⏰ ${formatTime(vault.nextExecution)}`}
        </span>
      </div>

      <div className="w-full bg-gray-100 rounded-full h-1.5 mb-3">
        <div
          className="bg-gradient-to-r from-[#9945FF] to-[#14F195] h-1.5 rounded-full transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="flex items-center justify-between text-xs text-gray-400 mb-3">
        <span>{(vault.totalExecuted / 10 ** vault.tokenDecimals).toFixed(vault.tokenDecimals <= 6 ? 2 : 4)} executed</span>
        <span>{(vault.totalDeposited / 10 ** vault.tokenDecimals).toFixed(vault.tokenDecimals <= 6 ? 2 : 4)} total</span>
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => onExecute(vault.address)}
          disabled={!isDue || isExecuting}
          className="flex-1 text-xs rounded-lg bg-[#9945FF]/10 border border-[#9945FF]/20 px-3 py-1.5 font-medium text-[#9945FF] transition-all hover:bg-[#9945FF]/20 disabled:opacity-30 disabled:cursor-not-allowed"
        >
          {isExecuting ? 'Executing...' : 'Execute ↻'}
        </button>
        <button
          type="button"
          onClick={() => onClose(vault.address)}
          className="text-xs rounded-lg border border-gray-200 px-3 py-1.5 font-medium text-gray-500 transition-all hover:bg-gray-50 hover:text-gray-700"
        >
          Close
        </button>
      </div>
    </div>
  )
}
