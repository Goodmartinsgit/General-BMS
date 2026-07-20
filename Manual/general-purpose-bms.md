# General-Purpose Business Management System (BMS)
## Complete User Guide & Operations Manual

Welcome to the **General-Purpose Business Management System (BMS)**. This manual is a comprehensive guide to understanding, navigating, and operating all functions of the ERP and Business Management platform. The system integrates point of sale, inventory tracking, wholesale transactions, HR and payroll services, comprehensive multi-branch ledger accounting, task management, and client relationships into a unified administrative web workspace.

---

## 1. Application Layout & Navigation

The application uses a modern, responsive, three-tier interface layout. Navigating the system is streamlined through a persistent **Navigation Sidebar**, a top **Navbar**, and dashboard control selectors.

### 1.1 The Navigation Sidebar
The Sidebar on the left provides quick access to all system modules. It operates in two modes:
- **Expanded Mode:** Displays group categories, item icons, and descriptive labels.
- **Collapsed Mode:** Minimizes to icons only, saving screen space. Hovering over any icon opens a fly-out submenu listing the child items.
- **Interactive Search:** At the top of the Sidebar, users can search for pages by keyword to quickly filter navigation items.

### 1.2 Top Navbar Controls
The Navbar remains at the top of the screen and includes:
- **Sidebar Toggle:** A hamburger menu button to expand or collapse the sidebar.
- **Active Branch Selector:** Allows managers with appropriate access to switch the active branch context, updating all statistics, POS sessions, and inventory details instantly.
- **Fiscal Period Selector:** Filters accounting ledgers, journals, and financial statements by the active fiscal year/month.
- **Notifications Hub:** A quick-access bell icon displaying recent system tasks, approvals, and general alerts.
- **Theme Switcher:** Toggles the layout theme between clean light mode and optimized dark mode.
- **User Profile Menu:** Displays the logged-in user name and avatar, with options to change passwords or securely sign out.

### 1.3 Navigation Menu Groups

The system routes are permission-restricted. Users will only see sections they are authorized to access based on their assigned role's permission matrix.

```
┌─────────────────────────────────────────────────────────────┐
│                       NAVIGATION MAP                        │
├───────────────────┬─────────────────────────────────────────┤
│ Group             │ Pages / Paths                           │
├───────────────────┼─────────────────────────────────────────┤
│ 1. Dashboard      │ Overview dashboard (/)                  │
├───────────────────┼─────────────────────────────────────────┤
│ 2. Online Store   │ Orders, Change Requests, App Builder,   │
│                   │ Store Settings                          │
├───────────────────┼─────────────────────────────────────────┤
│ 3. Branches       │ All Branches listing                    │
├───────────────────┼─────────────────────────────────────────┤
│ 4. Inventory      │ Product Catalogue, Products, Stock,     │
│                   │ Categories, Transfers, Damages,         │
│                   │ Activity Log, Purchase Orders           │
├───────────────────┼─────────────────────────────────────────┤
│ 5. Sales & Orders │ POS Terminal, Sales, Quotations,        │
│                   │ Wholesale Orders, Returns               │
├───────────────────┼─────────────────────────────────────────┤
│ 6. CRM            │ Customers, Suppliers, Referrers         │
├───────────────────┼─────────────────────────────────────────┤
│ 7. Expenses       │ Expense log, Budgets                    │
├───────────────────┼─────────────────────────────────────────┤
│ 8. Accounting     │ Cash Flow, Payments, Price Tiers, Bank  │
│                   │ Channels, Chart of Accounts, Journals,  │
│                   │ Bank Recon, Cost Centers, Fixed Assets  │
├───────────────────┼─────────────────────────────────────────┤
│ 9. AP / AR        │ Vendors, Bills, Customer Invoices       │
├───────────────────┼─────────────────────────────────────────┤
│ 10. Payroll & HR  │ Dashboard, Salaries, Runs, Payslips,    │
│                   │ Loans                                   │
├───────────────────┼─────────────────────────────────────────┤
│ 11. Tasks         │ General Tasks, Retail Performance Tasks │
├───────────────────┼─────────────────────────────────────────┤
│ 12. Analytics     │ Sales, Inventory, Customers, Expenses   │
├───────────────────┼─────────────────────────────────────────┤
│ 13. Reports Hub   │ Financial statements (Income Statement, │
│                   │ Balance Sheet, Trial Balance, Cash      │
│                   │ Flow, P&L, AR/AP Aging, Inventory Value)│
├───────────────────┼─────────────────────────────────────────┤
│ 14. Settings      │ System Settings, Users, Recycle Bin,    │
│                   │ Activity Logs, Purge Management         │
└───────────────────┴─────────────────────────────────────────┘
```

