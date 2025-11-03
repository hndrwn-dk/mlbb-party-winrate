# MLBB Party Winrate Predictor

A Next.js application that predicts duo win probability from Mobile Legends: Bang Bang match screenshots using OCR and AI-powered explanations.

## Features

- **Upload & OCR**: Drag-and-drop match screenshot upload with client-side OCR processing
- **Match Parsing**: Automatic extraction of scoreboard data (heroes, K/D/A, results)
- **Win Prediction**: Local baseline predictor with OpenAI-enhanced explanations
- **Friend Dashboard**: Track all teammates ranked by synergy score
- **Detailed Analytics**: View predictions, recommendations, and recent matches per friend
- **Custom Toast Notifications**: Professional in-app notifications instead of browser alerts

## Tech Stack

- **Next.js 15** (App Router) with TypeScript
- **Prisma** + **PostgreSQL** (Vercel Postgres, Neon, or Supabase)
- **Vercel Blob** for image storage
- **Tesseract.js** for client-side OCR
- **OpenAI API** (gpt-4o-mini with structured outputs)
- **TanStack Query** for data fetching
- **Tailwind CSS** + **shadcn/ui** components
- **Inter** font for clean typography

## Prerequisites

- Node.js 20.x
- npm 9+
- PostgreSQL database (Vercel Postgres, Neon, or Supabase)
- OpenAI API key
- Vercel account (for Blob storage)

## Local Development

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Variables

Create `.env.local`:

```env
# Database
DATABASE_URL=postgresql://user:password@host:port/database?sslmode=require
# Or if using Vercel Postgres:
# DATABASE_URL=$POSTGRES_PRISMA_URL

# OpenAI
OPENAI_API_KEY=sk-...

# Vercel Blob Storage
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_...

# NextAuth (for production)
NEXTAUTH_SECRET=your-secret-key
NEXTAUTH_URL=http://localhost:3000

# App Config
ENABLE_SERVER_OCR=false
APP_BASE_URL=http://localhost:3000
```

### 3. Database Setup

```bash
# Generate Prisma Client
npm run prisma:generate

# Run migrations
npm run prisma:migrate:dev

# (Optional) Seed database
npm run seed
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Deployment to Vercel

### 1. Push to GitHub

```bash
git push origin main
```

### 2. Deploy to Vercel

1. Go to [Vercel Dashboard](https://vercel.com)
2. Import your GitHub repository
3. Configure environment variables:
   - `DATABASE_URL` (from Vercel Postgres `POSTGRES_PRISMA_URL`)
   - `OPENAI_API_KEY` (from [platform.openai.com](https://platform.openai.com))
   - `BLOB_READ_WRITE_TOKEN` (from Vercel Blob store)
   - `NEXTAUTH_SECRET` (generate secure random string)
   - `NEXTAUTH_URL` (your Vercel URL)
   - `APP_BASE_URL` (your Vercel URL)

### 3. Set Up Vercel Services

#### Vercel Postgres

1. Project → **Storage** tab
2. Create **Postgres** database
3. Copy `POSTGRES_PRISMA_URL` from database settings
4. Add as `DATABASE_URL` environment variable

#### Vercel Blob Storage

1. Project → **Storage** tab
2. Create **Blob** store
3. Go to store **Settings** → **Tokens**
4. Create Read-Write token
5. Copy token (you won't see it again)
6. Add as `BLOB_READ_WRITE_TOKEN` environment variable

Migrations run automatically on deployment via `vercel-build` script.

### 4. OpenAI API Key

1. Go to [platform.openai.com/api-keys](https://platform.openai.com/api-keys)
2. Create new secret key
3. Copy immediately (you won't see it again)
4. Add as `OPENAI_API_KEY` environment variable
5. Set usage limits in OpenAI dashboard

## API Endpoints

### POST `/api/upload`
Upload match screenshot.

**Request:** FormData with `file` field

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
  "confidence": 0.7
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

### GET `/api/friends`
Get all friends with stats, sorted by synergy score.

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

### GET `/api/health`
Health check endpoint for diagnostics.

## Testing

```bash
npm test
```

Tests cover:
- `tests/parse.test.ts`: OCR parsing logic
- `tests/baseline.test.ts`: Baseline prediction logic

## Project Structure

```
app/
  api/                    # API routes
  dashboard/             # Dashboard page
  upload/                # Upload page with drag-and-drop
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
  migrations/           # Database migrations
  seed.ts               # Seed script
tests/                  # Test files
```

## Scripts

```bash
# Development
npm run dev              # Start dev server
npm run build            # Build for production
npm run start            # Start production server

# Database
npm run prisma:generate        # Generate Prisma Client
npm run prisma:migrate:dev     # Create migration (dev)
npm run prisma:migrate:deploy  # Apply migrations (prod)
npm run prisma:studio          # Open Prisma Studio

# Testing
npm test                 # Run tests
npm run lint             # Run ESLint
```

## Troubleshooting

### Database Connection Issues

Check the `/api/health` endpoint for diagnostics:
- Database URL configured
- Database connection status
- Migrations applied
- Tables found

### Common Issues

**"Can't reach database server"**
- Verify `DATABASE_URL` in environment variables
- Ensure connection string includes `?sslmode=require`

**"relation 'User' does not exist"**
- Run migrations: `npm run prisma:migrate:deploy`
- Check build logs for migration errors

**"OPENAI_API_KEY is not defined"**
- Verify environment variable name is exactly `OPENAI_API_KEY`
- Redeploy after adding environment variables

## License

MIT
