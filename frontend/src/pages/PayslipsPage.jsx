import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import {
    FileText,
    Search,
    X,
    Calendar,
    DollarSign,
    User,
    Download,
    ArrowLeft,
    Minus,
    Plus as PlusIcon
} from 'lucide-react';
import { format } from 'date-fns';
import { useParams, useNavigate } from 'react-router-dom';
import PageHeader from '../components/common/PageHeader';
import { useAuth } from '../context/AuthContext';
import { useCurrency } from '../context/CurrencyContext';

const PayslipsPage = () => {
    const { formatCurrency } = useCurrency();
    const { auth } = useAuth();
    const { runId } = useParams();
    const navigate = useNavigate();
    const [payslips, setPayslips] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedPayslip, setSelectedPayslip] = useState(null);
    const [isDetailOpen, setIsDetailOpen] = useState(false);

    const userPerms = auth?.user?.permissions || {};
    const isAdmin = userPerms['manage_payroll'] === true || userPerms['admin'] === true;

    useEffect(() => {
        fetchPayslips();
    }, [runId]);

    const fetchPayslips = async () => {
        try {
            setLoading(true);
            let response;
            if (runId) {
                response = await api.get(`/payroll/runs/${runId}/payslips`);
            } else if (isAdmin) {
                response = await api.get('/payroll/payslips');
            } else {
                response = await api.get('/payroll/my-payslips');
            }
            setPayslips(response.data || []);
        } catch (error) {
            console.error('Error fetching payslips:', error);
        } finally {
            setLoading(false);
        }
    };

    const viewDetail = (payslip) => {
        setSelectedPayslip(payslip);
        setIsDetailOpen(true);
    };

    const getStatusBadge = (status) => {
        const map = {
            draft: 'bg-gray-100 text-gray-700 dark:bg-gray-700/30 dark:text-gray-300',
            processed: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-300',
            approved: 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300',
            paid: 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-300',
            cancelled: 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-300'
        };
        return map[status] || 'bg-gray-100 text-gray-700 dark:bg-gray-700/30 dark:text-gray-300';
    };

    const filteredPayslips = payslips.filter(p =>
        p.employee_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.status?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const totalGross = payslips.reduce((sum, p) => sum + parseFloat(p.gross_pay || 0), 0);
    const totalDeductions = payslips.reduce((sum, p) => sum + parseFloat(p.total_deductions || 0), 0);
    const totalNet = payslips.reduce((sum, p) => sum + parseFloat(p.net_pay || 0), 0);

    const pageTitle = runId ? `Payslips - Run #${runId}` : (isAdmin ? 'All Payslips' : 'My Payslips');
    const pageSubtitle = runId
        ? 'View payslips generated for this payroll run'
        : (isAdmin ? 'View all employee payslips' : 'View your payslip history');

    const actions = runId ? (
        <button
            onClick={() => navigate('/payroll/runs')}
            className="bg-theme-secondary border border-theme text-theme-secondary px-4 py-2 rounded-lg font-medium text-sm hover:bg-theme-tertiary transition flex items-center gap-2"
        >
            <ArrowLeft size={16} /> Back to Runs
        </button>
    ) : null;

    return (
        <div className="space-y-6 max-w-[1700px] mx-auto pb-10">
            <PageHeader
                title={pageTitle}
                subtitle={pageSubtitle}
                badge={`${payslips.length} Payslips`}
                icon={FileText}
                actions={actions}
            />

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-theme-secondary rounded-lg border border-theme p-6 shadow-theme-sm flex items-center gap-4">
                    <div className="p-3 bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 rounded-lg">
                        <PlusIcon size={24} />
                    </div>
                    <div>
                        <p className="text-sm text-theme-muted font-medium">Total Gross</p>
                        <p className="text-2xl font-bold text-theme-primary mt-1">{formatCurrency(totalGross)}</p>
                    </div>
                </div>
                <div className="bg-theme-secondary rounded-lg border border-theme p-6 shadow-theme-sm flex items-center gap-4">
                    <div className="p-3 bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400 rounded-lg">
                        <Minus size={24} />
                    </div>
                    <div>
                        <p className="text-sm text-theme-muted font-medium">Total Deductions</p>
                        <p className="text-2xl font-bold text-theme-primary mt-1">{formatCurrency(totalDeductions)}</p>
                    </div>
                </div>
                <div className="bg-theme-secondary rounded-lg border border-theme p-6 shadow-theme-sm flex items-center gap-4">
                    <div className="p-3 bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400 rounded-lg">
                        <DollarSign size={24} />
                    </div>
                    <div>
                        <p className="text-sm text-theme-muted font-medium">Total Net Pay</p>
                        <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">{formatCurrency(totalNet)}</p>
                    </div>
                </div>
            </div>

            {/* Search Bar */}
            <div className="bg-theme-secondary p-4 rounded-lg border border-theme shadow-theme-sm">
                <div className="relative w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-theme-muted w-5 h-5 pointer-events-none" />
                    <input
                        type="text"
                        placeholder="Search by employee name or status..."
                        className="w-full pl-10 pr-4 py-2.5 bg-theme-primary border border-theme rounded-lg focus:ring-2 focus:ring-accent-gold/20 focus:border-accent-gold/30 outline-none transition-all text-sm text-theme-primary placeholder-theme-muted"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Payslips Table */}
            <div className="bg-theme-secondary rounded-lg border border-theme shadow-theme-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-theme-primary border-b border-theme">
                                <th className="px-6 py-3 text-xs font-semibold text-theme-muted uppercase">Employee</th>
                                <th className="px-6 py-3 text-xs font-semibold text-theme-muted uppercase">Period</th>
                                <th className="px-6 py-3 text-xs font-semibold text-theme-muted uppercase">Gross Pay</th>
                                <th className="px-6 py-3 text-xs font-semibold text-theme-muted uppercase">Deductions</th>
                                <th className="px-6 py-3 text-xs font-semibold text-theme-muted uppercase">Net Pay</th>
                                <th className="px-6 py-3 text-xs font-semibold text-theme-muted uppercase">Status</th>
                                <th className="px-6 py-3 text-xs font-semibold text-theme-muted uppercase text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-theme">
                            {loading ? (
                                Array(5).fill(0).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan="7" className="px-6 py-8">
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
                            ) : filteredPayslips.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="px-6 py-16 text-center">
                                        <div className="flex flex-col items-center gap-4">
                                            <div className="w-16 h-16 bg-theme-tertiary rounded-full flex items-center justify-center text-theme-muted">
                                                <FileText size={32} />
                                            </div>
                                            <div>
                                                <p className="font-semibold text-theme-primary text-lg">No payslips found</p>
                                                <p className="text-theme-muted text-sm mt-1">
                                                    {runId ? 'Process the payroll run to generate payslips.' : 'Payslips will appear here after payroll runs are processed.'}
                                                </p>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredPayslips.map((payslip) => (
                                    <tr
                                        key={payslip.id}
                                        className="hover:bg-theme-primary transition-colors cursor-pointer group"
                                        onClick={() => viewDetail(payslip)}
                                    >
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 rounded-lg flex items-center justify-center">
                                                    <User size={20} />
                                                </div>
                                                <div>
                                                    <div className="font-semibold text-theme-primary text-sm">
                                                        {payslip.employee_name || payslip.user_name || 'Unknown'}
                                                    </div>
                                                    <div className="text-xs text-theme-muted mt-0.5">
                                                        {payslip.email || ''}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2 text-sm text-theme-secondary">
                                                <Calendar size={14} className="text-theme-muted" />
                                                {payslip.period_start && payslip.period_end
                                                    ? `${format(new Date(payslip.period_start), 'dd MMM')} - ${format(new Date(payslip.period_end), 'dd MMM yyyy')}`
                                                    : 'N/A'
                                                }
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm font-semibold text-theme-primary">
                                            {formatCurrency(payslip.gross_pay || 0)}
                                        </td>
                                        <td className="px-6 py-4 text-sm font-medium text-red-600 dark:text-red-400">
                                            -{formatCurrency(payslip.total_deductions || 0)}
                                        </td>
                                        <td className="px-6 py-4 text-sm font-semibold text-green-600 dark:text-green-400">
                                            {formatCurrency(payslip.net_pay || 0)}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-block text-xs font-medium px-2.5 py-1 rounded-full ${getStatusBadge(payslip.status)}`}>
                                                {payslip.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={(e) => { e.stopPropagation(); viewDetail(payslip); }}
                                                className="p-2 text-theme-muted hover:text-accent-gold hover:bg-accent-gold/10 rounded-lg transition"
                                                title="View Detail"
                                            >
                                                <FileText size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Payslip Detail Modal */}
            {isDetailOpen && selectedPayslip && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto py-10">
                    <div className="bg-theme-secondary rounded-lg shadow-xl w-full max-w-3xl my-auto">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-theme">
                            <h2 className="text-lg font-semibold text-theme-primary">Payslip Detail</h2>
                            <button
                                onClick={() => setIsDetailOpen(false)}
                                className="p-2 text-theme-muted hover:text-theme-primary hover:bg-theme-tertiary rounded-lg transition"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-6 space-y-6">
                            {/* Employee Info */}
                            <div className="flex items-center gap-4 pb-4 border-b border-theme">
                                <div className="w-12 h-12 bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 rounded-lg flex items-center justify-center">
                                    <User size={24} />
                                </div>
                                <div>
                                    <p className="font-semibold text-theme-primary text-lg">
                                        {selectedPayslip.employee_name || selectedPayslip.user_name || 'Unknown'}
                                    </p>
                                    <p className="text-sm text-theme-muted">
                                        {selectedPayslip.period_start && selectedPayslip.period_end
                                            ? `${format(new Date(selectedPayslip.period_start), 'dd MMM yyyy')} - ${format(new Date(selectedPayslip.period_end), 'dd MMM yyyy')}`
                                            : 'N/A'
                                        }
                                    </p>
                                </div>
                                <div className="ml-auto">
                                    <span className={`inline-block text-xs font-medium px-3 py-1.5 rounded-full ${getStatusBadge(selectedPayslip.status)}`}>
                                        {selectedPayslip.status}
                                    </span>
                                </div>
                            </div>

                            {/* Earnings */}
                            <div>
                                <h3 className="text-sm font-semibold text-theme-primary uppercase tracking-wide mb-3 flex items-center gap-2">
                                    <PlusIcon size={16} className="text-green-500" /> Earnings
                                </h3>
                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-theme-secondary">Basic Salary</span>
                                        <span className="font-medium text-theme-primary">{formatCurrency(selectedPayslip.basic_salary || 0)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-theme-secondary">Housing Allowance</span>
                                        <span className="font-medium text-theme-primary">{formatCurrency(selectedPayslip.housing_allowance || 0)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-theme-secondary">Transport Allowance</span>
                                        <span className="font-medium text-theme-primary">{formatCurrency(selectedPayslip.transport_allowance || 0)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-theme-secondary">Other Allowances</span>
                                        <span className="font-medium text-theme-primary">{formatCurrency(selectedPayslip.other_allowances || 0)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm pt-2 border-t border-theme font-semibold">
                                        <span className="text-theme-primary">Gross Pay</span>
                                        <span className="text-theme-primary">{formatCurrency(selectedPayslip.gross_pay || 0)}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Deductions */}
                            <div>
                                <h3 className="text-sm font-semibold text-theme-primary uppercase tracking-wide mb-3 flex items-center gap-2">
                                    <Minus size={16} className="text-red-500" /> Deductions
                                </h3>
                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-theme-secondary">Employee Pension</span>
                                        <span className="font-medium text-red-600 dark:text-red-400">-{formatCurrency(selectedPayslip.pension_employee || 0)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-theme-secondary">Tax (PAYE)</span>
                                        <span className="font-medium text-red-600 dark:text-red-400">-{formatCurrency(selectedPayslip.tax_amount || 0)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-theme-secondary">Loan Deduction</span>
                                        <span className="font-medium text-red-600 dark:text-red-400">-{formatCurrency(selectedPayslip.loan_deduction || 0)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-theme-secondary">Other Deductions</span>
                                        <span className="font-medium text-red-600 dark:text-red-400">-{formatCurrency(selectedPayslip.other_deductions || 0)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm pt-2 border-t border-theme font-semibold">
                                        <span className="text-theme-primary">Total Deductions</span>
                                        <span className="text-red-600 dark:text-red-400">-{formatCurrency(selectedPayslip.total_deductions || 0)}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Net Pay */}
                            <div className="bg-green-50 dark:bg-green-900/10 rounded-lg p-4 border border-green-200 dark:border-green-800/30">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <p className="text-sm font-medium text-green-700 dark:text-green-300">Net Pay</p>
                                        <p className="text-xs text-green-600 dark:text-green-400 mt-0.5">Amount payable to employee</p>
                                    </div>
                                    <p className="text-2xl font-bold text-green-700 dark:text-green-300">
                                        {formatCurrency(selectedPayslip.net_pay || 0)}
                                    </p>
                                </div>
                            </div>

                            {/* Employer Pension Note */}
                            {selectedPayslip.pension_employer > 0 && (
                                <div className="bg-blue-50 dark:bg-blue-900/10 rounded-lg p-3 border border-blue-200 dark:border-blue-800/30">
                                    <p className="text-xs text-blue-700 dark:text-blue-300">
                                        <strong>Employer Pension Contribution:</strong> {formatCurrency(selectedPayslip.pension_employer || 0)}
                                        <span className="text-blue-500 dark:text-blue-400 ml-1">(not deducted from employee pay)</span>
                                    </p>
                                </div>
                            )}
                        </div>

                        <div className="flex justify-end gap-3 px-6 py-4 border-t border-theme">
                            <button
                                onClick={() => setIsDetailOpen(false)}
                                className="px-4 py-2 border border-theme text-theme-secondary rounded-lg font-medium text-sm hover:bg-theme-tertiary transition"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PayslipsPage;
