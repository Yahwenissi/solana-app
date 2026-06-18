import { NextRequest } from 'next/server'

function extractJson(text: string): Record<string, unknown> | null {
  try {
    return JSON.parse(text)
  } catch {}

  const jsonBlock = text.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/)
  if (jsonBlock) {
    try { return JSON.parse(jsonBlock[1]) } catch {}
  }

  const firstBrace = text.indexOf('{')
  const lastBrace = text.lastIndexOf('}')
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    try { return JSON.parse(text.slice(firstBrace, lastBrace + 1)) } catch {}
  }

  return null
}

export async function POST(req: NextRequest) {
  const { message } = await req.json()

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return Response.json(
      { intent: null, error: 'ANTHROPIC_API_KEY not configured. Add it to .env.local' },
      { status: 500 },
    )
  }

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 300,
      system: [
        {
          type: 'text',
          text: `You are an intent parser for a Solana wallet app. Given a user message, extract the transaction intent.

Return ONLY valid JSON with this structure.

For sending payments:
{
  "intent": {
    "action": "send",
    "token": "SOL" or "USDC",
    "amount": <number>,
    "recipientName": "<name or address>",
    "memo": "<optional memo or null>"
  }
}

For swapping tokens:
{
  "intent": {
    "action": "swap",
    "inputToken": "<token to swap from, uppercase>",
    "outputToken": "<token to swap to, uppercase>",
    "inputAmount": <amount as number>
  }
}

For DCA recurring payments:
{
  "intent": {
    "action": "dca",
    "token": "SOL" or "USDC",
    "amount": <number>,
    "recipientName": "<name>",
    "interval": "daily" | "weekly" | "monthly",
    "totalDeposits": <optional number of payments>
  }
}

For timelocked transfers:
{
  "intent": {
    "action": "timelock",
    "token": "SOL" or "USDC",
    "amount": <number>,
    "recipientName": "<name>",
    "releaseDate": "<natural language date or time>"
  }
}

If you cannot parse a valid intent, return:
{
  "intent": null
}

Supported tokens for swap: SOL, USDC, USDT, BONK, JUP, RAY, PYTH

Examples:
User: "send 5 USDC to Alice"
Response: {"intent":{"action":"send","token":"USDC","amount":5,"recipientName":"Alice"}}

User: "swap 2 SOL for USDC"
Response: {"intent":{"action":"swap","inputToken":"SOL","outputToken":"USDC","inputAmount":2}}

User: "send 1 SOL to Alice every week"
Response: {"intent":{"action":"dca","token":"SOL","amount":1,"recipientName":"Alice","interval":"weekly"}}

User: "send 5 USDC to Bob every day for 30 days"
Response: {"intent":{"action":"dca","token":"USDC","amount":5,"recipientName":"Bob","interval":"daily","totalDeposits":30}}

User: "send 2 SOL to Charlie tomorrow at 3pm"
Response: {"intent":{"action":"timelock","token":"SOL","amount":2,"recipientName":"Charlie","releaseDate":"tomorrow at 3pm"}}

User: "send 5 USDC to Alice next Friday"
Response: {"intent":{"action":"timelock","token":"USDC","amount":5,"recipientName":"Alice","releaseDate":"next Friday"}}

User: "hello"
Response: {"intent":null}

Respond with ONLY the JSON object, no other text before or after.`,
        },
      ],
      messages: [{ role: 'user', content: message }],
    }),
  })

  if (!response.ok) {
    const err = await response.text()
    console.error('Claude API error:', response.status, err)
    return Response.json({ intent: null, error: 'AI service error' }, { status: 502 })
  }

  const data = await response.json()
  const text = data.content?.[0]?.text

  if (!text) {
    return Response.json({ intent: null })
  }

  const parsed = extractJson(text)
  if (parsed) {
    return Response.json(parsed)
  }
  return Response.json({ intent: null })
}
