# E-Commerce Storefront Integration Plan

## Overview

Integrate the existing **One Manager Store** (React 19 + TypeScript + Vite) as a customer-facing e-commerce storefront for the **General BMS**. The storefront will be hosted separately and connect to the BMS backend via a new set of public-facing API endpoints. All administrative control (products, inventory, orders, promotions, customers) remains in the BMS admin frontend.

---

## Architecture

```
┌─────────────────────┐     ┌──────────────────────────────┐     ┌─────────────────────┐
│   Store Frontend    │     │       BMS Backend            │     │   BMS Admin Frontend│
│   (React/TS/Vite)   │────▶│       (Express.js)           │◀────│   (React/Vite)      │
│   Port 3006         │     │       Port 5000              │     │   Port 5173         │
│   Public customers  │     │                              │     │   Internal staff     │
└─────────────────────┘     │  ┌────────────────────────┐  │     └─────────────────────┘
                            │  │ /api/store/*  (public)  │  │
                            │  │ /api/cart     (public)  │  │
                            │  │ /api/*        (admin)   │  │
                            │  └────────────────────────┘  │
                            │              │               │
                            │     ┌────────▼────────┐      │
                            │     │   PostgreSQL    │      │
                            │     │   (Neon)        │      │
                            │     └─────────────────┘      │
                            └──────────────────────────────┘
```

**Key Principle:** The BMS backend serves BOTH the admin API (`/api/*`) and the new storefront API (`/api/store/*`). No separate backend needed — the storefront reads from the same database (products, inventory, promotions, customers) that the admin manages.

---

## Phase 1: Database — New Tables & Migrations

### 1.1 `store_config` table
Stores the online store branding/settings that admins configure in BMS.

```sql
CREATE TABLE store_config (
  id SERIAL PRIMARY KEY,
  organization_id INT REFERENCES organizations(id),
  store_slug VARCHAR(100) UNIQUE NOT NULL,
  store_name VARCHAR(255) NOT NULL,
  tagline VARCHAR(255),
  description TEXT,

  -- Branding
  logo_primary TEXT,          -- Cloudinary URL
  logo_icon TEXT,
  logo_dark TEXT,

  -- Theme
  primary_color VARCHAR(20) DEFAULT '#3B82F6',
  secondary_color VARCHAR(20) DEFAULT '#1E40AF',
  accent_color VARCHAR(20) DEFAULT '#F59E0B',
  background_color VARCHAR(20) DEFAULT '#FFFFFF',
  text_color VARCHAR(20) DEFAULT '#111827',
  font_family VARCHAR(100) DEFAULT 'Inter',

  -- Layout
  header_style VARCHAR(50) DEFAULT 'standard',
  product_card_style VARCHAR(50) DEFAULT 'standard',
  grid_columns INT DEFAULT 4,

  -- Features toggles
  features JSONB DEFAULT '{"wishlist": false, "reviews": false, "compareProducts": false, "quickView": true, "recentlyViewed": true, "relatedProducts": true}',

  -- Contact
  contact_email VARCHAR(255),
  contact_phone VARCHAR(50),
  contact_whatsapp VARCHAR(50),
  contact_address TEXT,

  -- Social
  social_links JSONB DEFAULT '{}',

  -- SEO
  seo_meta_title VARCHAR(255),
  seo_meta_description TEXT,
  seo_og_image TEXT,

  -- Homepage
  hero_banners JSONB DEFAULT '[]',
  featured_category_ids JSONB DEFAULT '[]',
  featured_product_ids JSONB DEFAULT '[]',
  show_promo_bar BOOLEAN DEFAULT false,
  promo_bar_text VARCHAR(255),

  -- Status
  is_active BOOLEAN DEFAULT true,
  maintenance_mode BOOLEAN DEFAULT false,
  maintenance_message TEXT,
  custom_domain VARCHAR(255),

  -- Checkout & shipping
  currency VARCHAR(10) DEFAULT 'NGN',
  shipping_methods JSONB DEFAULT '[]',
  payment_methods JSONB DEFAULT '["paystack"]',
  tax_rate DECIMAL(5,2) DEFAULT 0,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### 1.2 `customer_auth` table & customer source tracking
Separate auth for storefront customers (BMS `customers` table stores profile data; this adds login credentials). Also add a `source` column to the existing `customers` table to distinguish shop vs online customers.

```sql
-- Add source tracking to existing customers table
ALTER TABLE customers ADD COLUMN IF NOT EXISTS source VARCHAR(20) DEFAULT 'shop';
-- source values: 'shop' (created in-store/POS), 'online' (registered via storefront), 'manual' (added by admin)

