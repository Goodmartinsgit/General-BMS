import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import {
  Calendar,
  Search,
  Filter,
  ShoppingBag,
  User,
  MapPin,
  Eye,
  FileText,
  CreditCard,
  History,
  ArrowRight
} from 'lucide-react';
import { format } from 'date-fns';
import PageHeader from '../components/common/PageHeader';
import DataTable from '../components/common/DataTable';
import InvoicePrintModal from '../components/InvoicePrintModal';
import { useCurrency } from '../context/CurrencyContext';

const SalesHistoryPage = () => {
    const { formatCurrency } = useCurrency();
    const [sales, setSales] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedSale, setSelectedSale] = useState(null);
    const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);

    useEffect(() => {
        fetchSales();
    }, []);

    const fetchSales = async () => {
        try {
            setLoading(true);
            const response = await api.get('/sales');
            setSales(response.data);
        } catch (error) {
            console.error('Error fetching sales history:', error);
        } finally {
            setLoading(false);
        }
    };

    const viewInvoice = async (id) => {
        try {
            const response = await api.get(`/sales/${id}`);
            setSelectedSale(response.data);
            setIsInvoiceOpen(true);
        } catch (error) {
            alert('Failed to load invoice details');
        }
    };

    const filteredSales = sales.filter(s =>
        s.sale_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.customer_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const columns = [
      {
        header: 'Sale #',
        render: (row) => (
          <div className="space-y-1">
            <div className="font-mono text-sm font-medium text-accent-gold">
              {row.sale_number}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-theme-muted">
              <Calendar size={12} />
              {format(new Date(row.created_at), 'dd MMM yyyy, HH:mm')}
            </div>
          </div>
        )
      },
      {
        header: 'Branch / Staff',
        render: (row) => (
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-sm text-theme-primary font-medium">
              <MapPin size={14} className="text-accent-gold" /> {row.branch_name}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-theme-muted">
              <User size={12} /> {row.salesperson}
            </div>
          </div>
        )
      },
      {
        header: 'Customer',
        render: (row) => (
          <div className="flex items-center gap-3">
             <div className="w-8 h-8 rounded-full bg-theme-tertiary flex items-center justify-center text-xs font-semibold text-theme-secondary border border-theme">
                {(row.customer_name || 'WI')[0]}
             </div>
             <span className="text-sm text-theme-primary">{row.customer_name || 'Walk-in Customer'}</span>
          </div>
        )
      },
      {
        header: 'Amount',
        render: (row) => (
          <div className="space-y-1">
            <div className="font-semibold text-theme-primary text-sm">{formatCurrency(row.total_amount)}</div>
            <div className={`inline-flex px-2 py-0.5 rounded text-xs font-medium border ${
              row.payment_method === 'Cash'
                ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                : 'bg-blue-500/10 text-blue-600 border-blue-500/20'
            }`}>
              {row.payment_method}
            </div>
          </div>
        )
      }
    ];

    const actions = (
      <button className="bg-theme-secondary border border-theme text-theme-secondary px-4 py-2 rounded-lg font-medium text-sm hover:bg-theme-tertiary transition flex items-center gap-2">
        <FileText size={16} /> Export Report
      </button>
    );

    return (
        <div className="space-y-6 max-w-[1700px] mx-auto pb-10">
            <PageHeader
              title="Sales History"
              subtitle="View all past transactions"
              badge={`${sales.length} Sales`}
              icon={History}
              actions={actions}
            />

            {/* Search */}
            <div className="bg-theme-secondary p-4 rounded-lg border border-theme shadow-theme-sm flex flex-col md:flex-row gap-4 items-center">
                <div className="relative flex-grow w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-theme-muted w-5 h-5 pointer-events-none" />
                    <input
                        type="text"
                        placeholder="Search by sale number or customer name..."
                        className="w-full pl-10 pr-4 py-2.5 bg-theme-primary border border-theme rounded-lg focus:ring-2 focus:ring-accent-gold/20 focus:border-accent-gold/30 outline-none transition-all text-sm text-theme-primary placeholder-theme-muted"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <button className="flex items-center gap-2 px-4 py-2.5 bg-theme-tertiary border border-theme rounded-lg text-sm font-medium text-theme-secondary hover:border-accent-gold/30 transition">
                   <Filter size={16} className="text-accent-gold" /> Filters
                </button>
            </div>

            <DataTable
              columns={columns}
              data={filteredSales}
              loading={loading}
              emptyMessage="No sales found"
              emptyIcon={ShoppingBag}
              renderActions={(row) => (
                <button
                  onClick={() => viewInvoice(row.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-theme-muted hover:text-accent-gold hover:bg-accent-gold/10 rounded-lg transition"
                >
                  <Eye size={16} /> View
                </button>
              )}
            />

            <InvoicePrintModal
                isOpen={isInvoiceOpen}
                onClose={() => setIsInvoiceOpen(false)}
                data={selectedSale}
            />
        </div>
    );
};

export default SalesHistoryPage;
