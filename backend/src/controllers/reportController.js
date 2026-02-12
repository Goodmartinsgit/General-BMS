const { pool } = require('../config/db');

const getDashboardStats = async (req, res) => {
    try {
        // 1. Total Sales (Monthly)
        const salesRes = await pool.query(
            `SELECT COALESCE(SUM(total_amount), 0) as total_sales 
             FROM sales 
             WHERE created_at >= date_trunc('month', now())`
        );

        // 2. Active Orders
        const ordersRes = await pool.query(
            `SELECT COUNT(*) as active_orders 
             FROM wholesale_orders 
             WHERE status NOT IN ('Completed', 'Cancelled')`
        );

        // 3. Low Stock Items
        const stockRes = await pool.query(
            `SELECT COUNT(*) as low_stock 
             FROM inventory 
             WHERE quantity_on_hand <= 10`
        );

        // 4. Monthly Expenses
        const expenseRes = await pool.query(
            `SELECT COALESCE(SUM(amount), 0) as total_expenses 
             FROM expenses 
             WHERE expense_date >= date_trunc('month', now())`
        );

        // 5. Sales Trend (Last 7 Days)
        const trendRes = await pool.query(
            `SELECT date_trunc('day', created_at) as day, SUM(total_amount) as amount 
             FROM sales 
             WHERE created_at >= NOW() - INTERVAL '7 days'
             GROUP BY day ORDER BY day`
        );

        res.json({
            stats: {
                monthlySales: salesRes.rows[0].total_sales,
                activeOrders: ordersRes.rows[0].active_orders,
                lowStockAlerts: stockRes.rows[0].low_stock,
                monthlyExpenses: expenseRes.rows[0].total_expenses
            },
            salesTrend: trendRes.rows
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

const getInventoryReport = async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT p.product_name, b.branch_name, i.quantity_on_hand 
             FROM inventory i 
             JOIN products p ON i.product_id = p.id 
             JOIN branches b ON i.branch_id = b.id 
             ORDER BY i.quantity_on_hand ASC`
        );
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = { getDashboardStats, getInventoryReport };
