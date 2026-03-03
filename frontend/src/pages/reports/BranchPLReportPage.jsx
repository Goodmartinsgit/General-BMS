import React, { useState, useEffect } from 'react';
import { Building2 } from 'lucide-react';
import ReportLayout, { DateRangeFilter, useBranches, useDefaultDates, formatCurrency } from '../../components/reports/ReportLayout';
import { financialReportsAPI } from '../../api/financialReports';
import { toast } from 'react-toastify';

const BranchPLReportPage = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [defaultStart, defaultEnd] = useDefaultDates();
    const [startDate, setStartDate] = useState(defaultStart);
    const [endDate, setEndDate] = useState(defaultEnd);
    const [branchId, setBranchId] = useState('');
    const branches = useBranches();

    const fetchReport = async () => {
        if (!branchId) { setData(null); setLoading(false); return; }
        setLoading(true);
        try {
            const result = await financialReportsAPI.getBranchPL(branchId, { start_date: startDate, end_date: endDate });
            setData(result);
        } catch (err) {
            toast.error('Failed to load branch P&L');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchReport(); }, [startDate, endDate, branchId]);

    const selectedBranch = branches.find(b => String(b.id) === String(branchId));

    return (
        <ReportLayout title="Branch P&L" subtitle={selectedBranch ? `Profit & Loss for ${selectedBranch.branch_name}` : 'Select a branch'} icon={Building2} onRefresh={fetchReport} loading={loading}
            filters={<DateRangeFilter startDate={startDate} endDate={endDate} onStartChange={setStartDate} onEndChange={setEndDate} branchId={branchId} onBranchChange={setBranchId} branches={branches} />}>
            {!branchId && (
                <div className="bg-theme-secondary rounded-xl border border-theme p-12 text-center">
                    <Building2 size={48} className="mx-auto text-theme-muted mb-4" />
                    <p className="text-theme-muted">Select a branch from the filter above to view its P&L statement</p>
                </div>
            )}
            {data && branchId && (
                <div className="bg-theme-secondary rounded-xl border border-theme shadow-theme-sm p-6 space-y-6">
                    <div>
                        <h3 className="text-sm font-semibold text-theme-muted uppercase tracking-wider mb-3">Revenue</h3>
                        <div className="flex justify-between py-2 border-b border-theme"><span className="text-sm text-theme-secondary">Net Revenue</span><span className="text-sm font-medium text-theme-primary">{formatCurrency(data.revenue?.net_revenue)}</span></div>
                    </div>
                    <div>
                        <h3 className="text-sm font-semibold text-theme-muted uppercase tracking-wider mb-3">Cost of Goods Sold</h3>
                        <div className="flex justify-between py-2 border-b border-theme"><span className="text-sm text-theme-secondary">COGS</span><span className="text-sm text-red-400">({formatCurrency(data.cost_of_goods_sold)})</span></div>
                        <div className="flex justify-between py-2 border-b-2 border-theme"><span className="text-sm font-semibold text-theme-primary">Gross Profit</span><span className={`text-sm font-bold ${data.gross_profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>{formatCurrency(data.gross_profit)}</span></div>
                    </div>
                    <div>
                        <h3 className="text-sm font-semibold text-theme-muted uppercase tracking-wider mb-3">Expenses</h3>
                        {data.expenses?.by_category?.map((cat, i) => (
                            <div key={i} className="flex justify-between py-2 border-b border-theme"><span className="text-sm text-theme-secondary">{cat.category}</span><span className="text-sm text-red-400">({formatCurrency(cat.amount)})</span></div>
                        ))}
                        <div className="flex justify-between py-2 border-b-2 border-theme"><span className="text-sm font-semibold text-theme-primary">Total Expenses</span><span className="text-sm font-bold text-red-400">({formatCurrency(data.expenses?.total)})</span></div>
                    </div>
                    <div className="bg-theme-primary rounded-lg p-4 border border-theme">
                        <div className="flex justify-between items-center">
                            <span className="text-lg font-bold text-theme-primary">Net Income</span>
                            <span className={`text-xl font-bold ${data.net_income >= 0 ? 'text-green-400' : 'text-red-400'}`}>{formatCurrency(data.net_income)}</span>
                        </div>
                        <p className="text-xs text-theme-muted mt-1">Net Margin: {data.net_margin}%</p>
                    </div>
                </div>
            )}
        </ReportLayout>
    );
};

export default BranchPLReportPage;
