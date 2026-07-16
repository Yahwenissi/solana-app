'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'

const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ01>_#'

function useDecodeText(target: string, delay = 0) {
  const [text, setText] = useState('')
  useEffect(() => {
    const t = setTimeout(() => {
      let frame = 0
      const total = 18
      const iv = setInterval(() => {
        frame++
        const revealed = Math.floor((frame / total) * target.length)
        setText(
          target
            .split('')
            .map((ch, i) =>
              ch === ' ' ? ' ' : i < revealed ? ch : CHARS[Math.floor(Math.random() * CHARS.length)]
            )
            .join('')
        )
        if (frame >= total) { setText(target); clearInterval(iv) }
      }, 40)
    }, delay)
    return () => clearTimeout(t)
  }, [target, delay])
  return text
}

function DecodeSpan({ text, delay }: { text: string; delay?: number }) {
  return <span>{useDecodeText(text, delay)}</span>
}

const ease = [0.16, 1, 0.3, 1] as const

function Reveal({ children, delay = 0, className = '' }: { children: React.ReactNode; delay?: number; className?: string }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.6, ease, delay }}
    >
      {children}
    </motion.div>
  )
}

const tickerItems = [
  { text: 'send 1 SOL to Bob every week', status: 'scheduled' },
  { text: 'auto-compound my JitoSOL', status: 'live' },
  { text: 'swap 2 SOL for USDC', status: 'executed' },
  { text: 'stop-loss my JUP at $0.42', status: 'armed' },
  { text: 'allow SolanaChat 50 USDC monthly', status: 'approved' },
]

const capabilities = [
  { title: 'DCA vaults', desc: 'Set a schedule once; it runs on-chain until you stop it.' },
  { title: 'Auto-compounding', desc: 'Yield gets restaked automatically \u2014 no manual claim-and-redeposit.' },
  { title: 'Stop-losses', desc: 'Set a floor. SolanaChat watches the price so you don\u2019t have to.' },
  { title: 'Allowances & subscriptions', desc: 'Approve exactly what SolanaChat can move, and nothing more.' },
]

const trustCards = [
  { title: 'Non-custodial by design', desc: 'SolanaChat never holds your keys or funds. You sign every transaction.' },
  { title: 'Open execution', desc: 'Every transaction is previewed, signed by you, and verifiable on Solana Explorer.' },
  { title: 'Native to Solana', desc: 'Built on Solana\u2019s Allowances & Subscriptions primitive \u2014 not a bolted-on scheduler.' },
]

const protocols = ['Jupiter', 'Kamino', 'Drift', 'JitoSOL']

const bars = [
  { label: 'DCA', height: '62%', color: 'bar-purple', delay: '0.1s' },
  { label: 'Compound', height: '88%', color: 'bar-green', delay: '0.4s' },
  { label: 'Stop-loss', height: '40%', color: 'bar-gray', delay: '0.2s' },
  { label: 'Vault', height: '100%', color: 'bar-purple', delay: '0.6s' },
  { label: 'Allowance', height: '54%', color: 'bar-gray', delay: '0.3s' },
  { label: 'Swap', height: '70%', color: 'bar-green', delay: '0.5s' },
  { label: 'Yield', height: '47%', color: 'bar-purple', delay: '0.15s' },
]

interface BotMessage { role: 'bot'; title: string; chip: string; rows: { k: string; v: string; color?: string }[] }
interface UserMessage { role: 'user'; text: string }

