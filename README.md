# InterviewPrep — AI Mock Interview Platform

Practice technical and HR interviews with AI-generated questions, adaptive
difficulty, and actionable feedback. Built with Next.js 16, PostgreSQL and
Prisma, with a provider-agnostic AI layer.

> **Honest disclaimer.** Scores and feedback are produced by an AI-driven
> heuristic. This is **not** a scientifically validated assessment. The platform
> does not measure personality, mental state, confidence as a psychological
> trait, employability or hiring potential.

---

## 1. Project overview

InterviewPrep is a full-stack web application for college students and job
seekers. A user selects a role and interview type, runs a multi-question mock
interview, submits text or voice answers, and receives detailed feedback plus
performance analytics over time.

The interview behaves like a real interview: questions arrive one at a time, the
difficulty adapts to performance, the AI can ask follow-ups, and scores can be
hidden until the end (realistic mode).

## 2. Problem statement

Interview practice usually means static question lists with no feedback loop.
Candidates cannot tell what they got wrong, which topics are weak, or whether
they are improving. InterviewPrep provides a realistic, repeatable practice loop
with per-answer feedback, topic-level analytics and a personalised study plan.

## 3. Features

- **Authentication** — email/password (bcrypt) plus optional GitHub OAuth,
  protected routes, forgot/reset password.
- **Dashboard** — interviews completed, average scores, strongest/weakest skill,
  score progression chart and recent interviews.
- **Interview configuration** — role, experience level, interview type, mode,
  difficulty, question count and role-aware topics.
- **AI question generation** — questions generated per role/experience/topic,
  avoiding repetition.
- **Adaptive interview** — difficulty and topic selection driven by recent
  performance (documented heuristic).
- **Answer evaluation** — technical correctness, completeness, relevance,
  clarity and communication, each scored 0–10.
- **Actionable feedback** — what went well, what to improve, a better answer
  structure and a model answer.
- **Follow-up questions** — generated from the candidate's own answer.
- **Voice mode** — browser speech-to-text and text-to-speech. Audio is never
  uploaded or stored; only the transcript is kept.
- **Interview modes** — Practice (feedback per question), Realistic (feedback
  only at the end), Rapid Fire (60-second limit per question).
- **Results report** — overall/dimension scores, strong and weak areas,
  question-by-question analysis and recommendations.
- **Analytics** — line, bar and radar charts across all interviews.
- **History** — view, compare (side-by-side) and delete interviews.
- **Question bank** — curated questions with expected concepts and ideal answer
  points, plus AI generation pending human validation.
- **Dark/light mode, responsive layout, toasts, skeletons, empty states.**

## 4. User flow

```text
Landing → Sign up / Log in → Dashboard → Create interview → Select role
→ Select interview type → Configure (experience, mode, difficulty, count, topics)
→ Start interview → Question → Answer (text/voice) → AI evaluation
→ Follow-up → Next question → Interview complete → Performance report
→ Recommendations
```

## 5. Architecture

```text
Next.js App Router (React Server Components + Client Components)
  │
  ├─ Server Actions ── simple mutations (auth, profile)
  ├─ Route Handlers ── interview flow + AI endpoints (JSON)
  │
  ▼
Service layer  lib/services/*
  ├─ interview-service   state machine, adaptive sequencing, persistence
  ├─ analytics-service   dashboard + analytics aggregation
  └─ question-bank-service
  │        (ownership/authorization enforced here)
  ▼
AI Service Layer  lib/ai/*
  ├─ provider.ts        AIProvider interface
  ├─ openai-provider.ts OpenAI-compatible /chat/completions
  ├─ mock-provider.ts   deterministic, offline
  ├─ prompts.ts         prompt builders
  └─ schemas.ts         Zod validation of AI JSON
  ▼
Prisma 7 (driver adapter @prisma/adapter-pg)  →  PostgreSQL
```

Key boundaries:

- No AI SDK or provider import exists outside `lib/ai`.
- Every AI response is validated with Zod; malformed responses are retried once
  and then surfaced as a typed `AIError`.
- Interview state is persisted after every answer, so an interrupted interview
  can be resumed.

## 6. AI architecture

