export type TokenType = 'SOL' | 'USDC'

export type ActionType = 'send' | 'swap' | 'dca' | 'timelock'

export type IntervalType = 'daily' | 'weekly' | 'monthly'

export type TransactionIntent = {
  action: ActionType
  token?: TokenType
  amount?: number
  recipientName?: string
  memo?: string
  inputToken?: string
  outputToken?: string
  inputAmount?: number
  slippage?: number
  interval?: IntervalType
  intervalSeconds?: number
  totalDeposits?: number
  releaseDate?: string
  releaseTimestamp?: number
  allowanceType?: 'recurring' | 'fixed'
}

export type TxResult = {
  signature: string
  status: 'confirmed' | 'failed'
  error?: string
  swapDetails?: {
    inputAmount: number
    inputToken: string
    outputAmount: number
    outputToken: string
    route?: string
  }
}

export type DcaVaultInfo = {
  owner: string
  tokenMint: string
  tokenDecimals: number
  amountPerInterval: number
  intervalSeconds: number
  nextExecution: number
  recipient: string
  totalDeposited: number
  totalExecuted: number
  address: string
}

export type TimelockInfo = {
  owner: string
  tokenMint: string
  tokenDecimals: number
  amount: number
  recipient: string
  releaseTime: number
  claimed: boolean
  address: string
}

export type PositionType = 'dca-vault' | 'timelock' | 'token-balance' | 'kamino' | 'marinade' | 'drift'

export type Position = {
  id: string
  type: PositionType
  protocol: string
  tokenSymbol?: string
  tokenDecimals: number
  balance: number
  usdValue?: number
  metadata: Record<string, unknown>
}

export type ChatMessage = {
  id: string
  role: 'user' | 'assistant'
  content: string
  intent?: TransactionIntent | null
  txResult?: TxResult | null
}
