const { execSync } = require('child_process');

try {
  console.log('Attempting to resolve failed migration...');
  // Try to mark the failed migration as rolled back so it can be retried
  // This is safe because migrate deploy will reapply it if needed
  execSync('npx prisma migrate resolve --rolled-back 0_init', { 
    stdio: 'inherit',
    env: { ...process.env }
  });
  console.log('✓ Migration marked as rolled back');
} catch (error) {
  // If resolve fails, try marking as applied (in case tables already exist)
  console.log('Rolled back failed, trying to mark as applied...');
  try {
    execSync('npx prisma migrate resolve --applied 0_init', { 
      stdio: 'inherit',
      env: { ...process.env }
    });
    console.log('✓ Migration marked as applied');
  } catch (applyError) {
    console.warn('⚠ Could not automatically resolve migration. This is okay if tables already exist.');
    console.warn('Migration will be attempted during migrate deploy...');
  }
}
