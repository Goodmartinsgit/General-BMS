# System Architecture Diagram

## Product Color & Image Management System

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          USER INTERFACE (React)                          │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  ┌──────────────────┐         ┌──────────────────┐                      │
│  │  ProductsPage    │         │ ProductDetailPage│                      │
│  │                  │         │                  │                      │
│  │  [Product List]  │────────▶│  [Product Info]  │                      │
│  │  [Edit Button]   │         │  [Stock Display] │                      │
│  └────────┬─────────┘         └────────┬─────────┘                      │
│           │                            │                                 │
│           ▼                            ▼                                 │
│  ┌──────────────────┐         ┌──────────────────┐                      │
│  │ProductFormModal  │         │ColorStockManager │                      │
│  ├──────────────────┤         ├──────────────────┤                      │
│  │                  │         │                  │                      │
│  │ ┌──────────────┐ │         │ • View stock by  │                      │
│  │ │ Color Manager│ │         │   color & branch │                      │
│  │ │              │ │         │ • Edit quantities│                      │
│  │ │ • Add colors │ │         │ • Auto-calculate │                      │
│  │ │ • Edit colors│ │         │   totals         │                      │
│  │ │ • Remove     │ │         │                  │                      │
│  │ └──────────────┘ │         └──────────────────┘                      │
│  │                  │                                                    │
│  │ ┌──────────────┐ │                                                    │
│  │ │ Image Manager│ │                                                    │
│  │ │              │ │                                                    │
│  │ │ • Upload imgs│ │                                                    │
│  │ │ • Tag colors │ │                                                    │
│  │ │ • Set primary│ │                                                    │
│  │ └──────────────┘ │                                                    │
│  └──────────────────┘                                                    │
│                                                                           │
└───────────────────────────────┬───────────────────────────────────────────┘
                                │
                                │ API Calls (axios)
                                │
┌───────────────────────────────▼───────────────────────────────────────────┐
│                        API LAYER (Express.js)                             │
├───────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  ┌─────────────────────────────────────────────────────────────────────┐ │
│  │                    Product Controller                                │ │
│  ├─────────────────────────────────────────────────────────────────────┤ │
│  │                                                                       │ │
│  │  Color Management:                Image Management:                  │ │
│  │  • getProductColors()             • getProductImages()               │ │
│  │  • addProductColor()              • addProductImage()                │ │
│  │  • updateProductColor()           • updateProductImage()             │ │
│  │  • deleteProductColor()           • deleteProductImage()             │ │
│  │                                                                       │ │
│  │  Inventory Management:                                               │ │
│  │  • getProductColorInventory()                                        │ │
│  │  • updateColorInventory()                                            │ │
│  │                                                                       │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                                                                            │
│  ┌─────────────────────────────────────────────────────────────────────┐ │
│  │                         Routes                                       │ │
│  ├─────────────────────────────────────────────────────────────────────┤ │
│  │                                                                       │ │
│  │  GET    /api/products/:id/colors                                     │ │
│  │  POST   /api/products/:id/colors                                     │ │
│  │  PUT    /api/products/:id/colors/:colorId                            │ │
│  │  DELETE /api/products/:id/colors/:colorId                            │ │
│  │                                                                       │ │
│  │  GET    /api/products/:id/images                                     │ │
│  │  POST   /api/products/:id/images                                     │ │
│  │  PUT    /api/products/:id/images/:imageId                            │ │
│  │  DELETE /api/products/:id/images/:imageId                            │ │
│  │                                                                       │ │
│  │  GET    /api/products/:id/color-inventory                            │ │
│  │  POST   /api/products/color-inventory                                │ │
│  │                                                                       │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                                                                            │
│  ┌─────────────────────────────────────────────────────────────────────┐ │
│  │                      Middleware                                      │ │
│  ├─────────────────────────────────────────────────────────────────────┤ │
│  │  • authenticateToken()                                               │ │
│  │  • authorize('manage_products')                                      │ │
│  │  • authorize('manage_inventory')                                     │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                                                                            │
└────────────────────────────────┬──────────────────────────────────────────┘
                                 │
                                 │ SQL Queries
                                 │
┌────────────────────────────────▼──────────────────────────────────────────┐
│                        DATABASE (PostgreSQL)                              │
├───────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  ┌──────────────┐         ┌──────────────┐         ┌──────────────┐     │
│  │   products   │         │product_colors│         │product_images│     │
│  ├──────────────┤         ├──────────────┤         │     _v2      │     │
│  │ id           │◀────────│ product_id   │    ┌────│ product_id   │     │
│  │ product_name │         │ color_name   │    │    │ image_url    │     │
│  │ has_colors   │         │ color_code   │    │    │ color_id     │─┐   │
│  │ ...          │         │ display_order│    │    │ is_primary   │ │   │
│  └──────────────┘         │ is_active    │    │    │ display_order│ │   │
│         │                 └──────────────┘    │    │ alt_text     │ │   │
│         │                        │            │    └──────────────┘ │   │
│         │                        └────────────┘            │        │   │
│         │                                                  └────────┘   │
│         │                                                               │
│         │                 ┌──────────────┐         ┌──────────────┐   │
│         │                 │  inventory   │         │inventory_    │   │
│         │                 ├──────────────┤         │   colors     │   │
│         └────────────────▶│ product_id   │◀────────│ inventory_id │   │
│                           │ branch_id    │         │ color_id     │───┘
│                           │ quantity_on_ │         │ quantity_on_ │
│                           │   hand       │         │   hand       │
│                           │ ...          │         │ quantity_    │
│                           └──────────────┘         │   reserved   │
│                                                    │ quantity_    │
│                                                    │   available  │
│                                                    └──────────────┘
│                                                                            │
│  Indexes:                                                                 │
│  • idx_product_colors_product_id                                          │
│  • idx_product_images_v2_product_id                                       │
│  • idx_product_images_v2_color_id                                         │
│  • idx_inventory_colors_inventory_id                                      │
│  • idx_inventory_colors_color_id                                          │
│                                                                            │
│  Constraints:                                                             │
│  • Foreign Keys with CASCADE/SET NULL                                     │
│  • Unique constraints on (product_id, color_name)                         │
│  • Unique constraints on (inventory_id, color_id)                         │
│                                                                            │
└───────────────────────────────────────────────────────────────────────────┘


