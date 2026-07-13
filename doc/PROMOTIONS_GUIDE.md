# Promotions & Discounts System - Quick Guide

## 🎯 Overview

The Promotions Controller enables powerful discount campaigns for ANY retail business. Support for percentage discounts, fixed amounts, BOGO offers, bulk discounts, coupon codes, and time-based promotions.

---

## 🎨 Promotion Types Supported

### 1. **Percentage Discount**
```javascript
// Example: 20% off
{
  "promotion_type": "percentage",
  "discount_percentage": 20
}
```

### 2. **Fixed Amount Discount**
```javascript
// Example: $50 off
{
  "promotion_type": "fixed_amount",
  "discount_amount": 50
}
```

### 3. **BOGO (Buy X Get Y Free)**
```javascript
// Example: Buy 2 Get 1 Free
{
  "promotion_type": "bogo",
  "buy_quantity": 2,
  "get_quantity": 1
}
```

### 4. **Bulk Discount**
```javascript
// Example: Buy 10+ items, get 15% off
{
  "promotion_type": "bulk_discount",
  "min_quantity": 10,
  "discount_percentage": 15
}
```

---

## 📋 API Endpoints (10 Total)

### CRUD Operations
```javascript
GET    /api/promotions              // List all promotions
GET    /api/promotions/:id          // Get single promotion
POST   /api/promotions              // Create promotion
PUT    /api/promotions/:id          // Update promotion
DELETE /api/promotions/:id          // Delete promotion
PATCH  /api/promotions/:id/toggle   // Activate/deactivate
```

### Validation & Application
```javascript
POST   /api/promotions/validate     // Validate coupon code
POST   /api/promotions/apply        // Apply to sale (internal)
```

### Analytics
```javascript
GET    /api/promotions/statistics         // Overall stats
GET    /api/promotions/:id/performance    // Single promo performance
```

---

## 🚀 Usage Examples

### Example 1: Weekend Sale (20% Off)
```javascript
POST /api/promotions
{
  "promotion_code": "WEEKEND20",
  "promotion_name": "Weekend Sale",
  "description": "Get 20% off all products this weekend!",
  "promotion_type": "percentage",
  "discount_percentage": 20,
  "start_date": "2026-02-01T00:00:00",
  "end_date": "2026-02-02T23:59:59",
  "applicable_to": "all",
  "is_active": true
}
```

### Example 2: New Customer Discount
```javascript
POST /api/promotions
{
  "promotion_code": "WELCOME50",
  "promotion_name": "New Customer Welcome",
  "description": "$50 off your first purchase",
  "promotion_type": "fixed_amount",
  "discount_amount": 50,
  "min_purchase_amount": 200,
  "start_date": "2026-01-01T00:00:00",
  "end_date": "2026-12-31T23:59:59",
  "usage_per_customer": 1,
  "applicable_to": "all"
}
```

### Example 3: Buy 2 Get 1 Free (BOGO)
```javascript
POST /api/promotions
{
  "promotion_code": "BOGO3",
  "promotion_name": "Buy 2 Get 1 Free",
  "description": "Buy any 2 items, get 1 free!",
  "promotion_type": "bogo",
  "buy_quantity": 2,
  "get_quantity": 1,
  "start_date": "2026-02-01T00:00:00",
  "end_date": "2026-02-28T23:59:59",
  "applicable_to": "categories",
  "applicable_categories": [1, 2, 3]
}
```

### Example 4: Bulk Purchase Discount
```javascript
POST /api/promotions
{
  "promotion_code": "BULK15",
  "promotion_name": "Bulk Discount",
  "description": "Buy 10 or more items, save 15%",
  "promotion_type": "bulk_discount",
  "min_quantity": 10,
  "discount_percentage": 15,
  "start_date": "2026-01-01T00:00:00",
  "end_date": "2026-12-31T23:59:59",
  "applicable_to": "all"
}
```

### Example 5: Product-Specific Promotion
```javascript
POST /api/promotions
{
  "promotion_code": "CLEARANCE30",
  "promotion_name": "Clearance Sale",
  "description": "30% off clearance items",
  "promotion_type": "percentage",
  "discount_percentage": 30,
  "start_date": "2026-02-01T00:00:00",
  "end_date": "2026-02-15T23:59:59",
  "applicable_to": "products",
  "applicable_products": [101, 102, 103, 104]
}
```

### Example 6: VIP Customer Exclusive
```javascript
POST /api/promotions
{
  "promotion_code": "VIP25",
  "promotion_name": "VIP Exclusive",
  "description": "25% off for VIP customers",
  "promotion_type": "percentage",
  "discount_percentage": 25,
  "start_date": "2026-01-01T00:00:00",
  "end_date": "2026-12-31T23:59:59",
  "applicable_to": "customers",
  "applicable_customers": [1, 2, 3, 4, 5],
  "usage_per_customer": 5
}
```

### Example 7: Branch-Specific Promotion
```javascript
POST /api/promotions
{
  "promotion_code": "GRANDOPEN",
  "promotion_name": "Grand Opening",
  "description": "Grand opening special at new branch",
  "promotion_type": "percentage",
  "discount_percentage": 50,
  "max_discount_amount": 100,
  "start_date": "2026-02-01T00:00:00",
  "end_date": "2026-02-07T23:59:59",
  "applicable_to": "branches",
  "applicable_branches": [3]
}
```

