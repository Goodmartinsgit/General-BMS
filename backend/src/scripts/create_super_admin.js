const bcrypt = require('bcryptjs');
const { pool } = require('../config/db');

const run = async () => {
    const email = process.env.ADMIN_EMAIL || process.argv[2];
    const password = process.env.ADMIN_PASSWORD || process.argv[3];
    const fullName = process.env.ADMIN_NAME || process.argv[4] || 'Super Admin';
    const roleId = 1; // Super Admin role

    if (!email || !password) {
        console.error('Usage: node create_super_admin.js <email> <password> [fullName]');
        console.error('Or set ADMIN_EMAIL and ADMIN_PASSWORD environment variables.');
        process.exit(1);
    }

    try {
        console.log(`Checking if user ${email} already exists...`);
        const userCheck = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (userCheck.rows.length > 0) {
            console.log('User already exists. Updating password instead...');
            const hashedPassword = await bcrypt.hash(password, 10);
            await pool.query('UPDATE users SET password_hash = $1 WHERE email = $2', [hashedPassword, email]);
            console.log('Password updated successfully.');
        } else {
            console.log(`Creating new user: ${email}`);
            const hashedPassword = await bcrypt.hash(password, 10);
            await pool.query(
                'INSERT INTO users (email, password_hash, full_name, role_id) VALUES ($1, $2, $3, $4)',
                [email, hashedPassword, fullName, roleId]
            );
            console.log('User created successfully.');
        }
        process.exit(0);
    } catch (err) {
        console.error('Error creating super admin:', err);
        process.exit(1);
    }
};

run();
