# Product Color & Image Management System

## 📋 Table of Contents

1. [Overview](#overview)
2. [Quick Start](#quick-start)
3. [Features](#features)
4. [Documentation](#documentation)
5. [Architecture](#architecture)
6. [Installation](#installation)
7. [Usage](#usage)
8. [API Reference](#api-reference)
9. [Contributing](#contributing)
10. [Support](#support)

## 🎯 Overview

A comprehensive system for managing product colors, multiple images, and color-specific inventory tracking in the General BMS platform. This system enables:

- **Dynamic Color Management**: Add, edit, and remove product colors on the fly
- **Multi-Image Support**: Upload multiple images per product with color tagging
- **Color-Based Inventory**: Track stock separately for each color variant
- **Store Integration**: Ready-to-use components for e-commerce storefronts

### Key Benefits

✅ **Flexible**: Works with or without colors  
✅ **Scalable**: Handles unlimited colors and images  
✅ **Performant**: Optimized database queries and indexes  
✅ **Secure**: Permission-based access with validation  
✅ **Accessible**: WCAG compliant with keyboard navigation  
✅ **Mobile-Ready**: Responsive design for all devices  

## 🚀 Quick Start

### Prerequisites

- PostgreSQL 12+
- Node.js 14+
- React 17+
- Cloudinary account (for image uploads)

### Installation (5 minutes)

1. **Run Database Migration**
   ```bash
   # Windows
   setup_color_management.bat
   
   # Unix/Linux/Mac
   chmod +x setup_color_management.sh
   ./setup_color_management.sh
   ```

2. **Restart Backend**
   ```bash
   cd backend
   npm restart
   ```

3. **Rebuild Frontend**
   ```bash
   cd frontend
   npm run build
   ```

4. **Test It Out**
   - Navigate to `/products`
   - Click "Edit" on any product
   - Try adding colors and images!

## ✨ Features

### Color Management
- Add unlimited colors with visual color picker
- Edit color names and hex codes
- Reorder colors by display priority
- Activate/deactivate colors
- Safety checks prevent deleting colors with inventory

### Image Management
- Upload multiple images via Cloudinary
- Tag images to specific colors or "All Colors"
- Set primary image for each color
- Drag-and-drop reordering
- Add alt text for accessibility
- Visual grid with hover controls

### Stock Management
- Track inventory per color per branch
- Automatic total stock calculation
- Visual color indicators
- Inline editing interface
- Reserved vs available quantities
- Real-time updates

### Store Integration
- Filter images by selected color
- Show stock availability per color
- Disable out-of-stock colors
- Add to cart with color selection
- Sample component included

## 📚 Documentation

### For Developers
- **[Quick Reference](QUICK_REFERENCE.md)** - Fast lookup for common tasks
- **[Implementation Guide](PRODUCT_COLOR_IMAGE_GUIDE.md)** - Detailed technical documentation
- **[API Reference](#api-reference)** - Complete API endpoint documentation

### For Testers
- **[Testing Guide](TESTING_GUIDE.md)** - Comprehensive test scenarios
- **[Deployment Checklist](DEPLOYMENT_CHECKLIST.md)** - Pre-deployment verification

### For Store Integration
- **[Store Example](STORE_INTEGRATION_EXAMPLE.jsx)** - Complete working example
- **[API Helpers](frontend/src/api/productColors.js)** - Ready-to-use functions

### Summary Documents
- **[Implementation Summary](IMPLEMENTATION_SUMMARY.md)** - What was built
- **[Deployment Checklist](DEPLOYMENT_CHECKLIST.md)** - How to deploy

## 🏗️ Architecture

### Database Schema

```
products
  └── has_colors: boolean

product_colors
  ├── id: SERIAL
  ├── product_id: FK → products
  ├── color_name: VARCHAR(100)
  ├── color_code: VARCHAR(7)
  ├── display_order: INTEGER
  └── is_active: BOOLEAN

product_images_v2
  ├── id: SERIAL
  ├── product_id: FK → products
  ├── image_url: TEXT
  ├── color_id: FK → product_colors (nullable)
  ├── is_primary: BOOLEAN
  ├── display_order: INTEGER
  └── alt_text: VARCHAR(255)

inventory_colors
  ├── id: SERIAL
  ├── inventory_id: FK → inventory
  ├── color_id: FK → product_colors
  ├── quantity_on_hand: INTEGER
  ├── quantity_reserved: INTEGER
  └── quantity_available: INTEGER (computed)
```

### Component Hierarchy

```
ProductsPage
  └── ProductFormModal
      ├── ProductColorManager
      ├── ProductImageManager
      └── CloudinaryUpload

ProductDetailPage
  └── ColorStockManager
```

### API Layer

```
Backend (Node.js/Express)
  ├── Controllers
  │   └── productController.js (9 new functions)
  ├── Routes
  │   └── productRoutes.js (9 new endpoints)
  └── Database
      └── PostgreSQL with indexes

Frontend (React)
  ├── Components
  │   ├── ProductColorManager
  │   ├── ProductImageManager
  │   └── ColorStockManager
  └── API Helpers
      └── productColors.js
```

## 💻 Installation

### Step 1: Database Setup

```bash
# Create backup first (IMPORTANT!)
pg_dump -U username -d database_name > backup.sql

# Run migration
psql -U username -d database_name -f backend/database/migrations/add_product_colors_and_images.sql

# Verify tables created
psql -U username -d database_name -c "\dt product_*"
```

### Step 2: Backend Setup

```bash
cd backend

# Install dependencies (if needed)
npm install

# Restart server
npm restart

# Verify server is running
curl http://localhost:5000/api/health
```

### Step 3: Frontend Setup

```bash
cd frontend

# Install dependencies (if needed)
npm install

# Build for production
npm run build

# Or run development server
npm run dev
```

### Step 4: Verification

```bash
# Test API endpoint
curl -X GET http://localhost:5000/api/products/1/colors \
  -H "Authorization: Bearer YOUR_TOKEN"

# Expected: [] or array of colors
```

## 📖 Usage

### Adding Colors to a Product

```javascript
// In ProductFormModal
import ProductColorManager from './ProductColorManager';

<ProductColorManager
  productId={product.id}
  colors={colors}
  onColorsChange={(newColors) => setColors(newColors)}
/>
```

### Managing Product Images

```javascript
// In ProductFormModal
import ProductImageManager from './ProductImageManager';

<ProductImageManager
  productId={product.id}
  images={images}
  colors={colors}
  onImagesChange={(newImages) => setImages(newImages)}
/>
```

### Displaying Color Stock

```javascript
// In ProductDetailPage
import ColorStockManager from './ColorStockManager';

<ColorStockManager
  productId={product.id}
  branchId={branchId}
  onStockUpdate={handleStockUpdate}
/>
```

### Store Integration

```javascript
// In your store frontend
import {
  getProductColors,
  getProductImages,
  getPrimaryImageForColor,
  getColorStockAvailable
} from './api/productColors';

// Load product data
const colors = await getProductColors(productId);
const images = await getProductImages(productId);

// Get image for selected color
const displayImage = getPrimaryImageForColor(images, selectedColorId);

// Check stock
const available = getColorStockAvailable(inventory, colorId, branchId);
```

## 🔌 API Reference

### Colors

#### Get Product Colors
```http
GET /api/products/:id/colors
Authorization: Bearer {token}
```

**Response:**
```json
[
  {
    "id": 1,
    "product_id": 1,
    "color_name": "Red",
    "color_code": "#FF0000",
    "display_order": 0,
    "is_active": true
  }
]
```

#### Add Product Color
```http
POST /api/products/:id/colors
Authorization: Bearer {token}
Content-Type: application/json

{
  "color_name": "Blue",
  "color_code": "#0000FF",
  "display_order": 1
}
```

### Images

#### Get Product Images
```http
GET /api/products/:id/images
Authorization: Bearer {token}
```

**Response:**
```json
[
  {
    "id": 1,
    "product_id": 1,
    "image_url": "https://...",
    "color_id": 1,
    "color_name": "Red",
    "is_primary": true,
    "display_order": 0,
    "alt_text": "Red variant"
  }
]
```

#### Add Product Image
```http
POST /api/products/:id/images
Authorization: Bearer {token}
Content-Type: application/json

{
  "image_url": "https://...",
  "color_id": 1,
  "is_primary": false,
  "display_order": 0,
  "alt_text": "Product image"
}
```

### Inventory

#### Get Color Inventory
```http
GET /api/products/:id/color-inventory?branch_id=1
Authorization: Bearer {token}
```

**Response:**
```json
[
  {
    "inventory_id": 1,
    "branch_id": 1,
    "branch_name": "Main Branch",
    "color_id": 1,
    "color_name": "Red",
    "color_code": "#FF0000",
    "color_quantity": 50,
    "color_available": 45,
    "color_reserved": 5
  }
]
```

#### Update Color Inventory
```http
POST /api/products/color-inventory
Authorization: Bearer {token}
Content-Type: application/json

{
  "product_id": 1,
  "branch_id": 1,
  "color_id": 1,
  "quantity": 100
}
```

## 🤝 Contributing

### Development Workflow

1. Create feature branch
2. Make changes
3. Run tests
4. Submit pull request

### Code Style

- Use ESLint configuration
- Follow React best practices
- Write meaningful commit messages
- Add comments for complex logic

### Testing

```bash
# Run backend tests
cd backend
npm test

# Run frontend tests
cd frontend
npm test

# Manual testing
See TESTING_GUIDE.md
```

## 🐛 Troubleshooting

### Common Issues

**Colors not showing**
- Check `has_colors` flag on product
- Verify colors are active (`is_active = true`)

**Images not filtering by color**
- Verify `color_id` is set correctly
- Check that images exist for selected color

**Stock not updating**
- Ensure inventory record exists for branch
- Verify user has `manage_inventory` permission

**Migration fails**
- Check PostgreSQL version (12+ required)
- Verify database connection
- Check for existing tables (safe to ignore if already exist)

### Getting Help

1. Check [Quick Reference](QUICK_REFERENCE.md)
2. Review [Implementation Guide](PRODUCT_COLOR_IMAGE_GUIDE.md)
3. See [Testing Guide](TESTING_GUIDE.md)
4. Check backend logs: `backend/logs/error.log`
5. Review browser console for errors

## 📞 Support

### Documentation
- [Quick Reference](QUICK_REFERENCE.md) - Fast answers
- [Implementation Guide](PRODUCT_COLOR_IMAGE_GUIDE.md) - Detailed docs
- [Testing Guide](TESTING_GUIDE.md) - Test scenarios
- [Store Example](STORE_INTEGRATION_EXAMPLE.jsx) - Code examples

### Resources
- Backend logs: `backend/logs/`
- Database schema: `backend/database/schema.sql`
- Migration file: `backend/database/migrations/add_product_colors_and_images.sql`

## 📊 Project Status

- ✅ **Database Schema**: Complete
- ✅ **Backend API**: Complete
- ✅ **Frontend Components**: Complete
- ✅ **Documentation**: Complete
- ✅ **Testing Guide**: Complete
- ✅ **Store Integration**: Example provided
- ⏳ **Unit Tests**: Pending
- ⏳ **Integration Tests**: Pending

## 📝 License

This is part of the General BMS system.

## 🎉 Acknowledgments

Built with:
- React
- Node.js/Express
- PostgreSQL
- Cloudinary
- Tailwind CSS

---

**Version**: 1.0.0  
**Last Updated**: 2024  
**Status**: ✅ Production Ready

For detailed information, see [IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md)
