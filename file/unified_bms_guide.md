# General Purpose Business Management System (BMS)
## Single Unified Module - Complete Implementation Breakdown

**Document Version:** 1.0  
**Date:** January 24, 2026  
**Status:** Planning & Implementation Guide  
**Architecture:** Single Unified System  
**Technology Stack:** PostgreSQL, Express.js, React, Node.js (PERN)

---

## Table of Contents

1. [Executive Overview](#1-executive-overview)
2. [System Concept & Architecture](#2-system-concept--architecture)
3. [Feature Integration Strategy](#3-feature-integration-strategy)
4. [Database Design Steps](#4-database-design-steps)
5. [Backend Development Breakdown](#5-backend-development-breakdown)
6. [Frontend Development Breakdown](#6-frontend-development-breakdown)
7. [Core Module Implementation](#7-core-module-implementation)
8. [Unified Inventory System](#8-unified-inventory-system)
9. [Customer Management System](#9-customer-management-system)
10. [Sales & Order Processing](#10-sales--order-processing)
11. [Pricing & Discount Engine](#11-pricing--discount-engine)
12. [WhatsApp Integration](#12-whatsapp-integration)
13. [Expense Management](#13-expense-management)
14. [Reporting & Analytics](#14-reporting--analytics)
15. [User Roles & Permissions](#15-user-roles--permissions)
16. [Implementation Timeline](#16-implementation-timeline)
17. [Testing Strategy](#17-testing-strategy)
18. [Deployment Steps](#18-deployment-steps)
19. [Training & Documentation](#19-training--documentation)
20. [Success Metrics & KPIs](#20-success-metrics--kpis)

---

## 1. Executive Overview

### 1.1 What This System Does

A unified business management platform that seamlessly integrates retail and wholesale operations into a single cohesive system. This approach eliminates the complexity of managing separate modules while providing all the features needed for both business types.

### 1.2 Key Differences from Dual-System Architecture

**Unified Approach:**
- Single dashboard for all operations (retail and wholesale)
- One inventory pool serving both business types
- Unified customer database with type classification
- Shared product catalog with multiple pricing strategies
- Integrated financial tracking across all operations
- Streamlined user experience with contextual interfaces

**Benefits Over Separated Systems:**
- Reduced development and maintenance overhead
- Simpler user training (one system to learn)
- Better data consistency and integrity
- Easier inventory management (no transfers between systems)
- Unified reporting and analytics
- Single point of truth for all business data

### 1.3 Target Users & Business Models

**Retail Merchants:**
- Single or multiple physical store locations
- Direct consumer sales (B2C)
- Walk-in customers and online orders
- Standard retail pricing with occasional discounts

**Wholesale Merchants:**
- Bulk sales to businesses (B2B)
- Volume-based pricing tiers
- Credit terms and payment management
- WhatsApp-based order processing

**Hybrid Merchants (Most Common):**
- Both retail and wholesale operations
- Same products sold at different price points
- Different customer types with different terms
- Unified inventory across both channels

### 1.4 Core System Objectives

**Operational Efficiency:**
- 60% reduction in order processing time
- 40% less time spent on inventory management
- 70% faster invoice generation
- Real-time data access for decision-making

**Financial Control:**
- Complete visibility into all revenue streams
- Integrated expense tracking
- Profitability analysis by customer type
- Budget management and monitoring

**Scalability:**
- Support unlimited branches
- Handle 1000+ transactions daily
- Manage 10,000+ products
- Serve 5,000+ customers (retail and wholesale)

**User Experience:**
- Single login for all operations
- Intuitive interface requiring minimal training
- Mobile-responsive for on-the-go access
- Real-time updates and notifications

---

## 2. System Concept & Architecture

### 2.1 Unified System Philosophy

**Single Source of Truth:**
- One database containing all business data
- No data duplication between modules
- Real-time synchronization unnecessary (already unified)
- Consistent data across all user interfaces

**Context-Aware Interface:**
- Same core system presents different views based on user role
- Retail staff see retail-focused interface
- Wholesale managers see wholesale-focused interface
- Business owners see comprehensive overview
- System adapts to user's current task

**Flexible Data Model:**
- Products can be sold retail or wholesale (or both)
- Customers classified by type (retail/wholesale)
- Transactions tagged by type for reporting
- Inventory shared across all sales channels

### 2.2 Technology Stack Breakdown

**Frontend Technologies:**
- **React 18+** - Modern UI framework with hooks
- **Vite** - Fast build tool and development server
- **Tailwind CSS** - Utility-first styling framework
- **React Router v6** - Client-side routing
- **Axios** - HTTP client for API calls
- **React Query** - Server state management
- **Zustand** - Client state management
- **React Hook Form** - Form handling
- **Recharts** - Data visualization
- **React Table** - Advanced table features
- **React PDF** - Invoice and receipt generation
- **Date-fns** - Date manipulation

**Backend Technologies:**
- **Node.js 18+** - JavaScript runtime
- **Express.js** - Web application framework
- **PostgreSQL 15+** - Relational database
- **JWT** - Authentication tokens
- **Bcrypt** - Password hashing
- **Multer** - File upload handling
- **Node-cron** - Scheduled tasks
- **Nodemailer** - Email sending
- **Green API** - WhatsApp integration
- **Sharp** - Image processing
- **Winston** - Logging framework
- **Joi** - Input validation

**Development & Deployment:**
- **Git** - Version control
- **GitHub** - Code hosting
- **Docker** - Containerization (optional)
- **Vercel** - Frontend hosting
- **Render** - Backend hosting
- **Neon DB** - PostgreSQL hosting
- **Cloudinary** - Image/file storage
- **GitHub Actions** - CI/CD pipeline

### 2.3 System Architecture Layers

**Presentation Layer (Frontend):**
- User interfaces for all roles
- Responsive design for mobile and desktop
- Real-time updates via WebSocket (optional)
- Progressive Web App capabilities

**Application Layer (Backend API):**
- RESTful API endpoints
- Business logic implementation
- Authentication and authorization
- Data validation and sanitization
- File processing and storage
- Third-party service integration

**Data Layer (Database):**
- PostgreSQL database
- Normalized schema design
- Efficient indexing strategy
- Data integrity constraints
- Automated backups
- Query optimization

**Integration Layer:**
- WhatsApp API integration
- Email service integration
- SMS service integration (optional)
- Payment gateway integration (optional)
- Accounting software integration (optional)

### 2.4 Data Flow Architecture

**Customer Places Order (Retail):**
1. Customer walks in or contacts store
2. Staff logs into system
3. Searches or scans products
4. Adds items to cart
5. Applies discounts (if applicable)
6. Processes payment
7. System reduces inventory
8. Receipt generated automatically
9. Sale recorded with customer info
10. Reporting metrics updated

**Customer Places Order (Wholesale via WhatsApp):**
1. Customer sends WhatsApp message with order
2. Green API webhook receives message
3. System identifies customer by phone number
4. AI parser extracts product codes and quantities
5. System loads customer's pricing tier
6. Admin reviews parsed order
7. Admin confirms and forwards to supplier
8. Loading and shipping tracked
9. Invoice generated with customer's terms
10. Payment tracking initiated

**Inventory Management Flow:**
1. Stock arrives at warehouse/store
2. Staff records stock receipt
3. System increases inventory count
4. Stock assigned to location (if multi-branch)
5. Automatic reorder alerts set
6. Stock movements tracked
7. Regular stock audits performed
8. System reconciles discrepancies
9. Reports generated for analysis

**Expense Recording Flow:**
1. Business incurs expense
2. Staff/manager records expense
3. Receipt uploaded to system
4. Expense categorized appropriately
5. Linked to branch/order if applicable
6. Approval workflow initiated (if needed)
7. Budget validation performed
8. Payment scheduled or recorded
9. Financial reports updated
10. Audit trail maintained

---

## 3. Feature Integration Strategy

### 3.1 Shared Features (Used by Both Retail and Wholesale)

**Product Management:**
- Centralized product catalog
- Single product record with multiple attributes
- Category and brand classification
- Multiple units of measure
- Product images and descriptions
- Barcode/SKU management
- Active/inactive status

**Inventory Management:**
- Real-time stock tracking
- Multi-location support (if branches exist)
- Stock receipts and adjustments
- Stock transfers between locations
- Reorder point alerts
- Stock valuation methods (FIFO, LIFO, Average)
- Inventory audit trails

**Customer Management:**
- Unified customer database
- Customer type classification (retail/wholesale)
- Contact information management
- Purchase history tracking
- Outstanding balance tracking
- Customer notes and preferences
- Customer segments for marketing

**Financial Management:**
- Expense tracking and categorization
- Budget management
- Profit and loss reporting
- Cash flow monitoring
- Tax calculation and reporting
- Payment method tracking
- Vendor management

**User Management:**
- Role-based access control
- User authentication
- Activity logging
- Permission management
- Multi-branch user assignment
- Password management
- Session management

### 3.2 Retail-Specific Features

**Point of Sale (POS):**
- Quick product search and barcode scanning
- Shopping cart management
- Multiple payment methods (cash, card, transfer)
- Split payment support
- Receipt printing
- Returns and refunds processing
- Daily sales reconciliation

**Retail Pricing:**
- Standard retail price per product
- Promotional pricing with date ranges
- Quantity-based discounts
- Combo/bundle pricing
- Member/loyalty discounts
- Manual discount override (with permissions)

**Customer Walk-ins:**
- Guest checkout option
- Quick customer registration
- Loyalty program tracking
- Customer feedback collection
- Queue management (optional)

**Branch Management:**
- Multiple physical locations
- Branch-specific inventory
- Staff assignment to branches
- Branch performance comparison
- Inter-branch stock transfers

### 3.3 Wholesale-Specific Features

**WhatsApp Order Processing:**
- Automated message reception
- Intelligent order parsing
- Product code recognition
- Quantity extraction
- Admin review interface
- Order forwarding to suppliers
- Status tracking

**Credit Management:**
- Credit limit per customer
- Payment terms configuration (Net 30, 60, etc.)
- Outstanding balance tracking
- Credit utilization monitoring
- Auto-suspend for exceeded limits
- Payment history and aging reports

**Tiered Pricing:**
- Multiple price tiers (Bronze, Silver, Gold, Platinum)
- Customer-specific pricing overrides
- Volume-based discount rules
- Promotional pricing periods
- Price approval workflows

**Bulk Order Handling:**
- Large quantity order processing
- Multi-item orders
- Tonnage/weight calculations
- Delivery scheduling
- Loading and dispatch tracking
- Waybill management

**Supplier Integration:**
- Supplier/manufacturer database
- Product-supplier relationships
- Purchase order generation
- Order forwarding automation
- Free Trade Zone (FTZ) handling
- Supplier performance tracking

### 3.4 Feature Toggle Approach

**Why Feature Toggles:**
- Enable/disable features based on business needs
- Gradual rollout of new functionality
- A/B testing capabilities
- Different features for different user roles
- Simplified interface for specific use cases

**Implementation Strategy:**

**Step 1: Identify Toggleable Features**
- WhatsApp integration (can be turned off)
- Multi-branch support (single vs multiple locations)
- Credit management (immediate payment vs terms)
- Advanced pricing (simple vs complex)
- Expense approval workflow (immediate vs approval)

**Step 2: Database Configuration Table**
- Create settings table for feature flags
- Store boolean values for each feature
- Organization-level or user-level toggles
- Default values for new installations

**Step 3: Backend Validation**
- Check feature flag before processing requests
- Return appropriate errors if feature disabled
- Skip unnecessary calculations for disabled features
- Optimize performance by not loading disabled modules

**Step 4: Frontend Conditional Rendering**
- Hide/show menu items based on flags
- Conditionally render components
- Provide alternative workflows when disabled
- Clear messaging about disabled features

**Step 5: Admin Configuration Interface**
- Settings page for administrators
- Toggle switches for each feature
- Feature descriptions and impacts
- Confirmation before disabling critical features

### 3.5 Unified vs Contextual Interfaces

**Unified Dashboard Approach:**
- One main dashboard showing all metrics
- Separate cards/sections for retail and wholesale
- Toggle between views
- Comprehensive overview for business owners

**Contextual Interface Approach:**
- Interface adapts based on user role
- Retail staff see retail-focused screens
- Wholesale managers see wholesale-focused screens
- Reduce clutter by showing only relevant features

**Recommended Hybrid Approach:**
- Main dashboard shows overview
- Navigation menu organized by function
- Context-sensitive sub-menus
- Search function to find any feature quickly
- Favorites/shortcuts for frequently used features

---

## 4. Database Design Steps

### 4.1 Database Schema Philosophy

**Single Schema Approach:**
Unlike the dual-system which uses separate schemas (retail, wholesale, expense), this unified system uses one cohesive schema where tables serve both purposes through clever design.

**Key Design Principles:**
- Avoid duplication of similar data
- Use type fields to differentiate records
- Leverage foreign keys for relationships
- Index frequently queried fields
- Plan for scalability from the start
- Maintain referential integrity

### 4.2 Core Tables Structure

**Step 1: Users and Authentication Tables**

**users table:**
- Purpose: Store all system users
- Fields needed:
  - id (UUID or auto-increment)
  - email (unique, for login)
  - password_hash (bcrypt hashed)
  - full_name
  - phone_number
  - role_id (foreign key to roles table)
  - is_active (boolean)
  - last_login_at (timestamp)
  - created_at, updated_at, deleted_at (soft delete)
  
**roles table:**
- Purpose: Define user roles and permissions
- Fields needed:
  - id
  - role_name (e.g., Super Admin, Manager, Sales Staff, Wholesale Manager)
  - description
  - permissions (JSONB field storing permission array)
  - is_system_role (boolean - can't be deleted)
  - created_at, updated_at

**sessions table (optional):**
- Purpose: Track active user sessions
- Fields needed:
  - id
  - user_id (foreign key)
  - token (JWT or session ID)
  - ip_address
  - user_agent
  - expires_at
  - created_at

**Step 2: Organization and Branch Tables**

**organizations table (for multi-tenant future):**
- Purpose: Support multiple businesses in one installation
- Fields needed:
  - id
  - organization_name
  - registration_number
  - tax_id
  - email, phone
  - address
  - logo_url
  - is_active
  - created_at, updated_at

**branches table:**
- Purpose: Store physical locations
- Fields needed:
  - id
  - organization_id (foreign key)
  - branch_code (unique)
  - branch_name
  - address, city, state, country
  - phone_number, email
  - manager_user_id (foreign key to users)
  - is_warehouse (boolean - for central warehouses)
  - is_active
  - opening_hours (JSONB)
  - created_at, updated_at, deleted_at

**user_branches table (many-to-many):**
- Purpose: Assign users to multiple branches
- Fields needed:
  - id
  - user_id (foreign key)
  - branch_id (foreign key)
  - is_primary_branch (boolean)
  - assigned_at
  - assigned_by (user_id)

**Step 3: Product Management Tables**

**categories table:**
- Purpose: Organize products into categories
- Fields needed:
  - id
  - category_name
  - description
  - parent_category_id (self-referencing for subcategories)
  - display_order
  - is_active
  - created_at, updated_at

**brands table:**
- Purpose: Track product brands/manufacturers
- Fields needed:
  - id
  - brand_name
  - description
  - logo_url
  - is_active
  - created_at, updated_at

**products table:**
- Purpose: Central product catalog
- Fields needed:
  - id
  - product_code (SKU, unique)
  - product_name
  - description
  - category_id (foreign key)
  - brand_id (foreign key)
  - base_unit (e.g., piece, box, carton)
  - weight_per_unit (for tonnage calculations)
  - barcode (optional, for retail scanning)
  - retail_price (standard retail price)
  - wholesale_base_price (base wholesale price before tiers)
  - cost_price (for profit calculations)
  - tax_rate (percentage)
  - reorder_level (minimum stock before alert)
  - max_stock_level (maximum stock to hold)
  - product_images (JSONB array of image URLs)
  - specifications (JSONB for flexible attributes)
  - is_retail_available (boolean)
  - is_wholesale_available (boolean)
  - is_active
  - created_at, updated_at, deleted_at

**product_units table:**
- Purpose: Handle multiple units of measure
- Fields needed:
  - id
  - product_id (foreign key)
  - unit_name (e.g., piece, box, carton, dozen)
  - units_per_base (conversion ratio)
  - unit_price (price for this unit)
  - is_default_unit (boolean)

**product_suppliers table:**
- Purpose: Link products to their suppliers
- Fields needed:
  - id
  - product_id (foreign key)
  - supplier_id (foreign key to suppliers table)
  - supplier_product_code (their code for this product, e.g., tile code)
  - unit_price (what we buy it for)
  - lead_time_days
  - is_preferred_supplier (boolean)
  - minimum_order_quantity
  - created_at, updated_at

**Step 4: Inventory Management Tables**

**inventory table:**
- Purpose: Track stock levels per location
- Fields needed:
  - id
  - product_id (foreign key)
  - branch_id (foreign key)
  - quantity_on_hand (current stock)
  - quantity_reserved (allocated to pending orders)
  - quantity_available (on_hand minus reserved)
  - last_restock_date
  - last_counted_date
  - updated_at

**stock_movements table:**
- Purpose: Complete audit trail of inventory changes
- Fields needed:
  - id
  - product_id (foreign key)
  - branch_id (foreign key)
  - movement_type (enum: receipt, sale, adjustment, transfer_in, transfer_out, return, write_off)
  - quantity (positive or negative)
  - quantity_before
  - quantity_after
  - reference_type (e.g., sale, purchase_order, transfer)
  - reference_id (id of the referenced record)
  - notes
  - performed_by (user_id)
  - created_at

**stock_transfers table:**
- Purpose: Track transfers between branches
- Fields needed:
  - id
  - transfer_number (unique)
  - from_branch_id (foreign key)
  - to_branch_id (foreign key)
  - status (enum: pending, in_transit, received, cancelled)
  - initiated_by (user_id)
  - received_by (user_id, nullable)
  - transfer_date
  - received_date (nullable)
  - notes
  - created_at, updated_at

**stock_transfer_items table:**
- Purpose: Line items for transfers
- Fields needed:
  - id
  - transfer_id (foreign key)
  - product_id (foreign key)
  - quantity_requested
  - quantity_received (may differ)
  - notes

**Step 5: Customer Management Tables**

**customers table:**
- Purpose: Unified customer database
- Fields needed:
  - id
  - customer_number (unique, auto-generated)
  - customer_type (enum: retail, wholesale, both)
  - customer_name (business name or personal name)
  - contact_person (for businesses)
  - email
  - phone_number (primary, for WhatsApp)
  - alternative_phone
  - address, city, state, country
  - tax_id (for wholesale customers)
  - business_registration_number
  - price_tier_id (foreign key, nullable for retail)
  - credit_limit (for wholesale)
  - payment_terms_days (e.g., 30 for Net 30)
  - current_balance (outstanding amount)
  - is_active
  - suspended (boolean, for credit issues)
  - suspension_reason
  - loyalty_points (for retail)
  - notes
  - created_at, updated_at, deleted_at

**customer_addresses table:**
- Purpose: Multiple delivery addresses per customer
- Fields needed:
  - id
  - customer_id (foreign key)
  - address_type (enum: billing, delivery, both)
  - address_label (e.g., "Main Warehouse", "Shop 2")
  - full_address
  - city, state, postal_code, country
  - contact_person
  - contact_phone
  - is_default (boolean)
  - created_at, updated_at

**customer_contacts table:**
- Purpose: Multiple contact persons for wholesale customers
- Fields needed:
  - id
  - customer_id (foreign key)
  - contact_name
  - position (e.g., "Purchasing Manager")
  - email
  - phone
  - is_primary (boolean)
  - notes

**Step 6: Pricing Tables**

**price_tiers table:**
- Purpose: Define wholesale pricing levels
- Fields needed:
  - id
  - tier_name (e.g., Bronze, Silver, Gold, Platinum)
  - tier_code (unique)
  - discount_percentage (overall discount from base price)
  - description
  - display_order
  - is_active
  - created_at, updated_at

**customer_product_prices table:**
- Purpose: Custom prices overriding tier prices
- Fields needed:
  - id
  - customer_id (foreign key)
  - product_id (foreign key)
  - custom_price
  - effective_from
  - effective_to (nullable)
  - created_by (user_id)
  - notes
  - created_at, updated_at

**promotional_pricing table:**
- Purpose: Time-based promotional prices
- Fields needed:
  - id
  - product_id (foreign key)
  - promotion_name
  - promotional_price
  - applies_to (enum: all, retail_only, wholesale_only, specific_tier)
  - price_tier_id (nullable, if specific_tier)
  - start_date
  - end_date
  - is_active
  - created_at, updated_at

**Step 7: Sales and Orders Tables**

**sales table:**
- Purpose: Record all transactions (retail and wholesale)
- Fields needed:
  - id
  - sale_number (unique, auto-generated)
  - sale_type (enum: retail, wholesale)
  - customer_id (foreign key, nullable for walk-in retail)
  - branch_id (foreign key)
  - sale_date
  - subtotal
  - tax_amount
  - discount_amount
  - total_amount
  - amount_paid
  - amount_due (for wholesale with payment terms)
  - payment_status (enum: paid, partial, pending, overdue)
  - payment_due_date (for wholesale)
  - payment_method (enum: cash, card, transfer, cheque, credit)
  - payment_reference
  - notes
  - sale_source (enum: pos, whatsapp, phone, online)
  - processed_by (user_id)
  - status (enum: completed, pending, cancelled, returned)
  - created_at, updated_at, deleted_at

**sale_items table:**
- Purpose: Line items for sales
- Fields needed:
  - id
  - sale_id (foreign key)
  - product_id (foreign key)
  - product_name (snapshot at time of sale)
  - quantity
  - unit_type (piece, box, carton)
  - unit_price (actual price used)
  - discount_amount (if line-level discount)
  - tax_amount
  - line_total
  - cost_price (for profit calculation)
  - created_at

**orders table:**
- Purpose: Wholesale orders with complex workflows
- Fields needed:
  - id
  - order_number (unique)
  - customer_id (foreign key)
  - whatsapp_message_id (if from WhatsApp)
  - order_type (enum: whatsapp, manual, phone)
  - order_date
  - status (enum: new, parsed, pending, confirmed, forwarded, loading, loaded, dispatched, delivered, completed, cancelled)
  - subtotal
  - tax_amount
  - total_amount
  - total_weight (tonnage)
  - delivery_address_id (foreign key to customer_addresses)
  - special_instructions
  - supplier_id (foreign key, if forwarding to supplier)
  - confidence_score (for AI parsed orders)
  - processed_by (user_id)
  - confirmed_at
  - forwarded_at
  - loading_at
  - loaded_at
  - dispatched_at
  - delivered_at
  - completed_at
  - cancelled_at
  - cancellation_reason
  - created_at, updated_at

**order_items table:**
- Purpose: Line items for orders
- Fields needed:
  - id
  - order_id (foreign key)
  - product_id (foreign key)
  - supplier_product_code (tile code)
  - quantity
  - unit_type
  - unit_weight
  - total_weight
  - unit_price
  - line_total
  - created_at

**order_versions table:**
- Purpose: Track order edits for audit
- Fields needed:
  - id
  - order_id (foreign key)
  - version_number
  - order_data (JSONB snapshot)
  - items_data (JSONB array of items)
  - changed_by (user_id)
  - change_reason
  - created_at

**whatsapp_messages table:**
- Purpose: Store WhatsApp order messages
- Fields needed:
  - id
  - message_id (from Green API)
  - customer_phone
  - customer_id (foreign key, after identification)
  - message_text
  - message_timestamp
  - parsed_status (enum: pending, success, failed, manual)
  - order_id (foreign key, after processing)
  - created_at

**Step 8: Supplier Management Tables**

**suppliers table:**
- Purpose: Manufacturing companies and vendors
- Fields needed:
  - id
  - supplier_code (unique)
  - supplier_name
  - contact_person
  - email
  - phone_number
  - whatsapp_number (for order forwarding)
  - address
  - is_free_trade_zone (boolean)
  - ftz_certificate_url
  - tax_registration_number
  - our_account_number (our account with them)
  - payment_terms
  - credit_limit_with_us (how much we owe them)
  - is_active
  - notes
  - created_at, updated_at

**purchase_orders table:**
- Purpose: Orders placed to suppliers
- Fields needed:
  - id
  - po_number (unique)
  - supplier_id (foreign key)
  - order_date
  - expected_delivery_date
  - status (enum: draft, sent, acknowledged, partially_received, received, cancelled)
  - subtotal
  - tax_amount
  - total_amount
  - notes
  - created_by (user_id)
  - created_at, updated_at

**purchase_order_items table:**
- Purpose: PO line items
- Fields needed:
  - id
  - po_id (foreign key)
  - product_id (foreign key)
  - quantity_ordered
  - quantity_received
  - unit_price
  - line_total
  - received_date (nullable)

**Step 9: Payment Tables**

**payments table:**
- Purpose: Track all payments received and made
- Fields needed:
  - id
  - payment_number (unique)
  - payment_type (enum: received, paid)
  - customer_id (foreign key, nullable)
  - supplier_id (foreign key, nullable)
  - related_to (enum: sale, order, expense, purchase_order)
  - related_id (polymorphic reference)
  - payment_date
  - amount
  - payment_method (enum: cash, card, transfer, cheque)
  - payment_reference (transaction ID, cheque number)
  - notes
  - recorded_by (user_id)
  - created_at, updated_at

**payment_allocations table:**
- Purpose: Allocate payments to specific invoices/orders
- Fields needed:
  - id
  - payment_id (foreign key)
  - sale_id or order_id (depending on type)
  - allocated_amount
  - created_at

**Step 10: Expense Management Tables**

**expense_categories table:**
- Purpose: Primary expense categories
- Fields needed:
  - id
  - category_name
  - category_code
  - description
  - is_active
  - created_at, updated_at

**expense_subcategories table:**
- Purpose: Subsidiary categories under primary
- Fields needed:
  - id
  - category_id (foreign key)
  - subcategory_name
  - subcategory_code
  - description
  - is_active
  - created_at, updated_at

**expenses table:**
- Purpose: Record all business expenses
- Fields needed:
  - id
  - expense_number (unique)
  - expense_date
  - amount
  - category_id (foreign key)
  - subcategory_id (foreign key)
  - vendor_id (foreign key, nullable)
  - branch_id (foreign key, nullable)
  - order_id (foreign key, nullable - for order-specific expenses)
  - sale_id (foreign key, nullable)
  - payment_method
  - payment_reference
  - description
  - receipt_url (uploaded receipt)
  - status (enum: pending, approved, rejected, paid)
  - submitted_by (user_id)
  - approved_by (user_id, nullable)
  - approved_at (nullable)
  - notes
  - created_at, updated_at

**budgets table:**
- Purpose: Budget planning and tracking
- Fields needed:
  - id
  - budget_name
  - budget_year
  - budget_period (enum: annual, quarterly, monthly)
  - category_id (foreign key, nullable)
  - subcategory_id (foreign key, nullable)
  - branch_id (foreign key, nullable)
  - allocated_amount
  - spent_amount (calculated)
  - remaining_amount (calculated)
  - is_active
  - created_at, updated_at

**Step 11: Document Management Tables**

**documents table:**
- Purpose: Store uploaded documents
- Fields needed:
  - id
  - document_type (enum: invoice, receipt, waybill, contract, license, other)
  - related_to (enum: customer, supplier, order, sale, expense, product)
  - related_id (polymorphic reference)
  - file_name
  - file_url
  - file_size
  - mime_type
  - uploaded_by (user_id)
  - created_at

**waybills table:**
- Purpose: Shipping documents for orders
- Fields needed:
  - id
  - order_id (foreign key)
  - waybill_number
  - file_url
  - shipping_date
  - expected_delivery_date
  - actual_delivery_date (nullable)
  - uploaded_by (user_id)
  - created_at, updated_at

**Step 12: Reporting and Analytics Tables**

**daily_sales_summary table:**
- Purpose: Pre-aggregated daily sales for faster reporting
- Fields needed:
  -