const chatMessages: (UserMessage | BotMessage)[] = [
  { role: 'user', text: 'send 1 SOL to Bob every week' },
  { role: 'bot', title: 'DCA vault preview', chip: 'native', rows: [{ k: 'Amount', v: '1 SOL' }, { k: 'Recipient', v: 'Bob' }, { k: 'Cadence', v: 'Weekly' }] },
  { role: 'user', text: 'auto-compound my JitoSOL' },
  { role: 'bot', title: 'Vault created', chip: 'jitosol', rows: [{ k: 'Status', v: 'confirmed', color: 'var(--green)' }, { k: 'Explorer', v: 'view tx \u2197', color: 'var(--purple)' }] },
]

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false)
  const [displayTotal, setDisplayTotal] = useState(128430)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const iv = setInterval(() => {
      setDisplayTotal(prev => prev + Math.floor(Math.random() * 900) + 100)
    }, 2600)
    return () => clearInterval(iv)
  }, [])

  return (
    <div className="relative z-10">

      {/* ─── Nav ─── */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8 py-[18px] transition-all duration-250 border-b ${
          scrolled
            ? 'bg-[rgba(13,13,15,0.86)] backdrop-blur-md border-[#28282E]'
            : 'bg-transparent border-transparent'
        }`}
      >
        <div className="flex items-center gap-[10px] text-[15px] font-semibold text-[#F5F5F7]" style={{ fontFamily: "'Unbounded',sans-serif" }}>
          <span className="w-[26px] h-[26px] shrink-0">
            <svg viewBox="0 0 26 26" fill="none">
              <rect width="26" height="26" rx="7" fill="#151518" stroke="#28282E" />
              <path d="M8 9L12 13L8 17" stroke="#9945FF" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
              <rect x="15" y="11" width="4" height="6" rx="1.4" fill="#14F195" />
            </svg>
          </span>
          SolanaChat
        </div>
        <div className="hidden md:flex items-center gap-[30px] text-[13px] text-[#9A9AA5]">
          <a href="#demo" className="hover:text-[#F5F5F7] transition-colors">Product</a>
          <a href="#protocols" className="hover:text-[#F5F5F7] transition-colors">Protocols</a>
          <a href="#partners" className="hover:text-[#F5F5F7] transition-colors">Security</a>
          <a href="#" className="hover:text-[#F5F5F7] transition-colors">Docs</a>
        </div>
        <a href="https://forms.gle/F4rNzHNNesDGiQnd8" target="_blank" rel="noopener noreferrer" className="btn btn-primary" style={{ padding: '10px 16px', fontSize: '12px' }}>
          Join waitlist
        </a>
      </nav>

      {/* ─── Hero ─── */}
      <section className="pt-[150px] pb-0 px-8 text-center">
        <div className="max-w-[760px] mx-auto">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <span className="stamp-tag"><span className="dot"></span>Live on Solana devnet</span>
          </motion.div>
          <h1 className="text-[58px] leading-[1.12] font-bold tracking-[-0.01em] mt-[22px] mb-[22px] text-[#F5F5F7]" style={{ fontFamily: "'Unbounded',sans-serif" }}>
            <span className="block">
              <DecodeSpan text="Your on-chain" delay={200} />
              <span className="stamp">CFO</span>
            </span>
            <span className="block">
              <DecodeSpan text="for Solana." delay={700} />
            </span>
          </h1>
          <motion.p
            className="text-[16.5px] leading-[1.65] text-[#9A9AA5] max-w-[520px] mx-auto mb-[34px]"
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}
          >
            Type a command. SolanaChat turns it into automated on-chain execution &mdash; DCAs, auto-compounding, stop-losses, allowances &mdash; across Jupiter, Kamino, Drift and JitoSOL.
          </motion.p>
          <motion.div
            className="flex gap-[14px] justify-center mb-[64px]"
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }}
          >
            <a href="https://forms.gle/F4rNzHNNesDGiQnd8" target="_blank" rel="noopener noreferrer" className="btn btn-primary">Join the waitlist</a>
            <a href="#demo" className="btn btn-ghost">See it in action</a>
          </motion.div>
        </div>

        {/* ─── Skyline Ledger ─── */}
        <motion.div
          className="ledger"
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.4 }}
        >
          <div className="ledger-top">
            <span className="ledger-label">Live ledger &mdash; automated positions</span>
            <span className="ledger-total">${displayTotal.toLocaleString()}</span>
          </div>
          <div className="skyline">
            <div className="scanline"></div>
            {bars.map((b) => (
              <div className="bar-col" key={b.label}>
                <div className={`bar ${b.color}`} style={{ height: b.height, animationDelay: b.delay }}></div>
                <span className="bar-tag">{b.label}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* ─── Ticker ─── */}
        <div className="ticker-strip">
          <div className="ticker-track">
            {[...tickerItems, ...tickerItems].map((item, i) => (
              <span key={i}>
                <i>&gt;</i> {item.text} <b>&middot; {item.status}</b>
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Problem ─── */}
      <section className="pt-[100px] pb-[100px] px-8">
        <div className="max-w-[740px] mx-auto">
          <Reveal>
            <span className="mono text-[11px] text-[#54545C] uppercase tracking-[0.08em] mb-[20px] block">The problem</span>
            <p className="text-[25px] leading-[1.55] font-medium tracking-[-0.01em] text-[#F5F5F7]" style={{ fontFamily: "'Unbounded',sans-serif" }}>
              Right now, managing a Solana portfolio means logging into Jupiter for swaps, Kamino for yield, Drift for hedges, and doing the rest by hand. SolanaChat collapses that into <span className="hi">one conversation</span>.
            </p>
          </Reveal>
        </div>
      </section>

      {/* ─── Demo ─── */}
      <section className="pt-[20px] pb-[120px] px-8" id="demo">
        <Reveal className="text-center max-w-[560px] mx-auto mb-[44px]">
          <h2 className="text-[30px] font-semibold tracking-[-0.01em] mb-[12px] text-[#F5F5F7]" style={{ fontFamily: "'Unbounded',sans-serif" }}>Just say what you want.</h2>
          <p className="text-[14.5px] text-[#9A9AA5]">Every action is previewed before it&apos;s signed. Nothing executes without your confirmation.</p>
        </Reveal>
        <div className="chatpanel">
          {chatMessages.map((msg, i) => (
            <motion.div
              key={i}
              className={`msg ${msg.role}`}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.16 }}
            >
              {msg.role === 'user' ? (
                <div className="bubble mono">{msg.text}</div>
              ) : (
                <div className="bubble">
                  <div className="bot-card-title">
                    {msg.title}
                    <span className="chip">{msg.chip}</span>
                  </div>
                  {msg.rows.map((row, j) => (
                    <div className="row" key={j}>
                      <span>{row.k}</span>
                      <b style={row.color ? { color: row.color } : undefined}>{row.v}</b>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          ))}
        </div>
        <p className="caption">Nothing executes without your confirmation.</p>
      </section>

      {/* ─── Capabilities ─── */}
      <section className="pt-[20px] pb-[120px] px-8">
        <div className="cap-grid">
          {capabilities.map((c, i) => (
            <motion.div
              key={c.title}
              className="cap-card"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
            >
              <div className="cap-icon">
                <span className="chev">&gt;</span>
                <span className="blk"><i></i></span>
              </div>
              <h3>{c.title}</h3>
              <p>{c.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ─── Protocols ─── */}
      <section className="pt-[20px] pb-[110px] px-8 text-center" id="protocols">
        <Reveal>
          <span className="mono text-[11px] text-[#54545C] uppercase tracking-[0.08em] mb-[30px] block">Built on the protocols already securing billions</span>
          <div className="badge-row">
            {protocols.map((p) => (
              <span className="proto-badge" key={p}>{p}</span>
            ))}
          </div>
        </Reveal>
      </section>

      {/* ─── Partners / Trust ─── */}
      <section className="pt-[20px] pb-[120px] px-8" id="partners">
        <div className="max-w-[900px] mx-auto">
          <Reveal>
            <span className="mono text-[11px] text-[#54545C] uppercase tracking-[0.08em] block mb-[10px]">Why you can trust it</span>
            <div className="trust-grid">
              {trustCards.map((c) => (
                <div className="trust-card" key={c.title}>
                  <div className="trust-icon">&#9670;</div>
                  <h4>{c.title}</h4>
                  <p>{c.desc}</p>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="border-t border-[#28282E] pt-[56px] pb-[28px] px-8">
        <div className="max-w-[1160px] mx-auto">
          <div className="grid grid-cols-[1.3fr_1fr_1fr_1fr] gap-8 pb-10 max-md:grid-cols-2">
            <div>
              <div className="flex items-center gap-[10px] text-[15px] font-semibold text-[#F5F5F7]" style={{ fontFamily: "'Unbounded',sans-serif" }}>
                <span className="w-[26px] h-[26px] shrink-0">
                  <svg viewBox="0 0 26 26" fill="none">
                    <rect width="26" height="26" rx="7" fill="#151518" stroke="#28282E" />
                    <path d="M8 9L12 13L8 17" stroke="#9945FF" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
                    <rect x="15" y="11" width="4" height="6" rx="1.4" fill="#14F195" />
                  </svg>
                </span>
                SolanaChat
              </div>
              <p className="text-[12.5px] text-[#54545C] mt-[10px] max-w-[220px] leading-[1.5]">Your on-chain CFO for Solana.</p>
            </div>
            <div>
              <h5 className="mono text-[11px] uppercase tracking-[0.06em] text-[#54545C] mb-[14px]">Product</h5>
              <a href="#" className="block text-[13.5px] text-[#9A9AA5] mb-[10px] hover:text-[#F5F5F7]">Capabilities</a>
              <a href="#protocols" className="block text-[13.5px] text-[#9A9AA5] mb-[10px] hover:text-[#F5F5F7]">Protocols</a>
              <a href="#partners" className="block text-[13.5px] text-[#9A9AA5] mb-[10px] hover:text-[#F5F5F7]">Security</a>
            </div>
            <div>
              <h5 className="mono text-[11px] uppercase tracking-[0.06em] text-[#54545C] mb-[14px]">Company</h5>
              <a href="#" className="block text-[13.5px] text-[#9A9AA5] mb-[10px] hover:text-[#F5F5F7]">Docs</a>
              <a href="https://x.com/solanachat1" className="block text-[13.5px] text-[#9A9AA5] mb-[10px] hover:text-[#F5F5F7]">X / Twitter</a>
              <a href="https://discord.gg/JAsa6zxxp" className="block text-[13.5px] text-[#9A9AA5] mb-[10px] hover:text-[#F5F5F7]">Discord</a>
              <a href="https://t.me/solanachatinfo" className="block text-[13.5px] text-[#9A9AA5] mb-[10px] hover:text-[#F5F5F7]">Telegram</a>
            </div>
            <div>
              <h5 className="mono text-[11px] uppercase tracking-[0.06em] text-[#54545C] mb-[14px]">Get early access</h5>
              <div className="flex gap-2 mt-3">
                <input type="email" placeholder="you@wallet.sol" className="bg-[#151518] border border-[#28282E] rounded-[7px] px-3 py-[9px] text-[12.5px] text-[#F5F5F7] w-[150px] outline-none" />
                <a href="https://forms.gle/F4rNzHNNesDGiQnd8" target="_blank" rel="noopener noreferrer" className="btn btn-primary" style={{ padding: '9px 14px', fontSize: '11px' }}>Join</a>
              </div>
            </div>
          </div>
          <div className="flex justify-between items-center border-t border-[#28282E] pt-[22px] text-[11.5px] text-[#54545C] flex-wrap gap-3 mono">
            <span>&copy; 2026 SolanaChat</span>
            <span className="inline-flex items-center gap-[6px] border border-[#28282E] px-[10px] py-[4px] rounded-[6px]">
              <span className="dot"></span>
              Solana devnet &middot; pre-seed validation
            </span>
          </div>
        </div>
      </footer>

    </div>
  )
}