---

## 2. Authentication & Core Account Operations

### 2.1 Login Interface
![Login Interface](./Login%20%26%20Authentication.png)

Access is restricted via standard JWT authentication. Users must log in with their registered corporate email address and password.
- **Forgot Password:** Users can request a password reset email if locked out.
- **Reset Password:** Enables secure entry of new passwords using unique tokens.
- **Change Password:** Accessed from the user profile dropdown, allowing logged-in staff to change passwords at any time.

> [!NOTE]
> System branding details (company logo, color themes, organization name) configured in Settings propagate to the public Login Screen.

---

## 3. Module Operations

### 3.1 Executive Dashboard
![Executive Dashboard](./Executive%20Dashboard.png)

Provides a central command interface summarizing cross-branch statistics:
- **KPI Counters:** Shows total sales, net profit margin, active inventory value, and active client balances.
- **Sales and Revenue Charts:** Visualization of daily/monthly revenue trends using interactive line and bar charts.
- **Alert Panel:** Displays tasks nearing deadlines, stock levels that have fallen below reorder levels, and pending bank confirmations.

### 3.2 Online E-Commerce Store & Web Builder
Allows administrators to manage the customer-facing storefront:
- **Orders Page:** Lists and tracks purchases made online. It displays shipping status, payments, and connects items to branch stock.
- **Change Requests:** Moderation panel where edits or updates to the online catalog submitted by branch operators are reviewed.
- **App/Website Builder:** Visual designer to build public pages, adjust navigation headers, draft landing pages, and edit custom sections without writing code.
- **Store Settings:** Configures payment gateways, domains, contact information, and shipping rates.

### 3.3 Branches Management
Supports a multi-branch business model:
- **All Branches:** View branch addresses, contact numbers, and assigned personnel. Admins can create and configure new physical locations.
- **Branch Details:** In-depth view of active stock, dedicated ledgers, and staff lists for a selected branch.
- **Branch Analytics:** Dedicated sales volume charts, category performance, and staff performance trackers scoped to a single branch.

### 3.4 Inventory & Catalog Management
![Product Catalogue](./Product%20Catalogue.png)

A detailed warehouse and catalog tracking engine:
- **Product Catalogue:** A grid representation of products, including image galleries and color-tagged stock highlights.
- **Products list:** Master list for creating products, setting descriptions, barcodes, and managing color-specific images.
- **Stock Levels:** Real-time stock counts by branch, including unit cost and total asset value calculation.
- **Categories & Brands:** Hierarchical category management to organize catalog classification.
- **Stock Transfers:** Handles movement of stock between branches. Includes an interactive search bar with built-in input debounce to search items across the system without lag.
- **Stock Damages:** Logs damaged or lost stock, generating inventory adjustments and matching accounting expense writes.
- **Stock Activity:** Audit log tracking every stock change (receipts, sales, transfers, damages, and audits) with details on user, branch, and timestamp.
- **Purchase Orders:** Creation and lifecycle tracking of inventory procurement orders sent to suppliers.

### 3.5 Retail Sales & Point of Sale (POS)
![Point of Sale (POS) Terminal](./Point%20of%20Sale%20%28POS%29%20Terminal.png)

The retail execution engine:
- **POS Terminal:** A layout designed for high-speed counter sales. Features:
  - Quick product search by barcode or keyword.
  - Cart construction with instant discount or price tier override.
  - Cash, Card, and Bank Transfer payment buttons.
  - Integration with the **Receipts Configurator** to output custom receipts.
