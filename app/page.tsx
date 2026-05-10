'use client'

import Link from 'next/link'

const features = [
  {
    icon: '⚡',
    title: 'Natural language payments',
    desc: 'Just type "send 5 USDC to Alice" — the AI parses your intent and fires a real Solana transaction.',
  },
  {
    icon: '🔊',
    title: 'Voice confirmation',
    desc: 'Every transaction is read back to you before you confirm. Powered by ElevenLabs text-to-speech.',
  },
  {
    icon: '🔗',
    title: 'On-chain, always',
    desc: 'Every payment is a real Solana transaction. Verify it instantly on Solana Explorer.',
  },
  {
    icon: '🛡️',
    title: 'Confirm before send',
    desc: 'AI parses the intent, you approve it. Nothing leaves your wallet without your tap.',
  },
]

export default function LandingPage() {
  return (
    <div className="relative z-10 min-h-screen flex flex-col">

      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 glass-card-solid border-b border-gray-100 sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-[#9945FF] to-[#14F195] flex items-center justify-center text-sm font-bold text-black select-none">
            S
          </div>
          <span className="font-bold text-gray-900 tracking-tight">SolanaChat</span>
        </div>
        <nav className="hidden sm:flex items-center gap-6 text-sm text-gray-400">
          <a href="#features" className="hover:text-gray-700 transition-colors">Features</a>
          <a href="#how" className="hover:text-gray-700 transition-colors">How it works</a>
        </nav>
        <Link
          href="/chat"
          className="rounded-xl bg-[#9945FF] px-4 py-2 text-sm font-semibold text-white hover:bg-[#8833ee] transition-colors animate-pulse-glow"
        >
          Launch app →
        </Link>
      </header>

      {/* Hero */}
      <section className="flex flex-1 flex-col items-center justify-center px-6 pt-24 pb-16 text-center">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-4 py-1.5 text-xs text-gray-500 animate-fade-in">
          <span className="h-1.5 w-1.5 rounded-full bg-[#14F195] animate-pulse" />
          Built on Solana · Devnet
        </div>

        <h1 className="animate-fade-in-up max-w-2xl text-5xl font-bold leading-[1.1] tracking-tight text-gray-900 sm:text-6xl" style={{ animationDelay: '0.05s' }}>
          Pay anyone on Solana{' '}
          <span className="gradient-text">with plain English</span>
        </h1>

        <p className="animate-fade-in-up mt-6 max-w-xl text-lg text-gray-400 leading-relaxed" style={{ animationDelay: '0.1s' }}>
          An AI agent that understands what you mean, confirms what it heard, and sends the transaction — all from a single chat message.
        </p>

        <div className="animate-fade-in-up mt-10 flex flex-col items-center gap-4 sm:flex-row" style={{ animationDelay: '0.15s' }}>
          <Link
            href="/chat"
            className="group relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#9945FF] to-[#7c35dd] px-8 py-4 text-base font-semibold text-white shadow-lg shadow-[#9945FF]/20 hover:shadow-[#9945FF]/40 transition-all duration-300"
          >
            <span className="relative z-10">Try it now →</span>
            <div className="absolute inset-0 bg-gradient-to-r from-[#14F195]/0 to-[#14F195]/10 opacity-0 group-hover:opacity-100 transition-opacity" />
          </Link>
          <a
            href="https://github.com/Yahwenissi/solana-app"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-2xl border border-gray-200 px-8 py-4 text-base font-semibold text-gray-600 hover:text-gray-900 hover:border-gray-300 transition-all"
          >
            View on GitHub
          </a>
        </div>

        {/* Demo pill */}
        <div className="animate-fade-in-up mt-14 rounded-2xl border border-gray-200 glass-card px-6 py-4 text-left max-w-sm w-full" style={{ animationDelay: '0.2s' }}>
          <p className="text-xs text-gray-400 mb-3 font-mono uppercase tracking-widest">Example command</p>
          <div className="flex items-start gap-3">
            <span className="text-xs text-gray-400 pt-0.5 font-mono">you</span>
            <p className="font-mono text-sm text-[#14F195]">&quot;send 5 USDC to Alice for coffee&quot;</p>
          </div>
          <div className="mt-3 flex items-start gap-3">
            <span className="text-xs text-gray-400 pt-0.5 font-mono">ai</span>
            <p className="text-sm text-gray-700">I'll send <span className="text-gray-900 font-medium">5 USDC</span> to <span className="text-gray-900 font-medium">Alice</span>. Confirm?</p>
          </div>
          <div className="mt-3 flex gap-2">
            <span className="rounded-lg bg-[#9945FF]/20 border border-[#9945FF]/30 px-3 py-1 text-xs text-[#9945FF] font-medium">✓ Confirm</span>
            <span className="rounded-lg bg-gray-50 border border-gray-200 px-3 py-1 text-xs text-gray-400">✕ Cancel</span>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="px-6 py-20">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-center text-sm font-semibold uppercase tracking-widest text-gray-400 mb-12">What it does</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {features.map((f, i) => (
              <div
                key={f.title}
                className="glass-card rounded-2xl p-6 animate-fade-in-up"
                style={{ animationDelay: `${0.05 * i}s` }}
              >
                <div className="mb-3 text-2xl">{f.icon}</div>
                <h3 className="mb-2 font-semibold text-gray-900">{f.title}</h3>
                <p className="text-sm text-gray-400 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="px-6 py-20 border-t border-gray-100">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-gray-400 mb-12">How it works</h2>
          <div className="space-y-0">
            {[
              { step: '01', title: 'Connect your Phantom wallet', desc: 'One click. No seed phrase sharing.' },
              { step: '02', title: 'Type a payment command', desc: 'Natural language — amounts, tokens, recipients.' },
              { step: '03', title: 'AI parses your intent', desc: 'Claude extracts amount, token, and recipient instantly.' },
              { step: '04', title: 'Confirm & send', desc: 'Review the parsed transaction, then approve it. Done.' },
            ].map((s, i) => (
              <div key={s.step} className="flex gap-6 text-left py-6 border-b border-gray-100 last:border-0 animate-fade-in-up" style={{ animationDelay: `${0.07 * i}s` }}>
                <span className="font-mono text-xs text-gray-300 pt-1 min-w-[28px]">{s.step}</span>
                <div>
                  <p className="font-semibold text-gray-800 mb-1">{s.title}</p>
                  <p className="text-sm text-gray-400">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-20 text-center">
        <div className="mx-auto max-w-xl glass-card rounded-3xl p-10">
          <h2 className="text-3xl font-bold text-gray-900 mb-3">Ready to send?</h2>
          <p className="text-gray-400 mb-8 text-sm">Connect your wallet and try it on Solana devnet — free test SOL included.</p>
          <Link
            href="/chat"
            className="inline-block rounded-2xl bg-gradient-to-r from-[#9945FF] to-[#7c35dd] px-10 py-4 font-semibold text-white shadow-lg shadow-[#9945FF]/20 hover:shadow-[#9945FF]/40 transition-all duration-300"
          >
            Open the agent →
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 px-6 py-8">
        <div className="mx-auto max-w-4xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="h-5 w-5 rounded bg-gradient-to-br from-[#9945FF] to-[#14F195] flex items-center justify-center text-xs font-bold text-black">S</div>
            <span className="text-sm text-gray-400 font-medium">SolanaChat</span>
          </div>
          <p className="text-xs text-gray-300 text-center">
            Built by Ness for Dev3pack Global Hackathon · Powered by Solana + Claude AI + ElevenLabs
          </p>
          <div className="flex items-center gap-1 text-xs text-gray-300">
            <span className="h-1.5 w-1.5 rounded-full bg-[#14F195]" />
            Devnet
          </div>
        </div>
      </footer>

    </div>
  )
}
