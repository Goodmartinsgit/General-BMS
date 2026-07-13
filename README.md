#  General-BMS (Business Management System)

General-BMS is a comprehensive, multi-branch Enterprise Resource Planning (ERP) and Business Management System designed to handle retail, wholesale, financial, inventory, HR/payroll, and customer relations operations in one unified workspace.

---

##  Key Modules & Features

General-BMS is highly modularized, supporting different layers of commercial operations:

### 1.  Inventory & Catalog Management
*   **Multi-Branch Tracking:** Oversee and control stock across multiple physical branches.
*   **Product Color & Image Management:** Detailed cataloging with color-tagged images, image galleries, and custom display priorities.
*   **Variants & Stock Management:** Handles detailed product options, color-specific stock allocations (`inventory_colors`), stock transfers between branches with search debouncing, and damages tracking.
*   **Categories & Price Tiers:** Hierarchical category structures and multi-level price tier assignments.

### 2.  Point of Sale (POS) & Retail Sales
*   **Active POS System:** Fast checkout terminal for processing walk-in retail sales.
*   **Sales History & Analytics:** Detailed transaction reporting, daily breakdowns, and branch metrics.
*   **Reversals & Cancellations:** Robust administrator controls to reverse retail sales, restore stock counts, and cancel transactions.
*   **Returns:** Return processing system that automatically updates inventory levels and registers cash flow adjustments.

### 3.  Wholesale Operations
*   **Wholesale Order Flow:** Creates wholesale purchase orders, processes invoices, and handles large bulk fulfillments.
*   **Automated Invoicing:** System generates detailed wholesale invoices with auto-computed properties (e.g., `balance_due` as a PostgreSQL-generated column).

### 4.  Cash Flow & Financial Ledger
*   **Tailored Cash Flow System:** Captures payment transactions across cash, POS card payments, and bank transfers.
*   **Bank Channels:** Restricts POS and Bank Transfer payments to verified, configured Bank Channels. Requires admin confirmation to finalize cash flow and change transaction status to `Paid`.
*   **Accounting Core:** Fully-functional Chart of Accounts, Bank Reconciliation, Cost Centers, Budget Allocations, Journal Entries, and Fiscal Period controls.

### 5.  HR & Employee Payroll
*   **Salaries & Profiles:** Configure employee records, active base salaries, and deductions.
*   **Employee Loans:** Tracks advances and active employee loan repayments.
*   **Payroll Run & Payslips:** Executes monthly payroll batches, logs transactions to the general ledger, and generates detailed payslips.

### 6. Retail Performance Tasks
*   **Task Engine:** Configurable employee targets linked directly to real-time sales performance.
*   **Dashboards & Widgets:** Real-time dashboards for staff performance, task progress, and a persistent floating tracking widget with start/end countdown alerts.
*   **Reassignments & Extensions:** Admins can dynamically extend or reassign active performance tasks.

### 7.  Branding & Settings
*   **Dynamic Branding:** Set organization name, logos, and accent themes which dynamically brand frontend screens including public login pages.
*   **Receipt Templates:** Visual constructor to design receipts, supporting output formats like PDF, Image, and manual logs.

### 8.  E-commerce & Storefront Builder
*   **Website Builder:** Visual page constructor for online catalog deployment and store customization.
*   **Online Order Tracker:** Captures incoming website order streams and syncs them with branch inventory levels.

---

##  Architecture & Tech Stack

General-BMS uses a clean three-tier web application architecture:

```
[ Frontend: React/Vite ] <---- REST API (JSON) ----> [ Backend: Node.js/Express ] <----> [ Database: PostgreSQL ]
```

### Frontend
*   **Framework:** React 18 + Vite
*   **Styling:** Tailwind CSS + Vanilla CSS variables + Framer Motion (animations)
*   **Routing:** React Router v7
*   **Icons:** Lucide React
*   **Data Visualization:** Recharts

### Backend
*   **Framework:** Node.js + Express
*   **Database Client:** PostgreSQL (`pg` library) with custom migration runner
*   **Security:** JSON Web Tokens (JWT), bcryptjs, express-rate-limit, Helmet
*   **File Storage:** Multer + Cloudinary
*   **Validation:** Joi

---

##  Project Structure

