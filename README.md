# Solana Chat — AI-Powered Transaction Sender

Send SOL and USDC on Solana devnet by typing natural language commands. Powered by Claude AI for intent parsing and Phantom Wallet for signing.

## Features

- **Natural language transactions** — type `send 5 USDC to Alice`, Claude parses the intent
- **SOL & USDC support** — automatic token detection via devnet USDC mint
- **Voice confirmation** — browser speech reads back transaction details before signing
- **Transaction history** — chat-style UI with confirmed/failed status badges
- **Solana Explorer links** — click to verify every transaction on-chain
- **Balance display** — auto-refreshes after each transaction
- **Phantom Wallet** — auto-connect on devnet
- **Dark theme** — Solana purple/teal gradient UI with glassmorphism cards

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

Open [http://localhost:3000](http://localhost:3000), connect your Phantom wallet, and type:

```
send 5 USDC to Alice
```

## Usage

1. Connect Phantom wallet (devnet)
2. Type a command like `send 1 SOL to Bob` or `send 10 USDC to Charlie`
3. Claude parses the intent and shows a preview card
4. Click ✓ to confirm or ✗ to cancel
5. Watch your balance update after confirmation
6. Click "View on Explorer" to verify on Solscan

## Architecture

```
app/
  page.tsx              — Main chat UI, wallet connection, balance
  api/chat/route.ts     — Claude AI intent parsing endpoint
  api/tts/route.ts      — ElevenLabs TTS endpoint
  _components/
    ChatMessage.tsx      — Message bubble with conditional tx card
    ChatInput.tsx        — Text input with send button
    TransactionPreview.tsx — Pre-confirmation card
    TransactionResult.tsx — Post-tx card with status, explorer link
    WalletButton.tsx     — Phantom wallet connect button
  _lib/
    types.ts            — TypeScript types
    contacts.ts         — Hardcoded contacts (Alice, Bob, Charlie)
lib/
  sendPayment.ts        — SOL/USDC transaction dispatch + error handling
```

## Built With

- Next.js 16 + Turbopack
- React 19
- Tailwind CSS v4
- Solana Web3.js + SPL Token
- Anthropic Claude Haiku 4.5
- Phantom Wallet Adapter
