# Deployment Checklist: Product Color & Image Management

## Pre-Deployment

### 1. Code Review
- [ ] All new code reviewed and approved
- [ ] No console.log statements in production code
- [ ] Error handling implemented everywhere
- [ ] Loading states added to all async operations
- [ ] Validation added to all forms

### 2. Testing
- [ ] All unit tests passing
- [ ] All integration tests passing
- [ ] Manual testing completed (see TESTING_GUIDE.md)
- [ ] Edge cases tested
- [ ] Performance testing completed
- [ ] Mobile testing completed
- [ ] Cross-browser testing completed

### 3. Database
- [ ] Migration script tested on staging
- [ ] Backup of production database created
- [ ] Rollback plan documented
- [ ] Indexes verified
- [ ] Foreign key constraints verified

### 4. Documentation
- [ ] API documentation updated
- [ ] User guide created/updated
- [ ] Developer documentation complete
- [ ] Changelog updated
- [ ] README updated

### 5. Security
- [ ] SQL injection tests passed
- [ ] XSS prevention verified
- [ ] CSRF protection enabled
- [ ] Permission checks in place
- [ ] Image URL validation working
- [ ] Rate limiting configured

## Deployment Steps

### Step 1: Backup (CRITICAL)
```bash
# Backup database
pg_dump -U username -d database_name > backup_$(date +%Y%m%d_%H%M%S).sql

# Backup code
git tag -a v1.0.0-pre-color-management -m "Before color management deployment"
git push origin v1.0.0-pre-color-management
```
- [ ] Database backup completed
- [ ] Code tagged in git
- [ ] Backup verified and downloadable

### Step 2: Maintenance Mode (Optional)
```bash
# Enable maintenance mode if needed
# This depends on your setup
```
- [ ] Maintenance mode enabled (if required)
- [ ] Users notified of downtime

### Step 3: Deploy Backend

#### 3.1 Run Database Migration
```bash
# Connect to production database
psql -U username -d database_name -f backend/database/migrations/add_product_colors_and_images.sql
```
- [ ] Migration executed successfully
- [ ] No errors in migration output
- [ ] Tables created: `product_colors`, `product_images_v2`, `inventory_colors`
- [ ] Indexes created
- [ ] Triggers created

#### 3.2 Verify Database Changes
```sql
-- Check tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('product_colors', 'product_images_v2', 'inventory_colors');

-- Check indexes
SELECT indexname FROM pg_indexes 
WHERE tablename IN ('product_colors', 'product_images_v2', 'inventory_colors');

-- Check foreign keys
SELECT conname FROM pg_constraint 
WHERE conrelid IN (
  'product_colors'::regclass, 
  'product_images_v2'::regclass, 
  'inventory_colors'::regclass
);
```
- [ ] All tables exist
- [ ] All indexes created
- [ ] All foreign keys in place

#### 3.3 Deploy Backend Code
```bash
cd backend
git pull origin main
npm install
npm run build  # if applicable
```
- [ ] Code pulled successfully
- [ ] Dependencies installed
- [ ] Build completed (if applicable)

#### 3.4 Restart Backend Server
```bash
# Using PM2
pm2 restart backend

# Or using systemd
sudo systemctl restart backend

# Or using Docker
docker-compose restart backend
```
- [ ] Server restarted
- [ ] Server is running
- [ ] No errors in logs
- [ ] Health check endpoint responding

### Step 4: Deploy Frontend

#### 4.1 Build Frontend
```bash
cd frontend
git pull origin main
npm install
npm run build
```
- [ ] Code pulled successfully
- [ ] Dependencies installed
- [ ] Build completed without errors
- [ ] Build artifacts generated

#### 4.2 Deploy Frontend Build
```bash
# Copy build to web server
# This depends on your deployment method
# Examples:
# - Copy to nginx/apache directory
# - Upload to S3/CloudFront
# - Deploy to Vercel/Netlify
```
- [ ] Build deployed to web server
- [ ] Static files accessible
- [ ] CDN cache cleared (if applicable)

### Step 5: Verification

#### 5.1 API Endpoints
Test each endpoint:
```bash
# Get colors
curl -X GET https://your-domain.com/api/products/1/colors \
  -H "Authorization: Bearer <token>"

# Add color
curl -X POST https://your-domain.com/api/products/1/colors \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"color_name":"Test","color_code":"#FF0000"}'

# Get images
curl -X GET https://your-domain.com/api/products/1/images \
  -H "Authorization: Bearer <token>"

# Get color inventory
curl -X GET https://your-domain.com/api/products/1/color-inventory \
  -H "Authorization: Bearer <token>"
```
- [ ] GET /products/:id/colors working
- [ ] POST /products/:id/colors working
- [ ] PUT /products/:id/colors/:colorId working
- [ ] DELETE /products/:id/colors/:colorId working
- [ ] GET /products/:id/images working
- [ ] POST /products/:id/images working
- [ ] PUT /products/:id/images/:imageId working
- [ ] DELETE /products/:id/images/:imageId working
- [ ] GET /products/:id/color-inventory working
- [ ] POST /products/color-inventory working

