const pool = require('../config/db');

// Helper to get date range from period
const getDateRange = (period) => {
    const now = new Date();
    let startDate;

    switch (period) {
        case 'today':
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            break;
        case 'week':
            startDate = new Date(now);
            startDate.setDate(now.getDate() - 7);
            break;
        case 'month':
            startDate = new Date(now);
            startDate.setMonth(now.getMonth() - 1);
            break;
        case 'quarter':
            startDate = new Date(now);
            startDate.setMonth(now.getMonth() - 3);
            break;
        case 'year':
            startDate = new Date(now);
            startDate.setFullYear(now.getFullYear() - 1);
            break;
        default:
            startDate = new Date(now);
            startDate.setMonth(now.getMonth() - 1);
    }

    return { startDate, endDate: now };
};

// Helper to get the previous period for growth calculation
const getPreviousDateRange = (period) => {
    const { startDate, endDate } = getDateRange(period);
    const duration = endDate - startDate;
    const prevEnd = new Date(startDate);
    const prevStart = new Date(prevEnd - duration);
    return { startDate: prevStart, endDate: prevEnd };
};

// GET /analytics/sales
const getSalesAnalytics = async (req, res) => {
    try {
        const { period = 'month', branch_id } = req.query;
        const { startDate, endDate } = getDateRange(period);
        const prev = getPreviousDateRange(period);

        let branchFilter = '';
        let branchFilterPrev = '';
        const params = [startDate, endDate];
        const prevParams = [prev.startDate, prev.endDate];

        if (branch_id) {
            branchFilter = ' AND s.branch_id = $3';
            branchFilterPrev = ' AND s.branch_id = $3';
            params.push(branch_id);
            prevParams.push(branch_id);
        }

        // Current period stats
        const currentQuery = `
            SELECT
                COALESCE(SUM(s.total_amount), 0) as total_revenue,
                COUNT(s.id) as total_orders,
                COALESCE(AVG(s.total_amount), 0) as average_order_value,
                COUNT(DISTINCT s.customer_id) as total_customers
            FROM sales s
            WHERE s.status != 'cancelled'
              AND s.deleted_at IS NULL
              AND s.sale_date >= $1 AND s.sale_date <= $2
              ${branchFilter}
        `;

        // Previous period stats for growth
        const prevQuery = `
            SELECT
                COALESCE(SUM(s.total_amount), 0) as total_revenue,
                COUNT(s.id) as total_orders
            FROM sales s
            WHERE s.status != 'cancelled'
              AND s.deleted_at IS NULL
              AND s.sale_date >= $1 AND s.sale_date <= $2
              ${branchFilterPrev}
        `;

        const [currentResult, prevResult] = await Promise.all([
            pool.query(currentQuery, params),
            pool.query(prevQuery, prevParams)
        ]);

        const current = currentResult.rows[0];
        const previous = prevResult.rows[0];

        const revenueGrowth = previous.total_revenue > 0
            ? (((current.total_revenue - previous.total_revenue) / previous.total_revenue) * 100).toFixed(1)
            : 0;

        const ordersGrowth = previous.total_orders > 0
            ? (((current.total_orders - previous.total_orders) / previous.total_orders) * 100).toFixed(1)
            : 0;

        res.json({
            total_revenue: parseFloat(current.total_revenue),
            total_orders: parseInt(current.total_orders),
            average_order_value: parseFloat(current.average_order_value),
            total_customers: parseInt(current.total_customers),
            revenue_growth: parseFloat(revenueGrowth),
            orders_growth: parseFloat(ordersGrowth)
        });
    } catch (error) {
        console.error('Error in getSalesAnalytics:', error);
        res.status(500).json({ message: 'Failed to fetch sales analytics' });
    }
};