```text
                 InterviewPrep
                       │
                 AI Service Layer
                       │
        ┌──────────────┼──────────────┐
        ▼              ▼              ▼
 Question Generator  Evaluator   Follow-up Generator
        │              │              │
        └──────────────┼──────────────┘
                       ▼
                    LLM API
```

The `AIProvider` interface (`lib/ai/types.ts`):

```ts
interface AIProvider {
  generateQuestion(input): Promise<GeneratedQuestion>;
  generateFollowUp(input): Promise<GeneratedQuestion>;
  evaluateAnswer(input): Promise<AnswerEvaluation>;
  generateFeedback(input): Promise<Feedback>;
  generateRecommendations(input): Promise<StudyRecommendation>;
}
```

Two implementations ship today:

| Provider | Env value | Notes |
|---|---|---|
| `MockAIProvider` | `AI_PROVIDER=mock` | Deterministic, offline, no API key. |
| `OpenAICompatibleProvider` | `AI_PROVIDER=openai` | Any OpenAI-compatible `/chat/completions` endpoint (OpenAI, OpenRouter, Groq, local gateway…). |

Add a new provider by implementing the interface and wiring it in
`lib/ai/index.ts` — no other code changes required.

### Adaptive interview (heuristic)

Documented, rule-based policy in `lib/evaluation/adaptive.ts`:

- Recent answer average ≥ 7.5 → increase difficulty.
- Recent answer average ≤ 4.5 → decrease difficulty.
- Otherwise keep difficulty.
- Next topic = lowest average score, tie-broken by least-asked.
- A follow-up is asked when the answer is substantive (≥ 40 characters) and no
  follow-up exists yet for that question.

This is intentionally transparent and testable, not a validated psychometric
model.

## 7. Database schema

Prisma models (`prisma/schema.prisma`):

| Model | Purpose |
|---|---|
| `User` | Auth.js user + profile (`targetRole`, `experienceLevel`, `skills`, `preferredInterviewType`) |
| `Account`, `Session`, `VerificationToken` | Auth.js models |
| `PasswordResetToken` | Hashed, single-use, expiring reset tokens |
| `Interview` | Config + aggregate scores + status/duration |
| `InterviewQuestion` | Question, topic, difficulty, type, expected concepts, follow-up linkage |
| `Answer` | Answer text, per-dimension scores, feedback JSON, input mode |
| `SkillPerformance` | Rolling per-skill score (0–100) and attempt count |
| `QuestionBankItem` | Curated/generated questions with validation flag |
| `Recommendation` | Personalised study plan per interview |

Enums: `Role`, `ExperienceLevel`, `InterviewType`, `InterviewMode`, `Difficulty`,
`InterviewStatus`, `QuestionType`, `QuestionSource`.

An initial migration is checked in at `prisma/migrations/0_init`.

## 8. Technology stack

- **Frontend:** Next.js 16 (App Router, Turbopack), React 19, TypeScript,
  Tailwind CSS v4, shadcn/ui, Lucide React, Recharts, Sonner, next-themes.
- **Backend:** Next.js Route Handlers + Server Actions.
- **Database:** PostgreSQL + Prisma 7 (driver adapter).
- **Auth:** Auth.js (NextAuth v5) with the Prisma adapter, JWT sessions,
  bcrypt password hashing.
- **Validation:** Zod v4.
- **Testing:** Vitest (+ React Testing Library / jsdom).
- **Package manager:** pnpm.

## 9. Installation

Prerequisites: Node.js 20.9+, pnpm 10+, and a PostgreSQL database.

```bash
pnpm install
cp .env.example .env      # then fill in the values
pnpm db:generate
pnpm db:deploy            # apply the checked-in migration
pnpm db:seed              # load the starter question bank
pnpm dev
```

## 10. Environment variables

See `.env.example`. Summary:

