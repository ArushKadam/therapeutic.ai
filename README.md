# Therabot

Therabot is a mental-wellness companion for reflection, mood tracking, journaling, and preparation for professional therapy. It offers supportive tools between appointments and can help someone take an early step toward seeking care.

> Therabot is not a therapist, medical service, crisis service, or replacement for professional care. It does not diagnose conditions or provide emergency assistance. If someone may be in immediate danger, contact local emergency services or an appropriate crisis service in their area.

## What it includes

- Supportive AI chat with saved conversation history
- Guided journaling and mood check-ins
- Mood patterns, summaries, and wellness insights
- Breathing and voice-session tools
- Weekly planning and progress tracking
- A **What to Expect in Therapy** walkthrough for first and ongoing sessions
- A **Prepare for Therapy** workspace with:
  - A private review of selected chats, journals, moods, sleep check-ins, and bookmarks
  - An editable AI-generated session brief
  - Therapy-goal and question builders
  - A therapist-search checklist
  - Flexible next-step planning
  - Text and PDF export

Therabot asks for confirmation before selected personal records are sent to Gemini to create a session brief. It never sends a brief to a therapist automatically.

## Technology

- React 18 and TypeScript
- Vite
- Tailwind CSS and shadcn/ui
- Supabase Auth and PostgreSQL with row-level security
- Google Gemini through a server-side Express proxy
- Framer Motion, Recharts, and Lucide icons

## Project structure

```text
therabot/
├── backend/                  # Express API and server-side Gemini access
├── public/                   # Static assets
├── src/
│   ├── components/           # Application screens and shared UI
│   ├── contexts/             # Authentication and app state
│   ├── hooks/                # Reusable React hooks
│   ├── lib/                  # Utilities and PDF generation
│   ├── pages/                # Route-level pages
│   └── services/             # Supabase, Gemini, and data services
├── supabase/migrations/      # Database schema and feature migrations
├── package.json              # Frontend scripts and dependencies
└── vite.config.ts            # Vite configuration and local API proxy
```

## Local setup

### Requirements

- Node.js 18 or newer
- npm
- A Supabase project
- A Google AI Studio Gemini API key

### 1. Install dependencies

From the project directory:

```bash
npm ci
npm ci --prefix backend
```

### 2. Configure the frontend

Create a `.env` file in the project root:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

For a deployed frontend that cannot use Vite's local proxy, also add:

```env
VITE_API_BASE_URL=https://your-api.example.com
```

### 3. Configure the backend

Copy `backend/.env.template` to `backend/.env`, then replace the placeholders:

```env
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-3.5-flash-lite
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key
FRONTEND_ORIGIN=http://localhost:8080
PORT=3001
```

Keep `GEMINI_API_KEY` on the backend. Do not add it to a frontend variable or commit either `.env` file.

### 4. Set up Supabase

In the Supabase SQL Editor, run these migrations in order:

1. `supabase/migrations/20261112000100_therabot_schema.sql`
2. `supabase/migrations/20261114000100_prepare_for_therapy.sql`

The migrations create the application tables, therapy-preparation records, and row-level security policies.

### 5. Run Therabot

Start the backend:

```bash
npm run dev --prefix backend
```

In a second terminal, start the frontend:

```bash
npm run dev
```

Open [http://localhost:8080](http://localhost:8080). The development server forwards `/api` requests to the backend at `http://localhost:3001`.

## Available commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the frontend development server |
| `npm run build` | Create a production frontend build |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Run frontend lint checks |
| `npm run dev --prefix backend` | Start the backend with automatic restart |
| `npm start --prefix backend` | Start the backend normally |

## Privacy and safety

- Supabase authentication protects signed-in features.
- Row-level security separates each user's stored records.
- Gemini requests go through the backend so the Gemini key is not exposed to the browser.
- The therapy-preparation tool shows record counts and requires consent before sending selected content to Gemini.
- Generated summaries are drafts for the user to review, edit, or remove.
- Confidentiality rules and therapy processes vary by provider and jurisdiction; the walkthrough presents general expectations rather than promises.

Before deploying, review your hosting, database, logging, retention, consent, and privacy practices for the laws and policies that apply to your users.

## Production deployment

Deploy the frontend and backend separately:

1. Build the frontend with `npm run build`.
2. Run the backend with `npm start --prefix backend`.
3. Set `FRONTEND_ORIGIN` on the backend to the deployed frontend origin.
4. Set `VITE_API_BASE_URL` before building the frontend to the deployed backend origin.
5. Add all production environment values through the hosting provider's secret or environment settings.

## Contributing

Create a focused branch, make the change, and run at least:

```bash
npm run build
npm run lint
```

Do not commit API keys, `.env` files, personal health information, or production database exports.

## License

No license has been specified for this repository. Unless the maintainers add one, the source remains subject to standard copyright restrictions.
