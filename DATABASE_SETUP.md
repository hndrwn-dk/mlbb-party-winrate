# Database Schema Generation Guide

This guide explains how to generate and apply the Prisma database schema to PostgreSQL, and set up Vercel Blob Storage.

## Part 1: Setting Up PostgreSQL Database

### Step 1: Create Vercel Postgres Database

1. **Go to Vercel Dashboard**
   - Navigate to [vercel.com/dashboard](https://vercel.com/dashboard)
   - Select your project

2. **Create Postgres Database**
   - Click on the **Storage** tab
   - Click **Create Database**
   - Select **Postgres**
   - Name it (e.g., `mlbb-party-db`)
   - Select region
   - Click **Create**

3. **Get Connection String**
   - After creation, go to the database **Settings** tab
   - Copy the **`POSTGRES_PRISMA_URL`** connection string
   - This is the connection string you'll use

### Step 2: Configure Environment Variables

**Option A: In Vercel Dashboard**
1. Go to **Project Settings** → **Environment Variables**
2. Add:
   - **Key**: `DATABASE_URL`
   - **Value**: Paste `POSTGRES_PRISMA_URL` from database settings
   - **Environment**: Production, Preview, Development
   - Click **Save**

**Option B: Local Development**
Create `.env.local` file:
```env
DATABASE_URL=postgresql://default:password@host:5432/verceldb?sslmode=require
```

### Step 3: Generate Prisma Client

```bash
# Generate Prisma Client
npm run prisma:generate
# or
npx prisma generate
```

### Step 4: Create Initial Migration

**For Local Development:**
```bash
# Create initial migration from schema
npm run prisma:migrate:dev
# or
npx prisma migrate dev --name init
```

This will:
- Create a migration file in `prisma/migrations/`
- Apply the migration to your local database
- Generate Prisma Client

**For Production (Vercel):**
You need to push the migration files and apply them:

```bash
# 1. Pull environment variables from Vercel (optional for local testing)
vercel env pull .env.local

# 2. Generate Prisma Client
npm run prisma:generate

# 3. Create migration (if you haven't already)
npx prisma migrate dev --name init --create-only

# 4. Commit migration files to git
git add prisma/migrations/
git commit -m "Add initial database migration"
git push
```

### Step 5: Apply Migrations to Vercel Database

**Option A: Automatic (via Build)**
The build command in `package.json` already includes:
```json
"vercel-build": "prisma generate && prisma migrate deploy && next build"
```

This automatically runs migrations on each deployment.

**Option B: Manual (via CLI)**
```bash
# Link your Vercel project
vercel link

# Pull environment variables
vercel env pull .env.local

# Apply migrations
npm run prisma:migrate:deploy
# or
npx prisma migrate deploy
```

**Option C: Via Vercel Dashboard**
1. Go to your deployment
2. Click **Deployments** tab
3. The build process will run migrations automatically (configured in `vercel-build` script)

## Part 2: Setting Up Vercel Blob Storage

**Note**: Blob Storage doesn't require schema generation. It's a storage service.

### Step 1: Create Blob Store

1. **In Vercel Dashboard**
   - Go to your project → **Storage** tab
   - Click **Create Database**
   - Select **Blob**

2. **Configure Blob Store**
   - **Name**: `mlbb-uploads` (or your preferred name)
   - **Region**: Choose closest to your users
   - Click **Create**

### Step 2: Create Access Token

1. **Go to Blob Store Settings**
   - Click on your blob store
   - Go to **Settings** tab
   - Scroll to **Tokens** section

2. **Create Token**
   - Click **Create Token**
   - **Token Name**: `production-rw-token`
   - **Permissions**: Select **Read and Write**
   - Click **Create Token**

3. **Copy Token (IMPORTANT)**
   - Copy the token immediately (format: `vercel_blob_rw_xxxxx...`)
   - You won't see it again!

### Step 3: Add Environment Variable

1. **In Vercel Project Settings**
   - Go to **Settings** → **Environment Variables**
   - Click **Add New**
   - **Key**: `BLOB_READ_WRITE_TOKEN`
   - **Value**: Paste the token you copied
   - **Environment**: Production, Preview, Development (select all)
   - Click **Save**

**For Local Development:**
Add to `.env.local`:
```env
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

## Complete Setup Checklist

### PostgreSQL Setup
- [ ] Created Vercel Postgres database
- [ ] Copied `POSTGRES_PRISMA_URL` connection string
- [ ] Added `DATABASE_URL` environment variable in Vercel
- [ ] Added `DATABASE_URL` to local `.env.local`
- [ ] Ran `npx prisma generate` to generate Prisma Client
- [ ] Created initial migration: `npx prisma migrate dev --name init`
- [ ] Committed migration files to git
- [ ] Pushed to repository (migrations apply automatically on Vercel deploy)

### Blob Storage Setup
- [ ] Created Vercel Blob store
- [ ] Created Read-Write access token
- [ ] Copied token immediately
- [ ] Added `BLOB_READ_WRITE_TOKEN` environment variable in Vercel
- [ ] Added `BLOB_READ_WRITE_TOKEN` to local `.env.local`

## Verification

### Verify Database Schema

**Option 1: Using Prisma Studio**
```bash
npm run prisma:studio
# or
npx prisma studio
```
This opens a GUI to view your database.

**Option 2: Using psql**
```bash
# Connect to your database
psql "your-database-connection-string"

# List all tables
\dt

# Describe a table
\d "User"
\d "Friend"
```

**Option 3: Check Migration Status**
```bash
npx prisma migrate status
```

### Verify Blob Storage

Test blob upload via your API endpoint:
```bash
curl -X POST https://your-app.vercel.app/api/upload \
  -F "file=@test-image.png"
```

## Troubleshooting

### Database Migration Issues

**Problem**: Migration fails with connection error
- **Solution**: Verify `DATABASE_URL` is set correctly
- Check connection string includes `?sslmode=require` for production

**Problem**: Migration already applied error
- **Solution**: Run `npx prisma migrate resolve --applied <migration-name>`

**Problem**: Schema drift (local differs from production)
- **Solution**: 
  ```bash
  npx prisma migrate dev --name sync
  ```

### Blob Storage Issues

**Problem**: Upload fails with 403
- **Solution**: Verify `BLOB_READ_WRITE_TOKEN` is correct and has write permissions

**Problem**: Token not found
- **Solution**: Create a new token and update the environment variable

## Quick Reference Commands

```bash
# Generate Prisma Client
npx prisma generate

# Create migration (development)
npx prisma migrate dev --name migration-name

# Apply migrations (production)
npx prisma migrate deploy

# View database (GUI)
npx prisma studio

# Check migration status
npx prisma migrate status

# Format Prisma schema
npx prisma format
```

## Database Models Created

After running migrations, these tables will be created:

- `User` - User accounts
- `Friend` - Friends list
- `Match` - Match history
- `MatchPlayer` - Players in matches
- `Upload` - Uploaded screenshots
- `FriendStats` - Friend statistics and synergy scores
- `ModelFit` - Machine learning model fits

All relationships and constraints defined in `prisma/schema.prisma` will be enforced.
