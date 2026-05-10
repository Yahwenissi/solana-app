import { NextRequest } from 'next/server'

const VOICE_ID = 'v9ZBO8AjSgr0MJdazj18'

export async function POST(req: NextRequest) {
  const { text } = await req.json()

  const apiKey = process.env.ELEVENLABS_API_KEY
  if (!apiKey) {
    return Response.json({ error: 'ELEVENLABS_API_KEY not configured' }, { status: 500 })
  }

  const response = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`,
    {
      method: 'POST',
      headers: {
        Accept: 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': apiKey,
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_flash_v2_5',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.5,
        },
      }),
    },
  )

  if (!response.ok) {
    const err = await response.text()
    console.error('ElevenLabs error:', response.status, err)
    return Response.json({ error: 'TTS failed' }, { status: 502 })
  }

  const audioBuffer = await response.arrayBuffer()

  return new Response(audioBuffer, {
    headers: { 'Content-Type': 'audio/mpeg' },
  })
}
