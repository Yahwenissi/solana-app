'use client'

import type { ChatMessage as ChatMessageType, TransactionIntent } from '../_lib/types'
import { TransactionPreview } from './TransactionPreview'
import { SwapPreview } from './SwapPreview'
import { DcaPreview } from './DcaPreview'
import { TimelockPreview } from './TimelockPreview'
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
  onSwapConfirm,
  onDcaConfirm,
  onTimelockConfirm,
}: {
  message: ChatMessageType
  pendingIntent?: TransactionIntent | null
  resolvedAddress?: string | null
  isSending?: boolean
  voicePlaying?: boolean
  onConfirm?: () => void
  onCancel?: () => void
  onVoice?: () => void
  onSwapConfirm?: (expectedOutput: number, slippage: number) => void
  onDcaConfirm?: () => void
  onTimelockConfirm?: (releaseTimestamp: number) => void
}) {
  const isUser = message.role === 'user'

  if (!isUser && message.txResult) {
    return (
      <div className="flex justify-start">
        <div className="max-w-[85%] min-w-0">
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

  const action = pendingIntent?.action

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[85%] min-w-0 rounded-2xl px-5 py-3.5 ${
          isUser
            ? 'bg-gradient-to-br from-[#9945FF] to-[#7C3AED] text-white rounded-br-sm shadow-lg shadow-purple-500/20'
            : 'glass-card text-gray-900 rounded-bl-sm'
        }`}
      >
        <p className="whitespace-pre-wrap text-sm leading-relaxed">
          {message.content}
        </p>

        {!isUser && pendingIntent && action === 'send' && (
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

        {!isUser && pendingIntent && action === 'swap' && onSwapConfirm && (
          <SwapPreview
            intent={pendingIntent}
            onConfirm={onSwapConfirm}
            onCancel={onCancel ?? (() => {})}
            isSending={isSending ?? false}
          />
        )}

        {!isUser && pendingIntent && action === 'dca' && onDcaConfirm && (
          <DcaPreview
            intent={pendingIntent}
            onConfirm={onDcaConfirm}
            onCancel={onCancel ?? (() => {})}
            isSending={isSending ?? false}
          />
        )}

        {!isUser && pendingIntent && action === 'timelock' && onTimelockConfirm && (
          <TimelockPreview
            intent={pendingIntent}
            onConfirm={onTimelockConfirm}
            onCancel={onCancel ?? (() => {})}
            isSending={isSending ?? false}
          />
        )}
      </div>
    </div>
  )
}
