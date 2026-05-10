export type TokenType = 'SOL' | 'USDC'

export type TransactionIntent = {
  action: 'send'
  token: TokenType
  amount: number
  recipientName: string
  memo?: string
}

export type TxResult = {
  signature: string
  status: 'confirmed' | 'failed'
  error?: string
}

export type ChatMessage = {
  id: string
  role: 'user' | 'assistant'
  content: string
  intent?: TransactionIntent | null
  txResult?: TxResult | null
}
