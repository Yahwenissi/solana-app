'use client'

import Link from 'next/link'

const features = [
  {
    icon: (
      <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" />
      </svg>
    ),
    title: 'Natural language payments',
    desc: 'Just type "send 5 USDC to Alice" — the AI parses your intent and fires a real Solana transaction.',
  },
  {
    icon: (
      <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
      </svg>
    ),
    title: 'Voice transaction reads',
    desc: 'Every transaction is read back to you via AI voice before you sign. Powered by ElevenLabs.',
  },
  {
    icon: (
      <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
      </svg>
    ),
    title: 'Confirm before send',
    desc: 'AI parses the intent, you review it. Nothing leaves your wallet without your approval.',
  },
  {
    icon: (
      <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M7.864 4.243A7.5 7.5 0 0119.5 10.5c0 2.61-.648 5.476-1.693 8.506m-9.629 0c-.522-1.892-1.054-3.814-1.554-5.258m5.73 5.258c.251-.032.5-.064.745-.1m-6.92 0c-.09-.474-.17-.958-.248-1.452m7.168 1.452c.374-.06.74-.124 1.1-.193m-8.268 0a48.688 48.688 0 01-1.638-7.174m9.906 7.174c.392-.08.776-.168 1.152-.268M12 21a41.258 41.258 0 01-4.364-.5m4.364.5c1.456-.04 2.898-.155 4.308-.328M12 21c3.14-.33 6.11-.976 8.83-1.864M4.5 10.5c0-2.584.623-5.298 1.79-7.257m0 0A9.76 9.76 0 0112 2.25c1.89 0 3.644.516 5.16 1.416M6.29 3.243l.027-.016a.5.5 0 01.424.024M6.29 3.243A48.99 48.99 0 004.89 5.328" />
      </svg>
    ),
    title: 'On-chain, always',
    desc: 'Every payment is a real Solana transaction. Verify it instantly on Solana Explorer.',
  },
]

const steps = [
  { step: '01', title: 'Connect your Phantom wallet', desc: 'One click. No seed phrase sharing.' },
  { step: '02', title: 'Type a payment command', desc: 'Natural language — amounts, tokens, recipients.' },
  { step: '03', title: 'AI parses your intent', desc: 'Claude extracts amount, token, and recipient instantly.' },
  { step: '04', title: 'Confirm & send', desc: 'Review the parsed transaction, then approve it. Done.' },
]

