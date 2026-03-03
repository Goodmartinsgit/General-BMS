import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api/axios';
import { useCurrency } from '../context/CurrencyContext';
import PageHeader from '../components/common/PageHeader';
import {
  User,
  Mail,
  Phone,
  MapPin,
  ShoppingBag,
  DollarSign,
  TrendingUp,
  ArrowLeft,
  FileText,
  Calendar,
  Hash,
  Loader2
} from 'lucide-react';

const CustomerDetailPage = () => {
  const { id } = useParams();
  const { formatCurrency } = useCurrency();
  const [customer, setCustomer] = useState(null);
  const [sales, setSales] = useState([]);
  const [statement, setStatement] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('purchases');

  useEffect(() => {
    fetchCustomerData();
  }, [id]);

  const fetchCustomerData = async () => {
    try {
      setLoading(true);
      const [customerRes, salesRes] = await Promise.all([
        api.get(`/customers/${id}`),
        api.get(`/sales`, { params: { customer_id: id } })
      ]);
      setCustomer(customerRes.data);
      setSales(Array.isArray(salesRes.data) ? salesRes.data : salesRes.data?.sales || []);

      // Attempt to fetch customer statement (may not exist)
      try {
        const statementRes = await api.get(`/invoices/customer-statement/${id}`);
        setStatement(Array.isArray(statementRes.data) ? statementRes.data : statementRes.data?.invoices || []);
      } catch {
        setStatement([]);
      }
    } catch (error) {
      console.error('Error fetching customer data:', error);
    } finally {
      setLoading(false);
    }
  };

  const totalPurchases = sales.length;
  const totalSpent = sales.reduce((sum, s) => sum + parseFloat(s.total_amount || s.total || 0), 0);
  const averageOrderValue = totalPurchases > 0 ? totalSpent / totalPurchases : 0;

  const formatDate = (dateString) => {
    if (!dateString) return '--';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed':
      case 'paid':
        return 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-300';
      case 'pending':
        return 'bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300';
      case 'cancelled':
        return 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-900/20 dark:text-gray-300';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 max-w-[1700px] mx-auto pb-10">
        <div className="flex items-center justify-center py-32">
          <Loader2 className="w-8 h-8 animate-spin text-accent-gold" />
        </div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="space-y-6 max-w-[1700px] mx-auto pb-10">
        <div className="flex flex-col items-center justify-center py-32 gap-4">
          <div className="w-16 h-16 bg-theme-tertiary rounded-full flex items-center justify-center text-theme-muted">
            <User size={32} />
          </div>
          <p className="text-theme-primary font-semibold text-lg">Customer not found</p>
          <Link to="/customers" className="text-accent-gold hover:underline text-sm">
            Back to Customers
          </Link>
        </div>
      </div>
    );
  }

  const actions = (
    <Link
      to="/customers"
      className="bg-theme-secondary border border-theme text-theme-secondary px-4 py-2 rounded-lg font-medium text-sm hover:bg-theme-tertiary transition flex items-center gap-2"
    >
      <ArrowLeft size={16} /> Back to Customers
    </Link>
  );

  return (
    <div className="space-y-6 max-w-[1700px] mx-auto pb-10">
      <PageHeader
        title={customer.customer_name || 'Customer'}
        subtitle={`Customer #${customer.customer_number || id}`}
        icon={User}
        badge={customer.customer_type}
        actions={actions}
      />

      {/* Profile Card */}
      <div className="bg-theme-secondary rounded-lg border border-theme shadow-theme-sm p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 flex items-center justify-center flex-shrink-0">
              <User className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-theme-muted font-medium">Full Name</p>
              <p className="text-sm font-semibold text-theme-primary">{customer.customer_name}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400 flex items-center justify-center flex-shrink-0">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-theme-muted font-medium">Email</p>
              <p className="text-sm font-semibold text-theme-primary">{customer.email || 'N/A'}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-100 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400 flex items-center justify-center flex-shrink-0">
              <Phone className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-theme-muted font-medium">Phone</p>
              <p className="text-sm font-semibold text-theme-primary">{customer.phone_number || 'N/A'}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-100 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400 flex items-center justify-center flex-shrink-0">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-theme-muted font-medium">Address</p>
              <p className="text-sm font-semibold text-theme-primary">{customer.address || 'N/A'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-theme-secondary rounded-lg border border-theme p-6 shadow-theme-sm">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 rounded-lg">
              <ShoppingBag size={24} />
            </div>
            <div>
              <p className="text-sm text-theme-muted">Total Purchases</p>
              <p className="text-2xl font-bold text-theme-primary mt-1">{totalPurchases}</p>
            </div>
          </div>
        </div>
        <div className="bg-theme-secondary rounded-lg border border-theme p-6 shadow-theme-sm">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400 rounded-lg">
              <DollarSign size={24} />
            </div>
            <div>
              <p className="text-sm text-theme-muted">Total Spent</p>
              <p className="text-2xl font-bold text-theme-primary mt-1">{formatCurrency(totalSpent)}</p>
            </div>
          </div>
        </div>
        <div className="bg-theme-secondary rounded-lg border border-theme p-6 shadow-theme-sm">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-100 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400 rounded-lg">
              <TrendingUp size={24} />
            </div>
            <div>
              <p className="text-sm text-theme-muted">Average Order Value</p>
              <p className="text-2xl font-bold text-theme-primary mt-1">{formatCurrency(averageOrderValue)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-theme-secondary rounded-lg border border-theme shadow-theme-sm overflow-hidden">
        <div className="flex border-b border-theme">
          <button
            onClick={() => setActiveTab('purchases')}
            className={`px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === 'purchases'
                ? 'text-accent-gold border-b-2 border-accent-gold bg-accent-gold/5'
                : 'text-theme-muted hover:text-theme-primary'
            }`}
          >
            Purchase History
          </button>
          <button
            onClick={() => setActiveTab('statement')}
            className={`px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === 'statement'
                ? 'text-accent-gold border-b-2 border-accent-gold bg-accent-gold/5'
                : 'text-theme-muted hover:text-theme-primary'
            }`}
          >
            Customer Statement
          </button>
        </div>

        {/* Purchase History Table */}
        {activeTab === 'purchases' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-theme-primary border-b border-theme">
                  <th className="px-6 py-3 text-xs font-semibold text-theme-muted uppercase">Date</th>
                  <th className="px-6 py-3 text-xs font-semibold text-theme-muted uppercase">Invoice #</th>
                  <th className="px-6 py-3 text-xs font-semibold text-theme-muted uppercase">Amount</th>
                  <th className="px-6 py-3 text-xs font-semibold text-theme-muted uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-theme">
                {sales.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="px-6 py-16 text-center">
                      <div className="flex flex-col items-center gap-4">
                        <div className="w-16 h-16 bg-theme-tertiary rounded-full flex items-center justify-center text-theme-muted">
                          <ShoppingBag size={32} />
                        </div>
                        <div>
                          <p className="font-semibold text-theme-primary text-lg">No purchases yet</p>
                          <p className="text-theme-muted text-sm mt-1">This customer has no purchase history.</p>
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  sales.map((sale) => (
                    <tr key={sale.id} className="hover:bg-theme-primary transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-sm text-theme-primary">
                          <Calendar size={14} className="text-theme-muted" />
                          {formatDate(sale.sale_date || sale.created_at)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-sm text-theme-primary">
                          <Hash size={14} className="text-theme-muted" />
                          <span className="font-mono">{sale.invoice_number || sale.sale_number || `#${sale.id}`}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-semibold text-theme-primary">
                          {formatCurrency(sale.total_amount || sale.total || 0)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-block text-xs font-medium px-2.5 py-1 rounded-full ${getStatusColor(sale.status)}`}>
                          {sale.status || 'completed'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Customer Statement Table */}
        {activeTab === 'statement' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-theme-primary border-b border-theme">
                  <th className="px-6 py-3 text-xs font-semibold text-theme-muted uppercase">Date</th>
                  <th className="px-6 py-3 text-xs font-semibold text-theme-muted uppercase">Invoice #</th>
                  <th className="px-6 py-3 text-xs font-semibold text-theme-muted uppercase">Total</th>
                  <th className="px-6 py-3 text-xs font-semibold text-theme-muted uppercase">Paid</th>
                  <th className="px-6 py-3 text-xs font-semibold text-theme-muted uppercase">Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-theme">
                {statement.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-16 text-center">
                      <div className="flex flex-col items-center gap-4">
                        <div className="w-16 h-16 bg-theme-tertiary rounded-full flex items-center justify-center text-theme-muted">
                          <FileText size={32} />
                        </div>
                        <div>
                          <p className="font-semibold text-theme-primary text-lg">No statement data</p>
                          <p className="text-theme-muted text-sm mt-1">No invoices found for this customer.</p>
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  statement.map((inv, index) => (
                    <tr key={inv.id || index} className="hover:bg-theme-primary transition-colors">
                      <td className="px-6 py-4 text-sm text-theme-primary">
                        {formatDate(inv.invoice_date || inv.created_at)}
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-mono text-theme-primary">{inv.invoice_number || `INV-${inv.id}`}</span>
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-theme-primary">
                        {formatCurrency(inv.total_amount || inv.total || 0)}
                      </td>
                      <td className="px-6 py-4 text-sm text-green-600 dark:text-green-400 font-medium">
                        {formatCurrency(inv.amount_paid || 0)}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-sm font-semibold ${
                          parseFloat(inv.balance || 0) > 0
                            ? 'text-red-600 dark:text-red-400'
                            : 'text-green-600 dark:text-green-400'
                        }`}>
                          {formatCurrency(inv.balance || 0)}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerDetailPage;