// GET /analytics/sales/trend
const getSalesTrend = async (req, res) => {
    try {
        const { period = 'month', branch_id } = req.query;
        const { startDate, endDate } = getDateRange(period);

        let branchFilter = '';
        const params = [startDate, endDate];

        if (branch_id) {
            branchFilter = ' AND s.branch_id = $3';
            params.push(branch_id);
        }

        // Choose grouping based on period
        let dateGroup, dateFormat;
        if (period === 'today') {
            dateGroup = "DATE_TRUNC('hour', s.sale_date)";
            dateFormat = "TO_CHAR(DATE_TRUNC('hour', s.sale_date), 'HH24:00')";
        } else if (period === 'week' || period === 'month') {
            dateGroup = "DATE_TRUNC('day', s.sale_date)";
            dateFormat = "TO_CHAR(DATE_TRUNC('day', s.sale_date), 'Mon DD')";
        } else {
            dateGroup = "DATE_TRUNC('month', s.sale_date)";
            dateFormat = "TO_CHAR(DATE_TRUNC('month', s.sale_date), 'Mon YYYY')";
        }

        const trendQuery = `
            SELECT
                ${dateFormat} as date,
                COALESCE(SUM(s.total_amount), 0) as revenue,
                COUNT(s.id) as orders
            FROM sales s
            WHERE s.status != 'cancelled'
              AND s.deleted_at IS NULL
              AND s.sale_date >= $1 AND s.sale_date <= $2
              ${branchFilter}
            GROUP BY ${dateGroup}
            ORDER BY ${dateGroup} ASC
        `;

        const result = await pool.query(trendQuery, params);

        res.json({
            trend: result.rows.map(row => ({
                date: row.date,
                revenue: parseFloat(row.revenue),
                orders: parseInt(row.orders)
            }))
        });
    } catch (error) {
        console.error('Error in getSalesTrend:', error);
        res.status(500).json({ message: 'Failed to fetch sales trend' });
    }
};

// ============ INVENTORY ANALYTICS ============

// GET /analytics/inventory/value
const getInventoryValue = async (req, res) => {
    try {
        const { branch_id } = req.query;

        let branchFilter = '';
        const params = [];

        if (branch_id) {
            branchFilter = ' AND i.branch_id = $1';
            params.push(branch_id);
        }

        // Overall stats
        const statsQuery = `
            SELECT
                COUNT(DISTINCT p.id) as total_products,
                COALESCE(SUM(i.quantity_on_hand * p.cost_price), 0) as total_value,
                COUNT(DISTINCT CASE WHEN i.quantity_on_hand > 0 AND i.quantity_on_hand <= p.reorder_level THEN p.id END) as low_stock_count,
                COUNT(DISTINCT CASE WHEN i.quantity_on_hand <= 0 THEN p.id END) as out_of_stock_count
            FROM products p
            LEFT JOIN inventory i ON p.id = i.product_id
            WHERE p.deleted_at IS NULL AND p.is_active = true
              ${branchFilter}
        `;

        // By category breakdown
        const categoryQuery = `
            SELECT
                COALESCE(c.category_name, 'Uncategorized') as category_name,
                COALESCE(SUM(i.quantity_on_hand * p.cost_price), 0) as total_value,
                COALESCE(SUM(i.quantity_on_hand), 0) as total_quantity
            FROM products p
            LEFT JOIN inventory i ON p.id = i.product_id
            LEFT JOIN categories c ON p.category_id = c.id
            WHERE p.deleted_at IS NULL AND p.is_active = true
              ${branchFilter}
            GROUP BY c.category_name
            ORDER BY total_value DESC
            LIMIT 10
        `;

        const [statsResult, categoryResult] = await Promise.all([
            pool.query(statsQuery, params),
            pool.query(categoryQuery, params)
        ]);

        const stats = statsResult.rows[0];

        res.json({
            total_products: parseInt(stats.total_products),
            total_value: parseFloat(stats.total_value),
            low_stock_count: parseInt(stats.low_stock_count),
            out_of_stock_count: parseInt(stats.out_of_stock_count),
            by_category: categoryResult.rows.map(row => ({
                category_name: row.category_name,
                total_value: parseFloat(row.total_value),
                total_quantity: parseInt(row.total_quantity)
            }))
        });
    } catch (error) {
        console.error('Error in getInventoryValue:', error);
        res.status(500).json({ message: 'Failed to fetch inventory value' });
    }
};

