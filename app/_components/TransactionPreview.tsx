'use client'

import type { TransactionIntent } from '../_lib/types'

export function TransactionPreview({
  intent,
  resolvedAddress,
  onConfirm,
  onCancel,
  onVoice,
  isSending,
  voicePlaying,
}: {
  intent: TransactionIntent
  resolvedAddress: string | null
  onConfirm: () => void
  onCancel: () => void
  onVoice: () => void
  isSending: boolean
  voicePlaying: boolean
}) {
  return (
    <div className="mt-4 glass-card rounded-xl p-5 border border-gray-200/80 animate-scale-in">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#9945FF]/10 text-[#9945FF]">
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <span className="text-sm font-semibold text-gray-900">Confirm Transaction</span>
            <span className="ml-2 rounded-full bg-[#14F195]/10 border border-[#14F195]/20 px-2 py-0.5 text-xs font-medium text-[#14F195]">
              Devnet
            </span>
          </div>
        </div>
      </div>

      <div className="mb-4 rounded-xl bg-gray-50/80 border border-gray-100 p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">Amount</span>
          <span className="text-lg font-bold text-gray-900">{intent.amount} {intent.token}</span>
        </div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">To</span>
          <span className="text-sm font-semibold text-gray-700">{intent.recipientName}</span>
        </div>
        {resolvedAddress && (
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">Address</span>
            <span className="text-xs font-mono text-gray-500 truncate ml-4 max-w-[180px]">
              {resolvedAddress.slice(0, 4)}...{resolvedAddress.slice(-4)}
            </span>
          </div>
        )}
        {!resolvedAddress && (
          <p className="text-xs text-amber-500/70 mt-1">Unknown contact — using name as address</p>
        )}
        {intent.memo && (
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-200">
            <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">Memo</span>
            <span className="text-sm text-gray-600">{intent.memo}</span>
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={onVoice}
          disabled={voicePlaying}
          className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white/50 px-3.5 py-2 text-xs font-medium text-gray-600 transition-all hover:bg-gray-50 hover:text-gray-800 hover:border-gray-300 disabled:opacity-40"
        >
          {voicePlaying ? (
            <>
              <span className="relative flex h-3 w-3">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#14F195] opacity-75" />
                <span className="relative inline-flex h-3 w-3 rounded-full bg-[#14F195]" />
              </span>
              Playing...
            </>
          ) : (
            <>
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
              </svg>
              Voice
            </>
          )}
        </button>

        <div className="flex-1" />

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
              Sending...
            </span>
          ) : (
            <>
              Confirm
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
