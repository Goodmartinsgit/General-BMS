import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import {
    DollarSign,
    Users,
    CreditCard,
    PlayCircle,
    ArrowRight,
    Calendar,
    CheckCircle,
    Clock,
    AlertCircle,
    Banknote,
    TrendingUp
} from 'lucide-react';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../components/common/PageHeader';
import { useCurrency } from '../context/CurrencyContext';

const PayrollDashboardPage = () => {
    const { formatCurrency } = useCurrency();
    const navigate = useNavigate();
    const [stats, setStats] = useState({
        totalEmployees: 0,
        monthlyGross: 0,
        activeLoans: 0,
        latestRunStatus: null
    });
    const [recentRuns, setRecentRuns] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            const [salariesRes, runsRes, loansRes] = await Promise.all([
                api.get('/payroll/salaries'),
                api.get('/payroll/runs?limit=5'),
                api.get('/payroll/loans')
            ]);

            const salaries = salariesRes.data || [];
            const runs = runsRes.data || [];
            const loans = loansRes.data || [];

            const monthlyGross = salaries.reduce((sum, s) => {
                return sum + parseFloat(s.basic_salary || 0)
                    + parseFloat(s.housing_allowance || 0)
                    + parseFloat(s.transport_allowance || 0)
                    + parseFloat(s.other_allowances || 0);
            }, 0);

            const activeLoans = loans.filter(l => l.status === 'active').length;
            const latestRun = runs.length > 0 ? runs[0] : null;

            setStats({
                totalEmployees: salaries.length,
                monthlyGross,
                activeLoans,
                latestRunStatus: latestRun?.status || 'No runs yet'
            });
            setRecentRuns(runs);
        } catch (error) {
            console.error('Error fetching payroll dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusBadge = (status) => {
        const map = {
            draft: 'bg-gray-100 text-gray-700 dark:bg-gray-700/30 dark:text-gray-300',
            processing: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-300',
            approved: 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300',
            paid: 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-300',
            cancelled: 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-300'
        };
        return map[status] || 'bg-gray-100 text-gray-700 dark:bg-gray-700/30 dark:text-gray-300';
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'paid': return <CheckCircle size={14} />;
            case 'approved': return <CheckCircle size={14} />;
            case 'processing': return <Clock size={14} />;
            case 'cancelled': return <AlertCircle size={14} />;
            default: return <Clock size={14} />;
        }
    };

    const actions = (
        <>
            <button
                onClick={() => navigate('/payroll/runs')}
                className="bg-accent-gold text-white px-4 py-2 rounded-lg font-semibold text-sm hover:bg-accent-goldDark transition flex items-center gap-2"
            >
                <PlayCircle className="w-4 h-4" /> New Payroll Run
            </button>
        </>
    );

    if (loading) {
        return (
            <div className="space-y-6 max-w-[1700px] mx-auto pb-10">
                <PageHeader
                    title="Payroll Dashboard"
                    subtitle="Overview of payroll operations"
                    icon={DollarSign}
                />
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {Array(4).fill(0).map((_, i) => (
                        <div key={i} className="bg-theme-secondary rounded-lg border border-theme p-6 shadow-theme-sm animate-pulse">
                            <div className="w-24 h-4 bg-theme-tertiary rounded mb-3"></div>
                            <div className="w-16 h-8 bg-theme-tertiary rounded"></div>
                        </div>
                    ))}
                </div>
                <div className="bg-theme-secondary rounded-lg border border-theme p-6 shadow-theme-sm animate-pulse">
                    <div className="w-40 h-5 bg-theme-tertiary rounded mb-4"></div>
                    {Array(3).fill(0).map((_, i) => (
                        <div key={i} className="w-full h-12 bg-theme-tertiary rounded mb-3"></div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-[1700px] mx-auto pb-10">
            <PageHeader
                title="Payroll Dashboard"
                subtitle="Overview of payroll operations"
                icon={DollarSign}
                actions={actions}
            />

            {/* Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-theme-secondary rounded-lg border border-theme p-6 shadow-theme-sm flex items-center gap-4">
                    <div className="p-3 bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 rounded-lg">
                        <Users size={24} />
                    </div>
                    <div>
                        <p className="text-sm text-theme-muted font-medium">Total Employees</p>
                        <p className="text-2xl font-bold text-theme-primary mt-1">{stats.totalEmployees}</p>
                    </div>
                </div>

                <div className="bg-theme-secondary rounded-lg border border-theme p-6 shadow-theme-sm flex items-center gap-4">
                    <div className="p-3 bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400 rounded-lg">
                        <TrendingUp size={24} />
                    </div>
                    <div>
                        <p className="text-sm text-theme-muted font-medium">Monthly Gross</p>
                        <p className="text-2xl font-bold text-theme-primary mt-1">{formatCurrency(stats.monthlyGross)}</p>
                    </div>
                </div>

                <div className="bg-theme-secondary rounded-lg border border-theme p-6 shadow-theme-sm flex items-center gap-4">
                    <div className="p-3 bg-amber-100 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400 rounded-lg">
                        <Banknote size={24} />
                    </div>
                    <div>
                        <p className="text-sm text-theme-muted font-medium">Active Loans</p>
                        <p className="text-2xl font-bold text-theme-primary mt-1">{stats.activeLoans}</p>
                    </div>
                </div>

                <div className="bg-theme-secondary rounded-lg border border-theme p-6 shadow-theme-sm flex items-center gap-4">
                    <div className="p-3 bg-purple-100 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400 rounded-lg">
                        <PlayCircle size={24} />
                    </div>
                    <div>
                        <p className="text-sm text-theme-muted font-medium">Latest Run Status</p>
                        <p className="text-2xl font-bold text-theme-primary mt-1 capitalize">{stats.latestRunStatus}</p>
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                    onClick={() => navigate('/payroll/runs')}
                    className="bg-theme-secondary rounded-lg border border-theme p-5 shadow-theme-sm hover:border-accent-gold/40 transition group text-left"
                >
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-accent-gold/10 text-accent-gold rounded-lg">
                                <PlayCircle size={20} />
                            </div>
                            <div>
                                <p className="font-semibold text-theme-primary text-sm">New Payroll Run</p>
                                <p className="text-xs text-theme-muted mt-0.5">Create and process payroll</p>
                            </div>
                        </div>
                        <ArrowRight size={16} className="text-theme-muted group-hover:text-accent-gold transition" />
                    </div>
                </button>

                <button
                    onClick={() => navigate('/payroll/salaries')}
                    className="bg-theme-secondary rounded-lg border border-theme p-5 shadow-theme-sm hover:border-accent-gold/40 transition group text-left"
                >
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-accent-gold/10 text-accent-gold rounded-lg">
                                <Users size={20} />
                            </div>
                            <div>
                                <p className="font-semibold text-theme-primary text-sm">Employee Salaries</p>
                                <p className="text-xs text-theme-muted mt-0.5">Manage salary structures</p>
                            </div>
                        </div>
                        <ArrowRight size={16} className="text-theme-muted group-hover:text-accent-gold transition" />
                    </div>
                </button>

                <button
                    onClick={() => navigate('/payroll/loans')}
                    className="bg-theme-secondary rounded-lg border border-theme p-5 shadow-theme-sm hover:border-accent-gold/40 transition group text-left"
                >
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-accent-gold/10 text-accent-gold rounded-lg">
                                <CreditCard size={20} />
                            </div>
                            <div>
                                <p className="font-semibold text-theme-primary text-sm">View Loans</p>
                                <p className="text-xs text-theme-muted mt-0.5">Employee loan management</p>
                            </div>
                        </div>
                        <ArrowRight size={16} className="text-theme-muted group-hover:text-accent-gold transition" />
                    </div>
                </button>
            </div>

            {/* Recent Payroll Runs */}
            <div className="bg-theme-secondary rounded-lg border border-theme shadow-theme-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-theme flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-theme-primary">Recent Payroll Runs</h2>
                    <button
                        onClick={() => navigate('/payroll/runs')}
                        className="text-sm text-accent-gold hover:text-accent-goldDark font-medium transition flex items-center gap-1"
                    >
                        View All <ArrowRight size={14} />
                    </button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-theme-primary border-b border-theme">
                                <th className="px-6 py-3 text-xs font-semibold text-theme-muted uppercase">Run #</th>
                                <th className="px-6 py-3 text-xs font-semibold text-theme-muted uppercase">Period</th>
                                <th className="px-6 py-3 text-xs font-semibold text-theme-muted uppercase">Payment Date</th>
                                <th className="px-6 py-3 text-xs font-semibold text-theme-muted uppercase">Status</th>
                                <th className="px-6 py-3 text-xs font-semibold text-theme-muted uppercase">Gross Pay</th>
                                <th className="px-6 py-3 text-xs font-semibold text-theme-muted uppercase">Net Pay</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-theme">
                            {recentRuns.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-16 text-center">
                                        <div className="flex flex-col items-center gap-4">
                                            <div className="w-16 h-16 bg-theme-tertiary rounded-full flex items-center justify-center text-theme-muted">
                                                <PlayCircle size={32} />
                                            </div>
                                            <div>
                                                <p className="font-semibold text-theme-primary text-lg">No payroll runs yet</p>
                                                <p className="text-theme-muted text-sm mt-1">Create your first payroll run to get started.</p>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                recentRuns.map((run) => (
                                    <tr
                                        key={run.id}
                                        className="hover:bg-theme-primary transition-colors cursor-pointer"
                                        onClick={() => navigate(`/payroll/runs/${run.id}/payslips`)}
                                    >
                                        <td className="px-6 py-4">
                                            <span className="font-mono text-sm font-semibold text-theme-primary">
                                                #{run.id}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2 text-sm text-theme-secondary">
                                                <Calendar size={14} className="text-theme-muted" />
                                                {run.period_start && run.period_end
                                                    ? `${format(new Date(run.period_start), 'dd MMM')} - ${format(new Date(run.period_end), 'dd MMM yyyy')}`
                                                    : 'N/A'
                                                }
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-theme-secondary">
                                            {run.payment_date ? format(new Date(run.payment_date), 'dd MMM yyyy') : 'Not set'}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${getStatusBadge(run.status)}`}>
                                                {getStatusIcon(run.status)}
                                                {run.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm font-semibold text-theme-primary">
                                            {formatCurrency(run.total_gross || 0)}
                                        </td>
                                        <td className="px-6 py-4 text-sm font-semibold text-green-600 dark:text-green-400">
                                            {formatCurrency(run.total_net || 0)}
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

export default PayrollDashboardPage;
