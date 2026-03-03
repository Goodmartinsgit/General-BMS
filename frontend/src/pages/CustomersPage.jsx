import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { Plus, Edit, Trash2, User, Users, Search, Filter, Phone, Mail, DollarSign, ShieldAlert, Download, CheckCircle, XCircle } from 'lucide-react';
import PageHeader from '../components/common/PageHeader';
import CustomerFormModal from '../components/CustomerFormModal';
import { useCurrency } from '../context/CurrencyContext';

const TABS = [
    { key: 'all', label: 'All Customers' },
    { key: 'shop', label: 'Shop Customers' },
    { key: 'online', label: 'Online Customers' },
];

const SourceBadge = ({ source }) => {
    if (source === 'online') {
        return (
            <span className="inline-flex items-center text-[9px] sm:text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 ml-1.5">
                Online
            </span>
        );
    }
    if (source === 'shop') {
        return (
            <span className="inline-flex items-center text-[9px] sm:text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 ml-1.5">
                Shop
            </span>
        );
    }
    return null;
};

const CustomersPage = () => {
    const { formatCurrency } = useCurrency();
    const [customers, setCustomers] = useState([]);
    const [priceTiers, setPriceTiers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [typeFilter, setTypeFilter] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [referrers, setReferrers] = useState([]);
    const [activeTab, setActiveTab] = useState('all');

    useEffect(() => {
        fetchData();
    }, [activeTab]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const params = {};
            if (activeTab === 'shop') params.source = 'shop';
            if (activeTab === 'online') params.source = 'online';

            const [custRes, tierRes, refRes] = await Promise.all([
                api.get('/customers', { params }),
                api.get('/price-tiers'),
                api.get('/referrers')
            ]);
            setCustomers(custRes.data);
            setPriceTiers(tierRes.data);
            setReferrers(refRes.data);
        } catch (error) {
            console.error('Error fetching customers:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddCustomer = () => {
        setSelectedCustomer(null);
        setIsModalOpen(true);
    };

    const handleEditCustomer = (customer) => {
        setSelectedCustomer(customer);
        setIsModalOpen(true);
    };

    const handleDeleteCustomer = async (id) => {
        if (window.confirm('Are you sure you want to delete this customer record?')) {
            try {
                await api.delete(`/customers/${id}`);
                fetchData();
            } catch (error) {
                alert('Failed to delete customer');
            }
        }
    };

    const handleModalSubmit = async (formData) => {
        try {
            if (selectedCustomer) {
                await api.put(`/customers/${selectedCustomer.id}`, formData);
            } else {
                await api.post(`/customers`, formData);
            }
            setIsModalOpen(false);
            fetchData();
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to save customer');
        }
    };

    const filteredCustomers = customers.filter(c => {
        const matchesSearch = c.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                              c.phone_number?.includes(searchTerm) ||
                              c.customer_number?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesType = typeFilter ? c.customer_type === typeFilter : true;
        return matchesSearch && matchesType;
    });

    const isOnlineTab = activeTab === 'online';

    const actions = (
        <>
            <button className="hidden sm:flex bg-theme-secondary border border-theme text-theme-secondary px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg font-medium text-xs sm:text-sm hover:bg-theme-tertiary transition items-center gap-1.5 sm:gap-2">
                <Download size={14} className="sm:w-4 sm:h-4" /> Export
            </button>
            <button
                onClick={handleAddCustomer}
                className="bg-accent-gold text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg font-semibold text-xs sm:text-sm hover:bg-accent-goldDark transition flex items-center justify-center gap-1.5 sm:gap-2 w-full sm:w-auto"
            >
                <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Add Customer
            </button>
        </>
    );

    return (
        <div className="space-y-4 sm:space-y-6 max-w-[1700px] mx-auto pb-6 sm:pb-10">
            <PageHeader
                title="Customers"
                subtitle="Manage your customer relationships"
                badge={`${customers.length} Customers`}
                icon={Users}
                actions={actions}
            />

            {/* Tab Bar */}
            <div className="flex items-center gap-1 border-b border-theme">
                {TABS.map(tab => (
                    <button
                        key={tab.key}
                        onClick={() => {
                            setActiveTab(tab.key);
                            setSearchTerm('');
                            setTypeFilter('');
                        }}
                        className={`relative px-3 sm:px-4 py-2.5 text-xs sm:text-sm font-medium transition whitespace-nowrap ${
                            activeTab === tab.key
                                ? 'text-accent-gold after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-accent-gold after:rounded-t'
                                : 'text-theme-muted hover:text-theme-primary'
                        }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Search & Filter Bar */}
            <div className="bg-theme-secondary p-3 sm:p-4 rounded-lg border border-theme shadow-theme-sm flex flex-col md:flex-row gap-3 sm:gap-4 items-center">
                <div className="relative flex-grow w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-theme-muted w-4 h-4 sm:w-5 sm:h-5 pointer-events-none" />
                    <input
                        type="text"
                        placeholder="Search customers..."
                        className="w-full pl-9 sm:pl-10 pr-3 sm:pr-4 py-2 sm:py-2.5 bg-theme-primary border border-theme rounded-lg focus:ring-2 focus:ring-accent-gold/20 focus:border-accent-gold/30 outline-none transition-all text-xs sm:text-sm text-theme-primary placeholder-theme-muted"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-2 w-full md:w-auto">
                    <div className="flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 bg-theme-primary border border-theme rounded-lg flex-1 md:flex-none">
                        <Filter className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-theme-muted" />
                        <select
                            className="bg-transparent text-xs sm:text-sm font-medium text-theme-primary outline-none cursor-pointer flex-1 md:flex-none"
                            value={typeFilter}
                            onChange={(e) => setTypeFilter(e.target.value)}
                        >
                            <option value="" className="bg-theme-secondary text-theme-primary">All Types</option>
                            <option value="Retail" className="bg-theme-secondary text-theme-primary">Retail</option>
                            <option value="Wholesale" className="bg-theme-secondary text-theme-primary">Wholesale</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Customers Table */}
            <div className="bg-theme-secondary rounded-lg border border-theme shadow-theme-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-theme-primary border-b border-theme">
                                <th className="px-3 sm:px-6 py-2 sm:py-3 text-[10px] sm:text-xs font-semibold text-theme-muted uppercase">Customer</th>
                                <th className="px-3 sm:px-6 py-2 sm:py-3 text-[10px] sm:text-xs font-semibold text-theme-muted uppercase hidden md:table-cell">Contact</th>
                                <th className="px-3 sm:px-6 py-2 sm:py-3 text-[10px] sm:text-xs font-semibold text-theme-muted uppercase">Type</th>
                                <th className="px-3 sm:px-6 py-2 sm:py-3 text-[10px] sm:text-xs font-semibold text-theme-muted uppercase hidden lg:table-cell">Credit</th>
                                {isOnlineTab && (
                                    <th className="px-3 sm:px-6 py-2 sm:py-3 text-[10px] sm:text-xs font-semibold text-theme-muted uppercase hidden sm:table-cell">Verified</th>
                                )}
                                <th className="px-3 sm:px-6 py-2 sm:py-3 text-[10px] sm:text-xs font-semibold text-theme-muted uppercase text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-theme">
                            {loading ? (
                                Array(5).fill(0).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan={isOnlineTab ? 6 : 5} className="px-3 sm:px-6 py-4 sm:py-8">
                                            <div className="flex items-center gap-2 sm:gap-3">
                                                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-theme-tertiary rounded-lg"></div>
                                                <div className="space-y-2 flex-1">
                                                    <div className="w-32 sm:w-48 h-3 sm:h-4 bg-theme-tertiary rounded"></div>
                                                    <div className="w-24 sm:w-32 h-2 sm:h-3 bg-theme-tertiary rounded"></div>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : filteredCustomers.length === 0 ? (
                                <tr>
                                    <td colSpan={isOnlineTab ? 6 : 5} className="px-3 sm:px-6 py-12 sm:py-16 text-center">
                                        <div className="flex flex-col items-center gap-3 sm:gap-4">
                                            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-theme-tertiary rounded-full flex items-center justify-center text-theme-muted">
                                                <Users size={24} className="sm:w-8 sm:h-8" />
                                            </div>
                                            <div>
                                                <p className="font-semibold text-theme-primary text-sm sm:text-base md:text-lg">No customers found</p>
                                                <p className="text-theme-muted text-xs sm:text-sm mt-1">Try adjusting your search or add a new customer.</p>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredCustomers.map((cust) => (
                                    <tr key={cust.id} className="hover:bg-theme-primary transition-colors group">
                                        <td className="px-3 sm:px-6 py-3 sm:py-4">
                                            <div className="flex items-center gap-2 sm:gap-3">
                                                <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center ${cust.customer_type === 'Wholesale' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400' : 'bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400'}`}>
                                                    <User size={16} className="sm:w-5 sm:h-5" />
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="flex items-center flex-wrap gap-x-1">
                                                        <span className="font-semibold text-theme-primary text-xs sm:text-sm truncate">{cust.customer_name}</span>
                                                        {activeTab === 'all' && <SourceBadge source={cust.source} />}
                                                    </div>
                                                    <div className="text-[10px] sm:text-xs text-theme-muted font-mono mt-0.5 truncate">{cust.customer_number}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-3 sm:px-6 py-3 sm:py-4 hidden md:table-cell">
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2 text-xs sm:text-sm text-theme-secondary">
                                                    <Phone size={12} className="sm:w-3.5 sm:h-3.5 text-theme-muted" /> {cust.phone_number}
                                                </div>
                                                <div className="flex items-center gap-2 text-[10px] sm:text-xs text-theme-muted">
                                                    <Mail size={12} className="sm:w-3.5 sm:h-3.5 text-theme-muted" /> {cust.email || 'N/A'}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-3 sm:px-6 py-3 sm:py-4">
                                            <div className="space-y-1.5">
                                                <span className={`inline-block text-[10px] sm:text-xs font-medium px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full ${cust.customer_type === 'Wholesale' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300' : 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-300'}`}>
                                                    {cust.customer_type}
                                                </span>
                                                <div className="text-[10px] sm:text-xs text-theme-muted flex items-center gap-1.5">
                                                    <DollarSign size={10} className="sm:w-3 sm:h-3" /> {cust.tier_name || 'Standard'}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-3 sm:px-6 py-3 sm:py-4 hidden lg:table-cell">
                                            <div className="text-xs sm:text-sm font-semibold text-theme-primary">
                                                {formatCurrency(cust.credit_limit)}
                                            </div>
                                            <div className="text-[10px] sm:text-xs text-theme-muted mt-0.5">Credit Limit</div>
                                        </td>
                                        {isOnlineTab && (
                                            <td className="px-3 sm:px-6 py-3 sm:py-4 hidden sm:table-cell">
                                                {cust.is_email_verified ? (
                                                    <span className="inline-flex items-center gap-1 text-xs text-green-600 dark:text-green-400 font-medium">
                                                        <CheckCircle size={14} /> Verified
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 text-xs text-red-500 dark:text-red-400 font-medium">
                                                        <XCircle size={14} /> Unverified
                                                    </span>
                                                )}
                                            </td>
                                        )}
                                        <td className="px-3 sm:px-6 py-3 sm:py-4 text-right">
                                            <div className="flex justify-end gap-1 sm:gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => handleEditCustomer(cust)}
                                                    className="p-1.5 sm:p-2 text-theme-muted hover:text-accent-gold hover:bg-accent-gold/10 rounded-lg transition"
                                                    title="Edit Customer"
                                                >
                                                    <Edit size={14} className="sm:w-4 sm:h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteCustomer(cust.id)}
                                                    className="p-1.5 sm:p-2 text-theme-muted hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition"
                                                    title="Delete Customer"
                                                >
                                                    <Trash2 size={14} className="sm:w-4 sm:h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <CustomerFormModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSubmit={handleModalSubmit}
                customer={selectedCustomer}
                priceTiers={priceTiers}
                referrers={referrers}
            />
        </div>
    );
};

export default CustomersPage;
