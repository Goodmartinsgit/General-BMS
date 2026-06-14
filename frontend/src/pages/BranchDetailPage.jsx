import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { branchesAPI } from '../api/branches';
import { useCurrency } from '../context/CurrencyContext';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { useAuth } from '../context/AuthContext';
import usePermissions from '../hooks/usePermissions';
import { toast } from 'react-toastify';
import BranchFormModal from '../components/BranchFormModal';
import {
  Building2, MapPin, Phone, Mail, Users, Package, DollarSign,
  ArrowLeft, Calendar, Hash, Loader2, User, Edit2, BarChart3,
  CheckCircle, XCircle, Warehouse, Search, Trash2, ChevronRight,
  TrendingUp, ShoppingCart, AlertTriangle
} from 'lucide-react';

const BranchDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { formatCurrency } = useCurrency();
  const { auth } = useAuth();
  const { canViewFinancials } = usePermissions();

  const [branch, setBranch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  // Analytics data
  const [dashboard, setDashboard] = useState(null);
  const [inventory, setInventory] = useState(null);
  const [staffPerformance, setStaffPerformance] = useState(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);

  // Search for products tab
  const [productSearch, setProductSearch] = useState('');

  // Edit modal
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [organizations, setOrganizations] = useState([]);

  useEffect(() => {
    fetchBranch();
  }, [id]);

  useEffect(() => {
    if (branch) {
      fetchAnalytics();
    }
  }, [branch, activeTab]);

  const fetchBranch = async () => {
    try {
      setLoading(true);
      const data = await branchesAPI.getBranch(id);
      setBranch(data);
    } catch (err) {
      toast.error('Failed to load branch details');
      navigate('/branches');
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    try {
      setLoadingAnalytics(true);

      if (activeTab === 'overview' && !dashboard) {
        const data = await branchesAPI.getBranchDashboard(id);
        setDashboard(data);
      }

      if (activeTab === 'products' && !inventory) {
        const data = await branchesAPI.getBranchInventoryValuation(id);
        setInventory(data);
      }

      if (activeTab === 'staff' && !staffPerformance) {
        const data = await branchesAPI.getBranchStaffPerformance(id);
        setStaffPerformance(data);
      }
    } catch (err) {
      console.error('Analytics load error:', err);
    } finally {
      setLoadingAnalytics(false);
    }
  };

  const handleEditSubmit = async (data) => {
    try {
      await branchesAPI.updateBranch(id, data);
      toast.success('Branch updated');
      setIsEditModalOpen(false);
      fetchBranch();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Delete "${branch.branch_name}"? This cannot be undone.`)) return;
    try {
      await branchesAPI.deleteBranch(id);
      toast.success('Branch deleted');
      navigate('/branches');
    } catch (err) {
      toast.error('Delete failed');
    }
  };

  if (loading) {
    return <LoadingSpinner size="lg" text="Loading branch..." className="h-64" />;
  }

  if (!branch) return null;

  // Filter inventory items
  const filteredInventory = (inventory?.inventory_items || []).filter(item => {
    if (!productSearch) return true;
    const q = productSearch.toLowerCase();
    return (
      (item.product_name || '').toLowerCase().includes(q) ||
      (item.product_code || '').toLowerCase().includes(q)
    );
  });

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Building2 },
    { id: 'products', label: 'Products', icon: Package },
    { id: 'staff', label: 'Staff', icon: Users },
  ];

  return (
    <div className="space-y-6 p-6">
      {/* Back Navigation */}
      <button
        onClick={() => navigate('/branches')}
        className="flex items-center gap-2 text-sm text-secondary hover:text-accent transition"
      >
        <ArrowLeft size={16} />
        Back to Branches
      </button>

      {/* Branch Header */}
      <div className="bg-card border border-default rounded-2xl p-6">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className={`shrink-0 w-14 h-14 rounded-2xl flex items-center justify-center ${
              branch.is_warehouse
                ? 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400'
                : 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
            }`}>
              {branch.is_warehouse ? <Warehouse size={28} /> : <Building2 size={28} />}
            </div>
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl font-bold text-primary">{branch.branch_name}</h1>
                <span className="font-mono text-xs bg-default px-2 py-0.5 rounded-lg text-secondary">
                  {branch.branch_code}
                </span>
                <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full font-medium ${
                  branch.is_active
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                    : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                }`}>
                  {branch.is_active ? <CheckCircle size={12} /> : <XCircle size={12} />}
                  {branch.is_active ? 'Active' : 'Inactive'}
                </span>
                {branch.is_warehouse && (
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 font-medium">
                    Warehouse
                  </span>
                )}
              </div>
              {branch.organization_name && (
                <p className="text-sm text-secondary mt-1">{branch.organization_name}</p>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate(`/branches/${id}/analytics`)}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl bg-gradient-to-r from-blue-500 to-indigo-500 text-white hover:shadow-lg transition"
            >
              <BarChart3 size={16} />
              Analytics
            </button>
            <button
              onClick={() => { setIsEditModalOpen(true); }}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl border border-default text-primary hover:bg-hover transition"
            >
              <Edit2 size={16} />
              Edit
            </button>
            <button
              onClick={handleDelete}
              className="p-2 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition"
              title="Delete"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-card border border-default rounded-2xl p-1.5">
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl transition flex-1 justify-center ${
                activeTab === tab.id
                  ? 'bg-accent text-white shadow-sm'
                  : 'text-secondary hover:text-primary hover:bg-hover'
              }`}
            >
              <Icon size={16} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <OverviewTab branch={branch} dashboard={dashboard} formatCurrency={formatCurrency} loading={loadingAnalytics} canViewFinancials={canViewFinancials} />
      )}
      {activeTab === 'products' && (
        <ProductsTab
          inventory={filteredInventory}
          totals={inventory?.totals}
          search={productSearch}
          setSearch={setProductSearch}
          formatCurrency={formatCurrency}
          loading={loadingAnalytics}
          canViewFinancials={canViewFinancials}
        />
      )}
      {activeTab === 'staff' && (
        <StaffTab staff={staffPerformance} formatCurrency={formatCurrency} loading={loadingAnalytics} />
      )}

      {/* Edit Modal */}
      <BranchFormModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSubmit={handleEditSubmit}
        branch={branch}
        organizations={organizations}
        users={[]}
      />
    </div>
  );
};

// ─── Overview Tab ──────────────────────────────────────────
const OverviewTab = ({ branch, dashboard, formatCurrency, loading, canViewFinancials }) => (
  <div className="space-y-6">
    {/* Contact Info */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <InfoCard title="Location & Contact">
        <InfoRow icon={MapPin} label="Address" value={branch.address || '—'} />
        <InfoRow icon={MapPin} label="City / State" value={[branch.city, branch.state].filter(Boolean).join(', ') || '—'} />
        <InfoRow icon={MapPin} label="Country" value={branch.country || '—'} />
        <InfoRow icon={Phone} label="Phone" value={branch.phone_number || '—'} />
        <InfoRow icon={Mail} label="Email" value={branch.email || '—'} />
      </InfoCard>

      <InfoCard title="Management">
        <InfoRow icon={User} label="Manager" value={branch.manager_name || 'Not assigned'} />
        <InfoRow icon={Calendar} label="Created" value={branch.created_at ? new Date(branch.created_at).toLocaleDateString() : '—'} />
        <InfoRow icon={Calendar} label="Updated" value={branch.updated_at ? new Date(branch.updated_at).toLocaleDateString() : '—'} />
      </InfoCard>
    </div>

    {/* Quick Stats from Dashboard */}
    {loading ? (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="animate-spin text-accent" size={24} />
      </div>
    ) : dashboard ? (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <QuickStat
          icon={ShoppingCart}
          label="Total Sales"
          value={dashboard.sales_summary?.total_sales || 0}
          color="blue"
        />
        {canViewFinancials && (
        <QuickStat
          icon={DollarSign}
          label="Revenue"
          value={formatCurrency(dashboard.sales_summary?.total_revenue || 0)}
          color="green"
        />
        )}
        {canViewFinancials && (
        <QuickStat
          icon={TrendingUp}
          label="Profit"
          value={formatCurrency(dashboard.sales_summary?.total_profit || 0)}
          color="emerald"
        />
        )}
        <QuickStat
          icon={Users}
          label="Customers"
          value={dashboard.unique_customers || 0}
          color="purple"
        />
      </div>
    ) : null}

    {/* Top Products */}
    {dashboard?.top_products?.length > 0 && (
      <div className="bg-card border border-default rounded-2xl p-5">
        <h3 className="text-sm font-semibold text-primary mb-4">Top Selling Products</h3>
        <div className="space-y-3">
          {dashboard.top_products.slice(0, 5).map((product, i) => (
            <div key={i} className="flex items-center justify-between py-2 border-b border-default last:border-0">
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-accent/10 text-accent text-xs font-bold flex items-center justify-center">
                  {i + 1}
                </span>
                <div>
                  <p className="text-sm font-medium text-primary">{product.product_name}</p>
                  <p className="text-xs text-secondary font-mono">{product.product_code}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-primary">{formatCurrency(product.revenue)}</p>
                <p className="text-xs text-secondary">{product.quantity_sold} sold</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    )}
  </div>
);

// ─── Products Tab ──────────────────────────────────────────
const ProductsTab = ({ inventory, totals, search, setSearch, formatCurrency, loading, canViewFinancials }) => (
  <div className="space-y-4">
    {/* Totals */}
    {totals && (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {canViewFinancials && (
        <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-200/30 rounded-2xl p-4">
          <p className="text-xs text-blue-600 dark:text-blue-400 mb-1">Cost Value</p>
          <p className="text-lg font-bold text-blue-700 dark:text-blue-300">{formatCurrency(totals.total_cost_value)}</p>
        </div>
        )}
        {canViewFinancials && (
        <div className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border border-emerald-200/30 rounded-2xl p-4">
          <p className="text-xs text-emerald-600 dark:text-emerald-400 mb-1">Selling Value</p>
          <p className="text-lg font-bold text-emerald-700 dark:text-emerald-300">{formatCurrency(totals.total_selling_value)}</p>
        </div>
        )}
        {canViewFinancials && (
        <div className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border border-purple-200/30 rounded-2xl p-4">
          <p className="text-xs text-purple-600 dark:text-purple-400 mb-1">Potential Profit</p>
          <p className="text-lg font-bold text-purple-700 dark:text-purple-300">{formatCurrency(totals.total_potential_profit)}</p>
        </div>
        )}
      </div>
    )}

    {/* Search */}
    <div className="relative max-w-md">
      <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary" />
      <input
        type="text"
        placeholder="Search products..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full pl-10 pr-4 py-2.5 bg-card border border-default rounded-xl text-sm text-primary placeholder:text-secondary focus:outline-none focus:ring-2 focus:ring-accent/30 transition"
      />
    </div>

    {loading ? (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="animate-spin text-accent" size={24} />
      </div>
    ) : inventory.length === 0 ? (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Package size={40} className="text-secondary/30 mb-3" />
        <p className="text-primary font-medium">No products in stock</p>
        <p className="text-sm text-secondary mt-1">This branch has no inventory items</p>
      </div>
    ) : (
      <div className="bg-card border border-default rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-default">
                <th className="text-left py-3 px-4 text-xs font-semibold text-secondary uppercase">Product</th>
                <th className="text-right py-3 px-4 text-xs font-semibold text-secondary uppercase">On Hand</th>
                {canViewFinancials && <th className="text-right py-3 px-4 text-xs font-semibold text-secondary uppercase hidden md:table-cell">Cost Price</th>}
                <th className="text-right py-3 px-4 text-xs font-semibold text-secondary uppercase hidden md:table-cell">Sell Price</th>
                {canViewFinancials && <th className="text-right py-3 px-4 text-xs font-semibold text-secondary uppercase">Stock Value</th>}
              </tr>
            </thead>
            <tbody>
              {inventory.map((item, i) => (
                <tr key={item.id || i} className="border-b border-default last:border-0 hover:bg-hover transition">
                  <td className="py-3 px-4">
                    <p className="font-medium text-primary">{item.product_name}</p>
                    <p className="text-xs text-secondary font-mono">{item.product_code}</p>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <span className={`font-semibold ${
                      item.quantity_on_hand <= (item.reorder_level || 5)
                        ? 'text-red-600 dark:text-red-400'
                        : 'text-primary'
                    }`}>
                      {item.quantity_on_hand}
                    </span>
                  </td>
                  {canViewFinancials && (
                  <td className="py-3 px-4 text-right text-secondary hidden md:table-cell">
                    {formatCurrency(item.cost_price)}
                  </td>
                  )}
                  <td className="py-3 px-4 text-right text-secondary hidden md:table-cell">
                    {formatCurrency(item.selling_price)}
                  </td>
                  {canViewFinancials && (
                  <td className="py-3 px-4 text-right font-semibold text-primary">
                    {formatCurrency(item.selling_value)}
                  </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    )}
  </div>
);

// ─── Staff Tab ────────────────────────────────────────────
const StaffTab = ({ staff, formatCurrency, loading }) => (
  <div className="space-y-4">
    {loading ? (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="animate-spin text-accent" size={24} />
      </div>
    ) : !staff || staff.length === 0 ? (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Users size={40} className="text-secondary/30 mb-3" />
        <p className="text-primary font-medium">No staff data</p>
        <p className="text-sm text-secondary mt-1">No sales recorded by staff at this branch</p>
      </div>
    ) : (
      <div className="bg-card border border-default rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-default">
                <th className="text-left py-3 px-4 text-xs font-semibold text-secondary uppercase">Staff Member</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-secondary uppercase hidden md:table-cell">Role</th>
                <th className="text-right py-3 px-4 text-xs font-semibold text-secondary uppercase">Sales</th>
                <th className="text-right py-3 px-4 text-xs font-semibold text-secondary uppercase">Revenue</th>
                <th className="text-right py-3 px-4 text-xs font-semibold text-secondary uppercase hidden lg:table-cell">Avg Sale</th>
                <th className="text-right py-3 px-4 text-xs font-semibold text-secondary uppercase hidden lg:table-cell">Customers</th>
              </tr>
            </thead>
            <tbody>
              {staff.map((person, i) => (
                <tr key={person.user_id || i} className="border-b border-default last:border-0 hover:bg-hover transition">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-accent/10 text-accent font-bold text-xs flex items-center justify-center">
                        {(person.full_name || '?').charAt(0).toUpperCase()}
                      </div>
                      <span className="font-medium text-primary">{person.full_name}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 hidden md:table-cell">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-default text-secondary capitalize">
                      {person.role}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right font-semibold text-primary">{person.sales_count}</td>
                  <td className="py-3 px-4 text-right font-semibold text-primary">{formatCurrency(person.total_revenue)}</td>
                  <td className="py-3 px-4 text-right text-secondary hidden lg:table-cell">
                    {formatCurrency(person.avg_sale_value)}
                  </td>
                  <td className="py-3 px-4 text-right text-secondary hidden lg:table-cell">
                    {person.unique_customers_served}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    )}
  </div>
);

// ─── Shared Components ────────────────────────────────────
const InfoCard = ({ title, children }) => (
  <div className="bg-card border border-default rounded-2xl p-5">
    <h3 className="text-sm font-semibold text-primary mb-4">{title}</h3>
    <div className="space-y-3">{children}</div>
  </div>
);

const InfoRow = ({ icon: Icon, label, value }) => (
  <div className="flex items-start gap-3">
    <Icon size={15} className="text-secondary mt-0.5 shrink-0" />
    <div>
      <p className="text-xs text-secondary">{label}</p>
      <p className="text-sm text-primary">{value}</p>
    </div>
  </div>
);

const QuickStat = ({ icon: Icon, label, value, color }) => {
  const colorMap = {
    blue: 'from-blue-500/10 to-blue-600/5 text-blue-600',
    green: 'from-emerald-500/10 to-emerald-600/5 text-emerald-600',
    emerald: 'from-teal-500/10 to-teal-600/5 text-teal-600',
    purple: 'from-purple-500/10 to-purple-600/5 text-purple-600',
  };

  return (
    <div className={`bg-gradient-to-br ${colorMap[color]} border border-default rounded-2xl p-4`}>
      <div className="flex items-center gap-2 mb-2">
        <Icon size={16} />
        <span className="text-xs font-medium opacity-80">{label}</span>
      </div>
      <p className="text-xl font-bold">{value}</p>
    </div>
  );
};

export default BranchDetailPage;
