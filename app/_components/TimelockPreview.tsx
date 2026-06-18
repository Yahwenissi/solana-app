'use client'

import { useState, useEffect } from 'react'
import type { TransactionIntent } from '../_lib/types'

function parseReleaseDate(dateStr: string): number {
  const now = Date.now()
  const lower = dateStr.toLowerCase()

  const days: Record<string, number> = {
    today: 0, tomorrow: 1,
    monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5, saturday: 6, sunday: 7,
  }

  if (lower.includes('next')) {
    for (const [day, offset] of Object.entries(days)) {
      if (lower.includes(day) && day !== 'today' && day !== 'tomorrow') {
        const nowDay = new Date().getDay()
        let add = (offset - nowDay + 7) % 7
        if (add <= 0) add += 7
        add += 7
        return Math.floor((now + add * 86400000) / 1000)
      }
    }
  }

  if (lower.includes('tomorrow')) {
    return Math.floor((now + 86400000) / 1000)
  }

  if (lower.includes('hour') || lower.includes('minute') || lower.includes('pm') || lower.includes('am')) {
    const timeMatch = lower.match(/(\d+)\s*(hour|minute|min)/)
    if (timeMatch) {
      const unit = timeMatch[2]
      const mult = unit === 'hour' ? 3600 : 60
      return Math.floor(now / 1000) + parseInt(timeMatch[1]) * mult
    }
    return Math.floor((now + 86400000) / 1000)
  }

  if (lower.includes('next week')) {
    return Math.floor((now + 7 * 86400000) / 1000)
  }

  if (lower.includes('next month')) {
    const d = new Date()
    d.setMonth(d.getMonth() + 1)
    return Math.floor(d.getTime() / 1000)
  }

  return Math.floor((now + 86400000) / 1000)
}

function formatReleaseTime(ts: number): string {
  const d = new Date(ts * 1000)
  return d.toLocaleString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric',
    hour: 'numeric', minute: '2-digit',
  })
}

export function TimelockPreview({
  intent,
  onConfirm,
  onCancel,
  isSending,
}: {
  intent: TransactionIntent
  onConfirm: (releaseTimestamp: number) => void
  onCancel: () => void
  isSending: boolean
}) {
  const [releaseTimestamp, setReleaseTimestamp] = useState<number>(0)

  useEffect(() => {
    if (intent.releaseDate) {
      setReleaseTimestamp(parseReleaseDate(intent.releaseDate))
    }
  }, [intent.releaseDate])

  return (
    <div className="mt-4 glass-card rounded-xl p-5 border border-gray-200/80 animate-scale-in">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#9945FF]/10 text-[#9945FF]">
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <span className="text-sm font-semibold text-gray-900">Timelocked Transfer</span>
            <span className="ml-2 rounded-full bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 text-xs font-medium text-amber-500">
              Release later
            </span>
          </div>
        </div>
      </div>

      <div className="mb-4 rounded-xl bg-gray-50/80 border border-gray-100 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">Amount</span>
          <span className="text-lg font-bold text-gray-900">{intent.amount} {intent.token}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">To</span>
          <span className="text-sm font-semibold text-gray-700">{intent.recipientName}</span>
        </div>
        <div className="flex items-center justify-between pt-2 border-t border-gray-200">
          <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">Release Date</span>
          <span className="text-sm font-semibold text-amber-600">
            {intent.releaseDate} {releaseTimestamp > 0 ? `(${formatReleaseTime(releaseTimestamp)})` : ''}
          </span>
        </div>
      </div>

      <div className="flex gap-2 justify-end">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSending}
          className="rounded-xl border border-gray-200 bg-white/50 px-4 py-2 text-xs font-medium text-gray-600 transition-all hover:bg-gray-50 hover:text-gray-800 disabled:opacity-40"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={() => onConfirm(releaseTimestamp)}
          disabled={isSending || releaseTimestamp === 0}
          className="btn-neon px-5 py-2 text-xs inline-flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {isSending ? (
            <span className="flex items-center gap-1.5">
              <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Creating timelock...
            </span>
          ) : (
            <>
              Create Timelock
              <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </>
          )}
        </button>
      </div>
    </div>
  )
}
