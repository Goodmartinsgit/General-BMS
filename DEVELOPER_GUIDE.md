# General-BMS Developer Guide

**Quick Reference for New Developers**

---

## Project Overview

General-BMS is a comprehensive, general-purpose Business Management System designed for retail and wholesale operations. It supports multi-branch inventory, product variants, purchase orders, sales, returns, promotions, and advanced analytics.

**Tech Stack:**
- **Frontend:** React 18 + Vite + Tailwind CSS + React Router v6
- **Backend:** Node.js + Express + PostgreSQL
- **UI Icons:** Lucide React
- **Charts:** Recharts
- **HTTP Client:** Axios

---

## Quick Start

### 1. Clone and Install
```bash
# Clone repository
git clone <repository-url>
cd General-BMS

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 2. Database Setup
```bash
# Create PostgreSQL database
createdb general_bms

# Run migrations
cd backend
npm run migrate

# (Optional) Seed sample data
npm run seed
```

### 3. Environment Configuration

**Backend** (`backend/.env`):
```env
PORT=5000
DATABASE_URL=postgresql://user:password@localhost:5432/general_bms
JWT_SECRET=your_jwt_secret_here
NODE_ENV=development
```

**Frontend** (`frontend/.env`):
```env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_CLOUDINARY_CLOUD_NAME=your_cloud_name
REACT_APP_CLOUDINARY_UPLOAD_PRESET=your_preset
```

### 4. Run Development Servers
```bash
# Terminal 1: Backend
cd backend
npm run dev

# Terminal 2: Frontend
cd frontend
npm run dev
```

**Frontend:** http://localhost:5173
**Backend API:** http://localhost:5000/api

---

## Project Structure

```
General-BMS/
├── backend/
│   ├── database/
│   │   ├── migrations/          # Database migration scripts
│   │   ├── schema.sql            # Master schema
│   │   └── seeds/                # Sample data
│   ├── src/
│   │   ├── controllers/          # API controllers (12 files)
│   │   ├── routes/               # Express routes
│   │   ├── middleware/           # Auth, validation, error handling
│   │   ├── services/             # Business logic
│   │   └── config/               # Configuration files
│   └── server.js                 # Entry point
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/               # Core UI components (14)
│   │   │   ├── product/          # Product components (8)
│   │   │   ├── variant/          # Variant components (4)
│   │   │   ├── purchase-order/   # PO components (3)
│   │   │   ├── sales/            # Sales components (TO BUILD)
│   │   │   ├── returns/          # Returns components (TO BUILD)
│   │   │   ├── stock/            # Stock components (TO BUILD)
│   │   │   ├── promotions/       # Promotion components (TO BUILD)
│   │   │   ├── performance/      # Performance task components (TO BUILD)
│   │   │   ├── analytics/        # Analytics components (TO BUILD)
│   │   │   └── ...
│   │   ├── pages/                # Page components
│   │   ├── api/                  # API client functions
│   │   ├── context/              # React Context providers
│   │   ├── hooks/                # Custom React hooks
│   │   ├── utils/                # Utility functions
│   │   └── App.jsx               # Main app component
│   ├── public/
│   └── index.html
│
├── IMPLEMENTATION_PLAN_REMAINING.md  # Detailed implementation plan
├── TASK_TRACKER.md                   # Progress tracking
└── README.md                         # Project README
```

---

## Development Workflow

### Creating a New Component

**1. Component Template:**
```jsx
// frontend/src/components/category/ComponentName.jsx
import React, { useState, useEffect } from 'react';
import { Icon1, Icon2 } from 'lucide-react';
import { Button, Modal, Input } from '../ui';

/**
 * ComponentName Component
 * Brief description of what this component does
 */
