# Recrix

AI-powered recruitment platform built with Next.js, TypeScript, Supabase/PostgreSQL, OpenAI, and Resend.

## Core Features

- Recruiter and candidate authentication with role-based routing.
- Recruiter job management (create, view, filter, duplicate, close/delete).
- Candidate job discovery, save jobs, and application tracking.
- Resume upload and AI-assisted resume parsing/scoring.
- Recruiter application review with manual override support.
- Interview invitation flow with email delivery.
- Candidate mock interview sessions with answer feedback.
- Recruiter/candidate dashboards and status-driven workflows.

## Tech Stack

- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- Supabase + PostgreSQL
- OpenAI API
- Resend

## Prerequisites

- Node.js 18+
- npm 9+
- Supabase project (or any PostgreSQL instance compatible with the schema)
- OpenAI API key
- Resend API key (for interview invite emails)

## Environment Variables

Copy `.env.local.example` to `.env.local` and fill values:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
JWT_SECRET=
DATABASE_URL=
OPENAI_API_KEY=
OPENAI_MODEL=
RESEND_API_KEY=
RESEND_FROM=
NEXT_PUBLIC_APP_URL=
```

Notes:
- `OPENAI_MODEL` can be left empty to use the default model configured in code.
- `RESEND_API_KEY` and `RESEND_FROM` are required for invite-email features.

## Database Setup

Apply SQL files in order:

1. `supabase/schema.sql`
2. `supabase/seed.sql`

You can run these in Supabase SQL Editor (or equivalent PostgreSQL tooling).
If you already have an older database, re-run `supabase/schema.sql` to apply
new `users.metadata` and `users.updated_at` columns used by profile/settings.

## Install and Run

```bash
npm install
npm run dev
```

App URL: `http://localhost:3000`

## Verification Commands

```bash
npm run lint
npm run typecheck
npm run build
```

or all at once:

```bash
npm run check
```

## Demo Accounts (from seed data)

- Recruiter: `sarah.chen@recrix.dev` / `recruiter123`
- Recruiter: `marcus.wells@recrix.dev` / `recruiter123`
- Candidate: `alex.rivera@candidate.dev` / `candidate123`
- Candidate: `priya.sharma@candidate.dev` / `candidate123`

## Project Documents

- `docs/recrix_SRS.md`
- `docs/recrix_detail_Design.md`