```
General-BMS/
├── backend/                  # Express API Server
│   ├── database/             # Schema definitions, migrations, and seeds
│   ├── src/
│   │   ├── config/           # Database and Cloudinary configuration
│   │   ├── controllers/      # Route controllers (Request/Response handlers)
│   │   ├── middleware/       # Authentication, authorization, and error handling
│   │   ├── routes/           # Express API endpoints
│   │   ├── services/         # Core business logic
│   │   ├── utils/            # Shared utilities (logger, helpers)
│   │   └── validators/       # Input schemas (Joi)
│   ├── scripts/              # Command-line database setup scripts (batch/shell)
│   └── server.js             # API entrypoint
│
├── doc/                      # Relocated Developer Guides & Project History
│   └── examples/             # Code integration templates
│
├── frontend/                 # Client React Application
│   ├── public/               # Static assets
│   └── src/
│       ├── api/              # API wrapper functions (Axios client)
│       ├── components/       # Reusable React components (Layout, POS, UI)
│       ├── context/          # Context Providers (Branding, Auth, Permissions)
│       ├── hooks/            # Custom hooks
│       ├── pages/            # Application views (Sales, Inventory, Budgets)
│       ├── utils/            # Styling merges and formatters
│       ├── App.jsx           # App routing layout
│       └── main.jsx          # Mount entrypoint
```

---

##  Getting Started

### 1. Clone & Dependencies Installation
```bash
# Clone the repository
git clone <repository-url>
cd General-BMS

# Install Backend Dependencies
cd backend
npm install

# Install Frontend Dependencies
cd ../frontend
npm install
```

### 2. Environment Configuration
Create environment files on both layers:

**Backend Environment Configuration** (`backend/.env`):
```env
PORT=5000
DATABASE_URL=postgresql://<user>:<password>@localhost:5432/<db_name>
JWT_SECRET=your_jwt_signing_key_here
NODE_ENV=development
```

**Frontend Environment Configuration** (`frontend/.env`):
```env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_CLOUDINARY_CLOUD_NAME=your_cloudinary_name
REACT_APP_CLOUDINARY_UPLOAD_PRESET=your_cloudinary_preset
```

### 3. Database Initial Setup & Seed
```bash
# Enter backend folder
cd backend

# Execute schema migration scripts
npm run migrate:all

# Seed database with initial permissions, admin user, and sample data
npm run seed
```

### 4. Running the Development Servers

**Terminal 1 (Backend API):**
```bash
cd backend
npm run dev
```

**Terminal 2 (Frontend Client):**
```bash
cd frontend
npm run dev
```

The frontend application will boot at `http://localhost:5173`. The backend services route through `http://localhost:5000/api`.

---

##  Historical & System Documentation Index

All historical implementation logs, guides, and plans have been cleaned up and moved to the `/doc` directory. Below is an index of the documents:

