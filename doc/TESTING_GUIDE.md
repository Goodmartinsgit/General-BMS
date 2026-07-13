# Testing Guide: Product Color & Image Management

## Prerequisites

1. Database migration completed successfully
2. Backend server running
3. Frontend development server running
4. Test user with `manage_products` permission

## Test Scenarios

### 1. Color Management

#### Test 1.1: Add Colors to Product
**Steps:**
1. Navigate to Products page (`/products`)
2. Click on a product or create a new one
3. Click "Edit" button
4. In the Product Colors section, click "Add Color"
5. Enter color name (e.g., "Red")
6. Select color code using color picker
7. Click "Add"
8. Repeat for multiple colors (Blue, Green, Black)
9. Click "Save Changes"

**Expected Result:**
- Colors are added successfully
- Each color shows with its name and color swatch
- Colors are saved to database
- Success toast notification appears

**Validation:**
```sql
SELECT * FROM product_colors WHERE product_id = <product_id>;
```

#### Test 1.2: Edit Color
**Steps:**
1. Open product in edit mode
2. Change color name or color code
3. Save changes

**Expected Result:**
- Color updates successfully
- Changes persist after page refresh

#### Test 1.3: Delete Color (No Inventory)
**Steps:**
1. Open product in edit mode
2. Click X button on a color that has no inventory
3. Confirm deletion
4. Save changes

**Expected Result:**
- Color is removed
- Associated images become untagged (color_id = NULL)

#### Test 1.4: Delete Color (With Inventory)
**Steps:**
1. Add inventory for a specific color
2. Try to delete that color

**Expected Result:**
- Error message: "Cannot delete color with existing inventory"
- Color remains in the list

### 2. Image Management

#### Test 2.1: Add Multiple Images
**Steps:**
1. Open product in edit mode
2. Click "Add Image" in Product Images section
3. Upload image via Cloudinary
4. Select a color from dropdown (or leave as "All Colors")
5. Add alt text (optional)
6. Click "Add Image"
7. Repeat for 3-5 images

**Expected Result:**
- Images appear in grid layout
- First image is automatically set as primary
- Each image shows associated color

**Validation:**
```sql
SELECT * FROM product_images_v2 WHERE product_id = <product_id>;
```

#### Test 2.2: Set Primary Image
**Steps:**
1. Open product with multiple images
2. Hover over a non-primary image
3. Click "Set Primary" button

**Expected Result:**
- Selected image becomes primary (gold star badge)
- Previous primary image loses primary status
- Only one image is primary at a time

#### Test 2.3: Tag Image to Color
**Steps:**
1. Open product with colors and images
2. Click on color dropdown for an image
3. Select a specific color
4. Save changes

**Expected Result:**
- Image is tagged to selected color
- Image appears when that color is selected in store

#### Test 2.4: Remove Image
**Steps:**
1. Hover over an image
2. Click "Remove" button
3. Confirm deletion

**Expected Result:**
- Image is removed from grid
- If it was primary, first remaining image becomes primary
- Database record is deleted

### 3. Color-Based Inventory

#### Test 3.1: View Color Inventory
**Steps:**
1. Navigate to product detail page
2. Scroll to "Stock by Color" section

**Expected Result:**
- All colors are listed
- Each color shows current quantity
- Branch breakdown is visible

#### Test 3.2: Update Color Stock
**Steps:**
1. In "Stock by Color" section, click "Edit" for a color
2. Enter new quantity (e.g., 50)
3. Click "Save"

**Expected Result:**
- Color quantity updates
- Total stock recalculates automatically
- Success notification appears

**Validation:**
```sql
-- Check color inventory
SELECT * FROM inventory_colors 
WHERE inventory_id = (
  SELECT id FROM inventory 
  WHERE product_id = <product_id> AND branch_id = <branch_id>
);

-- Check total inventory
SELECT quantity_on_hand FROM inventory 
WHERE product_id = <product_id> AND branch_id = <branch_id>;
```

#### Test 3.3: Multi-Branch Color Stock
**Steps:**
1. Add color stock for Branch A
2. Add different color stock for Branch B
3. View product detail page

**Expected Result:**
- Both branches show in color inventory
- Each branch has independent color quantities
- Total stock per branch is correct

### 4. Integration Tests

#### Test 4.1: Complete Product Workflow
**Steps:**
1. Create new product
2. Add 3 colors (Red, Blue, Green)
3. Upload 6 images (2 per color)
4. Tag images to respective colors
5. Set primary image for each color
6. Add stock: Red=10, Blue=15, Green=20
7. Save product

**Expected Result:**
- Product created with all data
- Colors saved correctly
- Images tagged properly
- Stock allocated by color
- Total stock = 45

#### Test 4.2: Edit Existing Product
**Steps:**
1. Open existing product
2. Add new color "Yellow"
3. Upload image for yellow
4. Add stock for yellow
5. Save changes

**Expected Result:**
- New color added without affecting existing colors
- New image appears in gallery
- Stock updates correctly

#### Test 4.3: Store Display Simulation
**Steps:**
1. Use the sample store component
2. Select different colors
3. Verify images change
4. Check stock availability per color

**Expected Result:**
- Images filter by selected color
- Stock shows correctly per color
- Out of stock colors are disabled
- Add to cart includes color selection

### 5. Edge Cases

#### Test 5.1: Product Without Colors
**Steps:**
1. Create product without adding colors
2. Upload images without color tags

