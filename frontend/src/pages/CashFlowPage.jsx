import React, { useState, useEffect, useCallback } from 'react';
import api from '../api/axios';
import { useLocation } from 'react-router-dom';
import { ArrowUpRight, ArrowDownLeft, Download, Landmark, Wallet, DollarSign, TrendingUp, TrendingDown, Activity } from 'lucide-react';
import PageHeader from '../components/common/PageHeader';
import PeriodFilter from '../components/common/PeriodFilter';
import { useCurrency } from '../context/CurrencyContext';

const CashFlowPage = () => {
    const { formatCurrency } = useCurrency();
    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);
    const initialChannelId = queryParams.get('channelId') || '';

    const [channels, setChannels] = useState([]);
    const [history, setHistory] = useState([]);
    const [summary, setSummary] = useState({ total_inflow: 0, total_outflow: 0, total_transactions: 0 });
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        channelId: initialChannelId,
        startDate: '',
        endDate: '',
        limit: 50
    });

    useEffect(() => {
        fetchChannels();
        fetchSummary();
    }, []);

    useEffect(() => {
        if (filters.channelId) {
            fetchHistory();
        } else if (channels.length > 0) {
            setFilters(prev => ({ ...prev, channelId: channels[0].id }));
        }
    }, [filters, channels]);

    const fetchChannels = async () => {
        try {
            const response = await api.get(`/banks/channels`);
            setChannels(response.data);
            if (response.data.length > 0 && !filters.channelId) {
                setFilters(prev => ({ ...prev, channelId: response.data[0].id }));
            }
        } catch (error) {
            console.error('Error fetching channels:', error);
        }
    };

    const fetchHistory = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/banks/channels/${filters.channelId}/history`, {
                params: {
                    startDate: filters.startDate,
                    endDate: filters.endDate,
                    limit: filters.limit
                }
            });
            setHistory(response.data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching history:', error);
            setLoading(false);
        }
    };

    const fetchSummary = async () => {
        try {
            const response = await api.get(`/banks/summary`, {
                params: {
                    startDate: filters.startDate,
                    endDate: filters.endDate
                }
            });
            setSummary(response.data);
        } catch (error) {
            console.error('Error fetching summary:', error);
        }
    };

    const selectedChannel = channels.find(c => c.id.toString() === filters.channelId.toString());
    const netFlow = parseFloat(summary.total_inflow || 0) - parseFloat(summary.total_outflow || 0);

    const handlePeriodChange = useCallback((range) => {
        setFilters(prev => ({ ...prev, startDate: range.start_date || '', endDate: range.end_date || '' }));
    }, []);

    const actions = (
        <div className="flex items-center gap-2">
            <PeriodFilter storageKey="cash-flow" onChange={handlePeriodChange} />
            <button className="bg-theme-secondary border border-theme text-theme-secondary px-4 py-2 rounded-lg font-medium text-sm hover:bg-theme-tertiary transition flex items-center gap-2">
                <Download size={16} /> Export CSV
            </button>
        </div>
    );

    return (
        <div className="space-y-6 max-w-[1700px] mx-auto pb-10">
            <PageHeader
                title="Cash Flow"
                subtitle="Track inflows and outflows across your bank channels"
                badge={`${summary.total_transactions || 0} Transactions`}
                icon={Activity}
                actions={actions}
            />

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-theme-secondary p-6 rounded-lg border border-theme shadow-theme-sm flex items-center gap-4">
                    <div className="p-3 bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 rounded-lg">
                        <Landmark size={24} />
                    </div>
                    <div>
                        <div className="text-sm text-theme-muted font-medium">Account Balance</div>
                        <div className="text-2xl font-semibold text-theme-primary">
                            {formatCurrency(selectedChannel?.current_balance || 0)}
                        </div>
                        <div className="text-xs text-theme-muted mt-0.5">{selectedChannel?.channel_name || 'No channel'}</div>
                    </div>
                </div>
                <div className="bg-theme-secondary p-6 rounded-lg border border-theme shadow-theme-sm flex items-center gap-4">
                    <div className="p-3 bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400 rounded-lg">
                        <TrendingUp size={24} />
                    </div>
                    <div>
                        <div className="text-sm text-theme-muted font-medium">Total Inflow</div>
                        <div className="text-2xl font-semibold text-green-600">
                            {formatCurrency(summary.total_inflow || 0)}
                        </div>
                    </div>
                </div>
                <div className="bg-theme-secondary p-6 rounded-lg border border-theme shadow-theme-sm flex items-center gap-4">
                    <div className="p-3 bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400 rounded-lg">
                        <TrendingDown size={24} />
                    </div>
                    <div>
                        <div className="text-sm text-theme-muted font-medium">Total Outflow</div>
                        <div className="text-2xl font-semibold text-red-600">
                            {formatCurrency(summary.total_outflow || 0)}
                        </div>
                    </div>
                </div>
                <div className="bg-theme-secondary p-6 rounded-lg border border-theme shadow-theme-sm flex items-center gap-4">
                    <div className="p-3 bg-amber-100 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400 rounded-lg">
                        <DollarSign size={24} />
                    </div>
                    <div>
                        <div className="text-sm text-theme-muted font-medium">Net Cash Flow</div>
                        <div className={`text-2xl font-semibold ${netFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {netFlow >= 0 ? '+' : ''}{formatCurrency(netFlow)}
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-theme-secondary p-4 rounded-lg border border-theme shadow-theme-sm">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                        <label className="block text-xs font-medium text-theme-muted mb-1.5">Channel</label>
                        <select
                            className="w-full bg-theme-primary border border-theme rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-accent-gold/20 focus:border-accent-gold/30 outline-none transition-all text-sm text-theme-primary"
                            value={filters.channelId}
                            onChange={(e) => setFilters(prev => ({ ...prev, channelId: e.target.value }))}
                        >
                            {channels.map(c => (
                                <option key={c.id} value={c.id}>{c.channel_name} ({c.bank_name || 'Internal'})</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-theme-muted mb-1.5">Start Date</label>
                        <input
                            type="date"
                            className="w-full bg-theme-primary border border-theme rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-accent-gold/20 focus:border-accent-gold/30 outline-none transition-all text-sm text-theme-primary"
                            value={filters.startDate}
                            onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-theme-muted mb-1.5">End Date</label>
                        <input
                            type="date"
                            className="w-full bg-theme-primary border border-theme rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-accent-gold/20 focus:border-accent-gold/30 outline-none transition-all text-sm text-theme-primary"
                            value={filters.endDate}
                            onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-theme-muted mb-1.5">Show</label>
                        <select
                            className="w-full bg-theme-primary border border-theme rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-accent-gold/20 focus:border-accent-gold/30 outline-none transition-all text-sm text-theme-primary"
                            value={filters.limit}
                            onChange={(e) => setFilters(prev => ({ ...prev, limit: e.target.value }))}
                        >
                            <option value="50">Last 50</option>
                            <option value="100">Last 100</option>
                            <option value="500">Last 500</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Transaction Table */}
            <div className="bg-theme-secondary rounded-lg border border-theme shadow-theme-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-theme-primary border-b border-theme">
                                <th className="px-6 py-3 text-xs font-semibold text-theme-muted uppercase">Date & Time</th>
                                <th className="px-6 py-3 text-xs font-semibold text-theme-muted uppercase">Reference</th>
                                <th className="px-6 py-3 text-xs font-semibold text-theme-muted uppercase">Type / Source</th>
                                <th className="px-6 py-3 text-xs font-semibold text-theme-muted uppercase text-right">Amount</th>
                                <th className="px-6 py-3 text-xs font-semibold text-theme-muted uppercase text-right">Balance After</th>
                                <th className="px-6 py-3 text-xs font-semibold text-theme-muted uppercase">Description</th>
                                <th className="px-6 py-3 text-xs font-semibold text-theme-muted uppercase">User</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-theme">
                            {loading ? (
                                Array(5).fill(0).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan="7" className="px-6 py-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 bg-theme-tertiary rounded-lg"></div>
                                                <div className="space-y-2 flex-1">
                                                    <div className="w-48 h-4 bg-theme-tertiary rounded"></div>
                                                    <div className="w-32 h-3 bg-theme-tertiary rounded"></div>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : history.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="px-6 py-16 text-center">
                                        <div className="flex flex-col items-center gap-4">
                                            <div className="w-16 h-16 bg-theme-tertiary rounded-full flex items-center justify-center text-theme-muted">
                                                <Activity size={32} />
                                            </div>
                                            <div>
                                                <p className="font-semibold text-theme-primary text-lg">No transactions found</p>
                                                <p className="text-theme-muted text-sm mt-1">Try adjusting your filters or date range.</p>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                history.map(row => (
                                    <tr key={row.id} className="hover:bg-theme-primary transition-colors group">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-theme-primary">{new Date(row.created_at).toLocaleDateString()}</div>
                                            <div className="text-xs text-theme-muted">{new Date(row.created_at).toLocaleTimeString()}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="px-2 py-1 bg-theme-tertiary text-theme-secondary rounded text-xs font-mono">
                                                {row.reference_number || RowID(row.id)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-2">
                                                {row.type === 'inflow' ? (
                                                    <div className="p-1.5 bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400 rounded-lg">
                                                        <ArrowDownLeft size={14} />
                                                    </div>
                                                ) : (
                                                    <div className="p-1.5 bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400 rounded-lg">
                                                        <ArrowUpRight size={14} />
                                                    </div>
                                                )}
                                                <div>
                                                    <div className="text-sm font-medium text-theme-primary">{row.source}</div>
                                                    <span className={`text-xs font-medium ${row.type === 'inflow' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                                        {row.type}
                                                    </span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className={`px-6 py-4 whitespace-nowrap text-right font-semibold text-sm ${row.type === 'inflow' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                            {row.type === 'inflow' ? '+' : '-'}{formatCurrency(row.amount)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right font-semibold text-sm text-theme-primary">
                                            {formatCurrency(row.balance_after)}
                                        </td>
                                        <td className="px-6 py-4 max-w-xs">
                                            <div className="text-xs text-theme-muted line-clamp-2">{row.description}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-2">
                                                <div className="w-7 h-7 rounded-full bg-accent-gold/10 text-accent-gold flex items-center justify-center text-xs font-semibold border border-accent-gold/20">
                                                    {row.performer?.charAt(0) || 'S'}
                                                </div>
                                                <span className="text-xs font-medium text-theme-secondary">{row.performer || 'System'}</span>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

const RowID = (id) => `REF-${id.toString().padStart(5, '0')}`;

export default CashFlowPage;
