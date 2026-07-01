'use client'

import type { TimelockInfo } from '../_lib/types'

function formatTime(ts: number): string {
  const d = new Date(ts * 1000)
  const now = Date.now()
  const diff = d.getTime() - now
  if (diff <= 0) return 'Available now'
  if (diff < 3600000) return `${Math.round(diff / 60000)}m`
  if (diff < 86400000) return `${Math.round(diff / 3600000)}h`
  return `${Math.round(diff / 86400000)}d`
}

function formatDate(ts: number): string {
  return new Date(ts * 1000).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', hour: 'numeric',
  })
}

export function TimelockCard({
  timelock,
  onClaim,
  isClaiming,
}: {
  timelock: TimelockInfo
  onClaim: (address: string) => void
  isClaiming?: boolean
}) {
  // eslint-disable-next-line react-hooks/purity
  const now = Math.floor(Date.now() / 1000)
  const isReleased = now >= timelock.releaseTime && !timelock.claimed

  return (
    <div className="glass-card rounded-xl p-4 border border-gray-200/80 hover:border-amber-500/20 transition-all">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={`h-2 w-2 rounded-full ${timelock.claimed ? 'bg-gray-300' : isReleased ? 'bg-amber-500 animate-pulse' : 'bg-amber-300'}`} />
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            {timelock.claimed ? 'Claimed' : isReleased ? 'Available' : 'Locked'}
          </span>
        </div>
        <span className="text-xs text-gray-400 font-mono">
          {timelock.address.slice(0, 4)}...{timelock.address.slice(-4)}
        </span>
      </div>

      <div className="flex items-center justify-between mb-1">
        <span className="text-sm font-bold text-gray-900">
          {timelock.amount / 10 ** timelock.tokenDecimals} · {timelock.recipient.slice(0, 4)}...{timelock.recipient.slice(-4)}
        </span>
      </div>

      <div className="text-xs text-gray-500 mb-3">
        {timelock.claimed
          ? `Claimed on ${formatDate(timelock.releaseTime)}`
          : isReleased
            ? '🔔 Ready to claim'
            : `⏰ Releases ${formatDate(timelock.releaseTime)} (${formatTime(timelock.releaseTime)})`
        }
      </div>

      {!timelock.claimed && (
        <button
          type="button"
          onClick={() => onClaim(timelock.address)}
          disabled={!isReleased || isClaiming}
          className="w-full text-xs rounded-lg bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 font-medium text-amber-600 transition-all hover:bg-amber-500/20 disabled:opacity-30 disabled:cursor-not-allowed"
        >
          {isClaiming ? 'Claiming...' : 'Claim →'}
        </button>
      )}
    </div>
  )
}