#### 5.2 Frontend UI
- [ ] Products page loads
- [ ] Product edit modal opens
- [ ] Color manager visible
- [ ] Image manager visible
- [ ] Can add colors
- [ ] Can upload images
- [ ] Can tag images to colors
- [ ] Can set primary image
- [ ] Product detail page shows color stock
- [ ] No console errors
- [ ] No network errors

#### 5.3 Integration Tests
- [ ] Create product with colors
- [ ] Add images to product
- [ ] Tag images to colors
- [ ] Add stock per color
- [ ] View product detail page
- [ ] Edit existing product
- [ ] Delete color (without inventory)
- [ ] Try to delete color (with inventory) - should fail

### Step 6: Monitoring

#### 6.1 Check Logs
```bash
# Backend logs
tail -f backend/logs/combined.log
tail -f backend/logs/error.log

# System logs
journalctl -u backend -f  # if using systemd
pm2 logs backend          # if using PM2
```
- [ ] No errors in backend logs
- [ ] No errors in system logs
- [ ] API requests logging correctly

#### 6.2 Monitor Performance
- [ ] Database query performance acceptable
- [ ] API response times < 500ms
- [ ] Frontend load time < 3s
- [ ] No memory leaks
- [ ] CPU usage normal

#### 6.3 Check Database
```sql
-- Check for any orphaned records
SELECT COUNT(*) FROM product_colors WHERE product_id NOT IN (SELECT id FROM products);
SELECT COUNT(*) FROM product_images_v2 WHERE product_id NOT IN (SELECT id FROM products);
SELECT COUNT(*) FROM inventory_colors WHERE inventory_id NOT IN (SELECT id FROM inventory);

-- Check data integrity
SELECT p.id, p.product_name, COUNT(pc.id) as color_count, COUNT(pi.id) as image_count
FROM products p
LEFT JOIN product_colors pc ON pc.product_id = p.id
LEFT JOIN product_images_v2 pi ON pi.product_id = p.id
WHERE p.has_colors = true
GROUP BY p.id, p.product_name;
```
- [ ] No orphaned records
- [ ] Data integrity verified
- [ ] Relationships correct

### Step 7: Disable Maintenance Mode
```bash
# Disable maintenance mode
```
- [ ] Maintenance mode disabled
- [ ] Site accessible to users

### Step 8: User Communication
- [ ] Notify users of new features
- [ ] Send release notes
- [ ] Update help documentation
- [ ] Train support team

## Post-Deployment

### Immediate (First Hour)
- [ ] Monitor error logs continuously
- [ ] Check user feedback channels
- [ ] Monitor server resources
- [ ] Test critical user flows
- [ ] Verify no regression issues

### First Day
- [ ] Review all error logs
- [ ] Check performance metrics
- [ ] Gather user feedback
- [ ] Monitor database performance
- [ ] Check for any unusual patterns

### First Week
- [ ] Analyze usage patterns
- [ ] Review performance metrics
- [ ] Collect user feedback
- [ ] Identify any issues
- [ ] Plan improvements

## Rollback Plan

### If Issues Occur

#### 1. Immediate Rollback (Critical Issues)
```bash
# 1. Restore database backup
psql -U username -d database_name < backup_YYYYMMDD_HHMMSS.sql

# 2. Revert code
git checkout v1.0.0-pre-color-management
cd backend && npm install && pm2 restart backend
cd frontend && npm install && npm run build && deploy

# 3. Clear caches
# Clear CDN cache
# Clear browser caches (communicate to users)
```

#### 2. Partial Rollback (Minor Issues)
```bash
# Disable new features via feature flag
# Fix issues and redeploy
```

### Rollback Checklist
- [ ] Database restored
- [ ] Code reverted
- [ ] Services restarted
- [ ] Caches cleared
- [ ] Users notified
- [ ] Issue documented
- [ ] Post-mortem scheduled

## Success Criteria

Deployment is successful when:
- [ ] All API endpoints responding correctly
- [ ] Frontend UI working without errors
- [ ] Users can create products with colors
- [ ] Users can upload and tag images
- [ ] Stock management by color working
- [ ] No critical errors in logs
- [ ] Performance metrics acceptable
- [ ] No user complaints
- [ ] All tests passing in production

## Sign-Off

### Technical Lead
- [ ] Code reviewed and approved
- [ ] Tests verified
- [ ] Deployment plan reviewed
- Name: _________________ Date: _________

### Database Administrator
- [ ] Migration reviewed
- [ ] Backup verified
- [ ] Rollback plan approved
- Name: _________________ Date: _________

### DevOps Engineer
- [ ] Deployment executed
- [ ] Monitoring configured
- [ ] Rollback tested
- Name: _________________ Date: _________

### Product Owner
- [ ] Features verified
- [ ] User acceptance complete
- [ ] Documentation approved
- Name: _________________ Date: _________

## Notes

### Deployment Date/Time
- Scheduled: _________________
- Started: _________________
- Completed: _________________

### Issues Encountered
```
[Document any issues that occurred during deployment]
```

### Lessons Learned
```
[Document lessons learned for future deployments]
```

---

**Deployment Version**: 1.0.0
**Feature**: Product Color & Image Management
**Status**: [ ] Pending [ ] In Progress [ ] Complete [ ] Rolled Back