┌───────────────────────────────────────────────────────────────────────────┐
│                        EXTERNAL SERVICES                                  │
├───────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  ┌─────────────────────────────────────────────────────────────────────┐ │
│  │                         Cloudinary                                   │ │
│  ├─────────────────────────────────────────────────────────────────────┤ │
│  │  • Image Upload                                                      │ │
│  │  • Image Transformation                                              │ │
│  │  • CDN Delivery                                                      │ │
│  │  • URL Generation                                                    │ │
│  └─────────────────────────────────────────────────────────────────────┘ │
│                                                                            │
└───────────────────────────────────────────────────────────────────────────┘


┌───────────────────────────────────────────────────────────────────────────┐
│                        DATA FLOW EXAMPLE                                  │
├───────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  1. User adds color "Red" (#FF0000)                                       │
│     └─▶ POST /api/products/1/colors                                       │
│         └─▶ INSERT INTO product_colors                                    │
│             └─▶ Returns color with id=1                                   │
│                                                                            │
│  2. User uploads image                                                    │
│     └─▶ Upload to Cloudinary                                              │
│         └─▶ Returns image URL                                             │
│             └─▶ POST /api/products/1/images                               │
│                 └─▶ INSERT INTO product_images_v2                         │
│                     (image_url, color_id=1)                               │
│                                                                            │
│  3. User adds stock for Red color                                         │
│     └─▶ POST /api/products/color-inventory                                │
│         └─▶ INSERT INTO inventory_colors                                  │
│             (inventory_id=1, color_id=1, quantity=50)                     │
│         └─▶ UPDATE inventory                                              │
│             SET quantity_on_hand = SUM(color quantities)                  │
│                                                                            │
│  4. Store displays product                                                │
│     └─▶ GET /api/products/1/colors                                        │
│     └─▶ GET /api/products/1/images                                        │
│     └─▶ GET /api/products/1/color-inventory                               │
│         └─▶ Filter images by selected color                               │
│         └─▶ Show stock for selected color                                 │
│         └─▶ Enable/disable "Add to Cart" based on stock                  │
│                                                                            │
└───────────────────────────────────────────────────────────────────────────┘


┌───────────────────────────────────────────────────────────────────────────┐
│                        SECURITY LAYERS                                    │
├───────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  1. Authentication                                                        │
│     └─▶ JWT Token validation                                              │
│         └─▶ User session verification                                     │
│                                                                            │
│  2. Authorization                                                         │
│     └─▶ Role-based permissions                                            │
│         ├─▶ view_products                                                 │
│         ├─▶ manage_products                                               │
│         └─▶ manage_inventory                                              │
│                                                                            │
│  3. Input Validation                                                      │
│     └─▶ Color code format (#RRGGBB)                                       │
│     └─▶ Image URL validation                                              │
│     └─▶ SQL injection prevention                                          │
│     └─▶ XSS prevention                                                    │
│                                                                            │
│  4. Data Integrity                                                        │
│     └─▶ Foreign key constraints                                           │
│     └─▶ Transaction rollback on errors                                    │
│     └─▶ Cascade delete rules                                              │
│                                                                            │
└───────────────────────────────────────────────────────────────────────────┘
```

## Component Interaction Flow

```
┌─────────────┐
│    User     │
└──────┬──────┘
       │
       │ 1. Opens product edit modal
       ▼
┌─────────────────────┐
│ ProductFormModal    │
├─────────────────────┤
│ • Loads product     │
│ • Fetches colors    │
│ • Fetches images    │
└──────┬──────────────┘
       │
       │ 2. Displays color manager
       ▼
┌─────────────────────┐
│ProductColorManager  │
├─────────────────────┤
│ • Shows color list  │
│ • Add color button  │
│ • Color picker      │
└──────┬──────────────┘
       │
       │ 3. User adds "Red"
       ▼
┌─────────────────────┐
│  API Call           │
├─────────────────────┤
│ POST /colors        │
│ {name: "Red",       │
│  code: "#FF0000"}   │
└──────┬──────────────┘
       │
       │ 4. Saves to database
       ▼
┌─────────────────────┐
│  Database           │
├─────────────────────┤
│ INSERT INTO         │
│ product_colors      │
└──────┬──────────────┘
       │
       │ 5. Returns color with ID
       ▼
┌─────────────────────┐
│ProductImageManager  │
├─────────────────────┤
│ • Now shows "Red"   │
│   in color dropdown │
│ • User can tag      │
│   images to Red     │
└─────────────────────┘
```

## Legend

```
┌─────┐
│ Box │  = Component/Service
└─────┘

  │
  ▼     = Data flow direction

◀────   = Relationship/Reference

[Text]  = Action/Feature
```
