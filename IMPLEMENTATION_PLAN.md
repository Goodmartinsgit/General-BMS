# Implementation Plan: Upgrade General-BMS with Eldaved-BMS Retail Features

## Executive Summary

This plan outlines the comprehensive upgrade of General-BMS to include all features from the Eldaved-BMS retail module with a modern, sophisticated interface. The General-BMS project currently has ~80% of basic retail features implemented. This upgrade will add advanced features, multi-branch architecture, tile calculator, enhanced UI components, and modern design patterns.

## Current State Analysis

### General-BMS Strengths
- Solid React + Vite + Tailwind CSS foundation
- PostgreSQL database with UUID-based design
- Basic POS system with cart, payments, tax calculation
- Referrer/agent commission system (implemented in code)
- Performance task tracking (implemented in code)
- Quotation system (implemented in code)
- Bank channels and cash flow (implemented in code)
- JWT authentication with RBAC

### General-BMS Gaps
1. **Database Schema**: Missing tables for features already in code (quotations, referrers, bank_channels, cash_flows, retail_performance_tasks)
2. **Product Management**: Incomplete UI (no product creation/edit modal)
3. **Multi-branch**: Limited branch inventory architecture
4. **Categories**: Single category system vs. multiple (brands, sizes, use cases, tile types)
5. **UI Components**: Basic view modes, missing autocomplete components
6. **Image Upload**: No Cloudinary integration
7. **Advanced Sales**: No reverse/unreverse, no comments, limited receipt options
8. **Stock Management**: No transfers or damages tracking
9. **Search**: Basic search vs. full-text search with tsvector
10. **Reports**: Limited analytics and reporting

### Eldaved-BMS Unique Features to Adopt
1. ✨ **Tile Calculator Tool** - Room dimension calculator with quotations
2. ✨ **Multi-Branch Inventory** - Branch-level stock with transfers
3. ✨ **Product Types System** - Tiles vs. Accessories with type-specific categories
4. ✨ **Advanced Performance Tasks** - Pause/resume, reassign, extend, live tracking
5. ✨ **Recycle Bin** - Soft delete recovery system
6. ✨ **Receipt Customization** - PDF, email, WhatsApp delivery
7. ✨ **Stock Transfers & Damages** - Inter-branch transfers and damage recording
8. ✨ **Multiple View Modes** - Grid, list, compact, detailed views
9. ✨ **Demo Mode** - Blurred values for demonstrations
10. ✨ **Branch Analytics** - Branch-level dashboards and P&L

## Implementation Approach

### Phase 1: Database Schema Enhancement
**Priority**: CRITICAL (foundation for all other work)

#### 1.1 Add Missing Tables
Create migration script to add:
- `tile_calculator_configs` - Calculator settings per product
- `tile_calculations` - Saved calculations
- `stock_transfers` - Inter-branch stock transfers
- `stock_transfer_items` - Transfer line items
- `stock_damages` - Damage records
- `receipt_config` - Receipt customization settings
- `sale_comments` - Comments on sales with attachments
- `recycle_bin` - Soft delete recovery
- `deletion_audit_trail` - Deletion tracking
- `purge_logs` - Data purge history

#### 1.2 Enhance Existing Tables
Modify existing tables:
- **products**: Add `product_type` (tile/accessory), `tile_type_id`, `size_id`, `use_case_id`, `search_vector` (tsvector), `commission_amount`, `model_images`, `calculator_enabled`
- **branches**: Add `main_branch` flag, `is_warehouse`
- **branch_inventory**: Add `branch_price_override`, `last_counted_at`
- **sales**: Add `reversed_at`, `reversed_by`, `reversal_reason`, `reversal_note`, `unreversed_at`, `cost_total`, `profit_total`
- **customers**: Add `customer_code` (auto-generated CUS-00001), `business_name`, `business_type`
- **retail_performance_tasks**: Add `pause_count`, `pause_history` (JSONB), `extended_count`, `early_end_reason`

#### 1.3 Create New Category Tables
- `sizes` - Tile sizes with calculator dimensions (length_mm, width_mm, coverage_per_carton)
- `use_cases` - Product use cases (e.g., floor, wall, outdoor)
- `tile_types` - Tile type classifications (ceramic, porcelain, etc.)
- `optional_categories` - Additional flexible categorization
- `product_optional_categories` - Pivot table for optional categories
- `accessory_categories` - Accessory-specific categories
- `accessory_attributes` - Accessory attribute definitions