| Variable | Required | Purpose |
|---|---|---|
| `DATABASE_URL` | yes | Pooled PostgreSQL connection string used at runtime. |
| `DIRECT_URL` | recommended | Direct connection for migrations (no pooler). |
| `AUTH_SECRET` | yes | Auth.js signing secret (`npx auth secret`). |
| `AUTH_URL` | dev | Base URL for Auth.js (`http://localhost:3000`). |
| `AUTH_GITHUB_ID` / `AUTH_GITHUB_SECRET` | optional | Enables the GitHub provider when both are set. |
| `AI_PROVIDER` | yes | `mock` (default) or `openai`. |
| `AI_BASE_URL` | for `openai` | e.g. `https://api.openai.com/v1`. |
| `AI_API_KEY` | for `openai` | Server-only API key. Never exposed to the browser. |
| `AI_MODEL` | for `openai` | e.g. `gpt-4o-mini`. |
| `AI_TIMEOUT_MS` | optional | Provider timeout (default 30000). |
| `NEXT_PUBLIC_APP_URL` | optional | Used to build reset links. |
| `RESEND_API_KEY` / `EMAIL_FROM` | optional | When both are set, password reset links are emailed via Resend. |
| `TEST_DATABASE_URL` | tests | Enables database integration tests. |
| `SEED_DEMO_USER` | optional | Set to `true` to seed a demo account. |

No AI key is required to run the app: the default `mock` provider makes the full
flow work offline.

## 11. Database setup

1. Create a PostgreSQL database (Neon, Supabase, Prisma Postgres or local).
2. Put the pooled URL in `DATABASE_URL` and the direct URL in `DIRECT_URL`.
3. Apply the schema:

```bash
pnpm db:deploy    # apply the committed migration (production-safe)
# or, during development, create a new migration:
pnpm db:migrate
```

4. Seed the question bank:

```bash
pnpm db:seed
```

> Prisma 7 keeps the datasource URL in `prisma7.config.ts`, not in
> `schema.prisma`. For pooled providers, run migrations with the direct URL
> (e.g. `DATABASE_URL="$DIRECT_URL" pnpm db:deploy`).

## 12. AI provider configuration

**Mock (default, no key):**

```env
AI_PROVIDER=mock
```

**OpenAI-compatible:**

```env
AI_PROVIDER=openai
AI_BASE_URL=https://api.openai.com/v1
AI_API_KEY=sk-...
AI_MODEL=gpt-4o-mini
AI_TIMEOUT_MS=30000
```

The provider is only ever instantiated on the server. Keys are read from
`process.env` inside `lib/ai/index.ts` and are never sent to the client.

## 13. Running locally

```bash
pnpm dev          # http://localhost:3000
pnpm build        # production build (Turbopack)
pnpm start        # run the production build
```

## 14. Testing

```bash
pnpm test         # run all tests once
pnpm test:watch   # watch mode
pnpm typecheck    # tsc --noEmit
pnpm lint         # eslint
```

Test suites:

- `tests/unit/ai` — provider factory, OpenAI-compatible parsing/retry/timeout,
  mock provider determinism and scoring.
- `tests/unit/evaluation` — scoring aggregation and the adaptive policy.
- `tests/unit/auth` — password hashing/verification, auth server actions
  (register, login, logout, forgot/reset, rate limiting, redirect
  sanitisation) and route guards (`requireUser`, `requireApiUser`).
- `tests/unit/api` — route-handler authorization: every protected endpoint
  returns **401** when unauthenticated.
- `tests/unit/domain`, `tests/unit/validation` — role topics and Zod schemas.
- `tests/integration` — database integration tests:
  `interview-service.test.ts` (create, submit, complete, resume, history,
  **cross-user authorization**), `auth-credentials.test.ts` (registration +
  login against real bcrypt) and `api-authz.test.ts` (HTTP-layer 401/404).
  These are **skipped unless `TEST_DATABASE_URL` is set**:

  ```bash
  TEST_DATABASE_URL="postgresql://user:pass@host:5432/interviewprep_test" pnpm test
  ```

## 15. Security considerations

- **Passwords:** bcrypt with a cost factor of 12; hashes never leave the server.
- **Authorization:** every service query is scoped to the authenticated user.
  A missing/foreign resource returns `NOT_FOUND` rather than leaking existence.
  Covered by an integration test (`User A cannot access User B's interview`).
- **Protected endpoints:** all route handlers and server actions call
  `requireApiUser()` / `requireUser()`.
