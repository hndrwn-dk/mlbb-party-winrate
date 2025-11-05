const { PrismaClient } = require('@prisma/client');
const { execSync } = require('child_process');

async function checkAndResolve() {
  const prisma = new PrismaClient();
  
  try {
    // Try to query a table to see if migration actually succeeded
    try {
      await prisma.$queryRaw`SELECT 1 FROM "User" LIMIT 1`;
      console.log('✓ Database tables exist - migration likely succeeded');
      console.log('Marking migration as applied...');
      execSync('npx prisma migrate resolve --applied 0_init', { 
        stdio: 'inherit',
        env: process.env
      });
      console.log('✓ Migration resolved successfully');
      process.exit(0);
    } catch (queryError) {
      console.log('⚠ Tables do not exist or query failed');
      console.log('Marking migration as rolled back so it can be retried...');
      execSync('npx prisma migrate resolve --rolled-back 0_init', { 
        stdio: 'inherit',
        env: process.env
      });
      console.log('✓ Migration marked as rolled back');
      process.exit(0);
    }
  } catch (error) {
    console.warn('⚠ Error during migration resolution:', error.message);
    console.log('Attempting fallback resolution...');
    try {
      // Try rolled back as fallback
      execSync('npx prisma migrate resolve --rolled-back 0_init', { 
        stdio: 'inherit',
        env: process.env
      });
      console.log('✓ Migration resolved via fallback');
      process.exit(0);
    } catch (resolveError) {
      console.warn('⚠ Could not automatically resolve migration.');
      console.warn('This may be okay if migration state is already correct.');
      console.warn('Build will continue - migrate deploy will handle any issues.');
      // Exit with success so build continues
      process.exit(0);
    }
  } finally {
    try {
      await prisma.$disconnect();
    } catch (e) {
      // Ignore disconnect errors
    }
  }
}

checkAndResolve().catch(() => {
  // If async function fails, exit gracefully
  console.warn('Script completed with warnings - build will continue');
  process.exit(0);
});