**Critical Files**:
- `backend/database/migrations/add_eldaved_features.sql`
- `backend/database/schema.sql` (update master schema)

---

### Phase 2: Backend API Development
**Priority**: HIGH (enables frontend development)

#### 2.1 Product Management APIs
Enhance `backend/src/controllers/productController.js`:
- ✅ Update product creation to handle product_type (tile/accessory)
- ✅ Add product code auto-generation (TILE-001, ACC-001)
- ✅ Implement full-text search with tsvector
- ✅ Add product statistics endpoint
- ✅ Implement product activation/deactivation
- ✅ Add featured products endpoint
- ✅ Implement multiple view mode support (query param)
- ✅ Add low stock filtering
- ✅ Support branch stock allocation on product creation

Create new route: `backend/src/routes/productCategoryRoutes.js`:
- CRUD for sizes, use_cases, tile_types, optional_categories
- CRUD for accessory_categories, accessory_attributes
- Quick-add endpoints for inline category creation

#### 2.2 Calculator APIs
Create new controller: `backend/src/controllers/calculatorController.js`:
- `POST /api/calculator/config` - Create/update calculator config
- `GET /api/calculator/products` - Get calculator-enabled products
- `POST /api/calculator/calculate` - Perform single-size calculation
- `POST /api/calculator/calculate-multi` - Multi-size calculation
- `GET /api/calculator/history` - Calculation history with filters
- `POST /api/calculator/:id/convert-to-sale` - Convert to sale
- `PATCH /api/calculator/:id/address` - Update customer/address
- `GET /api/calculator/statistics` - Calculator usage stats

Create route: `backend/src/routes/calculatorRoutes.js`

Business logic:
```javascript
// Calculation formula
const roomArea = (length * width) / 1000000; // Convert mm² to m²
const areaWithWastage = roomArea * (1 + wastagePercentage / 100);
const cartonsNeeded = Math.ceil(areaWithWastage / coveragePerCarton);
const totalCost = (cartonsNeeded * productPrice) + installationCost;
```

#### 2.3 Enhanced Sales APIs
Enhance `backend/src/controllers/salesController.js`:
- `POST /api/sales/:id/reverse` - Cancel/reverse sale with stock restoration
- `POST /api/sales/:id/unreverse` - Reactivate cancelled sale
- `POST /api/sales/:id/comments` - Add comment with file attachments
- `GET /api/sales/:id/comments` - Get sale comments
- Update sale creation to calculate cost_total and profit_total
- Add cancelled sales report endpoint

#### 2.4 Stock Management APIs
Create `backend/src/controllers/stockController.js`:
- `POST /api/stock-transfers` - Create transfer between branches
- `GET /api/stock-transfers` - List transfers with filters
- `GET /api/stock-transfers/:id` - Transfer details
- `PUT /api/stock-transfers/:id` - Update transfer status (pending → approved → completed)
- `POST /api/stock-damages` - Record damaged stock
- `GET /api/stock-damages` - List damages
- `GET /api/stock-activities` - Complete stock activity log

Create route: `backend/src/routes/stockRoutes.js`

#### 2.5 Receipt Management APIs
Create `backend/src/controllers/receiptController.js`:
- `GET /api/receipts/:saleId/generate` - Generate PDF receipt (use pdfkit or puppeteer)
- `POST /api/receipts/:saleId/email` - Email receipt to customer
- `POST /api/receipts/:saleId/whatsapp` - Send via WhatsApp (Green API integration)
- `GET /api/receipts/config` - Get receipt customization settings
- `PUT /api/receipts/config` - Update receipt branding

Create route: `backend/src/routes/receiptRoutes.js`

Use libraries: `pdfkit` or `puppeteer` for PDF generation

#### 2.6 Enhanced Performance Task APIs
Enhance `backend/src/controllers/retailPerformanceTaskController.js`:
- `POST /api/retail-performance-tasks/:id/pause` - Pause active task
- `POST /api/retail-performance-tasks/:id/resume` - Resume paused task
- `POST /api/retail-performance-tasks/:id/extend` - Extend deadline
- `POST /api/retail-performance-tasks/:id/end` - End task early with reason
- `POST /api/retail-performance-tasks/:id/reassign` - Reassign to different user
- `GET /api/retail-performance-tasks/:id/statistics` - Detailed task stats
- Implement auto-activation on scheduled start time
- Implement auto-completion on target achievement

