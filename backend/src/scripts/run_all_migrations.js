const { pool } = require('../config/db');
const fs = require('fs');
const path = require('path');

// Create migrations tracking table
async function createMigrationsTable(client) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id SERIAL PRIMARY KEY,
      migration_name VARCHAR(255) UNIQUE NOT NULL,
      executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

// Check if migration has been run
async function isMigrationExecuted(client, migrationName) {
  const result = await client.query(
    'SELECT * FROM schema_migrations WHERE migration_name = $1',
    [migrationName]
  );
  return result.rows.length > 0;
}

// Record migration execution
async function recordMigration(client, migrationName) {
  await client.query(
    'INSERT INTO schema_migrations (migration_name) VALUES ($1) ON CONFLICT (migration_name) DO NOTHING',
    [migrationName]
  );
}

async function runAllMigrations() {
  const client = await pool.connect();
  
  try {
    console.log('=== Starting Database Migration Process ===\n');
    
    // Create migrations tracking table
    await createMigrationsTable(client);
    console.log('✓ Migrations tracking table ready\n');

    // Get all migration files
    const migrationsDir = path.join(__dirname, '../../database/migrations');
    const files = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort(); // Sort to ensure order

    console.log(`Found ${files.length} migration files\n`);
    console.log('--- Running Migrations ---\n');

    let executed = 0;
    let skipped = 0;
    let failed = 0;

    for (const file of files) {
      const migrationName = file;
      
      // Check if already executed
      if (await isMigrationExecuted(client, migrationName)) {
        console.log(`⊘ ${migrationName.padEnd(50)} SKIPPED (already executed)`);
        skipped++;
        continue;
      }

      try {
        // Read and execute migration
        const migrationPath = path.join(migrationsDir, file);
        const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
        
        // Begin transaction for this migration
        await client.query('BEGIN');
        
        // Execute migration
        await client.query(migrationSQL);
        
        // Record migration
        await recordMigration(client, migrationName);
        
        // Commit transaction
        await client.query('COMMIT');
        
        console.log(`✓ ${migrationName.padEnd(50)} EXECUTED`);
        executed++;
        
      } catch (err) {
        // Rollback on error
        await client.query('ROLLBACK');
        console.error(`✗ ${migrationName.padEnd(50)} FAILED`);
        console.error(`  Error: ${err.message}\n`);
        failed++;
        
        // Continue with other migrations instead of stopping
        // If you want to stop on first error, uncomment the next line:
        // throw err;
      }
    }

    console.log('\n--- Migration Summary ---\n');
    console.log(`Total migrations: ${files.length}`);
    console.log(`✓ Executed: ${executed}`);
    console.log(`⊘ Skipped: ${skipped}`);
    console.log(`✗ Failed: ${failed}`);

    if (failed > 0) {
      console.log('\n⚠️  Some migrations failed. Check errors above.');
    } else {
      console.log('\n✓ All migrations completed successfully!');
    }

    // Show current database state
    console.log('\n--- Database Tables ---\n');
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `);
    
    console.log(`Total tables: ${tablesResult.rows.length}`);
    tablesResult.rows.forEach((row, index) => {
      console.log(`  ${(index + 1).toString().padStart(2)}. ${row.table_name}`);
    });

    console.log('\n=== Migration Process Complete ===\n');

  } catch (err) {
    console.error('\n❌ Critical migration error:', err.message);
    console.error('Full error:', err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

runAllMigrations();