- **Sales History:** Complete record of all processed sales. Admins can view invoices, reprint receipts, and process returns.
- **Returns & Exchanges:** Processes returned items, calculates restocking values, handles exchange swaps, and posts cash flow adjustments.
- **Reversals & Cancellations:** Permits admins to cancel sales, which restores branch stock levels, cancels matching ledger writes, and voids recorded cash flows.

> [!IMPORTANT]
> **Tailored Cash Flow Rules:** Cash sales register cash flows immediately. Transactions marked as POS Card or Bank Transfer require selection of a configured **Bank Channel**. These sales start as 'Awaiting Confirmation' until an administrator approves the transaction in the Pending Confirmations queue, changing status to 'Paid' and logging the cash flow.

### 3.6 Wholesale Operations
Manages business-to-business (B2B) bulk transactions:
- **Wholesale Orders:** Creation and scheduling of bulk shipments.
- **Wholesale Invoices:** Generated invoices with automated properties.
  - *Generated Column Restriction:* The database table `balance_due` column is marked `GENERATED ALWAYS AS (total_amount - amount_paid) STORED` and cannot be modified manually.
- **Invoice Generation Workflow:** Generates wholesale documents from loaded order items, changing status to "Invoiced" after generating previews.

### 3.7 Customers, Suppliers & CRM
- **Customers Profile:** Tracks name, contact info, price tier rules, and history of retail and wholesale invoices.
- **Suppliers Profile:** Directory of supply companies, including active purchase orders and historical transaction ledgers.
- **Referrers Program:** Tracks third-party agents who refer customers, allowing calculation of due commissions based on sales volumes.

### 3.8 Expense Control & Budget Management
- **Expense Log:** Categorized business outlays with receipt image attachments.
- **Budget Setup:** Annual/monthly operational budgets.
  - *Precision Migration:* System accommodates allocations and utilization rates exceeding 1000% without data overflows (using DECIMAL(10,2) fields).

### 3.9 Accounting & Ledger Engine
A full-featured double-entry bookkeeping system:
- **Chart of Accounts (COA):** Listing of assets, liabilities, equity, revenues, and expenses. Supports sub-accounts and hierarchy.
- **Journal Entries:** Direct posting of debit and credit transactions to general ledgers.
- **Bank Reconciliation:** Match bank statement uploads with internal ledger transactions.
- **Cost Centers:** Allocate business revenues and costs to specific departments.
- **Fixed Assets:** Registry of company assets with built-in depreciation calculations.
- **Bank Channels:** Setup page where card terminals and bank transfer accounts are linked to standard chart of accounts cards.

### 3.10 Accounts Payable (AP) & Accounts Receivable (AR)
- **Vendors:** Directory of inventory and service suppliers.
- **Bills:** Record of vendor invoices awaiting payment.
- **Customer Invoices:** System-wide B2B invoices generated from wholesale or custom billing modules.

### 3.11 HR & Payroll Operations
- **Payroll Dashboard:** Executive view of wage expenses, loan advances, and payroll histories.
- **Employee Salaries:** Tracks active employee salary plans, base pay rates, and recurring tax/insurance deductions.
- **Payroll Runs:** Processes monthly or bi-weekly pay cycles. Disperses salaries, records GL entries, and updates employee balances.
- **Payslips:** Renders printable monthly pay slips detailing earnings, allowances, deductions, and loan repayments.
- **Employee Loans:** Administers advances and loans, with automatic repayment deductions during payroll runs.

### 3.12 Task & Performance Management
![Retail Performance Tasks](./Retail%20Performance%20Tasks.png)

- **General Tasks:** Project and branch task tracker where tasks are created, assigned to staff, and tracked to completion.
- **Retail Performance Tasks:**
  - Connects real-time sales performance to target markers.
  - Features real-time dashboards for tracking employee progress.
  - Includes a floating tracker widget displaying countdowns to the start of scheduled tasks, active goals, and alerts for completed targets.
  - Admins can extend durations, pause, or reassign tasks dynamically.

