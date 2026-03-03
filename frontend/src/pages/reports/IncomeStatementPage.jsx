import React, { useState, useEffect } from 'react';
import { TrendingUp } from 'lucide-react';
import ReportLayout, { DateRangeFilter, useBranches, useDefaultDates, formatCurrency } from '../../components/reports/ReportLayout';
import { financialReportsAPI } from '../../api/financialReports';
import { toast } from 'react-toastify';

const IncomeStatementPage = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [defaultStart, defaultEnd] = useDefaultDates();
    const [startDate, setStartDate] = useState(defaultStart);
    const [endDate, setEndDate] = useState(defaultEnd);
    const [branchId, setBranchId] = useState('');
    const branches = useBranches();

    const fetchReport = async () => {
        setLoading(true);
        try {
            const result = await financialReportsAPI.getIncomeStatement({ start_date: startDate, end_date: endDate, branch_id: branchId || undefined });
            setData(result);
        } catch (err) {
            toast.error('Failed to load income statement');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchReport(); }, [startDate, endDate, branchId]);

    return (
        <ReportLayout title="Income Statement" subtitle="Profit & Loss for the selected period" icon={TrendingUp} onRefresh={fetchReport} loading={loading}
            filters={<DateRangeFilter startDate={startDate} endDate={endDate} onStartChange={setStartDate} onEndChange={setEndDate} branchId={branchId} onBranchChange={setBranchId} branches={branches} />}>
            {data && (
                <div className="bg-theme-secondary rounded-xl border border-theme shadow-theme-sm p-6 space-y-6">
                    {/* Revenue */}
                    <div>
                        <h3 className="text-sm font-semibold text-theme-muted uppercase tracking-wider mb-3">Revenue</h3>
                        <div className="space-y-2">
                            <div className="flex justify-between py-2 border-b border-theme"><span className="text-sm text-theme-secondary">Gross Revenue</span><span className="text-sm font-medium text-theme-primary">{formatCurrency(data.revenue.total_revenue)}</span></div>
                            <div className="flex justify-between py-2 border-b border-theme"><span className="text-sm text-theme-secondary">Tax Collected</span><span className="text-sm text-theme-muted">({formatCurrency(data.revenue.tax_collected)})</span></div>
                            <div className="flex justify-between py-2 border-b-2 border-theme"><span className="text-sm font-semibold text-theme-primary">Net Revenue</span><span className="text-sm font-bold text-theme-primary">{formatCurrency(data.revenue.net_revenue)}</span></div>
                        </div>
                    </div>
                    {/* COGS */}
                    <div>
                        <h3 className="text-sm font-semibold text-theme-muted uppercase tracking-wider mb-3">Cost of Goods Sold</h3>
                        <div className="flex justify-between py-2 border-b border-theme"><span className="text-sm text-theme-secondary">COGS</span><span className="text-sm text-red-400">({formatCurrency(data.cost_of_goods_sold)})</span></div>
                        <div className="flex justify-between py-2 border-b-2 border-theme"><span className="text-sm font-semibold text-theme-primary">Gross Profit</span><span className={`text-sm font-bold ${data.gross_profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>{formatCurrency(data.gross_profit)}</span></div>
                        <div className="text-xs text-theme-muted mt-1">Gross Margin: {data.gross_margin}%</div>
                    </div>
                    {/* Expenses */}
                    <div>
                        <h3 className="text-sm font-semibold text-theme-muted uppercase tracking-wider mb-3">Operating Expenses</h3>
                        <div className="space-y-2">
                            {data.expenses.by_category.map((cat, i) => (
                                <div key={i} className="flex justify-between py-2 border-b border-theme"><span className="text-sm text-theme-secondary">{cat.category}</span><span className="text-sm text-red-400">({formatCurrency(cat.amount)})</span></div>
                            ))}
                            <div className="flex justify-between py-2 border-b-2 border-theme"><span className="text-sm font-semibold text-theme-primary">Total Expenses</span><span className="text-sm font-bold text-red-400">({formatCurrency(data.expenses.total)})</span></div>
                        </div>
                    </div>
                    {/* Net Income */}
                    <div className="bg-theme-primary rounded-lg p-4 border border-theme">
                        <div className="flex justify-between items-center">
                            <span className="text-lg font-bold text-theme-primary">Net Income</span>
                            <span className={`text-xl font-bold ${data.net_income >= 0 ? 'text-green-400' : 'text-red-400'}`}>{formatCurrency(data.net_income)}</span>
                        </div>
                        <p className="text-xs text-theme-muted mt-1">Net Margin: {data.net_margin}% | Transactions: {data.revenue.total_transactions}</p>
                    </div>
                </div>
            )}
        </ReportLayout>
    );
};

export default IncomeStatementPage;
