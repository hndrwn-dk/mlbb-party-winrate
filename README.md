# MLBB Party Winrate Predictor

Predict duo win probability from MLBB match screenshots using OCR (Tesseract.js) and AI-powered explanations (OpenAI).

## Features

- **Upload & OCR**: Upload match screenshots and extract data using Tesseract.js
- **Match Parsing**: Automatically parse scoreboard data (heroes, K/D/A, results)
- **Win Prediction**: Local baseline predictor with OpenAI-enhanced explanations
- **Friend Dashboard**: View all friends ranked by synergy score
- **Detailed Analytics**: See predictions, recommendations, and recent matches per friend

## Tech Stack

- **Next.js 15** (App Router) with TypeScript
- **Prisma** + **PostgreSQL** (Neon/Supabase)
- **Vercel Blob** for image storage
- **Tesseract.js** for client-side OCR
- **OpenAI API** (Responses API with structured outputs)
- **TanStack Query** for data fetching
- **Tailwind CSS** + **shadcn/ui** components

## Prerequisites

- Node.js 18+ and pnpm
- PostgreSQL database (Neon or Supabase)
- OpenAI API key
- Vercel account (for Blob storage)

## Local Development Setup

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Set Up Environment Variables

Create `.env.local`:

```env
DATABASE_URL=postgresql://user:password@host:port/database
OPENAI_API_KEY=sk-...
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_...
NEXTAUTH_SECRET=dev-secret-or-random-string
NEXTAUTH_URL=http://localhost:3000
ENABLE_SERVER_OCR=false
APP_BASE_URL=http://localhost:3000
```

### 3. Set Up Database

```bash
# Generate Prisma Client
pnpm prisma:generate

# Run migrations
pnpm prisma:migrate:dev

# (Optional) Seed database
pnpm seed
```

### 4. Run Development Server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## API Endpoints

### POST `/api/upload`

Upload a match screenshot.

**Request:**
- `file` (FormData): Image file

**Response:**
```json
{
  "uploadUrl": "https://...",
  "blobUrl": "https://...",
  "uploadId": "..."
}
```

### POST `/api/parse`

Parse OCR text and save match.

**Request:**
```json
{
  "rawText": "...",
  "uploadId": "..."
}
```

**Response:**
```json
{
  "matchId": "...",
  "playersParsed": 10
}
```

### POST `/api/recompute`

Recompute friend statistics.

**Request:**
```json
{
  "friendId": "..." // optional
}
```

**Response:**
```json
{
  "updatedStatsCount": 5
}
```

### POST `/api/predict`

Get baseline prediction.

**Request:**
```json
{
  "friendId": "..."
}
```

**Response:**
```json
{
  "winProb": 0.65,
  "confidence": 0.7,
  "reason": "..."
}
```

### POST `/api/openai/predict-explain`

Get AI-enhanced prediction with explanations.

**Request:**
```json
{
  "friendId": "..."
}
```

**Response:**
```json
{
  "winProb": 0.68,
  "confidence": 0.72,
  "summary": "...",
  "reasons": ["..."],
  "doThis": ["..."],
  "avoidThis": ["..."],
  "heroIdeas": [
    {
      "duo": "Layla + Tigreal",
      "why": "..."
    }
  ],
  "funCaption": "..."
}
```

**Example cURL:**

```bash
curl -X POST http://localhost:3000/api/openai/predict-explain \
  -H "Content-Type: application/json" \
  -d '{"friendId": "clxxxxx"}'
```

### GET `/api/friends`

Get all friends with stats.

**Response:**
```json
[
  {
    "friendId": "...",
    "gameUserId": "...",
    "displayName": "...",
    "synergyScore": 0.7,
    "confidence": 0.65,
    "tag": "green"
  }
]
```

### GET `/api/friend/[id]`

Get friend detail with recent matches.

**Response:**
```json
{
  "friend": {
    "id": "...",
    "gameUserId": "...",
    "displayName": "...",
    "stats": { ... }
  },
  "matches": [...]
}
```

## Testing

```bash
# Run tests
pnpm test
```

Tests cover:
- `tests/parse.test.ts`: OCR parsing logic
- `tests/baseline.test.ts`: Baseline prediction logic

## Deployment to Vercel

### 1. Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin <your-repo-url>
git push -u origin main
```

### 2. Deploy to Vercel

1. Go to [Vercel Dashboard](https://vercel.com)
2. Import your GitHub repository
3. Configure environment variables:
   - `DATABASE_URL`
   - `OPENAI_API_KEY`
   - `BLOB_READ_WRITE_TOKEN`
   - `NEXTAUTH_SECRET` (generate a secure random string)
   - `NEXTAUTH_URL` (your Vercel deployment URL)
   - `ENABLE_SERVER_OCR` (set to `false` for now)
   - `APP_BASE_URL` (your Vercel deployment URL)

### 3. Run Database Migrations

```bash
# In Vercel dashboard or via CLI
vercel env pull
pnpm prisma:migrate:deploy
```

### 4. Optional: Set Up Vercel Cron

For nightly recompute, add `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/recompute",
      "schedule": "0 0 * * *"
    }
  ]
}
```

## Project Structure

```
app/
  api/                    # API routes
  dashboard/             # Dashboard page
  upload/                # Upload page
  friend/[id]/           # Friend detail page
  settings/              # Settings page
  styles/                # Global styles
components/
  ui/                    # shadcn/ui components
  bars/                  # Progress bars
  cards/                 # Card components
lib/
  prisma.ts             # Prisma client
  blob.ts               # Vercel Blob client
  ocr-client.ts         # Tesseract.js wrapper
  parse.ts              # Scoreboard parser
  features.ts           # Feature engineering
  baseline.ts           # Baseline predictor
  openai.ts             # OpenAI client
  guard.ts              # Auth guard
prisma/
  schema.prisma         # Database schema
  seed.ts              # Seed script
tests/                 # Test files
```

## Notes

- **No Icons/Emoticons**: UI is text-based only (no icons/emoticons)
- **Local Baseline**: Core prediction is deterministic and runs locally
- **OpenAI Guardrails**: AI predictions are clamped to baseline ±0.15
- **Thin Data Handling**: Predictions show reduced confidence when `gamesTogether < 5`

## License

MIT