// GET /analytics/inventory/low-stock
const getLowStockItems = async (req, res) => {
    try {
        const { branch_id } = req.query;

        let branchFilter = '';
        const params = [];

        if (branch_id) {
            branchFilter = ' AND i.branch_id = $1';
            params.push(branch_id);
        }

        const query = `
            SELECT
                p.id,
                p.product_name,
                p.product_code as sku,
                i.quantity_on_hand as current_stock,
                p.reorder_level,
                b.branch_name
            FROM products p
            JOIN inventory i ON p.id = i.product_id
            LEFT JOIN branches b ON i.branch_id = b.id
            WHERE p.deleted_at IS NULL
              AND p.is_active = true
              AND i.quantity_on_hand <= p.reorder_level
              ${branchFilter}
            ORDER BY i.quantity_on_hand ASC
            LIMIT 50
        `;

        const result = await pool.query(query, params);

        res.json({
            items: result.rows.map(row => ({
                id: row.id,
                product_name: row.product_name,
                sku: row.sku,
                current_stock: parseInt(row.current_stock),
                reorder_level: parseInt(row.reorder_level),
                branch_name: row.branch_name
            }))
        });
    } catch (error) {
        console.error('Error in getLowStockItems:', error);
        res.status(500).json({ message: 'Failed to fetch low stock items' });
    }
};

// GET /analytics/inventory/movements
const getStockMovementSummary = async (req, res) => {
    try {
        const { branch_id } = req.query;

        let branchFilter = '';
        const params = [];

        if (branch_id) {
            branchFilter = ' AND sm.branch_id = $1';
            params.push(branch_id);
        }

        const query = `
            SELECT
                TO_CHAR(DATE_TRUNC('week', sm.created_at), 'Mon DD') as period,
                COALESCE(SUM(CASE WHEN sm.movement_type IN ('receipt', 'transfer_in', 'return') THEN ABS(sm.quantity) ELSE 0 END), 0) as inbound,
                COALESCE(SUM(CASE WHEN sm.movement_type IN ('sale', 'transfer_out', 'adjustment') THEN ABS(sm.quantity) ELSE 0 END), 0) as outbound
            FROM stock_movements sm
            WHERE sm.created_at >= NOW() - INTERVAL '4 weeks'
              ${branchFilter}
            GROUP BY DATE_TRUNC('week', sm.created_at)
            ORDER BY DATE_TRUNC('week', sm.created_at) ASC
        `;

        const result = await pool.query(query, params);

        res.json({
            movements: result.rows.map(row => ({
                period: row.period,
                inbound: parseInt(row.inbound),
                outbound: parseInt(row.outbound)
            }))
        });
    } catch (error) {
        console.error('Error in getStockMovementSummary:', error);
        res.status(500).json({ message: 'Failed to fetch stock movements' });
    }
};

// GET /analytics/inventory/turnover
const getInventoryTurnover = async (req, res) => {
    try {
        const { branch_id } = req.query;

        let branchFilter = '';
        let branchFilterSales = '';
        const params = [];

        if (branch_id) {
            branchFilter = ' AND i.branch_id = $1';
            branchFilterSales = ' AND s.branch_id = $1';
            params.push(branch_id);
        }

        // Turnover = Cost of Goods Sold / Average Inventory Value (annualized)
        const query = `
            WITH cogs AS (
                SELECT COALESCE(SUM(si.quantity * si.cost_price), 0) as total_cogs
                FROM sale_items si
                JOIN sales s ON si.sale_id = s.id
                WHERE s.status != 'cancelled'
                  AND s.deleted_at IS NULL
                  AND s.sale_date >= NOW() - INTERVAL '1 year'
                  ${branchFilterSales}
            ),
            avg_inv AS (
                SELECT COALESCE(SUM(i.quantity_on_hand * p.cost_price), 0) as avg_value
                FROM inventory i
                JOIN products p ON i.product_id = p.id
                WHERE p.deleted_at IS NULL
                  ${branchFilter}
            )
            SELECT
                CASE WHEN avg_inv.avg_value > 0
                    THEN ROUND((cogs.total_cogs / avg_inv.avg_value)::numeric, 1)
                    ELSE 0
                END as avg_turnover_rate
            FROM cogs, avg_inv
        `;

        const result = await pool.query(query, params);

        res.json({
            avg_turnover_rate: parseFloat(result.rows[0]?.avg_turnover_rate || 0)
        });
    } catch (error) {
        console.error('Error in getInventoryTurnover:', error);
        res.status(500).json({ message: 'Failed to fetch inventory turnover' });
    }
};

