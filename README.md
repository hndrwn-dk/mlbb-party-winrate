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
# For Vercel Postgres, use POSTGRES_PRISMA_URL (auto-added by Vercel)
# Or use your own PostgreSQL connection string
DATABASE_URL=postgresql://user:password@host:port/database
# Or if using Vercel Postgres:
# DATABASE_URL=$POSTGRES_PRISMA_URL

OPENAI_API_KEY=sk-...
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_...
NEXTAUTH_SECRET=dev-secret-or-random-string
NEXTAUTH_URL=http://localhost:3000
ENABLE_SERVER_OCR=false
APP_BASE_URL=http://localhost:3000
```

**Note**: If using Vercel Postgres, Vercel automatically provides `POSTGRES_PRISMA_URL` which you can use directly for `DATABASE_URL`.

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

## Setting Up Vercel Services

### Setting Up Vercel Postgres Database

#### Option 1: Via Vercel Dashboard

1. **Go to your Vercel project dashboard**
   - Navigate to [Vercel Dashboard](https://vercel.com/dashboard)
   - Select your project

2. **Open the Storage tab**
   - Click on the **Storage** tab in your project
   - Click **Create Database**
   - Select **Postgres**

3. **Create Postgres Database**
   - Click **Create**
   - Give your database a name (e.g., `mlbb-party-db`)
   - Select a region closest to your users
   - Click **Create Database**

4. **Get Connection String**
   - Once created, go to the **Settings** tab of your database
   - Copy the **Connection String** (Postgres format)
   - It should look like: `postgres://default:password@host:5432/verceldb?sslmode=require`
   - This will be your `DATABASE_URL`

5. **Auto-configured Environment Variable**
   - Vercel automatically adds `POSTGRES_PRISMA_URL` and `POSTGRES_URL_NON_POOLING`
   - For Prisma, use `POSTGRES_PRISMA_URL` as your `DATABASE_URL`
   - Or manually set `DATABASE_URL` using the connection string from step 4

#### Option 2: Via Vercel CLI

```bash
# Install Vercel CLI if you haven't
npm i -g vercel

# Login to Vercel
vercel login

# Link your project
vercel link

# Create Postgres database
vercel storage create postgres --name mlbb-party-db
```

### Setting Up Vercel Blob Storage

#### Step 1: Create Blob Store

1. **Go to your Vercel project dashboard**
   - Navigate to [Vercel Dashboard](https://vercel.com/dashboard)
   - Select your project

2. **Open the Storage tab**
   - Click on the **Storage** tab
   - Click **Create Database**
   - Select **Blob**

3. **Create Blob Store**
   - Click **Create**
   - Give your store a name (e.g., `mlbb-uploads`)
   - Select a region
   - Click **Create**

#### Step 2: Get Blob Token

1. **Access Blob Settings**
   - Go to your Blob store's **Settings** tab
   - Scroll to **Tokens** section

2. **Create Read-Write Token**
   - Click **Create Token**
   - Name it (e.g., `production-rw-token`)
   - Select **Read and Write** permissions
   - Click **Create Token**

3. **Copy the Token**
   - **Important**: Copy the token immediately (you won't see it again)
   - It will look like: `vercel_blob_rw_xxxxx...`
   - This is your `BLOB_READ_WRITE_TOKEN`

#### Step 3: Add Environment Variable

1. **In Vercel Project Settings**
   - Go to **Settings** → **Environment Variables**
   - Add new variable:
     - **Name**: `BLOB_READ_WRITE_TOKEN`
     - **Value**: Paste the token you copied
     - **Environment**: Production, Preview, Development (select all)
   - Click **Save**

### Alternative: Using External Services

If you prefer external services:

**PostgreSQL:**
- **Neon** (Recommended): [neon.tech](https://neon.tech) - Free tier available
- **Supabase**: [supabase.com](https://supabase.com) - Free tier available
- **Railway**: [railway.app](https://railway.app) - Free tier available

**Blob Storage Alternatives:**
- AWS S3
- Cloudflare R2
- Google Cloud Storage

Update your `DATABASE_URL` and `BLOB_READ_WRITE_TOKEN` accordingly.

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
   - `DATABASE_URL` (from Vercel Postgres `POSTGRES_PRISMA_URL` or your connection string)
   - `OPENAI_API_KEY` (from [platform.openai.com](https://platform.openai.com))
   - `BLOB_READ_WRITE_TOKEN` (from Vercel Blob store tokens)
   - `NEXTAUTH_SECRET` (generate a secure random string)
   - `NEXTAUTH_URL` (your Vercel deployment URL, e.g., `https://your-app.vercel.app`)
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