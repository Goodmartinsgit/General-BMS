-- Migration 014: Create accounting, AP/AR, payroll, task management, notifications, and auth tables
-- Run this migration after all previous migrations (001-013)
-- NOTE: users.id is UUID; all other referenced tables use INTEGER PKs

BEGIN;

-- ============================================================
-- 1. GENERAL LEDGER TABLES
-- ============================================================

-- Chart of Accounts
CREATE TABLE IF NOT EXISTS gl_accounts (
    id SERIAL PRIMARY KEY,
    code VARCHAR(20) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('asset', 'liability', 'equity', 'revenue', 'expense')),
    category VARCHAR(100),
    parent_id INTEGER REFERENCES gl_accounts(id) ON DELETE SET NULL,
    normal_balance VARCHAR(10) NOT NULL DEFAULT 'debit' CHECK (normal_balance IN ('debit', 'credit')),
    is_header BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    description TEXT,
    branch_id INTEGER REFERENCES branches(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Journal Entries (header)
CREATE TABLE IF NOT EXISTS journal_entries (
    id SERIAL PRIMARY KEY,
    entry_number VARCHAR(50) NOT NULL UNIQUE,
    entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
    type VARCHAR(50) DEFAULT 'general' CHECK (type IN ('general', 'adjusting', 'closing', 'reversing', 'opening')),
    source_module VARCHAR(50),
    source_reference VARCHAR(100),
    description TEXT,
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'pending_approval', 'approved', 'posted', 'reversed')),
    fiscal_period_id INTEGER REFERENCES fiscal_periods(id) ON DELETE SET NULL,
    branch_id INTEGER REFERENCES branches(id) ON DELETE SET NULL,
    total_debit NUMERIC(15,2) DEFAULT 0,
    total_credit NUMERIC(15,2) DEFAULT 0,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
    approved_at TIMESTAMP,
    posted_by UUID REFERENCES users(id) ON DELETE SET NULL,
    posted_at TIMESTAMP,
    reversed_by UUID REFERENCES users(id) ON DELETE SET NULL,
    reversed_at TIMESTAMP,
    reversal_entry_id INTEGER REFERENCES journal_entries(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Journal Entry Lines
CREATE TABLE IF NOT EXISTS journal_entry_lines (
    id SERIAL PRIMARY KEY,
    entry_id INTEGER NOT NULL REFERENCES journal_entries(id) ON DELETE CASCADE,
    account_id INTEGER NOT NULL REFERENCES gl_accounts(id) ON DELETE RESTRICT,
    debit_amount NUMERIC(15,2) DEFAULT 0,
    credit_amount NUMERIC(15,2) DEFAULT 0,
    description TEXT,
    cost_center_id INTEGER,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Bank Reconciliations
CREATE TABLE IF NOT EXISTS bank_reconciliations (
    id SERIAL PRIMARY KEY,
    account_id INTEGER NOT NULL REFERENCES gl_accounts(id) ON DELETE RESTRICT,
    statement_date DATE NOT NULL,
    statement_balance NUMERIC(15,2) NOT NULL,
    book_balance NUMERIC(15,2),
    adjusted_balance NUMERIC(15,2),
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'in_progress', 'completed')),
    notes TEXT,
    reconciled_by UUID REFERENCES users(id) ON DELETE SET NULL,
    completed_at TIMESTAMP,
    branch_id INTEGER REFERENCES branches(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Cost Centers
CREATE TABLE IF NOT EXISTS cost_centers (
    id SERIAL PRIMARY KEY,
    code VARCHAR(20) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(20) DEFAULT 'cost' CHECK (type IN ('cost', 'profit', 'investment')),
    manager_id UUID REFERENCES users(id) ON DELETE SET NULL,
    parent_id INTEGER REFERENCES cost_centers(id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT TRUE,
    description TEXT,
    branch_id INTEGER REFERENCES branches(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Fixed Assets
CREATE TABLE IF NOT EXISTS fixed_assets (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) UNIQUE,
    category VARCHAR(100),
    description TEXT,
    purchase_date DATE,
    purchase_price NUMERIC(15,2),
    supplier_id INTEGER REFERENCES suppliers(id) ON DELETE SET NULL,
    useful_life_months INTEGER,
    salvage_value NUMERIC(15,2) DEFAULT 0,
    depreciation_method VARCHAR(30) DEFAULT 'straight_line' CHECK (depreciation_method IN ('straight_line', 'declining_balance', 'units_of_production')),
    accumulated_depreciation NUMERIC(15,2) DEFAULT 0,
    current_value NUMERIC(15,2),
    gl_account_id INTEGER REFERENCES gl_accounts(id) ON DELETE SET NULL,
    depreciation_account_id INTEGER REFERENCES gl_accounts(id) ON DELETE SET NULL,
    location VARCHAR(255),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'disposed', 'fully_depreciated', 'under_maintenance')),
    disposal_date DATE,
    disposal_amount NUMERIC(15,2),
    branch_id INTEGER REFERENCES branches(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Add cost_center_id FK to journal_entry_lines now that cost_centers exists
ALTER TABLE journal_entry_lines
    ADD CONSTRAINT fk_jel_cost_center
    FOREIGN KEY (cost_center_id) REFERENCES cost_centers(id) ON DELETE SET NULL;

-- ============================================================
-- 2. ACCOUNTS PAYABLE (AP) TABLES
-- ============================================================

-- Vendors
CREATE TABLE IF NOT EXISTS vendors (
    id SERIAL PRIMARY KEY,
    code VARCHAR(20) UNIQUE,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) DEFAULT 'supplier' CHECK (type IN ('supplier', 'service_provider', 'contractor', 'other')),
    contact_person VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(50),
    address TEXT,
    city VARCHAR(100),
    tax_id VARCHAR(50),
    payment_terms VARCHAR(100),
    credit_limit NUMERIC(15,2) DEFAULT 0,
    current_balance NUMERIC(15,2) DEFAULT 0,
    gl_account_id INTEGER REFERENCES gl_accounts(id) ON DELETE SET NULL,
    notes TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    branch_id INTEGER REFERENCES branches(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Bills (Purchase Bills)
CREATE TABLE IF NOT EXISTS bills (
    id SERIAL PRIMARY KEY,
    bill_number VARCHAR(50) NOT NULL UNIQUE,
    vendor_id INTEGER NOT NULL REFERENCES vendors(id) ON DELETE RESTRICT,
    bill_date DATE NOT NULL DEFAULT CURRENT_DATE,
    due_date DATE,
    subtotal NUMERIC(15,2) DEFAULT 0,
    tax_amount NUMERIC(15,2) DEFAULT 0,
    total_amount NUMERIC(15,2) DEFAULT 0,
    amount_paid NUMERIC(15,2) DEFAULT 0,
    balance_due NUMERIC(15,2) DEFAULT 0,
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'pending', 'partially_paid', 'paid', 'overdue', 'cancelled')),
    reference VARCHAR(100),
    notes TEXT,
    gl_account_id INTEGER REFERENCES gl_accounts(id) ON DELETE SET NULL,
    branch_id INTEGER REFERENCES branches(id) ON DELETE SET NULL,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Bill Items
CREATE TABLE IF NOT EXISTS bill_items (
    id SERIAL PRIMARY KEY,
    bill_id INTEGER NOT NULL REFERENCES bills(id) ON DELETE CASCADE,
    gl_account_id INTEGER REFERENCES gl_accounts(id) ON DELETE SET NULL,
    description TEXT NOT NULL,
    quantity NUMERIC(10,2) DEFAULT 1,
    unit_price NUMERIC(15,2) DEFAULT 0,
    amount NUMERIC(15,2) DEFAULT 0,
    tax_rate NUMERIC(5,2) DEFAULT 0,
    tax_amount NUMERIC(15,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Bill Payments
CREATE TABLE IF NOT EXISTS bill_payments (
    id SERIAL PRIMARY KEY,
    bill_id INTEGER NOT NULL REFERENCES bills(id) ON DELETE CASCADE,
    amount NUMERIC(15,2) NOT NULL,
    payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    payment_method VARCHAR(50) DEFAULT 'bank_transfer',
    reference VARCHAR(100),
    notes TEXT,
    gl_account_id INTEGER REFERENCES gl_accounts(id) ON DELETE SET NULL,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- 3. ACCOUNTS RECEIVABLE (AR) TABLES
-- ============================================================

-- Customer Invoices
CREATE TABLE IF NOT EXISTS customer_invoices (
    id SERIAL PRIMARY KEY,
    invoice_number VARCHAR(50) NOT NULL UNIQUE,
    customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
    sale_id INTEGER REFERENCES sales(id) ON DELETE SET NULL,
    invoice_date DATE NOT NULL DEFAULT CURRENT_DATE,
    due_date DATE,
    subtotal NUMERIC(15,2) DEFAULT 0,
    tax_amount NUMERIC(15,2) DEFAULT 0,
    discount_amount NUMERIC(15,2) DEFAULT 0,
    total_amount NUMERIC(15,2) DEFAULT 0,
    amount_paid NUMERIC(15,2) DEFAULT 0,
    balance_due NUMERIC(15,2) DEFAULT 0,
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'partially_paid', 'paid', 'overdue', 'written_off', 'cancelled')),
    notes TEXT,
    gl_account_id INTEGER REFERENCES gl_accounts(id) ON DELETE SET NULL,
    branch_id INTEGER REFERENCES branches(id) ON DELETE SET NULL,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Invoice Items
CREATE TABLE IF NOT EXISTS invoice_items (
    id SERIAL PRIMARY KEY,
    invoice_id INTEGER NOT NULL REFERENCES customer_invoices(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
    description TEXT NOT NULL,
    quantity NUMERIC(10,2) DEFAULT 1,
    unit_price NUMERIC(15,2) DEFAULT 0,
    amount NUMERIC(15,2) DEFAULT 0,
    tax_rate NUMERIC(5,2) DEFAULT 0,
    tax_amount NUMERIC(15,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Invoice Payments
CREATE TABLE IF NOT EXISTS invoice_payments (
    id SERIAL PRIMARY KEY,
    invoice_id INTEGER NOT NULL REFERENCES customer_invoices(id) ON DELETE CASCADE,
    amount NUMERIC(15,2) NOT NULL,
    payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    payment_method VARCHAR(50) DEFAULT 'cash',
    reference VARCHAR(100),
    notes TEXT,
    gl_account_id INTEGER REFERENCES gl_accounts(id) ON DELETE SET NULL,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- 4. PAYROLL TABLES
-- ============================================================

-- Employee Salaries
CREATE TABLE IF NOT EXISTS employee_salaries (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    basic_salary NUMERIC(15,2) NOT NULL DEFAULT 0,
    housing_allowance NUMERIC(15,2) DEFAULT 0,
    transport_allowance NUMERIC(15,2) DEFAULT 0,
    other_allowances NUMERIC(15,2) DEFAULT 0,
    employee_pension_rate NUMERIC(5,2) DEFAULT 8.00,
    employer_pension_rate NUMERIC(5,2) DEFAULT 10.00,
    tax_rate NUMERIC(5,2) DEFAULT 0,
    bank_name VARCHAR(100),
    bank_account_number VARCHAR(50),
    payment_method VARCHAR(50) DEFAULT 'bank_transfer',
    effective_date DATE DEFAULT CURRENT_DATE,
    is_active BOOLEAN DEFAULT TRUE,
    branch_id INTEGER REFERENCES branches(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, effective_date)
);

-- Payroll Runs
CREATE TABLE IF NOT EXISTS payroll_runs (
    id SERIAL PRIMARY KEY,
    run_number VARCHAR(50) NOT NULL UNIQUE,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    payment_date DATE,
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'processing', 'approved', 'paid', 'cancelled')),
    total_gross NUMERIC(15,2) DEFAULT 0,
    total_deductions NUMERIC(15,2) DEFAULT 0,
    total_net NUMERIC(15,2) DEFAULT 0,
    employee_count INTEGER DEFAULT 0,
    branch_id INTEGER REFERENCES branches(id) ON DELETE SET NULL,
    notes TEXT,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
    approved_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Payslips
CREATE TABLE IF NOT EXISTS payslips (
    id SERIAL PRIMARY KEY,
    run_id INTEGER NOT NULL REFERENCES payroll_runs(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    basic_salary NUMERIC(15,2) DEFAULT 0,
    housing_allowance NUMERIC(15,2) DEFAULT 0,
    transport_allowance NUMERIC(15,2) DEFAULT 0,
    other_allowances NUMERIC(15,2) DEFAULT 0,
    gross_salary NUMERIC(15,2) DEFAULT 0,
    employee_pension NUMERIC(15,2) DEFAULT 0,
    employer_pension NUMERIC(15,2) DEFAULT 0,
    tax_deduction NUMERIC(15,2) DEFAULT 0,
    loan_deduction NUMERIC(15,2) DEFAULT 0,
    other_deductions NUMERIC(15,2) DEFAULT 0,
    total_deductions NUMERIC(15,2) DEFAULT 0,
    net_salary NUMERIC(15,2) DEFAULT 0,
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'processed', 'paid')),
    payment_reference VARCHAR(100),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(run_id, user_id)
);

-- Payroll Loans
CREATE TABLE IF NOT EXISTS payroll_loans (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    loan_amount NUMERIC(15,2) NOT NULL,
    monthly_deduction NUMERIC(15,2) NOT NULL,
    total_repaid NUMERIC(15,2) DEFAULT 0,
    balance NUMERIC(15,2) NOT NULL,
    start_date DATE NOT NULL DEFAULT CURRENT_DATE,
    end_date DATE,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
    reason TEXT,
    approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
    branch_id INTEGER REFERENCES branches(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- 5. TASK MANAGEMENT TABLES
-- ============================================================

-- Tasks
CREATE TABLE IF NOT EXISTS tasks (
    id SERIAL PRIMARY KEY,
    task_number VARCHAR(50) NOT NULL UNIQUE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
    assigned_by UUID REFERENCES users(id) ON DELETE SET NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled', 'overdue')),
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    category VARCHAR(100),
    due_date DATE,
    due_time TIME,
    completed_at TIMESTAMP,
    branch_id INTEGER REFERENCES branches(id) ON DELETE SET NULL,
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMP,
    deleted_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Task History
CREATE TABLE IF NOT EXISTS task_history (
    id SERIAL PRIMARY KEY,
    task_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    action_type VARCHAR(50) NOT NULL,
    old_values JSONB,
    new_values JSONB,
    changed_by UUID REFERENCES users(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Task Notifications
CREATE TABLE IF NOT EXISTS task_notifications (
    id SERIAL PRIMARY KEY,
    task_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Task Reminders
CREATE TABLE IF NOT EXISTS task_reminders (
    id SERIAL PRIMARY KEY,
    task_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    type VARCHAR(20) DEFAULT 'before_due' CHECK (type IN ('before_due', 'on_due', 'after_due', 'custom')),
    scheduled_for TIMESTAMP NOT NULL,
    is_sent BOOLEAN DEFAULT FALSE,
    is_acknowledged BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- 6. PASSWORD RESET TOKENS
-- ============================================================

CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    used_at TIMESTAMP,
    ip_address VARCHAR(45),
    created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- 7. NOTIFICATIONS TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    reference_type VARCHAR(50),
    reference_id INTEGER,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- 8. INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_gl_accounts_type ON gl_accounts(type);
CREATE INDEX IF NOT EXISTS idx_gl_accounts_parent ON gl_accounts(parent_id);
CREATE INDEX IF NOT EXISTS idx_journal_entries_date ON journal_entries(entry_date);
CREATE INDEX IF NOT EXISTS idx_journal_entries_status ON journal_entries(status);
CREATE INDEX IF NOT EXISTS idx_journal_entry_lines_entry ON journal_entry_lines(entry_id);
CREATE INDEX IF NOT EXISTS idx_journal_entry_lines_account ON journal_entry_lines(account_id);
CREATE INDEX IF NOT EXISTS idx_vendors_name ON vendors(name);
CREATE INDEX IF NOT EXISTS idx_bills_vendor ON bills(vendor_id);
CREATE INDEX IF NOT EXISTS idx_bills_status ON bills(status);
CREATE INDEX IF NOT EXISTS idx_bills_due_date ON bills(due_date);
CREATE INDEX IF NOT EXISTS idx_customer_invoices_customer ON customer_invoices(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_invoices_status ON customer_invoices(status);
CREATE INDEX IF NOT EXISTS idx_customer_invoices_due_date ON customer_invoices(due_date);
CREATE INDEX IF NOT EXISTS idx_employee_salaries_user ON employee_salaries(user_id);
CREATE INDEX IF NOT EXISTS idx_payroll_runs_status ON payroll_runs(status);
CREATE INDEX IF NOT EXISTS idx_payslips_run ON payslips(run_id);
CREATE INDEX IF NOT EXISTS idx_payslips_user ON payslips(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_task_history_task ON task_history(task_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user ON password_reset_tokens(user_id);

COMMIT;