// ============ CUSTOMER ANALYTICS ============

// GET /analytics/customers/top
const getTopCustomers = async (req, res) => {
    try {
        const { period = 'month', limit = 8 } = req.query;
        const { startDate, endDate } = getDateRange(period);

        const query = `
            SELECT
                c.id,
                c.customer_name,
                COUNT(s.id) as orders_count,
                COALESCE(SUM(s.total_amount), 0) as total_spent,
                MAX(s.sale_date) as last_purchase
            FROM customers c
            JOIN sales s ON c.id = s.customer_id
            WHERE s.status != 'cancelled'
              AND s.deleted_at IS NULL
              AND s.sale_date >= $1 AND s.sale_date <= $2
            GROUP BY c.id, c.customer_name
            ORDER BY total_spent DESC
            LIMIT $3
        `;

        const result = await pool.query(query, [startDate, endDate, parseInt(limit)]);

        // Calculate trend (compare to previous period)
        const prev = getPreviousDateRange(period);
        const prevQuery = `
            SELECT
                c.id,
                COALESCE(SUM(s.total_amount), 0) as prev_spent
            FROM customers c
            JOIN sales s ON c.id = s.customer_id
            WHERE s.status != 'cancelled'
              AND s.deleted_at IS NULL
              AND s.sale_date >= $1 AND s.sale_date <= $2
            GROUP BY c.id
        `;
        const prevResult = await pool.query(prevQuery, [prev.startDate, prev.endDate]);
        const prevMap = {};
        prevResult.rows.forEach(r => { prevMap[r.id] = parseFloat(r.prev_spent); });

        res.json({
            customers: result.rows.map(row => {
                const currentSpent = parseFloat(row.total_spent);
                const previousSpent = prevMap[row.id] || 0;
                const trend = previousSpent > 0
                    ? parseFloat((((currentSpent - previousSpent) / previousSpent) * 100).toFixed(1))
                    : 0;

                return {
                    id: row.id,
                    customer_name: row.customer_name,
                    orders_count: parseInt(row.orders_count),
                    total_spent: currentSpent,
                    trend,
                    last_purchase: row.last_purchase
                };
            })
        });
    } catch (error) {
        console.error('Error in getTopCustomers:', error);
        res.status(500).json({ message: 'Failed to fetch top customers' });
    }
};

