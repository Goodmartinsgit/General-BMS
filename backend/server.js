require('dotenv').config();
const validateEnv = require('./src/config/envValidator');
validateEnv();

const app = require('./src/app');
const autoMigrateCategories = require('./src/scripts/autoMigrateCategories');
const bcrypt = require('bcryptjs');
const { pool } = require('./src/config/db');

const PORT = process.env.PORT || 5000;

// ── Auto-seed super admin from environment variables ───────────────────────
async function seedSuperAdmin() {
  const email    = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  const fullName = process.env.ADMIN_NAME || 'Super Admin';

  if (!email || !password) {
    // No env vars set — skip silently (not required after first deploy)
    return;
  }

  try {
    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      console.log(`[seed] Admin user ${email} already exists — skipping.`);
      return;
    }

    // Ensure the super-admin role (id=1) exists
    await pool.query(`
      INSERT INTO roles (id, role_name, description, is_system_role, permissions)
      VALUES (1, 'Super Admin', 'Full system access', TRUE, '{"admin": true}')
      ON CONFLICT (id) DO NOTHING
    `);

    // Sync sequence to avoid duplicate key errors on custom role creation
    await pool.query("SELECT setval('roles_id_seq', COALESCE((SELECT MAX(id) FROM roles), 1))");

    const hash = await bcrypt.hash(password, 10);
    await pool.query(
      'INSERT INTO users (email, password_hash, full_name, role_id) VALUES ($1, $2, $3, $4)',
      [email, hash, fullName, 1]
    );
    console.log(`[seed] ✓ Super admin created: ${email}`);
  } catch (err) {
    console.error('[seed] Failed to create super admin:', err.message);
  }
}

const runAllMigrations = require('./src/scripts/run_all_migrations');

runAllMigrations()
  .then(() => autoMigrateCategories())
  .then(() => seedSuperAdmin())
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch(err => {
    console.error('Startup failed:', err);
    process.exit(1);
  });
