import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Edit, Trash2, Banknote, Landmark, Wallet, List, ArrowUpRight, ArrowDownLeft, Search, Filter } from 'lucide-react';

const BankChannelsPage = () => {
    const [channels, setChannels] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedChannel, setSelectedChannel] = useState(null);
    const [formData, setFormData] = useState({
        channel_name: '',
        bank_name: '',
        account_number: '',
        account_name: '',
        initial_balance: 0,
        is_active: true
    });

    const API_URL = 'http://localhost:5000/api';

    useEffect(() => {
        fetchChannels();
    }, []);

    const fetchChannels = async () => {
        try {
            const response = await axios.get(`${API_URL}/banks/channels`);
            setChannels(response.data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching channels:', error);
            setLoading(false);
        }
    };

    const handleEdit = (channel) => {
        setSelectedChannel(channel);
        setFormData({
            channel_name: channel.channel_name,
            bank_name: channel.bank_name || '',
            account_number: channel.account_number || '',
            account_name: channel.account_name || '',
            is_active: channel.is_active
        });
        setIsModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (selectedChannel) {
                await axios.put(`${API_URL}/banks/channels/${selectedChannel.id}`, formData);
            } else {
                await axios.post(`${API_URL}/banks/channels`, formData);
            }
            setIsModalOpen(false);
            fetchChannels();
            resetForm();
        } catch (error) {
            alert('Failed to save channel');
        }
    };

    const resetForm = () => {
        setSelectedChannel(null);
        setFormData({
            channel_name: '',
            bank_name: '',
            account_number: '',
            account_name: '',
            initial_balance: 0,
            is_active: true
        });
    };

    const filteredChannels = channels.filter(c => 
        c.channel_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.bank_name && c.bank_name.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const totalBalance = channels.reduce((sum, c) => sum + parseFloat(c.current_balance), 0);

    return (
        <div className="p-4 md:p-8 bg-slate-50 min-h-screen">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">BANK CHANNELS</h1>
                    <p className="text-slate-500 font-medium">Manage bank accounts and cash drawers</p>
                </div>
                <button 
                    onClick={() => { resetForm(); setIsModalOpen(true); }}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-2xl font-black shadow-lg shadow-blue-100 flex items-center gap-2 transition active:scale-95"
                >
                    <Plus size={20} /> ADD NEW CHANNEL
                </button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-blue-50 rounded-2xl text-blue-600">
                            <Wallet size={24} />
                        </div>
                    </div>
                    <div className="text-3xl font-black text-slate-900">₦{totalBalance.toLocaleString()}</div>
                    <div className="text-sm font-bold text-slate-400 uppercase tracking-wider">Total Liquidity</div>
                </div>
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-green-50 rounded-2xl text-green-600">
                            <Landmark size={24} />
                        </div>
                    </div>
                    <div className="text-3xl font-black text-slate-900">{channels.length}</div>
                    <div className="text-sm font-bold text-slate-400 uppercase tracking-wider">Active Channels</div>
                </div>
            </div>

            {/* Search & Filter */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 mb-6 flex gap-4">
                <div className="flex-1 relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    <input 
                        type="text" 
                        placeholder="Search by channel name or bank..."
                        className="w-full pl-12 pr-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-medium"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Channels Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredChannels.map(channel => (
                    <div key={channel.id} className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-md transition group">
                        <div className="p-6">
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <h3 className="text-xl font-black text-slate-900 uppercase">{channel.channel_name}</h3>
                                    <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">{channel.bank_name || 'INTERNAL'}</p>
                                </div>
                                <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${channel.is_active ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-500'}`}>
                                    {channel.is_active ? 'Active' : 'Inactive'}
                                </div>
                            </div>

                            <div className="mb-6">
                                <div className="text-sm text-slate-400 font-bold uppercase mb-1">Available Balance</div>
                                <div className="text-3xl font-black text-blue-600 tracking-tight">
                                    ₦{parseFloat(channel.current_balance).toLocaleString()}
                                </div>
                            </div>

                            {channel.account_number && (
                                <div className="bg-slate-50 p-4 rounded-2xl mb-6">
                                    <div className="flex justify-between text-xs font-bold text-slate-400 uppercase mb-1">
                                        <span>Account No</span>
                                        <span className="text-slate-900">{channel.account_number}</span>
                                    </div>
                                    <div className="flex justify-between text-xs font-bold text-slate-400 uppercase">
                                        <span>Account Name</span>
                                        <span className="text-slate-900">{channel.account_name}</span>
                                    </div>
                                </div>
                            )}

                            <div className="flex gap-2">
                                <button 
                                    onClick={() => handleEdit(channel)}
                                    className="flex-1 flex items-center justify-center gap-2 py-3 bg-slate-50 hover:bg-slate-100 text-slate-600 font-bold rounded-xl transition"
                                >
                                    <Edit size={16} /> EDIT
                                </button>
                                <button 
                                    className="flex-1 flex items-center justify-center gap-2 py-3 bg-blue-50 hover:bg-blue-100 text-blue-600 font-bold rounded-xl transition"
                                    onClick={() => window.location.href = `/cash-flow?channelId=${channel.id}`}
                                >
                                    <List size={16} /> HISTORY
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="bg-slate-900 p-6 text-white flex justify-between items-center">
                            <div>
                                <h3 className="text-xl font-black uppercase tracking-tight">
                                    {selectedChannel ? 'Edit Channel' : 'New Bank Channel'}
                                </h3>
                                <p className="text-slate-400 text-xs font-bold uppercase">Financial Account Configuration</p>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white transition">
                                <Plus size={24} className="rotate-45" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase mb-1 tracking-widest">Channel Name (e.g., POS ZENITH)</label>
                                <input 
                                    type="text"
                                    value={formData.channel_name}
                                    onChange={(e) => setFormData({ ...formData, channel_name: e.target.value })}
                                    className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-bold"
                                    placeholder="Enter channel name"
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-1 tracking-widest">Bank Name</label>
                                    <input 
                                        type="text"
                                        value={formData.bank_name}
                                        onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
                                        className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-bold"
                                        placeholder="e.g. Zenith Bank"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-1 tracking-widest">Account Type</label>
                                    <select className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-bold">
                                        <option>Savings</option>
                                        <option>Current</option>
                                        <option>Internal Cash</option>
                                    </select>
                                </div>
                            </div>

                            {!selectedChannel && (
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-1 tracking-widest">Initial Balance (₦)</label>
                                    <input 
                                        type="number"
                                        value={formData.initial_balance}
                                        onChange={(e) => setFormData({ ...formData, initial_balance: e.target.value })}
                                        className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-blue-600"
                                        placeholder="0.00"
                                    />
                                </div>
                            )}

                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase mb-1 tracking-widest">Account Number</label>
                                <input 
                                    type="text"
                                    value={formData.account_number}
                                    onChange={(e) => setFormData({ ...formData, account_number: e.target.value })}
                                    className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-bold"
                                    placeholder="1234567890"
                                />
                            </div>

                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase mb-1 tracking-widest">Account Name</label>
                                <input 
                                    type="text"
                                    value={formData.account_name}
                                    onChange={(e) => setFormData({ ...formData, account_name: e.target.value })}
                                    className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-bold"
                                    placeholder="Business Name"
                                />
                            </div>

                            <div className="flex items-center gap-2 py-2">
                                <input 
                                    type="checkbox" 
                                    id="is_active"
                                    checked={formData.is_active}
                                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                                    className="w-5 h-5 accent-blue-600"
                                />
                                <label htmlFor="is_active" className="text-sm font-bold text-slate-700">Account is Active</label>
                            </div>

                            <div className="pt-4 flex gap-3">
                                <button 
                                    type="button" 
                                    onClick={() => setIsModalOpen(false)}
                                    className="flex-1 px-6 py-3 text-slate-600 font-bold hover:bg-slate-100 rounded-xl transition"
                                >
                                    CANCEL
                                </button>
                                <button 
                                    type="submit"
                                    className="flex-2 px-8 py-3 bg-blue-600 text-white font-black rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-200 transition active:scale-95"
                                >
                                    SAVE CHANNEL
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BankChannelsPage;
