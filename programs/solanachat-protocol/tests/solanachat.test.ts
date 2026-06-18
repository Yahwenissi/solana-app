import {
  Connection, Keypair, PublicKey, Transaction,
  LAMPORTS_PER_SOL,
} from '@solana/web3.js'
import {
  getAssociatedTokenAddress, createAssociatedTokenAccountIdempotentInstructionWithDerivation,
  AccountLayout, TOKEN_PROGRAM_ID,
} from '@solana/spl-token'
import * as assert from 'assert'
import {
  PROGRAM_ID, getDcaVaultPda, getTimelockPda,
  createInitVaultInstruction, createDepositInstruction,
  createExecuteDcaInstruction, createCloseVaultInstruction,
  createInitTimelockInstruction, createClaimTimelockInstruction,
} from '../../../lib/protocol'

const URL = process.env.RPC_URL || 'http://127.0.0.1:8899'
const IS_LOCAL = URL.includes('127.0.0.1') || URL.includes('localhost')
const DCA_VAULT_LEN = 32 + 32 + 8 + 8 + 8 + 32 + 8 + 8 + 1
const TIMELOCK_LEN = 32 + 32 + 8 + 32 + 8 + 1 + 1

let conn: Connection
let wallet: Keypair
let tokenMint: PublicKey
let recipient: Keypair

async function getRentExempt(size: number): Promise<number> {
  return conn.getMinimumBalanceForRentExemption(size)
}

async function getTokenBalance(owner: PublicKey, mint: PublicKey): Promise<number> {
  const ata = await getAssociatedTokenAddress(mint, owner, true)
  try {
    const ai = await conn.getAccountInfo(ata)
    if (!ai) return 0
    const data = AccountLayout.decode(ai.data)
    return Number(data.amount)
  } catch {
    return 0
  }
}

async function setup(): Promise<void> {
  conn = new Connection(URL, 'confirmed')

  for (let i = 0; i < 60; i++) {
    try {
      await conn.getLatestBlockhash()
      break
    } catch {
      await new Promise((r) => setTimeout(r, 1000))
    }
  }

  if (IS_LOCAL) {
    wallet = Keypair.generate()
    const sig = await conn.requestAirdrop(wallet.publicKey, 10 * LAMPORTS_PER_SOL)
    await conn.confirmTransaction(sig, 'confirmed')
  } else {
    const fs = await import('fs')
    const kpPath = process.env.WALLET_KEY || 'C:/Users/Gagi/.config/solana/nissi-wallet.json'
    const secret = JSON.parse(fs.readFileSync(kpPath, 'utf-8'))
    wallet = Keypair.fromSecretKey(new Uint8Array(secret))
  }

  recipient = Keypair.generate()

  // Use existing devnet token (pre-created, avoids mint creation incompatibility)
  tokenMint = new PublicKey('DjRxJJFCL1xaGsUKFyLrdhC8BTTVMkH2CNfJ7pF6QJtE')
}

function assertOk(label: string, ok: boolean, detail?: string): void {
  if (!ok) {
    console.error(`FAIL: ${label}${detail ? ` — ${detail}` : ''}`)
    process.exit(1)
  }
  console.log(`  PASS: ${label}`)
}