### 3.13 Financial Reports Hub
Provides automated output of financial statements:
- **Income Statement (P&L):** Displays revenues, cost of goods sold (COGS), operating expenses, and net profit.
- **Balance Sheet:** Summarizes assets, liabilities, and shareholder equity.
- **Trial Balance:** Lists ledger accounts with matching debit/credit columns.
- **Cash Flow Statement:** Explains cash movements from operations, investments, and financing.
- **Consolidated & Branch P&L:** Compares profit and loss sheets across all branches.
- **AR & AP Aging Reports:** Highlights overdue customer invoices and outstanding vendor bills grouped by age brackets.
- **Inventory Valuation:** Reports current stock asset value based on moving average unit costs.

### 3.14 Users Creation & Access Control
![User & Permission Manager](./User%20%26%20Permission%20Manager.png)

Manage employee access through a security dashboard:
- **User Creation:** Accounts can be added with fields for Full Name, Email, Password, Active Branch assignment, and Role.
- **Active vs. Locked Status:** Users can be flagged as "Active" (permitted to log in) or "Locked" (suspended, preventing access immediately).
- **Access Hierarchy (`role_level`):** Roles have numerical hierarchy levels (e.g., Super Admin = 1, Manager = 2, Cashier = 3). Users cannot edit, delete, or change settings for other users of equal or higher authority.
- **View Modes:** Toggle between detailed list view or card grid views.

### 3.15 Granular Permissions Matrix
Roles are configured with precise boolean switches across these module categories:
1. **Dashboard & Analytics:** View Dashboard (`view_dashboard`), View Analytics (`view_analytics`), View Reports (`view_reports`), View Financial Data on Dashboard (`view_dashboard_financials`).
2. **Point of Sale (POS):** Access POS Terminal (`access_pos`), Apply Discounts on Checkout (`apply_discounts`).
3. **Sales:** View Own Sales (`view_sales`), View All Staff Sales (`view_all_sales`), Create Sales (`create_sales`), Reverse/Void Sales (`reverse_sales`).
4. **Products:** View Products (`view_products`), Manage/Edit Products (`manage_products`).
5. **Categories & Brands:** View/Create/Update/Delete Categories, View/Create/Update/Delete Brands.
6. **Inventory & Stock:** View Inventory (`view_inventory`), Manage Inventory (`manage_inventory`), View Stock (`view_stock`), Manage Stock (`manage_stock`), Approve Stock Transfers (`approve_stock_transfers`).
7. **Customers:** View/Create/Update/Delete Customer Profiles.
8. **Users & Roles:** View Users (`view_users`), Manage Users & Roles (`manage_users`).
9. **Suppliers & Vendors:** View/Manage Suppliers, View/Manage Vendors.
10. **Purchase Orders:** View Purchase Orders (`view_purchase_orders`), Manage Purchase Orders (`manage_purchase_orders`).
11. **Invoices & Quotations:** View/Manage Customer Invoices, View/Manage Quotation sheets.
12. **Finance:** View/Manage Payments, View/Manage Expenses, Delete Expenses, View/Manage Bills, View/Manage Bank Settings, View/Manage Budgets, View/Manage Core Accounting General Ledgers.
13. **Promotions & Pricing:** View/Manage Promotions, View/Manage Retail Price Tiers.
14. **Wholesale:** View/Manage Wholesale Orders.
15. **Returns & Refunds:** View/Manage Retail Product Returns.
16. **Receipts:** View Receipts (`view_receipts`), Manage Receipts Config (`manage_receipts`).
17. **HR & Payroll:** Manage Payroll (`manage_payroll`), View/Manage Tasks (`view_tasks`/`manage_tasks`), View/Manage Retail Performance Tasks (`view_performance_tasks`/`manage_performance_tasks`).
18. **Branches:** View Branches (`view_branches`), Manage Branches (`manage_branches`).
19. **Referrers:** View/Manage Referrers (`view_referrers`/`manage_referrers`).
20. **Online Store:** View/Process Online Orders, Verify Order Payments, Update Tracking Info, Manage Change Requests, View/Manage Store Settings & Builder.
21. **Settings & System:** View Settings (`view_settings`), Manage Settings (`manage_settings`), View Activity/Audit Logs (`view_audit_logs`), View Recycle Bin (`view_recycle_bin`), Manage Recycle Bin (`manage_recycle_bin`), Change Password (`change_password`).

