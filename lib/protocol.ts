import { PublicKey, Transaction, TransactionInstruction, Connection, SystemProgram, SYSVAR_RENT_PUBKEY } from '@solana/web3.js'
import { getAssociatedTokenAddress, createAssociatedTokenAccountIdempotentInstructionWithDerivation, TOKEN_PROGRAM_ID } from '@solana/spl-token'
import { TOKEN_MINTS, TOKEN_DECIMALS } from './jupiter'

export const PROGRAM_ID = new PublicKey('4Eh646fwA4q1G6xAtSXUYTzrAvHRZJ5MsZvmBmLBWuUK')
export const DCA_SEED = 'dca-vault'
export const TIMELOCK_SEED = 'timelock'
export const RULE_SEED = 'rule'
export const RULE_LEN = 300

export const DCA_VAULT_LEN = 137
export const TIMELOCK_LEN = 114

// ─── Instruction discriminants (match Rust enum order) ───
const INST_INIT_VAULT = 0
const INST_DEPOSIT = 1
const INST_EXECUTE_DCA = 2
const INST_CLOSE_VAULT = 3
const INST_INIT_TIMELOCK = 4
const INST_CLAIM_TIMELOCK = 5

// ─── Borsh serialization helpers ───
function encodeU64(value: number): Buffer {
  const buf = Buffer.alloc(8)
  buf.writeBigUInt64LE(BigInt(value))
  return buf
}

function encodeI64(value: number): Buffer {
  const buf = Buffer.alloc(8)
  const big = BigInt(value)
  buf.writeBigInt64LE(big)
  return buf
}

function encodeInstructionDiscriminant(discriminant: number): Buffer {
  return Buffer.from([discriminant])
}

function readPubkey(data: Buffer, offset: number): [PublicKey, number] {
  return [new PublicKey(data.subarray(offset, offset + 32)), offset + 32]
}

function readU64(data: Buffer, offset: number): [number, number] {
  const val = Number(data.readBigUInt64LE(offset))
  return [val, offset + 8]
}

function readI64(data: Buffer, offset: number): [number, number] {
  const val = Number(data.readBigInt64LE(offset))
  return [val, offset + 8]
}

function readU8(data: Buffer, offset: number): [number, number] {
  return [data.readUInt8(offset), offset + 1]
}

function readU16(data: Buffer, offset: number): [number, number] {
  return [data.readUInt16LE(offset), offset + 2]
}

export function decodeDcaVault(data: Buffer) {
  let offset = 0
  const [owner, o1] = readPubkey(data, offset); offset = o1
  const [tokenMint, o2] = readPubkey(data, offset); offset = o2
  const [amountPerInterval, o3] = readU64(data, offset); offset = o3
  const [intervalSeconds, o4] = readI64(data, offset); offset = o4
  const [nextExecution, o5] = readI64(data, offset); offset = o5
  const [recipient, o6] = readPubkey(data, offset); offset = o6
  const [totalDeposited, o7] = readU64(data, offset); offset = o7
  const [totalExecuted, o8] = readU64(data, offset); offset = o8
  const [bump] = readU8(data, o8)
  return { owner, tokenMint, amountPerInterval, intervalSeconds, nextExecution, recipient, totalDeposited, totalExecuted, bump }
}

export function decodeTimelock(data: Buffer) {
  let offset = 0
  const [owner, o1] = readPubkey(data, offset); offset = o1
  const [tokenMint, o2] = readPubkey(data, offset); offset = o2
  const [amount, o3] = readU64(data, offset); offset = o3
  const [recipient, o4] = readPubkey(data, offset); offset = o4
  const [releaseTime, o5] = readI64(data, offset); offset = o5
  const [claimed, o6] = readU8(data, offset); offset = o6
  const [bump] = readU8(data, o6)
  return { owner, tokenMint, amount, recipient, releaseTime, claimed: claimed !== 0, bump }
}

