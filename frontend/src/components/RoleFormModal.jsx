import React, { useState, useEffect, useMemo } from 'react';
import { X, Shield, ChevronDown, ChevronRight, Check } from 'lucide-react';
import { toast } from 'react-toastify';
import usersAPI from '../api/users';

// ── Permission catalogue ─────────────────────────────────────────────────────
// Grouped by module for the checkbox UI.  Each entry: { key, label }
const PERMISSION_GROUPS = [
  {
    group: 'Dashboard & Analytics',
    permissions: [
      { key: 'view_dashboard', label: 'View Dashboard' },
      { key: 'view_analytics', label: 'View Analytics' },
      { key: 'view_reports', label: 'View Reports' },
      { key: 'view_dashboard_financials', label: 'View Financial Data on Dashboard' },
    ],
  },
  {
    group: 'Point of Sale',
    permissions: [
      { key: 'access_pos', label: 'Access POS' },
      { key: 'apply_discounts', label: 'Apply Discounts on Sales' },
    ],
  },
  {
    group: 'Sales',
    permissions: [
      { key: 'view_sales', label: 'View Own Sales' },
      { key: 'view_all_sales', label: 'View All Sales (all staff)' },
      { key: 'create_sales', label: 'Create Sales' },
      { key: 'reverse_sales', label: 'Reverse / Void Sales' },
    ],
  },
  {
    group: 'Products',
    permissions: [
      { key: 'view_products', label: 'View Products' },
      { key: 'manage_products', label: 'Manage Products' },
    ],
  },
  {
    group: 'Inventory & Stock',
    permissions: [
      { key: 'view_inventory', label: 'View Inventory' },
      { key: 'manage_inventory', label: 'Manage Inventory' },
      { key: 'view_stock', label: 'View Stock' },
      { key: 'manage_stock', label: 'Manage Stock' },
      { key: 'approve_stock_transfers', label: 'Approve Stock Transfers' },
    ],
  },
  {
    group: 'Customers',
    permissions: [
      { key: 'view_customers', label: 'View Customers' },
      { key: 'create_customers', label: 'Create Customers' },
      { key: 'update_customers', label: 'Update Customers' },
      { key: 'delete_customers', label: 'Delete Customers' },
    ],
  },
  {
    group: 'Users & Roles',
    permissions: [
      { key: 'view_users', label: 'View Users' },
      { key: 'manage_users', label: 'Manage Users & Roles' },
    ],
  },
  {
    group: 'Suppliers & Vendors',
    permissions: [
      { key: 'view_suppliers', label: 'View Suppliers' },
      { key: 'manage_suppliers', label: 'Manage Suppliers' },
      { key: 'view_vendors', label: 'View Vendors' },
      { key: 'manage_vendors', label: 'Manage Vendors' },
    ],
  },
  {
    group: 'Purchase Orders',
    permissions: [
      { key: 'view_purchase_orders', label: 'View Purchase Orders' },
      { key: 'manage_purchase_orders', label: 'Manage Purchase Orders' },
    ],
  },
  {
    group: 'Invoices & Quotations',
    permissions: [
      { key: 'view_invoices', label: 'View Invoices' },
      { key: 'manage_invoices', label: 'Manage Invoices' },
      { key: 'view_quotations', label: 'View Quotations' },
      { key: 'manage_quotations', label: 'Manage Quotations' },
    ],
  },
  {
    group: 'Finance',
    permissions: [
      { key: 'view_payments', label: 'View Payments' },
      { key: 'manage_payments', label: 'Manage Payments' },
      { key: 'view_expenses', label: 'View Expenses' },
      { key: 'manage_expenses', label: 'Manage Expenses' },
      { key: 'delete_expenses', label: 'Delete Expenses' },
      { key: 'view_bills', label: 'View Bills' },
      { key: 'manage_bills', label: 'Manage Bills' },
      { key: 'view_banks', label: 'View Banks' },
      { key: 'manage_banks', label: 'Manage Banks' },
      { key: 'view_budgets', label: 'View Budgets' },
      { key: 'manage_budgets', label: 'Manage Budgets' },
      { key: 'view_accounting', label: 'View Accounting' },
      { key: 'manage_accounting', label: 'Manage Accounting' },
    ],
  },
  {
    group: 'Promotions & Pricing',
    permissions: [
      { key: 'view_promotions', label: 'View Promotions' },
      { key: 'manage_promotions', label: 'Manage Promotions' },
      { key: 'view_price_tiers', label: 'View Price Tiers' },
      { key: 'manage_price_tiers', label: 'Manage Price Tiers' },
    ],
  },
  {
    group: 'Wholesale',
    permissions: [
      { key: 'view_wholesale_orders', label: 'View Wholesale Orders' },
      { key: 'manage_wholesale_orders', label: 'Manage Wholesale Orders' },
    ],
  },
  {
    group: 'Returns & Refunds',
    permissions: [
      { key: 'view_returns', label: 'View Returns' },
      { key: 'manage_returns', label: 'Manage Returns' },
    ],
  },
  {
    group: 'Receipts',
    permissions: [
      { key: 'view_receipts', label: 'View Receipts' },
      { key: 'manage_receipts', label: 'Manage Receipts' },
    ],
  },
  {
    group: 'HR & Payroll',
    permissions: [
      { key: 'manage_payroll', label: 'Manage Payroll' },
      { key: 'view_performance_tasks', label: 'View Performance Tasks' },
      { key: 'manage_performance_tasks', label: 'Manage Performance Tasks' },
      { key: 'view_tasks', label: 'View Tasks' },
      { key: 'manage_tasks', label: 'Manage Tasks' },
    ],
  },
  {
    group: 'Branches',
    permissions: [
      { key: 'view_branches', label: 'View Branches' },
      { key: 'manage_branches', label: 'Manage Branches' },
    ],
  },
  {
    group: 'Referrers',
    permissions: [
      { key: 'view_referrers', label: 'View Referrers' },
      { key: 'manage_referrers', label: 'Manage Referrers' },
    ],
  },
  {
    group: 'Online Store',
    permissions: [
      { key: 'view_online_orders', label: 'View Online Orders' },
      { key: 'process_online_orders', label: 'Process Orders (update status)' },
      { key: 'verify_order_payment', label: 'Verify / Confirm Payments' },
      { key: 'update_order_tracking', label: 'Update Tracking Info' },
      { key: 'edit_order_notes', label: 'Edit Order Notes' },
      { key: 'manage_change_requests', label: 'Manage Change Requests' },
      { key: 'view_online_store', label: 'View Store Settings & Builder' },
      { key: 'manage_online_store', label: 'Manage Store Settings & Builder' },
    ],
  },
  {
    group: 'Settings & System',
    permissions: [
      { key: 'view_settings', label: 'View Settings' },
      { key: 'manage_settings', label: 'Manage Settings' },
      { key: 'view_audit_logs', label: 'View Audit / Activity Logs' },
      { key: 'view_recycle_bin', label: 'View Recycle Bin' },
      { key: 'manage_recycle_bin', label: 'Manage Recycle Bin' },
    ],
  },
];

