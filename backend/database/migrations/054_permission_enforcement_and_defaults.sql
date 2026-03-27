-- Migration 054: Add new permissions and set default role permission presets
-- New permissions: view_dashboard, access_pos, apply_discounts,
--   view_online_orders, manage_online_orders, view_online_store, manage_online_store,
--   view_audit_logs
--
-- Also backfills default permissions for Admin (level 2), Manager (level 3),
-- and Staff (level 4) roles so they match the Eldaved-BMS retail module mapping.

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. Update Super Admin (level 1) — add the 8 new permission keys
-- ─────────────────────────────────────────────────────────────────────────────
UPDATE roles
SET permissions = permissions
  || '{"view_dashboard": true}'::jsonb
  || '{"access_pos": true}'::jsonb
  || '{"apply_discounts": true}'::jsonb
  || '{"view_online_orders": true}'::jsonb
  || '{"manage_online_orders": true}'::jsonb
  || '{"view_online_store": true}'::jsonb
  || '{"manage_online_store": true}'::jsonb
  || '{"view_audit_logs": true}'::jsonb
WHERE role_level = 1;

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. Admin (level 2) — full operational access (mirrors retail_admin)
--    Gets everything except the special "admin" bypass flag
-- ─────────────────────────────────────────────────────────────────────────────
UPDATE roles
SET permissions = '{
  "view_dashboard": true,
  "view_analytics": true,
  "view_reports": true,
  "view_dashboard_financials": true,
  "access_pos": true,
  "apply_discounts": true,
  "view_sales": true,
  "view_all_sales": true,
  "create_sales": true,
  "reverse_sales": true,
  "view_products": true,
  "manage_products": true,
  "view_inventory": true,
  "manage_inventory": true,
  "view_stock": true,
  "manage_stock": true,
  "approve_stock_transfers": true,
  "view_customers": true,
  "manage_customers": true,
  "view_users": true,
  "manage_users": true,
  "view_suppliers": true,
  "manage_suppliers": true,
  "view_vendors": true,
  "manage_vendors": true,
  "view_purchase_orders": true,
  "manage_purchase_orders": true,
  "view_invoices": true,
  "manage_invoices": true,
  "view_quotations": true,
  "manage_quotations": true,
  "view_payments": true,
  "manage_payments": true,
  "view_expenses": true,
  "manage_expenses": true,
  "delete_expenses": true,
  "view_bills": true,
  "manage_bills": true,
  "view_banks": true,
  "manage_banks": true,
  "view_budgets": true,
  "manage_budgets": true,
  "view_accounting": true,
  "manage_accounting": true,
  "view_promotions": true,
  "manage_promotions": true,
  "view_price_tiers": true,
  "manage_price_tiers": true,
  "view_wholesale_orders": true,
  "manage_wholesale_orders": true,
  "view_returns": true,
  "manage_returns": true,
  "view_receipts": true,
  "manage_receipts": true,
  "manage_payroll": true,
  "view_performance_tasks": true,
  "manage_performance_tasks": true,
  "view_tasks": true,
  "manage_tasks": true,
  "view_branches": true,
  "manage_branches": true,
  "view_referrers": true,
  "manage_referrers": true,
  "view_online_orders": true,
  "manage_online_orders": true,
  "view_online_store": true,
  "manage_online_store": true,
  "view_settings": true,
  "manage_settings": true,
  "view_audit_logs": true,
  "view_recycle_bin": true,
  "manage_recycle_bin": true
}'::jsonb
WHERE role_level = 2;

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. Manager (level 3) — branch_admin equivalent
--    Operational access: view most, manage sales/inventory/customers,
--    no system settings, no user management, no accounting/finance admin
-- ─────────────────────────────────────────────────────────────────────────────
UPDATE roles
SET permissions = '{
  "view_dashboard": true,
  "view_analytics": true,
  "view_reports": true,
  "view_dashboard_financials": true,
  "access_pos": true,
  "apply_discounts": true,
  "view_sales": true,
  "view_all_sales": true,
  "create_sales": true,
  "reverse_sales": true,
  "view_products": true,
  "manage_products": true,
  "view_inventory": true,
  "manage_inventory": true,
  "view_stock": true,
  "manage_stock": true,
  "view_customers": true,
  "manage_customers": true,
  "view_suppliers": true,
  "view_purchase_orders": true,
  "manage_purchase_orders": true,
  "view_quotations": true,
  "manage_quotations": true,
  "view_payments": true,
  "view_expenses": true,
  "manage_expenses": true,
  "view_promotions": true,
  "view_price_tiers": true,
  "view_wholesale_orders": true,
  "manage_wholesale_orders": true,
  "view_returns": true,
  "manage_returns": true,
  "view_receipts": true,
  "manage_receipts": true,
  "view_performance_tasks": true,
  "view_tasks": true,
  "manage_tasks": true,
  "view_branches": true,
  "view_referrers": true,
  "manage_referrers": true,
  "view_online_orders": true,
  "manage_online_orders": true
}'::jsonb
WHERE role_level = 3;

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. Staff (level 4) — branch_staff equivalent
--    Basic operational access: POS, own sales, view products/customers
-- ─────────────────────────────────────────────────────────────────────────────
UPDATE roles
SET permissions = '{
  "view_dashboard": true,
  "access_pos": true,
  "view_sales": true,
  "create_sales": true,
  "view_products": true,
  "view_inventory": true,
  "view_stock": true,
  "view_customers": true,
  "view_returns": true,
  "view_receipts": true,
  "view_performance_tasks": true,
  "view_tasks": true
}'::jsonb
WHERE role_level = 4;