async function testInitVault(): Promise<void> {
  const owner = wallet.publicKey
  const [vaultPda] = getDcaVaultPda(owner, recipient.publicKey)
  const ownerAta = await getAssociatedTokenAddress(tokenMint, owner)
  const vaultAta = await getAssociatedTokenAddress(tokenMint, vaultPda, true)

  // Create vault ATA (needed for deposits, before InitVault or can be deferred)
  {
    const createAtaIx = createAssociatedTokenAccountIdempotentInstructionWithDerivation(
      wallet.publicKey, vaultPda, tokenMint,
    )
    const bh = await conn.getLatestBlockhash()
    const tx = new Transaction().add(createAtaIx)
    tx.feePayer = wallet.publicKey
    tx.recentBlockhash = bh.blockhash
    await conn.sendTransaction(tx, [wallet]).then(sig => conn.confirmTransaction(sig, 'confirmed'))
  }

  const amountPerInterval = 50_000
  const intervalSeconds = 60

  const initIx = createInitVaultInstruction(
    owner, recipient.publicKey, tokenMint, vaultAta, ownerAta,
    amountPerInterval, intervalSeconds,
  )

  const blockhash = await conn.getLatestBlockhash()
  const tx = new Transaction().add(initIx)
  tx.feePayer = owner
  tx.recentBlockhash = blockhash.blockhash
  const sig = await conn.sendTransaction(tx, [wallet])
  await conn.confirmTransaction(sig, 'confirmed')

  const vaultAi = await conn.getAccountInfo(vaultPda)
  assertOk('InitVault account exists', !!vaultAi)
  assertOk('InitVault program owner',
    vaultAi?.owner.equals(PROGRAM_ID) ?? false)
  assertOk('InitVault data length',
    (vaultAi?.data.length ?? 0) >= DCA_VAULT_LEN)
  console.log(`  vault PDA: ${vaultPda.toBase58()}`)
}

async function testDeposit(): Promise<void> {
  const owner = wallet.publicKey
  const [vaultPda] = getDcaVaultPda(owner, recipient.publicKey)
  const ownerAta = await getAssociatedTokenAddress(tokenMint, owner)
  const vaultAta = await getAssociatedTokenAddress(tokenMint, vaultPda, true)

  const depositAmount = 200_000
  const ix = createDepositInstruction(
    vaultPda, owner, ownerAta, vaultAta, depositAmount,
  )

  const blockhash = await conn.getLatestBlockhash()
  const tx = new Transaction().add(ix)
  tx.feePayer = owner
  tx.recentBlockhash = blockhash.blockhash
  const sig = await conn.sendTransaction(tx, [wallet])
  await conn.confirmTransaction(sig, 'confirmed')

  const vaultBal = await getTokenBalance(vaultPda, tokenMint)
  assertOk('Deposit vault balance', vaultBal === depositAmount,
    `got ${vaultBal}`)
}

async function testExecuteDca(): Promise<void> {
  const [vaultPda] = getDcaVaultPda(wallet.publicKey, recipient.publicKey)
  const vaultAta = await getAssociatedTokenAddress(tokenMint, vaultPda, true)
  const recipientAta = await getAssociatedTokenAddress(tokenMint, recipient.publicKey)

  {
    const createAtaIx = createAssociatedTokenAccountIdempotentInstructionWithDerivation(
      wallet.publicKey, recipient.publicKey, tokenMint,
    )
    const bh = await conn.getLatestBlockhash()
    const tx = new Transaction().add(createAtaIx)
    tx.feePayer = wallet.publicKey
    tx.recentBlockhash = bh.blockhash
    await conn.sendTransaction(tx, [wallet]).then(sig => conn.confirmTransaction(sig, 'confirmed'))
  }

  const ix = createExecuteDcaInstruction(vaultPda, vaultAta, recipientAta)

  const blockhash = await conn.getLatestBlockhash()
  const tx = new Transaction().add(ix)
  tx.recentBlockhash = blockhash.blockhash
  const sig = await conn.sendTransaction(tx, [wallet])
  await conn.confirmTransaction(sig, 'confirmed')

  const recipientBal = await getTokenBalance(recipient.publicKey, tokenMint)
  assertOk('ExecuteDca recipient received tokens',
    recipientBal > 0, `got ${recipientBal}`)
}

async function testCloseVault(): Promise<void> {
  const owner = wallet.publicKey
  const [vaultPda] = getDcaVaultPda(owner, recipient.publicKey)
  const vaultAta = await getAssociatedTokenAddress(tokenMint, vaultPda, true)
  const ownerAta = await getAssociatedTokenAddress(tokenMint, owner)

  const ix = createCloseVaultInstruction(vaultPda, owner, vaultAta, ownerAta)

  const blockhash = await conn.getLatestBlockhash()
  const tx = new Transaction().add(ix)
  tx.feePayer = owner
  tx.recentBlockhash = blockhash.blockhash
  const sig = await conn.sendTransaction(tx, [wallet])
  await conn.confirmTransaction(sig, 'confirmed')

  const vaultAi = await conn.getAccountInfo(vaultPda)
  assertOk('CloseVault account zeroed',
    vaultAi === null || vaultAi.data.every((b) => b === 0))
}

