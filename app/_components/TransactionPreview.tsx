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
    <div className="mt-3 rounded-xl border border-gray-200 bg-gray-50 p-4 shadow-lg animate-fade-in">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-base font-semibold text-gray-900">
          Confirm Transaction?
        </span>
        <span className="rounded-full bg-gradient-to-r from-purple-500/20 to-teal-500/20 px-3 py-0.5 text-xs font-medium text-solana-teal border border-teal-500/20">
          Devnet
        </span>
      </div>

      <p className="mb-3 text-sm text-gray-700">
        Send <span className="font-semibold text-gray-900">{intent.amount} {intent.token}</span> to{' '}
        <span className="font-semibold text-gray-900">{intent.recipientName}</span>?
      </p>

      <div className="mb-4 space-y-1.5 text-sm text-gray-600">
        {resolvedAddress && (
          <p className="truncate font-mono text-xs text-gray-400">
            {resolvedAddress}
          </p>
        )}
        {!resolvedAddress && (
          <p className="text-xs text-amber-400/80">Unknown contact — using name as address</p>
        )}
        {intent.memo && (
          <p>
            <span className="font-medium text-gray-700">Memo:</span> {intent.memo}
          </p>
        )}
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={onVoice}
          disabled={voicePlaying}
          className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 transition-all duration-200 hover:bg-gray-50 hover:text-gray-800 disabled:opacity-40"
        >
          {voicePlaying ? (
            <>
              <span className="relative flex h-3 w-3">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-solana-teal opacity-75" />
                <span className="relative inline-flex h-3 w-3 rounded-full bg-solana-teal" />
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
          className="rounded-lg border border-gray-200 px-4 py-1.5 text-xs font-medium text-gray-600 transition-all duration-200 hover:bg-gray-50 hover:text-gray-800 disabled:opacity-40"
        >
          No ✗
        </button>

        <button
          type="button"
          onClick={onConfirm}
          disabled={isSending}
          className="rounded-lg bg-gradient-to-r from-[#9945FF] to-[#7C3AED] px-4 py-1.5 text-xs font-medium text-white transition-all duration-200 hover:shadow-lg hover:shadow-purple-500/30 hover:scale-105 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:shadow-none disabled:hover:scale-100"
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
            'Yes ✓'
          )}
        </button>
      </div>
    </div>
  )
}