---

## 🔍 Validating Promotions

Before applying a promotion to a sale, validate it:

```javascript
POST /api/promotions/validate
{
  "promotion_code": "WEEKEND20",
  "customer_id": 1,
  "subtotal": 500,
  "quantity": 5,
  "product_ids": [1, 2, 3],
  "category_ids": [1],
  "branch_id": 1
}

// Response if valid:
{
  "valid": true,
  "promotion": { ... },
  "discount": 100,
  "final_amount": 400,
  "message": "Promotion is valid"
}

// Response if invalid:
{
  "valid": false,
  "message": "Minimum purchase amount of 1000 required"
}
```

---

## 📊 Analytics & Reporting

### Get Overall Promotion Statistics
```javascript
GET /api/promotions/statistics

// Response:
{
  "total_promotions": 15,
  "active_promotions": 5,
  "upcoming_promotions": 3,
  "expired_promotions": 7,
  "percentage_promotions": 8,
  "fixed_amount_promotions": 4,
  "bogo_promotions": 2,
  "bulk_discount_promotions": 1,
  "total_usage_count": 234,
  "total_discount_given": 12500,
  "average_discount": 53.42,
  "total_redemptions": 234
}
```

### Get Single Promotion Performance
```javascript
GET /api/promotions/1/performance

// Response:
{
  "id": 1,
  "promotion_code": "WEEKEND20",
  "promotion_name": "Weekend Sale",
  "total_uses": 45,
  "unique_customers": 38,
  "total_discount_given": 2340,
  "average_discount_per_use": 52,
  "total_sales": 45
}
```

---

## 🎯 Advanced Features

### 1. **Usage Limits**
```javascript
{
  "usage_limit": 100,              // Max 100 total uses
  "usage_per_customer": 1          // Each customer can use once
}
```

### 2. **Minimum Requirements**
```javascript
{
  "min_purchase_amount": 500,      // Minimum cart value
  "min_quantity": 3                // Minimum items
}
```

### 3. **Maximum Discount Cap**
```javascript
{
  "discount_percentage": 50,
  "max_discount_amount": 200       // Cap discount at $200
}
```

### 4. **Stackable Promotions**
```javascript
{
  "stackable": true,               // Can be combined with other promos
  "priority": 1                    // Applied in priority order
}
```

---

## ✅ Validation Rules

The system automatically validates:

✅ **Date Range**: Promotion must be within active dates
✅ **Usage Limits**: Global and per-customer limits enforced
✅ **Minimum Requirements**: Purchase amount and quantity checked
✅ **Applicability**: Products, categories, customers, branches verified
✅ **Active Status**: Only active promotions can be used
✅ **Expiry**: Expired promotions rejected

---

## 🔄 Promotion Lifecycle

```
1. Create Promotion (status: upcoming)
   ↓
2. Start Date Reached (status: active)
   ↓
3. Customers Use Promotion (usage tracked)
   ↓
4. End Date Reached or Limit Hit (status: expired/exhausted)
   ↓
5. Performance Analysis
```

---

## 💡 Real-World Scenarios

### Clothing Store
- **Happy Hour**: 30% off 5PM-7PM daily
- **BOGO**: Buy 2 jeans, get 1 free
- **Clearance**: 50% off last season items

### Electronics Shop
- **Student Discount**: 10% off with student ID
- **Bundle Deal**: Buy laptop + accessories, save $100
- **Trade-in**: $50 off when trading in old device

### Grocery Store
- **Bulk Buy**: Buy 5kg rice, get 15% off
- **Loyalty**: Members get 5% off all purchases
- **Weekend Special**: Fresh produce 20% off

### Restaurant
- **Lunch Special**: 25% off 12PM-2PM
- **Family Deal**: Order for 4+, get free dessert
- **Birthday**: Free meal on your birthday

---

## 🚨 Common Pitfalls to Avoid

❌ **DON'T** set end_date before start_date
❌ **DON'T** create overlapping codes
❌ **DON'T** forget to set usage limits for limited-time offers
❌ **DON'T** apply promotions without validation first
❌ **DON'T** delete promotions that have been used (deactivate instead)

✅ **DO** validate dates before creating
✅ **DO** use unique, memorable codes
✅ **DO** set appropriate minimum requirements
✅ **DO** track performance regularly
✅ **DO** deactivate instead of delete

---

## 🎉 Benefits

1. **Increase Sales**: Drive purchases with attractive offers
2. **Customer Acquisition**: Welcome new customers with discounts
3. **Inventory Clearance**: Move old stock quickly
4. **Loyalty Building**: Reward repeat customers
5. **Competitive Edge**: Match or beat competitor offers
6. **Seasonal Campaigns**: Holiday and event-based promotions
7. **Data-Driven**: Track what works with analytics

---

## 📝 Next Steps

1. Create your first promotion
2. Test the validation endpoint
3. Integrate with your POS/sales system
4. Monitor performance via analytics
5. Adjust based on results

**Pro Tip**: Start with simple percentage discounts, then experiment with BOGO and bulk discounts to see what resonates with your customers!

---

## 🔗 Integration with Sales

When creating a sale, the sales controller should:

1. **Validate** the promotion code
2. **Calculate** the discount
3. **Apply** the promotion
4. **Track** usage automatically

This is handled automatically when you integrate the promotions with the sales API (coming next)!
