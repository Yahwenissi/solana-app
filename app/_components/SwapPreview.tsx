'use client'

import { useState, useEffect } from 'react'
import type { TransactionIntent } from '../_lib/types'
import { TOKEN_MINTS, TOKEN_DECIMALS, getQuote, toRawAmount } from '@/lib/jupiter'

export function SwapPreview({
  intent,
  onConfirm,
  onCancel,
  isSending,
}: {
  intent: TransactionIntent
  onConfirm: (expectedOutput: number, slippage: number) => void
  onCancel: () => void
  isSending: boolean
}) {
  const [quote, setQuote] = useState<{
    outputAmount: number
    rawOutputAmount: number
    priceImpact: string
    route: string
    loading: boolean
    error: string | null
  }>({ outputAmount: 0, rawOutputAmount: 0, priceImpact: '0', route: '', loading: true, error: null })

  useEffect(() => {
    let cancelled = false
    async function fetchQuote() {
      const inputMint = TOKEN_MINTS[intent.inputToken?.toUpperCase() ?? '']
      const outputMint = TOKEN_MINTS[intent.outputToken?.toUpperCase() ?? '']
      if (!inputMint || !outputMint || !intent.inputAmount) {
        if (!cancelled) setQuote((q) => ({ ...q, loading: false, error: 'Unsupported tokens' }))
        return
      }
      const rawAmount = toRawAmount(intent.inputToken ?? '', intent.inputAmount)
      const result = await getQuote(inputMint, outputMint, rawAmount)
      if (cancelled) return
      if (!result) {
        setQuote((q) => ({ ...q, loading: false, error: 'Failed to get quote' }))
        return
      }
      const outDecimals = TOKEN_DECIMALS[intent.outputToken?.toUpperCase() ?? 'USDC'] ?? 6
      setQuote({
        outputAmount: Number(result.outAmount) / 10 ** outDecimals,
        rawOutputAmount: Number(result.outAmount),
        priceImpact: result.priceImpactPct,
        route: result.routePlan?.map((r) => r.swapInfo.label).join(' → ') || 'Jupiter',
        loading: false,
        error: null,
      })
    }
    fetchQuote()
    return () => { cancelled = true }
  }, [intent])

  const slippage = intent.slippage ?? 0.5

  return (
    <div className="mt-4 glass-card rounded-xl p-5 border border-gray-200/80 animate-scale-in">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#9945FF]/10 text-[#9945FF]">
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 7.5L7.5 3m0 0L12 7.5M7.5 3v13.5m13.5 0L16.5 21m0 0L12 16.5m4.5 4.5V7.5" />
            </svg>
          </div>
          <div>
            <span className="text-sm font-semibold text-gray-900">Confirm Swap</span>
            <span className="ml-2 rounded-full bg-[#14F195]/10 border border-[#14F195]/20 px-2 py-0.5 text-xs font-medium text-[#14F195]">
              Devnet
            </span>
          </div>
        </div>
      </div>

      <div className="mb-4 rounded-xl bg-gray-50/80 border border-gray-100 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">You Pay</span>
          <span className="text-base font-bold text-gray-900">
            {intent.inputAmount} {intent.inputToken}
          </span>
        </div>
        <div className="flex justify-center">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#9945FF]/10">
            <svg className="h-3.5 w-3.5 text-[#9945FF]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 13.5L12 21m0 0l-7.5-7.5M12 21V3" />
            </svg>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">You Receive</span>
          <div className="text-right">
            {quote.loading ? (
              <span className="text-sm text-gray-400">Fetching quote...</span>
            ) : (
              <span className="text-base font-bold text-gray-900">
                {quote.outputAmount.toFixed(6)} {intent.outputToken}
              </span>
            )}
          </div>
        </div>
        {!quote.loading && !quote.error && (
          <>
            <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-gray-200">
              <span>Price Impact</span>
              <span className={Number(quote.priceImpact) > 1 ? 'text-amber-500' : 'text-gray-700'}>
                {Number(quote.priceImpact).toFixed(2)}%
              </span>
            </div>
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>Slippage</span>
              <span className="text-gray-700">{slippage}%</span>
            </div>
            {quote.route && (
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>Route</span>
                <span className="text-gray-700 text-right max-w-[200px] truncate">{quote.route}</span>
              </div>
            )}
          </>
        )}
        {quote.error && (
          <div className="rounded-lg bg-red-500/5 border border-red-500/10 px-3 py-2 text-xs text-red-500">
            {quote.error}
          </div>
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
          onClick={() => onConfirm(quote.rawOutputAmount, slippage)}
          disabled={isSending || quote.loading || !!quote.error}
          className="btn-neon px-5 py-2 text-xs inline-flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {isSending ? (
            <span className="flex items-center gap-1.5">
              <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Swapping...
            </span>
          ) : (
            <>
              Swap
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
