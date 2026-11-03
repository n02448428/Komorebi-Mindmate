/*
  # Generate Insight Function

  1. Purpose
    - Turns a short conversation into one wisdom-card quote (nugget of insight)
    - Uses free-tier Gemini Flash Lite

  2. Security
    - GEMINI_API_KEY kept server-side in Supabase secrets
*/

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
}

const GEMINI_MODEL = 'gemini-flash-lite-latest'

interface InsightRequest {
  sessionMessages: Array<{
    role: 'user' | 'assistant'
    content: string
  }>
  sessionType: 'morning' | 'evening'
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders, status: 200 })
  }

  try {
    const { sessionMessages, sessionType }: InsightRequest = await req.json()

    const geminiApiKey = Deno.env.get('GEMINI_API_KEY')
    if (!geminiApiKey) {
      throw new Error('Gemini API key not configured (set GEMINI_API_KEY in Supabase Edge Function secrets)')
    }

    const conversationSummary = (sessionMessages || [])
      .map((msg) => `${msg.role}: ${msg.content}`)
      .join('\n')

    const systemPrompt = sessionType === 'morning'
      ? `Based on this morning conversation, write ONE short wisdom-card quote (1–2 sentences) that captures the gentlest useful reframe or intention from the chat. Make it personal to what they said, uplifting, forward-looking, and shareable. Return ONLY the quote text — no labels, no quotation marks wrapper, no explanation.`
      : `Based on this evening reflection conversation, write ONE short wisdom-card quote (1–2 sentences) that captures the lesson or kinder reframe that emerged. Make it personal to what they said, calming, wise, and shareable. Return ONLY the quote text — no labels, no quotation marks wrapper, no explanation.`

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${geminiApiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [{ text: systemPrompt + `\n\nConversation:\n${conversationSummary}` }],
            },
          ],
          generationConfig: {
            maxOutputTokens: 100,
            temperature: 0.8,
          },
        }),
      },
    )

    if (!response.ok) {
      const errBody = await response.text()
      console.error('Gemini API error', response.status, errBody)
      throw new Error(`Gemini API error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    const insightQuote = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim()

    if (!insightQuote) {
      throw new Error('No insight generated')
    }

    const cleanQuote = insightQuote.replace(/^["'“”]+|["'“”]+$/g, '')

    return new Response(
      JSON.stringify({
        quote: cleanQuote,
        type: sessionType,
        timestamp: new Date().toISOString(),
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  } catch (error) {
    console.error('Insight Generation Error:', error)
    return new Response(
      JSON.stringify({
        error: 'Failed to generate insight',
        details: error?.message || String(error),
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  }
})
