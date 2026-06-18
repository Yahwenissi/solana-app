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
    <form onSubmit={handleSubmit} className="flex items-center gap-2 glass-card-solid rounded-2xl px-4 py-3 shadow-sm border border-gray-200/80">
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
        className="flex-1 bg-transparent px-2 py-2 text-sm text-gray-900 placeholder:text-gray-400 outline-none transition disabled:cursor-not-allowed disabled:opacity-50 font-medium"
      />
      <button
        type="submit"
        disabled={!text.trim() || disabled}
        className="btn-neon px-5 py-2 text-sm inline-flex items-center gap-2 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:shadow-none disabled:hover:translate-y-0"
      >
        Send
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
        </svg>
      </button>
    </form>
  )
}
