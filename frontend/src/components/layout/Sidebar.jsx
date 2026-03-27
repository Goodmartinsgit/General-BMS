import React, { useState, useEffect, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Package, Users, MapPin, ClipboardList, Tags, History,
  CreditCard, Truck, Landmark, Wallet, Target, ArrowLeftRight, AlertTriangle,
  BarChart3, Settings, FilePlus, ChevronDown, ChevronRight, X, FileBox,
  RotateCcw, Activity, Trash2, ChevronLeft, Search, ShoppingCart,
  ImageIcon, PieChart, UserCheck, Building2, Calculator, FileText,
  TrendingUp, BookOpen, Scale, DollarSign, Bell, CheckSquare,
  GitMerge, Layers, Receipt, ScrollText, Briefcase, Key, LogIn,
  Store, ShoppingBag, ExternalLink, Sliders, Monitor, RefreshCw
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useBranding } from '../../context/BrandingContext';

const SidebarItem = ({ item, isActive, isCollapsed, onClick, depth = 0, isOpen = false, onToggle }) => {
  const hasChildren = item.children && item.children.length > 0;

  const Icon = item.icon;

  return (
    <div className={`relative group ${depth > 0 ? '' : 'mb-0.5'}`}>
      {/* Tooltip/Hover Menu for Collapsed State */}
      {isCollapsed && depth === 0 && (
        <div className="absolute left-full ml-2 top-0 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
          <div className="bg-[var(--retail-primary)] border border-[var(--retail-border)] rounded-lg shadow-xl py-2 min-w-[200px]">
            <div className="px-4 py-2 border-b border-[var(--retail-border)] mb-1">
              <span className="text-xs font-bold text-[var(--retail-text)] opacity-50 uppercase tracking-wider">{item.name}</span>
            </div>
            {hasChildren && item.children.map(child => (
              <Link
                key={child.href}
                to={child.href}
                onClick={onClick}
                className={`
                  flex items-center gap-3 px-4 py-2 text-sm transition-colors
                  ${child.isActive ? 'text-[var(--retail-accent)] font-medium' : 'text-[var(--retail-text)] hover:bg-[var(--retail-hover)]'}
                `}
              >
                {child.icon && <child.icon className="w-4 h-4" />}
                {child.name}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Main Item */}
      {item.standalone ? (
        <Link
          to={item.href}
          onClick={onClick}
          className={`
            flex items-center rounded-lg transition-all mx-2 py-3
            ${isCollapsed ? 'justify-center px-0' : 'gap-3 px-4'}
            ${isActive
              ? 'bg-[var(--retail-accent)] text-[var(--color-active-text)] font-semibold'
              : 'text-[var(--retail-text)] hover:bg-[var(--retail-hover)]'}
          `}
        >
          <Icon className="h-5 w-5 flex-shrink-0" />
          {!isCollapsed && <span className="text-sm">{item.name}</span>}
        </Link>
      ) : (
        <button
          onClick={() => !isCollapsed && hasChildren && onToggle?.()}
          className={`
            flex items-center rounded-lg transition-all mx-2 py-3
            ${isCollapsed ? 'justify-center px-0' : 'justify-between px-4'}
            ${isActive && hasChildren && !isCollapsed
              ? 'bg-[var(--retail-hover)] text-[var(--retail-accent)]'
              : 'text-[var(--retail-text)] hover:bg-[var(--retail-hover)]'}
          `}
          style={{ width: 'calc(100% - 1rem)' }}
        >
          <div className="flex items-center gap-3 text-left">
            <Icon className="h-5 w-5 flex-shrink-0" />
            {!isCollapsed && <span className="font-medium text-sm">{item.name}</span>}
          </div>
          {hasChildren && !isCollapsed && (
            isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />
          )}
        </button>
      )}

      {/* Children */}
      {hasChildren && isOpen && !isCollapsed && (
        <div className="ml-6 mt-1 space-y-0.5">
          {item.children.map(child => {
            const ChildIcon = child.icon;
            return (
              <Link
                key={child.href}
                to={child.href}
                onClick={onClick}
                className={`
                  flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all text-sm mx-2
                  ${child.isActive
                    ? 'bg-[var(--retail-accent)] text-[var(--color-active-text)] font-semibold'
                    : 'text-[var(--retail-text)] opacity-80 hover:opacity-100 hover:bg-[var(--retail-hover)]'}
                `}
              >
                <ChildIcon className="h-4 w-4" />
                <span>{child.name}</span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
};

const Sidebar = ({ isOpen, onClose, isCollapsed, toggleCollapse }) => {
  const { auth } = useAuth();
  const user = auth?.user;
  const { config } = useBranding();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [openGroupId, setOpenGroupId] = useState(null);

  const handleGroupToggle = (groupId) => {
    setOpenGroupId(prev => prev === groupId ? null : groupId);
  };

  useEffect(() => {
    // Auto-open the group that contains the current page
    const activeGroup = navigationGroups.find(group =>
      !group.standalone && group.children?.some(child =>
        child.exact
          ? location.pathname === child.href
          : location.pathname === child.href || location.pathname.startsWith(child.href + '/')
      )
    );
    setOpenGroupId(activeGroup?.id ?? null);
  }, [location.pathname]);

  const isActive = (path) => location.pathname === path || (path !== '/' && location.pathname.startsWith(path + '/'));

  // Helper: check if user has at least one of the given permissions
  const perms = user?.permissions || {};
  const hasPerm = (...keys) => perms['admin'] === true || keys.some(k => perms[k] === true);

  const navigationGroups = [
    {
      id: 'dashboard',
      name: 'Dashboard',
      icon: LayoutDashboard,
      href: '/',
      permission: () => hasPerm('view_dashboard', 'view_analytics'),
      standalone: true
    },
    {
      id: 'online_store',
      name: 'Online Store',
      icon: Store,
      permission: () => hasPerm('view_online_orders', 'manage_online_orders', 'view_online_store', 'manage_online_store'),
      children: [
        { name: 'Orders', href: '/online-orders', icon: ShoppingBag, permission: () => hasPerm('view_online_orders') },
        { name: 'Change Requests', href: '/change-requests', icon: RefreshCw, permission: () => hasPerm('manage_online_orders') },
        { name: 'App Builder', href: '/app-builder', icon: Monitor, permission: () => hasPerm('manage_online_store') },
        { name: 'Store Settings', href: '/store-settings', icon: Sliders, permission: () => hasPerm('manage_online_store') },
      ]
    },
    {
      id: 'branches',
      name: 'Branches',
      icon: Building2,
      permission: () => hasPerm('view_branches'),
      children: [
        { name: 'All Branches', href: '/branches', icon: Building2 },
      ]
    },
    {
      id: 'inventory',
      name: 'Inventory',
      icon: Package,
      permission: () => hasPerm('view_products', 'view_inventory', 'view_stock', 'view_purchase_orders'),
      children: [
        { name: 'Catalogue', href: '/product-catalog', icon: ImageIcon, permission: () => hasPerm('view_products') },
        { name: 'Products', href: '/products', icon: Package, permission: () => hasPerm('view_products') },
        { name: 'Stock Levels', href: '/inventory', icon: ClipboardList, permission: () => hasPerm('view_inventory') },
        { name: 'Categories', href: '/categories', icon: Tags, permission: () => hasPerm('view_products') },
        { name: 'Transfers', href: '/stock-transfers', icon: ArrowLeftRight, permission: () => hasPerm('view_stock') },
        { name: 'Damages', href: '/stock-damages', icon: AlertTriangle, permission: () => hasPerm('view_stock') },
        { name: 'Activity', href: '/stock-activity', icon: Activity, permission: () => hasPerm('view_stock') },
        { name: 'Purchase Orders', href: '/purchase-orders', icon: FileBox, permission: () => hasPerm('view_purchase_orders') },
      ]
    },
    {
      id: 'sales',
      name: 'Sales & Orders',
      icon: ShoppingCart,
      permission: () => hasPerm('access_pos', 'view_sales', 'create_sales', 'view_quotations', 'view_wholesale_orders', 'view_returns'),
      children: [
        { name: 'Point of Sale', href: '/pos', icon: ShoppingCart, permission: () => hasPerm('access_pos') },
        { name: 'Sales', href: '/sales', icon: History, permission: () => hasPerm('view_sales') },
        { name: 'Quotations', href: '/quotations', icon: FilePlus, permission: () => hasPerm('view_quotations') },
        { name: 'Wholesale Orders', href: '/wholesale-orders', icon: FileBox, permission: () => hasPerm('view_wholesale_orders') },
        { name: 'Returns', href: '/returns', icon: RotateCcw, permission: () => hasPerm('view_returns') },
      ]
    },
    {
      id: 'crm',
      name: 'CRM',
      icon: Users,
      permission: () => hasPerm('view_customers', 'view_suppliers', 'view_referrers'),
      children: [
        { name: 'Customers', href: '/customers', icon: Users, permission: () => hasPerm('view_customers') },
        { name: 'Suppliers', href: '/suppliers', icon: Truck, permission: () => hasPerm('view_suppliers') },
        { name: 'Referrers', href: '/referrers', icon: UserCheck, permission: () => hasPerm('view_referrers') },
      ]
    },
    {
      id: 'expenses',
      name: 'Expenses',
      icon: Wallet,
      permission: () => hasPerm('view_expenses', 'view_budgets'),
      children: [
        { name: 'Expenses', href: '/expenses', icon: CreditCard, permission: () => hasPerm('view_expenses') },
        { name: 'Budgets', href: '/budgets', icon: Target, permission: () => hasPerm('view_budgets') },
      ]
    },
    {
      id: 'accounting',
      name: 'Accounting',
      icon: Calculator,
      permission: () => hasPerm('view_payments', 'view_banks', 'view_price_tiers', 'view_accounting'),
      children: [
        { name: 'Cash Flow', href: '/cash-flow', icon: PieChart, permission: () => hasPerm('view_payments') },
        { name: 'Payments', href: '/payments', icon: Wallet, permission: () => hasPerm('view_payments') },
        { name: 'Price Tiers', href: '/price-tiers', icon: Tags, permission: () => hasPerm('view_price_tiers') },
        { name: 'Bank Channels', href: '/bank-channels', icon: Landmark, permission: () => hasPerm('view_banks') },
        { name: 'Chart of Accounts', href: '/accounting/chart-of-accounts', icon: BookOpen, permission: () => hasPerm('view_accounting') },
        { name: 'Journal Entries', href: '/accounting/journal-entries', icon: ScrollText, permission: () => hasPerm('view_accounting') },
        { name: 'Bank Reconciliation', href: '/accounting/bank-reconciliation', icon: GitMerge, permission: () => hasPerm('view_accounting') },
        { name: 'Cost Centers', href: '/accounting/cost-centers', icon: Target, permission: () => hasPerm('view_accounting') },
        { name: 'Fixed Assets', href: '/accounting/fixed-assets', icon: Layers, permission: () => hasPerm('view_accounting') },
      ]
    },
    {
      id: 'ap_ar',
      name: 'AP / AR',
      icon: Receipt,
      permission: () => hasPerm('view_vendors', 'view_bills', 'view_invoices'),
      children: [
        { name: 'Vendors', href: '/vendors', icon: Truck, permission: () => hasPerm('view_vendors') },
        { name: 'Bills', href: '/bills', icon: FileText, permission: () => hasPerm('view_bills') },
        { name: 'Invoices', href: '/invoices', icon: Receipt, permission: () => hasPerm('view_invoices') },
      ]
    },
    {
      id: 'payroll',
      name: 'Payroll & HR',
      icon: DollarSign,
      permission: () => hasPerm('manage_payroll'),
      children: [
        { name: 'Payroll Dashboard', href: '/payroll', icon: DollarSign, exact: true },
        { name: 'Employee Salaries', href: '/payroll/salaries', icon: Users },
        { name: 'Payroll Runs', href: '/payroll/runs', icon: Briefcase },
        { name: 'Payslips', href: '/payroll/payslips', icon: FileText },
        { name: 'Employee Loans', href: '/payroll/loans', icon: CreditCard },
      ]
    },
    {
      id: 'tasks',
      name: 'Task Management',
      icon: CheckSquare,
      permission: () => hasPerm('view_tasks', 'view_performance_tasks'),
      children: [
        { name: 'Tasks', href: '/tasks', icon: CheckSquare, exact: true, permission: () => hasPerm('view_tasks') },
        { name: 'Performance Tasks', href: '/performance-tasks', icon: Activity, permission: () => hasPerm('view_performance_tasks') },
      ]
    },
    {
      id: 'analytics',
      name: 'Analytics',
      icon: BarChart3,
      permission: () => hasPerm('view_analytics'),
      children: [
        { name: 'Sales', href: '/analytics/sales', icon: BarChart3 },
        { name: 'Inventory', href: '/analytics/inventory', icon: BarChart3 },
        { name: 'Customers', href: '/analytics/customers', icon: BarChart3 },
        { name: 'Expenses', href: '/analytics/expenses', icon: PieChart },
      ]
    },
    {
      id: 'reports',
      name: 'Financial Reports',
      icon: FileText,
      permission: () => hasPerm('view_reports'),
      children: [
        { name: 'Reports Hub', href: '/reports', icon: BarChart3, exact: true },
        { name: 'Sales Book', href: '/reports/sales-book', icon: BookOpen },
        { name: 'Income Statement', href: '/reports/income-statement', icon: TrendingUp },
        { name: 'Balance Sheet', href: '/reports/balance-sheet', icon: Scale },
        { name: 'Trial Balance', href: '/reports/trial-balance', icon: Calculator },
        { name: 'Consolidated P&L', href: '/reports/consolidated-pl', icon: PieChart },
        { name: 'Branch P&L', href: '/reports/branch-pl', icon: Building2 },
        { name: 'Inventory Value', href: '/reports/inventory-valuation', icon: Package },
        { name: 'Cash Flow', href: '/reports/cash-flow', icon: PieChart },
        { name: 'AR Aging', href: '/reports/ar-aging', icon: Users },
        { name: 'AP Aging', href: '/reports/ap-aging', icon: Truck },
      ]
    },
    {
      id: 'notifications',
      name: 'Notifications',
      icon: Bell,
      href: '/notifications',
      permission: () => true, // all authenticated users
      standalone: true
    },
    {
      id: 'settings',
      name: 'Settings',
      icon: Settings,
      permission: () => hasPerm('manage_settings', 'view_users', 'manage_users', 'view_recycle_bin', 'view_audit_logs'),
      children: [
        { name: 'System Settings', href: '/settings', icon: Settings, exact: true, permission: () => hasPerm('manage_settings') },
        { name: 'Users', href: '/users', icon: Users, permission: () => hasPerm('view_users', 'manage_users') },
        { name: 'Recycle Bin', href: '/recycle-bin', icon: Trash2, permission: () => hasPerm('view_recycle_bin') },
        { name: 'Activity Logs', href: '/activity-logs', icon: Activity, permission: () => hasPerm('view_audit_logs') },
        { name: 'Purge Management', href: '/purge-management', icon: Trash2, permission: () => hasPerm('manage_recycle_bin') },
      ]
    }
  ];

  const filteredNavigation = navigationGroups
    .filter(item => {
      if (item.permission) return item.permission();
      return true;
    })
    .map(item => ({
      ...item,
      isActive: item.standalone ? isActive(item.href) : item.children?.some(c => isActive(c.href)),
      children: item.children?.filter(child => {
        if (child.permission) return child.permission();
        return true;
      }).map(child => ({
        ...child,
        isActive: child.exact ? location.pathname === child.href : isActive(child.href)
      }))
    }))
    .filter(item => item.standalone || (item.children && item.children.length > 0));

  const searchResults = searchQuery
    ? filteredNavigation.flatMap(group =>
        group.children?.filter(child => child.name.toLowerCase().includes(searchQuery.toLowerCase())) || []
      )
    : [];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50 flex flex-col bg-[var(--retail-primary)] border-r border-[var(--retail-border)]
          transition-all duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          ${isCollapsed ? 'w-20' : 'w-64'}
        `}
      >
        {/* Collapse Toggle Button */}
        <button
          onClick={toggleCollapse}
          className="hidden lg:flex absolute -right-3 top-1/2 -translate-y-1/2 z-50 w-6 h-6 bg-[var(--retail-primary)] border border-[var(--retail-border)] rounded-full items-center justify-center text-[var(--retail-text)] shadow-sm hover:text-[var(--retail-accent)] hover:border-[var(--retail-accent)] transition-all group"
        >
          {isCollapsed ? (
            <ChevronRight className="w-4 h-4 transition-transform group-hover:scale-110" />
          ) : (
            <ChevronLeft className="w-4 h-4 transition-transform group-hover:scale-110" />
          )}
        </button>

        {/* Logo/Brand */}
        <div className="flex items-center h-16 px-5 border-b border-[var(--retail-border)] flex-shrink-0 relative">
          <div className="flex items-center gap-3 min-w-0">
            {(() => {
              const logoType = config.logo_type || 'icon_text';
              const companyName = config.organization_name || config.company_name || 'BMS';
              // Use logo_icon_text if set; fall back to company name initials
              const initials = companyName.split(' ').map(w => w[0]).join('').substring(0, 3).toUpperCase();
              const abbr = config.logo_icon_text || initials;

              const iconEl = config.logo_url ? (
                <img src={config.logo_url} alt="Logo" className="w-10 h-10 object-contain rounded-lg flex-shrink-0" />
              ) : (
                <div className="w-10 h-10 bg-[var(--retail-accent)] rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-[var(--color-active-text)] font-bold text-sm">{abbr}</span>
                </div>
              );

              const nameEl = !isCollapsed && (
                <span className="text-[var(--retail-text)] font-bold text-xl leading-tight truncate">
                  {companyName}
                </span>
              );

              if (logoType === 'full') {
                // Full logo image only — no text
                return iconEl;
              }
              if (logoType === 'none') {
                // Company name only — no icon
                return nameEl;
              }
              // icon_text (default): icon + company name
              return <>{iconEl}{nameEl}</>;
            })()}
          </div>

          <button onClick={onClose} className="lg:hidden absolute right-4 text-[var(--retail-text)] hover:text-[var(--retail-accent)]">
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Search */}
        <div className="px-4 py-4 shrink-0">
          <div className="relative">
            <Search className={`absolute ${isCollapsed ? 'left-1/2 -translate-x-1/2' : 'left-3'} top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--retail-text)] opacity-50`} />
            {!isCollapsed ? (
              <input
                type="text"
                placeholder="Quick search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[var(--retail-hover)] border border-[var(--retail-border)] rounded-lg py-2 pl-10 pr-4 text-sm text-[var(--retail-text)] placeholder-[var(--retail-text)]/50 focus:outline-none focus:border-[var(--retail-accent)]"
              />
            ) : (
              <div className="w-full h-9" />
            )}

            {searchQuery && !isCollapsed && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-[var(--retail-primary)] border border-[var(--retail-border)] rounded-lg shadow-xl z-50 max-h-60 overflow-y-auto py-2">
                {searchResults.length > 0 ? searchResults.map(result => (
                  <Link
                    key={result.href}
                    to={result.href}
                    onClick={() => {setSearchQuery(''); onClose();}}
                    className="flex items-center gap-3 px-4 py-2 hover:bg-[var(--retail-hover)] transition-colors"
                  >
                    <span className="text-sm text-[var(--retail-text)]">{result.name}</span>
                  </Link>
                )) : (
                  <div className="px-4 py-2 text-sm text-[var(--retail-text)] opacity-50 text-center">No results</div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-2 overflow-y-auto overflow-x-hidden">
          {filteredNavigation.map((group) => (
            <SidebarItem
              key={group.id}
              item={group}
              isActive={group.isActive}
              isCollapsed={isCollapsed}
              onClick={onClose}
              isOpen={openGroupId === group.id}
              onToggle={() => handleGroupToggle(group.id)}
            />
          ))}
        </nav>

        {/* Footer: User Info + Actions */}
        <div className="border-t border-[var(--retail-border)] bg-[var(--retail-primary)] flex-shrink-0 p-4 space-y-2">
          {/* User Info */}
          <div className={`flex items-center bg-[var(--retail-hover)] rounded-lg py-2 ${isCollapsed ? 'justify-center px-0' : 'gap-3 px-3'}`}>
            <div className="w-10 h-10 bg-[var(--retail-accent)] rounded-full flex items-center justify-center text-[var(--color-active-text)] font-bold flex-shrink-0">
              {user?.full_name?.charAt(0)?.toUpperCase()}
            </div>
            {!isCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-[var(--retail-text)] text-sm font-medium truncate">{user?.full_name}</p>
                <p className="text-[var(--retail-text)] opacity-60 text-xs truncate">{user?.role_name || 'User'}</p>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;