#### 2.7 Recycle Bin APIs
Create `backend/src/controllers/recycleBinController.js`:
- `GET /api/recycle-bin` - List all soft-deleted items across entities
- `POST /api/recycle-bin/:entity/:id/restore` - Restore deleted item
- `DELETE /api/recycle-bin/:entity/:id` - Permanent delete (purge)
- `POST /api/purge` - Trigger scheduled purge of old deleted items

Create route: `backend/src/routes/recycleBinRoutes.js`

#### 2.8 Branch Analytics APIs
Enhance `backend/src/controllers/branchController.js`:
- `GET /api/branches/:id/analytics` - Branch performance dashboard
- `GET /api/branches/:id/inventory-report` - Branch inventory valuation
- `GET /api/branches/:id/sales-report` - Branch sales report
- `GET /api/branches/comparison` - Cross-branch comparison
- `GET /api/branches/:id/pl-report` - Branch P&L report

**Critical Files**:
- `backend/src/controllers/` - All controller files
- `backend/src/routes/` - All route files
- `backend/src/services/` - Business logic services

---

### Phase 3: Modern UI Component Library
**Priority**: HIGH (reusable components for all features)

#### 3.1 Core UI Components
Create `frontend/src/components/ui/`:

1. **ViewModeToggle.jsx** - Toggle between grid/list/compact/detailed views
2. **DataTable.jsx** - Enhanced table with sorting, filtering, pagination
3. **SearchBar.jsx** - Debounced search with clear button
4. **FilterPanel.jsx** - Advanced filtering component
5. **Autocomplete.jsx** - Generic autocomplete base component
6. **Modal.jsx** - Enhanced modal with animations
7. **ConfirmDialog.jsx** - Confirmation modal component
8. **LoadingSpinner.jsx** - Modern loading states
9. **EmptyState.jsx** - Beautiful empty state illustrations
10. **Toast.jsx** - Notification toast component (use react-toastify)
11. **StatCard.jsx** - Statistics card with trend indicators
12. **Badge.jsx** - Status badges with color variants
13. **Dropdown.jsx** - Dropdown menu component
14. **Tabs.jsx** - Tab navigation component
15. **ProgressBar.jsx** - Progress bar with animations

**Design System**:
```javascript
// Color Palette (Tailwind config)
colors: {
  primary: {
    50: '#eff6ff',
    500: '#3b82f6',
    600: '#2563eb',
    700: '#1d4ed8',
  },
  success: { 500: '#10b981' },
  warning: { 500: '#f59e0b' },
  danger: { 500: '#ef4444' },
  gray: { /* Tailwind default */ }
}

// Typography
- Headers: font-bold text-2xl tracking-tight
- Subheaders: font-semibold text-lg
- Body: text-sm text-gray-700
- Captions: text-xs text-gray-500

// Spacing
- Cards: p-6 rounded-lg shadow-sm
- Gaps: gap-4 (16px) for layouts
- Margins: mb-6 between sections

// Animations
- Transitions: transition-all duration-200
- Hover: hover:shadow-lg hover:scale-105
- Loading: animate-pulse, animate-spin
```

#### 3.2 Specialized Components
Create domain-specific components:

**Product Components** (`frontend/src/components/product/`):
1. **ProductCard.jsx** - Product display card (grid view)
2. **ProductListItem.jsx** - Product list row (list view)
3. **ProductCompactItem.jsx** - Compact view item
4. **ProductDetailView.jsx** - Detailed product view
5. **ProductFormModal.jsx** - Product creation/edit modal
6. **ProductImageUpload.jsx** - Cloudinary image upload component
7. **ProductCategorySelector.jsx** - Multi-category selector
8. **ProductSelector.jsx** - Product picker for sales/calculator
9. **LowStockBadge.jsx** - Low stock indicator
10. **FeaturedBadge.jsx** - Featured product badge

**Sales Components** (`frontend/src/components/sales/`):
1. **SaleCard.jsx** - Sale summary card
2. **SaleDetailModal.jsx** - Enhanced sale detail view
3. **SaleCommentForm.jsx** - Add comments to sales
4. **SaleCommentList.jsx** - Display sale comments
5. **ReverseSaleModal.jsx** - Cancel/reverse sale modal
6. **CustomerAutocomplete.jsx** - Customer search autocomplete
7. **ReferrerAutocomplete.jsx** - Referrer search autocomplete
8. **PaymentMethodSelector.jsx** - Payment method picker
9. **ReceiptPreviewModal.jsx** - Receipt preview before sending
10. **ReceiptDeliveryModal.jsx** - Choose delivery method (PDF/email/WhatsApp)

