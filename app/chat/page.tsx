'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { WalletButton } from '../_components/WalletButton'
import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import { LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js'
import { ChatMessage } from '../_components/ChatMessage'
import { ChatInput } from '../_components/ChatInput'
import { VaultCard } from '../_components/VaultCard'
import { TimelockCard } from '../_components/TimelockCard'
import { resolveContact } from '../_lib/contacts'
import { sendPayment } from '@/lib/sendPayment'
import { executeSwap, toRawAmount } from '@/lib/jupiter'
import {
  initVault, initTimelock, executeDca, closeVault, claimTimelock,
  getDcaVaultPda, getTimelockPda,
  getVaultsForOwner, getTimelocksForOwner,
  decodeDcaVault,
} from '@/lib/protocol'
import { TOKEN_MINTS, TOKEN_DECIMALS } from '@/lib/jupiter'
import type { ChatMessage as ChatMessageType, TransactionIntent, DcaVaultInfo, TimelockInfo } from '../_lib/types'

function speak(text: string, onEnd?: () => void) {
  const utterance = new SpeechSynthesisUtterance(text)
  if (onEnd) utterance.onend = onEnd
  utterance.onerror = onEnd ?? null
  speechSynthesis.speak(utterance)
}

function intervalToSeconds(interval: string): number {
  switch (interval) {
    case 'daily': return 86400
    case 'weekly': return 604800
    case 'monthly': return 2592000
    default: return 604800
  }
}

export default function ChatPage() {
  const { connection } = useConnection()
  const { publicKey, sendTransaction } = useWallet()
  const [balance, setBalance] = useState<number | null>(null)
  const [balanceLoading, setBalanceLoading] = useState(false)
  const [messages, setMessages] = useState<ChatMessageType[]>([])
  const [isParsing, setIsParsing] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [voicePlaying, setVoicePlaying] = useState(false)
  const [pendingIntent, setPendingIntent] = useState<TransactionIntent | null>(null)
  const [pendingMsgId, setPendingMsgId] = useState<string | null>(null)
  const [vaults, setVaults] = useState<DcaVaultInfo[]>([])
  const [timelocks, setTimelocks] = useState<TimelockInfo[]>([])
  const [executingVault, setExecutingVault] = useState<string | null>(null)
  const [claimingTimelock, setClaimingTimelock] = useState<string | null>(null)
  const chatEndRef = useRef<HTMLDivElement>(null)

  const refreshBalance = useCallback(async () => {
    if (!publicKey) { setBalance(null); return }
    setBalanceLoading(true)
    try {
      const bal = await connection.getBalance(publicKey)
      setBalance(bal / LAMPORTS_PER_SOL)
    } finally {
      setBalanceLoading(false)
    }
  }, [publicKey, connection])

  useEffect(() => {
    if (!publicKey) { setBalance(null); return }
    let cancelled = false
    connection.getBalance(publicKey).then((bal) => {
      if (cancelled) return
      setBalance(bal / LAMPORTS_PER_SOL)
    })
    return () => { cancelled = true }
  }, [publicKey, connection])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isParsing])

  // Fetch on-chain vaults and timelocks
  useEffect(() => {
    if (!publicKey) {
      setVaults([])
      setTimelocks([])
      return
    }
    let cancelled = false
    Promise.all([
      getVaultsForOwner(connection, publicKey),
      getTimelocksForOwner(connection, publicKey),
    ]).then(([fetchedVaults, fetchedTimelocks]) => {
      if (cancelled) return
      setVaults(fetchedVaults)
      setTimelocks(fetchedTimelocks)
    }).catch((err) => {
      console.error('Failed to fetch vaults/timelocks:', err)
    })
    return () => { cancelled = true }
  }, [publicKey, connection])

  const handleSend = useCallback(async (text: string) => {
    const userMsg: ChatMessageType = { id: crypto.randomUUID(), role: 'user', content: text }
    setMessages((prev) => [...prev, userMsg])
    setIsParsing(true)
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text }),
      })
      const data = await res.json()
      const intent: TransactionIntent | null = data.intent ?? null
      const msgId = crypto.randomUUID()
      if (intent) {
        let content = ''
        if (intent.action === 'swap') {
          content = `I'll help you swap **${intent.inputAmount} ${intent.inputToken}** for **${intent.outputToken}**.`
        } else if (intent.action === 'dca') {
          content = `I'll set up a recurring payment of **${intent.amount} ${intent.token}** to **${intent.recipientName}** ${intent.interval}.`
        } else if (intent.action === 'timelock') {
          content = `I'll create a timelocked transfer of **${intent.amount} ${intent.token}** to **${intent.recipientName}** releasing **${intent.releaseDate}**.`
        } else {
          content = `I'll help you send **${intent.amount} ${intent.token}** to **${intent.recipientName}**.`
        }
        setMessages((prev) => [...prev, {
          id: msgId, role: 'assistant', content, intent,
        }])
        setPendingIntent(intent)
        setPendingMsgId(msgId)
      } else {
        setMessages((prev) => [...prev, {
          id: msgId, role: 'assistant',
          content: "Sorry, I couldn't understand that. Try:\n\n`send 5 USDC to Alice`\n`swap 2 SOL for USDC`\n`send 1 SOL to Alice every week`\n`send 2 SOL to Charlie next Friday`",
        }])
      }
    } catch {
      setMessages((prev) => [...prev, {
        id: crypto.randomUUID(), role: 'assistant',
        content: 'Something went wrong. Please try again.',
      }])
    } finally {
      setIsParsing(false)
    }
  }, [])

  const handleVoice = useCallback(() => {
    if (!pendingIntent) return
    setVoicePlaying(true)
    let text = ''
    if (pendingIntent.action === 'swap') {
      text = `You are about to swap ${pendingIntent.inputAmount} ${pendingIntent.inputToken} for ${pendingIntent.outputToken}. Confirm?`
    } else if (pendingIntent.action === 'dca') {
      text = `Set up recurring payment of ${pendingIntent.amount} ${pendingIntent.token} to ${pendingIntent.recipientName} every ${pendingIntent.interval}?`
    } else if (pendingIntent.action === 'timelock') {
      text = `Create timelocked transfer of ${pendingIntent.amount} ${pendingIntent.token} to ${pendingIntent.recipientName} releasing ${pendingIntent.releaseDate}?`
    } else {
      text = `You are about to send ${pendingIntent.amount} ${pendingIntent.token} to ${pendingIntent.recipientName}. Confirm?`
    }
    speak(text, () => setVoicePlaying(false))
  }, [pendingIntent])

  const handleConfirm = useCallback(async () => {
    if (!pendingIntent || !publicKey || !sendTransaction) return
    setIsSending(true)
    try {
      const resolved = resolveContact(pendingIntent.recipientName ?? '')
      if (!resolved) {
        setMessages((prev) => [...prev, {
          id: crypto.randomUUID(), role: 'assistant',
          content: `Could not resolve "${pendingIntent.recipientName}". Available: Alice, Bob, Charlie.`,
        }])
        setPendingIntent(null)
        setPendingMsgId(null)
        return
      }
      const sig = await sendPayment(connection, { publicKey, sendTransaction }, pendingIntent, resolved)
      void refreshBalance()
      setMessages((prev) => [...prev, {
        id: crypto.randomUUID(), role: 'assistant',
        content: '', intent: pendingIntent,
        txResult: { signature: sig, status: 'confirmed' },
      }])
      setPendingIntent(null)
      setPendingMsgId(null)
      speak(`Sent ${pendingIntent.amount} ${pendingIntent.token}. Transaction confirmed.`)
    } catch (err) {
      setMessages((prev) => [...prev, {
        id: crypto.randomUUID(), role: 'assistant',
        content: '', intent: pendingIntent,
        txResult: { signature: '', status: 'failed', error: err instanceof Error ? err.message : 'Unknown error' },
      }])
    } finally {
      setIsSending(false)
    }
  }, [pendingIntent, publicKey, sendTransaction, connection, refreshBalance])

  const handleSwapConfirm = useCallback(async (expectedOutput: number, slippage: number) => {
    if (!pendingIntent || !publicKey || !sendTransaction || !pendingIntent.inputToken || !pendingIntent.outputToken || !pendingIntent.inputAmount) return
    setIsSending(true)
    try {
      const rawAmount = toRawAmount(pendingIntent.inputToken, pendingIntent.inputAmount)
      const result = await executeSwap(
        connection,
        { publicKey, sendTransaction },
        pendingIntent.inputToken,
        pendingIntent.outputToken,
        rawAmount,
        Math.round(slippage * 100),
      )
      void refreshBalance()
      setMessages((prev) => [...prev, {
        id: crypto.randomUUID(), role: 'assistant',
        content: '', intent: pendingIntent,
        txResult: {
          signature: result.signature,
          status: 'confirmed',
          swapDetails: {
            inputAmount: pendingIntent.inputAmount ?? 0,
            inputToken: pendingIntent.inputToken ?? '',
            outputAmount: result.outputAmount,
            outputToken: pendingIntent.outputToken ?? '',
            route: result.route,
          },
        },
      }])
      setPendingIntent(null)
      setPendingMsgId(null)
      speak(`Swapped ${pendingIntent.inputAmount} ${pendingIntent.inputToken}. Transaction confirmed.`)
    } catch (err) {
      setMessages((prev) => [...prev, {
        id: crypto.randomUUID(), role: 'assistant',
        content: '', intent: pendingIntent,
        txResult: {
          signature: '', status: 'failed',
          error: err instanceof Error ? err.message : 'Unknown error',
          swapDetails: pendingIntent.inputToken && pendingIntent.outputToken && pendingIntent.inputAmount ? {
            inputAmount: pendingIntent.inputAmount,
            inputToken: pendingIntent.inputToken,
            outputAmount: 0,
            outputToken: pendingIntent.outputToken,
          } : undefined,
        },
      }])
    } finally {
      setIsSending(false)
    }
  }, [pendingIntent, publicKey, sendTransaction, connection, refreshBalance])

  const handleDcaConfirm = useCallback(async () => {
    if (!pendingIntent || !publicKey || !sendTransaction || !pendingIntent.amount || !pendingIntent.recipientName || !pendingIntent.interval) return
    setIsSending(true)
    try {
      const resolved = resolveContact(pendingIntent.recipientName)
      if (!resolved) {
        setMessages((prev) => [...prev, {
          id: crypto.randomUUID(), role: 'assistant',
          content: `Could not resolve "${pendingIntent.recipientName}". Available: Alice, Bob, Charlie.`,
        }])
        setPendingIntent(null)
        setPendingMsgId(null)
        return
      }
      const token = pendingIntent.token ?? 'USDC'
      const tokenMint = new PublicKey(TOKEN_MINTS[token])
      const recipientPk = new PublicKey(resolved)
      const amountPerInterval = toRawAmount(token, pendingIntent.amount)
      const intervalSeconds = intervalToSeconds(pendingIntent.interval)
      const totalDeposits = pendingIntent.totalDeposits ?? 1
      const initialDeposit = amountPerInterval * totalDeposits
      const sig = await initVault(
        connection, { publicKey, sendTransaction },
        tokenMint, recipientPk, amountPerInterval, intervalSeconds, initialDeposit,
      )
      const [vaultPda] = getDcaVaultPda(publicKey, recipientPk)
      const vaultAi = await connection.getAccountInfo(vaultPda)
      const decoded = vaultAi ? decodeDcaVault(vaultAi.data) : null
      const decimals = token === 'SOL' ? TOKEN_DECIMALS.SOL : TOKEN_DECIMALS[token] ?? 6
      setVaults((prev) => [...prev, {
        owner: publicKey.toBase58(),
        tokenMint: tokenMint.toBase58(),
        tokenDecimals: decimals,
        amountPerInterval,
        intervalSeconds,
        nextExecution: decoded ? decoded.nextExecution : Math.floor(Date.now() / 1000) + intervalSeconds,
        recipient: recipientPk.toBase58(),
        totalDeposited: initialDeposit,
        totalExecuted: 0,
        address: vaultPda.toBase58(),
      }])
      setMessages((prev) => [...prev, {
        id: crypto.randomUUID(), role: 'assistant',
        content: `✅ **DCA Vault created!** ${pendingIntent.amount} ${pendingIntent.token} to ${pendingIntent.recipientName} every ${pendingIntent.interval}.`,
        intent: pendingIntent,
        txResult: { signature: sig, status: 'confirmed' },
      }])
      setPendingIntent(null)
      setPendingMsgId(null)
      speak(`DCA vault created. ${pendingIntent.amount} ${pendingIntent.token} every ${pendingIntent.interval}.`)
    } catch (err) {
      setMessages((prev) => [...prev, {
        id: crypto.randomUUID(), role: 'assistant',
        content: '', intent: pendingIntent,
        txResult: { signature: '', status: 'failed', error: err instanceof Error ? err.message : 'Unknown error' },
      }])
    } finally {
      setIsSending(false)
    }
  }, [pendingIntent, publicKey, sendTransaction, connection])

  const handleTimelockConfirm = useCallback(async (releaseTimestamp: number) => {
    if (!pendingIntent || !publicKey || !sendTransaction || !pendingIntent.amount || !pendingIntent.recipientName) return
    setIsSending(true)
    try {
      const resolved = resolveContact(pendingIntent.recipientName)
      if (!resolved) {
        setMessages((prev) => [...prev, {
          id: crypto.randomUUID(), role: 'assistant',
          content: `Could not resolve "${pendingIntent.recipientName}". Available: Alice, Bob, Charlie.`,
        }])
        setPendingIntent(null)
        setPendingMsgId(null)
        return
      }
      const token = pendingIntent.token ?? 'USDC'
      const tokenMint = new PublicKey(TOKEN_MINTS[token])
      const recipientPk = new PublicKey(resolved)
      const amount = toRawAmount(token, pendingIntent.amount)
      const sig = await initTimelock(
        connection, { publicKey, sendTransaction },
        tokenMint, recipientPk, amount, releaseTimestamp,
      )
      const [timelockPda] = getTimelockPda(publicKey, recipientPk)
      const decimals = token === 'SOL' ? TOKEN_DECIMALS.SOL : TOKEN_DECIMALS[token] ?? 6
      const releaseDate = new Date(releaseTimestamp * 1000).toLocaleString()
      setTimelocks((prev) => [...prev, {
        owner: publicKey.toBase58(),
        tokenMint: tokenMint.toBase58(),
        tokenDecimals: decimals,
        amount,
        recipient: recipientPk.toBase58(),
        releaseTime: releaseTimestamp,
        claimed: false,
        address: timelockPda.toBase58(),
      }])
      setMessages((prev) => [...prev, {
        id: crypto.randomUUID(), role: 'assistant',
        content: `✅ **Timelock created!** ${pendingIntent.amount} ${pendingIntent.token} will be released to ${pendingIntent.recipientName} on ${releaseDate}.`,
        intent: pendingIntent,
        txResult: { signature: sig, status: 'confirmed' },
      }])
      setPendingIntent(null)
      setPendingMsgId(null)
      speak(`Timelock created. ${pendingIntent.amount} ${pendingIntent.token} will be released on ${releaseDate}.`)
    } catch (err) {
      setMessages((prev) => [...prev, {
        id: crypto.randomUUID(), role: 'assistant',
        content: '', intent: pendingIntent,
        txResult: { signature: '', status: 'failed', error: err instanceof Error ? err.message : 'Unknown error' },
      }])
    } finally {
      setIsSending(false)
    }
  }, [pendingIntent, publicKey, sendTransaction, connection])

  const handleCancel = useCallback(() => {
    setPendingIntent(null)
    setPendingMsgId(null)
  }, [])

  const handleExecuteVault = useCallback(async (address: string) => {
    if (!publicKey || !sendTransaction) return
    const vault = vaults.find((v) => v.address === address)
    if (!vault) return
    setExecutingVault(address)
    try {
      await executeDca(
        connection, { publicKey, sendTransaction },
        new PublicKey(address), new PublicKey(vault.tokenMint), new PublicKey(vault.recipient),
      )
      const vaultAi = await connection.getAccountInfo(new PublicKey(address))
      if (vaultAi) {
        const decoded = decodeDcaVault(vaultAi.data)
        setVaults((prev) => prev.map((v) =>
          v.address === address
            ? { ...v, nextExecution: decoded.nextExecution, totalExecuted: decoded.totalExecuted }
            : v,
        ))
      }
    } catch (err) {
      console.error('ExecuteDca failed:', err)
    } finally {
      setExecutingVault(null)
    }
  }, [vaults, publicKey, sendTransaction, connection])

  const handleCloseVault = useCallback(async (address: string) => {
    if (!publicKey || !sendTransaction) return
    const vault = vaults.find((v) => v.address === address)
    if (!vault) return
    try {
      await closeVault(
        connection, { publicKey, sendTransaction },
        new PublicKey(vault.tokenMint), new PublicKey(vault.recipient),
      )
      setVaults((prev) => prev.filter((v) => v.address !== address))
    } catch (err) {
      console.error('CloseVault failed:', err)
    }
  }, [vaults, publicKey, sendTransaction, connection])

  const handleClaimTimelock = useCallback(async (address: string) => {
    if (!publicKey || !sendTransaction) return
    const timelock = timelocks.find((t) => t.address === address)
    if (!timelock) return
    setClaimingTimelock(address)
    try {
      await claimTimelock(
        connection, { publicKey, sendTransaction },
        new PublicKey(timelock.tokenMint), new PublicKey(timelock.recipient),
      )
      setTimelocks((prev) => prev.map((t) =>
        t.address === address ? { ...t, claimed: true } : t,
      ))
    } catch (err) {
      console.error('ClaimTimelock failed:', err)
    } finally {
      setClaimingTimelock(null)
    }
  }, [timelocks, publicKey, sendTransaction, connection])

  return (
    <div className="flex h-screen flex-col">

      {/* Floating Orbs */}
      <div className="floating-orb floating-orb--purple" style={{ top: '-10%', right: '-5%' }} />
      <div className="floating-orb floating-orb--teal" style={{ bottom: '-5%', left: '-5%' }} />

      {/* Grid Background */}
      <div className="fixed inset-0 bg-grid-subtle pointer-events-none z-0" />

      <div className="relative z-10 flex h-full flex-col">

        {/* Glass Nav */}
        <header className="glass-nav flex shrink-0 items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <Link href="/" className="group flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-[#9945FF] to-[#14F195] flex items-center justify-center text-xs font-bold text-black">
                S
              </div>
              <span className="font-semibold text-gray-900 tracking-tight hidden sm:inline">SolanaChat</span>
            </Link>
            <div className="h-4 w-px bg-gray-200 hidden sm:block" />
            <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-gray-50/50 px-2.5 py-0.5 text-xs text-gray-500">
              <span className="h-1.5 w-1.5 rounded-full bg-[#14F195] animate-pulse" />
              Devnet
            </span>
          </div>

          <div className="flex items-center gap-3">
            {publicKey && (
              <div className="hidden sm:flex items-center gap-2 rounded-xl border border-gray-200 bg-white/60 backdrop-blur-sm px-3 py-1.5">
                <span className="text-xs text-gray-400 font-mono font-semibold">SOL</span>
                <span className={`text-sm text-gray-700 font-mono font-medium ${balanceLoading ? 'opacity-40' : ''}`}>
                  {balance !== null ? balance.toFixed(4) : '---'}
                </span>
              </div>
            )}
            <WalletButton />
          </div>
        </header>

        {/* Main Layout: Sidebar + Chat */}
        <div className="flex flex-1 overflow-hidden">

          {/* Sidebar (desktop) */}
          <aside className="hidden lg:flex w-72 shrink-0 flex-col border-r border-gray-100 bg-white/40 backdrop-blur-sm">
            <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#9945FF]/5 border border-[#9945FF]/10">
                <div className="h-2 w-2 rounded-full bg-[#9945FF]" />
                <span className="text-sm font-medium text-gray-900">Current session</span>
              </div>

              {/* Quick Actions */}
              <div>
                <div className="neon-line mb-3" />
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest px-3 mb-2">Quick send</p>
                <div className="space-y-1 px-3">
                  {[
                    { label: 'Send SOL', cmd: 'send 0.01 SOL to Alice' },
                    { label: 'Send USDC', cmd: 'send 5 USDC to Bob for lunch' },
                    { label: 'Pay contact', cmd: 'pay Charlie 2 USDC' },
                  ].map((a) => (
                    <button
                      key={a.label}
                      onClick={() => handleSend(a.cmd)}
                      disabled={!publicKey || isParsing || isSending}
                      className="block w-full text-left text-sm text-gray-500 hover:text-gray-900 hover:bg-gray-50 rounded-lg px-2 py-1.5 transition-all disabled:opacity-30"
                    >
                      {a.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest px-3 mb-2">Quick swap</p>
                <div className="space-y-1 px-3">
                  {[
                    { label: 'Swap SOL → USDC', cmd: 'swap 2 SOL for USDC' },
                    { label: 'Swap USDC → BONK', cmd: 'swap 5 USDC for BONK' },
                  ].map((a) => (
                    <button
                      key={a.label}
                      onClick={() => handleSend(a.cmd)}
                      disabled={!publicKey || isParsing || isSending}
                      className="block w-full text-left text-sm text-gray-500 hover:text-gray-900 hover:bg-gray-50 rounded-lg px-2 py-1.5 transition-all disabled:opacity-30"
                    >
                      {a.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest px-3 mb-2">DCA & Timelock</p>
                <div className="space-y-1 px-3">
                  {[
                    { label: 'Recurring weekly', cmd: 'send 1 SOL to Alice every week' },
                    { label: 'Recurring daily', cmd: 'send 0.1 USDC to Bob every day for 30 days' },
                    { label: 'Timelock tomorrow', cmd: 'send 2 SOL to Charlie tomorrow at 3pm' },
                  ].map((a) => (
                    <button
                      key={a.label}
                      onClick={() => handleSend(a.cmd)}
                      disabled={!publicKey || isParsing || isSending}
                      className="block w-full text-left text-sm text-gray-500 hover:text-gray-900 hover:bg-gray-50 rounded-lg px-2 py-1.5 transition-all disabled:opacity-30"
                    >
                      {a.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* My Vaults */}
              {vaults.length > 0 && (
                <div>
                  <div className="neon-line mb-3" />
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest px-3 mb-3">My DCA Vaults</p>
                  <div className="space-y-2 px-3">
                    {vaults.map((v) => (
                      <VaultCard
                        key={v.address}
                        vault={v}
                        onExecute={handleExecuteVault}
                        onClose={handleCloseVault}
                        isExecuting={executingVault === v.address}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* My Timelocks */}
              {timelocks.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest px-3 mb-3">My Timelocks</p>
                  <div className="space-y-2 px-3">
                    {timelocks.map((t) => (
                      <TimelockCard
                        key={t.address}
                        timelock={t}
                        onClaim={handleClaimTimelock}
                        isClaiming={claimingTimelock === t.address}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="border-t border-gray-100 px-4 py-3">
              <div className="text-xs text-gray-400 flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-[#14F195]" />
                Connected to devnet
              </div>
            </div>
          </aside>

          {/* Chat Area */}
          <div className="flex flex-1 flex-col min-w-0">

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4 scroll-smooth">
              <div className="mx-auto max-w-2xl w-full space-y-4">

                {messages.length === 0 && (
                  <div className="flex min-h-[60vh] items-center justify-center">
                    <div className="space-y-8 text-center animate-fade-in max-w-sm w-full">
                      <div className="flex justify-center gap-2">
                        {['bg-[#9945FF]', 'bg-[#14F195]', 'bg-[#9945FF]/60'].map((c, i) => (
                          <span key={i} className={`inline-block h-2.5 w-2.5 rounded-full ${c} animate-pulse`} style={{ animationDelay: `${i * 0.2}s` }} />
                        ))}
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">Ready to send</h3>
                        <p className="text-sm text-gray-500 leading-relaxed">
                          Type a command to send, swap, or schedule.<br />
                          {!publicKey && <span className="text-[#9945FF] font-medium">Connect your wallet first ↗</span>}
                        </p>
                      </div>
                      <div className="glass-card rounded-2xl p-5 text-left space-y-2">
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Try these commands</p>
                        {[
                          'send 0.01 SOL to Alice',
                          'swap 2 SOL for USDC',
                          'send 1 SOL to Alice every week',
                          'send 2 SOL to Charlie next Friday',
                        ].map((ex) => (
                          <button
                            key={ex}
                            onClick={() => handleSend(ex)}
                            disabled={!publicKey || isParsing || isSending}
                            className="block w-full text-left font-mono text-sm text-[#14F195]/70 hover:text-[#14F195] transition-colors py-1.5 px-3 rounded-lg hover:bg-black/[0.02] disabled:opacity-30 disabled:cursor-not-allowed"
                          >
                            &quot;{ex}&quot;
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {messages.map((msg, i) => (
                  <div key={msg.id} className="animate-fade-in-up" style={{ animationDelay: `${i * 0.04}s` }}>
                    <ChatMessage
                      message={msg}
                      pendingIntent={msg.id === pendingMsgId ? pendingIntent : undefined}
                      resolvedAddress={msg.intent ? resolveContact(msg.intent.recipientName ?? '') : undefined}
                      isSending={isSending}
                      voicePlaying={voicePlaying}
                      onConfirm={handleConfirm}
                      onCancel={handleCancel}
                      onVoice={handleVoice}
                      onSwapConfirm={handleSwapConfirm}
                      onDcaConfirm={handleDcaConfirm}
                      onTimelockConfirm={handleTimelockConfirm}
                    />
                  </div>
                ))}

                {isParsing && (
                  <div className="flex justify-start animate-fade-in">
                    <div className="glass-card rounded-2xl rounded-bl-sm px-5 py-3.5">
                      <div className="flex items-center gap-3 text-sm text-gray-500">
                        <span className="relative flex h-2.5 w-2.5">
                          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#9945FF] opacity-75" />
                          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[#9945FF]" />
                        </span>
                        Parsing your intent...
                      </div>
                    </div>
                  </div>
                )}

                <div ref={chatEndRef} />

              </div>
            </div>

            {/* Input */}
            <div className="shrink-0 border-t border-gray-100 bg-white/60 backdrop-blur-sm px-4 py-4">
              <div className="mx-auto max-w-2xl w-full relative">
                <ChatInput onSend={handleSend} disabled={!publicKey || isParsing || isSending} />
                {!publicKey && (
                  <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-white/80 backdrop-blur-sm text-sm text-gray-500 z-10">
                    Connect your wallet to start sending payments
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}
