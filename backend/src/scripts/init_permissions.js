const { pool } = require('../config/db');

const initRoles = async () => {
    try {
        console.log('Initializing permissions for Admin role...');
        
        const permissions = {
            admin: true,
            manage_budgets: true,
            view_budgets: true,
            record_payments: true,
            view_payments: true,
            manage_expenses: true,
            view_reports: true
        };

        await pool.query(
            `UPDATE roles SET permissions = $1 WHERE role_name = 'Admin'`,
            [JSON.stringify(permissions)]
        );

        console.log('✅ Admin permissions initialized');
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

initRoles();