export function getDecimalsForMint(mint: PublicKey): number {
  const addr = mint.toBase58()
  const entry = Object.entries(TOKEN_MINTS).find(([, a]) => a === addr)
  if (entry) return TOKEN_DECIMALS[entry[0]] ?? 6
  return 6
}

// ─── PDA Derivation ───

export function getDcaVaultPda(
  owner: PublicKey,
  recipient: PublicKey,
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from(DCA_SEED), owner.toBuffer(), recipient.toBuffer()],
    PROGRAM_ID,
  )
}

export function getTimelockPda(
  owner: PublicKey,
  recipient: PublicKey,
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from(TIMELOCK_SEED), owner.toBuffer(), recipient.toBuffer()],
    PROGRAM_ID,
  )
}

// ─── Instruction builders ───

export function createInitVaultInstruction(
  owner: PublicKey,
  recipient: PublicKey,
  tokenMint: PublicKey,
  vaultTokenAccount: PublicKey,
  ownerTokenAccount: PublicKey,
  amountPerInterval: number,
  intervalSeconds: number,
): TransactionInstruction {
  const [vaultPda] = getDcaVaultPda(owner, recipient)

  const data = Buffer.concat([
    encodeInstructionDiscriminant(INST_INIT_VAULT),
    encodeU64(amountPerInterval),
    encodeI64(intervalSeconds),
  ])

  const keys = [
    { pubkey: vaultPda, isSigner: false, isWritable: true },
    { pubkey: owner, isSigner: true, isWritable: true },
    { pubkey: tokenMint, isSigner: false, isWritable: false },
    { pubkey: ownerTokenAccount, isSigner: false, isWritable: true },
    { pubkey: vaultTokenAccount, isSigner: false, isWritable: true },
    { pubkey: recipient, isSigner: false, isWritable: false },
    { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
    { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    { pubkey: SYSVAR_RENT_PUBKEY, isSigner: false, isWritable: false },
  ]

  return new TransactionInstruction({
    keys,
    programId: PROGRAM_ID,
    data,
  })
}

export function createDepositInstruction(
  vaultPda: PublicKey,
  owner: PublicKey,
  ownerTokenAccount: PublicKey,
  vaultTokenAccount: PublicKey,
  amount: number,
): TransactionInstruction {
  const data = Buffer.concat([
    encodeInstructionDiscriminant(INST_DEPOSIT),
    encodeU64(amount),
  ])

  const keys = [
    { pubkey: vaultPda, isSigner: false, isWritable: true },
    { pubkey: owner, isSigner: true, isWritable: false },
    { pubkey: ownerTokenAccount, isSigner: false, isWritable: true },
    { pubkey: vaultTokenAccount, isSigner: false, isWritable: true },
    { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
  ]

  return new TransactionInstruction({ keys, programId: PROGRAM_ID, data })
}

export function createExecuteDcaInstruction(
  vaultPda: PublicKey,
  vaultTokenAccount: PublicKey,
  recipientTokenAccount: PublicKey,
): TransactionInstruction {
  const data = encodeInstructionDiscriminant(INST_EXECUTE_DCA)

  const keys = [
    { pubkey: vaultPda, isSigner: false, isWritable: true },
    { pubkey: vaultTokenAccount, isSigner: false, isWritable: true },
    { pubkey: recipientTokenAccount, isSigner: false, isWritable: true },
    { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
  ]

  return new TransactionInstruction({ keys, programId: PROGRAM_ID, data })
}

export function createCloseVaultInstruction(
  vaultPda: PublicKey,
  owner: PublicKey,
  vaultTokenAccount: PublicKey,
  ownerTokenAccount: PublicKey,
): TransactionInstruction {
  const data = encodeInstructionDiscriminant(INST_CLOSE_VAULT)

  const keys = [
    { pubkey: vaultPda, isSigner: false, isWritable: true },
    { pubkey: owner, isSigner: true, isWritable: true },
    { pubkey: vaultTokenAccount, isSigner: false, isWritable: true },
    { pubkey: ownerTokenAccount, isSigner: false, isWritable: true },
    { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
  ]

  return new TransactionInstruction({ keys, programId: PROGRAM_ID, data })
}

export function createInitTimelockInstruction(
  owner: PublicKey,
  recipient: PublicKey,
  tokenMint: PublicKey,
  escrowTokenAccount: PublicKey,
  ownerTokenAccount: PublicKey,
  amount: number,
  releaseTime: number,
): TransactionInstruction {
  const [timelockPda] = getTimelockPda(owner, recipient)

  const data = Buffer.concat([
    encodeInstructionDiscriminant(INST_INIT_TIMELOCK),
    encodeU64(amount),
    encodeI64(releaseTime),
  ])

  const keys = [
    { pubkey: timelockPda, isSigner: false, isWritable: true },
    { pubkey: owner, isSigner: true, isWritable: true },
    { pubkey: tokenMint, isSigner: false, isWritable: false },
    { pubkey: ownerTokenAccount, isSigner: false, isWritable: true },
    { pubkey: escrowTokenAccount, isSigner: false, isWritable: true },
    { pubkey: recipient, isSigner: false, isWritable: false },
    { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
    { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    { pubkey: SYSVAR_RENT_PUBKEY, isSigner: false, isWritable: false },
  ]

  return new TransactionInstruction({ keys, programId: PROGRAM_ID, data })
}

export function createClaimTimelockInstruction(
  timelockPda: PublicKey,
  escrowTokenAccount: PublicKey,
  recipientTokenAccount: PublicKey,
  recipient: PublicKey,
): TransactionInstruction {
  const data = encodeInstructionDiscriminant(INST_CLAIM_TIMELOCK)

  const keys = [
    { pubkey: timelockPda, isSigner: false, isWritable: true },
    { pubkey: escrowTokenAccount, isSigner: false, isWritable: true },
    { pubkey: recipientTokenAccount, isSigner: false, isWritable: true },
    { pubkey: recipient, isSigner: false, isWritable: false },
    { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
  ]

  return new TransactionInstruction({ keys, programId: PROGRAM_ID, data })
}

// ─── High-level helpers ───

type SendTxFn = (tx: Transaction, connection: Connection) => Promise<string>

export async function initVault(
  connection: Connection,
  wallet: { publicKey: PublicKey; sendTransaction: SendTxFn },
  tokenMint: PublicKey,
  recipient: PublicKey,
  amountPerInterval: number,
  intervalSeconds: number,
  initialDeposit: number = 0,
): Promise<string> {
  const owner = wallet.publicKey
  const [vaultPda] = getDcaVaultPda(owner, recipient)
  const ownerAta = await getAssociatedTokenAddress(tokenMint, owner)
  const vaultAta = await getAssociatedTokenAddress(tokenMint, vaultPda, true)

  const initIx = createInitVaultInstruction(
    owner, recipient, tokenMint, vaultAta, ownerAta,
    amountPerInterval, intervalSeconds,
  )

  const tx = new Transaction().add(initIx)

  if (initialDeposit > 0) {
    const createAtaIx = createAssociatedTokenAccountIdempotentInstructionWithDerivation(
      owner, vaultPda, tokenMint, true,
    )
    const depositIx = createDepositInstruction(
      vaultPda, owner, ownerAta, vaultAta, initialDeposit,
    )
    tx.add(createAtaIx).add(depositIx)
  }

  tx.feePayer = owner
  tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash

  return wallet.sendTransaction(tx, connection)
}

export async function depositToVault(
  connection: Connection,
  wallet: { publicKey: PublicKey; sendTransaction: SendTxFn },
  tokenMint: PublicKey,
  recipient: PublicKey,
  amount: number,
): Promise<string> {
  const owner = wallet.publicKey
  const [vaultPda] = getDcaVaultPda(owner, recipient)
  const ownerAta = await getAssociatedTokenAddress(tokenMint, owner)
  const vaultAta = await getAssociatedTokenAddress(tokenMint, vaultPda, true)

  const createAtaIx = createAssociatedTokenAccountIdempotentInstructionWithDerivation(
    owner, vaultPda, tokenMint, true,
  )
  const depositIx = createDepositInstruction(
    vaultPda, owner, ownerAta, vaultAta, amount,
  )

  const tx = new Transaction().add(createAtaIx).add(depositIx)
  tx.feePayer = owner
  tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash

  return wallet.sendTransaction(tx, connection)
}

export async function executeDca(
  connection: Connection,
  wallet: { publicKey: PublicKey; sendTransaction: SendTxFn },
  vaultPda: PublicKey,
  tokenMint: PublicKey,
  recipient: PublicKey,
): Promise<string> {
  const vaultAta = await getAssociatedTokenAddress(tokenMint, vaultPda, true)
  const recipientAta = await getAssociatedTokenAddress(tokenMint, recipient)

  // Create recipient ATA if needed
  const createAtaIx = createAssociatedTokenAccountIdempotentInstructionWithDerivation(
    wallet.publicKey, recipient, tokenMint,
  )
  const execIx = createExecuteDcaInstruction(vaultPda, vaultAta, recipientAta)

  const tx = new Transaction().add(createAtaIx).add(execIx)
  tx.feePayer = wallet.publicKey
  tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash

  return wallet.sendTransaction(tx, connection)
}

export async function closeVault(
  connection: Connection,
  wallet: { publicKey: PublicKey; sendTransaction: SendTxFn },
  tokenMint: PublicKey,
  recipient: PublicKey,
): Promise<string> {
  const owner = wallet.publicKey
  const [vaultPda] = getDcaVaultPda(owner, recipient)
  const vaultAta = await getAssociatedTokenAddress(tokenMint, vaultPda, true)
  const ownerAta = await getAssociatedTokenAddress(tokenMint, owner)

  const ix = createCloseVaultInstruction(vaultPda, owner, vaultAta, ownerAta)

  const tx = new Transaction().add(ix)
  tx.feePayer = owner
  tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash

  return wallet.sendTransaction(tx, connection)
}

export async function initTimelock(
  connection: Connection,
  wallet: { publicKey: PublicKey; sendTransaction: SendTxFn },
  tokenMint: PublicKey,
  recipient: PublicKey,
  amount: number,
  releaseTime: number,
): Promise<string> {
  const owner = wallet.publicKey
  const [timelockPda] = getTimelockPda(owner, recipient)
  const ownerAta = await getAssociatedTokenAddress(tokenMint, owner)
  const escrowAta = await getAssociatedTokenAddress(tokenMint, timelockPda, true)

  const createAtaIx = createAssociatedTokenAccountIdempotentInstructionWithDerivation(
    owner, timelockPda, tokenMint, true,
  )
  const initIx = createInitTimelockInstruction(
    owner, recipient, tokenMint, escrowAta, ownerAta,
    amount, releaseTime,
  )

  const tx = new Transaction().add(createAtaIx).add(initIx)
  tx.feePayer = owner
  tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash

  return wallet.sendTransaction(tx, connection)
}

export async function claimTimelock(
  connection: Connection,
  wallet: { publicKey: PublicKey; sendTransaction: SendTxFn },
  tokenMint: PublicKey,
  recipient: PublicKey,
): Promise<string> {
  const owner = wallet.publicKey
  const [timelockPda] = getTimelockPda(owner, recipient)
  const escrowAta = await getAssociatedTokenAddress(tokenMint, timelockPda, true)
  const recipientAta = await getAssociatedTokenAddress(tokenMint, recipient)

  const ix = createClaimTimelockInstruction(timelockPda, escrowAta, recipientAta, recipient)

  const tx = new Transaction().add(ix)
  tx.feePayer = owner
  tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash

  return wallet.sendTransaction(tx, connection)
}

export function getRulePda(
  owner: PublicKey,
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from(RULE_SEED), owner.toBuffer()],
    PROGRAM_ID,
  )
}

type RuleCondition =
  | { type: 'time_interval'; intervalSeconds: number }
  | { type: 'price_trigger'; tokenMint: PublicKey; targetPrice: number; above: boolean }
  | { type: 'yield_target'; tokenMint: PublicKey; minApyBps: number }

export function decodeRule(data: Buffer) {
  let offset = 0
  const [owner, o1] = readPubkey(data, offset); offset = o1
  const [active, o2] = readU8(data, offset); offset = o2
  const [lastExecutedAt, o3] = readI64(data, offset); offset = o3
  const [conditionType, o4] = readU8(data, offset); offset = o4

  let condition: RuleCondition
  if (conditionType === 0) {
    const [intervalSeconds] = readI64(data, offset)
    condition = { type: 'time_interval', intervalSeconds }
  } else if (conditionType === 1) {
    const [tokenMint, c1] = readPubkey(data, offset); offset = c1
    const [targetPrice, c2] = readU64(data, offset); offset = c2
    const [above] = readU8(data, offset)
    condition = { type: 'price_trigger', tokenMint, targetPrice, above: above !== 0 }
  } else {
    const [tokenMint, c1] = readPubkey(data, offset); offset = c1
    const [minApyBps] = readU16(data, offset)
    condition = { type: 'yield_target', tokenMint, minApyBps }
  }

  return { owner, active: active !== 0, lastExecutedAt, condition, action: {} }
}

export function createExecuteRuleInstruction(
  rulePda: PublicKey,
  owner: PublicKey,
): TransactionInstruction {
  const data = encodeInstructionDiscriminant(6)
  const keys = [
    { pubkey: rulePda, isSigner: false, isWritable: true },
    { pubkey: owner, isSigner: true, isWritable: false },
  ]
  return new TransactionInstruction({ keys, programId: PROGRAM_ID, data })
}

// ─── On-chain fetch ───

export async function getVaultsForOwner(
  connection: Connection,
  owner: PublicKey,
): Promise<{
  address: string
  owner: string
  tokenMint: string
  tokenDecimals: number
  amountPerInterval: number
  intervalSeconds: number
  nextExecution: number
  recipient: string
  totalDeposited: number
  totalExecuted: number
}[]> {
  const accounts = await connection.getProgramAccounts(PROGRAM_ID, {
    filters: [
      { dataSize: DCA_VAULT_LEN },
      { memcmp: { offset: 0, bytes: owner.toBase58() } },
    ],
  })

  return accounts.map(({ pubkey, account }) => {
    const decoded = decodeDcaVault(account.data)
    const mint = decoded.tokenMint
    return {
      address: pubkey.toBase58(),
      owner: decoded.owner.toBase58(),
      tokenMint: mint.toBase58(),
      tokenDecimals: getDecimalsForMint(mint),
      amountPerInterval: decoded.amountPerInterval,
      intervalSeconds: decoded.intervalSeconds,
      nextExecution: decoded.nextExecution,
      recipient: decoded.recipient.toBase58(),
      totalDeposited: decoded.totalDeposited,
      totalExecuted: decoded.totalExecuted,
    }
  })
}

export async function getTimelocksForOwner(
  connection: Connection,
  owner: PublicKey,
): Promise<{
  address: string
  owner: string
  tokenMint: string
  tokenDecimals: number
  amount: number
  recipient: string
  releaseTime: number
  claimed: boolean
}[]> {
  const accounts = await connection.getProgramAccounts(PROGRAM_ID, {
    filters: [
      { dataSize: TIMELOCK_LEN },
      { memcmp: { offset: 0, bytes: owner.toBase58() } },
    ],
  })

  return accounts.map(({ pubkey, account }) => {
    const decoded = decodeTimelock(account.data)
    const mint = decoded.tokenMint
    return {
      address: pubkey.toBase58(),
      owner: decoded.owner.toBase58(),
      tokenMint: mint.toBase58(),
      tokenDecimals: getDecimalsForMint(mint),
      amount: decoded.amount,
      recipient: decoded.recipient.toBase58(),
      releaseTime: decoded.releaseTime,
      claimed: decoded.claimed,
    }
  })
}
