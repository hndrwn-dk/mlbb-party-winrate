
**Role:** You are a senior full-stack engineer. Build a production-ready Next.js (App Router) app that predicts duo win probability from MLBB match screenshots/JSON. Use **Tesseract.js for OCR** (client) and **OpenAI (Responses API + Structured Outputs)** to generate fun, structured explanations on top of a **local baseline predictor**. Target deploy: **Vercel**. DB: **Postgres (Neon/Supabase)** via **Prisma**. Storage: **Vercel Blob**.

## Objectives

1. Ship a working MVP with:

   * Upload → OCR → Parse → Store → Recompute → Predict → Explain.
   * Dashboard (ranked friends by synergy), Upload flow, Friend detail, Settings.
2. Core prediction = **local baseline** (deterministic).
   Explanations = **OpenAI structured JSON** (bounded to baseline ±0.15).
3. Clean code, Zod validation, minimal tests, deploy docs.

## Stack & Libraries

* Next.js 15 (App Router), TypeScript, Tailwind + shadcn/ui
* Prisma + Postgres (Neon/Supabase)
* Vercel Blob for image uploads
* Tesseract.js (browser)
* Zod, TanStack Query, ESLint/Prettier, Jest
* OpenAI (Responses API) with **json_schema** structured outputs

## Env Vars

Create `.env.local` and wire to Vercel:

```
DATABASE_URL=postgresql://...
OPENAI_API_KEY=sk-...
BLOB_READ_WRITE_TOKEN=...
NEXTAUTH_SECRET=dev-secret-or-random
NEXTAUTH_URL=http://localhost:3000
ENABLE_SERVER_OCR=false
APP_BASE_URL=http://localhost:3000
```

## Data Model (Prisma)

Create `prisma/schema.prisma`:

```prisma
datasource db { provider = "postgresql"; url = env("DATABASE_URL") }
generator client { provider = "prisma-client-js" }

model User {
  id              String   @id @default(cuid())
  email           String?  @unique
  createdAt       DateTime @default(now())
  enableServerOCR Boolean  @default(false)
  friends         Friend[]
  matches         Match[]  @relation("UserMatches")
  uploads         Upload[]
  models          ModelFit[]
}

model Friend {
  id          String   @id @default(cuid())
  userId      String
  user        User     @relation(fields: [userId], references: [id])
  gameUserId  String
  displayName String?
  createdAt   DateTime @default(now())
  stats       FriendStats?
  matches     MatchPlayer[]
  @@unique([userId, gameUserId])
}

model Match {
  id              String   @id @default(cuid())
  ownerId         String
  owner           User     @relation("UserMatches", fields: [ownerId], references: [id])
  matchExternalId String?
  playedAt        DateTime
  mode            String?
  result          String   // "win" | "lose"
  partySize       Int?
  createdAt       DateTime @default(now())
  players         MatchPlayer[]
  source          String   // "ocr" | "manual" | "json"
}

model MatchPlayer {
  id           String  @id @default(cuid())
  matchId      String
  match        Match   @relation(fields: [matchId], references: [id])
  friendId     String?
  friend       Friend? @relation(fields: [friendId], references: [id])
  isOwnerParty Boolean @default(false)

  gameUserId String
  hero       String?
  k          Int?
  d          Int?
  a          Int?
  gpm        Int?
  dmgDealt   Int?
  dmgTaken   Int?
}

model Upload {
  id         String   @id @default(cuid())
  userId     String
  user       User     @relation(fields: [userId], references: [id])
  url        String
  processed  Boolean  @default(false)
  createdAt  DateTime @default(now())
  ocrEngine  String?  // "tesseract" | "vision"
  parseNotes String?
}

model FriendStats {
  id             String   @id @default(cuid())
  friendId       String   @unique
  gamesTogether  Int      @default(0)
  winsTogether   Int      @default(0)
  avgK           Float    @default(0)
  avgD           Float    @default(0)
  avgA           Float    @default(0)
  synergyScore   Float    @default(0) // 0..1
  confidence     Float    @default(0)
  synergyJSON    Json?
  lastComputedAt DateTime @default(now())
}

model ModelFit {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  fittedAt  DateTime @default(now())
  intercept Float
  coef      Json     // {feature: weight}
  features  String[] // ordered feature names
  samples   Int
}
```

## File Tree (high-level)

```
app/
  layout.tsx
  page.tsx                     # redirects → /dashboard
  dashboard/page.tsx
  upload/page.tsx
  friend/[id]/page.tsx
  settings/page.tsx
  api/
    upload/route.ts
    ocr/route.ts               # optional server OCR (guarded by flag)
    parse/route.ts
    recompute/route.ts
    predict/route.ts
    openai/predict-explain/route.ts
components/
  ui/*                         # shadcn
  bars/Bar.tsx                 # mini progress bar
  cards/Card.tsx
lib/
  prisma.ts
  blob.ts
  ocr-client.ts                # tesseract wrapper
  parse.ts                     # scoreboard parser (regex + helpers)
  features.ts                  # feature engineering
  baseline.ts                  # local predictor (logistic-ish + rule)
  openai.ts                    # client + structured outputs setup
  guard.ts                     # auth/requireUserId (stub local session)
  utils.ts
prisma/
  schema.prisma
  seed.ts
public/
styles/
  globals.css
tests/
  parse.test.ts
  baseline.test.ts
README.md
CONTRIBUTING.md
```

