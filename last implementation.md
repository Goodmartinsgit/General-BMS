Plan to implement                                        │
│                                                          │
│ Implementation Plan: Port Missing Eldaved-BMS Features   │
│ to General-BMS                                           │
│                                                          │
│ Context                                                  │
│                                                          │
│ General-BMS is a general-purpose Business Management     │
│ System that should mirror all non-tile-specific features │
│  from Eldaved-BMS. After comparing both codebases, 10    │
│ feature groups are missing. WhatsApp integration is      │
│ excluded per user request.                               │
│                                                          │
│ Existing Patterns (to follow consistently)               │
│                                                          │
│ - Backend: Express routes → controller → raw SQL with pg │
│  pool, parameterized queries                             │
│ - Auth: authenticateToken middleware +                   │
│ authorize('permission_name') permission check            │
│ - Frontend: React pages with useState/useEffect, api     │
│ axios instance, Tailwind CSS, modal pattern for forms    │
│ - Routing: Backend routes mounted in app.js as           │
│ app.use('/api/...', routes), frontend routes in App.jsx  │
│                                                          │
│ ---                                                      │
│ Phase 1: Database Migrations (Foundation)                │
│                                                          │
│ File: backend/database/migrations/014_create_accounting_ │
│ tables.sql                                               │
│                                                          │
│ Create all new tables needed across features:            │
│                                                          │
│ 1.1 General Ledger Tables                                │
│                                                          │
│ - gl_accounts — Chart of Accounts (code, name, type,     │
│ category, parent_id, normal_balance, is_header,          │
│ is_active)                                               │
│ - journal_entries — Entry header (entry_number, date,    │
│ type, source_module, status, fiscal_period_id,           │
│ created_by, approved_by, posted_by)                      │
│ - journal_entry_lines — Entry lines (entry_id,           │
│ account_id, debit_amount, credit_amount, description)    │
│ - bank_reconciliations — Bank statement matching         │
│ (account_id, statement_date, balances, status)           │
│ - cost_centers — Cost/profit centers (code, name, type,  │
│ manager_id, parent_id)                                   │
│ - fixed_assets — Asset tracking (name, code, category,   │
│ purchase info, depreciation, status)                     │
│                                                          │
│ 1.2 AP/AR Tables                                         │
│                                                          │
│ - vendors — Vendor master (code, name, type, contact     │
│ info, payment_terms, is_active)                          │
│ - bills — Purchase bills (bill_number, vendor_id, dates, │
│  amounts, status)                                        │
│ - bill_items — Bill line items (bill_id, gl_account_id,  │
│ description, qty, price, amount)                         │
│ - bill_payments — Payment records (bill_id, amount,      │
│ date, method, reference)                                 │
│ - customer_invoices — Sales invoices (invoice_number,    │
│ customer_id, dates, amounts, status)                     │
│ - invoice_items — Invoice line items                     │
│ - invoice_payments — Invoice payment records             │
│                                                          │
│ 1.3 Payroll Tables                                       │
│                                                          │
│ - employee_salaries — Salary structure (user_id,         │
│ basic_salary, allowances, pension rates, bank info)      │
│ - payroll_runs — Payroll batches (period dates,          │
│ payment_date, status, branch_id)                         │
│ - payslips — Individual payslips (run_id, user_id,       │
│ gross, deductions, net, status)                          │
│ - payroll_loans — Employee loans (user_id, amount,       │
│ repayments, status)                                      │
│                                                          │
│ 1.4 Task Management Tables                               │
│                                                          │
│ - tasks — Tasks (task_number, title, description,        │
│ assigned_to/by, status, priority, category,              │
│ due_date/time, soft delete fields)                       │
│ - task_history — Audit trail (task_id, action_type,      │
│ old/new values JSONB, changed_by, notes)                 │
│ - task_notifications — Notifications (task_id, user_id,  │
│ type, message, is_read)                                  │
│ - task_reminders — Reminders (task_id, type,             │
│ scheduled_for, is_sent, is_acknowledged)                 │
│                                                          │
│ 1.5 Auth Tables                                          │
│                                                          │
│ - password_reset_tokens — Reset tokens (user_id, token   │
│ hash, expires_at, used_at, ip_address)                   │
│                                                          │
│ 1.6 Notifications Table                                  │
│                                                          │
│ - notifications — General notifications (user_id, type,  │
│ title, message, is_read, reference_type, reference_id)   │
│                                                          │
│ ---                                                      │
│ Phase 2: Auth Enhancements                               │
│                                                          │
│ Backend                                                  │
│                                                          │
│ - File: backend/src/controllers/authController.js — Add  │
│ requestPasswordReset, verifyResetToken, resetPassword,   │
│ changePassword                                           │
│ - File: backend/src/routes/authRoutes.js — Add public    │
│ routes for forgot/reset password                         │
│ - File: backend/src/middleware/rateLimiter.js — Add      │
│ passwordResetLimiter (3 attempts/15min)                  │
│                                                          │
│ Frontend                                                 │
│                                                          │
│ - File: frontend/src/pages/ForgotPassword.jsx — Email    │
│ input form                                               │
│ - File: frontend/src/pages/ResetPassword.jsx — Token +   │
│ new password form                                        │
│ - File: frontend/src/pages/ChangePassword.jsx — Current  │
│ + new password (authenticated)                           │
│ - File: frontend/src/App.jsx — Add routes for            │
│ /forgot-password, /reset-password                        │
│                                                          │
│ ---                                                      │
│ Phase 3: General Ledger / Accounting                     │
│                                                          │
│ Backend (6 files)                                        │
│                                                          │
│ - File: backend/src/controllers/glController.js          │
│   - Chart of Accounts: CRUD, hierarchy, balance          │
│ calculation, trial balance                               │
│   - Journal Entries: CRUD, validate (debits=credits),    │
│ approve, post, reverse                                   │
│ - File: backend/src/routes/glRoutes.js — All GL          │
│ endpoints                                                │
│ - File:                                                  │
│ backend/src/controllers/bankReconciliationController.js  │
│ — Reconciliation CRUD                                    │
│ - File: backend/src/routes/bankReconciliationRoutes.js   │
│ - File: backend/src/controllers/costCenterController.js  │
│ — Cost center CRUD                                       │
│ - File: backend/src/routes/costCenterRoutes.js           │
│ - File: backend/src/controllers/fixedAssetController.js  │
│ — Asset CRUD + depreciation                              │
│ - File: backend/src/routes/fixedAssetRoutes.js           │
│                                                          │
│ Frontend (5 pages)                                       │
│                                                          │
│ - File: frontend/src/pages/ChartOfAccountsPage.jsx —     │
│ Account tree/list view, CRUD modal                       │
│ - File: frontend/src/pages/JournalEntriesPage.jsx —      │
│ Entry list, create/edit modal with multi-line            │
│ debit/credit                                             │
│ - File: frontend/src/pages/BankReconciliationPage.jsx —  │
│ Reconciliation form                                      │
│ - File: frontend/src/pages/CostCentersPage.jsx — Cost    │
│ center management                                        │
│ - File: frontend/src/pages/FixedAssetsPage.jsx — Asset   │
│ register with depreciation                               │
│                                                          │
│ ---                                                      │
│ Phase 4: Vendors & Bills (AP Enhancement)                │
│                                                          │
│ Backend (4 files)                                        │
│                                                          │
│ - File: backend/src/controllers/vendorController.js —    │
│ CRUD, search, balance, bills listing                     │
│ - File: backend/src/routes/vendorRoutes.js               │
│ - File: backend/src/controllers/billController.js —      │
│ CRUD, payment recording, overdue tracking, AP aging      │
│ - File: backend/src/routes/billRoutes.js                 │
│                                                          │
│ Frontend (4 files)                                       │
│                                                          │
│ - File: frontend/src/pages/VendorsPage.jsx — Vendor list │
│  with search/filter                                      │
│ - File: frontend/src/components/VendorFormModal.jsx —    │
│ Vendor create/edit                                       │
│ - File: frontend/src/pages/BillsPage.jsx — Bill list     │
│ with status filters, payment modal                       │
│ - File: frontend/src/components/BillFormModal.jsx — Bill │
│  create/edit with line items                             │
│                                                          │
│ ---                                                      │
│ Phase 5: Invoices (AR Enhancement)                       │
│                                                          │
│ Backend (2 files)                                        │
│                                                          │
│ - File: backend/src/controllers/invoiceController.js —   │
│ CRUD, create from sale, payment recording, write-off, AR │
│  aging, customer statement                               │
│ - File: backend/src/routes/invoiceRoutes.js              │
│                                                          │
│ Frontend (3 files)                                       │
│                                                          │
│ - File: frontend/src/pages/InvoicesPage.jsx — Invoice    │
│ list with filters                                        │
│ - File: frontend/src/components/InvoiceFormModal.jsx —   │
│ Invoice create/edit with line items                      │
│ - File: frontend/src/components/InvoicePaymentModal.jsx  │
│ — Record payment modal                                   │
│                                                          │
│ ---                                                      │
│ Phase 6: Payroll Management                              │
│                                                          │
│ Backend (2 files)                                        │
│                                                          │
│ - File: backend/src/controllers/payrollController.js —   │
│ Salary CRUD, payroll runs (create/process/approve/pay),  │
│ payslips, loans                                          │
│ - File: backend/src/routes/payrollRoutes.js              │
│                                                          │
│ Frontend (5 files)                                       │
│                                                          │
│ - File: frontend/src/pages/PayrollDashboardPage.jsx —    │
│ Overview with stats                                      │
│ - File: frontend/src/pages/EmployeeSalariesPage.jsx —    │
│ Salary configuration per employee                        │
│ - File: frontend/src/pages/PayrollRunsPage.jsx — Payroll │
│  run list + processing                                   │
│ - File: frontend/src/pages/PayslipsPage.jsx — Payslip    │
│ viewing (admin & self-service)                           │
│ - File: frontend/src/pages/EmployeeLoansPage.jsx — Loan  │
│ management                                               │
│                                                          │
│ ---                                                      │
│ Phase 7: Task Management                                 │
│                                                          │
│ Backend (2 files)                                        │
│                                                          │
│ - File: backend/src/controllers/taskController.js —      │
│ CRUD, status updates, reassign, statistics, history,     │
│ notifications, reminders                                 │
│ - File: backend/src/routes/taskRoutes.js                 │
│                                                          │
│ Frontend (3 files)                                       │
│                                                          │
│ - File: frontend/src/pages/TasksPage.jsx — Task list     │
│ with filters (status, priority, assignee)                │
│ - File: frontend/src/components/TaskFormModal.jsx — Task │
│  create/edit                                             │
│ - File: frontend/src/pages/TaskDetailPage.jsx — Task     │
│ detail with history timeline                             │
│                                                          │
│ ---                                                      │
│ Phase 8: Notifications System                            │
│                                                          │
│ Backend (2 files)                                        │
│                                                          │
│ - File:                                                  │
│ backend/src/controllers/notificationController.js — Get  │
│ notifications, count, mark read, delete                  │
│ - File: backend/src/routes/notificationRoutes.js         │
│                                                          │
│ Frontend (2 files)                                       │
│                                                          │
│ - File: frontend/src/pages/NotificationsPage.jsx — Full  │
│ notification list                                        │
│ - File: Update frontend/src/components/layout/Navbar.jsx │
│  — Add notification bell with unread count badge         │
│                                                          │
│ ---                                                      │
│ Phase 9: Dashboard Enhancements                          │
│                                                          │
│ Backend (2 files)                                        │
│                                                          │
│ - File: backend/src/controllers/dashboardController.js — │
│  Role-based dashboards (superadmin/admin/staff),         │
│ activity feed, quick actions                             │
│ - File: backend/src/routes/dashboardRoutes.js            │
│                                                          │
│ Frontend (3 files)                                       │
│                                                          │
│ - File: Update frontend/src/pages/Dashboard.jsx —        │
│ Integrate dashboard API, role-based views, activity feed │
│  widget, quick actions                                   │
│ - File:                                                  │
│ frontend/src/components/dashboard/ActivityFeed.jsx —     │
│ Recent activity component                                │
│ - File:                                                  │
│ frontend/src/components/dashboard/QuickActions.jsx —     │
│ Action shortcuts component                               │
│                                                          │
│ ---                                                      │
│ Phase 10: Additional Pages & Enhancements                │
│                                                          │
│ Frontend only (5 files)                                  │
│                                                          │
│ - File: frontend/src/pages/CustomerDetailPage.jsx —      │
│ Customer profile + purchase history + statement          │
│ - File: frontend/src/pages/BranchDetailPage.jsx — Branch │
│  dashboard with metrics                                  │
│ - File: frontend/src/pages/ActivityLogsPage.jsx — System │
│  audit trail viewer                                      │
│ - File: frontend/src/pages/PurgeManagementPage.jsx —     │
│ Hard delete management UI                                │
│ - File: frontend/src/pages/ExpenseAnalyticsPage.jsx —    │
│ Expense analytics/charts                                 │
│                                                          │
│ Backend additions                                        │
│                                                          │
│ - File: Update                                           │
│ backend/src/controllers/recycleBinController.js — Add    │
│ purge management endpoints                               │
│ - File: Update existing analytics controller — Add       │
│ expense analytics endpoint                               │
│                                                          │
│ ---                                                      │
│ Phase 11: Route Registration & Navigation                │
│                                                          │
│ Backend                                                  │
│                                                          │
│ - File: Update backend/src/app.js — Mount all new routes │
│                                                          │
│ Frontend                                                 │
│                                                          │
│ - File: Update frontend/src/App.jsx — Add all new page   │
│ routes                                                   │
│ - File: Update                                           │
│ frontend/src/components/layout/Sidebar.jsx — Add         │
│ navigation items for new sections:                       │
│   - Accounting section: Chart of Accounts, Journal       │
│ Entries, Bank Reconciliation, Cost Centers, Fixed Assets │
│   - AP/AR section: Vendors, Bills, Invoices              │
│   - HR section: Payroll Dashboard, Salaries, Payroll     │
│ Runs, Payslips, Loans                                    │
│   - Task Management                                      │
│   - Notifications                                        │
│                                                          │
│ ---                                                      │
│ Summary: Files to Create/Modify                          │
│                                                          │
│ New Files (~45)                                          │
│                                                          │
│ Category: Migrations                                     │
│ Backend: 1 SQL file                                      │
│ Frontend: —                                              │
│ ────────────────────────────────────────                 │
│ Category: Auth                                           │
│ Backend: —                                               │
│ Frontend: 3 pages                                        │
│ ────────────────────────────────────────                 │
│ Category: GL/Accounting                                  │
│ Backend: 8 (4 controllers + 4 routes)                    │
│ Frontend: 5 pages                                        │
│ ────────────────────────────────────────                 │
│ Category: Vendors/Bills                                  │
│ Backend: 4 (2 controllers + 2 routes)                    │
│ Frontend: 4 (2 pages + 2 modals)                         │
│ ────────────────────────────────────────                 │
│ Category: Invoices                                       │
│ Backend: 2 (1 controller + 1 route)                      │
│ Frontend: 3 (1 page + 2 modals)                          │
│ ────────────────────────────────────────                 │
│ Category: Payroll                                        │
│ Backend: 2 (1 controller + 1 route)                      │
│ Frontend: 5 pages                                        │
│ ────────────────────────────────────────                 │
│ Category: Tasks                                          │
│ Backend: 2 (1 controller + 1 route)                      │
│ Frontend: 3 (2 pages + 1 modal)                          │
│ ────────────────────────────────────────                 │
│ Category: Notifications                                  │
│ Backend: 2 (1 controller + 1 route)                      │
│ Frontend: 1 page                                         │
│ ────────────────────────────────────────                 │
│ Category: Dashboard                                      │
│ Backend: 2 (1 controller + 1 route)                      │
│ Frontend: 2 components                                   │
│ ────────────────────────────────────────                 │
│ Category: Additional                                     │
│ Backend: —                                               │
│ Frontend: 5 pages                                        │
│                                                          │
│ Files to Modify (~5)                                     │
│                                                          │
│ - backend/src/app.js — Mount new routes                  │
│ - backend/src/routes/authRoutes.js — Add password reset  │
│ routes                                                   │
│ - backend/src/controllers/authController.js — Add reset  │
│ functions                                                │
│ - frontend/src/App.jsx — Add new routes                  │
│ - frontend/src/components/layout/Sidebar.jsx — Add nav   │
│ items                                                    │
│ - frontend/src/components/layout/Navbar.jsx — Add        │
│ notification bell                                        │
│                                                          │
│ ---                                                      │
│ Verification Plan                                        │
│                                                          │
│ 1. Run migration against dev database                    │
│ 2. Start backend (npm run dev) — verify no startup       │
│ errors                                                   │
│ 3. Test each new API endpoint via Postman/curl           │
│ 4. Start frontend (npm run dev) — verify all new pages   │
│ render                                                   │
│ 5. Test CRUD flows: create/read/update/delete for each   │
│ entity                                                   │
│ 6. Test auth flow: forgot password → reset password      │
│ 7. Test role-based dashboard views                       │
│ 8. Verify sidebar navigation shows all new sections  
