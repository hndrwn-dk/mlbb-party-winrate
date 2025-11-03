# Vercel Setup Guide - Quick Reference

This guide provides step-by-step instructions for setting up Vercel Postgres Database and Vercel Blob Storage.

## Prerequisites

- Vercel account (sign up at [vercel.com](https://vercel.com))
- Vercel project deployed or ready to deploy

## Step 1: Set Up Vercel Postgres Database

### Via Dashboard (Recommended)

1. **Navigate to your Vercel project**
   - Go to [vercel.com/dashboard](https://vercel.com/dashboard)
   - Select your project

2. **Create Postgres Database**
   - Click on the **Storage** tab
   - Click **Create Database** button
   - Select **Postgres** from the options

3. **Configure Database**
   - **Name**: `mlbb-party-db` (or your preferred name)
   - **Region**: Choose closest to your users
   - Click **Create**

4. **Get Connection String**
   - After creation, go to the database **Settings** tab
   - You'll see multiple connection strings:
     - `POSTGRES_PRISMA_URL` - Use this for Prisma (pooled connection)
     - `POSTGRES_URL_NON_POOLING` - For direct connections
     - `POSTGRES_URL` - General connection string

5. **Set Environment Variable**
   - Go to **Project Settings** → **Environment Variables**
   - Add new variable:
     - **Key**: `DATABASE_URL`
     - **Value**: Copy `POSTGRES_PRISMA_URL` from database settings
     - **Environment**: Select Production, Preview, and Development
   - Click **Save**

### Via CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Link project (if not already linked)
vercel link

# Create Postgres database
vercel storage create postgres --name mlbb-party-db

# The connection strings will be automatically added as environment variables
```

## Step 2: Set Up Vercel Blob Storage

### Via Dashboard (Recommended)

1. **Create Blob Store**
   - In your Vercel project, go to **Storage** tab
   - Click **Create Database**
   - Select **Blob**

2. **Configure Blob Store**
   - **Name**: `mlbb-uploads` (or your preferred name)
   - **Region**: Choose closest to your users
   - Click **Create**

3. **Create Access Token**
   - Go to your Blob store
   - Click on **Settings** tab
   - Scroll to **Tokens** section
   - Click **Create Token**
   - **Token Name**: `production-rw-token`
   - **Permissions**: Select **Read and Write**
   - Click **Create Token**

4. **Copy Token (IMPORTANT)**
   - Copy the token immediately
   - Format: `vercel_blob_rw_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
   - **Note**: You won't be able to see this token again after closing

5. **Add Environment Variable**
   - Go to **Project Settings** → **Environment Variables**
   - Click **Add New**
   - **Key**: `BLOB_READ_WRITE_TOKEN`
   - **Value**: Paste the token you copied
   - **Environment**: Production, Preview, Development (select all)
   - Click **Save**

## Step 3: Verify Environment Variables

After setting up both services, verify these environment variables exist:

1. **DATABASE_URL** (from Postgres)
2. **BLOB_READ_WRITE_TOKEN** (from Blob store)

You can check them in:
- **Project Settings** → **Environment Variables**

## Step 4: Run Database Migrations

After setting up the database, run Prisma migrations:

### Option 1: Via Vercel Build Command

Add to your build command in `package.json`:
```json
{
  "scripts": {
    "vercel-build": "prisma generate && prisma migrate deploy && next build"
  }
}
```

### Option 2: Via Vercel CLI (Local)

```bash
# Pull environment variables
vercel env pull .env.local

# Generate Prisma Client
pnpm prisma generate

# Run migrations
pnpm prisma migrate deploy
```

### Option 3: Via Vercel Dashboard

1. Go to your project → **Settings** → **Build & Development Settings**
2. Update **Build Command** to:
   ```
   pnpm prisma generate && pnpm prisma migrate deploy && pnpm build
   ```

## Troubleshooting

### Database Connection Issues

- Ensure `DATABASE_URL` uses `POSTGRES_PRISMA_URL` (not `POSTGRES_URL`)
- Check that SSL is enabled in connection string (`?sslmode=require`)
- Verify the environment variable is set for all environments

### Blob Upload Issues

- Verify `BLOB_READ_WRITE_TOKEN` is correctly set
- Check token permissions include "Write"
- Ensure token hasn't expired or been revoked

### Migration Issues

- Make sure `prisma/migrations` folder is committed to git
- Verify Prisma Client is generated: `pnpm prisma generate`
- Check build logs for migration errors

## Quick Checklist

- [ ] Vercel Postgres database created
- [ ] `DATABASE_URL` environment variable set
- [ ] Vercel Blob store created
- [ ] Blob token created and copied
- [ ] `BLOB_READ_WRITE_TOKEN` environment variable set
- [ ] Prisma migrations run successfully
- [ ] Project deployed successfully

## Next Steps

1. Configure other environment variables (OpenAI API key, etc.)
2. Deploy your project
3. Test database connections and blob uploads
