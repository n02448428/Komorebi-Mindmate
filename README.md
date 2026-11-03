# Komorebi MindMate

> A full-stack AI-powered mental wellness companion app. Chat with an AI therapist-style assistant, build self-insight over time, and track your emotional journey with a persistent archive.

**441+ deployments** | TypeScript + React + Supabase + Netlify

---

## What It Does

Komorebi MindMate is a personal AI wellness app built around the concept of *komorebi* (the Japanese word for sunlight filtering through leaves) — a moment of calm, clarity, and reflection. Users can:

- Have open-ended AI-powered conversations for mental clarity and emotional support
- Save chat sessions and revisit them in a searchable **Chat Archive**
- Generate and browse **AI Insights** extracted from past sessions
- Manage their account and upgrade to a **Pro tier** with extended features
- Access everything securely via **Supabase Auth**

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, TypeScript, Vite |
| Backend / DB | Supabase (PostgreSQL + Auth + Realtime) |
| AI | Google Gemini free tier via Supabase Edge Functions (`GEMINI_API_KEY`) |
| Deployment | Netlify (441+ deployments, continuous delivery from GitHub) |
| Styling | CSS Modules / custom styles |
| State Management | React Context API |

---

## Key Features

- **AI Chat Sessions** — Supportive reflection conversations (not therapy) powered by Gemini free tier
- **Chat Archive** — All sessions saved to Supabase and browsable by date
- **Insights Gallery** — AI-generated summaries and reflections from your chat history
- **All Insights View** — Aggregate view of emotional patterns over time
- **Auth System** — Full sign-up/login via Supabase Auth
- **Pro Upgrade** — Tiered access model for extended AI sessions
- **Settings** — User preferences and account management
- **Guest Mode** — Try the app without creating an account

---

## Project Structure

```
Komorebi-MindMate/
├── src/
│   ├── pages/            # Route-level components
│   │   ├── MainSession.tsx      # Core AI chat interface
│   │   ├── ChatArchive.tsx      # Saved sessions browser
│   │   ├── InsightsGallery.tsx  # Session-level insights
│   │   ├── AllInsights.tsx      # Aggregate insights view
│   │   ├── AuthPage.tsx         # Login / Sign-up
│   │   ├── ProUpgrade.tsx       # Upgrade flow
│   │   └── Settings.tsx         # User preferences
│   ├── components/       # Reusable UI components
│   ├── context/          # React context for global state
│   ├── lib/              # Supabase client + API helpers
│   ├── types/            # TypeScript type definitions
│   └── utils/            # Utility functions
├── supabase/         # DB schema and migrations
├── public/           # Static assets
└── dist/             # Production build output
```

---

## How to Run Locally

```bash
# 1. Clone the repo
git clone https://github.com/n02448428/Komorebi-MindMate.git
cd Komorebi-MindMate

# 2. Install dependencies
npm install

# 3. Configure environment variables
cp .env.example .env
# Add your Supabase URL, anon key. Set GEMINI_API_KEY in Supabase Edge Function secrets (not in Vite).

# 4. Run the dev server
npm run dev
```

**Required environment variables:**
```
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
# Server-side only (Supabase Dashboard → Edge Functions → Secrets):
# GEMINI_API_KEY=your_google_ai_studio_key
```

---

## Roadmap

- [ ] Mobile-responsive redesign
- [ ] Weekly emotional trend reports
- [ ] Voice input for chat sessions
- [ ] Export chat history as PDF
- [ ] Shared insights / community mode

---

## Why I Built This

I wanted to explore what a genuinely useful AI companion could look like — not just a chatbot, but something that helps users build self-awareness over time. Komorebi MindMate is the result: a full production-grade app with auth, a real database, AI integration, and a tiered business model.

---

*Built by [Dmitry Markelov](https://dmitrymarkelov.com) — AI engineer based in Carlsbad, CA*
