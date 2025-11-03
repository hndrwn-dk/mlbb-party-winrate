# Troubleshooting Guide

This guide helps diagnose and fix common issues with the MLBB Party Winrate application.

## API 500 Errors

### Problem: `/api/friends` returns 500 Internal Server Error

**Possible Causes:**
1. Database connection not configured
2. Database migrations not applied
3. Prisma Client not generated
4. Missing environment variables

**Diagnosis Steps:**

1. **Check Health Endpoint**
   ```
   GET https://your-app.vercel.app/api/health
   ```
   This will tell you:
   - If `DATABASE_URL` is configured
   - If database connection works
   - If migrations are applied
   - Which tables exist

2. **Check Vercel Logs**
   - Go to Vercel Dashboard → Your Project → Deployments
   - Click on the latest deployment
   - Click "Functions" tab
   - Click on `/api/friends` function
   - View logs for error messages

3. **Verify Environment Variables**
   - Go to Vercel Dashboard → Settings → Environment Variables
   - Ensure `DATABASE_URL` is set
   - Ensure it's added to Production, Preview, and Development environments

**Solutions:**

#### Solution 1: Database Not Configured

If health check shows `DATABASE_URL not configured`:

1. **Create Vercel Postgres Database**
   - Go to Vercel Dashboard → Your Project → Storage
   - Create Postgres database
   - Copy `POSTGRES_PRISMA_URL`

2. **Add Environment Variable**
   - Settings → Environment Variables
   - Add: `DATABASE_URL` = `POSTGRES_PRISMA_URL` value
   - Save and redeploy

#### Solution 2: Migrations Not Applied

If health check shows `migrationsApplied: false`:

1. **Apply Migrations Locally First**
   ```bash
   # Pull environment variables
   vercel env pull .env.local
   
   # Generate Prisma Client
   npm run prisma:generate
   
   # Create migration (if needed)
   npm run prisma:migrate:dev --name init
   
   # Commit migration files
   git add prisma/migrations/
   git commit -m "Add database migrations"
   git push
   ```

2. **Migrations Auto-Apply on Vercel**
   - The `vercel-build` script includes `prisma migrate deploy`
   - This runs automatically on each deployment
   - Check build logs for migration errors

3. **Manual Migration via Vercel CLI**
   ```bash
   vercel env pull .env.local
   npm run prisma:migrate:deploy
   ```

#### Solution 3: Prisma Client Not Generated

If you see "Prisma Client not found" errors:

1. **Generate Prisma Client**
   ```bash
   npm run prisma:generate
   ```

2. **Verify in Build Logs**
   - Check Vercel build logs
   - Should see "Generated Prisma Client" message
   - If missing, add `prisma generate` to build script

## Common Error Messages

### "Can't reach database server"

**Cause**: Database connection string is incorrect or database is not accessible

**Solution**:
- Verify `DATABASE_URL` in Vercel environment variables
- Ensure connection string includes `?sslmode=require` for production
- Check if database is paused (Neon/Supabase) - unpause it

### "relation 'User' does not exist"

**Cause**: Database migrations not applied

**Solution**:
- Run migrations: `npm run prisma:migrate:deploy`
- Or push migration files to trigger auto-migration on Vercel

### "Prisma Client has not been initialized"

**Cause**: Prisma Client not generated

**Solution**:
```bash
npm run prisma:generate
```

### "Invalid DATABASE_URL"

**Cause**: Wrong connection string format

**Solution**:
- Use `POSTGRES_PRISMA_URL` from Vercel Postgres settings
- Format should be: `postgresql://user:pass@host:port/db?sslmode=require`

## Database Connection Issues

### Check Connection Locally

```bash
# Pull environment variables
vercel env pull .env.local

# Test connection
npx prisma db pull
# or
npx prisma studio
```

### Test Database Query

```typescript
// In your code or API route
import { prisma } from "@/lib/prisma";

try {
  await prisma.$connect();
  const result = await prisma.$queryRaw`SELECT 1`;
  console.log("Database connected:", result);
} catch (error) {
  console.error("Database connection failed:", error);
}
```

## Environment Variables Issues

### Verify All Required Variables

Check that these are set in Vercel:

- [ ] `DATABASE_URL` - PostgreSQL connection string
- [ ] `OPENAI_API_KEY` - OpenAI API key (optional for basic features)
- [ ] `BLOB_READ_WRITE_TOKEN` - Vercel Blob storage token
- [ ] `NEXTAUTH_SECRET` - Random string for auth
- [ ] `NEXTAUTH_URL` - Your Vercel app URL
- [ ] `APP_BASE_URL` - Your Vercel app URL

### Test Environment Variables

```bash
# Via Vercel CLI
vercel env ls

# Or check in dashboard
# Vercel Dashboard → Settings → Environment Variables
```

## Deployment Issues

### Build Fails with Prisma Errors

1. **Ensure migrations are committed**
   ```bash
   git add prisma/migrations/
   git commit -m "Add migrations"
   git push
   ```

2. **Check build command in package.json**
   ```json
   "vercel-build": "prisma generate && prisma migrate deploy && next build"
   ```

3. **Review build logs**
   - Check for Prisma Client generation
   - Check for migration application
   - Look for connection errors

### Runtime Errors After Deployment

1. **Redeploy after environment variable changes**
   - Environment variables require redeployment
   - Go to Deployments → Redeploy

2. **Check function logs**
   - Vercel Dashboard → Functions tab
   - View logs for specific errors

## Quick Diagnostic Commands

```bash
# Check database connection
npx prisma db pull

# View database schema
npx prisma studio

# Check migration status
npx prisma migrate status

# Generate Prisma Client
npm run prisma:generate

# Apply migrations
npm run prisma:migrate:deploy

# Test API locally
npm run dev
# Then visit: http://localhost:3000/api/health
```

## Getting Help

If issues persist:

1. **Check Health Endpoint**
   - Visit `/api/health` to get diagnostic info

2. **Review Logs**
   - Vercel Dashboard → Functions → View Logs
   - Look for specific error messages

3. **Test Locally**
   - Pull environment variables
   - Test database connection locally
   - Test API routes locally

4. **Common Solutions Checklist**
   - [ ] Database created in Vercel
   - [ ] `DATABASE_URL` environment variable set
   - [ ] Prisma Client generated
   - [ ] Migrations applied (check `/api/health`)
   - [ ] Redeployed after environment variable changes
   - [ ] All required environment variables present

## Next Steps

After fixing the issue:

1. Test the `/api/health` endpoint
2. Test the `/api/friends` endpoint
3. Verify database connection in logs
4. Monitor for any remaining errors
