import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import {
    PlayCircle,
    Search,
    Plus,
    Eye,
    CheckCircle,
    Clock,
    AlertCircle,
    X,
    Calendar,
    FileText,
    ArrowRight,
    Ban,
    CreditCard
} from 'lucide-react';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../components/common/PageHeader';
import { useCurrency } from '../context/CurrencyContext';

const PayrollRunsPage = () => {
    const { formatCurrency } = useCurrency();
    const navigate = useNavigate();
    const [runs, setRuns] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [saving, setSaving] = useState(false);
    const [actionLoading, setActionLoading] = useState(null);

    const defaultForm = {
        period_start: '',
        period_end: '',
        payment_date: '',
        notes: ''
    };

    const [form, setForm] = useState(defaultForm);

    useEffect(() => {
        fetchRuns();
    }, []);

    const fetchRuns = async () => {
        try {
            setLoading(true);
            const response = await api.get('/payroll/runs');
            setRuns(response.data || []);
        } catch (error) {
            console.error('Error fetching payroll runs:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = () => {
        setForm(defaultForm);
        setIsModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            await api.post('/payroll/runs', form);
            setIsModalOpen(false);
            fetchRuns();
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to create payroll run');
        } finally {
            setSaving(false);
        }
    };

    const handleProcess = async (runId) => {
        if (!window.confirm('Process this payroll run? This will calculate payslips for all employees.')) return;
        setActionLoading(runId);
        try {
            await api.post(`/payroll/runs/${runId}/process`);
            fetchRuns();
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to process payroll run');
        } finally {
            setActionLoading(null);
        }
    };

    const handleApprove = async (runId) => {
        if (!window.confirm('Approve this payroll run?')) return;
        setActionLoading(runId);
        try {
            await api.post(`/payroll/runs/${runId}/approve`);
            fetchRuns();
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to approve payroll run');
        } finally {
            setActionLoading(null);
        }
    };

    const handleMarkPaid = async (runId) => {
        if (!window.confirm('Mark this payroll run as paid?')) return;
        setActionLoading(runId);
        try {
            await api.post(`/payroll/runs/${runId}/pay`);
            fetchRuns();
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to mark payroll run as paid');
        } finally {
            setActionLoading(null);
        }
    };

    const handleCancel = async (runId) => {
        if (!window.confirm('Cancel this payroll run? This action cannot be undone.')) return;
        setActionLoading(runId);
        try {
            await api.post(`/payroll/runs/${runId}/cancel`);
            fetchRuns();
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to cancel payroll run');
        } finally {
            setActionLoading(null);
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
            default: return <FileText size={14} />;
        }
    };

    const filteredRuns = runs.filter(r =>
        r.status?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.notes?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        String(r.id).includes(searchTerm)
    );

    const totalGross = runs.reduce((sum, r) => sum + parseFloat(r.total_gross || 0), 0);
    const totalNet = runs.reduce((sum, r) => sum + parseFloat(r.total_net || 0), 0);

    const actions = (
        <button
            onClick={handleCreate}
            className="bg-accent-gold text-white px-4 py-2 rounded-lg font-semibold text-sm hover:bg-accent-goldDark transition flex items-center gap-2"
        >
            <Plus className="w-4 h-4" /> New Payroll Run
        </button>
    );

    return (
        <div className="space-y-6 max-w-[1700px] mx-auto pb-10">
            <PageHeader
                title="Payroll Runs"
                subtitle="Create and manage payroll processing runs"
                badge={`${runs.length} Runs`}
                icon={PlayCircle}
                actions={actions}
            />

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-theme-secondary rounded-lg border border-theme p-6 shadow-theme-sm flex items-center gap-4">
                    <div className="p-3 bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 rounded-lg">
                        <PlayCircle size={24} />
                    </div>
                    <div>
                        <p className="text-sm text-theme-muted font-medium">Total Runs</p>
                        <p className="text-2xl font-bold text-theme-primary mt-1">{runs.length}</p>
                    </div>
                </div>
                <div className="bg-theme-secondary rounded-lg border border-theme p-6 shadow-theme-sm flex items-center gap-4">
                    <div className="p-3 bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400 rounded-lg">
                        <CreditCard size={24} />
                    </div>
                    <div>
                        <p className="text-sm text-theme-muted font-medium">Total Gross Paid</p>
                        <p className="text-2xl font-bold text-theme-primary mt-1">{formatCurrency(totalGross)}</p>
                    </div>
                </div>
                <div className="bg-theme-secondary rounded-lg border border-theme p-6 shadow-theme-sm flex items-center gap-4">
                    <div className="p-3 bg-purple-100 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400 rounded-lg">
                        <CreditCard size={24} />
                    </div>
                    <div>
                        <p className="text-sm text-theme-muted font-medium">Total Net Paid</p>
                        <p className="text-2xl font-bold text-theme-primary mt-1">{formatCurrency(totalNet)}</p>
                    </div>
                </div>
            </div>

            {/* Search Bar */}
            <div className="bg-theme-secondary p-4 rounded-lg border border-theme shadow-theme-sm">
                <div className="relative w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-theme-muted w-5 h-5 pointer-events-none" />
                    <input
                        type="text"
                        placeholder="Search by run #, status, or notes..."
                        className="w-full pl-10 pr-4 py-2.5 bg-theme-primary border border-theme rounded-lg focus:ring-2 focus:ring-accent-gold/20 focus:border-accent-gold/30 outline-none transition-all text-sm text-theme-primary placeholder-theme-muted"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Runs Table */}
            <div className="bg-theme-secondary rounded-lg border border-theme shadow-theme-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-theme-primary border-b border-theme">
                                <th className="px-6 py-3 text-xs font-semibold text-theme-muted uppercase">Run #</th>
                                <th className="px-6 py-3 text-xs font-semibold text-theme-muted uppercase">Period</th>
                                <th className="px-6 py-3 text-xs font-semibold text-theme-muted uppercase">Payment Date</th>
                                <th className="px-6 py-3 text-xs font-semibold text-theme-muted uppercase">Status</th>
                                <th className="px-6 py-3 text-xs font-semibold text-theme-muted uppercase">Employees</th>
                                <th className="px-6 py-3 text-xs font-semibold text-theme-muted uppercase">Gross</th>
                                <th className="px-6 py-3 text-xs font-semibold text-theme-muted uppercase">Net</th>
                                <th className="px-6 py-3 text-xs font-semibold text-theme-muted uppercase text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-theme">
                            {loading ? (
                                Array(5).fill(0).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan="8" className="px-6 py-8">
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
                            ) : filteredRuns.length === 0 ? (
                                <tr>
                                    <td colSpan="8" className="px-6 py-16 text-center">
                                        <div className="flex flex-col items-center gap-4">
                                            <div className="w-16 h-16 bg-theme-tertiary rounded-full flex items-center justify-center text-theme-muted">
                                                <PlayCircle size={32} />
                                            </div>
                                            <div>
                                                <p className="font-semibold text-theme-primary text-lg">No payroll runs found</p>
                                                <p className="text-theme-muted text-sm mt-1">Create a new payroll run to get started.</p>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredRuns.map((run) => (
                                    <tr key={run.id} className="hover:bg-theme-primary transition-colors group">
                                        <td className="px-6 py-4">
                                            <span className="font-mono text-sm font-semibold text-theme-primary">#{run.id}</span>
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
                                        <td className="px-6 py-4 text-sm text-theme-secondary">
                                            {run.employee_count || 0}
                                        </td>
                                        <td className="px-6 py-4 text-sm font-semibold text-theme-primary">
                                            {formatCurrency(run.total_gross || 0)}
                                        </td>
                                        <td className="px-6 py-4 text-sm font-semibold text-green-600 dark:text-green-400">
                                            {formatCurrency(run.total_net || 0)}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                {/* View payslips */}
                                                <button
                                                    onClick={() => navigate(`/payroll/runs/${run.id}/payslips`)}
                                                    className="p-2 text-theme-muted hover:text-accent-gold hover:bg-accent-gold/10 rounded-lg transition"
                                                    title="View Payslips"
                                                >
                                                    <Eye size={16} />
                                                </button>

                                                {/* Process button - only for draft */}
                                                {run.status === 'draft' && (
                                                    <button
                                                        onClick={() => handleProcess(run.id)}
                                                        disabled={actionLoading === run.id}
                                                        className="p-2 text-yellow-600 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 rounded-lg transition disabled:opacity-50"
                                                        title="Process"
                                                    >
                                                        <PlayCircle size={16} />
                                                    </button>
                                                )}

                                                {/* Approve button - only for processing */}
                                                {run.status === 'processing' && (
                                                    <button
                                                        onClick={() => handleApprove(run.id)}
                                                        disabled={actionLoading === run.id}
                                                        className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition disabled:opacity-50"
                                                        title="Approve"
                                                    >
                                                        <CheckCircle size={16} />
                                                    </button>
                                                )}

                                                {/* Mark Paid button - only for approved */}
                                                {run.status === 'approved' && (
                                                    <button
                                                        onClick={() => handleMarkPaid(run.id)}
                                                        disabled={actionLoading === run.id}
                                                        className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition disabled:opacity-50"
                                                        title="Mark as Paid"
                                                    >
                                                        <CreditCard size={16} />
                                                    </button>
                                                )}

                                                {/* Cancel button - for draft, processing, or approved */}
                                                {['draft', 'processing', 'approved'].includes(run.status) && (
                                                    <button
                                                        onClick={() => handleCancel(run.id)}
                                                        disabled={actionLoading === run.id}
                                                        className="p-2 text-theme-muted hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition disabled:opacity-50"
                                                        title="Cancel Run"
                                                    >
                                                        <Ban size={16} />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Create Run Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto py-10">
                    <div className="bg-theme-secondary rounded-lg shadow-xl w-full max-w-3xl my-auto">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-theme">
                            <h2 className="text-lg font-semibold text-theme-primary">Create Payroll Run</h2>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="p-2 text-theme-muted hover:text-theme-primary hover:bg-theme-tertiary rounded-lg transition"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-5">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-theme-primary mb-1.5">Period Start</label>
                                    <input
                                        type="date"
                                        value={form.period_start}
                                        onChange={(e) => setForm({ ...form, period_start: e.target.value })}
                                        className="w-full px-3 py-2 border border-theme bg-theme-primary text-theme-primary rounded-lg focus:ring-2 focus:ring-accent-gold/20 focus:border-accent-gold outline-none"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-theme-primary mb-1.5">Period End</label>
                                    <input
                                        type="date"
                                        value={form.period_end}
                                        onChange={(e) => setForm({ ...form, period_end: e.target.value })}
                                        className="w-full px-3 py-2 border border-theme bg-theme-primary text-theme-primary rounded-lg focus:ring-2 focus:ring-accent-gold/20 focus:border-accent-gold outline-none"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-theme-primary mb-1.5">Payment Date</label>
                                <input
                                    type="date"
                                    value={form.payment_date}
                                    onChange={(e) => setForm({ ...form, payment_date: e.target.value })}
                                    className="w-full px-3 py-2 border border-theme bg-theme-primary text-theme-primary rounded-lg focus:ring-2 focus:ring-accent-gold/20 focus:border-accent-gold outline-none"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-theme-primary mb-1.5">Notes (optional)</label>
                                <textarea
                                    value={form.notes}
                                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                                    rows={3}
                                    className="w-full px-3 py-2 border border-theme bg-theme-primary text-theme-primary rounded-lg focus:ring-2 focus:ring-accent-gold/20 focus:border-accent-gold outline-none resize-none"
                                    placeholder="Optional notes for this payroll run..."
                                />
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t border-theme">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2 border border-theme text-theme-secondary rounded-lg font-medium text-sm hover:bg-theme-tertiary transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="bg-accent-gold text-white px-4 py-2 rounded-lg font-semibold text-sm hover:bg-accent-goldDark transition disabled:opacity-50"
                                >
                                    {saving ? 'Creating...' : 'Create Payroll Run'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PayrollRunsPage;