async function testInitTimelock(): Promise<void> {
  const owner = wallet.publicKey
  const [timelockPda] = getTimelockPda(owner, recipient.publicKey)
  const ownerAta = await getAssociatedTokenAddress(tokenMint, owner)
  const escrowAta = await getAssociatedTokenAddress(tokenMint, timelockPda, true)

  {
    const createAtaIx = createAssociatedTokenAccountIdempotentInstructionWithDerivation(
      wallet.publicKey, timelockPda, tokenMint,
    )
    const bh = await conn.getLatestBlockhash()
    const tx = new Transaction().add(createAtaIx)
    tx.feePayer = wallet.publicKey
    tx.recentBlockhash = bh.blockhash
    await conn.sendTransaction(tx, [wallet]).then(sig => conn.confirmTransaction(sig, 'confirmed'))
  }

  const amount = 250_000
  const releaseTime = IS_LOCAL ? Math.floor(Date.now() / 1000) + 30 : 0

  const initIx = createInitTimelockInstruction(
    owner, recipient.publicKey, tokenMint, escrowAta, ownerAta,
    amount, releaseTime,
  )

  const blockhash = await conn.getLatestBlockhash()
  const tx = new Transaction().add(initIx)
  tx.feePayer = owner
  tx.recentBlockhash = blockhash.blockhash
  const sig = await conn.sendTransaction(tx, [wallet])
  await conn.confirmTransaction(sig, 'confirmed')

  const escrowBal = await getTokenBalance(timelockPda, tokenMint)
  assertOk('InitTimelock escrow balance', escrowBal === amount,
    `got ${escrowBal}`)
  console.log(`  timelock PDA: ${timelockPda.toBase58()}`)
}

async function testClaimTimelock(): Promise<void> {
  const [timelockPda] = getTimelockPda(wallet.publicKey, recipient.publicKey)
  const escrowAta = await getAssociatedTokenAddress(tokenMint, timelockPda, true)
  const recipientAta = await getAssociatedTokenAddress(tokenMint, recipient.publicKey)

  const ix = createClaimTimelockInstruction(
    timelockPda, escrowAta, recipientAta, recipient.publicKey,
  )

  const blockhash = await conn.getLatestBlockhash()
  const tx = new Transaction().add(ix)
  tx.recentBlockhash = blockhash.blockhash
  const sig = await conn.sendTransaction(tx, [wallet])
  await conn.confirmTransaction(sig, 'confirmed')

  const recipientBal = await getTokenBalance(recipient.publicKey, tokenMint)
  assertOk('ClaimTimelock recipient received tokens',
    recipientBal > 0, `got ${recipientBal}`)
}

async function main(): Promise<void> {
  console.log('\nSolanaChat Protocol — Integration Tests')
  console.log('========================================\n')
  console.log(`Program ID: ${PROGRAM_ID.toBase58()}`)
  console.log(`RPC URL:   ${URL}`)

  await setup()
  console.log(`\nWallet:    ${wallet.publicKey.toBase58()}`)
  console.log(`Recipient: ${recipient.publicKey.toBase58()}`)
  console.log(`Token:     ${tokenMint.toBase58()}\n`)

  await testInitVault()
  await testDeposit()
  await testExecuteDca()
  await testCloseVault()
  await testInitTimelock()
  if (IS_LOCAL) {
    console.log('\n  Waiting 30s for timelock release...')
    await new Promise((r) => setTimeout(r, 30000))
  }
  await testClaimTimelock()

  console.log('\n========================================')
  console.log('All tests passed.\n')
  process.exit(0)
}

main().catch((err) => {
  console.error('Test suite failed:', err)
  process.exit(1)
})
