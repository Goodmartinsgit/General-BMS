const { pool } = require('../config/db');

const run = async () => {
    try {
        console.log('--- Roles ---');
        const roles = await pool.query('SELECT id, role_name, description FROM roles');
        console.table(roles.rows);

        console.log('\n--- Users ---');
        const users = await pool.query('SELECT id, email, full_name, role_id FROM users');
        console.table(users.rows);

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

run();
