import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Edit, Trash2, User, Search, Filter, Phone, Mail, Banknote, DollarSign, Wallet, ArrowUpRight, History } from 'lucide-react';
import ReferrerFormModal from '../components/ReferrerFormModal';
import CommissionPaymentModal from '../components/CommissionPaymentModal';


const ReferrersPage = () => {
    const [referrers, setReferrers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [selectedReferrer, setSelectedReferrer] = useState(null);


    const API_URL = 'http://localhost:5000/api';

    useEffect(() => {
        fetchReferrers();
    }, []);

    const fetchReferrers = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`${API_URL}/referrers`);
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
                await axios.delete(`${API_URL}/referrers/${id}`);
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
            await axios.post(`${API_URL}/referrers/pay`, paymentData);
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
                await axios.put(`${API_URL}/referrers/${selectedReferrer.id}`, formData);
            } else {
                await axios.post(`${API_URL}/referrers`, formData);
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

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">Referrer & Commissions Management</h2>
                    <p className="text-sm text-gray-500">Track agents, manage referrals, and process commission payments.</p>
                </div>
                <button
                    onClick={handleAddReferrer}
                    className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition shadow-md"
                >
                    <Plus size={20} /> Register New Referrer
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
                    <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                        <User size={24} />
                    </div>
                    <div>
                        <div className="text-sm text-gray-500 font-medium">Active Referrers</div>
                        <div className="text-2xl font-bold text-gray-900">{referrers.filter(r => r.is_active).length}</div>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
                    <div className="p-3 bg-green-50 text-green-600 rounded-xl">
                        <Wallet size={24} />
                    </div>
                    <div>
                        <div className="text-sm text-gray-500 font-medium">Pending Commissions</div>
                        <div className="text-2xl font-bold text-gray-900">
                            ₦{referrers.reduce((acc, r) => acc + parseFloat(r.commission_balance || 0), 0).toLocaleString()}
                        </div>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
                    <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
                        <ArrowUpRight size={24} />
                    </div>
                    <div>
                        <div className="text-sm text-gray-500 font-medium">Total Earned</div>
                        <div className="text-2xl font-bold text-gray-900">
                            ₦{referrers.reduce((acc, r) => acc + parseFloat(r.total_commission_earned || 0), 0).toLocaleString()}
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-white p-4 rounded-lg shadow-sm border flex flex-wrap gap-4 items-center">
                <div className="relative flex-1 min-w-[300px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search by name, code or phone..."
                        className="pl-10 pr-4 py-2 bg-gray-50 border rounded-lg w-full focus:ring-2 focus:ring-blue-500 outline-none transition"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-2">
                    <Filter size={18} className="text-gray-400" />
                    <span className="text-sm text-gray-500 font-medium">Filters Applied: 0</span>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold tracking-widest border-b">
                        <tr>
                            <th className="px-6 py-4">Referrer Details</th>
                            <th className="px-6 py-4">Contact Info</th>
                            <th className="px-6 py-4">Config / Rate</th>
                            <th className="px-6 py-4">Earnings Status</th>
                            <th className="px-6 py-4 text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {loading ? (
                            <tr>
                                <td colSpan="5" className="px-6 py-20 text-center">
                                    <div className="flex flex-col items-center gap-2 text-gray-400">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                        <span>Synchronizing with database...</span>
                                    </div>
                                </td>
                            </tr>
                        ) : filteredReferrers.length === 0 ? (
                            <tr>
                                <td colSpan="5" className="px-6 py-20 text-center text-gray-400">
                                    No referrer records found.
                                </td>
                            </tr>
                        ) : (
                            filteredReferrers.map((ref) => (
                                <tr key={ref.id} className="hover:bg-slate-50 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-blue-50 text-blue-600 rounded-full">
                                                <User size={18} />
                                            </div>
                                            <div>
                                                <div className="font-bold text-gray-900 uppercase text-sm">{ref.full_name}</div>
                                                <div className="text-[10px] text-gray-400 font-mono tracking-tighter">{ref.referrer_code}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm">
                                        <div className="flex flex-col gap-1 text-gray-600">
                                            <div className="flex items-center gap-1.5"><Phone size={12} className="text-gray-400" /> {ref.phone}</div>
                                            <div className="flex items-center gap-1.5"><Mail size={12} className="text-gray-400" /> {ref.email || 'N/A'}</div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-1.5 mb-1">
                                            <span className="text-[10px] font-black px-2 py-0.5 rounded uppercase bg-slate-100 text-slate-700">
                                                {ref.commission_type}
                                            </span>
                                        </div>
                                        <div className="text-sm font-bold text-blue-600">
                                            {ref.commission_type === 'percentage' ? `${ref.commission_rate}%` : `₦${parseFloat(ref.fixed_commission_amount).toLocaleString()}`}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col gap-1">
                                            <div className="flex items-center justify-between text-[10px] uppercase font-bold">
                                                <span className="text-gray-400">Balance:</span>
                                                <span className="text-green-600">₦{parseFloat(ref.commission_balance).toLocaleString()}</span>
                                            </div>
                                            <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                                                <div className="bg-green-500 h-full" style={{ width: `${Math.min((ref.total_commission_paid / ref.total_commission_earned) * 100 || 0, 100)}%` }}></div>
                                            </div>
                                            <div className="flex items-center justify-between text-[9px] text-gray-400 font-medium">
                                                <span>Paid: ₦{parseFloat(ref.total_commission_paid).toLocaleString()}</span>
                                                <span>Total: ₦{parseFloat(ref.total_commission_earned).toLocaleString()}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex justify-center gap-3">
                                            <button onClick={() => handleEditReferrer(ref)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition" title="Edit Referrer">
                                                <Edit size={18} />
                                            </button>
                                            <button 
                                                onClick={() => handlePayCommission(ref)}
                                                className="p-2 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition" 
                                                title="Pay Commission"
                                            >
                                                <Banknote size={18} />
                                            </button>

                                            <button onClick={() => handleDeleteReferrer(ref.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition" title="Delete Referrer">
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
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
