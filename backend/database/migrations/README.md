# Database Migrations

This directory contains database migration scripts for the General-BMS system.

## Migration Files

### 001_add_eldaved_features.sql
**Date**: 2026-01-31
**Description**: Comprehensive upgrade to add advanced retail features from Eldaved-BMS including:

- **Enhanced Product System**
  - Product types (tile/accessory)
  - Multiple category systems (sizes, use cases, tile types, optional categories)
  - Full-text search with tsvector
  - Calculator integration
  - Featured products
  - Product statistics tracking

- **Tile Calculator Feature**
  - Calculator configurations per product
  - Saved calculations with customer tracking
  - Multi-size calculations
  - Convert calculations to sales/quotations

- **Enhanced Sales Management**
  - Sale reversals and unreversals
  - Sale comments with attachments
  - Cost and profit tracking
  - Referrer commission tracking

- **Stock Management**
  - Enhanced stock transfers (pending → approved → completed flow)
  - Stock damages tracking with approval workflow
  - Stock activity logging

- **Business Operations**
  - Referrers/agents with commission management
  - Performance tasks with pause/resume/extend
  - Quotation system
  - Bank channels and cash flow tracking

- **System Features**
  - Recycle bin for soft deletes
  - Deletion audit trail
  - Purge logs
  - Receipt configuration

## How to Run Migrations

### Option 1: Using psql command line
```bash
psql -U your_username -d your_database -f backend/database/migrations/001_add_eldaved_features.sql
```

### Option 2: Using Node.js pg client
```javascript
const { Pool } = require('pg');
const fs = require('fs');

const pool = new Pool({
  user: 'your_username',
  host: 'localhost',
  database: 'your_database',
  password: 'your_password',
  port: 5432,
});

const migrationSQL = fs.readFileSync('backend/database/migrations/001_add_eldaved_features.sql', 'utf8');
await pool.query(migrationSQL);
```

### Option 3: Full schema reset (Development only!)
```bash
# WARNING: This will drop and recreate the entire database
psql -U your_username -d your_database -f backend/database/schema.sql
```

## Migration Notes

1. **Backup First**: Always backup your database before running migrations
   ```bash
   pg_dump -U your_username your_database > backup_$(date +%Y%m%d_%H%M%S).sql
   ```

2. **Extensions Required**:
   - `uuid-ossp` (for UUID generation)
   - `pg_trgm` (for full-text search)

3. **Seed Data**: The migration includes default seed data for:
   - Tile sizes (30x30, 40x40, 60x60, 30x60, 80x80)
   - Use cases (Floor, Wall, Outdoor, Kitchen, Bathroom)
   - Tile types (Ceramic, Porcelain, Vitrified, Granite, Marble)
   - Default receipt config

4. **Automatic Updates**:
   - Search vectors are auto-generated for existing products
   - Customer codes are auto-generated for existing customers
   - Main branch flag is set for the first branch if none exists

5. **Foreign Keys**: All new tables have proper foreign key constraints with cascade deletes where appropriate

## Post-Migration Steps

1. **Verify Extensions**:
   ```sql
   SELECT * FROM pg_extension WHERE extname IN ('uuid-ossp', 'pg_trgm');
   ```

2. **Check New Tables**:
   ```sql
   SELECT table_name FROM information_schema.tables
   WHERE table_schema = 'public'
   ORDER BY table_name;
   ```

3. **Verify Triggers**:
   ```sql
   SELECT trigger_name, event_object_table
   FROM information_schema.triggers
   WHERE trigger_schema = 'public';
   ```

4. **Test Search Functionality**:
   ```sql
   SELECT product_name, search_vector
   FROM products
   WHERE search_vector IS NOT NULL
   LIMIT 5;
   ```

## Rollback

If you need to rollback this migration, you can:

1. Restore from backup:
   ```bash
   psql -U your_username -d your_database < backup_file.sql
   ```

2. Or manually drop new tables (not recommended):
   ```sql
   DROP TABLE IF EXISTS purge_logs CASCADE;
   DROP TABLE IF EXISTS deletion_audit_trail CASCADE;
   DROP TABLE IF EXISTS recycle_bin CASCADE;
   -- ... (drop all new tables)
   ```

## Support

For issues or questions about migrations, contact the development team.
