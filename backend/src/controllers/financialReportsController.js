const { pool } = require('../config/db');

/**
 * Income Statement (Profit & Loss)
 * Revenue - COGS - Expenses = Net Income
 */
const getIncomeStatement = async (req, res) => {
    try {
        const { start_date, end_date, branch_id } = req.query;
        const params = [];
        let dateFilter = '';
        let branchFilter = '';
        let idx = 1;

        if (start_date && end_date) {
            dateFilter = ` AND s.sale_date BETWEEN $${idx} AND $${idx + 1}`;
            params.push(start_date, end_date);
            idx += 2;
        }
        if (branch_id) {
            branchFilter = ` AND s.branch_id = $${idx}`;
            params.push(branch_id);
            idx++;
        }

        // Revenue from sales
        const revenueRes = await pool.query(
            `SELECT
                COALESCE(SUM(s.total_amount), 0) as total_revenue,
                COALESCE(SUM(s.tax_amount), 0) as total_tax_collected,
                COALESCE(SUM(s.subtotal), 0) as net_revenue,
                COUNT(s.id) as total_transactions
             FROM sales s
             WHERE s.status != 'cancelled'${dateFilter}${branchFilter}`,
            params
        );

        // COGS from sale items (cost_price * quantity)
        const cogsParams = [...params];
        const cogsRes = await pool.query(
            `SELECT COALESCE(SUM(si.quantity * COALESCE(p.cost_price, 0)), 0) as total_cogs
             FROM sale_items si
             JOIN sales s ON si.sale_id = s.id
             LEFT JOIN products p ON si.product_id = p.id
             WHERE s.status != 'cancelled'${dateFilter}${branchFilter}`,
            cogsParams
        );

        // Expenses
        const expParams = [];
        let expDateFilter = '';
        let expBranchFilter = '';
        let expIdx = 1;
        if (start_date && end_date) {
            expDateFilter = ` AND e.expense_date BETWEEN $${expIdx} AND $${expIdx + 1}`;
            expParams.push(start_date, end_date);
            expIdx += 2;
        }
        if (branch_id) {
            expBranchFilter = ` AND e.branch_id = $${expIdx}`;
            expParams.push(branch_id);
        }

        const expenseRes = await pool.query(
            `SELECT
                COALESCE(SUM(e.amount), 0) as total_expenses,
                ec.category_name,
                COALESCE(SUM(e.amount), 0) as category_total
             FROM expenses e
             LEFT JOIN expense_categories ec ON e.category_id = ec.id
             WHERE e.status = 'approved'${expDateFilter}${expBranchFilter}
             GROUP BY ec.category_name
             ORDER BY category_total DESC`,
            expParams
        );

        const totalExpensesRes = await pool.query(
            `SELECT COALESCE(SUM(amount), 0) as total_expenses
             FROM expenses e
             WHERE status = 'approved'${expDateFilter}${expBranchFilter}`,
            expParams
        );

        const revenue = parseFloat(revenueRes.rows[0].net_revenue);
        const cogs = parseFloat(cogsRes.rows[0].total_cogs);
        const grossProfit = revenue - cogs;
        const totalExpenses = parseFloat(totalExpensesRes.rows[0].total_expenses);
        const netIncome = grossProfit - totalExpenses;

        res.json({
            period: { start_date, end_date },
            revenue: {
                total_revenue: parseFloat(revenueRes.rows[0].total_revenue),
                tax_collected: parseFloat(revenueRes.rows[0].total_tax_collected),
                net_revenue: revenue,
                total_transactions: parseInt(revenueRes.rows[0].total_transactions)
            },
            cost_of_goods_sold: cogs,
            gross_profit: grossProfit,
            gross_margin: revenue > 0 ? ((grossProfit / revenue) * 100).toFixed(2) : 0,
            expenses: {
                total: totalExpenses,
                by_category: expenseRes.rows.map(r => ({ category: r.category_name || 'Uncategorized', amount: parseFloat(r.category_total) }))
            },
            net_income: netIncome,
            net_margin: revenue > 0 ? ((netIncome / revenue) * 100).toFixed(2) : 0
        });
    } catch (err) {
        console.error('Error generating income statement:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

/**
 * Balance Sheet
 * Assets = Liabilities + Equity
 */
const getBalanceSheet = async (req, res) => {
    try {
        const { as_of_date, branch_id } = req.query;
        const asOf = as_of_date || new Date().toISOString().split('T')[0];
        const params = [asOf];
        let branchFilter = '';
        if (branch_id) {
            branchFilter = ` AND branch_id = $2`;
            params.push(branch_id);
        }

        // Cash & bank balances (payments received - payments made)
        const cashRes = await pool.query(
            `SELECT COALESCE(SUM(CASE WHEN payment_type = 'received' THEN amount ELSE -amount END), 0) as cash_balance
             FROM payments WHERE payment_date <= $1${branchFilter}`,
            params
        );

        // Inventory value
        const invParams = branch_id ? [branch_id] : [];
        const invBranchFilter = branch_id ? ' WHERE i.branch_id = $1' : '';
        const inventoryRes = await pool.query(
            `SELECT COALESCE(SUM(i.quantity_on_hand * COALESCE(p.cost_price, 0)), 0) as inventory_value
             FROM inventory i
             JOIN products p ON i.product_id = p.id${invBranchFilter}`,
            invParams
        );

        // Accounts receivable (sales with outstanding balance)
        const arRes = await pool.query(
            `SELECT COALESCE(SUM(s.total_amount - COALESCE(
                (SELECT SUM(amount) FROM payments WHERE related_to = 'sale' AND related_id = s.id AND payment_type = 'received'), 0
             )), 0) as accounts_receivable
             FROM sales s
             WHERE s.status IN ('completed', 'confirmed') AND s.sale_date <= $1${branchFilter}`,
            params
        );

        // Accounts payable (outstanding supplier balances from purchase orders)
        // Note: purchase_orders table doesn't exist in this schema, returning 0
        const apRes = { rows: [{ accounts_payable: 0 }] };

        // Total revenue (retained earnings proxy)
        const revenueRes = await pool.query(
            `SELECT COALESCE(SUM(total_amount), 0) as total_revenue
             FROM sales WHERE status != 'cancelled' AND sale_date <= $1${branchFilter}`,
            params
        );

        const totalExpensesRes = await pool.query(
            `SELECT COALESCE(SUM(amount), 0) as total_expenses
             FROM expenses WHERE status = 'approved' AND expense_date <= $1${branchFilter}`,
            params
        );

        const cashBalance = parseFloat(cashRes.rows[0].cash_balance);
        const inventoryValue = parseFloat(inventoryRes.rows[0].inventory_value);
        const accountsReceivable = parseFloat(arRes.rows[0].accounts_receivable);
        const accountsPayable = parseFloat(apRes.rows[0].accounts_payable);
        const retainedEarnings = parseFloat(revenueRes.rows[0].total_revenue) - parseFloat(totalExpensesRes.rows[0].total_expenses);

        const totalAssets = cashBalance + inventoryValue + accountsReceivable;
        const totalLiabilities = accountsPayable;
        const totalEquity = retainedEarnings;

        res.json({
            as_of_date: asOf,
            assets: {
                current: {
                    cash_and_bank: cashBalance,
                    accounts_receivable: accountsReceivable,
                    inventory: inventoryValue
                },
                total: totalAssets
            },
            liabilities: {
                current: {
                    accounts_payable: accountsPayable
                },
                total: totalLiabilities
            },
            equity: {
                retained_earnings: retainedEarnings,
                total: totalEquity
            },
            total_liabilities_and_equity: totalLiabilities + totalEquity
        });
    } catch (err) {
        console.error('Error generating balance sheet:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

/**
 * Trial Balance
 */
const getTrialBalance = async (req, res) => {
    try {
        const { start_date, end_date } = req.query;
        const params = [];
        let dateFilter = '';
        if (start_date && end_date) {
            dateFilter = ' AND sale_date BETWEEN $1 AND $2';
            params.push(start_date, end_date);
        }

        const salesTotal = await pool.query(
            `SELECT COALESCE(SUM(total_amount), 0) as total FROM sales WHERE status != 'cancelled'${dateFilter}`, params
        );

        const expDateFilter = dateFilter.replace('sale_date', 'expense_date');
        const expensesTotal = await pool.query(
            `SELECT COALESCE(SUM(amount), 0) as total FROM expenses WHERE status = 'approved'${expDateFilter}`, params
        );

        const paymentsReceived = await pool.query(
            `SELECT COALESCE(SUM(amount), 0) as total FROM payments WHERE payment_type = 'received'${dateFilter.replace('sale_date', 'payment_date')}`, params
        );

        const paymentsMade = await pool.query(
            `SELECT COALESCE(SUM(amount), 0) as total FROM payments WHERE payment_type = 'paid'${dateFilter.replace('sale_date', 'payment_date')}`, params
        );

        const accounts = [
            { account: 'Sales Revenue', debit: 0, credit: parseFloat(salesTotal.rows[0].total) },
            { account: 'Cost of Goods Sold', debit: 0, credit: 0 },
            { account: 'Operating Expenses', debit: parseFloat(expensesTotal.rows[0].total), credit: 0 },
            { account: 'Cash Received', debit: parseFloat(paymentsReceived.rows[0].total), credit: 0 },
            { account: 'Cash Paid', debit: 0, credit: parseFloat(paymentsMade.rows[0].total) },
            { account: 'Accounts Receivable', debit: parseFloat(salesTotal.rows[0].total) - parseFloat(paymentsReceived.rows[0].total), credit: 0 },
        ];

        const totalDebits = accounts.reduce((sum, a) => sum + a.debit, 0);
        const totalCredits = accounts.reduce((sum, a) => sum + a.credit, 0);

        res.json({
            period: { start_date, end_date },
            accounts,
            totals: { debits: totalDebits, credits: totalCredits, balanced: Math.abs(totalDebits - totalCredits) < 0.01 }
        });
    } catch (err) {
        console.error('Error generating trial balance:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

/**
 * Cash Flow Statement
 */
const getCashFlowReport = async (req, res) => {
    try {
        const { start_date, end_date } = req.query;
        const params = start_date && end_date ? [start_date, end_date] : [];
        const dateFilter = params.length ? ' AND payment_date BETWEEN $1 AND $2' : '';

        const receivedRes = await pool.query(
            `SELECT
                payment_method,
                COALESCE(SUM(amount), 0) as total
             FROM payments
             WHERE payment_type = 'received'${dateFilter}
             GROUP BY payment_method`,
            params
        );

        const paidRes = await pool.query(
            `SELECT
                payment_method,
                COALESCE(SUM(amount), 0) as total
             FROM payments
             WHERE payment_type = 'paid'${dateFilter}
             GROUP BY payment_method`,
            params
        );

        const expDateFilter = dateFilter.replace('payment_date', 'expense_date');
        const expensesRes = await pool.query(
            `SELECT COALESCE(SUM(amount), 0) as total FROM expenses WHERE status = 'approved'${expDateFilter}`,
            params
        );

        const totalInflow = receivedRes.rows.reduce((sum, r) => sum + parseFloat(r.total), 0);
        const totalOutflow = paidRes.rows.reduce((sum, r) => sum + parseFloat(r.total), 0) + parseFloat(expensesRes.rows[0].total);

        res.json({
            period: { start_date, end_date },
            operating: {
                inflows: {
                    total: totalInflow,
                    by_method: receivedRes.rows.map(r => ({ method: r.payment_method, amount: parseFloat(r.total) }))
                },
                outflows: {
                    total: totalOutflow,
                    payments: paidRes.rows.map(r => ({ method: r.payment_method, amount: parseFloat(r.total) })),
                    expenses: parseFloat(expensesRes.rows[0].total)
                },
                net: totalInflow - totalOutflow
            },
            net_cash_flow: totalInflow - totalOutflow
        });
    } catch (err) {
        console.error('Error generating cash flow report:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

/**
 * Accounts Receivable Aging
 */
const getARAgingReport = async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT * FROM (
                SELECT
                    c.id as customer_id,
                    c.customer_name,
                    s.id as sale_id,
                    s.sale_number,
                    s.sale_date,
                    s.total_amount,
                    COALESCE((SELECT SUM(amount) FROM payments WHERE related_to = 'sale' AND related_id = s.id AND payment_type = 'received'), 0) as paid_amount,
                    s.total_amount - COALESCE((SELECT SUM(amount) FROM payments WHERE related_to = 'sale' AND related_id = s.id AND payment_type = 'received'), 0) as outstanding,
                    EXTRACT(DAY FROM NOW() - s.sale_date) as days_outstanding
                FROM sales s
                JOIN customers c ON s.customer_id = c.id
                WHERE s.status IN ('completed', 'confirmed')
             ) sub
             WHERE outstanding > 0
             ORDER BY days_outstanding DESC`
        );

        const buckets = { current: [], '1_30': [], '31_60': [], '61_90': [], over_90: [] };
        for (const row of result.rows) {
            const days = parseInt(row.days_outstanding);
            const item = { ...row, outstanding: parseFloat(row.outstanding) };
            if (days <= 0) buckets.current.push(item);
            else if (days <= 30) buckets['1_30'].push(item);
            else if (days <= 60) buckets['31_60'].push(item);
            else if (days <= 90) buckets['61_90'].push(item);
            else buckets.over_90.push(item);
        }

        const sumBucket = (b) => b.reduce((s, i) => s + i.outstanding, 0);
        res.json({
            buckets,
            summary: {
                current: sumBucket(buckets.current),
                '1_30_days': sumBucket(buckets['1_30']),
                '31_60_days': sumBucket(buckets['31_60']),
                '61_90_days': sumBucket(buckets['61_90']),
                'over_90_days': sumBucket(buckets.over_90),
                total: result.rows.reduce((s, r) => s + parseFloat(r.outstanding), 0)
            }
        });
    } catch (err) {
        console.error('Error generating AR aging report:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

/**
 * Accounts Payable Aging
 */
const getAPAgingReport = async (req, res) => {
    try {
        // Note: purchase_orders table doesn't exist in this schema
        // Returning empty report
        const buckets = { current: [], '1_30': [], '31_60': [], '61_90': [], over_90: [] };

        res.json({
            buckets,
            summary: {
                current: 0,
                '1_30_days': 0,
                '31_60_days': 0,
                '61_90_days': 0,
                'over_90_days': 0,
                total: 0
            },
            note: 'Purchase orders functionality not implemented in this system'
        });
    } catch (err) {
        console.error('Error generating AP aging report:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

/**
 * Branch P&L
 */
const getBranchPL = async (req, res) => {
    try {
        const { branchId } = req.params;
        const { start_date, end_date } = req.query;

        // Reuse income statement logic with branch filter
        req.query.branch_id = branchId;
        return getIncomeStatement(req, res);
    } catch (err) {
        console.error('Error generating branch P&L:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

/**
 * Consolidated P&L (all branches)
 */
const getConsolidatedPL = async (req, res) => {
    try {
        const { start_date, end_date } = req.query;
        const params = start_date && end_date ? [start_date, end_date] : [];
        const dateFilter = params.length ? ' AND s.sale_date BETWEEN $1 AND $2' : '';

        const branchesRes = await pool.query('SELECT id, branch_name FROM branches WHERE is_active = TRUE ORDER BY branch_name');

        const branches = [];
        for (const branch of branchesRes.rows) {
            const bParams = [...params, branch.id];
            const bIdx = params.length + 1;

            const revRes = await pool.query(
                `SELECT COALESCE(SUM(subtotal), 0) as revenue FROM sales s WHERE status != 'cancelled'${dateFilter} AND s.branch_id = $${bIdx}`,
                bParams
            );

            const expRes = await pool.query(
                `SELECT COALESCE(SUM(amount), 0) as expenses FROM expenses e WHERE status = 'approved'${dateFilter.replace('s.sale_date', 'e.expense_date')} AND e.branch_id = $${bIdx}`,
                bParams
            );

            const revenue = parseFloat(revRes.rows[0].revenue);
            const expenses = parseFloat(expRes.rows[0].expenses);

            branches.push({
                branch_id: branch.id,
                branch_name: branch.branch_name,
                revenue,
                expenses,
                net_income: revenue - expenses,
                margin: revenue > 0 ? (((revenue - expenses) / revenue) * 100).toFixed(2) : 0
            });
        }

        const totals = branches.reduce((acc, b) => ({
            revenue: acc.revenue + b.revenue,
            expenses: acc.expenses + b.expenses,
            net_income: acc.net_income + b.net_income
        }), { revenue: 0, expenses: 0, net_income: 0 });

        res.json({
            period: { start_date, end_date },
            branches,
            consolidated: {
                ...totals,
                margin: totals.revenue > 0 ? ((totals.net_income / totals.revenue) * 100).toFixed(2) : 0
            }
        });
    } catch (err) {
        console.error('Error generating consolidated P&L:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

/**
 * Inventory Valuation
 */
const getInventoryValuation = async (req, res) => {
    try {
        const { branch_id } = req.query;
        const params = [];
        let branchFilter = '';
        if (branch_id) {
            branchFilter = ' AND i.branch_id = $1';
            params.push(branch_id);
        }

        const result = await pool.query(
            `SELECT
                p.id as product_id,
                p.product_name,
                p.product_code as sku,
                p.cost_price,
                p.retail_price as selling_price,
                i.quantity_on_hand,
                b.branch_name,
                (i.quantity_on_hand * COALESCE(p.cost_price, 0)) as cost_value,
                (i.quantity_on_hand * COALESCE(p.retail_price, 0)) as retail_value
             FROM inventory i
             JOIN products p ON i.product_id = p.id
             LEFT JOIN branches b ON i.branch_id = b.id
             WHERE i.quantity_on_hand > 0${branchFilter}
             ORDER BY cost_value DESC`,
            params
        );

        const totalCostValue = result.rows.reduce((s, r) => s + parseFloat(r.cost_value), 0);
        const totalRetailValue = result.rows.reduce((s, r) => s + parseFloat(r.retail_value), 0);

        res.json({
            items: result.rows.map(r => ({
                ...r,
                cost_price: parseFloat(r.cost_price),
                selling_price: parseFloat(r.selling_price),
                cost_value: parseFloat(r.cost_value),
                retail_value: parseFloat(r.retail_value)
            })),
            summary: {
                total_items: result.rows.length,
                total_units: result.rows.reduce((s, r) => s + r.quantity_on_hand, 0),
                total_cost_value: totalCostValue,
                total_retail_value: totalRetailValue,
                potential_profit: totalRetailValue - totalCostValue
            }
        });
    } catch (err) {
        console.error('Error generating inventory valuation:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

/**
 * Sales Book (detailed sales ledger)
 */
const getSalesBook = async (req, res) => {
    try {
        const { start_date, end_date, branch_id, page = 1, limit = 50 } = req.query;
        const params = [];
        let filters = " WHERE s.status != 'cancelled'";
        let idx = 1;

        if (start_date && end_date) {
            filters += ` AND s.sale_date BETWEEN $${idx} AND $${idx + 1}`;
            params.push(start_date, end_date);
            idx += 2;
        }
        if (branch_id) {
            filters += ` AND s.branch_id = $${idx}`;
            params.push(branch_id);
            idx++;
        }

        const offset = (parseInt(page) - 1) * parseInt(limit);
        params.push(parseInt(limit), offset);

        const result = await pool.query(
            `SELECT
                s.id, s.sale_number, s.sale_date, s.subtotal, s.tax_amount, s.total_amount,
                s.payment_method, s.status,
                c.customer_name,
                b.branch_name,
                u.full_name as cashier_name
             FROM sales s
             LEFT JOIN customers c ON s.customer_id = c.id
             LEFT JOIN branches b ON s.branch_id = b.id
             LEFT JOIN users u ON s.processed_by = u.id
             ${filters}
             ORDER BY s.sale_date DESC
             LIMIT $${idx} OFFSET $${idx + 1}`,
            params
        );

        // Count total
        const countParams = params.slice(0, -2);
        const countRes = await pool.query(
            `SELECT COUNT(*) as total FROM sales s ${filters}`,
            countParams
        );

        // Totals
        const totalsRes = await pool.query(
            `SELECT
                COALESCE(SUM(subtotal), 0) as total_subtotal,
                COALESCE(SUM(tax_amount), 0) as total_tax,
                COALESCE(SUM(total_amount), 0) as total_amount
             FROM sales s ${filters}`,
            countParams
        );

        res.json({
            sales: result.rows.map(r => ({
                ...r,
                subtotal: parseFloat(r.subtotal),
                tax_amount: parseFloat(r.tax_amount),
                total_amount: parseFloat(r.total_amount)
            })),
            totals: {
                subtotal: parseFloat(totalsRes.rows[0].total_subtotal),
                tax: parseFloat(totalsRes.rows[0].total_tax),
                total: parseFloat(totalsRes.rows[0].total_amount)
            },
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: parseInt(countRes.rows[0].total),
                pages: Math.ceil(parseInt(countRes.rows[0].total) / parseInt(limit))
            }
        });
    } catch (err) {
        console.error('Error generating sales book:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = {
    getIncomeStatement,
    getBalanceSheet,
    getTrialBalance,
    getCashFlowReport,
    getARAgingReport,
    getAPAgingReport,
    getBranchPL,
    getConsolidatedPL,
    getInventoryValuation,
    getSalesBook
};
