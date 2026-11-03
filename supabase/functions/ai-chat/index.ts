/*
  # AI Chat Function

  1. Purpose
    - Supportive reflection companion (NOT therapy / NOT a clinician)
    - Uses free-tier Gemini Flash Lite for responses
    - Surfaces 988 when crisis language appears

  2. Security
    - GEMINI_API_KEY kept server-side in Supabase secrets
*/

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
}

// Free-tier moving alias; resolves to current Flash-Lite (e.g. gemini-3.5-flash-lite).
// Pin to a specific id later if you want version stability.
const GEMINI_MODEL = 'gemini-flash-lite-latest'

interface ChatRequest {
  message: string
  sessionType: 'morning' | 'evening'
  conversationHistory: Array<{
    role: 'user' | 'assistant'
    content: string
  }>
  userName?: string
}

const CRISIS_PATTERNS = [
  /\b(kill\s+myself|killing\s+myself)\b/i,
  /\b(suicide|suicidal)\b/i,
  /\b(end\s+my\s+life|end\s+it\s+all)\b/i,
  /\b(want\s+to\s+die|wanna\s+die|going\s+to\s+die)\b/i,
  /\b(self[-\s]?harm|hurt\s+myself|cut\s+myself)\b/i,
  /\b(no\s+reason\s+to\s+live|better\s+off\s+dead)\b/i,
]

function looksLikeCrisis(text: string): boolean {
  return CRISIS_PATTERNS.some((re) => re.test(text || ''))
}

const CRISIS_REPLY =
  "I'm really glad you told me. I'm an AI reflection companion, not a therapist or crisis service — please reach out for real help right now. In the US, call or text 988 (Suicide & Crisis Lifeline), chat at 988lifeline.org, or call 911 if you're in immediate danger. You don't have to go through this alone."

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders, status: 200 })
  }

  try {
    const { message, sessionType, conversationHistory, userName }: ChatRequest = await req.json()

    if (!message || typeof message !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Missing message' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    // Hard safety net before calling the model
    if (looksLikeCrisis(message)) {
      return new Response(
        JSON.stringify({
          message: CRISIS_REPLY,
          crisis: true,
          timestamp: new Date().toISOString(),
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    const geminiApiKey = Deno.env.get('GEMINI_API_KEY')
    if (!geminiApiKey) {
      throw new Error('Gemini API key not configured (set GEMINI_API_KEY in Supabase Edge Function secrets)')
    }

    const nameContext = userName
      ? ` The user's name is ${userName}; address them personally when it feels natural.`
      : ''

    const roleFrame = sessionType === 'morning'
      ? 'Help them start the day with gentle intention and clarity.'
      : 'Help them wind down, process the day, and find a calm closing note.'

    const systemPrompt = `You are Komorebi, a warm, wise AI companion for mindful self-reflection.
You are NOT a therapist, doctor, or crisis counselor, and you must never claim to be one or diagnose anyone.${nameContext}

Your job: through a short conversation, gently reframe unhelpful thinking toward a clearer, kinder perspective. After a few turns the product will turn the lesson into a wisdom card — so plant small, concrete insights the user can recognize later.

${roleFrame}

Rules:
- Actively listen and validate specific details they shared; no generic filler.
- Ask at most one open-ended reflective question per reply.
- Keep each reply to 2–3 short sentences.
- Soft cognitive reframe: notice the thought, offer a kinder/more useful angle, invite their view.
- If they express hopelessness, self-harm, or wanting to die: do NOT dig deeper into those thoughts. Warmly urge them to contact 988 (call/text) or 988lifeline.org (US), or local emergency services, and keep the reply brief.
- Never give medical, legal, or diagnostic advice.`

    const contents = [
      { role: 'user', parts: [{ text: systemPrompt + '\n\nBegin the session now.' }] },
      { role: 'model', parts: [{ text: 'Understood. I am Komorebi, a reflection companion — not a therapist. I am ready.' }] },
      ...(conversationHistory || []).map((m) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      })),
      { role: 'user', parts: [{ text: message }] },
    ]

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${geminiApiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents,
          generationConfig: {
            maxOutputTokens: 180,
            temperature: 0.7,
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
    let aiMessage = data.candidates?.[0]?.content?.parts?.[0]?.text

    if (!aiMessage) {
      throw new Error('No response from AI')
    }

    // Second-pass safety if the model drifted into crisis content without the banner
    if (looksLikeCrisis(message) || looksLikeCrisis(aiMessage)) {
      aiMessage = CRISIS_REPLY
    }

    return new Response(
      JSON.stringify({
        message: aiMessage,
        timestamp: new Date().toISOString(),
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  } catch (error) {
    console.error('AI Chat Error:', error)
    return new Response(
      JSON.stringify({
        error: 'Failed to process chat message',
        details: error?.message || String(error),
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  }
})
