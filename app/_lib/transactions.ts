import { SystemProgram, Transaction, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js'
import { getAssociatedTokenAddress, createTransferInstruction } from '@solana/spl-token'
import type { Connection } from '@solana/web3.js'

const USDC_MINT = new PublicKey('4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU')
const USDC_DECIMALS = 6

type SendTxFn = (tx: Transaction, connection: Connection) => Promise<string>

export async function sendSol(
  connection: Connection,
  publicKey: PublicKey,
  sendTransaction: SendTxFn,
  toAddress: string,
  amount: number,
): Promise<string> {
  const tx = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey: publicKey,
      toPubkey: new PublicKey(toAddress),
      lamports: amount * LAMPORTS_PER_SOL,
    }),
  )

  const sig = await sendTransaction(tx, connection)
  await connection.confirmTransaction(sig, 'confirmed')
  return sig
}

export async function sendUsdc(
  connection: Connection,
  publicKey: PublicKey,
  sendTransaction: SendTxFn,
  toAddress: string,
  amount: number,
): Promise<string> {
  const toPubkey = new PublicKey(toAddress)
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