## API Contracts (must implement)

* **POST `/api/upload`** → `{ uploadUrl, blobUrl, uploadId }`
* **POST `/api/ocr`** (optional) → `{ rawText, engine }`
* **POST `/api/parse`** `{ rawText, uploadId }` → `{ matchId, playersParsed }`
* **POST `/api/recompute`** `{ friendId? }` → `{ updatedStatsCount }`
* **POST `/api/predict`** `{ friendId }` → `{ winProb, confidence, reason }`
* **POST `/api/openai/predict-explain`** `{ friend, features, stats, recent }` → structured JSON (below)
* **GET `/api/friends`** → list with `{friendId, gameUserId, displayName, synergyScore, confidence, tag}`
* **GET `/api/friend/[id]`** → summary + last matches + hero synergy tiles

## OpenAI — Structured Output (Responses API)

* Model: `gpt-4o-mini` (configurable)
* **Guardrails:** Returned `winProb` must be clamped to **baseline ± 0.15** and within `[0.05, 0.95]`. If `gamesTogether < 5`, force `confidence ≤ 0.35` and state “thin data”.

**JSON schema** to enforce:

```json
{
  "type": "object",
  "additionalProperties": false,
  "properties": {
    "winProb":    { "type": "number", "minimum": 0.05, "maximum": 0.95 },
    "confidence": { "type": "number", "minimum": 0, "maximum": 1 },
    "summary":    { "type": "string", "maxLength": 300 },
    "reasons":    { "type": "array", "items": { "type": "string", "maxLength": 120 }, "maxItems": 4 },
    "doThis":     { "type": "array", "items": { "type": "string", "maxLength": 120 }, "maxItems": 3 },
    "avoidThis":  { "type": "array", "items": { "type": "string", "maxLength": 120 }, "maxItems": 3 },
    "heroIdeas":  {
      "type": "array", "maxItems": 3,
      "items": {
        "type": "object",
        "additionalProperties": false,
        "properties": { "duo": { "type": "string" }, "why": { "type": "string", "maxLength": 140 } },
        "required": ["duo","why"]
      }
    },
    "funCaption": { "type": "string", "maxLength": 100 }
  },
  "required": ["winProb","confidence","summary","reasons","doThis","avoidThis","heroIdeas","funCaption"]
}
```

**System prompt for OpenAI call:**

```
You are DuoCoach, a concise, upbeat MLBB duo coach.
Never invent numbers not provided. Stay within supplied bounds.
Be supportive and non-toxic. Output STRICT JSON only; no extra text.
```

**User content template (inputs):**

```
Friend: {{displayName || gameUserId}}
Baseline:
- prob={{base.prob}}, confidence={{base.confidence}}

Constraints:
- winProb must be within ±0.15 absolute of baseline.prob.
- If stats.gamesTogether < 5, set confidence <= 0.35 and mention thin data.

Features (0..1 unless noted):
{{features JSON}}

Stats:
{{stats JSON}}

Recent (newest first):
{{list lines: YYYY-MM-DD result hero K/D/A}}

Task:
Return JSON ONLY per the provided schema with short, practical tips and 2-3 hero duo ideas.
```

## Baseline Predictor (local)

* Rule if `gamesTogether < 5`.
* Else logistic-ish:

  * features: `wrTogether`, `friendKdaLast3` (KDA/6 capped 1), `deathsGap` (−1..1), `roleComboScore` (−1..1), `partySizeNorm` (0..1)
  * output clamped to `[0.1,0.9]`
* Return `{ prob, confidence }`.

## OCR & Parse

* Client: `tesseract.js` (WASM) → `rawText`
* Parse heuristics:

  * Extract rows: `gameUserId/displayName`, `hero`, `K/D/A`, optional `GPM`, `DMG`, `result`
  * Confirm which rows are **same party**
  * Fuzzy hero mapping (aliases → canonical)

## UI Requirements

* `/upload`: upload → OCR preview → confirm party → Save
* `/dashboard`: list friends by **Synergy** (bar), **Winrate** bar, tag **green/yellow/red**, confidence %
* `/friend/[id]`: predicted next-game win %, reasons, do/avoid, hero ideas, recent results chips, last 10 table
* `/settings`: toggle server OCR, rename friends, retrain/recompute

## Scripts

```
pnpm dev
pnpm build
pnpm start
pnpm prisma:generate
pnpm prisma:migrate:dev
pnpm prisma:migrate:deploy
pnpm seed
pnpm test
```

## Tests (create minimal)

* `tests/parse.test.ts`: given mock OCR text → parsed rows count + fields
* `tests/baseline.test.ts`: features vectors → monotonicity checks + clamp bounds

## Acceptance Criteria

* Can upload a screenshot, see OCR text, save a match.
* Dashboard shows at least 3 friends with synergy bars and tags.
* Friend detail shows **baseline** + **OpenAI explanation** JSON merged, respecting clamp rules.
* No crashes when data is thin; UI displays “not enough data”.
* README explains local dev + Vercel deploy steps with envs and example curl for `/api/openai/predict-explain`.

## Stretch (if time)

* CSV/JSON import path
* Vercel Cron nightly `/api/recompute`
* OAuth (Google) later (for now, local session stub)

**Now: scaffold the project, generate all files, wire the routes, and produce a working MVP with mock fixtures.**
