require('dotenv').config();
const { pool } = require('./src/config/db');

async function main() {
  try {
    // Get user columns
    const cols = await pool.query(
      "SELECT column_name FROM information_schema.columns WHERE table_name = 'users' ORDER BY ordinal_position"
    );
    console.log('User columns:', cols.rows.map(x => x.column_name).join(', '));

    // Get all users with their roles - use SELECT * to avoid column name issues
    const users = await pool.query(
      'SELECT u.id, u.email, u.role_id, r.role_name FROM users u LEFT JOIN roles r ON u.role_id = r.id ORDER BY u.id'
    );
    console.log('\nUsers:');
    console.log(JSON.stringify(users.rows, null, 2));
  } catch (e) {
    console.error('Error:', e.message);
  } finally {
    pool.end();
  }
}
main();
