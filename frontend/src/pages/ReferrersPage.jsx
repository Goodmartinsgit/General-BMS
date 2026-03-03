import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { Plus, Edit, Trash2, User, Search, Phone, Mail, Banknote, Wallet, TrendingUp, Download, Users } from 'lucide-react';
import PageHeader from '../components/common/PageHeader';
import ReferrerFormModal from '../components/ReferrerFormModal';
import CommissionPaymentModal from '../components/CommissionPaymentModal';
import { useCurrency } from '../context/CurrencyContext';

const ReferrersPage = () => {
    const { formatCurrency } = useCurrency();
    const [referrers, setReferrers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [selectedReferrer, setSelectedReferrer] = useState(null);

    useEffect(() => {
        fetchReferrers();
    }, []);

    const fetchReferrers = async () => {
        try {
            setLoading(true);
            const response = await api.get('/referrers');
            setReferrers(response.data);
        } catch (error) {
            console.error('Error fetching referrers:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddReferrer = () => {
        setSelectedReferrer(null);
        setIsModalOpen(true);
    };

    const handleEditReferrer = (referrer) => {
        setSelectedReferrer(referrer);
        setIsModalOpen(true);
    };

    const handleDeleteReferrer = async (id) => {
        if (window.confirm('Are you sure you want to delete this referrer?')) {
            try {
                await api.delete(`/referrers/${id}`);
                fetchReferrers();
            } catch (error) {
                alert('Failed to delete referrer');
            }
        }
    };

    const handlePayCommission = (referrer) => {
        setSelectedReferrer(referrer);
        setIsPaymentModalOpen(true);
    };

    const handlePaymentSubmit = async (paymentData) => {
        try {
            await api.post('/referrers/pay', paymentData);
            setIsPaymentModalOpen(false);
            fetchReferrers();
            alert('Commission payment processed successfully!');
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to process payment');
        }
    };

    const handleModalSubmit = async (formData) => {
        try {
            if (selectedReferrer) {
                await api.put(`/referrers/${selectedReferrer.id}`, formData);
            } else {
                await api.post('/referrers', formData);
            }
            setIsModalOpen(false);
            fetchReferrers();
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to save referrer');
        }
    };

    const filteredReferrers = referrers.filter(r => {
        return r.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
               r.phone?.includes(searchTerm) ||
               r.referrer_code?.toLowerCase().includes(searchTerm.toLowerCase());
    });

    const activeReferrers = referrers.filter(r => r.is_active).length;
    const pendingCommissions = referrers.reduce((acc, r) => acc + parseFloat(r.commission_balance || 0), 0);
    const totalEarned = referrers.reduce((acc, r) => acc + parseFloat(r.total_commission_earned || 0), 0);

    const actions = (
        <>
            <button className="bg-theme-secondary border border-theme text-theme-secondary px-4 py-2 rounded-lg font-medium text-sm hover:bg-theme-tertiary transition flex items-center gap-2">
                <Download size={16} /> Export
            </button>
            <button
                onClick={handleAddReferrer}
                className="bg-accent-gold text-white px-4 py-2 rounded-lg font-semibold text-sm hover:bg-accent-goldDark transition flex items-center gap-2"
            >
                <Plus className="w-4 h-4" /> Add Referrer
            </button>
        </>
    );

    return (
        <div className="space-y-6 max-w-[1700px] mx-auto pb-10">
            <PageHeader
                title="Referrers"
                subtitle="Manage referrers and commission payments"
                badge={`${referrers.length} Referrers`}
                icon={Users}
                actions={actions}
            />

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-theme-secondary p-6 rounded-lg border border-theme shadow-theme-sm flex items-center gap-4">
                    <div className="p-3 bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 rounded-lg">
                        <User size={24} />
                    </div>
                    <div>
                        <div className="text-sm text-theme-muted font-medium">Active Referrers</div>
                        <div className="text-2xl font-semibold text-theme-primary">{activeReferrers}</div>
                    </div>
                </div>
                <div className="bg-theme-secondary p-6 rounded-lg border border-theme shadow-theme-sm flex items-center gap-4">
                    <div className="p-3 bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400 rounded-lg">
                        <Wallet size={24} />
                    </div>
                    <div>
                        <div className="text-sm text-theme-muted font-medium">Pending Commissions</div>
                        <div className="text-2xl font-semibold text-theme-primary">
                            {formatCurrency(pendingCommissions)}
                        </div>
                    </div>
                </div>
                <div className="bg-theme-secondary p-6 rounded-lg border border-theme shadow-theme-sm flex items-center gap-4">
                    <div className="p-3 bg-amber-100 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400 rounded-lg">
                        <TrendingUp size={24} />
                    </div>
                    <div>
                        <div className="text-sm text-theme-muted font-medium">Total Earned</div>
                        <div className="text-2xl font-semibold text-theme-primary">
                            {formatCurrency(totalEarned)}
                        </div>
                    </div>
                </div>
            </div>

            {/* Search Bar */}
            <div className="bg-theme-secondary p-4 rounded-lg border border-theme shadow-theme-sm">
                <div className="relative w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-theme-muted w-5 h-5 pointer-events-none" />
                    <input
                        type="text"
                        placeholder="Search by name, code or phone..."
                        className="w-full pl-10 pr-4 py-2.5 bg-theme-primary border border-theme rounded-lg focus:ring-2 focus:ring-accent-gold/20 focus:border-accent-gold/30 outline-none transition-all text-sm text-theme-primary placeholder-theme-muted"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Referrers Table */}
            <div className="bg-theme-secondary rounded-lg border border-theme shadow-theme-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-theme-primary border-b border-theme">
                                <th className="px-6 py-3 text-xs font-semibold text-theme-muted uppercase">Referrer</th>
                                <th className="px-6 py-3 text-xs font-semibold text-theme-muted uppercase">Contact</th>
                                <th className="px-6 py-3 text-xs font-semibold text-theme-muted uppercase">Commission</th>
                                <th className="px-6 py-3 text-xs font-semibold text-theme-muted uppercase">Earnings</th>
                                <th className="px-6 py-3 text-xs font-semibold text-theme-muted uppercase text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-theme">
                            {loading ? (
                                Array(5).fill(0).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan="5" className="px-6 py-8">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-theme-tertiary rounded-lg"></div>
                                                <div className="space-y-2 flex-1">
                                                    <div className="w-48 h-4 bg-theme-tertiary rounded"></div>
                                                    <div className="w-32 h-3 bg-theme-tertiary rounded"></div>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : filteredReferrers.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-16 text-center">
                                        <div className="flex flex-col items-center gap-4">
                                            <div className="w-16 h-16 bg-theme-tertiary rounded-full flex items-center justify-center text-theme-muted">
                                                <Users size={32} />
                                            </div>
                                            <div>
                                                <p className="font-semibold text-theme-primary text-lg">No referrers found</p>
                                                <p className="text-theme-muted text-sm mt-1">Try adjusting your search or add a new referrer.</p>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredReferrers.map((ref) => (
                                    <tr key={ref.id} className="hover:bg-theme-primary transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 rounded-lg flex items-center justify-center">
                                                    <User size={20} />
                                                </div>
                                                <div>
                                                    <div className="font-semibold text-theme-primary text-sm">{ref.full_name}</div>
                                                    <div className="text-xs text-theme-muted font-mono mt-0.5">{ref.referrer_code}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2 text-sm text-theme-secondary">
                                                    <Phone size={14} className="text-theme-muted" /> {ref.phone}
                                                </div>
                                                <div className="flex items-center gap-2 text-xs text-theme-muted">
                                                    <Mail size={14} className="text-theme-muted" /> {ref.email || 'N/A'}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="space-y-1">
                                                <span className="inline-block text-xs font-medium px-2.5 py-1 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-300">
                                                    {ref.commission_type}
                                                </span>
                                                <div className="text-sm font-semibold text-accent-gold">
                                                    {ref.commission_type === 'percentage' ? `${ref.commission_rate}%` : `${formatCurrency(ref.fixed_commission_amount)}`}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="space-y-1.5">
                                                <div className="flex items-center justify-between text-xs">
                                                    <span className="text-theme-muted">Balance:</span>
                                                    <span className="font-semibold text-green-600 dark:text-green-400">{formatCurrency(ref.commission_balance)}</span>
                                                </div>
                                                <div className="w-full bg-theme-tertiary h-1.5 rounded-full overflow-hidden">
                                                    <div className="bg-green-500 h-full" style={{ width: `${Math.min((ref.total_commission_paid / ref.total_commission_earned) * 100 || 0, 100)}%` }}></div>
                                                </div>
                                                <div className="flex items-center justify-between text-[10px] text-theme-muted">
                                                    <span>Paid: {formatCurrency(ref.total_commission_paid)}</span>
                                                    <span>Total: {formatCurrency(ref.total_commission_earned)}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => handleEditReferrer(ref)}
                                                    className="p-2 text-theme-muted hover:text-accent-gold hover:bg-accent-gold/10 rounded-lg transition"
                                                    title="Edit Referrer"
                                                >
                                                    <Edit size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handlePayCommission(ref)}
                                                    className="p-2 text-theme-muted hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition"
                                                    title="Pay Commission"
                                                >
                                                    <Banknote size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteReferrer(ref.id)}
                                                    className="p-2 text-theme-muted hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition"
                                                    title="Delete Referrer"
                                                >
                                                    <Trash2 size={16} />
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

            <ReferrerFormModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSubmit={handleModalSubmit}
                referrer={selectedReferrer}
            />

            <CommissionPaymentModal
                isOpen={isPaymentModalOpen}
                onClose={() => setIsPaymentModalOpen(false)}
                onSubmit={handlePaymentSubmit}
                referrer={selectedReferrer}
            />

        </div>
    );
};

export default ReferrersPage;