const ALL_PERMISSION_KEYS = PERMISSION_GROUPS.flatMap(g => g.permissions.map(p => p.key));

// ── Component ────────────────────────────────────────────────────────────────

const RoleFormModal = ({ isOpen, onClose, onSuccess, role, currentUserRoleLevel }) => {
  const isEdit = !!role;

  const [formData, setFormData] = useState({ role_name: '', description: '', role_level: 4 });
  const [permissions, setPermissions] = useState({});
  const [loading, setLoading] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState({});

  // Initialise form when opening
  useEffect(() => {
    if (!isOpen) return;
    if (role) {
      setFormData({
        role_name: role.role_name || '',
        description: role.description || '',
        role_level: role.role_level ?? 4,
      });
      setPermissions(role.permissions || {});
    } else {
      setFormData({ role_name: '', description: '', role_level: 4 });
      setPermissions({});
    }
    setExpandedGroups({});
  }, [isOpen, role]);

  // ── Permission helpers ───────────────────────────────────────────────────
  const togglePermission = (key) => {
    setPermissions(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleGroup = (group) => {
    const keys = group.permissions.map(p => p.key);
    const allChecked = keys.every(k => permissions[k]);
    const updated = { ...permissions };
    keys.forEach(k => { updated[k] = !allChecked; });
    setPermissions(updated);
  };

  const selectAll = () => {
    const updated = {};
    ALL_PERMISSION_KEYS.forEach(k => { updated[k] = true; });
    setPermissions(updated);
  };

  const clearAll = () => {
    setPermissions({});
  };

  const toggleExpand = (groupName) => {
    setExpandedGroups(prev => ({ ...prev, [groupName]: !prev[groupName] }));
  };

  const expandAll = () => {
    const all = {};
    PERMISSION_GROUPS.forEach(g => { all[g.group] = true; });
    setExpandedGroups(all);
  };

  const collapseAll = () => {
    setExpandedGroups({});
  };

  // ── Stats ────────────────────────────────────────────────────────────────
  const permCount = useMemo(
    () => ALL_PERMISSION_KEYS.filter(k => permissions[k]).length,
    [permissions]
  );

  // ── Submit ───────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.role_name.trim()) {
      toast.error('Role name is required');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        role_name: formData.role_name.trim(),
        description: formData.description.trim(),
        role_level: Number(formData.role_level),
        permissions,
      };

      if (isEdit) {
        await usersAPI.updateRole(role.id, payload);
        toast.success('Role updated successfully');
      } else {
        await usersAPI.createRole(payload);
        toast.success('Role created successfully');
      }
      onSuccess();
    } catch (err) {
      toast.error(err.response?.data?.message || `Failed to ${isEdit ? 'update' : 'create'} role`);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const isSuperAdmin = role?.role_level <= 1;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 backdrop-blur-sm overflow-y-auto py-6 sm:py-10">
      <div className="bg-theme-secondary rounded-xl border border-theme shadow-2xl w-full max-w-3xl mx-4 my-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-theme">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-accent-gold/10 rounded-xl flex items-center justify-center">
              <Shield className="w-5 h-5 text-accent-gold" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-theme-primary">
                {isEdit ? 'Edit Role' : 'Create New Role'}
              </h2>
              <p className="text-xs text-theme-muted">
                {isEdit ? `Editing "${role.role_name}"` : 'Define a role with specific permissions'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-theme-muted hover:text-theme-primary rounded-lg hover:bg-theme-tertiary transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="px-6 py-5 space-y-5 max-h-[calc(100vh-200px)] overflow-y-auto">
            {/* Role details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-theme-primary mb-1.5">Role Name *</label>
                <input
                  type="text"
                  value={formData.role_name}
                  onChange={e => setFormData(prev => ({ ...prev, role_name: e.target.value }))}
                  disabled={isSuperAdmin}
                  placeholder="e.g. Store Manager"
                  className="w-full px-3 py-2 border border-theme rounded-lg bg-theme-primary text-theme-primary text-sm focus:ring-2 focus:ring-accent-gold/20 focus:border-accent-gold/30 outline-none disabled:opacity-50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-theme-primary mb-1.5">Priority Level</label>
                <select
                  value={formData.role_level}
                  onChange={e => setFormData(prev => ({ ...prev, role_level: e.target.value }))}
                  disabled={isSuperAdmin}
                  className="w-full px-3 py-2 border border-theme rounded-lg bg-theme-primary text-theme-primary text-sm focus:ring-2 focus:ring-accent-gold/20 focus:border-accent-gold/30 outline-none disabled:opacity-50"
                >
                  {[2, 3, 4, 5, 6, 7, 8, 9, 10].filter(l => l > currentUserRoleLevel).map(level => (
                    <option key={level} value={level}>
                      Level {level} {level === 2 ? '(Admin)' : level === 3 ? '(Manager)' : level === 4 ? '(Staff)' : ''}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-theme-muted">Lower number = higher privilege. Must be below your level.</p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-theme-primary mb-1.5">Description</label>
              <input
                type="text"
                value={formData.description}
                onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                disabled={isSuperAdmin}
                placeholder="Brief description of this role's purpose"
                className="w-full px-3 py-2 border border-theme rounded-lg bg-theme-primary text-theme-primary text-sm focus:ring-2 focus:ring-accent-gold/20 focus:border-accent-gold/30 outline-none disabled:opacity-50"
              />
            </div>

            {/* Permissions */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-sm font-semibold text-theme-primary">
                    Permissions
                  </h3>
                  <p className="text-xs text-theme-muted mt-0.5">
                    {permCount} of {ALL_PERMISSION_KEYS.length} permissions selected
                  </p>
                </div>
                {!isSuperAdmin && (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={expandAll}
                      className="text-xs text-theme-muted hover:text-theme-primary transition-colors"
                    >
                      Expand all
                    </button>
                    <span className="text-theme-muted">·</span>
                    <button
                      type="button"
                      onClick={collapseAll}
                      className="text-xs text-theme-muted hover:text-theme-primary transition-colors"
                    >
                      Collapse all
                    </button>
                    <span className="text-theme-muted">·</span>
                    <button
                      type="button"
                      onClick={selectAll}
                      className="text-xs text-accent-gold hover:text-accent-goldDark font-medium transition-colors"
                    >
                      Select all
                    </button>
                    <span className="text-theme-muted">·</span>
                    <button
                      type="button"
                      onClick={clearAll}
                      className="text-xs text-red-500 hover:text-red-600 font-medium transition-colors"
                    >
                      Clear all
                    </button>
                  </div>
                )}
              </div>

              {/* Permission progress bar */}
              <div className="w-full bg-theme-tertiary rounded-full h-1.5 mb-4">
                <div
                  className="bg-accent-gold h-1.5 rounded-full transition-all duration-300"
                  style={{ width: `${(permCount / ALL_PERMISSION_KEYS.length) * 100}%` }}
                />
              </div>

              <div className="space-y-1">
                {PERMISSION_GROUPS.map(group => {
                  const groupKeys = group.permissions.map(p => p.key);
                  const checkedCount = groupKeys.filter(k => permissions[k]).length;
                  const allChecked = checkedCount === groupKeys.length;
                  const someChecked = checkedCount > 0 && !allChecked;
                  const isExpanded = expandedGroups[group.group];

                  return (
                    <div key={group.group} className="border border-theme rounded-lg overflow-hidden">
                      {/* Group header */}
                      <div
                        className="flex items-center gap-3 px-3 py-2.5 bg-theme-primary cursor-pointer hover:bg-theme-tertiary transition-colors"
                        onClick={() => toggleExpand(group.group)}
                      >
                        {isExpanded
                          ? <ChevronDown size={16} className="text-theme-muted shrink-0" />
                          : <ChevronRight size={16} className="text-theme-muted shrink-0" />
                        }

                        {/* Group checkbox */}
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); if (!isSuperAdmin) toggleGroup(group); }}
                          disabled={isSuperAdmin}
                          className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${
                            allChecked
                              ? 'bg-accent-gold border-accent-gold'
                              : someChecked
                                ? 'bg-accent-gold/30 border-accent-gold'
                                : 'border-gray-400 dark:border-gray-500'
                          } disabled:opacity-50`}
                        >
                          {allChecked && <Check size={12} className="text-white" strokeWidth={3} />}
                          {someChecked && <div className="w-2 h-0.5 bg-white rounded" />}
                        </button>

                        <span className="text-sm font-medium text-theme-primary flex-1">
                          {group.group}
                        </span>
                        <span className="text-xs text-theme-muted">
                          {checkedCount}/{groupKeys.length}
                        </span>
                      </div>

                      {/* Group permissions */}
                      {isExpanded && (
                        <div className="px-3 py-2 grid grid-cols-1 sm:grid-cols-2 gap-1 bg-theme-secondary">
                          {group.permissions.map(perm => (
                            <label
                              key={perm.key}
                              className={`flex items-center gap-2.5 px-2 py-1.5 rounded-md cursor-pointer hover:bg-theme-primary transition-colors ${isSuperAdmin ? 'opacity-50 pointer-events-none' : ''}`}
                            >
                              <input
                                type="checkbox"
                                checked={!!permissions[perm.key]}
                                onChange={() => togglePermission(perm.key)}
                                disabled={isSuperAdmin}
                                className="w-3.5 h-3.5 rounded border-gray-400 text-accent-gold focus:ring-accent-gold/30"
                              />
                              <span className="text-sm text-theme-secondary">{perm.label}</span>
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-theme bg-theme-primary rounded-b-xl">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-theme-secondary border border-theme rounded-lg hover:bg-theme-tertiary transition-colors"
            >
              Cancel
            </button>
            {!isSuperAdmin && (
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2 text-sm font-semibold text-white bg-accent-gold rounded-lg hover:bg-accent-goldDark transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Saving...
                  </>
                ) : isEdit ? 'Save Changes' : 'Create Role'}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default RoleFormModal;
