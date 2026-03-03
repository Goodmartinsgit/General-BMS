# General-BMS Interface Redesign - Match Eldaved-BMS Design

## Context

General-BMS currently has an over-engineered UI: massive border radius (2-2.5rem), tech jargon labels ("Asset Repository", "Engagement Matrix", "Operational Burn"), fake hardcoded stats ("99.9% Uptime"), excessive decorative effects (glowing dots, gradient blurs), and a blue accent scheme. The goal is to match Eldaved-BMS's clean, professional, business-focused design: gold accent (#D4AF37), moderate border radius (rounded-lg/xl), normal business terminology, and clean functional components.

Both projects share the same theme system (Light/Charcoal/Midnight/Ocean) and CSS variable architecture, so the transformation is about visual styling and language, not architecture.

---

## Files to Modify (17 files)

### Phase 1: Foundation (Theme & Branding)

**1. `frontend/src/index.css`** - Update accent color defaults
- Change `--color-accent: #3B82F6` to `#D4AF37` (gold) across all theme variants
- Change `--color-accent-light: #EFF6FF` to `#FFD700`
- Change `--color-accent-dark: #2563EB` to `#C5A353`
- Add Eldaved's global theme overrides for bg-white, bg-gray-*, text-gray-*, border-gray-*, form inputs, modals, tables, scrollbars in dark themes
- Add accent-gold utility classes (`.bg-accent-gold`, `.text-accent-gold`, etc.)
- Add `.card-theme`, `.input-theme`, `.btn-theme-accent` utility classes
- Add sidebar theme overrides for dark themes
- Keep the Outfit font (unique to General-BMS)

**2. `frontend/src/context/ThemeContext.jsx`** - Update preview accent colors
- Change all theme preview accent from `#3B82F6` to `#D4AF37`

**3. `frontend/src/context/BrandingContext.jsx`** - Update default accent to gold
- Change `app_accent_color` default from `#3B82F6` to `#D4AF37`
- Change `app_accent_light` from `#EFF6FF` to `#FFD700`
- Change `app_accent_dark` from `#2563EB` to `#C5A353`
- Update retail CSS variable defaults to match gold accent

### Phase 2: Core Layout Components

**4. `frontend/src/components/layout/Navbar.jsx`** - Simplify to match Eldaved
- Change welcome greeting to use Eldaved's simpler layout style
- Keep theme switcher in navbar
- Simplify profile dropdown (remove gradient avatar, use flat gold circle)
- Use `rounded-lg` instead of `rounded-xl/2xl`
- Remove decorative search bar shortcut badge

