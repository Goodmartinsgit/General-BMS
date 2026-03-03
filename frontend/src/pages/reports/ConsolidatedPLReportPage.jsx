import React, { useState, useEffect } from 'react';
import { BarChart3 } from 'lucide-react';
import ReportLayout, { DateRangeFilter, useDefaultDates, formatCurrency } from '../../components/reports/ReportLayout';
import { financialReportsAPI } from '../../api/financialReports';
import { toast } from 'react-toastify';

const ConsolidatedPLReportPage = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [defaultStart, defaultEnd] = useDefaultDates();
    const [startDate, setStartDate] = useState(defaultStart);
    const [endDate, setEndDate] = useState(defaultEnd);

    const fetchReport = async () => {
        setLoading(true);
        try {
            const result = await financialReportsAPI.getConsolidatedPL({ start_date: startDate, end_date: endDate });
            setData(result);
        } catch (err) {
            toast.error('Failed to load consolidated P&L');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchReport(); }, [startDate, endDate]);

    return (
        <ReportLayout title="Consolidated P&L" subtitle="Multi-branch profitability comparison" icon={BarChart3} onRefresh={fetchReport} loading={loading}
            filters={<DateRangeFilter startDate={startDate} endDate={endDate} onStartChange={setStartDate} onEndChange={setEndDate} />}>
            {data && (
                <>
                    {/* Consolidated Summary */}
                    <div className="grid grid-cols-4 gap-4 mb-6">
                        {[
                            { label: 'Total Revenue', value: data.consolidated.revenue, color: 'text-green-400' },
                            { label: 'Total Expenses', value: data.consolidated.expenses, color: 'text-red-400' },
                            { label: 'Net Income', value: data.consolidated.net_income, color: data.consolidated.net_income >= 0 ? 'text-green-400' : 'text-red-400' },
                            { label: 'Net Margin', value: `${data.consolidated.margin}%`, isText: true },
                        ].map((item, i) => (
                            <div key={i} className="bg-theme-secondary rounded-xl border border-theme p-4 text-center">
                                <p className="text-xs text-theme-muted uppercase">{item.label}</p>
                                <p className={`text-lg font-bold mt-1 ${item.color || 'text-accent-gold'}`}>{item.isText ? item.value : formatCurrency(item.value)}</p>
                            </div>
                        ))}
                    </div>

                    {/* Branch Breakdown */}
                    <div className="bg-theme-secondary rounded-xl border border-theme shadow-theme-sm overflow-hidden">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-theme bg-theme-tertiary/50">
                                    <th className="text-left px-6 py-3 text-xs font-medium text-theme-muted uppercase">Branch</th>
                                    <th className="text-right px-6 py-3 text-xs font-medium text-theme-muted uppercase">Revenue</th>
                                    <th className="text-right px-6 py-3 text-xs font-medium text-theme-muted uppercase">Expenses</th>
                                    <th className="text-right px-6 py-3 text-xs font-medium text-theme-muted uppercase">Net Income</th>
                                    <th className="text-right px-6 py-3 text-xs font-medium text-theme-muted uppercase">Margin</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.branches.length === 0 ? (
                                    <tr><td colSpan={5} className="text-center py-8 text-theme-muted">No branch data available</td></tr>
                                ) : data.branches.map((branch) => (
                                    <tr key={branch.branch_id} className="border-b border-theme hover:bg-theme-tertiary/30">
                                        <td className="px-6 py-3 text-sm font-medium text-theme-primary">{branch.branch_name}</td>
                                        <td className="px-6 py-3 text-sm text-right text-green-400">{formatCurrency(branch.revenue)}</td>
                                        <td className="px-6 py-3 text-sm text-right text-red-400">{formatCurrency(branch.expenses)}</td>
                                        <td className={`px-6 py-3 text-sm text-right font-medium ${branch.net_income >= 0 ? 'text-green-400' : 'text-red-400'}`}>{formatCurrency(branch.net_income)}</td>
                                        <td className="px-6 py-3 text-sm text-right text-theme-muted">{branch.margin}%</td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot>
                                <tr className="border-t-2 border-theme bg-theme-tertiary/30">
                                    <td className="px-6 py-3 text-sm font-bold text-theme-primary">Consolidated Total</td>
                                    <td className="px-6 py-3 text-sm text-right font-bold text-green-400">{formatCurrency(data.consolidated.revenue)}</td>
                                    <td className="px-6 py-3 text-sm text-right font-bold text-red-400">{formatCurrency(data.consolidated.expenses)}</td>
                                    <td className={`px-6 py-3 text-sm text-right font-bold ${data.consolidated.net_income >= 0 ? 'text-green-400' : 'text-red-400'}`}>{formatCurrency(data.consolidated.net_income)}</td>
                                    <td className="px-6 py-3 text-sm text-right font-bold text-accent-gold">{data.consolidated.margin}%</td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </>
            )}
        </ReportLayout>
    );
};

export default ConsolidatedPLReportPage;
