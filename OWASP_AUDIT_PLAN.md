# OWASP Top 10 Security Audit & Remediation Plan — General BMS

## Context

The General BMS codebase (Node.js/Express backend + React frontend + PostgreSQL) has been audited against the OWASP Top 10. Multiple critical vulnerabilities were identified including exposed credentials, missing input validation, broken access control, unrestricted CORS, and no rate limiting. This plan addresses all findings in priority order.

**SQL injection is already well-protected** — parameterized queries are used throughout. No active file upload vulnerabilities exist.

---

## PHASE 1: Critical Fixes (Immediate Security Risks)

### 1.1 Rotate & Secure All Credentials
**OWASP**: A07 — Identification and Authentication Failures | **CRITICAL**

| File | Change |
|------|--------|
| `backend/.env` | Rotate DB password (exposed: `npg_YZA3cqtGof4e`), generate strong JWT_SECRET (≥64 chars via `crypto.randomBytes(64).toString('hex')`), add `ALLOWED_ORIGINS` |
| `backend/src/scripts/create_super_admin.js` | Remove hardcoded `AdminPassword123!`, read from `process.env.ADMIN_PASSWORD` or `process.argv[2]` |
| `backend/src/scripts/hash_password.js` | Same — remove hardcoded password |
| **New**: `backend/.env.example` | Create template with placeholder values, no real secrets |

### 1.2 Add Rate Limiting
**OWASP**: A07 — Identification and Authentication Failures | **CRITICAL**

- **Install**: `express-rate-limit`
- **New file**: `backend/src/middleware/rateLimiter.js`
  - Global limiter: 100 req / 15 min per IP
  - Auth limiter: 5 req / 15 min per IP (for `/api/auth/login`, `/api/auth/register`)
- **Modify**: `backend/src/app.js` — apply both limiters

### 1.3 Restrict CORS Origins
**OWASP**: A05 — Security Misconfiguration | **CRITICAL**

- **Modify**: `backend/src/app.js` (line 39) — replace `cors()` with whitelisted origins from `process.env.ALLOWED_ORIGINS`, credentials enabled

### 1.4 Fix SSL Certificate Verification
**OWASP**: A02 — Cryptographic Failures | **CRITICAL**

- **Modify**: `backend/src/config/db.js` (line 7) — set `rejectUnauthorized: true` in production, `false` only in development

---

## PHASE 2: Authentication & Authorization Hardening

### 2.1 Implement Refresh Token Mechanism
**OWASP**: A07 — Identification and Authentication Failures | **HIGH**

| File | Change |
|------|--------|
| **New**: `backend/database/migrations/006_create_refresh_tokens.sql` | `refresh_tokens` table: `id`, `user_id`, `token_hash`, `expires_at`, `created_at`, `revoked_at` |
| `backend/src/controllers/authController.js` | Shorten access token to 15m, generate refresh token (7d) as httpOnly/Secure/SameSite=Strict cookie |
| `backend/src/routes/authRoutes.js` | Add `/refresh` and `/logout` endpoints |
| `frontend/src/api/axios.js` | Add 401 response interceptor → auto-refresh |
| `frontend/src/context/AuthContext.jsx` | On mount, call `/refresh` instead of reading localStorage |

### 2.2 Apply Permission Middleware to ALL Routes
**OWASP**: A01 — Broken Access Control | **CRITICAL**

- **Reference**: `backend/src/middleware/permissionMiddleware.js` (already works, used in `budgetRoutes.js`)
- **Modify**: All 30 route files in `backend/src/routes/` — add `authorize('permission_name')` to every endpoint:
  - `userRoutes.js`: `manage_users`
  - `branchRoutes.js`: `manage_branches`
  - `salesRoutes.js`: `create_sales`, `reverse_sales`
  - `expenseRoutes.js`: `manage_expenses`, `delete_expenses`
  - `stockRoutes.js`: `manage_stock`, `approve_stock_transfers`
  - `productRoutes.js`: `manage_products`
  - `customerRoutes.js`: `manage_customers`
  - `supplierRoutes.js`: `manage_suppliers`
  - `recycleBinRoutes.js`: `manage_recycle_bin`
  - `settingsRoutes.js`: `manage_settings`
  - `bankRoutes.js`: `manage_banks`
  - GET routes: `view_*` permissions

