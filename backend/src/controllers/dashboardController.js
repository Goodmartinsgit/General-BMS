const { pool } = require('../config/db');

// ── Helper: get role permissions for the current user ────────────────────────
async function getUserPermissions(userId) {
    const res = await pool.query(
        `SELECT r.permissions, r.role_level
         FROM users u JOIN roles r ON u.role_id = r.id
         WHERE u.id = $1 AND u.deleted_at IS NULL`,
        [userId]
    );
    if (res.rows.length === 0) return { permissions: {}, role_level: 99 };
    return {
        permissions: res.rows[0].permissions || {},
        role_level: res.rows[0].role_level ?? 99
    };
}

function hasPermission(perms, key) {
    return perms[key] === true || perms['admin'] === true;
}

const getDashboardStats = async (req, res) => {
    try {
        const userId = req.user.id;

        // Fetch fresh permissions from DB (not JWT — always current)
        const { permissions, role_level } = await getUserPermissions(userId);

        // Determine dashboard type from permissions:
        //  - Users with view_all_sales or view_dashboard_financials → admin dashboard
        //  - Users with admin permission or role_level <= 2 → admin dashboard
        //  - Everyone else → staff dashboard (personal data only)
        const isAdmin = hasPermission(permissions, 'view_dashboard_financials')
            || hasPermission(permissions, 'view_all_sales')
            || role_level <= 2;

        // Date filtering
        // NOTE: We filter on sale_date (the business date) not created_at.
        // End-date uses < (end + 1 day) so the full end day is included,
        // because comparing a TIMESTAMP against a bare DATE string truncates
        // to midnight and would exclude all records from that day.
        const { start_date, end_date } = req.query;
        let dateParams = [];

        // For staff queries: userId is $1, so date params start at $2
        // For admin queries: no userId prefix, so date params start at $1
        const staffDateFilter = (start_date && end_date)
            ? ` AND sale_date >= $2 AND sale_date < ($3::date + INTERVAL '1 day')`
            : '';
        const adminDateFilter = (start_date && end_date)
            ? ` AND sale_date >= $1 AND sale_date < ($2::date + INTERVAL '1 day')`
            : '';

        if (start_date && end_date) {
            dateParams = [start_date, end_date];
        }

        // ---------- STAFF DASHBOARD ----------
        if (!isAdmin) {
            const [personalStats, itemsSoldResult, customersServedResult, recentSales] = await Promise.all([
                pool.query(
                    `SELECT
                        COUNT(*) as my_sales_count,
                        COUNT(*) FILTER (WHERE DATE(sale_date) = CURRENT_DATE) as today_sales,
                        COALESCE(SUM(total_amount), 0) as my_total_revenue
                     FROM sales
                     WHERE processed_by = $1 AND status NOT IN ('cancelled', 'reversed')${staffDateFilter}`,
                    [userId, ...dateParams]
                ),
                pool.query(
                    `SELECT COALESCE(SUM(si.quantity), 0) as total_items_sold
                     FROM sale_items si
                     JOIN sales s ON si.sale_id = s.id
                     WHERE s.processed_by = $1 AND s.status NOT IN ('cancelled', 'reversed')${staffDateFilter.replace(/sale_date/g, 's.sale_date')}`,
                    [userId, ...dateParams]
                ),
                pool.query(
                    `SELECT COUNT(DISTINCT customer_id) as unique_customers
                     FROM sales
                     WHERE processed_by = $1 AND status NOT IN ('cancelled', 'reversed') AND customer_id IS NOT NULL${staffDateFilter}`,
                    [userId, ...dateParams]
                ),
                pool.query(
                    `SELECT s.id, s.sale_number as receipt_number, s.sale_date, s.total_amount, s.payment_method,
                            s.payment_status,
                            (SELECT COUNT(*) FROM sale_items WHERE sale_id = s.id) as item_count,
                            c.customer_name
                     FROM sales s
                     LEFT JOIN customers c ON s.customer_id = c.id
                     WHERE s.processed_by = $1 AND s.status NOT IN ('cancelled', 'reversed')${staffDateFilter.replace(/sale_date/g, 's.sale_date')}
                     ORDER BY s.sale_date DESC LIMIT 10`,
                    [userId, ...dateParams]
                )
            ]);

            return res.json({
                success: true,
                data: {
                    dashboard: {
                        personal_stats: {
                            my_sales_count: parseInt(personalStats.rows[0].my_sales_count),
                            today_sales: parseInt(personalStats.rows[0].today_sales),
                            my_total_revenue: parseFloat(personalStats.rows[0].my_total_revenue),
                            items_sold: parseInt(itemsSoldResult.rows[0].total_items_sold),
                            customers_served: parseInt(customersServedResult.rows[0].unique_customers)
                        },
                        recent_sales: recentSales.rows
                    }
                }
            });
        }

        // ---------- ADMIN / MANAGER DASHBOARD ----------

        // Parallel queries for performance
        const [
            salesResult,
            todaySalesResult,
            customersResult,
            newCustomersResult,
            inventoryResult,
            lowStockResult,
            expensesResult,
            profitResult,
            trendResult,
            topProductsResult,
            categoryRevenueResult
        ] = await Promise.all([
            // Total sales
            pool.query(
                `SELECT COUNT(*) as total_sales_count, COALESCE(SUM(total_amount), 0) as total_revenue
                 FROM sales WHERE status NOT IN ('cancelled', 'reversed')${adminDateFilter}`,
                [...dateParams]
            ),
            // Today's sales
            pool.query(
                `SELECT COUNT(*) as sales_count, COALESCE(SUM(total_amount), 0) as revenue
                 FROM sales WHERE DATE(created_at) = CURRENT_DATE AND status != 'cancelled'`
            ),
            // Total customers
            pool.query('SELECT COUNT(*) as total_customers FROM customers'),
            // New customers (30 days)
            pool.query(
                `SELECT COUNT(*) as new_customers FROM customers
                 WHERE created_at >= NOW() - INTERVAL '30 days'`
            ),
            // Inventory value
            pool.query(
                `SELECT COUNT(DISTINCT p.id) as total_products,
                        COALESCE(SUM(i.quantity_on_hand * p.retail_price), 0) as total_inventory_value
                 FROM inventory i
                 JOIN products p ON i.product_id = p.id
                 WHERE p.is_active = TRUE`
            ),
            pool.query(
                `SELECT COUNT(*) as low_stock_count FROM inventory i
                 JOIN products p ON i.product_id = p.id
                 WHERE i.quantity_on_hand <= COALESCE(p.reorder_level, 5)`
            ),
            // Expenses — respect the selected date range; fall back to current month
            pool.query(
                start_date && end_date
                    ? `SELECT COALESCE(SUM(amount), 0) as total_expenses
                       FROM expenses
                       WHERE expense_date >= $1 AND expense_date < ($2::date + INTERVAL '1 day')`
                    : `SELECT COALESCE(SUM(amount), 0) as total_expenses
                       FROM expenses
                       WHERE expense_date >= DATE_TRUNC('month', CURRENT_DATE)`,
                start_date && end_date ? [start_date, end_date] : []
            ),
            // Profit calculation (mirrors the sales query filter exactly)
            pool.query(
                `SELECT
                    COALESCE(SUM(total_amount), 0) as gross_revenue,
                    COALESCE(SUM(profit_total), 0) as gross_profit
                 FROM sales WHERE status NOT IN ('cancelled', 'reversed')${adminDateFilter}`,
                [...dateParams]
            ),
            // Sales trend (last 14 days or date range)
            pool.query(
                start_date && end_date
                    ? `SELECT DATE(sale_date) as date, COALESCE(SUM(total_amount), 0) as amount, COUNT(*) as count
                       FROM sales WHERE status NOT IN ('cancelled', 'reversed') AND sale_date >= $1 AND sale_date < ($2::date + INTERVAL '1 day')
                       GROUP BY DATE(sale_date) ORDER BY date`
                    : `SELECT DATE(sale_date) as date, COALESCE(SUM(total_amount), 0) as amount, COUNT(*) as count
                       FROM sales WHERE status NOT IN ('cancelled', 'reversed') AND sale_date >= NOW() - INTERVAL '14 days'
                       GROUP BY DATE(sale_date) ORDER BY date`,
                start_date && end_date ? [start_date, end_date] : []
            ),
            // Top products
            pool.query(
                `SELECT p.product_name, p.product_code,
                        SUM(si.quantity) as total_sold,
                        SUM(si.line_total) as total_revenue
                 FROM sale_items si
                 JOIN products p ON si.product_id = p.id
                 JOIN sales s ON si.sale_id = s.id
                 WHERE s.status NOT IN ('cancelled', 'reversed')${adminDateFilter.replace(/sale_date/g, 's.sale_date')}
                 GROUP BY p.id, p.product_name, p.product_code
                 ORDER BY total_sold DESC LIMIT 10`,
                [...dateParams]
            ),
            // Revenue by category
            pool.query(
                `SELECT COALESCE(c.category_name, 'Uncategorized') as category,
                        SUM(si.line_total) as revenue
                 FROM sale_items si
                 JOIN products p ON si.product_id = p.id
                 LEFT JOIN categories c ON p.category_id = c.id
                 JOIN sales s ON si.sale_id = s.id
                 WHERE s.status NOT IN ('cancelled', 'reversed')${adminDateFilter.replace(/sale_date/g, 's.sale_date')}
                 GROUP BY c.id, c.category_name
                 ORDER BY revenue DESC LIMIT 8`,
                [...dateParams]
            )
        ]);

        const grossProfit = parseFloat(profitResult.rows[0].gross_profit);
        const totalRevenue = parseFloat(salesResult.rows[0].total_revenue);
        const totalExpenses = parseFloat(expensesResult.rows[0].total_expenses);
        const netProfit = grossProfit - totalExpenses;
        const profitMargin = totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(1) : 0;

        // If user doesn't have view_dashboard_financials, zero out financial data
        const showFinancials = hasPermission(permissions, 'view_dashboard_financials');

        res.json({
            success: true,
            data: {
                dashboard: {
                    overview: {
                        sales: {
                            total_revenue: showFinancials ? totalRevenue : undefined,
                            total_sales_count: parseInt(salesResult.rows[0].total_sales_count),
                            today: {
                                revenue: showFinancials ? parseFloat(todaySalesResult.rows[0].revenue) : undefined,
                                sales_count: parseInt(todaySalesResult.rows[0].sales_count)
                            }
                        },
                        customers: {
                            total_customers: parseInt(customersResult.rows[0].total_customers),
                            new_customers_30_days: parseInt(newCustomersResult.rows[0].new_customers)
                        },
                        inventory: {
                            total_products: parseInt(inventoryResult.rows[0].total_products),
                            total_inventory_value: showFinancials ? parseFloat(inventoryResult.rows[0].total_inventory_value) : undefined,
                            low_stock_count: parseInt(lowStockResult.rows[0].low_stock_count)
                        },
                        financial_health: showFinancials ? {
                            gross_profit: grossProfit,
                            net_profit: netProfit,
                            profit_margin: parseFloat(profitMargin),
                            total_expenses: totalExpenses,
                            total_deductions: totalExpenses
                        } : undefined
                    },
                    charts: {
                        sales_trend: trendResult.rows,
                        top_products: topProductsResult.rows,
                        revenue_by_category: categoryRevenueResult.rows
                    }
                }
            }
        });
    } catch (err) {
        console.error('Error fetching dashboard stats:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

const getActivityFeed = async (req, res) => {
    try {
        const { limit = 20 } = req.query;
        const userId = req.user.id;

        // Check if user can see all activity or only their own
        const { permissions } = await getUserPermissions(userId);
        const canSeeAll = hasPermission(permissions, 'view_all_sales');

        const userFilter = canSeeAll ? '' : ` WHERE s.processed_by = '${userId}'`;
        const expenseFilter = canSeeAll ? '' : ` WHERE e.submitted_by = '${userId}'`;

        // Use parameterised userId to avoid injection
        let queryText;
        let queryParams;

        if (canSeeAll) {
            queryText = `
                (SELECT 'sale_' || s.id::text as id, 'sale' as type,
                 'New sale #' || COALESCE(s.sale_number, s.id::text) as description,
                 u.full_name as user_name,
                 s.total_amount as amount, s.created_at
                 FROM sales s LEFT JOIN users u ON s.processed_by = u.id
                 WHERE s.status != 'cancelled'
                 ORDER BY s.created_at DESC LIMIT 10)
                UNION ALL
                (SELECT 'expense_' || e.id::text as id, 'expense' as type,
                 e.description, u.full_name as user_name,
                 e.amount, e.created_at
                 FROM expenses e LEFT JOIN users u ON e.submitted_by = u.id
                 ORDER BY e.created_at DESC LIMIT 10)
                ORDER BY created_at DESC LIMIT $1`;
            queryParams = [parseInt(limit)];
        } else {
            queryText = `
                (SELECT 'sale_' || s.id::text as id, 'sale' as type,
                 'New sale #' || COALESCE(s.sale_number, s.id::text) as description,
                 u.full_name as user_name,
                 s.total_amount as amount, s.created_at
                 FROM sales s LEFT JOIN users u ON s.processed_by = u.id
                 WHERE s.status != 'cancelled' AND s.processed_by = $1
                 ORDER BY s.created_at DESC LIMIT 10)
                UNION ALL
                (SELECT 'expense_' || e.id::text as id, 'expense' as type,
                 e.description, u.full_name as user_name,
                 e.amount, e.created_at
                 FROM expenses e LEFT JOIN users u ON e.submitted_by = u.id
                 WHERE e.submitted_by = $1
                 ORDER BY e.created_at DESC LIMIT 10)
                ORDER BY created_at DESC LIMIT $2`;
            queryParams = [userId, parseInt(limit)];
        }

        const activities = await pool.query(queryText, queryParams);
        res.json(activities.rows);
    } catch (err) {
        console.error('Error fetching activity feed:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

const getQuickActionCounts = async (req, res) => {
    try {
        const results = { pending_tasks: 0, low_stock_items: 0, overdue_bills: 0 };

        // Each query individually so one table failure doesn't crash all
        try {
            const r = await pool.query(`SELECT COUNT(*) FROM tasks WHERE status = 'pending' AND is_deleted = FALSE`);
            results.pending_tasks = parseInt(r.rows[0].count);
        } catch (e) { console.error('Quick action - tasks query failed:', e.message); }

        try {
            const r = await pool.query(`SELECT COUNT(*) FROM inventory i JOIN products p ON i.product_id = p.id WHERE i.quantity_on_hand <= COALESCE(p.reorder_level, 5)`);
            results.low_stock_items = parseInt(r.rows[0].count);
        } catch (e) { console.error('Quick action - inventory query failed:', e.message); }

        try {
            const r = await pool.query(`SELECT COUNT(*) FROM bills WHERE due_date < CURRENT_DATE AND status NOT IN ('paid', 'cancelled')`);
            results.overdue_bills = parseInt(r.rows[0].count);
        } catch (e) { console.error('Quick action - bills query failed:', e.message); }

        res.json(results);
    } catch (err) {
        console.error('Error fetching quick action counts:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = { getDashboardStats, getActivityFeed, getQuickActionCounts };