const ComponentName = ({
  prop1,
  prop2,
  onAction,
  className = '',
}) => {
  const [state, setState] = useState(initialValue);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch data on mount
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      // TODO: Replace with actual API call
      // const response = await fetch('/api/endpoint');
      // const data = await response.json();

      // Mock data for now
      const mockData = { /* ... */ };
      setState(mockData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async () => {
    try {
      // TODO: Replace with actual API call
      onAction();
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <EmptyState icon={AlertCircle} title="Error" description={error} />;
  }

  return (
    <div className={`component-styles ${className}`.trim()}>
      {/* Component content */}
    </div>
  );
};

export default ComponentName;
```

**2. Export from index.js:**
```javascript
// frontend/src/components/category/index.js
export { default as ComponentName } from './ComponentName';
```

**3. Use in page:**
```jsx
import { ComponentName } from '../components/category';

<ComponentName prop1="value" onAction={handleAction} />
```

---

### Creating a New Page

**1. Page Template:**
```jsx
// frontend/src/pages/PageName.jsx
import React, { useState, useEffect } from 'react';
import { Icon } from 'lucide-react';
import { Button, SearchBar, LoadingSpinner } from '../components/ui';
import { Component1, Component2 } from '../components/category';

const PageName = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({});

  useEffect(() => {
    fetchData();
  }, [searchQuery, filters]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // API call
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Page Title</h1>
        <p className="text-gray-600">Page description</p>
      </div>

      {/* Toolbar */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        {/* Search, filters, actions */}
      </div>

      {/* Content */}
      {loading ? (
        <LoadingSpinner size="lg" />
      ) : (
        <div>
          {/* Render components */}
        </div>
      )}
    </div>
  );
};

export default PageName;
```

**2. Add Route:**
```jsx
// frontend/src/App.jsx
import PageName from './pages/PageName';

<Route path="/page-name" element={<PageName />} />
```

---

### Creating API Client Functions

**1. API Client Template:**
```javascript
// frontend/src/api/category.js
import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export const categoryAPI = {
  // Get all items
  getItems: async (params = {}) => {
    const response = await axios.get(`${API_BASE}/category`, { params });
    return response.data;
  },

  // Get single item
  getItem: async (id) => {
    const response = await axios.get(`${API_BASE}/category/${id}`);
    return response.data;
  },

  // Create item
  createItem: async (data) => {
    const response = await axios.post(`${API_BASE}/category`, data);
    return response.data;
  },

  // Update item
  updateItem: async (id, data) => {
    const response = await axios.put(`${API_BASE}/category/${id}`, data);
    return response.data;
  },

  // Delete item
  deleteItem: async (id) => {
    await axios.delete(`${API_BASE}/category/${id}`);
  },
};
```

**2. Use in Component:**
```jsx
import { categoryAPI } from '../api/category';

const fetchData = async () => {
  try {
    const data = await categoryAPI.getItems({ page: 1, limit: 20 });
    setItems(data.items);
  } catch (error) {
    console.error('Error:', error);
  }
};
```

---

## Styling Guidelines

### Tailwind CSS Classes

**Layout:**
```jsx
<div className="p-6 max-w-7xl mx-auto">           // Page container
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">  // Responsive grid
<div className="flex items-center justify-between">  // Flexbox
```

**Cards:**
```jsx
<div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
<div className="bg-white rounded-lg shadow-lg p-6">  // Elevated card
```

**Buttons:**
```jsx
// Primary
<button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors">

// Outline
<button className="px-4 py-2 border border-gray-300 hover:border-gray-400 text-gray-700 rounded-lg transition-colors">

// Danger
<button className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors">
```

**Inputs:**
```jsx
<input className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
```

**Typography:**
```jsx
<h1 className="text-3xl font-bold text-gray-900">       // Page title
<h2 className="text-xl font-semibold text-gray-900">    // Section title
<p className="text-sm text-gray-600">                   // Body text
<p className="text-xs text-gray-500">                   // Helper text
```

**Colors:**
- Primary: `blue-600`, `blue-700`
- Success: `green-600`, `green-700`
- Warning: `yellow-600`, `yellow-700`
- Danger: `red-600`, `red-700`
- Neutral: `gray-600`, `gray-700`

---

## Common Patterns

### Loading States
```jsx
const [loading, setLoading] = useState(false);

if (loading) {
  return (
    <div className="flex items-center justify-center py-20">
      <LoadingSpinner size="lg" />
    </div>
  );
}
```

### Empty States
```jsx
if (items.length === 0) {
  return (
    <EmptyState
      icon={Package}
      title="No items found"
      description="Create your first item to get started"
      action={
        <Button onClick={handleCreate} icon={Plus}>
          Create Item
        </Button>
      }
    />
  );
}
```

### Error Handling
```jsx
const [error, setError] = useState(null);

try {
  // API call
} catch (err) {
  setError(err.message);
  console.error('Error:', err);
}

{error && (
  <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
    {error}
  </div>
)}
```

### Confirmation Dialogs
```jsx
const [showConfirm, setShowConfirm] = useState(false);

<ConfirmDialog
  isOpen={showConfirm}
  onClose={() => setShowConfirm(false)}
  onConfirm={handleDelete}
  title="Delete Item"
  message="Are you sure you want to delete this item?"
  confirmText="Delete"
  variant="danger"
/>
```

### Form Validation
```jsx
const [errors, setErrors] = useState({});

const validate = () => {
  const newErrors = {};

  if (!formData.name.trim()) {
    newErrors.name = 'Name is required';
  }

  if (!formData.price || parseFloat(formData.price) <= 0) {
    newErrors.price = 'Valid price is required';
  }

  setErrors(newErrors);
  return Object.keys(newErrors).length === 0;
};

const handleSubmit = () => {
  if (validate()) {
    // Submit form
  }
};
```

---

## Available Components

### Core UI Components (`components/ui/`)
- **Button** - Primary, outline, ghost, danger variants
- **Input** - Text, number, date inputs with validation
- **Modal** - Popup modals with header/footer
- **Card** - Container with shadow and border
- **Badge** - Status indicators with color variants
- **LoadingSpinner** - Loading indicators (sm, md, lg)
- **EmptyState** - Empty state illustrations
- **SearchBar** - Debounced search input
- **DataTable** - Sortable, paginated tables
- **ConfirmDialog** - Confirmation modals
- **ViewModeToggle** - Grid/list view switcher
- **StatCard** - Statistics display cards
- **Dropdown** - Dropdown menus
- **Tabs** - Tab navigation

### Product Components (`components/product/`)
- **ProductCard** - Product grid card
- **ProductListItem** - Product list row
- **ProductFormModal** - Create/edit product form
- **ProductSelector** - Autocomplete product picker
- **ProductImageUpload** - Image upload with preview
- **ProductCategorySelector** - Multi-category selector
- **ProductGrid** - Product grid container
- **ProductDetailView** - Complete product details

### Variant Components (`components/variant/`)
- **VariantFormModal** - Create/edit variant form
- **VariantListItem** - Variant list row
- **VariantSelector** - Variant picker
- **VariantInventoryManager** - Multi-branch inventory

### Purchase Order Components (`components/purchase-order/`)
- **PurchaseOrderFormModal** - Create/edit PO form
- **PurchaseOrderCard** - PO display card
- **GRNFormModal** - Goods received note form

---

## Database Schema Reference

### Key Tables

**products**
- `id` (UUID)
- `product_name`
- `product_code`
- `product_type` (physical, service, digital, bundle)
- `selling_price`, `cost_price`
- `quantity_on_hand`, `reorder_level`
- `has_variants`, `track_inventory`, `track_serial_numbers`, `track_batches`
- `is_active`, `is_featured`

**product_variants**
- `id` (UUID)
- `product_id` (FK)
- `variant_name`, `sku`, `barcode`
- `attributes` (JSONB)
- `selling_price`, `cost_price`

**variant_inventory**
- `variant_id`, `branch_id`
- `quantity_on_hand`

**sales**
- `id` (UUID)
- `sale_number`
- `customer_id`, `referrer_id`, `branch_id`
- `subtotal`, `discount`, `tax`, `total`
- `cost_total`, `profit_total`
- `payment_method`, `payment_status`
- `reversed_at`, `reversal_reason`

**purchase_orders**
- `id` (UUID)
- `po_number`
- `supplier_id`, `branch_id`
- `status` (draft, confirmed, partially_received, received)
- `total_amount`

**stock_transfers**
- `id` (UUID)
- `transfer_number`
- `from_branch_id`, `to_branch_id`
- `status` (pending, approved, completed)

---

## Testing

### Run Tests
```bash
# Frontend tests
cd frontend
npm test

# Backend tests
cd backend
npm test

# E2E tests
npm run test:e2e
```

### Writing Component Tests
```javascript
// ComponentName.test.jsx
import { render, screen, fireEvent } from '@testing-library/react';
import ComponentName from './ComponentName';

describe('ComponentName', () => {
  test('renders component', () => {
    render(<ComponentName />);
    expect(screen.getByText('Expected Text')).toBeInTheDocument();
  });

  test('handles click', () => {
    const handleClick = jest.fn();
    render(<ComponentName onClick={handleClick} />);

    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalled();
  });
});
```

---

## Git Workflow

### Branch Naming
- `feature/sales-pos` - New features
- `fix/cart-calculation` - Bug fixes
- `refactor/api-client` - Code refactoring
- `docs/api-documentation` - Documentation

### Commit Messages
```
feat: Add POS cart component
fix: Correct discount calculation in sales
refactor: Extract payment logic to service
docs: Update API documentation
test: Add tests for variant selector
```

### Pull Request Process
1. Create feature branch from `main`
2. Implement feature with tests
3. Run linter: `npm run lint`
4. Run tests: `npm test`
5. Create pull request
6. Code review
7. Merge to `main`

---

## Common Issues & Solutions

### Issue: API not connecting
**Solution:**
- Check backend is running on port 5000
- Verify `REACT_APP_API_URL` in frontend `.env`
- Check for CORS errors in console

### Issue: Database connection failed
**Solution:**
- Verify PostgreSQL is running
- Check `DATABASE_URL` in backend `.env`
- Ensure database exists: `createdb general_bms`

### Issue: Build fails
**Solution:**
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Clear Vite cache
rm -rf node_modules/.vite
```

### Issue: Tailwind styles not working
**Solution:**
- Restart Vite dev server
- Check `tailwind.config.js` configuration
- Ensure component is in content paths

---

## Resources

### Documentation
- [React Docs](https://react.dev)
- [Tailwind CSS](https://tailwindcss.com)
- [Lucide Icons](https://lucide.dev)
- [Recharts](https://recharts.org)
- [React Router](https://reactrouter.com)

### Internal Docs
- [Implementation Plan](./IMPLEMENTATION_PLAN_REMAINING.md)
- [Task Tracker](./TASK_TRACKER.md)
- [Backend API](./backend/README.md)

### Code Style
- Use functional components with hooks
- Use arrow functions
- Use template literals
- Destructure props
- Use Tailwind utility classes
- Follow file naming: PascalCase for components, camelCase for utilities

---

## Contact & Support

**Project Lead:** [Name]
**Backend Team:** [Names]
**Frontend Team:** [Names]
**QA Team:** [Names]

**Communication:**
- Daily standup: 9:00 AM
- Sprint planning: Monday 10:00 AM
- Code reviews: Within 24 hours
- Slack: #general-bms-dev

---

**Happy Coding! 🚀**

*Last Updated: 2026-01-31*
