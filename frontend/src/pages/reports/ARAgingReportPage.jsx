import React, { useState, useEffect } from 'react';
import { Users } from 'lucide-react';
import ReportLayout, { formatCurrency } from '../../components/reports/ReportLayout';
import { financialReportsAPI } from '../../api/financialReports';
import { toast } from 'react-toastify';

const bucketLabels = [
    { key: 'current', label: 'Current', color: 'text-green-400 bg-green-500/10' },
    { key: '1_30_days', label: '1-30 Days', color: 'text-blue-400 bg-blue-500/10' },
    { key: '31_60_days', label: '31-60 Days', color: 'text-yellow-400 bg-yellow-500/10' },
    { key: '61_90_days', label: '61-90 Days', color: 'text-orange-400 bg-orange-500/10' },
    { key: 'over_90_days', label: '90+ Days', color: 'text-red-400 bg-red-500/10' },
];

const ARAgingReportPage = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchReport = async () => {
        setLoading(true);
        try {
            const result = await financialReportsAPI.getARAging();
            setData(result);
        } catch (err) {
            toast.error('Failed to load AR aging report');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchReport(); }, []);

    return (
        <ReportLayout title="Accounts Receivable Aging" subtitle="Customer outstanding balances by age" icon={Users} onRefresh={fetchReport} loading={loading}>
            {data && (
                <>
                    {/* Buckets Summary */}
                    <div className="grid grid-cols-2 lg:grid-cols-6 gap-4 mb-6">
                        {bucketLabels.map(({ key, label, color }) => (
                            <div key={key} className="bg-theme-secondary rounded-xl border border-theme p-4 text-center">
                                <p className="text-xs text-theme-muted uppercase">{label}</p>
                                <p className={`text-lg font-bold mt-1 ${color.split(' ')[0]}`}>{formatCurrency(data.summary[key])}</p>
                            </div>
                        ))}
                        <div className="bg-theme-secondary rounded-xl border border-theme p-4 text-center">
                            <p className="text-xs text-theme-muted uppercase">Total</p>
                            <p className="text-lg font-bold mt-1 text-accent-gold">{formatCurrency(data.summary.total)}</p>
                        </div>
                    </div>

                    {/* Detail by bucket */}
                    {bucketLabels.map(({ key, label }) => {
                        const bucketKey = key === 'current' ? 'current' : key.replace('_days', '');
                        const items = data.buckets[bucketKey] || [];
                        if (items.length === 0) return null;
                        return (
                            <div key={key} className="bg-theme-secondary rounded-xl border border-theme shadow-theme-sm overflow-hidden mb-4">
                                <div className="px-6 py-3 bg-theme-tertiary/50 border-b border-theme">
                                    <h3 className="text-sm font-semibold text-theme-primary">{label} ({items.length} invoices)</h3>
                                </div>
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b border-theme">
                                            <th className="text-left px-4 py-2 text-xs font-medium text-theme-muted uppercase">Customer</th>
                                            <th className="text-left px-4 py-2 text-xs font-medium text-theme-muted uppercase">Invoice</th>
                                            <th className="text-left px-4 py-2 text-xs font-medium text-theme-muted uppercase">Date</th>
                                            <th className="text-right px-4 py-2 text-xs font-medium text-theme-muted uppercase">Total</th>
                                            <th className="text-right px-4 py-2 text-xs font-medium text-theme-muted uppercase">Paid</th>
                                            <th className="text-right px-4 py-2 text-xs font-medium text-theme-muted uppercase">Outstanding</th>
                                            <th className="text-right px-4 py-2 text-xs font-medium text-theme-muted uppercase">Days</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {items.map((item, i) => (
                                            <tr key={i} className="border-b border-theme hover:bg-theme-tertiary/30">
                                                <td className="px-4 py-2 text-sm text-theme-primary">{item.customer_name}</td>
                                                <td className="px-4 py-2 text-sm text-accent-gold">{item.sale_number}</td>
                                                <td className="px-4 py-2 text-sm text-theme-muted">{new Date(item.sale_date).toLocaleDateString()}</td>
                                                <td className="px-4 py-2 text-sm text-right text-theme-primary">{formatCurrency(item.total_amount)}</td>
                                                <td className="px-4 py-2 text-sm text-right text-green-400">{formatCurrency(item.paid_amount)}</td>
                                                <td className="px-4 py-2 text-sm text-right font-medium text-red-400">{formatCurrency(item.outstanding)}</td>
                                                <td className="px-4 py-2 text-sm text-right text-theme-muted">{Math.round(item.days_outstanding)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        );
                    })}

                    {data.summary.total === 0 && (
                        <div className="bg-theme-secondary rounded-xl border border-theme p-12 text-center">
                            <p className="text-theme-muted">No outstanding receivables found</p>
                        </div>
                    )}
                </>
            )}
        </ReportLayout>
    );
};

export default ARAgingReportPage;
