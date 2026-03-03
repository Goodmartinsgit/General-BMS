-- 029_link_store_config_to_org.sql
-- Populates store_config.organization_id so custom pages (website_pages)
-- can be resolved from a storefront slug lookup.

UPDATE store_config SET organization_id = 1 WHERE organization_id IS NULL;
