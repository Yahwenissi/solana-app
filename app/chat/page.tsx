'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { WalletButton } from '../_components/WalletButton'
import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import { LAMPORTS_PER_SOL } from '@solana/web3.js'
import { ChatMessage } from '../_components/ChatMessage'
import { ChatInput } from '../_components/ChatInput'
import { resolveContact } from '../_lib/contacts'
import { sendPayment } from '@/lib/sendPayment'
import type { ChatMessage as ChatMessageType, TransactionIntent } from '../_lib/types'

function speak(text: string, onEnd?: () => void) {
  const utterance = new SpeechSynthesisUtterance(text)
  if (onEnd) utterance.onend = onEnd
  utterance.onerror = onEnd ?? null
  speechSynthesis.speak(utterance)
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
        setMessages((prev) => [...prev, {
          id: msgId, role: 'assistant',
          content: `I'll help you send **${intent.amount} ${intent.token}** to **${intent.recipientName}**.`,
          intent,
        }])
        setPendingIntent(intent)
        setPendingMsgId(msgId)
      } else {
        setMessages((prev) => [...prev, {
          id: msgId, role: 'assistant',
          content: "Sorry, I couldn't understand that. Try something like:\n\n`send 5 USDC to Alice`",
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
    speak(
      `You are about to send ${pendingIntent.amount} ${pendingIntent.token} to ${pendingIntent.recipientName}. Confirm?`,
      () => setVoicePlaying(false),
    )
  }, [pendingIntent])

  const handleConfirm = useCallback(async () => {
    if (!pendingIntent || !publicKey || !sendTransaction) return
    setIsSending(true)
    try {
      const resolved = resolveContact(pendingIntent.recipientName)
      if (!resolved) {
        setMessages((prev) => [...prev, {
          id: crypto.randomUUID(), role: 'assistant',
          content: `Could not resolve "${pendingIntent.recipientName}" to a Solana address. Available contacts: Alice, Bob, Charlie.`,
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
  }, [pendingIntent, publicKey, sendTransaction, connection])

  const handleCancel = useCallback(() => {
    setPendingIntent(null)
    setPendingMsgId(null)
  }, [])

  return (
    <div className="relative z-10 mx-auto flex h-screen max-w-2xl flex-col">

      {/* Header */}
      <header className="flex shrink-0 items-center justify-between border-b border-gray-200 px-4 py-3 glass-card-solid rounded-b-2xl mx-2 mt-2">
        <div className="flex items-center gap-3">
          <Link href="/" className="text-gray-400 hover:text-gray-600 transition-colors text-sm">
            ← back
          </Link>
          <div className="h-4 w-px bg-gray-200" />
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-[#14F195] animate-pulse" />
            <span className="text-sm font-semibold gradient-text">SolanaChat</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {publicKey && (
            <div className="hidden sm:flex items-center gap-1.5 rounded-xl border border-gray-200 bg-black/[0.02] px-3 py-1.5">
              <span className="text-xs text-gray-400 font-mono">SOL</span>
              <span className={`text-sm text-gray-700 font-mono font-medium ${balanceLoading ? 'opacity-40' : ''}`}>
                {balance !== null ? balance.toFixed(4) : '---'}
              </span>
            </div>
          )}
          <WalletButton />
        </div>
      </header>

      {/* Chat area */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 scroll-smooth">
        {messages.length === 0 && (
          <div className="flex h-full min-h-[60vh] items-center justify-center">
            <div className="space-y-6 text-center animate-fade-in max-w-sm">
              <div className="flex justify-center gap-1.5">
                {['bg-[#9945FF]/60', 'bg-[#14F195]/60', 'bg-[#9945FF]/40'].map((c, i) => (
                  <span key={i} className={`inline-block h-2.5 w-2.5 rounded-full ${c} animate-pulse`} style={{ animationDelay: `${i * 0.2}s` }} />
                ))}
              </div>
              <div>
                <p className="text-base text-gray-500 font-medium mb-1">Ready to send</p>
                <p className="text-sm text-gray-400 leading-relaxed">
                  Type a payment command below.<br />
                  {!publicKey && <span className="text-[#9945FF]/70">Connect your wallet first ↗</span>}
                </p>
              </div>
              <div className="text-left rounded-2xl border border-gray-200 bg-black/[0.02] p-4 space-y-2">
                <p className="text-xs text-gray-400 font-mono uppercase tracking-widest mb-3">Try these</p>
                {[
                  'send 0.01 SOL to Alice',
                  'send 5 USDC to Bob for lunch',
                  'pay Charlie 2 USDC',
                ].map((ex) => (
                  <button
                    key={ex}
                    onClick={() => handleSend(ex)}
                    disabled={!publicKey || isParsing || isSending}
                    className="block w-full text-left font-mono text-xs text-[#14F195]/70 hover:text-[#14F195] transition-colors py-1 disabled:opacity-30 disabled:cursor-not-allowed"
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
              resolvedAddress={msg.intent ? resolveContact(msg.intent.recipientName) : undefined}
              isSending={isSending}
              voicePlaying={voicePlaying}
              onConfirm={handleConfirm}
              onCancel={handleCancel}
              onVoice={handleVoice}
            />
          </div>
        ))}

        {isParsing && (
          <div className="flex justify-start animate-fade-in">
            <div className="glass-card rounded-2xl rounded-bl-sm px-4 py-3">
              <div className="flex items-center gap-3 text-sm text-gray-400">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#9945FF] opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-[#9945FF]" />
                </span>
                Parsing intent...
              </div>
            </div>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Input */}
      <div className="mx-2 mb-2 shrink-0">
        <div className="relative">
          <ChatInput onSend={handleSend} disabled={!publicKey || isParsing || isSending} />
          {!publicKey && (
            <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-white/80 backdrop-blur-sm text-sm text-gray-400">
              Connect wallet to send payments
            </div>
          )}
        </div>
      </div>

    </div>
  )
}
