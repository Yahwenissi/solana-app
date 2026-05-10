'use client'

import { useState } from 'react'

export function ChatInput({
  onSend,
  disabled,
}: {
  onSend: (text: string) => void
  disabled: boolean
}) {
  const [text, setText] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (text.trim() && !disabled) {
      onSend(text.trim())
      setText('')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2 glass-card-solid rounded-2xl px-4 py-3">
      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={
          disabled
            ? 'Connect your wallet to start...'
            : 'Type a command... (e.g. send 5 USDC to Alice)'
        }
        disabled={disabled}
        className="flex-1 bg-transparent px-2 py-2 text-sm text-gray-900 placeholder:text-gray-400 outline-none transition disabled:cursor-not-allowed disabled:opacity-50"
      />
      <button
        type="submit"
        disabled={!text.trim() || disabled}
        className="rounded-xl bg-gradient-to-r from-[#9945FF] to-[#7C3AED] px-5 py-2 text-sm font-medium text-white transition-all duration-200 hover:shadow-lg hover:shadow-purple-500/30 hover:scale-105 active:scale-95 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:shadow-none disabled:hover:scale-100"
      >
        Send
      </button>
    </form>
  )
}