###  Developer & Testing Resources
*   [DEVELOPER_GUIDE.md](file:///c:/Users/DELL%20XPS/Desktop/BMS/General-BMS/doc/DEVELOPER_GUIDE.md) - Deep dive guide detailing codebase layouts, architecture, component creation workflows, and style structures.
*   [TESTING_GUIDE.md](file:///c:/Users/DELL%20XPS/Desktop/BMS/General-BMS/doc/TESTING_GUIDE.md) - Explains testing layout and scripts.
*   [QUICK_REFERENCE.md](file:///c:/Users/DELL%20XPS/Desktop/BMS/General-BMS/doc/QUICK_REFERENCE.md) - Technical quick-reference for Product Color & Image helpers, endpoints, and database tables.
*   [SYSTEM_DIAGRAM.md](file:///c:/Users/DELL%20XPS/Desktop/BMS/General-BMS/doc/SYSTEM_DIAGRAM.md) - Entity Relationship (ER) diagrams and data structures for the database.
*   [STORE_INTEGRATION_EXAMPLE.jsx](file:///c:/Users/DELL%20XPS/Desktop/BMS/General-BMS/doc/examples/STORE_INTEGRATION_EXAMPLE.jsx) - Code example showing integration between store page frontend and color-tagged stock APIs.

###  Feature Implementations & Specs
*   [PRODUCT_COLOR_IMAGE_GUIDE.md](file:///c:/Users/DELL%20XPS/Desktop/BMS/General-BMS/doc/PRODUCT_COLOR_IMAGE_GUIDE.md) - Detailed explanation of how the color and image systems function.
*   [COLOR_IMAGE_MANAGEMENT_README.md](file:///c:/Users/DELL%20XPS/Desktop/BMS/General-BMS/doc/COLOR_IMAGE_MANAGEMENT_README.md) - Full reference for table models, API routes, and components managing color stock.
*   [PROMOTIONS_GUIDE.md](file:///c:/Users/DELL%20XPS/Desktop/BMS/General-BMS/doc/PROMOTIONS_GUIDE.md) - Details rules and components for the marketing promotions system.
*   [ECOMMERCE_INTEGRATION_PLAN.md](file:///c:/Users/DELL%20XPS/Desktop/BMS/General-BMS/doc/ECOMMERCE_INTEGRATION_PLAN.md) - Comprehensive blueprint for e-commerce website integration.
*   [OWASP_AUDIT_PLAN.md](file:///c:/Users/DELL%20XPS/Desktop/BMS/General-BMS/doc/OWASP_AUDIT_PLAN.md) - Architectural review and action plan regarding OWASP security standards.
*   [CATEGORY_DUPLICATE_FIX.md](file:///c:/Users/DELL%20XPS/Desktop/BMS/General-BMS/doc/CATEGORY_DUPLICATE_FIX.md) - Diagnostic report resolving duplicate category slug issues.

###  Responsive Adaptations
*   [MOBILE_RESPONSIVE_GUIDE.md](file:///c:/Users/DELL%20XPS/Desktop/BMS/General-BMS/doc/MOBILE_RESPONSIVE_GUIDE.md) - Developer guidelines for Tailwind layout styling on responsive components.
*   [MOBILE_RESPONSIVE_COMPLETE.md](file:///c:/Users/DELL%20XPS/Desktop/BMS/General-BMS/doc/MOBILE_RESPONSIVE_COMPLETE.md) / [MOBILE_RESPONSIVE_SUMMARY.md](file:///c:/Users/DELL%20XPS/Desktop/BMS/General-BMS/doc/MOBILE_RESPONSIVE_SUMMARY.md) / [MOBILE_RESPONSIVE_IMPLEMENTATION_FINAL.md](file:///c:/Users/DELL%20XPS/Desktop/BMS/General-BMS/doc/MOBILE_RESPONSIVE_IMPLEMENTATION_FINAL.md) / [MOBILE_RESPONSIVE_PROGRESS.md](file:///c:/Users/DELL%20XPS/Desktop/BMS/General-BMS/doc/MOBILE_RESPONSIVE_PROGRESS.md) - Multi-phase documents tracking progress of making pages fully responsive.

###  Trackers, Plans & Historical Logs
*   [TASK_TRACKER.md](file:///c:/Users/DELL%20XPS/Desktop/BMS/General-BMS/doc/TASK_TRACKER.md) / [REVISED_TASK_TRACKER.md](file:///c:/Users/DELL%20XPS/Desktop/BMS/General-BMS/doc/REVISED_TASK_TRACKER.md) - Logs listing planned tasks, priorities, and schedules.
*   [IMPLEMENTATION_PLAN.md](file:///c:/Users/DELL%20XPS/Desktop/BMS/General-BMS/doc/IMPLEMENTATION_PLAN.md) / [IMPLEMENTATION_PLAN_REMAINING.md](file:///c:/Users/DELL%20XPS/Desktop/BMS/General-BMS/doc/IMPLEMENTATION_PLAN_REMAINING.md) - Historical system architectural implementation schedules.
*   [IMPLEMENTATION_PROGRESS.md](file:///c:/Users/DELL%20XPS/Desktop/BMS/General-BMS/doc/IMPLEMENTATION_PROGRESS.md) / [IMPLEMENTATION_ROADMAP_FINAL.md](file:///c:/Users/DELL%20XPS/Desktop/BMS/General-BMS/doc/IMPLEMENTATION_ROADMAP_FINAL.md) - Roadmap tracks and build sequences.
*   [IMPLEMENTATION_SUMMARY.md](file:///c:/Users/DELL%20XPS/Desktop/BMS/General-BMS/doc/IMPLEMENTATION_SUMMARY.md) / [COMPLETED_WORK_SUMMARY.md](file:///c:/Users/DELL%20XPS/Desktop/BMS/General-BMS/doc/COMPLETED_WORK_SUMMARY.md) - Sessions summary logs.
*   [DATABASE_FIX_SUMMARY.md](file:///c:/Users/DELL%20XPS/Desktop/BMS/General-BMS/doc/DATABASE_FIX_SUMMARY.md) - Summary describing PostgreSQL database setup and fixes.
*   [DEPLOYMENT_CHECKLIST.md](file:///c:/Users/DELL%20XPS/Desktop/BMS/General-BMS/doc/DEPLOYMENT_CHECKLIST.md) - Environment validation, checklists, and procedures for staging/production builds.
*   [SESSION_PROGRESS.md](file:///c:/Users/DELL%20XPS/Desktop/BMS/General-BMS/doc/SESSION_PROGRESS.md) / [UPDATED_IMPLEMENTATION_STATUS.md](file:///c:/Users/DELL%20XPS/Desktop/BMS/General-BMS/doc/UPDATED_IMPLEMENTATION_STATUS.md) / [last implementation.md](file:///c:/Users/DELL%20XPS/Desktop/BMS/General-BMS/doc/last_implementation.md) - Session logs outlining recent database and backend module improvements.