// GET /analytics/customers/growth
const getCustomerGrowth = async (req, res) => {
    try {
        const { period = 'month' } = req.query;
        const { startDate, endDate } = getDateRange(period);

        // Total customers count
        const totalQuery = `
            SELECT COUNT(*) as total_customers
            FROM customers
            WHERE deleted_at IS NULL
        `;

        // New customers in this period
        const newQuery = `
            SELECT COUNT(*) as new_customers
            FROM customers
            WHERE deleted_at IS NULL
              AND created_at >= $1 AND created_at <= $2
        `;

        // Growth trend (new customers over time)
        let dateGroup, dateFormat;
        if (period === 'today' || period === 'week') {
            dateGroup = "DATE_TRUNC('day', c.created_at)";
            dateFormat = "TO_CHAR(DATE_TRUNC('day', c.created_at), 'Mon DD')";
        } else if (period === 'month') {
            dateGroup = "DATE_TRUNC('day', c.created_at)";
            dateFormat = "TO_CHAR(DATE_TRUNC('day', c.created_at), 'Mon DD')";
        } else {
            dateGroup = "DATE_TRUNC('month', c.created_at)";
            dateFormat = "TO_CHAR(DATE_TRUNC('month', c.created_at), 'Mon YYYY')";
        }

        const trendQuery = `
            SELECT
                ${dateFormat} as date,
                COUNT(*) as new_customers
            FROM customers c
            WHERE c.deleted_at IS NULL
              AND c.created_at >= $1 AND c.created_at <= $2
            GROUP BY ${dateGroup}
            ORDER BY ${dateGroup} ASC
        `;

        const [totalResult, newResult, trendResult] = await Promise.all([
            pool.query(totalQuery),
            pool.query(newQuery, [startDate, endDate]),
            pool.query(trendQuery, [startDate, endDate])
        ]);

        // Build cumulative total for trend
        const totalCustomers = parseInt(totalResult.rows[0].total_customers);
        const newCustomers = parseInt(newResult.rows[0].new_customers);

        // Calculate running total for trend data
        let runningTotal = totalCustomers - newCustomers;
        const trend = trendResult.rows.map(row => {
            runningTotal += parseInt(row.new_customers);
            return {
                date: row.date,
                new_customers: parseInt(row.new_customers),
                total_customers: runningTotal
            };
        });

        res.json({
            total_customers: totalCustomers,
            new_customers: newCustomers,
            trend
        });
    } catch (error) {
        console.error('Error in getCustomerGrowth:', error);
        res.status(500).json({ message: 'Failed to fetch customer growth' });
    }
};