export default function LandingPage() {
  return (
    <div className="relative z-10 min-h-screen flex flex-col">

      {/* Floating Orbs */}
      <div className="floating-orb floating-orb--purple" style={{ top: '-5%', left: '-5%' }} />
      <div className="floating-orb floating-orb--teal" style={{ top: '40%', right: '-10%' }} />
      <div className="floating-orb floating-orb--pink" style={{ bottom: '-5%', left: '30%' }} />

      {/* Grid Background */}
      <div className="fixed inset-0 bg-grid pointer-events-none z-0" />

      {/* Glass Nav */}
      <header className="glass-nav sticky top-0 z-50 flex items-center justify-between px-6 py-3">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-[#9945FF] to-[#14F195] flex items-center justify-center text-sm font-bold text-black">
            S
          </div>
          <span className="font-semibold text-gray-900 tracking-tight">SolanaChat</span>
          <span className="hidden sm:inline-flex ml-2 items-center gap-1.5 rounded-full border border-gray-200 bg-gray-50/50 px-3 py-0.5 text-xs text-gray-500">
            <span className="h-1.5 w-1.5 rounded-full bg-[#14F195]" />
            Devnet
          </span>
        </div>
        <nav className="hidden sm:flex items-center gap-8 text-sm text-gray-500">
          <a href="#features" className="hover:text-gray-900 transition-colors font-medium">Features</a>
          <a href="#how" className="hover:text-gray-900 transition-colors font-medium">How it works</a>
        </nav>
        <Link
          href="/chat"
          className="btn-neon px-5 py-2 text-sm inline-flex items-center gap-2"
        >
          Launch app
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
          </svg>
        </Link>
      </header>

      {/* Hero */}
      <section className="relative flex flex-1 flex-col items-center justify-center px-6 pt-28 pb-20 text-center">
        <div className="animate-fade-in-up mb-6 inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white/60 backdrop-blur-sm px-4 py-1.5 text-xs text-gray-500">
          <span className="h-1.5 w-1.5 rounded-full bg-[#14F195] animate-pulse" />
          AI-powered · Built on Solana
        </div>

        <h1 className="animate-fade-in-up max-w-3xl text-5xl font-bold leading-[1.08] tracking-tight text-gray-900 sm:text-6xl lg:text-7xl" style={{ animationDelay: '0.05s' }}>
          Pay anyone on Solana{' '}
          <span className="gradient-text">with plain English</span>
        </h1>

        <p className="animate-fade-in-up mt-6 max-w-xl text-lg text-gray-500 leading-relaxed" style={{ animationDelay: '0.1s' }}>
          An AI agent that understands what you mean, confirms what it heard, and sends the transaction — all from a single chat message.
        </p>

        <div className="animate-fade-in-up mt-10 flex flex-col items-center gap-4 sm:flex-row" style={{ animationDelay: '0.15s' }}>
          <Link
            href="/chat"
            className="btn-neon px-8 py-3.5 text-base inline-flex items-center gap-2"
          >
            Try it now
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </Link>
          <a
            href="https://github.com/Yahwenissi/solana-app"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-2xl border border-gray-200 bg-white/50 backdrop-blur-sm px-8 py-3.5 text-base font-semibold text-gray-600 hover:text-gray-900 hover:border-gray-300 transition-all"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
            </svg>
            View on GitHub
          </a>
        </div>

        {/* Demo Preview Card */}
        <div className="animate-fade-in-up mt-16 glass-card rounded-2xl px-6 py-5 text-left max-w-md w-full" style={{ animationDelay: '0.2s' }}>
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Example</span>
            <div className="h-px flex-1 bg-gray-100" />
          </div>
          <div className="flex items-start gap-3">
            <span className="text-xs text-gray-400 pt-1 font-mono font-medium">You</span>
            <p className="font-mono text-sm text-[#14F195] font-medium">&quot;send 5 USDC to Alice for coffee&quot;</p>
          </div>
          <div className="mt-4 flex items-start gap-3">
            <span className="text-xs text-gray-400 pt-1 font-mono font-medium">AI</span>
            <p className="text-sm text-gray-600">I&apos;ll send <span className="text-gray-900 font-semibold">5 USDC</span> to <span className="text-gray-900 font-semibold">Alice</span>. Confirm?</p>
          </div>
          <div className="mt-4 flex gap-2">
            <span className="rounded-lg bg-[#9945FF]/10 border border-[#9945FF]/20 px-3 py-1 text-xs font-semibold text-[#9945FF] inline-flex items-center gap-1">
              <svg className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>
              Confirm
            </span>
            <span className="rounded-lg border border-gray-200 px-3 py-1 text-xs text-gray-400 font-medium">Cancel</span>
            <span className="rounded-lg border border-gray-200 px-3 py-1 text-xs text-gray-400 font-medium inline-flex items-center gap-1">
              <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
              </svg>
              Voice
            </span>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="relative px-6 py-24">
        <div className="mx-auto max-w-5xl">
          <div className="text-center mb-16">
            <span className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white/60 backdrop-blur-sm px-4 py-1.5 text-xs text-gray-500 mb-6">
              What it does
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
              Powerful features,{' '}
              <span className="gradient-text">simple interface</span>
            </h2>
            <p className="mt-4 text-gray-500 text-sm max-w-lg mx-auto">
              SolanaChat combines AI with Solana to make sending crypto as easy as chatting.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            {features.map((f, i) => (
              <div
                key={f.title}
                className="glass-card glass-card-hover rounded-2xl p-7 animate-fade-in-up"
                style={{ animationDelay: `${0.05 * i}s` }}
              >
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-[#9945FF]/10 text-[#9945FF]">
                  {f.icon}
                </div>
                <h3 className="mb-2 text-lg font-semibold text-gray-900">{f.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="relative px-6 py-24 border-t border-gray-100">
        <div className="mx-auto max-w-2xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white/60 backdrop-blur-sm px-4 py-1.5 text-xs text-gray-500 mb-6">
            How it works
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-16">
            From intent to{' '}
            <span className="gradient-text">transaction</span>
          </h2>
          <div className="space-y-0 text-left">
            {steps.map((s, i) => (
              <div key={s.step} className="glass-card glass-card-hover rounded-2xl p-5 mb-4 animate-fade-in-up" style={{ animationDelay: `${0.07 * i}s` }}>
                <div className="flex gap-5">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#9945FF]/10 text-xs font-bold text-[#9945FF] font-mono">
                    {s.step}
                  </span>
                  <div>
                    <p className="font-semibold text-gray-900 mb-1">{s.title}</p>
                    <p className="text-sm text-gray-500">{s.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative px-6 py-24 text-center">
        <div className="mx-auto max-w-xl">
          <div className="glass-card rounded-3xl p-12 animate-scale-in">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#9945FF] to-[#14F195] text-xl font-bold text-black mb-6">
              S
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-3">Ready to send?</h2>
            <p className="text-gray-500 mb-8 text-sm">Connect your wallet and try it on Solana devnet — free test SOL included.</p>
            <Link
              href="/chat"
              className="btn-neon px-10 py-3.5 text-base inline-flex items-center gap-2"
            >
              Open the agent
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative border-t border-gray-100 bg-white/50 backdrop-blur-sm px-6 py-8">
        <div className="mx-auto max-w-5xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded bg-gradient-to-br from-[#9945FF] to-[#14F195] flex items-center justify-center text-xs font-bold text-black">S</div>
            <span className="text-sm text-gray-500 font-medium">SolanaChat</span>
          </div>
          <p className="text-xs text-gray-400 text-center">
            Built by Ness for Dev3pack Global Hackathon · Powered by Solana + Claude AI + ElevenLabs
          </p>
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <span className="h-1.5 w-1.5 rounded-full bg-[#14F195]" />
            Devnet
            <a href="https://github.com/Yahwenissi/solana-app" target="_blank" rel="noopener noreferrer" className="hover:text-gray-700 transition-colors ml-2">
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
            </a>
          </div>
        </div>
      </footer>

    </div>
  )
}