### 3.16 Company & Regional Settings
![System Settings & Branding Panels](./System%20Settings%20%26%20Branding%20Panels.png)

Configure settings under the unified Settings dashboard:
- **General Company Details:** Primary fields for Company Name, email, phone, and physical address.
- **Regional Preferences:** Regional timezones (including comprehensive African timezone support) and custom date formats (e.g. `MM/DD/YYYY`, `DD/MM/YYYY`, `YYYY-MM-DD`).
- **Currency Controls:** Select core transaction currencies. Toggle **Smart Currency Decimals** to automatically trim `.00` decimals on printed and displayed totals (e.g. Nigerian Naira ₦1,500.00 prints as ₦1,500, but ₦1,500.50 retains the fractional representation).
- **Tax Configurations:** Standard/Reduced tax rates, Zero-Rated tax exemptions, tax application mode (Exclusive - added on top of checkout prices, or Inclusive - embedded in item pricing), and corporate Tax Identification Number (TIN).

### 3.17 Branding & Accent Customizer
Personalize the application's appearance:
- **Logo Configuration:** Upload company logo using the Cloudinary upload widget. Select logo display rules:
  - *Icon + Text:* Combines the uploaded logo image (or a fallback initials indicator up to 4 characters) with the company name.
  - *Full Logo:* Displays the uploaded logo image directly, hiding the text.
  - *None:* Displays the company name only.
- **Typography:** Choose font families (Inter, Roboto, Poppins, Open Sans, Lato, Montserrat) to style the application.
- **Theme Variables:** Live color pickers let admins set values for:
  - Primary, Secondary, Accent, and Hover colors.
  - Active text, Main content background, and Header/Navbar background overrides.
  - Sidebar background overrides and sidebar name text sizing (small, medium, large).

### 3.18 Receipt Constructor
Design cash register and customer invoice receipts:
- **Pre-Built Layout Templates:** Choose from various design themes (Standard, Modern, Bold, Invoice Pro, Invoice Classic, Detailed, Elegant, Corporate).
- **Dimensions & Output:** Set paper dimensions (A4, A5, A6, or 80mm thermal rolls) and delivery formats (PDF generation, Image download, Auto/Manual print).
- **Receipt Details:** Toggle parameters like showing company logo, sub-heading phone/address, cashier name, barcode scanners, custom footer notes, and terms & conditions.
- **Live Preview Renderer:** An interactive receipt display panel renders real-time invoice proofs using sample checkout details to show layout updates instantly.

### 3.19 Recycle Bin (Soft-Delete Safeguard)
![Recycle Bin Dashboard](./Recycle%20Bin%20Dashboard.png)

Protect system data from accidental deletions:
- **Soft Deletion:** Deleting items from standard page lists moves them to the Recycle Bin. Soft-deleted items are safely stored for **30 days** before permanent removal.
- **Supported Entities:** Supports soft-deleted Products, Customers, Sales, Suppliers, and Purchase Orders.
- **Recovery Actions:**
  - *Restore:* Returns the item to its original active list (supporting individual restores or multi-item bulk selection restores).
  - *Purge:* Permanently deletes the item, removing it from the database entirely.
  - *Empty Bin:* Hard-deletes all soft-deleted items currently in the Recycle Bin.
- **Log Columns:** Displays item name, type badge, deletion timestamp, who performed the deletion, and expiration countdowns.

### 3.20 Activity Audit Logs & Purge Management
Maintain system transparency and database health:
- **Activity logs:** A searchable history recording administrative actions. Captures user, action type, IP address, changed table elements, and timestamps.
- **Purge Management:** Admin tool for clearing out historical database logs before a selected date to save space.

---
