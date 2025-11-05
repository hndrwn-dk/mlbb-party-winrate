# Migration Resolution Scripts

## Automatic Migration Resolution

The `check-and-resolve-migration.js` script automatically resolves failed Prisma migrations during Vercel deployments.

### How it works:

1. Checks if database tables exist (indicating migration succeeded)
2. If tables exist: Marks migration as `applied`
3. If tables don't exist: Marks migration as `rolled-back` (allows retry)
4. Falls back gracefully if resolution fails

## Manual Resolution (if needed)

If automatic resolution fails, you can manually resolve the migration:

### Option 1: Mark as Applied (if tables already exist)

```bash
npx prisma migrate resolve --applied 0_init
```

### Option 2: Mark as Rolled Back (to retry migration)

```bash
npx prisma migrate resolve --rolled-back 0_init
```

### Option 3: Via Vercel CLI

```bash
vercel env pull
npx prisma migrate resolve --applied 0_init
# or
npx prisma migrate resolve --rolled-back 0_init
```

## Troubleshooting

If migrations continue to fail:

1. Check database connection: Ensure `DATABASE_URL` is set correctly
2. Verify tables exist: Connect to your database and check if tables are present
3. Check migration history: `npx prisma migrate status`
4. If needed, manually apply migration: `npx prisma migrate deploy`
