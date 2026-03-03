const { pool } = require('../config/db');

async function fixBrandingConfig() {
  const client = await pool.connect();
  try {
    console.log('Starting branding config fix...\n');

    // Step 1: Create organizations table if it doesn't exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS organizations (
        id SERIAL PRIMARY KEY,
        organization_name VARCHAR(150) NOT NULL DEFAULT 'General BMS',
        logo_url TEXT,
        address TEXT,
        phone VARCHAR(20),
        email VARCHAR(100),
        website VARCHAR(100),
        tax_number VARCHAR(50),
        registration_number VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✓ Organizations table created/verified');

    // Step 2: Insert default organization if none exists
    const orgCheck = await client.query('SELECT COUNT(*) FROM organizations');
    if (parseInt(orgCheck.rows[0].count) === 0) {
      await client.query(`
        INSERT INTO organizations (organization_name, created_at)
        VALUES ('General BMS', CURRENT_TIMESTAMP)
      `);
      console.log('✓ Default organization created');
    } else {
      console.log('✓ Organization already exists');
    }

    // Step 3: Fix branding_config table constraints
    await client.query(`
      ALTER TABLE branding_config 
      DROP CONSTRAINT IF EXISTS branding_config_organization_id_key
    `);
    console.log('✓ Dropped old unique constraint');

    await client.query(`
      ALTER TABLE branding_config 
      ALTER COLUMN organization_id DROP NOT NULL
    `);
    console.log('✓ Made organization_id nullable');

    // Step 4: Clean up duplicate NULL organization_id rows (keep only the latest)
    await client.query(`
      DELETE FROM branding_config
      WHERE id NOT IN (
        SELECT MAX(id)
        FROM branding_config
        WHERE organization_id IS NULL
      )
      AND organization_id IS NULL
    `);
    console.log('✓ Cleaned up duplicate NULL organization_id rows');

    // Step 5: Link existing branding config to the organization
    const orgResult = await client.query('SELECT id FROM organizations LIMIT 1');
    if (orgResult.rows.length > 0) {
      const orgId = orgResult.rows[0].id;
      
      // First, delete all but the most recent branding_config row
      await client.query(`
        DELETE FROM branding_config
        WHERE id NOT IN (
          SELECT MAX(id) FROM branding_config
        )
      `);
      console.log('✓ Kept only the most recent branding config');
      
      // Now update the remaining row
      await client.query(`
        UPDATE branding_config 
        SET organization_id = $1 
        WHERE organization_id IS NULL
      `, [orgId]);
      console.log('✓ Linked branding config to organization');
    }

    // Step 6: Create proper unique constraint
    await client.query(`
      DROP INDEX IF EXISTS branding_config_org_id_unique
    `);
    await client.query(`
      CREATE UNIQUE INDEX branding_config_org_id_unique 
      ON branding_config (organization_id) 
      WHERE organization_id IS NOT NULL
    `);
    console.log('✓ Created unique index for organization_id');

    console.log('\n=== Branding config fix completed successfully! ===');
    console.log('You can now save branding settings from the Settings page.\n');

  } catch (err) {
    console.error('Error fixing branding config:', err.message);
    console.error('Full error:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

fixBrandingConfig();
