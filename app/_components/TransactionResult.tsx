'use client'

import type { TxResult } from '../_lib/types'

export function TransactionResult({
  result,
  amount,
  token,
  recipientName,
  resolvedAddress,
}: {
  result: TxResult
  amount: number
  token: string
  recipientName: string
  resolvedAddress: string | null
}) {
  const isSuccess = result.status === 'confirmed'
  const truncatedAddress = resolvedAddress
    ? `${resolvedAddress.slice(0, 4)}...${resolvedAddress.slice(-4)}`
    : null

  return (
    <div className={`mt-3 rounded-xl border p-4 shadow-lg animate-fade-in ${
      isSuccess
        ? 'border-gray-200 bg-gray-50'
        : 'border-red-500/20 bg-red-500/5'
    }`}>
      <div className="mb-3 flex items-center justify-between">
        <span className="text-lg font-bold text-gray-900">
          {amount} {token}
        </span>
        <span
          className={`rounded-full px-3 py-0.5 text-xs font-medium border ${
            isSuccess
              ? 'bg-green-500/10 text-green-400 border-green-500/30'
              : 'bg-red-500/10 text-red-400 border-red-500/30'
          }`}
        >
          {isSuccess ? 'Confirmed' : 'Failed'}
        </span>
      </div>

      <div className="mb-3 space-y-1.5 text-sm text-gray-600">
        <p>
          <span className="font-medium text-gray-700">To:</span> {recipientName}
        </p>
        {truncatedAddress && (
          <p className="font-mono text-xs text-gray-400">{truncatedAddress}</p>
        )}
        {!isSuccess && result.error && (
          <p className="mt-2 rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-300 leading-relaxed">
            {result.error}
          </p>
        )}
      </div>

      {result.signature && (
        <div className="flex items-center gap-2">
          <a
            href={`https://explorer.solana.com/tx/${result.signature}?cluster=devnet`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg bg-gray-50 px-3 py-1.5 text-xs font-medium text-gray-600 transition-all hover:bg-black/[0.05] hover:text-gray-800"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            View on Explorer
          </a>
          <button
            type="button"
            onClick={() => navigator.clipboard.writeText(result.signature)}
            className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 transition-all hover:bg-black/[0.05] hover:text-gray-800"
          >
            Copy TX
          </button>
        </div>
      )}
    </div>
  )
}