### 2.3 Add Backend Password Policy
**OWASP**: A07 | **MEDIUM**

- **Modify**: `backend/src/controllers/authController.js` — enforce min 8 chars, uppercase, lowercase, digit, special char
- **Modify**: `backend/src/controllers/userController.js` — same for user creation

---

## PHASE 3: Input Validation & Data Integrity

### 3.1 Create Joi Validation Schemas
**OWASP**: A03 — Injection | **CRITICAL**

Joi is installed but unused. Create:

| New File | Purpose |
|----------|---------|
| `backend/src/middleware/validate.js` | Generic validation middleware wrapper |
| `backend/src/validators/authSchemas.js` | Login/register validation |
| `backend/src/validators/userSchemas.js` | User CRUD validation |
| `backend/src/validators/productSchemas.js` | Product CRUD validation |
| `backend/src/validators/salesSchemas.js` | Sale creation validation |
| `backend/src/validators/expenseSchemas.js` | Expense validation |
| `backend/src/validators/stockSchemas.js` | Stock transfer/damage validation |
| `backend/src/validators/customerSchemas.js` | Customer validation |
| `backend/src/validators/supplierSchemas.js` | Supplier validation |
| `backend/src/validators/branchSchemas.js` | Branch validation |
| `backend/src/validators/bankSchemas.js` | Bank channel validation |
| `backend/src/validators/quotationSchemas.js` | Quotation validation |
| `backend/src/validators/returnsSchemas.js` | Returns validation |
| `backend/src/validators/settingsSchemas.js` | Settings validation |

Apply `validate(schema)` middleware to every POST/PUT route.

### 3.2 Validate Query Parameters
**OWASP**: A03 | **MEDIUM**

- Create Joi schemas for query params (pagination, filters, date ranges, sort fields)
- Apply `validate(schema, 'query')` to GET routes with filters

---

## PHASE 4: Security Headers & Configuration

### 4.1 Enable Content Security Policy
**OWASP**: A05 — Security Misconfiguration | **HIGH**

- **Modify**: `backend/src/app.js` (lines 42-44) — replace `contentSecurityPolicy: false` with proper CSP directives

### 4.2 Sanitize Error Responses
**OWASP**: A04 — Insecure Design | **HIGH**

- **New file**: `backend/src/middleware/errorHandler.js` — centralized error handler, generic messages to clients, full details only in dev
- **Modify**: All ~30 controllers — replace `res.status(500).json({ message: err.message })` with generic `'Server error'` or `next(err)` (~90 instances)

### 4.3 Environment-Aware Morgan Logging
**OWASP**: A09 | **MEDIUM**

- **Modify**: `backend/src/app.js` (line 45) — use `'combined'` format in production, `'dev'` in development

### 4.4 Add Startup Environment Validation
**OWASP**: A05 | **MEDIUM**

- **New file**: `backend/src/config/envValidator.js` — check required env vars exist, JWT_SECRET length ≥32, no placeholder values
- **Modify**: `backend/server.js` — call validator after `dotenv.config()`

### 4.5 CSRF Protection
**OWASP**: A01 | **HIGH**

- Use `SameSite=Strict` on refresh token cookie (from Phase 2.1)
- Add Origin/Referer header validation middleware for state-changing requests

---

## PHASE 5: Frontend Security

### 5.1 Move Token Storage to Memory
**OWASP**: A07 | **HIGH**

- **Modify**: `frontend/src/context/AuthContext.jsx` — remove all `localStorage.getItem/setItem('token')`, keep token in React state only
- **Modify**: `frontend/src/api/axios.js` — remove localStorage read, get token from auth context
- On page refresh: call `/api/auth/refresh` to restore session from httpOnly cookie

### 5.2 Fix XSS in Receipt Printing
**OWASP**: A03 — Injection (XSS) | **HIGH**

- **Modify**: `frontend/src/components/receipt/ReceiptPreviewModal.jsx` (line 106) — replace `innerHTML` injection with `cloneNode(true)` + `document.importNode`, or use `react-to-print`

### 5.3 Implement Frontend Route-Level RBAC
**OWASP**: A01 — Broken Access Control | **MEDIUM**