- **Input validation:** every mutation is validated with Zod on the server.
- **Rate limiting:** fixed-window limiter on auth, answer, next and generation
  endpoints (`lib/rate-limit.ts`). In-memory by default — see limitations.
- **Secrets:** API keys are server-only environment variables.
- **AI output:** validated against Zod schemas before use; malformed output is
  retried once then rejected.
- **Database:** parameterised Prisma queries only; no raw SQL interpolation.
- **XSS:** React escapes rendered content by default; no `dangerouslySetInnerHTML`.
- **CSRF:** Auth.js manages CSRF protection and SameSite cookies.
- **Privacy:** voice audio is never uploaded or stored; only the transcript is
  kept. No unnecessary personal data is collected.

## 16. Limitations

- Scores come from an AI heuristic and are **not** a validated assessment.
- No inference of personality, emotion, confidence as a trait, employability or
  hiring potential. Voice "delivery" notes describe observable speech only.
- Voice input depends on browser support for the Web Speech API (best in
  Chromium browsers) and is English-oriented.
- The in-memory rate limiter is per-instance; use a shared store (e.g. Redis) for
  multi-instance or serverless deployments.
- Password reset emails need `RESEND_API_KEY` and `EMAIL_FROM`; without them the
  reset link is only shown in the UI outside production.
- Database integration tests require a provisioned test database.
- AI latency depends on the configured provider; long answers take longer to
  evaluate.

## 17. Future improvements

- Video interviews and a coding interview environment.
- Multiple AI interviewer personalities.
- Company-specific question sets and job-description/resume-based interviews.
- Live collaborative interviews and mentor scheduling.
- Difficulty calibration from aggregate outcomes.
- Optional prosody analysis, clearly bounded and opt-in.
- Distributed rate limiting and background job queue for evaluation.
- Email delivery for password resets and interview reminders.

---

## Project structure

```text
prepmate/
├── app/
│   ├── (auth)/            login, signup, forgot-password, reset-password
│   ├── (app)/             dashboard, interview, analytics, history,
│   │                      question-bank, profile (protected)
│   ├── api/               auth, interviews, question-bank route handlers
│   ├── error.tsx, not-found.tsx, loading.tsx
│   └── page.tsx           landing page
├── components/
│   ├── analytics/         Recharts wrappers
│   ├── auth/              auth forms
│   ├── history/           history table + compare
│   ├── interview/         config form, runner, feedback, timer
│   ├── profile/           profile form
│   ├── question-bank/     browser + generation dialog
│   ├── shared/            shell, nav, theme, empty state, submit button
│   └── ui/                shadcn/ui primitives
├── lib/
│   ├── ai/                provider abstraction, prompts, schemas, errors
│   ├── api/               route error mapping
│   ├── auth/              Auth.js config, guards, password, actions
│   ├── db/                Prisma singleton (pg driver adapter)
│   ├── domain/            roles, topics, labels
│   ├── evaluation/        scoring + adaptive heuristics
│   ├── generated/prisma/  generated Prisma client (git-ignored)
│   ├── services/          interview, analytics, question-bank
│   ├── validation/        Zod request schemas
│   ├── voice/             Web Speech API wrappers
│   ├── format.ts, forms.ts, rate-limit.ts, utils.ts
├── prisma/
│   ├── schema.prisma
│   ├── migrations/0_init/
│   └── seed.ts
├── tests/
│   ├── unit/
│   └── integration/
├── prisma7.config.ts
├── vitest.config.mts
└── .env.example
```

## Available commands

| Command | Description |
|---|---|
| `pnpm dev` | Start the dev server |
| `pnpm build` | Production build |
| `pnpm start` | Run the production build |
| `pnpm lint` | ESLint |
| `pnpm typecheck` | TypeScript check |
| `pnpm test` | Run the test suite |
| `pnpm db:generate` | Generate the Prisma client |
| `pnpm db:migrate` | Create/apply a dev migration |
| `pnpm db:deploy` | Apply committed migrations |
| `pnpm db:push` | Push schema without a migration |
| `pnpm db:seed` | Seed the question bank |
| `pnpm db:studio` | Open Prisma Studio |