**5. `frontend/src/components/layout/Sidebar.jsx`** - Match Eldaved sidebar styling
- Reduce border radius from `rounded-xl` to `rounded-lg`
- Active items: use gold accent background (`bg-[var(--retail-accent)] text-primary-black`) instead of blue
- Simplify hover effects
- Keep search and collapse features (General-BMS has these, Eldaved doesn't)
- Move logout to user section at bottom (like Eldaved's user info panel)

**6. `frontend/src/components/Layout.jsx`** - No major changes needed (already clean)

### Phase 3: Dashboard & KPI Components

**7. `frontend/src/components/dashboard/KPICard.jsx`** - Major simplification
- Change border radius from `rounded-[2rem]` to `rounded-lg`
- Reduce padding from `p-7` to `p-4 md:p-6`
- Remove decorative label with pulsing dot
- Simplify change indicator (remove border/bg, just use colored text + icon like Eldaved)
- Use `text-fluid-stat` instead of `text-3xl font-black`
- Use `text-fluid-sm` for title
- Add `border border-theme hover:border-accent-gold` like Eldaved
- Keep icon + value + change layout but match Eldaved's proportions

**8. `frontend/src/components/dashboard/SalesTrendChart.jsx`** - Simplify
- Change border radius from `rounded-[2.5rem]` to `rounded-lg`
- Rename "Revenue Matrix" to "Sales Trend"
- Rename "Sales Performance Analytics" to simpler subtitle
- Remove "Dynamic flow analysis" and "Active Cycle" labels
- Remove excessive decorative blob in corner
- Keep SVG chart (works well)

**9. `frontend/src/pages/Dashboard.jsx`** - Major overhaul
- Rename "Executive Overview" to "Dashboard"
- Rename KPI titles: "Gross Revenue" -> "Total Revenue", "Active Workflow" -> "Active Orders", "Safety Critical" -> "Low Stock Items", "Operational Burn" -> "Monthly Expenses"
- Replace fake "Real-time Insights" panel (hardcoded "99.9% Uptime", "82% interaction efficiency") with an ActivityFeed or QuickActions section like Eldaved
- Rename "Refresh Intelligence" to just the refresh icon
- Remove "Auto-sync: Active" decorator
- Match Eldaved's dashboard header style (title + welcome + role badge + refresh button)
- Use Eldaved's KPI card layout pattern (4-col grid)

### Phase 4: Shared UI Components

**10. `frontend/src/components/common/PageHeader.jsx`** - Simplify
- Change border radius to `rounded-lg`
- Simplify subtitle (remove decorative dash line)
- Simplify badge styling
- Keep icon + title + actions layout

**11. `frontend/src/components/common/DataTable.jsx`** - Simplify
- Change border radius from `rounded-[2.5rem]` to `rounded-lg`
- Rename "Interaction" column header to "Actions"
- Rename "Repository Status: Empty" to just the empty message
- Reduce padding from `px-8 py-6` to `px-4 py-3` (match Eldaved)
- Simplify footer text from "Showing X entries detected in current filter" to "Showing X entries"
- Use `text-xs` instead of `text-[10px] font-black tracking-[0.2em]` for headers

**12. `frontend/src/components/ui/Modal.jsx`** - Simplify
- Change border radius from `rounded-[2.5rem]` to `rounded-xl`
- Remove gradient header decorator line
- Remove animated pulse dot on title
- Simplify subtitle style
- Reduce padding from `p-8 md:p-10` to `p-6`
- Remove rotate-90 hover on close button

### Phase 5: Pages

**13. `frontend/src/pages/Login.jsx`** - Match Eldaved's clean design
- Replace split-screen layout with Eldaved's centered single-card design
- Dark gradient background (`from-gray-900 via-gray-800 to-gray-700`)
- Centered card: company name in gold at top, white form card below
- Gold accent button instead of blue
- Focus ring in gold instead of blue
- Remove framer-motion animations (keep it simple)
- Remove left panel with feature badges

**14. `frontend/src/pages/ProductsPage.jsx`** - Fix language
- "Asset Repository" -> "Products"
- "Comprehensive inventory management system" -> "Manage your product inventory"
- "Units Catalogued" -> "Products"
- "Search assets by signature, code or specifications..." -> "Search products..."
- "Product Core" -> "Product"
- "Inventory Status" -> "Stock"
- "Valuation" -> "Price"
- "Base Listing Price" -> "Retail Price"
- "Register Asset" -> "Add Product"
- "Main Repository" -> "In Stock"
- Reduce border radius on search bar

**15. `frontend/src/pages/POS.jsx`** - Simplify language
- "Active Terminal" -> "Cart"
- "Session ID: ..." -> remove
- "Synchronizing Inventory..." -> "Loading products..."
- "Inventory Node: X Assets Available" -> "X Products Available"
- Reduce border radius throughout
- Simplify category button styling

**16. `frontend/src/pages/SalesHistoryPage.jsx`** - Simplify styling
- Reduce border radius
- Fix any jargon labels

**17. `frontend/src/pages/SalesAnalytics.jsx`** - Simplify styling
- Reduce border radius
- Fix any jargon labels

### Phase 6: Secondary Components

**18. `frontend/src/components/sales/POSProductCard.jsx`** - Simplify radius
**19. `frontend/src/components/sales/POSCart.jsx`** - Simplify language
**20. `frontend/src/components/sales/POSCheckout.jsx`** - Simplify styling
**21. `frontend/src/components/product/ProductFormModal.jsx`** - Simplify styling

---

## Design Rules Applied Throughout

| Property | Before (General-BMS) | After (Match Eldaved) |
|----------|---------------------|----------------------|
| Card radius | `rounded-[2rem]` / `rounded-[2.5rem]` | `rounded-lg` |
| Modal radius | `rounded-[2.5rem]` | `rounded-xl` |
| Button radius | `rounded-2xl` | `rounded-lg` |
| Input radius | `rounded-2xl` | `rounded-lg` |
| Accent color | `#3B82F6` (blue) | `#D4AF37` (gold) |
| Accent light | `#EFF6FF` | `#FFD700` |
| Accent dark | `#2563EB` | `#C5A353` |
| Title weight | `font-black` | `font-bold` or `font-semibold` |
| Label style | `text-[10px] font-black uppercase tracking-[0.2em]` | `text-xs font-medium` |
| Card padding | `p-7` / `p-8 md:p-10` | `p-4 md:p-6` |
| Table padding | `px-8 py-6` | `px-4 py-3` |
| Language | Tech jargon | Normal business terms |
| Decorations | Glowing dots, blur effects, gradients | Clean, minimal |

---

## Verification

1. Run `npm run dev` in `frontend/` and verify:
   - Login page renders with dark bg + centered gold-accent card
   - Dashboard shows clean KPI cards with gold accents
   - Sidebar navigation uses gold active states
   - Theme switching (Light/Charcoal/Midnight/Ocean) all work
   - All pages render without console errors
   - POS page works with simplified styling
   - Products page shows proper business terminology
   - Modals open with reasonable border radius
   - Tables render cleanly with proper padding
2. Test mobile responsiveness (sidebar toggle, responsive grids)
