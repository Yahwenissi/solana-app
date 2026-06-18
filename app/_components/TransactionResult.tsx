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

  const isSwap = !!result.swapDetails

  return (
    <div className={`glass-card rounded-2xl p-5 animate-scale-in ${
      isSuccess
        ? 'border-gray-200/80'
        : 'border-red-500/20 bg-red-500/5'
    }`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${
            isSuccess ? 'bg-[#14F195]/10 text-[#14F195]' : 'bg-red-50 text-red-500'
          }`}>
            {isSuccess ? (
              <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            )}
          </div>
          <span className={`text-base font-bold ${
            isSuccess ? 'text-gray-900' : 'text-red-600'
          }`}>
            {isSwap && result.swapDetails
              ? `${result.swapDetails.inputAmount} ${result.swapDetails.inputToken} → ${result.swapDetails.outputAmount.toFixed(6)} ${result.swapDetails.outputToken}`
              : `${amount} ${token}`
            }
          </span>
        </div>
        <span
          className={`rounded-full px-3 py-0.5 text-xs font-semibold border ${
            isSuccess
              ? 'bg-[#14F195]/10 text-[#14F195] border-[#14F195]/20'
              : 'bg-red-500/10 text-red-500 border-red-500/20'
          }`}
        >
          {isSuccess ? 'Confirmed' : 'Failed'}
        </span>
      </div>

      <div className="mb-4 rounded-xl bg-gray-50/80 border border-gray-100 p-4 space-y-2">
        {isSwap && result.swapDetails ? (
          <>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">You Paid</span>
              <span className="text-sm font-semibold text-gray-700">{result.swapDetails.inputAmount} {result.swapDetails.inputToken}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">You Received</span>
              <span className="text-sm font-semibold text-gray-700">{result.swapDetails.outputAmount.toFixed(6)} {result.swapDetails.outputToken}</span>
            </div>
            {result.swapDetails.route && (
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">Route</span>
                <span className="text-xs text-gray-500 truncate max-w-[180px]">{result.swapDetails.route}</span>
              </div>
            )}
          </>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">To</span>
              <span className="text-sm font-semibold text-gray-700">{recipientName}</span>
            </div>
            {truncatedAddress && (
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">Address</span>
                <span className="text-xs font-mono text-gray-500">{truncatedAddress}</span>
              </div>
            )}
          </>
        )}
        {!isSuccess && result.error && (
          <div className="mt-2 rounded-lg bg-red-500/5 border border-red-500/10 px-3 py-2 text-xs text-red-500 leading-relaxed">
            {result.error}
          </div>
        )}
      </div>

      {result.signature && (
        <div className="flex items-center gap-2">
          <a
            href={`https://explorer.solana.com/tx/${result.signature}?cluster=devnet`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white/50 px-3.5 py-2 text-xs font-medium text-gray-600 transition-all hover:bg-gray-50 hover:text-gray-800 hover:border-gray-300"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            View on Explorer
          </a>
          <button
            type="button"
            onClick={() => navigator.clipboard.writeText(result.signature)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white/50 px-3.5 py-2 text-xs font-medium text-gray-600 transition-all hover:bg-gray-50 hover:text-gray-800 hover:border-gray-300"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            Copy TX
          </button>
        </div>
      )}
    </div>
  )
}
