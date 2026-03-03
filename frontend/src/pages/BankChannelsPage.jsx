import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { Plus, Edit, Landmark, Wallet, List, Search, X, DollarSign } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../components/common/PageHeader';
import { useCurrency } from '../context/CurrencyContext';

const BankChannelsPage = () => {
    const { formatCurrency, symbol } = useCurrency();
    const navigate = useNavigate();
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

    useEffect(() => {
        fetchChannels();
    }, []);

    const fetchChannels = async () => {
        try {
            const response = await api.get(`/banks/channels`);
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
                await api.put(`/banks/channels/${selectedChannel.id}`, formData);
            } else {
                await api.post(`/banks/channels`, formData);
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
    const activeChannels = channels.filter(c => c.is_active).length;

    const actions = (
        <button
            onClick={() => { resetForm(); setIsModalOpen(true); }}
            className="bg-accent-gold text-white px-4 py-2 rounded-lg font-semibold text-sm hover:bg-accent-goldDark transition flex items-center gap-2"
        >
            <Plus className="w-4 h-4" /> Add Channel
        </button>
    );

    return (
        <div className="space-y-6 max-w-[1700px] mx-auto pb-10">
            <PageHeader
                title="Bank Channels"
                subtitle="Manage bank accounts and cash drawers"
                badge={`${channels.length} Channels`}
                icon={Landmark}
                actions={actions}
            />

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="bg-theme-secondary p-6 rounded-lg border border-theme shadow-theme-sm flex items-center gap-4">
                    <div className="p-3 bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 rounded-lg">
                        <DollarSign size={24} />
                    </div>
                    <div>
                        <div className="text-sm text-theme-muted font-medium">Total Balance</div>
                        <div className="text-2xl font-semibold text-theme-primary">{formatCurrency(totalBalance)}</div>
                    </div>
                </div>
                <div className="bg-theme-secondary p-6 rounded-lg border border-theme shadow-theme-sm flex items-center gap-4">
                    <div className="p-3 bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400 rounded-lg">
                        <Landmark size={24} />
                    </div>
                    <div>
                        <div className="text-sm text-theme-muted font-medium">Active Channels</div>
                        <div className="text-2xl font-semibold text-theme-primary">{activeChannels}</div>
                    </div>
                </div>
                <div className="bg-theme-secondary p-6 rounded-lg border border-theme shadow-theme-sm flex items-center gap-4">
                    <div className="p-3 bg-amber-100 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400 rounded-lg">
                        <Wallet size={24} />
                    </div>
                    <div>
                        <div className="text-sm text-theme-muted font-medium">Total Channels</div>
                        <div className="text-2xl font-semibold text-theme-primary">{channels.length}</div>
                    </div>
                </div>
            </div>

            {/* Search Bar */}
            <div className="bg-theme-secondary p-4 rounded-lg border border-theme shadow-theme-sm">
                <div className="relative w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-theme-muted w-5 h-5 pointer-events-none" />
                    <input
                        type="text"
                        placeholder="Search by channel name or bank..."
                        className="w-full pl-10 pr-4 py-2.5 bg-theme-primary border border-theme rounded-lg focus:ring-2 focus:ring-accent-gold/20 focus:border-accent-gold/30 outline-none transition-all text-sm text-theme-primary placeholder-theme-muted"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Channels Grid */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {Array(3).fill(0).map((_, i) => (
                        <div key={i} className="bg-theme-secondary p-6 rounded-lg border border-theme shadow-theme-sm animate-pulse">
                            <div className="flex justify-between mb-4">
                                <div className="h-5 w-40 bg-theme-tertiary rounded"></div>
                                <div className="h-5 w-16 bg-theme-tertiary rounded-full"></div>
                            </div>
                            <div className="h-8 w-48 bg-theme-tertiary rounded mb-2"></div>
                            <div className="h-4 w-24 bg-theme-tertiary rounded mb-6"></div>
                            <div className="h-16 bg-theme-tertiary rounded-lg mb-4"></div>
                            <div className="flex gap-2">
                                <div className="flex-1 h-10 bg-theme-tertiary rounded-lg"></div>
                                <div className="flex-1 h-10 bg-theme-tertiary rounded-lg"></div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : filteredChannels.length === 0 ? (
                <div className="bg-theme-secondary p-12 rounded-lg border border-theme shadow-theme-sm text-center">
                    <Landmark className="w-16 h-16 text-theme-muted mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-theme-primary mb-2">No Channels Found</h3>
                    <p className="text-theme-muted mb-6">
                        {searchTerm ? 'Try adjusting your search term.' : 'Get started by adding your first bank channel.'}
                    </p>
                    {!searchTerm && (
                        <button
                            onClick={() => { resetForm(); setIsModalOpen(true); }}
                            className="bg-accent-gold text-white px-6 py-2 rounded-lg font-semibold hover:bg-accent-goldDark transition inline-flex items-center gap-2"
                        >
                            <Plus className="w-4 h-4" /> Add Channel
                        </button>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredChannels.map(channel => (
                        <div key={channel.id} className="bg-theme-secondary rounded-lg border border-theme shadow-theme-sm hover:shadow-theme-md transition-shadow flex flex-col">
                            <div className="p-6 flex-1">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h3 className="text-lg font-bold text-theme-primary">{channel.channel_name}</h3>
                                        <p className="text-xs text-theme-muted mt-0.5">{channel.bank_name || 'Internal'}</p>
                                    </div>
                                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                                        channel.is_active
                                            ? 'bg-green-200 text-green-900 dark:bg-green-900/30 dark:text-green-300'
                                            : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                                    }`}>
                                        {channel.is_active ? 'Active' : 'Inactive'}
                                    </span>
                                </div>

                                <div className="mb-5">
                                    <div className="text-xs text-theme-muted font-medium mb-1">Available Balance</div>
                                    <div className="text-2xl font-bold text-theme-primary">
                                        {formatCurrency(channel.current_balance)}
                                    </div>
                                </div>

                                {channel.account_number && (
                                    <div className="bg-theme-primary p-4 rounded-lg border border-theme mb-5 space-y-2">
                                        <div className="flex justify-between text-xs">
                                            <span className="text-theme-muted font-medium">Account No</span>
                                            <span className="text-theme-primary font-semibold">{channel.account_number}</span>
                                        </div>
                                        <div className="flex justify-between text-xs">
                                            <span className="text-theme-muted font-medium">Account Name</span>
                                            <span className="text-theme-primary font-semibold">{channel.account_name}</span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="px-6 pb-6 flex gap-2">
                                <button
                                    onClick={() => handleEdit(channel)}
                                    className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-theme-primary border border-theme text-theme-secondary font-medium text-sm rounded-lg hover:bg-theme-tertiary transition"
                                >
                                    <Edit size={15} /> Edit
                                </button>
                                <button
                                    className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-accent-gold/10 border border-accent-gold/20 text-accent-gold font-medium text-sm rounded-lg hover:bg-accent-gold/20 transition"
                                    onClick={() => navigate(`/cash-flow?channelId=${channel.id}`)}
                                >
                                    <List size={15} /> History
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={() => setIsModalOpen(false)}>
                    <div className="bg-theme-secondary rounded-xl max-w-md w-full shadow-2xl border border-theme" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between p-6 border-b border-theme">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-accent-gold text-white flex items-center justify-center">
                                    <Landmark size={20} />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-theme-primary">
                                        {selectedChannel ? 'Edit Channel' : 'New Bank Channel'}
                                    </h2>
                                    <p className="text-xs text-theme-muted mt-0.5">Financial account configuration</p>
                                </div>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="p-1.5 text-theme-muted hover:text-theme-primary hover:bg-theme-tertiary rounded-lg transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-theme-primary mb-2">Channel Name</label>
                                <input
                                    type="text"
                                    value={formData.channel_name}
                                    onChange={(e) => setFormData({ ...formData, channel_name: e.target.value })}
                                    className="w-full bg-theme-primary border border-theme rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-accent-gold/20 focus:border-accent-gold/30 outline-none transition-all text-theme-primary placeholder-theme-muted text-sm"
                                    placeholder="e.g. POS Zenith, Cash Drawer"
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-sm font-medium text-theme-primary mb-2">Bank Name</label>
                                    <input
                                        type="text"
                                        value={formData.bank_name}
                                        onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
                                        className="w-full bg-theme-primary border border-theme rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-accent-gold/20 focus:border-accent-gold/30 outline-none transition-all text-theme-primary placeholder-theme-muted text-sm"
                                        placeholder="e.g. Zenith Bank"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-theme-primary mb-2">Account Number</label>
                                    <input
                                        type="text"
                                        value={formData.account_number}
                                        onChange={(e) => setFormData({ ...formData, account_number: e.target.value })}
                                        className="w-full bg-theme-primary border border-theme rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-accent-gold/20 focus:border-accent-gold/30 outline-none transition-all text-theme-primary placeholder-theme-muted text-sm"
                                        placeholder="1234567890"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-theme-primary mb-2">Account Name</label>
                                <input
                                    type="text"
                                    value={formData.account_name}
                                    onChange={(e) => setFormData({ ...formData, account_name: e.target.value })}
                                    className="w-full bg-theme-primary border border-theme rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-accent-gold/20 focus:border-accent-gold/30 outline-none transition-all text-theme-primary placeholder-theme-muted text-sm"
                                    placeholder="Business Name"
                                />
                            </div>

                            {!selectedChannel && (
                                <div>
                                    <label className="block text-sm font-medium text-theme-primary mb-2">Initial Balance ({symbol})</label>
                                    <input
                                        type="number"
                                        value={formData.initial_balance}
                                        onChange={(e) => setFormData({ ...formData, initial_balance: e.target.value })}
                                        className="w-full bg-theme-primary border border-theme rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-accent-gold/20 focus:border-accent-gold/30 outline-none transition-all text-theme-primary placeholder-theme-muted text-sm"
                                        placeholder="0.00"
                                        min="0"
                                        step="0.01"
                                    />
                                </div>
                            )}

                            <div className="flex items-center gap-3">
                                <button
                                    type="button"
                                    role="switch"
                                    aria-checked={formData.is_active}
                                    onClick={() => setFormData({ ...formData, is_active: !formData.is_active })}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                        formData.is_active ? 'bg-accent-gold' : 'bg-theme-tertiary'
                                    }`}
                                >
                                    <span className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${
                                        formData.is_active ? 'translate-x-6' : 'translate-x-1'
                                    }`} />
                                </button>
                                <label className="text-sm font-medium text-theme-primary">
                                    {formData.is_active ? 'Active' : 'Inactive'}
                                </label>
                            </div>

                            <div className="flex gap-3 pt-4 border-t border-theme">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="flex-1 px-4 py-2.5 bg-theme-secondary border border-theme text-theme-secondary rounded-lg hover:bg-theme-tertiary transition font-medium"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-2.5 bg-accent-gold text-white rounded-lg hover:bg-accent-goldDark transition font-semibold"
                                >
                                    {selectedChannel ? 'Update Channel' : 'Create Channel'}
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
