const { pool } = require('../config/db');

// ============================================================================
// BRANCH PERFORMANCE DASHBOARD
// ============================================================================

/**
 * Get Branch Performance Dashboard
 * Comprehensive overview of branch performance
 */
const getBranchDashboard = async (req, res) => {
    try {
        const { branchId } = req.params;
        const { startDate, endDate } = req.query;

        const params = [branchId];
        let dateFilter = '';

        if (startDate) {
            params.push(startDate);
            dateFilter += ` AND created_at >= $${params.length}`;
        }
        if (endDate) {
            params.push(endDate);
            dateFilter += ` AND created_at <= $${params.length}`;
        }

        // Total sales
        const salesResult = await pool.query(
            `SELECT COUNT(*) as total_sales, COALESCE(SUM(total_amount), 0) as total_revenue,
                    COALESCE(SUM(profit_total), 0) as total_profit
             FROM sales
             WHERE branch_id = $1 AND reversed_at IS NULL ${dateFilter}`,
            params
        );

        // Inventory value
        const inventoryResult = await pool.query(
            `SELECT COALESCE(SUM(i.quantity_on_hand * p.selling_price), 0) as inventory_value,
                    COALESCE(SUM(i.quantity_on_hand * p.cost_price), 0) as inventory_cost
             FROM inventory i
             JOIN products p ON i.product_id = p.id
             WHERE i.branch_id = $1`,
            [branchId]
        );

        // Top selling products
        const topProductsResult = await pool.query(
            `SELECT p.product_name, p.product_code, SUM(si.quantity) as quantity_sold,
                    SUM(si.subtotal) as revenue
             FROM sale_items si
             JOIN sales s ON si.sale_id = s.id
             JOIN products p ON si.product_id = p.id
             WHERE s.branch_id = $1 AND s.reversed_at IS NULL ${dateFilter}
             GROUP BY p.id, p.product_name, p.product_code
             ORDER BY quantity_sold DESC
             LIMIT 10`,
            params
        );

        // Staff performance
        const staffResult = await pool.query(
            `SELECT u.full_name, COUNT(s.id) as sales_count,
                    COALESCE(SUM(s.total_amount), 0) as total_sales
             FROM sales s
             JOIN users u ON s.performed_by = u.id
             WHERE s.branch_id = $1 AND s.reversed_at IS NULL ${dateFilter}
             GROUP BY u.id, u.full_name
             ORDER BY total_sales DESC`,
            params
        );

        // Customer count
        const customerResult = await pool.query(
            `SELECT COUNT(DISTINCT customer_id) as unique_customers
             FROM sales
             WHERE branch_id = $1 AND customer_id IS NOT NULL AND reversed_at IS NULL ${dateFilter}`,
            params
        );

        res.json({
            branch_id: branchId,
            period: { start_date: startDate, end_date: endDate },
            sales_summary: {
                total_sales: parseInt(salesResult.rows[0].total_sales),
                total_revenue: parseFloat(salesResult.rows[0].total_revenue).toFixed(2),
                total_profit: parseFloat(salesResult.rows[0].total_profit).toFixed(2),
                profit_margin: salesResult.rows[0].total_revenue > 0
                    ? ((salesResult.rows[0].total_profit / salesResult.rows[0].total_revenue) * 100).toFixed(2)
                    : '0.00'
            },
            inventory_summary: {
                inventory_value: parseFloat(inventoryResult.rows[0].inventory_value).toFixed(2),
                inventory_cost: parseFloat(inventoryResult.rows[0].inventory_cost).toFixed(2)
            },
            top_products: topProductsResult.rows,
            staff_performance: staffResult.rows,
            unique_customers: parseInt(customerResult.rows[0].unique_customers)
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

// ============================================================================
// BRANCH SALES REPORTS
// ============================================================================

/**
 * Get Branch Sales Report
 */
const getBranchSalesReport = async (req, res) => {
    try {
        const { branchId } = req.params;
        const { startDate, endDate, groupBy = 'day' } = req.query;

        const params = [branchId];
        let dateFilter = '';
        let groupByClause = '';
        let selectClause = '';

        if (startDate) {
            params.push(startDate);
            dateFilter += ` AND created_at >= $${params.length}`;
        }
        if (endDate) {
            params.push(endDate);
            dateFilter += ` AND created_at <= $${params.length}`;
        }

        // Group by day, week, or month
        switch (groupBy) {
            case 'day':
                selectClause = `DATE(created_at) as period`;
                groupByClause = `DATE(created_at)`;
                break;
            case 'week':
                selectClause = `DATE_TRUNC('week', created_at) as period`;
                groupByClause = `DATE_TRUNC('week', created_at)`;
                break;
            case 'month':
                selectClause = `DATE_TRUNC('month', created_at) as period`;
                groupByClause = `DATE_TRUNC('month', created_at)`;
                break;
            default:
                selectClause = `DATE(created_at) as period`;
                groupByClause = `DATE(created_at)`;
        }

        const result = await pool.query(
            `SELECT ${selectClause},
                    COUNT(*) as sales_count,
                    COALESCE(SUM(total_amount), 0) as total_revenue,
                    COALESCE(SUM(profit_total), 0) as total_profit,
                    COALESCE(AVG(total_amount), 0) as avg_sale_value
             FROM sales
             WHERE branch_id = $1 AND reversed_at IS NULL ${dateFilter}
             GROUP BY ${groupByClause}
             ORDER BY period DESC`,
            params
        );

        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

// ============================================================================
// BRANCH INVENTORY REPORTS
// ============================================================================

/**
 * Get Branch Inventory Valuation
 */
const getBranchInventoryValuation = async (req, res) => {
    try {
        const { branchId } = req.params;

        const result = await pool.query(
            `SELECT p.id, p.product_name, p.product_code, p.product_type,
                    i.quantity_on_hand, p.cost_price, p.selling_price,
                    (i.quantity_on_hand * p.cost_price) as cost_value,
                    (i.quantity_on_hand * p.selling_price) as selling_value,
                    ((p.selling_price - p.cost_price) * i.quantity_on_hand) as potential_profit
             FROM inventory i
             JOIN products p ON i.product_id = p.id
             WHERE i.branch_id = $1 AND i.quantity_on_hand > 0
             ORDER BY cost_value DESC`,
            [branchId]
        );

        // Calculate totals
        const totals = result.rows.reduce((acc, row) => ({
            total_cost_value: acc.total_cost_value + parseFloat(row.cost_value || 0),
            total_selling_value: acc.total_selling_value + parseFloat(row.selling_value || 0),
            total_potential_profit: acc.total_potential_profit + parseFloat(row.potential_profit || 0)
        }), { total_cost_value: 0, total_selling_value: 0, total_potential_profit: 0 });

        res.json({
            branch_id: branchId,
            inventory_items: result.rows,
            totals: {
                total_cost_value: totals.total_cost_value.toFixed(2),
                total_selling_value: totals.total_selling_value.toFixed(2),
                total_potential_profit: totals.total_potential_profit.toFixed(2),
                potential_margin: totals.total_selling_value > 0
                    ? ((totals.total_potential_profit / totals.total_selling_value) * 100).toFixed(2)
                    : '0.00'
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

/**
 * Get Branch Low Stock Report
 */
const getBranchLowStockReport = async (req, res) => {
    try {
        const { branchId } = req.params;

        const result = await pool.query(
            `SELECT p.id, p.product_name, p.product_code,
                    i.quantity_on_hand, p.reorder_level,
                    (p.reorder_level - i.quantity_on_hand) as shortage
             FROM inventory i
             JOIN products p ON i.product_id = p.id
             WHERE i.branch_id = $1 AND i.quantity_on_hand <= p.reorder_level
             ORDER BY shortage DESC`,
            [branchId]
        );

        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

// ============================================================================
// BRANCH P&L REPORT
// ============================================================================

/**
 * Get Branch Profit & Loss Report
 */
const getBranchPLReport = async (req, res) => {
    try {
        const { branchId } = req.params;
        const { startDate, endDate } = req.query;

        const params = [branchId];
        let dateFilter = '';

        if (startDate) {
            params.push(startDate);
            dateFilter += ` AND created_at >= $${params.length}`;
        }
        if (endDate) {
            params.push(endDate);
            dateFilter += ` AND created_at <= $${params.length}`;
        }

        // Revenue
        const revenueResult = await pool.query(
            `SELECT COALESCE(SUM(total_amount), 0) as total_revenue,
                    COALESCE(SUM(cost_total), 0) as cost_of_goods_sold
             FROM sales
             WHERE branch_id = $1 AND reversed_at IS NULL ${dateFilter}`,
            params
        );

        // Returns/Refunds
        const returnsResult = await pool.query(
            `SELECT COALESCE(SUM(total_amount), 0) as returns_amount
             FROM returns
             WHERE branch_id = $1 AND status = 'completed' AND return_type = 'refund' ${dateFilter}`,
            params
        );

        // Discounts & Promotions
        const discountsResult = await pool.query(
            `SELECT COALESCE(SUM(discount_amount), 0) as total_discounts,
                    COALESCE(SUM(promotion_discount), 0) as total_promotion_discounts
             FROM sales
             WHERE branch_id = $1 AND reversed_at IS NULL ${dateFilter}`,
            params
        );

        // Stock adjustments/damages
        const damagesResult = await pool.query(
            `SELECT COALESCE(SUM(sd.quantity * p.cost_price), 0) as damage_cost
             FROM stock_damages sd
             JOIN products p ON sd.product_id = p.id
             WHERE sd.branch_id = $1 ${dateFilter}`,
            params
        );

        // Calculate P&L
        const total_revenue = parseFloat(revenueResult.rows[0].total_revenue);
        const cogs = parseFloat(revenueResult.rows[0].cost_of_goods_sold);
        const returns_amount = parseFloat(returnsResult.rows[0].returns_amount);
        const discounts = parseFloat(discountsResult.rows[0].total_discounts);
        const promotion_discounts = parseFloat(discountsResult.rows[0].total_promotion_discounts);
        const damage_cost = parseFloat(damagesResult.rows[0].damage_cost);

        const gross_revenue = total_revenue - returns_amount;
        const net_revenue = gross_revenue - discounts - promotion_discounts;
        const gross_profit = net_revenue - cogs;
        const net_profit = gross_profit - damage_cost;
        const gross_margin = net_revenue > 0 ? (gross_profit / net_revenue) * 100 : 0;
        const net_margin = net_revenue > 0 ? (net_profit / net_revenue) * 100 : 0;

        res.json({
            branch_id: branchId,
            period: { start_date: startDate, end_date: endDate },
            revenue: {
                total_revenue: total_revenue.toFixed(2),
                returns_amount: returns_amount.toFixed(2),
                gross_revenue: gross_revenue.toFixed(2),
                discounts: discounts.toFixed(2),
                promotion_discounts: promotion_discounts.toFixed(2),
                net_revenue: net_revenue.toFixed(2)
            },
            costs: {
                cost_of_goods_sold: cogs.toFixed(2),
                damage_cost: damage_cost.toFixed(2),
                total_costs: (cogs + damage_cost).toFixed(2)
            },
            profit: {
                gross_profit: gross_profit.toFixed(2),
                net_profit: net_profit.toFixed(2),
                gross_margin: gross_margin.toFixed(2) + '%',
                net_margin: net_margin.toFixed(2) + '%'
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

// ============================================================================
// CROSS-BRANCH COMPARISON
// ============================================================================

/**
 * Compare All Branches
 */
const compareBranches = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;

        const params = [];
        let dateFilter = '';

        if (startDate) {
            params.push(startDate);
            dateFilter += ` AND s.created_at >= $${params.length}`;
        }
        if (endDate) {
            params.push(endDate);
            dateFilter += ` AND s.created_at <= $${params.length}`;
        }

        const result = await pool.query(
            `SELECT b.id as branch_id, b.branch_name,
                    COUNT(s.id) as sales_count,
                    COALESCE(SUM(s.total_amount), 0) as total_revenue,
                    COALESCE(SUM(s.profit_total), 0) as total_profit,
                    COALESCE(AVG(s.total_amount), 0) as avg_sale_value,
                    COUNT(DISTINCT s.customer_id) as unique_customers
             FROM branches b
             LEFT JOIN sales s ON b.id = s.branch_id AND s.reversed_at IS NULL ${dateFilter}
             GROUP BY b.id, b.branch_name
             ORDER BY total_revenue DESC`,
            params
        );

        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

// ============================================================================
// STAFF PERFORMANCE BY BRANCH
// ============================================================================

/**
 * Get Staff Performance for a Branch
 */
const getBranchStaffPerformance = async (req, res) => {
    try {
        const { branchId } = req.params;
        const { startDate, endDate } = req.query;

        const params = [branchId];
        let dateFilter = '';

        if (startDate) {
            params.push(startDate);
            dateFilter += ` AND s.created_at >= $${params.length}`;
        }
        if (endDate) {
            params.push(endDate);
            dateFilter += ` AND s.created_at <= $${params.length}`;
        }

        const result = await pool.query(
            `SELECT u.id as user_id, u.full_name, u.role,
                    COUNT(s.id) as sales_count,
                    COALESCE(SUM(s.total_amount), 0) as total_revenue,
                    COALESCE(SUM(s.profit_total), 0) as total_profit,
                    COALESCE(AVG(s.total_amount), 0) as avg_sale_value,
                    COUNT(DISTINCT s.customer_id) as unique_customers_served
             FROM users u
             LEFT JOIN sales s ON u.id = s.performed_by AND s.branch_id = $1 AND s.reversed_at IS NULL ${dateFilter}
             WHERE u.role IN ('staff', 'manager', 'admin')
             GROUP BY u.id, u.full_name, u.role
             HAVING COUNT(s.id) > 0
             ORDER BY total_revenue DESC`,
            params
        );

        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

// ============================================================================
// CUSTOMER ANALYTICS BY BRANCH
// ============================================================================

/**
 * Get Customer Analytics for a Branch
 */
const getBranchCustomerAnalytics = async (req, res) => {
    try {
        const { branchId } = req.params;
        const { startDate, endDate, limit = 10 } = req.query;

        const params = [branchId];
        let dateFilter = '';

        if (startDate) {
            params.push(startDate);
            dateFilter += ` AND s.created_at >= $${params.length}`;
        }
        if (endDate) {
            params.push(endDate);
            dateFilter += ` AND s.created_at <= $${params.length}`;
        }

        // Top customers
        params.push(limit);
        const topCustomersResult = await pool.query(
            `SELECT c.id, c.customer_name, c.phone_number,
                    COUNT(s.id) as purchase_count,
                    COALESCE(SUM(s.total_amount), 0) as total_spent,
                    COALESCE(AVG(s.total_amount), 0) as avg_purchase_value,
                    MAX(s.created_at) as last_purchase_date
             FROM customers c
             JOIN sales s ON c.id = s.customer_id
             WHERE s.branch_id = $1 AND s.reversed_at IS NULL ${dateFilter}
             GROUP BY c.id, c.customer_name, c.phone_number
             ORDER BY total_spent DESC
             LIMIT $${params.length}`,
            params
        );

        // Customer retention metrics
        const retentionResult = await pool.query(
            `SELECT
                COUNT(DISTINCT customer_id) as total_customers,
                COUNT(DISTINCT CASE WHEN purchase_count > 1 THEN customer_id END) as repeat_customers
             FROM (
                 SELECT customer_id, COUNT(*) as purchase_count
                 FROM sales
                 WHERE branch_id = $1 AND customer_id IS NOT NULL AND reversed_at IS NULL ${dateFilter}
                 GROUP BY customer_id
             ) sub`,
            [branchId]
        );

        const total_customers = parseInt(retentionResult.rows[0].total_customers);
        const repeat_customers = parseInt(retentionResult.rows[0].repeat_customers);
        const retention_rate = total_customers > 0 ? (repeat_customers / total_customers) * 100 : 0;

        res.json({
            top_customers: topCustomersResult.rows,
            retention_metrics: {
                total_customers,
                repeat_customers,
                retention_rate: retention_rate.toFixed(2) + '%'
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = {
    getBranchDashboard,
    getBranchSalesReport,
    getBranchInventoryValuation,
    getBranchLowStockReport,
    getBranchPLReport,
    compareBranches,
    getBranchStaffPerformance,
    getBranchCustomerAnalytics
};
