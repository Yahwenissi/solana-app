# SolanaChat — AI-Powered Solana Wallet with DCA Vaults & Timelocks

Send SOL, swap tokens, create recurring DCA vaults, and schedule timelocked transfers on Solana devnet by typing natural language commands. Powered by Claude AI for intent parsing, a custom SBF program for on-chain DCA/timelock logic, and Phantom Wallet for signing.

## Features

- **Natural language transactions** — `send 5 USDC to Alice`, `swap 2 SOL for USDC`, `send 1 SOL to Bob every week`, `send 2 SOL to Charlie next Friday`
- **Jupiter Swap integration** — swap between SOL, USDC, USDT, BONK, JUP, RAY, PYTH, MSOL with live quotes and optimal routes
- **DCA Vaults** — create recurring payment vaults that execute on-chain periodically; anyone can trigger execution when due
- **Timelocked Transfers** — lock tokens until a future release date, then claim them
- **Custom SBF Program** — deployed at `4Eh646fwA4q1G6xAtSXUYTzrAvHRZJ5MsZvmBmLBWuUK` — all 6 instructions (InitVault, Deposit, ExecuteDca, CloseVault, InitTimelock, ClaimTimelock) tested on devnet
- **Voice confirmation** — browser speech reads back transaction details before signing
- **Solana Explorer links** — click to verify every transaction on-chain
- **Phantom Wallet** — auto-connect on devnet
- **Vault & Timelock sidebar** — view and manage your on-chain vaults and timelocks on the right panel

## Prerequisites

- Node.js 20+
- Phantom browser extension (set to devnet)
- Anthropic API key
- (Optional) ElevenLabs API key for cloned voice TTS

## Getting Started

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.local.example .env.local
```

Fill in your API keys in `.env.local`:

```env
ANTHROPIC_API_KEY=sk-ant-...
ELEVENLABS_API_KEY=sk_...          # optional
NEXT_PUBLIC_ELEVENLABS_VOICE_ID=v9ZBO8AjSgr0MJdazj18  # optional
```

Then run:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), connect your Phantom wallet, and type one of the example commands.

## Usage

1. Connect Phantom wallet (devnet)
2. Type a command:
   - `send 1 SOL to Bob` — sends SOL
   - `swap 2 SOL for USDC` — Jupiter swap
   - `send 1 SOL to Alice every week` — creates a DCA vault
   - `send 2 SOL to Charlie next Friday` — creates a timelock
3. Claude parses the intent and shows a preview card
4. Click ✓ to confirm or ✗ to cancel
5. View DCA vaults and timelocks in the sidebar
6. Click **Execute** on due vaults, **Close** to reclaim funds, **Claim** on released timelocks

## Architecture

```
app/
  page.tsx              — Landing page
  chat/page.tsx         — Chat UI + sidebar with vaults/timelocks
  api/chat/route.ts     — Claude AI intent parsing (send/swap/dca/timelock)
  api/tts/route.ts      — ElevenLabs TTS endpoint
  _components/
    ChatMessage.tsx      — Routes to correct preview/result card
    ChatInput.tsx        — Text input with send button
    TransactionPreview.tsx — SOL/USDC send confirmation card
    SwapPreview.tsx      — Swap confirmation with live Jupiter quote
    DcaPreview.tsx       — DCA vault confirmation
    TimelockPreview.tsx  — Timelock confirmation with client-side date parsing
    TransactionResult.tsx — Post-tx card with status, explorer link
    VaultCard.tsx        — Sidebar vault card with execute/close buttons
    TimelockCard.tsx     — Sidebar timelock card with claim button
    WalletButton.tsx     — Phantom wallet connect button
  _lib/
    types.ts            — All shared types (DcaVaultInfo, TimelockInfo, etc.)
    contacts.ts         — Hardcoded contacts (Alice, Bob, Charlie)
    transactions.ts     — Legacy SOL/USDC helpers
lib/
  protocol.ts           — SBF program client (instruction builders + PDA derivation + on-chain fetch)
  jupiter.ts            — Jupiter swap quote + execution
  sendPayment.ts        — SOL/USDC transaction dispatch + error handling
programs/
  solanachat-protocol/  — Custom SBF program (Rust, 6 instructions)
    tests/solanachat.test.ts — Full lifecycle integration tests against devnet
```

## Built With

- Next.js 16 + Turbopack
- React 19
- Tailwind CSS v4
- Solana Web3.js + SPL Token
- Custom Solana SBF Program (Rust, deployed on devnet)
- Jupiter Swap API v6
- Anthropic Claude Haiku 4.5
- Phantom Wallet Adapter

## Running Integration Tests

```bash
npm run test:program
```

Tests the full protocol lifecycle: InitVault → Deposit → ExecuteDca → CloseVault → InitTimelock → ClaimTimelock.