**Calculator Components** (`frontend/src/components/calculator/`):
1. **CalculatorConfigForm.jsx** - Configure product for calculator
2. **CalculatorInterface.jsx** - Main calculator UI
3. **RoomDimensionInput.jsx** - Room size input component
4. **CalculationResults.jsx** - Display calculation results
5. **CalculationHistory.jsx** - Past calculations list
6. **MultiSizeCalculator.jsx** - Multiple tile size calculator
7. **QuotationGenerator.jsx** - Generate quotation from calculation
8. **CalculationCard.jsx** - Saved calculation card

**Performance Task Components** (`frontend/src/components/performance/`):
1. **PerformanceTaskCard.jsx** - Enhanced task card with countdown
2. **CreateTaskModal.jsx** - Task creation modal
3. **TaskDetailView.jsx** - Detailed task statistics
4. **TaskProgressBar.jsx** - Live progress bar
5. **CountdownTimer.jsx** - Countdown timer component
6. **FloatingTaskWidget.jsx** - Floating task notification panel
7. **PauseTaskModal.jsx** - Pause task with reason
8. **ExtendTaskModal.jsx** - Extend task deadline
9. **ReassignTaskModal.jsx** - Reassign task to user
10. **TaskStatisticsChart.jsx** - Task performance charts

**Branch Components** (`frontend/src/components/branch/`):
1. **BranchSelector.jsx** - Branch selection dropdown
2. **BranchCard.jsx** - Branch info card
3. **BranchInventoryTable.jsx** - Branch stock table
4. **StockTransferForm.jsx** - Create stock transfer
5. **StockTransferCard.jsx** - Transfer status card
6. **BranchAnalyticsDashboard.jsx** - Branch performance dashboard
7. **BranchComparisonChart.jsx** - Multi-branch comparison

**Stock Components** (`frontend/src/components/stock/`):
1. **StockActivityLog.jsx** - Stock movement history
2. **StockDamageForm.jsx** - Record damage
3. **StockLevelIndicator.jsx** - Visual stock level (low/medium/high)

**Recycle Bin Components** (`frontend/src/components/recycle/`):
1. **RecycleBinTable.jsx** - Deleted items table
2. **RestoreConfirmModal.jsx** - Confirm restore
3. **PurgeConfirmModal.jsx** - Confirm permanent delete

#### 3.3 Layout Enhancements
Update `frontend/src/components/Layout.jsx`:
- Add demo mode toggle (blur financial values)
- Add branch context selector in header
- Improve navigation with icons and tooltips
- Add notifications dropdown
- Responsive mobile menu

**Critical Files**:
- `frontend/src/components/ui/` - All UI components
- `frontend/src/components/product/` - Product components
- `frontend/src/components/sales/` - Sales components
- `frontend/src/components/calculator/` - Calculator components
- `frontend/src/components/performance/` - Performance components
- `frontend/src/components/branch/` - Branch components
- `frontend/tailwind.config.js` - Design system configuration

---

### Phase 4: Feature Implementation
**Priority**: MEDIUM (build features using components)

#### 4.1 Enhanced Product Management
Create/Update pages:

**`frontend/src/pages/ProductCatalog.jsx`**:
- View mode toggle (grid/list/compact/detailed)
- Advanced filters (brand, size, type, price range, stock status, featured)
- Full-text search
- Product creation modal (ProductFormModal)
- Product edit modal
- Product activation/deactivation
- Low stock highlighting
- Featured products section
- Export to CSV
- Import from CSV

**`frontend/src/pages/ProductDetail.jsx`**:
- Complete product information
- Image gallery with Cloudinary
- Stock levels by branch
- Sales history
- Edit button
- Delete button (soft delete)
- Calculator configuration section (if tile)

**`frontend/src/pages/CategoryManagement.jsx`**:
- Tabs for each category type (brands, sizes, use cases, tile types, optional categories)
- CRUD operations for each
- Quick-add modals
- Category statistics

**New API Integration**:
- Cloudinary SDK for image upload: `npm install cloudinary`
- Configure Cloudinary in `backend/src/config/cloudinary.js`
- Create multer middleware for multi-image upload
- Return Cloudinary URLs in product response

#### 4.2 Tile Calculator Feature
Create new pages:

