import { SystemProgram, Transaction, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js'
import { getAssociatedTokenAddress, createTransferInstruction } from '@solana/spl-token'
import type { Connection } from '@solana/web3.js'
import type { TransactionIntent } from '@/app/_lib/types'

const USDC_MINT = new PublicKey('4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU')
const USDC_DECIMALS = 6

type SendTxFn = (tx: Transaction, connection: Connection) => Promise<string>

function toFriendlyError(err: unknown): Error {
  const msg = err instanceof Error ? err.message : String(err)

  if (/invalid public key/i.test(msg) || /invalid.*address/i.test(msg)) {
    return new Error('Invalid recipient address. Please check the address and try again.')
  }
  if (/insufficient.*lamports/i.test(msg) || /0x1771/i.test(msg) || /insufficient.*balance/i.test(msg)) {
    return new Error('Insufficient balance. You need more SOL to cover the amount plus network fees.')
  }
  if (/user rejected/i.test(msg) || /rejected by user/i.test(msg)) {
    return new Error('Transaction was rejected in your wallet.')
  }
  if (/confirm.*tim/i.test(msg) || /timeout/i.test(msg) || /was not confirmed/i.test(msg)) {
    return new Error('Network timeout. The transaction may have failed. Please try again.')
  }
  if (/attempt to debit.*ata/i.test(msg)) {
    return new Error("You don't have enough USDC in your wallet. Check your balance and try again.")
  }

  const short = msg.split('.')[0].split('\n')[0].slice(0, 120)
  return new Error(`Transaction failed: ${short}.`)
}

export async function sendPayment(
  connection: Connection,
  wallet: { publicKey: PublicKey; sendTransaction: SendTxFn },
  intent: TransactionIntent,
  toAddress: string,
): Promise<string> {
  const toPubkey = new PublicKey(toAddress)

  try {
    const amount = intent.amount ?? 0
    if (intent.token === 'USDC') {
      return await sendUsdc(connection, wallet.publicKey, wallet.sendTransaction, toPubkey, amount)
    }
    return await sendSol(connection, wallet.publicKey, wallet.sendTransaction, toPubkey, amount)
  } catch (err) {
    throw toFriendlyError(err)
  }
}

async function sendSol(
  connection: Connection,
  publicKey: PublicKey,
  sendTransaction: SendTxFn,
  toPubkey: PublicKey,
  amount: number,
): Promise<string> {
  const tx = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey: publicKey,
      toPubkey,
      lamports: amount * LAMPORTS_PER_SOL,
    }),
  )

  const sig = await sendTransaction(tx, connection)
  await connection.confirmTransaction(sig, 'confirmed')
  return sig
}

async function sendUsdc(
  connection: Connection,
  publicKey: PublicKey,
  sendTransaction: SendTxFn,
  toPubkey: PublicKey,
  amount: number,
): Promise<string> {
  const fromAta = await getAssociatedTokenAddress(USDC_MINT, publicKey)
  const toAta = await getAssociatedTokenAddress(USDC_MINT, toPubkey)

  const tx = new Transaction().add(
    createTransferInstruction(
      fromAta,
      toAta,
      publicKey,
      amount * 10 ** USDC_DECIMALS,
    ),
  )

  const sig = await sendTransaction(tx, connection)
  await connection.confirmTransaction(sig, 'confirmed')
  return sig
}
