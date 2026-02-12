import React, { useState, useEffect } from 'react';
import {
  Plus,
  Filter,
  Download,
  FileText,
  Package,
  Clock,
  CheckCircle,
  XCircle,
  Truck,
} from 'lucide-react';
import {
  Button,
  SearchBar,
  Badge,
  LoadingSpinner,
  EmptyState,
  ConfirmDialog,
  Tabs,
} from '../components/ui';
import {
  PurchaseOrderFormModal,
  PurchaseOrderCard,
  GRNFormModal,
} from '../components/purchase-order';

/**
 * PurchaseOrders Page
 * Main purchase order management page
 */
const PurchaseOrders = () => {
  // State
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    status: 'all',
    supplier_id: '',
    branch_id: '',
    date_from: '',
    date_to: '',
  });
  const [showFilters, setShowFilters] = useState(false);
  const [showPOForm, setShowPOForm] = useState(false);
  const [selectedPO, setSelectedPO] = useState(null);
  const [showGRNForm, setShowGRNForm] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [poToCancel, setPoToCancel] = useState(null);

  // Filter options (these would come from API)
  const [suppliers, setSuppliers] = useState([]);
  const [branches, setBranches] = useState([]);

  // Statistics
  const [stats, setStats] = useState({
    total_pos: 0,
    draft_count: 0,
    confirmed_count: 0,
    pending_delivery: 0,
    total_value: 0,
  });

  // Fetch purchase orders
  useEffect(() => {
    fetchPurchaseOrders();
  }, [searchQuery, filters]);

  // Fetch filter options
  useEffect(() => {
    fetchSuppliers();
    fetchBranches();
    fetchStats();
  }, []);

  const fetchPurchaseOrders = async () => {
    setLoading(true);
    try {
      // TODO: Replace with actual API call
      const mockData = [
        {
          id: '1',
          po_number: 'PO-20260131-0001',
          supplier_id: '1',
          supplier_name: 'ABC Suppliers Ltd',
          branch_id: '1',
          branch_name: 'Main Store',
          status: 'confirmed',
          total_amount: 5430.50,
          total_items: 15,
          expected_delivery_date: '2026-02-05',
          created_at: '2026-01-31T10:30:00Z',
          created_by_name: 'John Doe',
          items: [],
        },
        {
          id: '2',
          po_number: 'PO-20260130-0002',
          supplier_id: '2',
          supplier_name: 'XYZ Distributors',
          branch_id: '2',
          branch_name: 'Warehouse',
          status: 'partially_received',
          total_amount: 8920.00,
          total_items: 25,
          expected_delivery_date: '2026-02-03',
          created_at: '2026-01-30T14:15:00Z',
          created_by_name: 'Jane Smith',
          items: [],
        },
        {
          id: '3',
          po_number: 'PO-20260129-0003',
          supplier_id: '1',
          supplier_name: 'ABC Suppliers Ltd',
          branch_id: '1',
          branch_name: 'Main Store',
          status: 'draft',
          total_amount: 2150.75,
          total_items: 8,
          expected_delivery_date: '2026-02-10',
          created_at: '2026-01-29T09:00:00Z',
          created_by_name: 'John Doe',
          items: [],
        },
      ];

      setPurchaseOrders(mockData);
    } catch (error) {
      console.error('Error fetching purchase orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSuppliers = async () => {
    // TODO: Replace with actual API call
    setSuppliers([
      { id: '1', supplier_name: 'ABC Suppliers Ltd' },
      { id: '2', supplier_name: 'XYZ Distributors' },
      { id: '3', supplier_name: 'Global Imports Inc' },
    ]);
  };

  const fetchBranches = async () => {
    // TODO: Replace with actual API call
    setBranches([
      { id: '1', branch_name: 'Main Store' },
      { id: '2', branch_name: 'Warehouse' },
      { id: '3', branch_name: 'Branch 2' },
    ]);
  };

  const fetchStats = async () => {
    // TODO: Replace with actual API call
    setStats({
      total_pos: 45,
      draft_count: 8,
      confirmed_count: 12,
      pending_delivery: 15,
      total_value: 125430.50,
    });
  };

  const handleCreatePO = async (poData) => {
    try {
      // TODO: Replace with actual API call
      // const response = await fetch('/api/purchase-orders', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(poData),
      // });

      await fetchPurchaseOrders();
      await fetchStats();
      setShowPOForm(false);
      setSelectedPO(null);
    } catch (error) {
      console.error('Error creating purchase order:', error);
    }
  };

  const handleUpdatePO = async (poData) => {
    try {
      // TODO: Replace with actual API call
      // const response = await fetch(`/api/purchase-orders/${selectedPO.id}`, {
      //   method: 'PUT',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(poData),
      // });

      await fetchPurchaseOrders();
      setShowPOForm(false);
      setSelectedPO(null);
    } catch (error) {
      console.error('Error updating purchase order:', error);
    }
  };

  const handleConfirmPO = async (po) => {
    try {
      // TODO: Replace with actual API call
      // await fetch(`/api/purchase-orders/${po.id}/confirm`, {
      //   method: 'POST',
      // });

      await fetchPurchaseOrders();
      await fetchStats();
    } catch (error) {
      console.error('Error confirming purchase order:', error);
    }
  };

  const handleCancelPO = async () => {
    if (!poToCancel) return;

    try {
      // TODO: Replace with actual API call
      // await fetch(`/api/purchase-orders/${poToCancel.id}/cancel`, {
      //   method: 'POST',
      // });

      await fetchPurchaseOrders();
      await fetchStats();
      setShowCancelConfirm(false);
      setPoToCancel(null);
    } catch (error) {
      console.error('Error cancelling purchase order:', error);
    }
  };

  const handleCreateGRN = async (grnData) => {
    try {
      // TODO: Replace with actual API call
      // const response = await fetch('/api/goods-received-notes', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({
      //     ...grnData,
      //     purchase_order_id: selectedPO.id,
      //   }),
      // });

      await fetchPurchaseOrders();
      await fetchStats();
      setShowGRNForm(false);
      setSelectedPO(null);
    } catch (error) {
      console.error('Error creating GRN:', error);
    }
  };

  const handleExport = () => {
    // TODO: Implement export to CSV/Excel
    console.log('Export purchase orders');
  };

  const clearFilters = () => {
    setFilters({
      status: 'all',
      supplier_id: '',
      branch_id: '',
      date_from: '',
      date_to: '',
    });
    setSearchQuery('');
  };

  // Filter POs by status for tabs
  const filterByStatus = (status) => {
    if (status === 'all') return purchaseOrders;
    return purchaseOrders.filter((po) => po.status === status);
  };

  const tabs = [
    {
      label: 'All',
      count: purchaseOrders.length,
      content: renderPOGrid(purchaseOrders),
    },
    {
      label: 'Draft',
      count: filterByStatus('draft').length,
      content: renderPOGrid(filterByStatus('draft')),
    },
    {
      label: 'Confirmed',
      count: filterByStatus('confirmed').length,
      content: renderPOGrid(filterByStatus('confirmed')),
    },
    {
      label: 'Partially Received',
      count: filterByStatus('partially_received').length,
      content: renderPOGrid(filterByStatus('partially_received')),
    },
    {
      label: 'Received',
      count: filterByStatus('received').length,
      content: renderPOGrid(filterByStatus('received')),
    },
  ];

  function renderPOGrid(orders) {
    if (orders.length === 0) {
      return (
        <EmptyState
          icon={FileText}
          title="No purchase orders found"
          description="Create a purchase order to get started"
        />
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
        {orders.map((po) => (
          <PurchaseOrderCard
            key={po.id}
            purchaseOrder={po}
            onView={(po) => {
              // TODO: Show detail view
              console.log('View PO:', po);
            }}
            onEdit={(po) => {
              setSelectedPO(po);
              setShowPOForm(true);
            }}
            onDelete={(po) => {
              // TODO: Implement delete
              console.log('Delete PO:', po);
            }}
            onApprove={handleConfirmPO}
            onCancel={(po) => {
              setPoToCancel(po);
              setShowCancelConfirm(true);
            }}
          />
        ))}
      </div>
    );
  }

  const activeFilterCount = Object.values(filters).filter((v) => v && v !== 'all').length;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-theme-primary mb-2">Purchase Orders</h1>
        <p className="text-theme-secondary">Manage purchase orders and track deliveries</p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <StatCard
          label="Total POs"
          value={stats.total_pos}
          icon={FileText}
          variant="primary"
        />
        <StatCard
          label="Draft"
          value={stats.draft_count}
          icon={Clock}
          variant="default"
        />
        <StatCard
          label="Confirmed"
          value={stats.confirmed_count}
          icon={CheckCircle}
          variant="info"
        />
        <StatCard
          label="Pending Delivery"
          value={stats.pending_delivery}
          icon={Truck}
          variant="warning"
        />
      </div>

      {/* Toolbar */}
      <div className="bg-theme-secondary rounded-2xl shadow-theme-sm border border-theme p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <SearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search by PO number, supplier..."
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant="outline"
              icon={Filter}
              onClick={() => setShowFilters(!showFilters)}
              className={activeFilterCount > 0 ? 'border-blue-600 text-blue-600' : ''}
            >
              Filters {activeFilterCount > 0 && `(${activeFilterCount})`}
            </Button>

            <Button variant="outline" icon={Download} onClick={handleExport}>
              Export
            </Button>

            <Button
              variant="primary"
              icon={Plus}
              onClick={() => {
                setSelectedPO(null);
                setShowPOForm(true);
              }}
            >
              Create PO
            </Button>
          </div>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-theme">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Supplier */}
              <div>
                <label className="block text-sm font-medium text-theme-secondary mb-1">
                  Supplier
                </label>
                <select
                  value={filters.supplier_id}
                  onChange={(e) => setFilters({ ...filters, supplier_id: e.target.value })}
                  className="w-full px-3 py-2 border border-theme bg-theme-primary text-theme-primary rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="" className="bg-theme-secondary">All Suppliers</option>
                  {suppliers.map((supplier) => (
                    <option key={supplier.id} value={supplier.id} className="bg-theme-secondary">
                      {supplier.supplier_name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Branch */}
              <div>
                <label className="block text-sm font-medium text-theme-secondary mb-1">Branch</label>
                <select
                  value={filters.branch_id}
                  onChange={(e) => setFilters({ ...filters, branch_id: e.target.value })}
                  className="w-full px-3 py-2 border border-theme bg-theme-primary text-theme-primary rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="" className="bg-theme-secondary">All Branches</option>
                  {branches.map((branch) => (
                    <option key={branch.id} value={branch.id} className="bg-theme-secondary">
                      {branch.branch_name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Date From */}
              <div>
                <label className="block text-sm font-medium text-theme-secondary mb-1">From Date</label>
                <input
                  type="date"
                  value={filters.date_from}
                  onChange={(e) => setFilters({ ...filters, date_from: e.target.value })}
                  className="w-full px-3 py-2 border border-theme bg-theme-primary text-theme-primary rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Date To */}
              <div>
                <label className="block text-sm font-medium text-theme-secondary mb-1">To Date</label>
                <input
                  type="date"
                  value={filters.date_to}
                  onChange={(e) => setFilters({ ...filters, date_to: e.target.value })}
                  className="w-full px-3 py-2 border border-theme bg-theme-primary text-theme-primary rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex items-center gap-4 mt-4">
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                Clear All Filters
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <LoadingSpinner size="lg" />
        </div>
      ) : (
        <div className="bg-theme-secondary rounded-2xl shadow-theme-sm border border-theme">
          <Tabs tabs={tabs} />
        </div>
      )}

      {/* Purchase Order Form Modal */}
      <PurchaseOrderFormModal
        isOpen={showPOForm}
        onClose={() => {
          setShowPOForm(false);
          setSelectedPO(null);
        }}
        onSubmit={selectedPO ? handleUpdatePO : handleCreatePO}
        purchaseOrder={selectedPO}
        suppliers={suppliers}
        branches={branches}
      />

      {/* GRN Form Modal */}
      <GRNFormModal
        isOpen={showGRNForm}
        onClose={() => {
          setShowGRNForm(false);
          setSelectedPO(null);
        }}
        onSubmit={handleCreateGRN}
        purchaseOrder={selectedPO}
      />

      {/* Cancel Confirmation */}
      <ConfirmDialog
        isOpen={showCancelConfirm}
        onClose={() => {
          setShowCancelConfirm(false);
          setPoToCancel(null);
        }}
        onConfirm={handleCancelPO}
        title="Cancel Purchase Order"
        message={`Are you sure you want to cancel purchase order "${poToCancel?.po_number}"? This action cannot be undone.`}
        confirmText="Cancel PO"
        variant="danger"
      />
    </div>
  );
};

// Stat Card Component
const StatCard = ({ label, value, icon: Icon, variant = 'default' }) => {
  const variants = {
    default: 'bg-theme-tertiary text-theme-primary border border-theme',
    primary: 'bg-blue-50 text-blue-900 border border-blue-100 dark:bg-blue-900/20 dark:text-blue-200 dark:border-blue-800',
    success: 'bg-green-50 text-green-900 border border-green-100 dark:bg-green-900/20 dark:text-green-200 dark:border-green-800',
    warning: 'bg-yellow-50 text-yellow-900 border border-yellow-100 dark:bg-yellow-900/20 dark:text-yellow-200 dark:border-yellow-800',
    info: 'bg-cyan-50 text-cyan-900 border border-cyan-100 dark:bg-cyan-900/20 dark:text-cyan-200 dark:border-cyan-800',
  };

  return (
    <div className={`p-4 rounded-2xl ${variants[variant]} shadow-sm`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium opacity-75">{label}</span>
        <Icon className="w-5 h-5 opacity-50" />
      </div>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
};

export default PurchaseOrders;