// GET /analytics/customers/retention
const getCustomerRetention = async (req, res) => {
    try {
        const { period = 'month' } = req.query;
        const { startDate, endDate } = getDateRange(period);

        // Returning customers: bought in this period AND in a previous period
        const returningQuery = `
            SELECT COUNT(DISTINCT s.customer_id) as returning_customers
            FROM sales s
            WHERE s.status != 'cancelled'
              AND s.deleted_at IS NULL
              AND s.customer_id IS NOT NULL
              AND s.sale_date >= $1 AND s.sale_date <= $2
              AND s.customer_id IN (
                  SELECT DISTINCT s2.customer_id
                  FROM sales s2
                  WHERE s2.status != 'cancelled'
                    AND s2.deleted_at IS NULL
                    AND s2.customer_id IS NOT NULL
                    AND s2.sale_date < $1
              )
        `;

        // Total customers who bought in previous period
        const prevBuyersQuery = `
            SELECT COUNT(DISTINCT s.customer_id) as prev_buyers
            FROM sales s
            WHERE s.status != 'cancelled'
              AND s.deleted_at IS NULL
              AND s.customer_id IS NOT NULL
              AND s.sale_date < $1
        `;

        // Average lifetime value
        const alvQuery = `
            SELECT COALESCE(AVG(customer_total), 0) as average_lifetime_value
            FROM (
                SELECT s.customer_id, SUM(s.total_amount) as customer_total
                FROM sales s
                WHERE s.status != 'cancelled'
                  AND s.deleted_at IS NULL
                  AND s.customer_id IS NOT NULL
                GROUP BY s.customer_id
            ) sub
        `;

        // Purchase frequency distribution
        const frequencyQuery = `
            SELECT
                CASE
                    WHEN order_count = 1 THEN '1 order'
                    WHEN order_count BETWEEN 2 AND 3 THEN '2-3 orders'
                    WHEN order_count BETWEEN 4 AND 6 THEN '4-6 orders'
                    WHEN order_count BETWEEN 7 AND 10 THEN '7-10 orders'
                    ELSE '10+ orders'
                END as frequency,
                COUNT(*) as customers
            FROM (
                SELECT s.customer_id, COUNT(s.id) as order_count
                FROM sales s
                WHERE s.status != 'cancelled'
                  AND s.deleted_at IS NULL
                  AND s.customer_id IS NOT NULL
                  AND s.sale_date >= $1 AND s.sale_date <= $2
                GROUP BY s.customer_id
            ) sub
            GROUP BY
                CASE
                    WHEN order_count = 1 THEN '1 order'
                    WHEN order_count BETWEEN 2 AND 3 THEN '2-3 orders'
                    WHEN order_count BETWEEN 4 AND 6 THEN '4-6 orders'
                    WHEN order_count BETWEEN 7 AND 10 THEN '7-10 orders'
                    ELSE '10+ orders'
                END
            ORDER BY MIN(order_count)
        `;

        // Customer segments based on spend
        const segmentsQuery = `
            WITH customer_spend AS (
                SELECT
                    s.customer_id,
                    SUM(s.total_amount) as total_spent,
                    COUNT(s.id) as order_count
                FROM sales s
                WHERE s.status != 'cancelled'
                  AND s.deleted_at IS NULL
                  AND s.customer_id IS NOT NULL
                GROUP BY s.customer_id
            ),
            spend_percentiles AS (
                SELECT
                    COALESCE(PERCENTILE_CONT(0.9) WITHIN GROUP (ORDER BY total_spent), 0) as p90,
                    COALESCE(PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY total_spent), 0) as p50
                FROM customer_spend
            ),
            segmented AS (
                SELECT
                    CASE
                        WHEN cs.total_spent >= sp.p90 THEN 'VIP'
                        WHEN cs.total_spent >= sp.p50 AND cs.order_count >= 3 THEN 'Regular'
                        WHEN cs.order_count >= 2 THEN 'Occasional'
                        ELSE 'New'
                    END as segment_name,
                    CASE
                        WHEN cs.total_spent >= sp.p90 THEN 1
                        WHEN cs.total_spent >= sp.p50 AND cs.order_count >= 3 THEN 2
                        WHEN cs.order_count >= 2 THEN 3
                        ELSE 4
                    END as sort_order
                FROM customer_spend cs, spend_percentiles sp
            )
            SELECT segment_name, COUNT(*) as count
            FROM segmented
            GROUP BY segment_name, sort_order
            ORDER BY sort_order
        `;

        const [returningResult, prevBuyersResult, alvResult, frequencyResult, segmentsResult] = await Promise.all([
            pool.query(returningQuery, [startDate, endDate]),
            pool.query(prevBuyersQuery, [startDate]),
            pool.query(alvQuery),
            pool.query(frequencyQuery, [startDate, endDate]),
            pool.query(segmentsQuery)
        ]);

        const returningCustomers = parseInt(returningResult.rows[0].returning_customers);
        const prevBuyers = parseInt(prevBuyersResult.rows[0].prev_buyers);

        const retentionRate = prevBuyers > 0
            ? parseFloat(((returningCustomers / prevBuyers) * 100).toFixed(1))
            : 0;
        const churnRate = parseFloat((100 - retentionRate).toFixed(1));

        const segmentColors = { 'VIP': '#f59e0b', 'Regular': '#3b82f6', 'Occasional': '#10b981', 'New': '#8b5cf6' };

        res.json({
            returning_customers: returningCustomers,
            average_lifetime_value: parseFloat(parseFloat(alvResult.rows[0].average_lifetime_value).toFixed(2)),
            retention_rate: retentionRate,
            churn_rate: churnRate,
            segments: segmentsResult.rows.map(row => ({
                segment_name: row.segment_name,
                count: parseInt(row.count),
                color: segmentColors[row.segment_name] || '#6b7280'
            })),
            purchase_frequency: frequencyResult.rows.map(row => ({
                frequency: row.frequency,
                customers: parseInt(row.customers)
            }))
        });
    } catch (error) {
        console.error('Error in getCustomerRetention:', error);
        res.status(500).json({ message: 'Failed to fetch customer retention' });
    }
};

module.exports = {
    getSalesAnalytics,
    getSalesTrend,
    getInventoryValue,
    getLowStockItems,
    getStockMovementSummary,
    getInventoryTurnover,
    getTopCustomers,
    getCustomerGrowth,
    getCustomerRetention
};
