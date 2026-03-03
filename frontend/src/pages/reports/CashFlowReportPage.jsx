import React, { useState, useEffect } from 'react';
import { PieChart } from 'lucide-react';
import ReportLayout, { DateRangeFilter, useDefaultDates, formatCurrency } from '../../components/reports/ReportLayout';
import { financialReportsAPI } from '../../api/financialReports';
import { toast } from 'react-toastify';

const CashFlowReportPage = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [defaultStart, defaultEnd] = useDefaultDates();
    const [startDate, setStartDate] = useState(defaultStart);
    const [endDate, setEndDate] = useState(defaultEnd);

    const fetchReport = async () => {
        setLoading(true);
        try {
            const result = await financialReportsAPI.getCashFlow({ start_date: startDate, end_date: endDate });
            setData(result);
        } catch (err) {
            toast.error('Failed to load cash flow report');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchReport(); }, [startDate, endDate]);

    return (
        <ReportLayout title="Cash Flow Statement" subtitle="Cash inflows and outflows" icon={PieChart} onRefresh={fetchReport} loading={loading}
            filters={<DateRangeFilter startDate={startDate} endDate={endDate} onStartChange={setStartDate} onEndChange={setEndDate} />}>
            {data && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Inflows */}
                    <div className="bg-theme-secondary rounded-xl border border-theme shadow-theme-sm p-6">
                        <h3 className="text-sm font-semibold text-green-400 uppercase tracking-wider mb-4">Cash Inflows</h3>
                        <div className="space-y-2">
                            {data.operating.inflows.by_method.map((m, i) => (
                                <div key={i} className="flex justify-between py-2 border-b border-theme">
                                    <span className="text-sm text-theme-secondary capitalize">{m.method || 'Other'}</span>
                                    <span className="text-sm font-medium text-green-400">{formatCurrency(m.amount)}</span>
                                </div>
                            ))}
                            <div className="flex justify-between py-2 border-t-2 border-theme">
                                <span className="text-sm font-semibold text-theme-primary">Total Inflows</span>
                                <span className="text-sm font-bold text-green-400">{formatCurrency(data.operating.inflows.total)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Outflows */}
                    <div className="bg-theme-secondary rounded-xl border border-theme shadow-theme-sm p-6">
                        <h3 className="text-sm font-semibold text-red-400 uppercase tracking-wider mb-4">Cash Outflows</h3>
                        <div className="space-y-2">
                            {data.operating.outflows.payments.map((m, i) => (
                                <div key={i} className="flex justify-between py-2 border-b border-theme">
                                    <span className="text-sm text-theme-secondary capitalize">{m.method || 'Other'}</span>
                                    <span className="text-sm font-medium text-red-400">{formatCurrency(m.amount)}</span>
                                </div>
                            ))}
                            <div className="flex justify-between py-2 border-b border-theme">
                                <span className="text-sm text-theme-secondary">Operating Expenses</span>
                                <span className="text-sm font-medium text-red-400">{formatCurrency(data.operating.outflows.expenses)}</span>
                            </div>
                            <div className="flex justify-between py-2 border-t-2 border-theme">
                                <span className="text-sm font-semibold text-theme-primary">Total Outflows</span>
                                <span className="text-sm font-bold text-red-400">{formatCurrency(data.operating.outflows.total)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Net */}
                    <div className="bg-theme-secondary rounded-xl border border-theme shadow-theme-sm p-6 flex flex-col justify-center">
                        <div className="text-center">
                            <p className="text-sm text-theme-muted uppercase tracking-wider mb-2">Net Cash Flow</p>
                            <p className={`text-3xl font-bold ${data.net_cash_flow >= 0 ? 'text-green-400' : 'text-red-400'}`}>{formatCurrency(data.net_cash_flow)}</p>
                            <p className="text-xs text-theme-muted mt-2">{data.net_cash_flow >= 0 ? 'Positive cash position' : 'Negative cash position'}</p>
                        </div>
                    </div>
                </div>
            )}
        </ReportLayout>
    );
};

export default CashFlowReportPage;
