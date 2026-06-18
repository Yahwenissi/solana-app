import { PublicKey, Transaction, VersionedTransaction } from '@solana/web3.js'
import type { Connection } from '@solana/web3.js'

export const TOKEN_MINTS: Record<string, string> = {
  SOL: 'So11111111111111111111111111111111111111112',
  USDC: '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU',
  USDT: 'EJwZgeZrdC8TXTQbQBoL6bfuAnFUUy1hvCMxA5T8a8vU',
  BONK: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263',
  JUP: 'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN',
  RAY: '4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R',
  PYTH: 'HZ1JovNiVvGrGNiiYvEozEVgZ58xaU3RKwX8eACQBCt3',
  MSOL: 'mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So',
  wSOL: 'So11111111111111111111111111111111111111112',
}

export const TOKEN_DECIMALS: Record<string, number> = {
  SOL: 9,
  USDC: 6,
  USDT: 6,
  BONK: 5,
  JUP: 6,
  RAY: 6,
  PYTH: 6,
  MSOL: 9,
  wSOL: 9,
}

export function toRawAmount(token: string, amount: number): number {
  const decimals = TOKEN_DECIMALS[token.toUpperCase()] ?? 6
  return Math.floor(amount * 10 ** decimals)
}

const JUPITER_QUOTE_API = 'https://quote-api.jup.ag/v6'
const JUPITER_SWAP_API = 'https://quote-api.jup.ag/v6/swap'

export interface JupiterQuote {
  inputMint: string
  outputMint: string
  inAmount: string
  outAmount: string
  otherAmountThreshold: string
  swapMode: string
  slippageBps: number
  priceImpactPct: string
  routePlan: { swapInfo: { label: string } }[]
}

export async function getQuote(
  inputMint: string,
  outputMint: string,
  amount: number,
  slippageBps: number = 50,
): Promise<JupiterQuote | null> {
  const params = new URLSearchParams({
    inputMint,
    outputMint,
    amount: amount.toString(),
    slippageBps: slippageBps.toString(),
  })

  const res = await fetch(`${JUPITER_QUOTE_API}/quote?${params}`)
  if (!res.ok) return null
  return res.json()
}

type SendTxFn = (tx: Transaction | VersionedTransaction, connection: Connection) => Promise<string>

export async function executeSwap(
  connection: Connection,
  wallet: { publicKey: PublicKey; sendTransaction: SendTxFn },
  inputToken: string,
  outputToken: string,
  inputAmount: number,
  slippageBps: number = 50,
): Promise<{
  signature: string
  outputAmount: number
  route: string
}> {
  const inputMint = TOKEN_MINTS[inputToken.toUpperCase()]
  const outputMint = TOKEN_MINTS[outputToken.toUpperCase()]

  if (!inputMint || !outputMint) {
    throw new Error(`Unsupported token: ${inputToken} or ${outputToken}`)
  }

  const quote = await getQuote(inputMint, outputMint, inputAmount, slippageBps)
  if (!quote) {
    throw new Error('Failed to get swap quote from Jupiter')
  }

  const swapRes = await fetch(JUPITER_SWAP_API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      quoteResponse: quote,
      userPublicKey: wallet.publicKey.toBase58(),
      wrapAndUnwrapSol: true,
      dynamicComputeUnitLimit: true,
      prioritizationFeeLamports: 'auto',
    }),
  })

  if (!swapRes.ok) {
    const err = await swapRes.text()
    throw new Error(`Swap transaction creation failed: ${err}`)
  }

  const swapData = await swapRes.json()
  const swapTxBuf = Buffer.from(swapData.swapTransaction, 'base64')
  const tx = VersionedTransaction.deserialize(swapTxBuf)

  const signature = await wallet.sendTransaction(tx, connection)
  await connection.confirmTransaction(signature, 'confirmed')

  const route = quote.routePlan?.map((r) => r.swapInfo.label).join(' → ') || 'Jupiter'

  return {
    signature,
    outputAmount: Number(quote.outAmount),
    route,
  }
}
