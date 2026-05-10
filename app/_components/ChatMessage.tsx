'use client'

import type { ChatMessage as ChatMessageType, TransactionIntent } from '../_lib/types'
import { TransactionPreview } from './TransactionPreview'
import { TransactionResult } from './TransactionResult'

export function ChatMessage({
  message,
  pendingIntent,
  resolvedAddress,
  isSending,
  voicePlaying,
  onConfirm,
  onCancel,
  onVoice,
}: {
  message: ChatMessageType
  pendingIntent?: TransactionIntent | null
  resolvedAddress?: string | null
  isSending?: boolean
  voicePlaying?: boolean
  onConfirm?: () => void
  onCancel?: () => void
  onVoice?: () => void
}) {
  const isUser = message.role === 'user'

  if (!isUser && message.txResult) {
    return (
      <div className="flex justify-start">
        <div className="glass-card text-gray-900 rounded-bl-sm max-w-[80%] rounded-2xl px-4 py-3">
          <TransactionResult
            result={message.txResult}
            amount={message.intent?.amount ?? 0}
            token={message.intent?.token ?? 'SOL'}
            recipientName={message.intent?.recipientName ?? 'Unknown'}
            resolvedAddress={resolvedAddress ?? null}
          />
        </div>
      </div>
    )
  }

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-3 ${
          isUser
            ? 'bg-gradient-to-br from-[#9945FF] to-[#7C3AED] text-white rounded-br-sm shadow-lg shadow-purple-500/20'
            : 'glass-card text-gray-900 rounded-bl-sm'
        }`}
      >
        <p className="whitespace-pre-wrap text-sm leading-relaxed">
          {message.content}
        </p>

        {!isUser && pendingIntent && (
          <TransactionPreview
            intent={pendingIntent}
            resolvedAddress={resolvedAddress ?? null}
            onConfirm={onConfirm ?? (() => {})}
            onCancel={onCancel ?? (() => {})}
            onVoice={onVoice ?? (() => {})}
            isSending={isSending ?? false}
            voicePlaying={voicePlaying ?? false}
          />
        )}
      </div>
    </div>
  )
}