CREATE TABLE customer_auth (
  id SERIAL PRIMARY KEY,
  customer_id INT REFERENCES customers(id) ON DELETE CASCADE,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  is_email_verified BOOLEAN DEFAULT false,
  email_verification_token VARCHAR(255),
  password_reset_token VARCHAR(255),
  password_reset_expires TIMESTAMP,
  last_login_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_customers_source ON customers(source);
```

### 1.3 `carts` & `cart_items` tables
Server-side cart for both guest and authenticated customers.

```sql
CREATE TABLE carts (
  id SERIAL PRIMARY KEY,
  customer_id INT REFERENCES customers(id) ON DELETE SET NULL,
  session_id VARCHAR(255),              -- For guest carts
  coupon_code VARCHAR(100),
  coupon_discount DECIMAL(12,2) DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT cart_owner CHECK (customer_id IS NOT NULL OR session_id IS NOT NULL)
);

CREATE TABLE cart_items (
  id SERIAL PRIMARY KEY,
  cart_id INT REFERENCES carts(id) ON DELETE CASCADE,
  product_id INT REFERENCES products(id),
  variant_id INT REFERENCES product_variants(id),
  quantity INT NOT NULL DEFAULT 1 CHECK (quantity > 0),
  unit_price DECIMAL(12,2) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(cart_id, product_id, variant_id)
);
```

### 1.4 `online_orders` & `online_order_items` tables
Customer-placed orders from the storefront (distinct from POS `sales`).

```sql
CREATE TABLE online_orders (
  id SERIAL PRIMARY KEY,
  order_number VARCHAR(50) UNIQUE NOT NULL,    -- AUTO: ORD-{YYYYMMDD}-{seq}
  customer_id INT REFERENCES customers(id),
  customer_email VARCHAR(255) NOT NULL,
  customer_phone VARCHAR(50),
  customer_name VARCHAR(255),

  -- Amounts
  subtotal DECIMAL(12,2) NOT NULL,
  shipping_amount DECIMAL(12,2) DEFAULT 0,
  tax_amount DECIMAL(12,2) DEFAULT 0,
  discount_amount DECIMAL(12,2) DEFAULT 0,
  total DECIMAL(12,2) NOT NULL,
  currency VARCHAR(10) DEFAULT 'NGN',
  coupon_code VARCHAR(100),

  -- Addresses (stored as JSONB snapshots)
  shipping_address JSONB NOT NULL,
  billing_address JSONB,

  -- Shipping
  shipping_method VARCHAR(100),
  shipping_carrier VARCHAR(100),
  tracking_number VARCHAR(255),
  estimated_delivery DATE,
  delivered_at TIMESTAMP,

  -- Payment
  payment_method VARCHAR(50),                     -- 'paystack', 'bank_transfer'
  payment_status VARCHAR(20) DEFAULT 'PENDING',   -- PENDING, AWAITING_CONFIRMATION, PAID, FAILED, REFUNDED
  payment_reference VARCHAR(255),
  paid_at TIMESTAMP,

  -- Manual payment (bank transfer)
  bank_channel_id INT REFERENCES bank_channels(id),  -- Which bank account customer paid into
  proof_of_payment TEXT,                              -- Cloudinary URL (optional)
  payment_confirmed_by INT REFERENCES users(id),     -- Admin who confirmed the manual payment
  payment_confirmed_at TIMESTAMP,

  -- Order lifecycle
  status VARCHAR(30) DEFAULT 'PENDING',
  -- PENDING → CONFIRMED → PROCESSING → READY_FOR_PICKUP → SHIPPED → OUT_FOR_DELIVERY → DELIVERED
  -- or → CANCELLED / REFUNDED at any point
  status_history JSONB DEFAULT '[]',

  customer_notes TEXT,
  admin_notes TEXT,
  branch_id INT REFERENCES branches(id),       -- Fulfillment branch

  confirmed_at TIMESTAMP,
  shipped_at TIMESTAMP,
  cancelled_at TIMESTAMP,
  cancellation_reason TEXT,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE online_order_items (
  id SERIAL PRIMARY KEY,
  order_id INT REFERENCES online_orders(id) ON DELETE CASCADE,
  product_id INT REFERENCES products(id),
  variant_id INT REFERENCES product_variants(id),
  product_name VARCHAR(255) NOT NULL,          -- Snapshot at time of order
  variant_info JSONB,                           -- Snapshot of variant values
  sku VARCHAR(100),
  quantity INT NOT NULL,
  unit_price DECIMAL(12,2) NOT NULL,
  discount_amount DECIMAL(12,2) DEFAULT 0,
  tax_amount DECIMAL(12,2) DEFAULT 0,
  line_total DECIMAL(12,2) NOT NULL,
  product_image TEXT,                           -- Snapshot of image URL
  created_at TIMESTAMP DEFAULT NOW()
);

-- Index for order lookup
CREATE INDEX idx_online_orders_customer ON online_orders(customer_id);
CREATE INDEX idx_online_orders_status ON online_orders(status);
CREATE INDEX idx_online_orders_number ON online_orders(order_number);
```

### 1.5 `customer_addresses` enhancement
The existing `customer_addresses` table already exists. Add a `label` column if missing and ensure it supports the storefront address format.

### 1.6 Product table additions
```sql
-- Add slug and online visibility flag to products (if not present)
ALTER TABLE products ADD COLUMN IF NOT EXISTS slug VARCHAR(255) UNIQUE;
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_online_available BOOLEAN DEFAULT false;
ALTER TABLE products ADD COLUMN IF NOT EXISTS short_description VARCHAR(500);
```

---

## Phase 2: Backend — Storefront API Endpoints

All storefront routes live under `/api/store` with a separate middleware chain (no admin auth required for public endpoints; customer JWT for authenticated ones).

### 2.1 New Middleware

**File:** `backend/src/middleware/storeAuthMiddleware.js`
- Extracts customer JWT from `Authorization` header
- Verifies with a `STORE_JWT_SECRET` (separate from admin JWT_SECRET)
- Attaches `req.customer` with `{ id, email, customerId }`
- Optional variant: `optionalStoreAuth` — attaches customer if token present, continues if not

**File:** `backend/src/middleware/sessionMiddleware.js`
- Reads `X-Session-Id` header for guest cart tracking
- Attaches `req.sessionId`

### 2.2 New Routes & Controllers

| Route File | Controller File | Endpoints |
|---|---|---|
| `storeConfigRoutes.js` | `storeConfigController.js` | `GET /api/store/config/:slug` — Get store config |
| | | `GET /api/store/config/domain/:domain` — Config by custom domain |
| | | `PUT /api/store/config` (admin auth) — Update store config |
| `storeCatalogRoutes.js` | `storeCatalogController.js` | `GET /api/store/:slug/products` — List products (filter, sort, paginate) |
| | | `GET /api/store/:slug/products/featured` — Featured products |
| | | `GET /api/store/:slug/products/:productSlug` — Product detail |
| | | `GET /api/store/:slug/categories` — Category list |
| | | `GET /api/store/:slug/categories/:slug` — Products by category |
| | | `GET /api/store/:slug/search?q=` — Product search |
| `storeCartRoutes.js` | `storeCartController.js` | `GET /api/store/cart` — Get cart |
| | | `POST /api/store/cart/items` — Add item |
| | | `PUT /api/store/cart/items/:itemId` — Update quantity |
| | | `DELETE /api/store/cart/items/:itemId` — Remove item |
| | | `DELETE /api/store/cart` — Clear cart |
| | | `POST /api/store/cart/coupon` — Apply coupon |
| | | `DELETE /api/store/cart/coupon` — Remove coupon |
| `storeCustomerRoutes.js` | `storeCustomerController.js` | **Auth:** |
| | | `POST /api/store/:slug/customers/register` — Register new account |
| | | `POST /api/store/:slug/customers/login` — Login |
| | | `POST /api/store/:slug/customers/logout` — Logout |
| | | `POST /api/store/:slug/customers/forgot-password` — Request password reset email |
| | | `POST /api/store/:slug/customers/reset-password` — Reset password with token |
| | | `POST /api/store/:slug/customers/verify-email` — Verify email with token |
| | | `POST /api/store/:slug/customers/resend-verification` — Resend verification email |
| | | **Profile & Account:** |
| | | `GET /api/store/:slug/customers/profile` — Get profile (incl. addresses) |
| | | `PATCH /api/store/:slug/customers/profile` — Update profile (name, phone) |
| | | `PATCH /api/store/:slug/customers/change-password` — Change password (requires current password) |
| | | `PATCH /api/store/:slug/customers/change-email` — Change email (sends verification to new email) |
| | | `DELETE /api/store/:slug/customers/account` — Delete/deactivate account |
| | | **Addresses:** |
| | | `GET /api/store/:slug/customers/addresses` — List addresses |
| | | `POST /api/store/:slug/customers/addresses` — Add address |
| | | `PATCH /api/store/:slug/customers/addresses/:id` — Update address |
| | | `DELETE /api/store/:slug/customers/addresses/:id` — Delete address |
| | | `PATCH /api/store/:slug/customers/addresses/:id/default` — Set as default |
| `storeCheckoutRoutes.js` | `storeCheckoutController.js` | `POST /api/store/:slug/checkout` — Place order |
| | | `GET /api/store/:slug/checkout/verify` — Verify payment |
| `storeOrderRoutes.js` | `storeOrderController.js` | `GET /api/store/:slug/orders` — Customer's orders |
| | | `GET /api/store/:slug/orders/:id` — Order detail |
| | | `POST /api/store/:slug/orders/:id/cancel` — Customer cancels pending order |
| | | `GET /api/store/track-order?number=&email=` — Public order tracking |

### 2.3 Admin Endpoints for Online Orders

Add to existing BMS admin API:

| Route | Purpose |
|---|---|
| `GET /api/online-orders` | List all online orders (filterable by status, date, branch) |
| `GET /api/online-orders/:id` | Order detail |
| `PUT /api/online-orders/:id/status` | Update order status (confirm, process, ship, deliver, cancel) |
| `PUT /api/online-orders/:id/tracking` | Add tracking number |
| `PUT /api/online-orders/:id/notes` | Add admin notes |
| `GET /api/online-orders/stats` | Order statistics (pending count, revenue, etc.) |
| `PUT /api/store-config` | Update store configuration |
| `GET /api/store-config` | Get store configuration for admin |

---

## Phase 3: Storefront Frontend — Adapt to BMS Backend

### 3.1 API Client Reconfiguration

**File:** `store/src/api/client.ts`
- Change `VITE_API_URL` default from `localhost:3005` to `localhost:5000` (BMS backend)
- Keep `X-Tenant-Slug` and `X-Session-Id` headers
- Keep `Authorization` header logic (customer JWT)

### 3.2 Endpoint Path Adjustments

The storefront currently calls endpoints like `/api/store/{slug}/products`. Our new backend routes match this pattern exactly — so **minimal changes needed** in the storefront. Verify and adjust:

| Storefront Calls | BMS Endpoint (New) | Changes Needed |
|---|---|---|
| `GET /api/config/{slug}` | `GET /api/store/config/{slug}` | Prefix with `/store` |
| `GET /api/config/domain/{domain}` | `GET /api/store/config/domain/{domain}` | Prefix with `/store` |
| `GET /api/store/{slug}/products` | Same | None |
| `GET /api/store/{slug}/products/{slug}` | Same | None |
| `GET /api/store/{slug}/products/featured` | Same | None |
| `GET /api/store/{slug}/products/categories` | `GET /api/store/{slug}/categories` | Adjust path |
| `GET /api/cart` | `GET /api/store/cart` | Prefix with `/store` |
| `POST /api/cart/items` | `POST /api/store/cart/items` | Prefix with `/store` |
| `PUT /api/cart/items/:id` | `PUT /api/store/cart/items/:id` | Prefix with `/store` |
| `DELETE /api/cart/items/:id` | `DELETE /api/store/cart/items/:id` | Prefix with `/store` |
| `DELETE /api/cart` | `DELETE /api/store/cart` | Prefix with `/store` |
| `POST /api/cart/coupon` | `POST /api/store/cart/coupon` | Prefix with `/store` |
| `DELETE /api/cart/coupon` | `DELETE /api/store/cart/coupon` | Prefix with `/store` |
| `POST /api/store/{slug}/customers/login` | Same | None |
| `POST /api/store/{slug}/customers/register` | Same | None |
| `POST /api/store/{slug}/checkout` | Same | None |
| `GET /api/store/{slug}/customers/profile` | Same | None |

### 3.3 Storefront: Customer Registration, Login & Account Management

The storefront already has pages for login, register, profile, orders, and addresses. We need to **add missing features** and **wire all pages to the BMS backend**.

#### 3.3.1 Registration Flow

Existing `RegisterPage.tsx` collects: firstName, lastName, email, phone, password, confirmPassword.

**Backend behavior on registration:**
1. Validate all fields (Joi schema)
2. Check email uniqueness in `customer_auth`
3. Create `customers` record with `source = 'online'`, `customer_type = 'retail'`
4. Auto-generate `customer_code` (e.g., `CUS-ONL-{seq}`)
5. Create `customer_auth` record with bcrypt-hashed password
6. Generate email verification token, store in `customer_auth.email_verification_token`
7. Send verification email (or queue it — Phase 8 future)
8. Return JWT access token + customer profile (customer can use the store immediately, but show "verify email" banner)

#### 3.3.2 Login Flow

Existing `LoginPage.tsx` collects: email, password.

**Backend behavior:**
1. Look up `customer_auth` by email
2. Verify password with bcrypt
3. Update `customer_auth.last_login_at`
4. Merge guest cart (by `session_id`) into customer cart if one exists
5. Return JWT access token + customer profile

#### 3.3.3 Forgot / Reset Password Flow (New Pages)

**New storefront pages to create:**

- **`ForgotPasswordPage.tsx`** (`/forgot-password`)
  - Form: email input
  - Calls `POST /api/store/:slug/customers/forgot-password`
  - Backend generates `password_reset_token` + `password_reset_expires` (1 hour)
  - Shows "Check your email" confirmation message

- **`ResetPasswordPage.tsx`** (`/reset-password?token=xxx`)
  - Form: new password + confirm password
  - Calls `POST /api/store/:slug/customers/reset-password` with token + new password
  - Backend validates token, checks expiry, hashes new password, clears token
  - Redirects to login on success

#### 3.3.4 Email Verification (New Component)

- **`EmailVerificationBanner.tsx`** — shown in account layout when `isEmailVerified = false`
  - "Your email is not verified. [Resend verification email]"
  - Calls `POST /api/store/:slug/customers/resend-verification`

- **`VerifyEmailPage.tsx`** (`/verify-email?token=xxx`)
  - Auto-verifies on load by calling `POST /api/store/:slug/customers/verify-email`
  - Shows success/error message

#### 3.3.5 Account Settings (New Page)

**New storefront page: `AccountSettingsPage.tsx`** (`/account/settings`)

Add to the account sidebar alongside Profile, Orders, Addresses:

```
Account
  ├── Profile          → /account          (existing — view/edit name, phone)
  ├── Orders           → /account/orders   (existing)
  ├── Addresses        → /account/addresses (existing)
  └── Settings         → /account/settings  (NEW)
```

**Settings page sections:**

**Change Password:**
- Current password (required for verification)
- New password
- Confirm new password
- Calls `PATCH /api/store/:slug/customers/change-password`

**Change Email:**
- Current email (read-only display)
- New email input
- Current password (required for verification)
- Calls `PATCH /api/store/:slug/customers/change-email`
- Backend sends verification email to new address; email only updates after verification

**Delete Account:**
- "Delete my account" button (danger zone)
- Confirmation modal: "This will permanently delete your account and all associated data"
- Requires password entry for confirmation
- Calls `DELETE /api/store/:slug/customers/account`
- Backend: soft-deletes customer record, deactivates `customer_auth`, clears any active cart
- Logs out the customer after deletion

#### 3.3.6 Enhanced Profile Page

Update existing `ProfilePage.tsx` to also show:
- Email verification status badge
- Account creation date
- Last login date
- Total orders count and total spent (read from profile response)

#### 3.3.7 Order History Enhancements

Update existing `OrdersPage.tsx`:
- Add status filter tabs: All | Pending | Processing | Shipped | Delivered | Cancelled
- Show payment status badge (especially "Awaiting Confirmation" for bank transfers)
- "Cancel Order" button on pending orders (calls `POST /api/store/:slug/orders/:id/cancel`)

Update existing `OrderDetailPage.tsx`:
- Show payment method details
- For bank transfer orders: show bank details + proof of payment upload (from Phase 6.3)
- Order timeline/status history visualization

#### 3.3.8 Storefront Routes Update

Add new routes to `App.tsx`:
```
/forgot-password         → ForgotPasswordPage
/reset-password          → ResetPasswordPage
/verify-email            → VerifyEmailPage
/account/settings        → AccountSettingsPage  (protected)
```

### 3.4 Data Mapping

The storefront TypeScript types need to match BMS database columns. Key mappings:

**Product:**
- `product.slug` → new `slug` column on products table
- `product.images` → `product_images` JSONB column
- `product.price` → `retail_price`
- `product.compareAtPrice` → `wholesale_base_price` (or null)
- `product.inStock` → derived from `inventory.quantity_available > 0`
- `product.category` → joined from `categories` table
- `product.variants` → from `product_variants` + `product_variant_options` + `product_variant_values`

**Category:**
- `category.slug` → need to add `slug` column to `categories` table
- `category.image` → existing image column or add one
- `category.productCount` → derived via COUNT query

### 3.4 Storefront Environment Config

```env
VITE_API_URL=http://localhost:5000
# In production: https://api.yourdomain.com
```

Update `vite.config.ts` proxy target to `http://localhost:5000`.

---

## Phase 4: BMS Admin Frontend — Online Store Management

### 4.1 New Admin Pages

| Page | Path | Purpose |
|---|---|---|
| `OnlineOrdersPage.jsx` | `/online-orders` | List & manage online orders |
| `OnlineOrderDetailPage.jsx` | `/online-orders/:id` | View/process individual order |
| `StoreSettingsPage.jsx` | `/store-settings` | Configure online store (branding, theme, features, SEO, homepage) |

### 4.2 Online Orders Management Features

- **Order list** with filters: status, payment status, date range, customer
- **Order detail** view with:
  - Customer info, shipping/billing addresses
  - Order items with product images
  - Status timeline visualization
  - Status update actions (Confirm → Process → Ship → Deliver)
  - Add tracking number
  - Cancel order with reason
  - Admin notes
  - **Manual payment confirmation panel** (for bank transfer orders):
    - View proof of payment image (if uploaded)
    - View selected bank channel the customer paid into
    - "Confirm Payment" button → sets `payment_status = PAID`, records `payment_confirmed_by` & `payment_confirmed_at`
    - "Reject Payment" button → sets `payment_status = FAILED` with reason, notifies customer to retry
- **Dashboard widget** showing pending online orders count + awaiting payment confirmation count
- **Notification** when new online order arrives or proof of payment is uploaded

### 4.3 Customer CRM — Online Customer Integration

The existing **CustomersPage** gets enhanced with source-based tabs and online customer visibility.

#### 4.3.1 Customer Tabs on CustomersPage

Replace the current type filter dropdown with a **tab bar**:

```
┌──────────┬─────────────────┬──────────────────┐
│   All    │  Shop Customers │ Online Customers  │
└──────────┴─────────────────┴──────────────────┘
```

- **All** — Shows every customer regardless of source (default)
- **Shop Customers** — `WHERE source = 'shop'` (created via POS / in-store)
- **Online Customers** — `WHERE source = 'online'` (registered via storefront)

The existing **Retail / Wholesale** type filter remains as a secondary filter within each tab.

#### 4.3.2 Backend: Customer Query Enhancement

Update `GET /api/customers` to support `?source=shop|online|all` query parameter:

```sql
-- Existing query enhanced with:
WHERE ($1::text IS NULL OR source = $1)
  AND ($2::text IS NULL OR customer_type = $2)
```

#### 4.3.3 Online Customer Detail View

Enhance existing customer detail / customer card to show for online customers:
- **Source badge** — "Online" (blue) / "Shop" (green) badge on each customer row
- **Online activity summary**: total online orders, last online order date, account creation date
- **Email verification status** — verified / unverified indicator (from `customer_auth.is_email_verified`)
- **Addresses** — shipping/billing addresses managed by the customer from the storefront
- **Online order history** — list of online orders linked to this customer (links to OnlineOrderDetailPage)
- **Cart preview** — if the customer has an active cart, show what's in it (read-only)

#### 4.3.4 Admin Actions on Online Customers

- **Merge customers** — if a walk-in customer later registers online (same phone/email), admin can merge the two records
- **Suspend online access** — toggle `customer_auth` active status without deleting the customer record
- **Reset password** — admin can trigger a password reset email for an online customer
- **Convert source** — if an online customer starts buying in-store too, their source stays but they appear in both tabs via order history

### 4.4 Product Online Visibility

Add to existing `ProductFormModal.jsx`:
- "Available Online" toggle (`is_online_available`)
- "URL Slug" field (auto-generated from product name)
- "Short Description" for storefront display

### 4.5 Store Settings Page

- Store name, tagline, description
- Logo uploads (primary, icon, dark) via CloudinaryUpload
- Theme colors (primary, secondary, accent, background, text)
- Font family selection
- Homepage hero banners management
- Featured categories & products selection
- Promo bar text
- Contact info & social links
- SEO settings
- Shipping methods configuration
- Payment methods configuration
- Maintenance mode toggle

### 4.6 Sidebar Navigation Update

Add new section to admin sidebar:
```
Online Store
  ├── Orders         → /online-orders
  ├── Store Settings → /store-settings
  └── View Store     → (external link to storefront)
```

---

## Phase 5: Cart ↔ Inventory Integration

### 5.1 Cart → Inventory Checks

When adding items to cart:
- Query `inventory` (or `variant_inventory`) to verify stock availability
- Return error if requested quantity exceeds available stock
- Optionally: reserve stock (decrement `quantity_reserved`) on add-to-cart with TTL

### 5.2 Checkout → Inventory Deduction

When order is placed:
1. Re-verify all item availability
2. Create `online_orders` + `online_order_items` records
3. Deduct inventory (`quantity_on_hand` or create `stock_movements` entries)
4. Record `stock_movements` with `movement_type: 'online_sale'`
5. Clear customer's cart
6. Apply promotion usage if coupon was used (`promotion_usage` table)

### 5.3 Order Cancellation → Inventory Restoration

When admin cancels an order:
1. Restore inventory quantities
2. Record reverse `stock_movements`
3. If coupon was used, decrement `promotion_usage` count

### 5.4 Promotion/Coupon Validation

Reuse existing `promotions` table:
- Validate coupon code against `promotions.promotion_code`
- Check `start_date`, `end_date`, `is_active`
- Check `usage_limit` and `current_usage_count`
- Check `min_purchase_amount`
- Calculate discount based on `promotion_type`
- Support: percentage, fixed_amount, free_shipping

---

## Phase 6: Payment Integration

Two payment methods: **Paystack** (instant online) and **Bank Transfer** (manual confirmation).

### 6.1 Paystack Integration

- Add Paystack server-side SDK to BMS backend
- Initialize transaction on checkout
- Verify payment via webhook or callback
- Update `online_orders.payment_status` and `paid_at`

### 6.2 Paystack Payment Flow

```
Customer selects "Pay Online (Paystack)" → POST /api/store/:slug/checkout
  → Backend creates order (status: PENDING, payment: PENDING)
  → Backend initializes Paystack transaction
  → Returns paymentUrl to frontend
  → Customer redirected to Paystack
  → Customer completes payment
  → Paystack webhook → POST /api/store/webhooks/paystack
  → Backend verifies transaction
  → Updates order: payment_status = PAID, status = CONFIRMED
  → Deducts inventory
  → Sends confirmation email (future)
```

### 6.3 Manual Bank Transfer Payment

Allows customers to pay via direct bank transfer to any of the admin's configured bank channels.

#### 6.3.1 Storefront: Bank Transfer Checkout Flow

```
Customer selects "Bank Transfer" at checkout
  → POST /api/store/:slug/checkout  { paymentMethod: "bank_transfer", bankChannelId: <selected> }
  → Backend creates order (status: PENDING, payment: AWAITING_CONFIRMATION)
  → Response includes: order details + selected bank account info
  → Customer sees "Transfer Instructions" page:
      ┌─────────────────────────────────────────────────┐
      │  Transfer to:                                   │
      │  Bank: First Bank                               │
      │  Account Name: MyStore Ltd                      │
      │  Account Number: 0123456789                     │
      │  Amount: ₦45,000.00                             │
      │  Reference: ORD-20260228-001                    │
      │                                                 │
      │  [Upload Proof of Payment (optional)]           │
      │  [I've Made This Transfer]                      │
      └─────────────────────────────────────────────────┘
  → Customer can optionally upload proof of payment (receipt screenshot)
  → Customer clicks "I've Made This Transfer"
  → Order status shows "Awaiting Payment Confirmation"
```

#### 6.3.2 Backend: Bank Transfer Endpoints

| Endpoint | Purpose |
|---|---|
| `GET /api/store/:slug/bank-channels` | List active bank channels available for transfer (public, no auth) |
| `POST /api/store/:slug/orders/:id/proof-of-payment` | Upload proof of payment image (customer auth, Cloudinary upload) |
| `PUT /api/online-orders/:id/confirm-payment` | Admin confirms manual payment received (admin auth) |
| `PUT /api/online-orders/:id/reject-payment` | Admin rejects payment with reason (admin auth) |

#### 6.3.3 Storefront: Bank Channel Selection UI

At checkout payment step, when "Bank Transfer" is selected:
- Fetch available bank channels from `GET /api/store/:slug/bank-channels`
  - Returns only `is_active = true` channels from the existing `bank_channels` table
  - Shows: bank name, account name, account number, channel type (bank, mobile_money)
- Customer selects which bank account to transfer to
- After order is created, show the selected bank details as transfer instructions

#### 6.3.4 Storefront: Proof of Payment Upload

- On the order confirmation page and in the customer's order detail page
- "Upload Proof of Payment" button (optional)
- Uses Cloudinary upload (new folder: `bms/payments`)
- Accepts images (JPG, PNG) and PDF files
- Stores URL in `online_orders.proof_of_payment`
- Customer can re-upload to replace a previous proof

#### 6.3.5 Admin: Manual Payment Confirmation Workflow

```
Admin opens Online Orders page
  → Sees orders with payment_status = "AWAITING_CONFIRMATION" highlighted
  → Opens order detail
  → Sees:
      - Bank channel the customer selected
      - Proof of payment image (if uploaded) — clickable to view full size
      - Transfer amount expected vs order total
  → Admin verifies payment in their actual bank account
  → Clicks "Confirm Payment":
      → payment_status = PAID
      → payment_confirmed_by = admin user ID
      → payment_confirmed_at = NOW()
      → status = CONFIRMED (triggers inventory deduction)
  → Or clicks "Reject Payment":
      → payment_status = FAILED
      → Admin enters rejection reason
      → Customer can re-upload proof or use a different payment method
```

#### 6.3.6 Payment Status Flow (Bank Transfer)

```
PENDING → AWAITING_CONFIRMATION → PAID → (order proceeds)
                                → FAILED → (customer retries)
```

### 6.4 Storefront: Payment Method Selector Component

Update the storefront `PaymentForm.tsx` to show both options:

```
┌─────────────────────────────────────────────────┐
│  Select Payment Method                          │
│                                                 │
│  ┌──────────────────────┐ ┌──────────────────┐  │
│  │ 💳 Pay Online        │ │ 🏦 Bank Transfer │  │
│  │ (Paystack)           │ │                  │  │
│  │ Instant confirmation │ │ Transfer to our  │  │
│  │                      │ │ bank account     │  │
│  └──────────────────────┘ └──────────────────┘  │
│                                                 │
│  [If Bank Transfer selected:]                   │
│  ┌─────────────────────────────────────────┐    │
│  │  Select Bank Account:                   │    │
│  │  ○ First Bank - 0123456789 (MyStore)    │    │
│  │  ○ GTBank - 9876543210 (MyStore Ltd)    │    │
│  │  ○ MTN MoMo - 08012345678              │    │
│  └─────────────────────────────────────────┘    │
└─────────────────────────────────────────────────┘
```

---

## Phase 7: Deployment & CORS

### 7.1 CORS Configuration

Update BMS backend `ALLOWED_ORIGINS` to include the storefront domain:
```env
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3006,https://store.yourdomain.com
```

### 7.2 Deployment Architecture

- **BMS Backend:** Single Express.js server (existing)
- **BMS Admin Frontend:** Deployed at `admin.yourdomain.com`
- **Storefront:** Deployed at `store.yourdomain.com` or custom domain
- **Database:** Shared PostgreSQL on Neon (existing)

### 7.3 Environment Variables (New)

```env
# BMS Backend - add these
STORE_JWT_SECRET=<separate-secret-for-customer-tokens>
PAYSTACK_SECRET_KEY=<paystack-secret>
PAYSTACK_PUBLIC_KEY=<paystack-public>
STORE_FRONTEND_URL=http://localhost:3006
```

---

## Implementation Order

| Step | Phase | Description | Effort |
|------|-------|-------------|--------|
| 1 | Phase 1 | Create migration for all new tables (incl. customer source column) | Medium |
| 2 | Phase 2.1 | Store auth & session middleware | Small |
| 3 | Phase 2.2 | Store config endpoints | Small |
| 4 | Phase 1.6 | Add `slug`, `is_online_available` to products + backfill slugs | Small |
| 5 | Phase 2.2 | Catalog endpoints (products, categories, search) | Medium |
| 6 | Phase 2.2 | Customer auth endpoints (register, login, password reset, email verify) | Large |
| 7 | Phase 2.2 | Customer profile, account settings, address management endpoints | Medium |
| 8 | Phase 2.2 | Cart endpoints | Medium |
| 9 | Phase 5 | Cart ↔ inventory integration | Medium |
| 10 | Phase 2.2 | Checkout & order endpoints (Paystack + bank transfer) | Large |
| 11 | Phase 6.1 | Paystack payment integration | Medium |
| 12 | Phase 6.3 | Bank transfer payment flow + proof of payment upload | Medium |
| 13 | Phase 3.2 | Storefront API path adjustments | Small |
| 14 | Phase 3.3 | Storefront: customer account pages (forgot password, reset, verify email, settings) | Medium |
| 15 | Phase 3.3 | Storefront: order history enhancements (cancel, status filter, bank transfer proof) | Medium |
| 16 | Phase 3.4 | Data type mapping adjustments | Medium |
| 17 | Phase 3 | Storefront: payment method selector + bank transfer UI | Medium |
| 18 | Phase 4.1 | Admin: Online Orders page (incl. payment confirmation panel) | Large |
| 19 | Phase 4.3 | Admin: Customer CRM tabs (All / Shop / Online) + online customer detail | Medium |
| 20 | Phase 4.5 | Admin: Store Settings page | Medium |
| 21 | Phase 4.4 | Admin: Product online visibility fields | Small |
| 22 | Phase 7 | CORS, env vars, deployment config | Small |

---

## Files to Create (Backend)

```
backend/database/migrations/
  019_create_store_config.sql
  020_create_customer_auth_and_source.sql
  021_create_carts.sql
  022_create_online_orders.sql          (incl. bank transfer & proof of payment columns)
  023_add_product_slug_online.sql

backend/src/middleware/
  storeAuthMiddleware.js
  sessionMiddleware.js

backend/src/controllers/
  storeConfigController.js
  storeCatalogController.js
  storeCartController.js
  storeCustomerController.js
  storeCheckoutController.js
  storeOrderController.js
  onlineOrderController.js              (admin side — incl. payment confirmation)

backend/src/routes/
  storeConfigRoutes.js
  storeCatalogRoutes.js
  storeCartRoutes.js
  storeCustomerRoutes.js
  storeCheckoutRoutes.js
  storeOrderRoutes.js
  onlineOrderRoutes.js                  (admin side)

backend/src/validators/
  storeValidators.js
```

## Files to Create (Admin Frontend)

```
frontend/src/pages/
  OnlineOrdersPage.jsx
  OnlineOrderDetailPage.jsx
  StoreSettingsPage.jsx

frontend/src/api/
  onlineOrders.js
  storeConfig.js
```

## Files to Create (Storefront)

```
store/src/pages/Auth/ForgotPasswordPage.tsx       (forgot password form)
store/src/pages/Auth/ResetPasswordPage.tsx         (reset password with token)
store/src/pages/Auth/VerifyEmailPage.tsx           (email verification landing)
store/src/pages/Account/AccountSettingsPage.tsx    (change password, change email, delete account)
store/src/components/common/EmailVerificationBanner.tsx  (unverified email warning)
```

## Files to Modify (Storefront)

```
store/src/App.tsx                       (add new routes: forgot-password, reset-password, verify-email, account/settings)
store/src/api/client.ts                 (API base URL)
store/src/api/config.ts                 (path prefix)
store/src/api/cart.ts                   (path prefix)
store/src/api/catalog.ts                (verify paths)
store/src/hooks/useAuth.ts              (add forgotPassword, resetPassword, verifyEmail, changePassword, changeEmail, deleteAccount methods)
store/src/components/checkout/PaymentForm.tsx  (add bank transfer option + bank channel selector)
store/src/components/layout/AccountLayout.tsx  (add Settings link to sidebar + email verification banner)
store/src/pages/Checkout/OrderConfirmation.tsx (bank transfer instructions + proof upload)
store/src/pages/Account/ProfilePage.tsx        (show email verification status, account stats)
store/src/pages/Account/OrdersPage.tsx         (add status filter tabs, cancel button, payment badge)
store/src/pages/Account/OrderDetailPage.tsx    (proof of payment upload, order timeline, cancel)
store/src/types/customer.ts             (add new fields: lastLoginAt, totalOrders, totalSpent)
store/vite.config.ts                    (proxy target)
store/.env                              (API URL)
```

## Files to Modify (BMS)

```
backend/src/app.js                      (mount new store routes)
backend/.env                            (new env vars: STORE_JWT_SECRET, PAYSTACK keys)
frontend/src/App.jsx                    (new admin routes)
frontend/src/components/layout/Sidebar.jsx  (new "Online Store" nav section)
frontend/src/components/product/ProductFormModal.jsx  (online toggle + slug)
frontend/src/pages/CustomersPage.jsx    (add All/Shop/Online tabs + source badge)
frontend/src/pages/Dashboard.jsx        (online orders widget + awaiting payment count)
backend/src/controllers/customerController.js  (source filter support)
backend/src/routes/customerRoutes.js    (source query param)
```
