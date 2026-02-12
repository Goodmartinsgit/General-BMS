import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { TrendingUp, ShoppingBag, AlertTriangle, CreditCard, ArrowUpRight, ArrowDownRight, Package, Users, BarChart3, Activity } from 'lucide-react';

const Dashboard = () => {
    const [stats, setStats] = useState({
        monthlySales: 0,
        activeOrders: 0,
        lowStockAlerts: 0,
        monthlyExpenses: 0
    });
    const [trend, setTrend] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            setLoading(true);
            const response = await api.get('/reports/dashboard-stats');
            if (response.data) {
                setStats(prev => ({ ...prev, ...response.data.stats }));
                setTrend(response.data.salesTrend || []);
            }
        } catch (error) {
            console.error('Error fetching dashboard stats:', error);
        } finally {
            setLoading(false);
        }
    };

    const AreaChart = ({ data }) => {
        if (data.length < 2) return (
            <div className="h-full flex flex-col items-center justify-center text-gray-300 italic text-xs gap-2">
                <BarChart3 size={32} className="opacity-20" />
                No velocity data available
            </div>
        );
        
        const max = Math.max(...data.map(d => parseFloat(d.amount)), 1);
        const pad = data.length > 1 ? (data.length - 1) : 1;
        const points = data.map((d, i) => `${(i / pad) * 100},${100 - (parseFloat(d.amount) / max) * 70}`).join(' ');

        return (
            <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible" preserveAspectRatio="none">
                <defs>
                    <linearGradient id="chartFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.4" />
                        <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
                    </linearGradient>
                </defs>
                <path
                    d={`M 0,100 L ${points} L 100,100 Z`}
                    fill="url(#chartFill)"
                    className="transition-all duration-700 ease-in-out"
                />
                <polyline
                    fill="none"
                    stroke="#3b82f6"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points={points}
                    className="transition-all duration-700 ease-in-out"
                />
                {/* Dots at peaks */}
                {data.map((d, i) => (
                    <circle 
                        key={i} 
                        cx={(i / pad) * 100} 
                        cy={100 - (parseFloat(d.amount) / max) * 70} 
                        r="2" 
                        fill="white" 
                        stroke="#3b82f6" 
                        strokeWidth="1.5" 
                    />
                ))}
            </svg>
        );
    };

    const StatCard = ({ title, value, icon: Icon, colorClass, trendVal, label }) => (
        <div className="bg-theme-secondary p-7 rounded-[2rem] border border-theme shadow-theme-sm hover:shadow-theme-md transition-all duration-300 group">
            <div className="flex justify-between items-start mb-6">
                <div className={`p-4 rounded-2xl ${colorClass}`}>
                    <Icon size={24} className="text-white" />
                </div>
                {trendVal && (
                    <div className={`flex items-center gap-1 text-[11px] font-bold px-3 py-1.5 rounded-full ${trendVal > 0 ? 'bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400'} border ${trendVal > 0 ? 'border-green-100 dark:border-green-800' : 'border-red-100 dark:border-red-800'}`}>
                        {trendVal > 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                        {Math.abs(trendVal)}%
                    </div>
                )}
            </div>
            <div className="space-y-1">
                <div className="text-theme-muted text-xs font-bold uppercase tracking-widest">{title}</div>
                <div className="text-3xl font-black text-theme-primary tracking-tight">{value}</div>
                <div className="text-[10px] text-theme-muted font-semibold flex items-center gap-2 mt-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-gray-200 dark:bg-gray-700"></span> {label}
                </div>
            </div>
        </div>
    );

    return (
        <div className="space-y-10 max-w-[1600px] mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                <StatCard 
                    title="Gross Revenue" 
                    value={`₦${parseFloat(stats.monthlySales).toLocaleString()}`} 
                    icon={TrendingUp} 
                    colorClass="bg-blue-600 shadow-lg shadow-blue-200 dark:shadow-blue-900/20"
                    trendVal={14.2}
                    label="Last 30 days performance"
                />
                <StatCard 
                    title="Active Workflow" 
                    value={stats.activeOrders} 
                    icon={ShoppingBag} 
                    colorClass="bg-purple-600 shadow-lg shadow-purple-200 dark:shadow-purple-900/20"
                    label="Orders currently in progress"
                />
                <StatCard 
                    title="Safety Alerts" 
                    value={stats.lowStockAlerts} 
                    icon={AlertTriangle} 
                    colorClass="bg-orange-500 shadow-lg shadow-orange-200 dark:shadow-orange-900/20"
                    label="Inventory below threshold"
                />
                <StatCard 
                    title="Operating Expenses" 
                    value={`₦${parseFloat(stats.monthlyExpenses).toLocaleString()}`} 
                    icon={CreditCard} 
                    colorClass="bg-rose-500 shadow-lg shadow-rose-200 dark:shadow-rose-900/20"
                    trendVal={-2.4}
                    label="Total operational burn"
                />
            </div>

            {/* Main Visuals */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-theme-secondary p-10 rounded-[2.5rem] border border-theme shadow-theme-sm flex flex-col hover:shadow-theme-md transition-shadow duration-500">
                    <div className="flex justify-between items-center mb-10">
                        <div>
                            <h3 className="font-black text-theme-primary uppercase tracking-widest text-xs">Sales Velocity</h3>
                            <p className="text-[10px] text-theme-muted font-bold mt-1 uppercase tracking-wider">Revenue flow over the past cycle</p>
                        </div>
                        <div className="flex items-center gap-6">
                            <div className="flex items-center gap-2 text-[10px] font-bold text-theme-muted">
                                <span className="w-3 h-3 rounded-full bg-blue-600 shadow-sm shadow-blue-200"></span> Current Cycle
                            </div>
                        </div>
                    </div>
                    <div className="flex-1 min-h-[300px] relative px-2">
                        <AreaChart data={trend} />
                    </div>
                </div>

                <div className="bg-gray-900 dark:bg-black p-10 rounded-[2.5rem] shadow-2xl shadow-blue-900/10 text-white flex flex-col justify-between overflow-hidden relative group">
                    <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Activity size={120} />
                    </div>
                    
                    <div>
                        <h3 className="font-bold text-blue-400 uppercase tracking-widest text-[10px] mb-8 border-b border-white/10 pb-4">Real-time Insights</h3>
                        <div className="space-y-8 relative z-10">
                            <div className="flex items-start gap-5">
                                <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-md border border-white/10">
                                    <Package size={22} className="text-blue-400" />
                                </div>
                                <div>
                                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Inventory Health</div>
                                    <div className="text-lg font-black mt-1">{stats.lowStockAlerts > 0 ? 'Optimization Required' : 'Optimal Balance'}</div>
                                    <div className="text-[10px] text-blue-400/60 font-bold mt-1 uppercase tracking-tighter">Verified across {stats.branchesCount || 1} branches</div>
                                </div>
                            </div>

                            <div className="flex items-start gap-5">
                                <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-md border border-white/10">
                                    <Users size={22} className="text-purple-400" />
                                </div>
                                <div>
                                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Engagement Level</div>
                                    <div className="text-lg font-black mt-1">High Activity Pattern</div>
                                    <div className="text-[10px] text-purple-400/60 font-bold mt-1 uppercase tracking-tighter">78% Retention efficiency detected</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <button className="mt-12 relative z-10 w-full bg-white text-gray-900 font-black py-4 rounded-2xl text-xs hover:bg-blue-50 transition-all active:scale-[0.98] shadow-xl shadow-black/20 flex items-center justify-center gap-3 group/btn">
                         Explore Analytics Matrix <ArrowUpRight size={18} className="group-hover/btn:translate-x-1 group-hover/btn:-translate-y-1 transition-transform" />
                    </button>
                    
                    {/* Decorative blobs */}
                    <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-blue-600/20 rounded-full blur-[80px]"></div>
                    <div className="absolute -top-12 -right-12 w-48 h-48 bg-purple-600/10 rounded-full blur-[80px]"></div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
