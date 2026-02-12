import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Edit, Trash2, User, Search, Filter, Phone, Mail, DollarSign, ShieldAlert } from 'lucide-react';
import CustomerFormModal from '../components/CustomerFormModal';

const CustomersPage = () => {
    const [customers, setCustomers] = useState([]);
    const [priceTiers, setPriceTiers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [typeFilter, setTypeFilter] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [referrers, setReferrers] = useState([]);

    const API_URL = 'http://localhost:5000/api';

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [custRes, tierRes, refRes] = await Promise.all([
                axios.get(`${API_URL}/customers`),
                axios.get(`${API_URL}/price-tiers`),
                axios.get(`${API_URL}/referrers`)
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
                await axios.delete(`${API_URL}/customers/${id}`);
                fetchData();
            } catch (error) {
                alert('Failed to delete customer');
            }
        }
    };

    const handleModalSubmit = async (formData) => {
        try {
            if (selectedCustomer) {
                await axios.put(`${API_URL}/customers/${selectedCustomer.id}`, formData);
            } else {
                await axios.post(`${API_URL}/customers`, formData);
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

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-black text-theme-primary tracking-tight flex items-center gap-3">
                        Relationships
                        <span className="bg-indigo-100 text-indigo-600 px-3 py-1 rounded-full text-[10px] font-bold border border-indigo-200 uppercase tracking-widest dark:bg-indigo-900/30 dark:text-indigo-400 dark:border-indigo-800">
                            {customers.length} Contacts
                        </span>
                    </h2>
                    <p className="text-theme-muted text-sm mt-1 uppercase font-bold tracking-widest underline decoration-indigo-200 decoration-2 underline-offset-4 dark:decoration-indigo-800">Building Enterprise Loyalty</p>
                </div>
                <div className="flex items-center gap-3">
                    <button 
                        onClick={handleAddCustomer}
                        className="bg-gray-900 text-white px-6 py-2.5 rounded-2xl font-bold text-sm hover:bg-black transition shadow-xl shadow-black/10 flex items-center gap-2 group"
                    >
                        <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" /> Register New Account
                    </button>
                </div>
            </div>

            {/* Premium Filter Interface */}
            <div className="bg-theme-secondary p-4 rounded-[2.5rem] border border-theme shadow-theme-sm flex flex-col lg:flex-row gap-4 items-center">
                <div className="relative flex-grow w-full">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-theme-muted w-5 h-5" />
                    <input 
                        type="text"
                        placeholder="Search relationships by name, number or digital identity..." 
                        className="w-full pl-12 pr-4 py-3.5 bg-theme-primary border border-transparent rounded-[1.5rem] focus:bg-theme-secondary focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900 focus:border-indigo-300 dark:focus:border-indigo-700 outline-none transition-all text-sm font-medium text-theme-primary placeholder-theme-muted"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-2 w-full lg:w-auto shrink-0">
                    <div className="flex items-center gap-2 px-6 py-3 bg-theme-primary border border-transparent rounded-[1.5rem]">
                        <Filter className="w-4 h-4 text-indigo-500" />
                        <select
                            className="bg-transparent text-sm font-bold text-theme-primary outline-none appearance-none cursor-pointer pr-4"
                            value={typeFilter}
                            onChange={(e) => setTypeFilter(e.target.value)}
                        >
                            <option value="" className="bg-theme-secondary text-theme-primary">All Segments</option>
                            <option value="Retail" className="bg-theme-secondary text-theme-primary">Retail Accounts</option>
                            <option value="Wholesale" className="bg-theme-secondary text-theme-primary">Wholesale Accounts</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Contacts Repository */}
            <div className="bg-theme-secondary rounded-[2.5rem] border border-theme shadow-theme-sm overflow-hidden hover:shadow-theme-xl transition-all duration-500">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-theme-primary/50">
                                <th className="px-8 py-6 text-[10px] font-black text-theme-muted uppercase tracking-[0.2em]">Contact Identity</th>
                                <th className="px-8 py-6 text-[10px] font-black text-theme-muted uppercase tracking-[0.2em]">Communication</th>
                                <th className="px-8 py-6 text-[10px] font-black text-theme-muted uppercase tracking-[0.2em]">Price Strategy</th>
                                <th className="px-8 py-6 text-[10px] font-black text-theme-muted uppercase tracking-[0.2em]">Risk & Limits</th>
                                <th className="px-8 py-6 text-right text-[10px] font-black text-theme-muted uppercase tracking-[0.2em]">Operations</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-theme">
                            {loading ? (
                                Array(5).fill(0).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan="5" className="px-8 py-10">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 bg-gray-100 rounded-full"></div>
                                                <div className="space-y-2">
                                                    <div className="w-48 h-4 bg-gray-100 rounded"></div>
                                                    <div className="w-32 h-3 bg-gray-50 rounded"></div>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : filteredCustomers.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="px-8 py-32 text-center">
                                        <div className="flex flex-col items-center gap-6">
                                            <div className="w-24 h-24 bg-indigo-50 dark:bg-indigo-900/20 rounded-full flex items-center justify-center text-indigo-200 dark:text-indigo-800">
                                                <Users size={48} />
                                            </div>
                                            <div>
                                                <p className="font-black text-theme-primary text-xl tracking-tight">Zero relationships found</p>
                                                <p className="text-theme-muted text-sm mt-1 max-w-sm mx-auto">No records match your current parameters. Expand your search or register a new contact to begin.</p>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredCustomers.map((cust) => (
                                    <tr key={cust.id} className="hover:bg-theme-primary/50 transition-colors duration-300 group">
                                        <td className="px-8 py-8">
                                            <div className="flex items-center gap-5">
                                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-theme-sm border transition-all duration-300 group-hover:scale-110 ${cust.customer_type === 'Wholesale' ? 'bg-indigo-50 text-indigo-600 border-indigo-100 dark:bg-indigo-900/20 dark:text-indigo-400 dark:border-indigo-800' : 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800'}`}>
                                                    <User size={24} className="group-hover:rotate-12 transition-transform" />
                                                </div>
                                                <div>
                                                    <div className="font-black text-theme-primary group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{cust.customer_name}</div>
                                                    <div className="text-[10px] text-theme-muted font-mono font-bold mt-1 tracking-tighter uppercase">{cust.customer_number}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-8">
                                            <div className="space-y-2">
                                                <div className="flex items-center gap-2 text-sm font-bold text-theme-secondary">
                                                    <Phone size={14} className="text-theme-muted" /> {cust.phone_number}
                                                </div>
                                                <div className="flex items-center gap-2 text-xs font-medium text-theme-muted">
                                                    <Mail size={14} className="text-theme-muted" /> {cust.email || 'NO_DIGITAL_ID'}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-8">
                                            <div className="space-y-2">
                                                <span className={`text-[9px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest border ${cust.customer_type === 'Wholesale' ? 'bg-indigo-50 text-indigo-700 border-indigo-100 dark:bg-indigo-900/20 dark:text-indigo-300 dark:border-indigo-800' : 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-800'}`}>
                                                    {cust.customer_type}
                                                </span>
                                                <div className="text-[11px] font-bold text-theme-secondary mt-2 flex items-center gap-2">
                                                    <ShieldAlert size={12} className="text-amber-500" /> {cust.tier_name || 'Legacy Tier'}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-8">
                                            <div className="space-y-2">
                                                <div>
                                                    <span className="text-theme-muted font-black text-[9px] block mb-0.5 uppercase tracking-tighter">Credit Capacity</span>
                                                    <span className="font-black text-theme-primary text-lg tracking-tighter">₦{parseFloat(cust.credit_limit).toLocaleString()}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <div className="w-full bg-theme-primary h-1.5 rounded-full overflow-hidden">
                                                         <div className="bg-indigo-600 h-full w-[30%]" title="Placeholder utilization"></div>
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-8 text-right">
                                            <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity translate-x-4 group-hover:translate-x-0 duration-300">
                                                <button onClick={() => handleEditCustomer(cust)} className="p-3 text-theme-muted hover:text-indigo-600 hover:bg-indigo-50 dark:hover:text-indigo-400 dark:hover:bg-indigo-900/20 rounded-2xl transition" title="Modify Record">
                                                    <Edit size={20} />
                                                </button>
                                                <button onClick={() => handleDeleteCustomer(cust.id)} className="p-3 text-theme-muted hover:text-red-600 hover:bg-red-50 dark:hover:text-red-400 dark:hover:bg-red-900/20 rounded-2xl transition" title="Archive Record">
                                                    <Trash2 size={20} />
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
