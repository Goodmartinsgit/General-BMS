const { pool } = require('../src/config/db');
const bcrypt = require('bcrypt');

const seed = async () => {
    try {
        console.log('Seeding database...');

        // 1. Create Super Admin Role
        let roleId;
        const roleCheck = await pool.query("SELECT id FROM roles WHERE role_name = 'Super Admin'");
        
        if (roleCheck.rows.length > 0) {
            roleId = roleCheck.rows[0].id;
            console.log('Super Admin role already exists.');
        } else {
            const newRole = await pool.query(
                "INSERT INTO roles (role_name, description, is_system_role) VALUES ($1, $2, $3) RETURNING id",
                ['Super Admin', 'Full system access', true]
            );
            roleId = newRole.rows[0].id;
            console.log('Created Super Admin role.');
        }

        // 2. Create Default Admin User
        const email = 'admin@bms.com';
        const password = 'admin123';
        
        const userCheck = await pool.query("SELECT id FROM users WHERE email = $1", [email]);
        
        if (userCheck.rows.length > 0) {
            console.log('Default admin user already exists.');
        } else {
            const hashedPassword = await bcrypt.hash(password, 10);
            await pool.query(
                "INSERT INTO users (email, password_hash, full_name, role_id, is_active) VALUES ($1, $2, $3, $4, $5)",
                [email, hashedPassword, 'System Administrator', roleId, true]
            );
            console.log(`Created default admin user: ${email} / ${password}`);
        }

        console.log('Seeding completed successfully.');
        process.exit(0);
    } catch (err) {
        console.error('Seeding failed:', err);
        process.exit(1);
    }
};

seed();
