-- Migration 055: Granular permissions for Customers and Online Orders
-- Replaces coarse manage_customers / manage_online_orders with fine-grained permissions.
-- Backfills new permission keys from existing flags so existing roles keep working.

-- ═══════════════════════════════════════════════════════════════════
-- 1. Backfill Customer CRUD from manage_customers
-- ═══════════════════════════════════════════════════════════════════
UPDATE roles
SET permissions = permissions
  || jsonb_build_object(
       'create_customers', true,
       'update_customers', true,
       'delete_customers', true
     )
WHERE (permissions ->> 'manage_customers')::boolean = true
  AND NOT (permissions ? 'create_customers');

-- ═══════════════════════════════════════════════════════════════════
-- 2. Backfill Online-Order actions from manage_online_orders
-- ═══════════════════════════════════════════════════════════════════
UPDATE roles
SET permissions = permissions
  || jsonb_build_object(
       'process_online_orders', true,
       'verify_order_payment',  true,
       'update_order_tracking',  true,
       'edit_order_notes',       true,
       'manage_change_requests', true
     )
WHERE (permissions ->> 'manage_online_orders')::boolean = true
  AND NOT (permissions ? 'process_online_orders');

-- ═══════════════════════════════════════════════════════════════════
-- 3. Ensure Super Admin has every new permission
-- ═══════════════════════════════════════════════════════════════════
UPDATE roles
SET permissions = permissions
  || '{
       "create_customers": true,
       "update_customers": true,
       "delete_customers": true,
       "process_online_orders": true,
       "verify_order_payment": true,
       "update_order_tracking": true,
       "edit_order_notes": true,
       "manage_change_requests": true
     }'::jsonb
WHERE role_name = 'Super Admin';