**`frontend/src/pages/Calculator.jsx`**:
- Product selector (tiles only, calculator-enabled)
- Room dimension inputs
- Single-size calculation
- Multi-size calculation tab
- Calculation results display
- Save calculation button
- Convert to sale button
- Convert to quotation button
- Customer/address tracking

**`frontend/src/pages/CalculatorHistory.jsx`**:
- List all saved calculations
- Filter by date range, customer, product
- View calculation details
- Convert to sale
- Send quotation via WhatsApp
- Delete calculations

**`frontend/src/pages/CalculatorConfig.jsx`** (Admin only):
- List calculator-enabled products
- Configure calculator settings per product
- Enable/disable calculator for products
- Update tile dimensions and coverage

#### 4.3 Enhanced Sales Features
Update `frontend/src/pages/POS.jsx`:
- Add product view mode toggle
- Integrate CustomerAutocomplete
- Integrate ReferrerAutocomplete
- Add sale notes field
- Improve cart UI with animations
- Add calculator quick-launch button

Create `frontend/src/pages/SaleDetail.jsx`:
- Complete sale information
- Sale items table
- Payment details
- Customer info
- Comments section (add/view comments)
- Action buttons:
  - Reverse sale (if not reversed)
  - Unreverse sale (if reversed)
  - Print receipt
  - Email receipt
  - WhatsApp receipt
  - Add comment
  - Edit sale (admin only)

Update `frontend/src/pages/SalesHistory.jsx`:
- Add reversed sales filter
- Show reversal status badge
- Add cancelled sales tab
- Export to Excel

#### 4.4 Stock Management Features
Create new pages:

**`frontend/src/pages/StockTransfers.jsx`**:
- Create transfer button
- Transfers list (pending, approved, completed)
- Transfer status badges
- Filter by branch, status, date
- Transfer detail view

**`frontend/src/pages/StockDamages.jsx`**:
- Record damage button
- Damages list
- Filter by branch, product, date
- Damage detail view

**`frontend/src/pages/StockActivity.jsx`**:
- Complete stock movement log
- Filter by product, branch, movement type
- Export to CSV

#### 4.5 Receipt Management
Create `frontend/src/pages/ReceiptConfig.jsx` (Admin only):
- Upload business logo
- Configure business details
- Set receipt template
- Preview receipt
- Save configuration

Integrate receipt delivery in SaleDetail page:
- Generate PDF receipt on-demand
- Email receipt with customer email
- WhatsApp receipt via Green API
- Download PDF button

#### 4.6 Enhanced Performance Tasks
Update `frontend/src/pages/PerformanceTasks.jsx`:
- Tabs: Active Tasks | Inactive Tasks | My Tasks
- Enhanced task cards with:
  - Countdown timer
  - Progress bar
  - Pause/resume button
  - Extend button
  - End early button
  - Reassign button (admin)
  - Task statistics
- Floating task widget (always visible for active user tasks)

Create `frontend/src/pages/TaskDetail.jsx`:
- Complete task information
- Progress chart
- Sales linked to task
- Pause history
- Extension history
- Reassignment history

#### 4.7 Recycle Bin
Create `frontend/src/pages/RecycleBin.jsx`:
- Tabs for each entity type (products, sales, customers, etc.)
- Deleted items table
- Restore button
- Permanent delete button
- Deletion date and user
- Deletion reason
- Auto-purge settings (admin)

#### 4.8 Branch Management
Update `frontend/src/pages/BranchManagement.jsx`:
- Branch cards with statistics
- Main branch designation
- Branch inventory view
- Branch analytics button

Create `frontend/src/pages/BranchAnalytics.jsx`:
- Branch performance dashboard
- Sales metrics
- Inventory valuation
- Top products
- Staff performance
- Comparison with other branches
- P&L report

**Critical Files**:
- `frontend/src/pages/` - All page files
- `frontend/src/api/` - API client functions

---

### Phase 5: Advanced Features & Polish
**Priority**: LOW (nice-to-have features)

#### 5.1 Demo Mode
Create context: `frontend/src/context/DemoContext.jsx`:
- Demo mode state
- Toggle demo mode
- Blur financial values component

Create component: `frontend/src/components/BlurredValue.jsx`:
- Show blurred text when demo mode is on
- Click to reveal temporarily

#### 5.2 Enhanced Analytics
Create `frontend/src/pages/Analytics.jsx`:
- Sales analytics dashboard
- Inventory analytics
- Customer analytics
- Product performance
- Branch comparison
- Commission summary
- Profit analysis
- Interactive charts (Recharts)

