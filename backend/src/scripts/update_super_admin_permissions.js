const { pool } = require('../config/db');

const updatePermissions = async () => {
    try {
        console.log('Updating Super Admin permissions...');

        const permissions = {
            admin: true,

            // Budget permissions
            manage_budgets: true,
            view_budgets: true,

            // Payment permissions
            record_payments: true,
            view_payments: true,

            // Expense permissions
            manage_expenses: true,
            view_expenses: true,

            // Sales permissions
            view_sales: true,
            manage_sales: true,
            create_sales: true,
            cancel_sales: true,

            // Product permissions
            view_products: true,
            manage_products: true,

            // Inventory permissions
            view_inventory: true,
            manage_inventory: true,

            // Customer permissions
            view_customers: true,
            manage_customers: true,
            create_customers: true,
            update_customers: true,
            delete_customers: true,

            // User permissions
            view_users: true,
            manage_users: true,

            // Report permissions
            view_reports: true,

            // Branch permissions
            view_branches: true,
            manage_branches: true,

            // Online Order permissions
            view_online_orders: true,
            process_online_orders: true,
            verify_order_payment: true,
            update_order_tracking: true,
            edit_order_notes: true,
            manage_change_requests: true,
            view_online_store: true,
            manage_online_store: true
        };

        await pool.query(
            `UPDATE roles SET permissions = $1 WHERE role_name = 'Super Admin'`,
            [JSON.stringify(permissions)]
        );

        const result = await pool.query(
            `SELECT role_name, permissions FROM roles WHERE role_name = 'Super Admin'`
        );

        console.log('✅ Super Admin permissions updated successfully!');
        console.log('Permissions:', JSON.stringify(result.rows[0].permissions, null, 2));

        process.exit(0);
    } catch (err) {
        console.error('❌ Error updating permissions:', err);
        process.exit(1);
    }
};

updatePermissions();
