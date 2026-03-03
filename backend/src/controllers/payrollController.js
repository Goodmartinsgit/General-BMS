const { pool } = require('../config/db');

// ============================================================================
// SALARY MANAGEMENT
// ============================================================================

const getSalaries = async (req, res) => {
    try {
        const { branch_id, is_active } = req.query;
        let q = `SELECT s.*, u.full_name, u.email, b.branch_name
                 FROM employee_salaries s
                 JOIN users u ON s.user_id = u.id
                 LEFT JOIN branches b ON s.branch_id = b.id
                 WHERE 1=1`;
        const params = [];

        if (branch_id) {
            params.push(branch_id);
            q += ` AND s.branch_id = $${params.length}`;
        }
        if (is_active !== undefined) {
            params.push(is_active === 'true');
            q += ` AND s.is_active = $${params.length}`;
        }

        q += ` ORDER BY u.full_name ASC`;

        const result = await pool.query(q, params);
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching salaries:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

const getSalaryByUserId = async (req, res) => {
    try {
        const { userId } = req.params;
        const result = await pool.query(
            `SELECT s.*, u.full_name, u.email, b.branch_name
             FROM employee_salaries s
             JOIN users u ON s.user_id = u.id
             LEFT JOIN branches b ON s.branch_id = b.id
             WHERE s.user_id = $1`,
            [userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Salary record not found for this user' });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error fetching salary by user:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

const createSalary = async (req, res) => {
    try {
        const {
            user_id, branch_id, basic_salary, housing_allowance,
            transport_allowance, other_allowances, pension_rate,
            tax_rate, payment_frequency, bank_name, account_number
        } = req.body;

        const existing = await pool.query(
            'SELECT id FROM employee_salaries WHERE user_id = $1',
            [user_id]
        );
        if (existing.rows.length > 0) {
            return res.status(400).json({ message: 'Salary record already exists for this user' });
        }

        const result = await pool.query(
            `INSERT INTO employee_salaries (
                user_id, branch_id, basic_salary, housing_allowance,
                transport_allowance, other_allowances, employee_pension_rate,
                tax_rate, payment_method, bank_name, bank_account_number
             ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
             RETURNING *`,
            [
                user_id, branch_id, basic_salary || 0, housing_allowance || 0,
                transport_allowance || 0, other_allowances || 0, pension_rate || 0,
                tax_rate || 0, payment_frequency || 'bank_transfer', bank_name,
                account_number
            ]
        );

        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Error creating salary:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

const updateSalary = async (req, res) => {
    try {
        const { userId } = req.params;
        const {
            basic_salary, housing_allowance, transport_allowance,
            other_allowances, pension_rate, tax_rate, payment_frequency,
            bank_name, account_number, is_active, branch_id
        } = req.body;

        const result = await pool.query(
            `UPDATE employee_salaries SET
                basic_salary = COALESCE($1, basic_salary),
                housing_allowance = COALESCE($2, housing_allowance),
                transport_allowance = COALESCE($3, transport_allowance),
                other_allowances = COALESCE($4, other_allowances),
                employee_pension_rate = COALESCE($5, employee_pension_rate),
                tax_rate = COALESCE($6, tax_rate),
                payment_method = COALESCE($7, payment_method),
                bank_name = COALESCE($8, bank_name),
                bank_account_number = COALESCE($9, bank_account_number),
                is_active = COALESCE($10, is_active),
                branch_id = COALESCE($11, branch_id),
                updated_at = NOW()
             WHERE user_id = $12
             RETURNING *`,
            [
                basic_salary, housing_allowance, transport_allowance,
                other_allowances, pension_rate, tax_rate, payment_frequency,
                bank_name, account_number, is_active, branch_id,
                userId
            ]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Salary record not found for this user' });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error updating salary:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

// ============================================================================
// PAYROLL RUNS
// ============================================================================

const getPayrollRuns = async (req, res) => {
    try {
        const { status, branch_id, start_date, end_date } = req.query;
        let q = `SELECT pr.*, b.branch_name, u.full_name as created_by_name,
                        a.full_name as approved_by_name
                 FROM payroll_runs pr
                 LEFT JOIN branches b ON pr.branch_id = b.id
                 JOIN users u ON pr.created_by = u.id
                 LEFT JOIN users a ON pr.approved_by = a.id
                 WHERE 1=1`;
        const params = [];

        if (status) {
            params.push(status);
            q += ` AND pr.status = $${params.length}`;
        }
        if (branch_id) {
            params.push(branch_id);
            q += ` AND pr.branch_id = $${params.length}`;
        }
        if (start_date) {
            params.push(start_date);
            q += ` AND pr.period_start >= $${params.length}`;
        }
        if (end_date) {
            params.push(end_date);
            q += ` AND pr.period_end <= $${params.length}`;
        }

        q += ` ORDER BY pr.created_at DESC`;

        const result = await pool.query(q, params);
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching payroll runs:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

const getPayrollRunById = async (req, res) => {
    try {
        const { id } = req.params;

        const runResult = await pool.query(
            `SELECT pr.*, b.branch_name, u.full_name as created_by_name,
                    a.full_name as approved_by_name
             FROM payroll_runs pr
             LEFT JOIN branches b ON pr.branch_id = b.id
             JOIN users u ON pr.created_by = u.id
             LEFT JOIN users a ON pr.approved_by = a.id
             WHERE pr.id = $1`,
            [id]
        );

        if (runResult.rows.length === 0) {
            return res.status(404).json({ message: 'Payroll run not found' });
        }

        const payslipsResult = await pool.query(
            `SELECT ps.*, u.full_name, u.email
             FROM payslips ps
             JOIN users u ON ps.user_id = u.id
             WHERE ps.run_id = $1
             ORDER BY u.full_name ASC`,
            [id]
        );

        res.json({
            ...runResult.rows[0],
            payslips: payslipsResult.rows
        });
    } catch (err) {
        console.error('Error fetching payroll run:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

const createPayrollRun = async (req, res) => {
    try {
        const { branch_id, pay_period_start, pay_period_end, description } = req.body;
        const created_by = req.user.id;

        // Auto-generate run_number: PR-YYYYMM-NNN
        const now = new Date();
        const yearMonth = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
        const countResult = await pool.query(
            `SELECT COUNT(*) FROM payroll_runs WHERE run_number LIKE $1`,
            [`PR-${yearMonth}-%`]
        );
        const seq = parseInt(countResult.rows[0].count) + 1;
        const run_number = `PR-${yearMonth}-${String(seq).padStart(3, '0')}`;

        const result = await pool.query(
            `INSERT INTO payroll_runs (
                run_number, branch_id, period_start, period_end,
                notes, status, created_by
             ) VALUES ($1, $2, $3, $4, $5, 'draft', $6)
             RETURNING *`,
            [run_number, branch_id, pay_period_start, pay_period_end, description, created_by]
        );

        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Error creating payroll run:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

const processPayrollRun = async (req, res) => {
    const client = await pool.connect();
    try {
        const { id } = req.params;
        await client.query('BEGIN');

        const runResult = await client.query(
            'SELECT * FROM payroll_runs WHERE id = $1',
            [id]
        );
        if (runResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ message: 'Payroll run not found' });
        }
        const run = runResult.rows[0];
        if (run.status !== 'draft') {
            await client.query('ROLLBACK');
            return res.status(400).json({ message: 'Only draft payroll runs can be processed' });
        }

        // Delete any existing payslips for this run (re-processing)
        await client.query('DELETE FROM payslips WHERE run_id = $1', [id]);

        // Get all active salaried employees in the branch
        let salaryQuery = `SELECT s.*, u.full_name FROM employee_salaries s
                           JOIN users u ON s.user_id = u.id
                           WHERE s.is_active = true`;
        const salaryParams = [];
        if (run.branch_id) {
            salaryParams.push(run.branch_id);
            salaryQuery += ` AND s.branch_id = $${salaryParams.length}`;
        }
        const salariesResult = await client.query(salaryQuery, salaryParams);

        let totalGross = 0;
        let totalDeductionsSum = 0;
        let totalNet = 0;
        let employeeCount = 0;

        for (const salary of salariesResult.rows) {
            const basic = parseFloat(salary.basic_salary) || 0;
            const housing = parseFloat(salary.housing_allowance) || 0;
            const transport = parseFloat(salary.transport_allowance) || 0;
            const otherAllow = parseFloat(salary.other_allowances) || 0;
            const grossPay = basic + housing + transport + otherAllow;

            const pensionRate = parseFloat(salary.employee_pension_rate) || 0;
            const taxRate = parseFloat(salary.tax_rate) || 0;
            const pensionDeduction = (basic * pensionRate) / 100;
            const taxDeduction = (grossPay * taxRate) / 100;

            const loanResult = await client.query(
                `SELECT COALESCE(SUM(monthly_deduction), 0) as total_loan_deduction
                 FROM payroll_loans
                 WHERE user_id = $1 AND status = 'active'`,
                [salary.user_id]
            );
            const loanDeduction = parseFloat(loanResult.rows[0].total_loan_deduction) || 0;

            const totalDeductionsForEmployee = pensionDeduction + taxDeduction + loanDeduction;
            const netPay = grossPay - totalDeductionsForEmployee;

            await client.query(
                `INSERT INTO payslips (
                    run_id, user_id, basic_salary, housing_allowance,
                    transport_allowance, other_allowances, gross_salary,
                    employee_pension, tax_deduction, loan_deduction,
                    total_deductions, net_salary, status
                 ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'pending')`,
                [
                    id, salary.user_id, basic, housing, transport, otherAllow,
                    grossPay, pensionDeduction, taxDeduction, loanDeduction,
                    totalDeductionsForEmployee, netPay
                ]
            );

            totalGross += grossPay;
            totalDeductionsSum += totalDeductionsForEmployee;
            totalNet += netPay;
            employeeCount++;
        }

        await client.query(
            `UPDATE payroll_runs SET
                status = 'processed',
                total_gross = $1,
                total_deductions = $2,
                total_net = $3,
                employee_count = $4
             WHERE id = $5`,
            [totalGross, totalDeductionsSum, totalNet, employeeCount, id]
        );

        await client.query('COMMIT');

        const updatedRun = await pool.query(
            `SELECT pr.*, b.branch_name
             FROM payroll_runs pr
             LEFT JOIN branches b ON pr.branch_id = b.id
             WHERE pr.id = $1`,
            [id]
        );

        res.json({
            ...updatedRun.rows[0],
            message: `Payroll processed for ${employeeCount} employees`
        });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error processing payroll run:', err);
        res.status(500).json({ message: 'Server error' });
    } finally {
        client.release();
    }
};

const approvePayrollRun = async (req, res) => {
    try {
        const { id } = req.params;
        const approved_by = req.user.id;

        const result = await pool.query(
            `UPDATE payroll_runs SET
                status = 'approved',
                approved_by = $1,
                approved_at = NOW()
             WHERE id = $2 AND status = 'processed'
             RETURNING *`,
            [approved_by, id]
        );

        if (result.rows.length === 0) {
            return res.status(400).json({ message: 'Payroll run not found or not in processed status' });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error approving payroll run:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

const markPayrollRunPaid = async (req, res) => {
    const client = await pool.connect();
    try {
        const { id } = req.params;
        await client.query('BEGIN');

        const runResult = await client.query(
            'SELECT * FROM payroll_runs WHERE id = $1 AND status = $2',
            [id, 'approved']
        );
        if (runResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(400).json({ message: 'Payroll run not found or not in approved status' });
        }

        await client.query(
            `UPDATE payroll_runs SET status = 'paid', payment_date = NOW() WHERE id = $1`,
            [id]
        );

        await client.query(
            `UPDATE payslips SET status = 'paid' WHERE run_id = $1`,
            [id]
        );

        // Update loan balances
        const payslipsRes = await client.query(
            'SELECT user_id, loan_deduction FROM payslips WHERE run_id = $1 AND loan_deduction > 0',
            [id]
        );
        for (const slip of payslipsRes.rows) {
            await client.query(
                `UPDATE payroll_loans SET
                    total_repaid = total_repaid + $1,
                    balance = GREATEST(balance - $1, 0),
                    status = CASE WHEN balance - $1 <= 0 THEN 'completed' ELSE status END
                 WHERE user_id = $2 AND status = 'active'`,
                [slip.loan_deduction, slip.user_id]
            );
        }

        await client.query('COMMIT');

        res.json({ message: 'Payroll run marked as paid', id });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error marking payroll run as paid:', err);
        res.status(500).json({ message: 'Server error' });
    } finally {
        client.release();
    }
};

// ============================================================================
// PAYSLIPS
// ============================================================================

const getPayslips = async (req, res) => {
    try {
        const { run_id, user_id, status } = req.query;
        let q = `SELECT ps.*, u.full_name, u.email, pr.run_number, pr.period_start, pr.period_end
                 FROM payslips ps
                 JOIN users u ON ps.user_id = u.id
                 JOIN payroll_runs pr ON ps.run_id = pr.id
                 WHERE 1=1`;
        const params = [];

        if (run_id) {
            params.push(run_id);
            q += ` AND ps.run_id = $${params.length}`;
        }
        if (user_id) {
            params.push(user_id);
            q += ` AND ps.user_id = $${params.length}`;
        }
        if (status) {
            params.push(status);
            q += ` AND ps.status = $${params.length}`;
        }

        q += ` ORDER BY ps.created_at DESC`;

        const result = await pool.query(q, params);
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching payslips:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

const getPayslipById = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query(
            `SELECT ps.*, u.full_name, u.email, pr.run_number,
                    pr.period_start, pr.period_end, b.branch_name
             FROM payslips ps
             JOIN users u ON ps.user_id = u.id
             JOIN payroll_runs pr ON ps.run_id = pr.id
             LEFT JOIN branches b ON pr.branch_id = b.id
             WHERE ps.id = $1`,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Payslip not found' });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error fetching payslip:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

const getMyPayslips = async (req, res) => {
    try {
        const userId = req.user.id;
        const result = await pool.query(
            `SELECT ps.*, pr.run_number, pr.period_start, pr.period_end, b.branch_name
             FROM payslips ps
             JOIN payroll_runs pr ON ps.run_id = pr.id
             LEFT JOIN branches b ON pr.branch_id = b.id
             WHERE ps.user_id = $1
             ORDER BY ps.created_at DESC`,
            [userId]
        );

        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching my payslips:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

// ============================================================================
// LOANS
// ============================================================================

const getLoans = async (req, res) => {
    try {
        const { user_id, status, branch_id } = req.query;
        let q = `SELECT l.*, u.full_name, u.email, b.branch_name,
                        a.full_name as approved_by_name
                 FROM payroll_loans l
                 JOIN users u ON l.user_id = u.id
                 LEFT JOIN branches b ON l.branch_id = b.id
                 LEFT JOIN users a ON l.approved_by = a.id
                 WHERE 1=1`;
        const params = [];

        if (user_id) {
            params.push(user_id);
            q += ` AND l.user_id = $${params.length}`;
        }
        if (status) {
            params.push(status);
            q += ` AND l.status = $${params.length}`;
        }
        if (branch_id) {
            params.push(branch_id);
            q += ` AND l.branch_id = $${params.length}`;
        }

        q += ` ORDER BY l.created_at DESC`;

        const result = await pool.query(q, params);
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching loans:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

const getLoanById = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query(
            `SELECT l.*, u.full_name, u.email, b.branch_name,
                    a.full_name as approved_by_name
             FROM payroll_loans l
             JOIN users u ON l.user_id = u.id
             LEFT JOIN branches b ON l.branch_id = b.id
             LEFT JOIN users a ON l.approved_by = a.id
             WHERE l.id = $1`,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Loan not found' });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error fetching loan:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

const createLoan = async (req, res) => {
    try {
        const { user_id, branch_id, loan_amount, monthly_deduction, reason, start_date } = req.body;
        const approved_by = req.user.id;
        const amount = parseFloat(loan_amount) || 0;

        const result = await pool.query(
            `INSERT INTO payroll_loans (
                user_id, branch_id, loan_amount, monthly_deduction,
                total_repaid, balance, reason, start_date,
                status, approved_by
             ) VALUES ($1, $2, $3, $4, 0, $3, $5, $6, 'active', $7)
             RETURNING *`,
            [user_id, branch_id, amount, monthly_deduction, reason, start_date || new Date(), approved_by]
        );

        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Error creating loan:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

const updateLoan = async (req, res) => {
    try {
        const { id } = req.params;
        const { monthly_deduction, reason, status } = req.body;

        const result = await pool.query(
            `UPDATE payroll_loans SET
                monthly_deduction = COALESCE($1, monthly_deduction),
                reason = COALESCE($2, reason),
                status = COALESCE($3, status),
                updated_at = NOW()
             WHERE id = $4
             RETURNING *`,
            [monthly_deduction, reason, status, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Loan not found' });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error updating loan:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

const cancelLoan = async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            `UPDATE payroll_loans SET status = 'cancelled', updated_at = NOW()
             WHERE id = $1 AND status IN ('active', 'pending')
             RETURNING *`,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(400).json({ message: 'Loan not found or cannot be cancelled' });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error cancelling loan:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = {
    getSalaries,
    getSalaryByUserId,
    createSalary,
    updateSalary,
    getPayrollRuns,
    getPayrollRunById,
    createPayrollRun,
    processPayrollRun,
    approvePayrollRun,
    markPayrollRunPaid,
    getPayslips,
    getPayslipById,
    getMyPayslips,
    getLoans,
    getLoanById,
    createLoan,
    updateLoan,
    cancelLoan
};