**Expected Result:**
- Product works normally
- Images show as "All Colors"
- Stock management uses traditional method

#### Test 5.2: Color Without Images
**Steps:**
1. Add colors to product
2. Don't upload any images

**Expected Result:**
- Colors are saved
- Stock can be managed by color
- No errors occur

#### Test 5.3: Image Without Color Tag
**Steps:**
1. Upload image
2. Leave color as "All Colors"

**Expected Result:**
- Image shows for all color selections
- Acts as fallback image

#### Test 5.4: Delete Product with Colors
**Steps:**
1. Delete product that has colors and images

**Expected Result:**
- Product soft-deleted
- Colors cascade deleted (ON DELETE CASCADE)
- Images cascade deleted
- Color inventory cascade deleted

### 6. Performance Tests

#### Test 6.1: Many Colors
**Steps:**
1. Add 20+ colors to a product
2. Check page load time
3. Test color selector responsiveness

**Expected Result:**
- Page loads in < 2 seconds
- Color selector remains responsive
- No UI lag

#### Test 6.2: Many Images
**Steps:**
1. Upload 30+ images
2. Check grid rendering
3. Test image operations

**Expected Result:**
- Images load progressively
- Grid remains responsive
- Operations complete quickly

### 7. API Tests

Use Postman or curl to test API endpoints:

#### Test 7.1: Get Product Colors
```bash
curl -X GET http://localhost:5000/api/products/1/colors \
  -H "Authorization: Bearer <token>"
```

**Expected:** Array of color objects

#### Test 7.2: Add Color
```bash
curl -X POST http://localhost:5000/api/products/1/colors \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "color_name": "Red",
    "color_code": "#FF0000",
    "display_order": 0
  }'
```

**Expected:** Created color object with ID

#### Test 7.3: Update Color Inventory
```bash
curl -X POST http://localhost:5000/api/products/color-inventory \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "product_id": 1,
    "branch_id": 1,
    "color_id": 1,
    "quantity": 50
  }'
```

**Expected:** Success message

## Automated Test Script

Create a test file: `test-color-management.js`

```javascript
const api = require('./api/axios');

async function runTests() {
  console.log('Starting Color Management Tests...\n');
  
  const productId = 1; // Replace with test product ID
  
  try {
    // Test 1: Add Color
    console.log('Test 1: Adding color...');
    const color = await api.post(`/products/${productId}/colors`, {
      color_name: 'Test Red',
      color_code: '#FF0000',
      display_order: 0
    });
    console.log('✓ Color added:', color.data.id);
    
    // Test 2: Get Colors
    console.log('\nTest 2: Fetching colors...');
    const colors = await api.get(`/products/${productId}/colors`);
    console.log('✓ Colors fetched:', colors.data.length);
    
    // Test 3: Add Image
    console.log('\nTest 3: Adding image...');
    const image = await api.post(`/products/${productId}/images`, {
      image_url: 'https://example.com/test.jpg',
      color_id: color.data.id,
      is_primary: true
    });
    console.log('✓ Image added:', image.data.id);
    
    // Test 4: Update Color Inventory
    console.log('\nTest 4: Updating color inventory...');
    await api.post('/products/color-inventory', {
      product_id: productId,
      branch_id: 1,
      color_id: color.data.id,
      quantity: 100
    });
    console.log('✓ Inventory updated');
    
    // Test 5: Get Color Inventory
    console.log('\nTest 5: Fetching color inventory...');
    const inventory = await api.get(`/products/${productId}/color-inventory`);
    console.log('✓ Inventory fetched:', inventory.data.length, 'records');
    
    console.log('\n✓ All tests passed!');
    
  } catch (error) {
    console.error('\n✗ Test failed:', error.response?.data || error.message);
  }
}

runTests();
```

## Regression Tests

After any code changes, verify:

1. ✓ Existing products without colors still work
2. ✓ Legacy single image upload still functions
3. ✓ Stock management without colors works
4. ✓ Product listing page displays correctly
5. ✓ Product detail page loads properly
6. ✓ Sales can be created with color selection
7. ✓ Inventory movements track correctly

## Browser Compatibility

Test in:
- ✓ Chrome (latest)
- ✓ Firefox (latest)
- ✓ Safari (latest)
- ✓ Edge (latest)
- ✓ Mobile browsers (iOS Safari, Chrome Mobile)

## Accessibility Tests

1. ✓ Color picker is keyboard accessible
2. ✓ Images have proper alt text
3. ✓ Color names are readable (not just visual)
4. ✓ Screen reader announces color changes
5. ✓ Focus indicators are visible

## Security Tests

1. ✓ Only authorized users can manage colors
2. ✓ SQL injection prevention in color names
3. ✓ XSS prevention in alt text
4. ✓ Image URLs are validated
5. ✓ CSRF tokens are used

## Reporting Issues

When reporting bugs, include:
1. Test scenario number
2. Steps to reproduce
3. Expected vs actual result
4. Screenshots/videos
5. Browser and version
6. Console errors
7. Network tab errors

## Success Criteria

All tests must pass before deployment:
- [ ] All color management tests pass
- [ ] All image management tests pass
- [ ] All inventory tests pass
- [ ] All integration tests pass
- [ ] All edge cases handled
- [ ] Performance acceptable
- [ ] API tests pass
- [ ] No regression issues
- [ ] Browser compatibility confirmed
- [ ] Accessibility requirements met
- [ ] Security tests pass