#### 5.3 Fiscal Period Integration
Create fiscal period tables:
- `fiscal_periods` - Define fiscal periods
- Link reports to fiscal periods
- Period-based filtering

#### 5.4 Advanced Reports
Create `frontend/src/pages/Reports.jsx`:
- Report templates
- Custom report builder
- Export to Excel/PDF
- Scheduled reports
- Report history

#### 5.5 Mobile Optimization
- Responsive layouts for all pages
- Mobile-friendly POS interface
- Touch-optimized components
- Mobile navigation

#### 5.6 Performance Optimizations
- Implement pagination for all lists
- Add lazy loading for images
- Optimize API queries with indexes
- Add caching (Redis) for frequently accessed data
- Code splitting for routes
- Debounce search inputs
- Virtualized lists for large datasets

#### 5.7 Notifications & Alerts
- Real-time notifications using WebSockets or polling
- Low stock alerts
- Task deadline alerts
- Payment reminders
- Customer birthday notifications

**Critical Files**:
- `frontend/src/context/DemoContext.jsx`
- `frontend/src/pages/Analytics.jsx`
- `frontend/src/pages/Reports.jsx`

---

### Phase 6: Testing & Documentation
**Priority**: MEDIUM (ensure quality)

#### 6.1 Testing
- Unit tests for business logic (Jest)
- Integration tests for API endpoints (Supertest)
- Component tests (React Testing Library)
- E2E tests for critical flows (Playwright)
- Manual testing checklist

#### 6.2 Documentation
- API documentation (Swagger/OpenAPI)
- User manual
- Admin guide
- Developer guide
- Database schema documentation
- Deployment guide

#### 6.3 Data Migration
- Create seed data for new tables
- Migration scripts for existing data
- Backup procedures

---

## Critical Files Summary

### Database Files
- `backend/database/migrations/add_eldaved_features.sql` - New tables
- `backend/database/schema.sql` - Updated master schema
- `backend/database/seeds/` - Seed data for new tables

### Backend Files
**Controllers** (12 files):
- `backend/src/controllers/productController.js` - Enhanced
- `backend/src/controllers/calculatorController.js` - NEW
- `backend/src/controllers/salesController.js` - Enhanced
- `backend/src/controllers/stockController.js` - NEW
- `backend/src/controllers/receiptController.js` - NEW
- `backend/src/controllers/retailPerformanceTaskController.js` - Enhanced
- `backend/src/controllers/recycleBinController.js` - NEW
- `backend/src/controllers/branchController.js` - Enhanced
- `backend/src/controllers/categoryController.js` - NEW

**Routes** (9 files):
- `backend/src/routes/productRoutes.js` - Enhanced
- `backend/src/routes/productCategoryRoutes.js` - NEW
- `backend/src/routes/calculatorRoutes.js` - NEW
- `backend/src/routes/salesRoutes.js` - Enhanced
- `backend/src/routes/stockRoutes.js` - NEW
- `backend/src/routes/receiptRoutes.js` - NEW
- `backend/src/routes/recycleBinRoutes.js` - NEW
- `backend/src/routes/branchRoutes.js` - Enhanced

**Services** (business logic):
- `backend/src/services/calculatorService.js` - NEW
- `backend/src/services/receiptService.js` - NEW
- `backend/src/services/stockService.js` - NEW

**Config**:
- `backend/src/config/cloudinary.js` - NEW

### Frontend Files
**Components** (~60 files):
- `frontend/src/components/ui/` - 15 UI components
- `frontend/src/components/product/` - 10 product components
- `frontend/src/components/sales/` - 10 sales components
- `frontend/src/components/calculator/` - 8 calculator components
- `frontend/src/components/performance/` - 10 performance components
- `frontend/src/components/branch/` - 7 branch components
- `frontend/src/components/stock/` - 3 stock components
- `frontend/src/components/recycle/` - 2 recycle components

