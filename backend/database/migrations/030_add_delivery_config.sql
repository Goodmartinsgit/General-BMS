-- Migration 030: Add delivery_config JSONB column to store_config
-- Stores delivery zones, fees, policies, and page content for the public /delivery page

ALTER TABLE store_config
ADD COLUMN IF NOT EXISTS delivery_config JSONB DEFAULT '{}';

-- Example structure:
-- {
--   "enabled": true,
--   "title": "Delivery Information",
--   "description": "We deliver to the following areas...",
--   "zones": [
--     { "name": "Zone 1 - City Center", "areas": "Downtown, Midtown", "fee": 500, "est_days": "Same day", "is_active": true },
--     { "name": "Zone 2 - Suburbs", "areas": "Northside, Southside", "fee": 1000, "est_days": "1-2 days", "is_active": true }
--   ],
--   "policies": {
--     "min_order": 0,
--     "free_delivery_above": 0,
--     "delivery_hours": "9:00 AM - 6:00 PM",
--     "notes": "Additional delivery notes..."
--   }
-- }