- **Modify**: `frontend/src/App.jsx` — create `RoleProtectedRoute` component that checks user permissions
- Wrap admin routes (Users, Branches, Settings, Recycle Bin) with permission checks

### 5.4 Replace Hardcoded API URLs
**OWASP**: A05 | **MEDIUM**

- **New file**: `frontend/.env` with `VITE_API_URL=http://localhost:5000/api`
- **Modify**: `frontend/src/api/axios.js` — use `import.meta.env.VITE_API_URL`
- **Modify**: `frontend/src/pages/BranchesPage.jsx`, `InventoryPage.jsx` — use shared axios instance instead of hardcoded URLs

### 5.5 Strip Console Logs in Production
**OWASP**: A09 | **LOW**

- **Modify**: `frontend/vite.config.js` — add terser options with `drop_console: true, drop_debugger: true`

---

## PHASE 6: Logging, Monitoring & Audit

### 6.1 Configure Winston Logger
**OWASP**: A09 — Security Logging and Monitoring Failures | **MEDIUM**

- **New file**: `backend/src/config/logger.js` — structured JSON logging, file + console transports
- **Modify**: All backend files — replace `console.log/error` with `logger.info/error`

### 6.2 Add Audit Trail
**OWASP**: A09 | **MEDIUM**

- **New migration**: `backend/database/migrations/007_create_audit_log.sql` — `audit_logs` table with user, action, resource, IP, timestamp
- **New file**: `backend/src/utils/auditLog.js` — utility to log critical operations
- **Modify**: Key controllers — add audit calls for: login success/failure, user CRUD, sale creation/reversal, expense changes, stock transfers, settings changes

---

## PHASE 7: Verification & Testing

1. **Credential rotation**: Confirm old DB password and JWT_SECRET no longer work
2. **Rate limiting**: Send 6+ login requests in 15 min → confirm 429 response
3. **CORS**: Request from non-whitelisted origin → confirm rejection
4. **Authorization**: Staff user hits admin endpoints → confirm 403
5. **Input validation**: Malformed payloads → confirm 400 with validation errors
6. **Error leakage**: Trigger server error → confirm no stack traces or internal details
7. **Token storage**: Inspect devtools → confirm no JWT in localStorage
8. **XSS**: Insert `<script>alert('xss')</script>` as customer name, print receipt → confirm no execution
9. **Frontend RBAC**: Non-admin navigates to `/users` → confirm redirect
10. **Run `npm audit`** on both frontend and backend to catch dependency vulnerabilities

---

## New Files Summary

| File | Purpose |
|------|---------|
| `backend/src/middleware/rateLimiter.js` | Rate limiting |
| `backend/src/middleware/validate.js` | Joi validation wrapper |
| `backend/src/middleware/errorHandler.js` | Centralized error handling |
| `backend/src/config/logger.js` | Winston logger |
| `backend/src/config/envValidator.js` | Startup env checks |
| `backend/src/utils/auditLog.js` | Audit trail utility |
| `backend/src/validators/*.js` | ~14 Joi schema files |
| `backend/database/migrations/006_create_refresh_tokens.sql` | Refresh tokens table |
| `backend/database/migrations/007_create_audit_log.sql` | Audit log table |
| `backend/.env.example` | Env template |
| `frontend/.env` | Frontend env vars |

## Key Existing Files Modified

| File | Changes |
|------|---------|
| `backend/src/app.js` | CORS, CSP, rate limiting, morgan, error handler |
| `backend/src/config/db.js` | SSL fix, logger |
| `backend/src/controllers/authController.js` | Refresh tokens, password policy, shorter expiry |
| `backend/src/routes/*.js` (all 30) | Add `authorize()` + `validate()` middleware |
| `backend/src/controllers/*.js` (all 30) | Remove err.message leaks, use logger |
| `backend/server.js` | Env validation |
| `frontend/src/context/AuthContext.jsx` | Remove localStorage, memory-only tokens |
| `frontend/src/api/axios.js` | Env var URL, refresh interceptor |
| `frontend/src/App.jsx` | RoleProtectedRoute |
| `frontend/src/components/receipt/ReceiptPreviewModal.jsx` | Fix innerHTML XSS |
| `frontend/vite.config.js` | Strip console in prod |