**Pages** (~15 files):
- `frontend/src/pages/ProductCatalog.jsx` - Enhanced
- `frontend/src/pages/ProductDetail.jsx` - NEW
- `frontend/src/pages/CategoryManagement.jsx` - NEW
- `frontend/src/pages/Calculator.jsx` - NEW
- `frontend/src/pages/CalculatorHistory.jsx` - NEW
- `frontend/src/pages/CalculatorConfig.jsx` - NEW
- `frontend/src/pages/SaleDetail.jsx` - NEW
- `frontend/src/pages/StockTransfers.jsx` - NEW
- `frontend/src/pages/StockDamages.jsx` - NEW
- `frontend/src/pages/StockActivity.jsx` - NEW
- `frontend/src/pages/ReceiptConfig.jsx` - NEW
- `frontend/src/pages/BranchAnalytics.jsx` - NEW
- `frontend/src/pages/RecycleBin.jsx` - NEW
- `frontend/src/pages/Analytics.jsx` - NEW

**API Client**:
- `frontend/src/api/products.js` - Enhanced
- `frontend/src/api/calculator.js` - NEW
- `frontend/src/api/sales.js` - Enhanced
- `frontend/src/api/stock.js` - NEW
- `frontend/src/api/receipts.js` - NEW
- `frontend/src/api/categories.js` - NEW
- `frontend/src/api/recycleBin.js` - NEW

**Context**:
- `frontend/src/context/DemoContext.jsx` - NEW
- `frontend/src/context/BranchContext.jsx` - NEW (for multi-branch)

**Utilities**:
- `frontend/src/utils/calculations.js` - Calculator helpers
- `frontend/src/utils/formatters.js` - Number/date formatters

---

## UI/UX Design Guidelines

### Modern Design Principles
1. **Glassmorphism**: Use backdrop-blur and transparency for cards
2. **Micro-interactions**: Button hover states, loading animations
3. **Color Gradients**: Use subtle gradients for headers and CTAs
4. **White Space**: Generous padding and margins
5. **Typography**: Bold headings, clear hierarchy
6. **Icons**: Lucide React icons throughout
7. **Animations**: Smooth transitions (transition-all duration-200)
8. **Responsive**: Mobile-first approach
9. **Accessibility**: ARIA labels, keyboard navigation
10. **Dark Mode**: Optional dark theme (future enhancement)

### Component Design Patterns
```jsx
// Card Component Example
<div className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-shadow p-6 border border-gray-100">
  <div className="flex items-center justify-between mb-4">
    <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
    <Badge status={status} />
  </div>
  <div className="space-y-3">
    {children}
  </div>
</div>

// Button Component Example
<button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200 flex items-center gap-2">
  <Icon className="w-4 h-4" />
  <span>{label}</span>
</button>

// Input Component Example
<div className="space-y-1">
  <label className="text-sm font-medium text-gray-700">{label}</label>
  <input
    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
    {...props}
  />
</div>
```

### View Modes Design
- **Grid View**: 3-4 column grid, card-based, images prominent
- **List View**: Table-like, compact, sortable columns
- **Compact View**: Dense layout, minimal information, quick scanning
- **Detailed View**: Expanded cards with all information visible

---

## Verification & Testing Plan

### End-to-End Testing Scenarios

#### 1. Product Management
- [ ] Create tile product with images and categories
- [ ] Create accessory product
- [ ] Enable calculator for tile
- [ ] Search products using full-text search
- [ ] Filter products by brand, size, type
- [ ] Switch view modes (grid/list/compact/detailed)
- [ ] Activate/deactivate product
- [ ] Delete product (soft delete)
- [ ] Restore product from recycle bin

#### 2. Calculator Feature
- [ ] Configure calculator for a tile product
- [ ] Perform single-size calculation
- [ ] Perform multi-size calculation
- [ ] Save calculation with customer info
- [ ] Convert calculation to sale
- [ ] Generate quotation from calculation
- [ ] Send quotation via WhatsApp

#### 3. Sales Operations
- [ ] Create sale with multiple items
- [ ] Apply discount
- [ ] Select customer (autocomplete)
- [ ] Select referrer (autocomplete)
- [ ] Record payment (cash/card/mixed)
- [ ] Generate receipt PDF
- [ ] Email receipt to customer
- [ ] WhatsApp receipt to customer
- [ ] Add comment to sale
- [ ] Reverse/cancel sale (verify stock restoration)
- [ ] Unreverse sale

#### 4. Stock Management
- [ ] Create stock transfer between branches
- [ ] Approve stock transfer
- [ ] Complete stock transfer (verify stock updates)
- [ ] Record stock damage
- [ ] View stock activity log

