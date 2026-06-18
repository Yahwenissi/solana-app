'use client'

import type { TransactionIntent } from '../_lib/types'

const INTERVAL_LABELS: Record<string, string> = {
  daily: 'Every day',
  weekly: 'Every week',
  monthly: 'Every month',
}

export function DcaPreview({
  intent,
  onConfirm,
  onCancel,
  isSending,
}: {
  intent: TransactionIntent
  onConfirm: () => void
  onCancel: () => void
  isSending: boolean
}) {
  const totalAmount = intent.totalDeposits
    ? (intent.amount ?? 0) * intent.totalDeposits
    : null

  return (
    <div className="mt-4 glass-card rounded-xl p-5 border border-gray-200/80 animate-scale-in">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#9945FF]/10 text-[#9945FF]">
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <span className="text-sm font-semibold text-gray-900">Recurring Payment</span>
            <span className="ml-2 rounded-full bg-[#14F195]/10 border border-[#14F195]/20 px-2 py-0.5 text-xs font-medium text-[#14F195]">
              DCA Vault
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
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">Frequency</span>
          <span className="text-sm font-semibold text-gray-700">
            {INTERVAL_LABELS[intent.interval ?? ''] ?? intent.interval}
          </span>
        </div>
        {intent.totalDeposits && (
          <>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">Total Payments</span>
              <span className="text-sm font-semibold text-gray-700">{intent.totalDeposits}</span>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-gray-200">
              <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">Total Cost</span>
              <span className="text-sm font-bold text-[#9945FF]">{totalAmount?.toFixed(2)} {intent.token}</span>
            </div>
          </>
        )}
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
          onClick={onConfirm}
          disabled={isSending}
          className="btn-neon px-5 py-2 text-xs inline-flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {isSending ? (
            <span className="flex items-center gap-1.5">
              <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Creating vault...
            </span>
          ) : (
            <>
              Create Vault
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