#### 5. Performance Tasks
- [ ] Create performance task
- [ ] Assign task to user
- [ ] Verify task auto-activation at scheduled time
- [ ] Make sale that counts toward task
- [ ] Verify progress update
- [ ] Pause task
- [ ] Resume task
- [ ] Extend task deadline
- [ ] Reassign task
- [ ] End task early
- [ ] Verify task auto-completion on target achievement

#### 6. Multi-Branch Operations
- [ ] Create new branch
- [ ] Designate main branch
- [ ] View branch inventory
- [ ] Transfer stock between branches
- [ ] View branch analytics
- [ ] Compare branch performance
- [ ] Delete branch (verify consolidation to main)

#### 7. Reports & Analytics
- [ ] Generate sales report with date range
- [ ] View branch P&L report
- [ ] Export report to Excel
- [ ] View inventory valuation report
- [ ] View customer purchase history

---

## Dependencies & Packages

### Backend New Dependencies
```json
{
  "pdfkit": "^0.15.0",          // PDF generation
  "cloudinary": "^2.0.0",        // Image upload
  "nodemailer": "^6.9.0"         // Email sending
}
```

### Frontend New Dependencies
```json
{
  "react-toastify": "^10.0.0",   // Toast notifications
  "react-select": "^5.8.0",      // Advanced select/autocomplete
  "framer-motion": "^11.0.0",    // Animations
  "react-dropzone": "^14.2.0",   // File upload
  "react-pdf": "^7.7.0"          // PDF preview
}
```

### PostgreSQL Extensions
```sql
-- Enable full-text search
CREATE EXTENSION IF NOT EXISTS pg_trgm;
```

---

## Implementation Execution Order

### Recommended Sequence
1. **Phase 1** (Database) - Foundation (Start here)
2. **Phase 2** (Backend APIs) + **Phase 3** (UI Components) - Parallel development
3. **Phase 4** (Features) - Core functionality
4. **Phase 5** (Advanced) - Polish and enhancements
5. **Phase 6** (Testing) - Quality assurance

---

## Risk Mitigation

### Technical Risks
1. **Data Loss**: Backup database before schema changes
2. **Breaking Changes**: Version control, feature flags
3. **Performance**: Implement pagination early, index new columns
4. **Third-party Services**: Handle Cloudinary/WhatsApp API failures gracefully

### Business Risks
1. **User Training**: Create user guides and video tutorials
2. **Data Migration**: Test migration scripts on copy of production data
3. **Downtime**: Plan deployment during low-traffic periods

---

## Success Criteria

### Feature Completeness
- ✅ All Eldaved-BMS retail features replicated
- ✅ Modern, sophisticated UI with multiple view modes
- ✅ Multi-branch architecture functional
- ✅ Tile calculator working with quotations
- ✅ Enhanced performance task system
- ✅ Receipt customization and delivery
- ✅ Stock transfers and damages tracking
- ✅ Recycle bin and soft delete recovery
- ✅ Full-text search operational
- ✅ Branch analytics and reporting

### Quality Metrics
- ✅ 80%+ test coverage
- ✅ All critical user flows tested
- ✅ Mobile responsive (works on phones/tablets)
- ✅ API response times < 500ms
- ✅ Zero console errors
- ✅ Accessibility audit passed

### User Experience
- ✅ Intuitive navigation
- ✅ Fast page loads
- ✅ Clear error messages
- ✅ Helpful tooltips and guides
- ✅ Professional design throughout

---

## Post-Implementation Enhancements

Future features to consider after core implementation:
1. **Real-time Notifications**: WebSocket integration
2. **Mobile App**: React Native mobile version
3. **Advanced Permissions**: Granular RBAC
4. **Multi-currency**: Support for different currencies
5. **Multi-language**: i18n internationalization
6. **API Documentation**: Interactive Swagger docs
7. **Automated Backups**: Scheduled database backups
8. **Performance Monitoring**: APM integration
9. **Dark Mode**: Dark theme support
10. **Offline Mode**: PWA with offline capabilities

---

## Conclusion

This comprehensive plan provides a roadmap to upgrade General-BMS with all features from Eldaved-BMS retail module while implementing a modern, sophisticated user interface. The phased approach ensures systematic implementation with clear milestones and testable outcomes.

**Total Scope**:
- 15+ new database tables
- 60+ new UI components
- 15+ new pages
- 50+ new API endpoints
- Enhanced design system
- Comprehensive testing

The implementation will transform General-BMS into a feature-rich, enterprise-grade multi-branch retail management system with advanced capabilities like tile calculator, performance tracking, and sophisticated inventory management.
