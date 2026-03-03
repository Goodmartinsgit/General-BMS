import React, { useState, useEffect } from 'react';
import { Calculator } from 'lucide-react';
import ReportLayout, { DateRangeFilter, useDefaultDates, formatCurrency } from '../../components/reports/ReportLayout';
import { financialReportsAPI } from '../../api/financialReports';
import { toast } from 'react-toastify';

const TrialBalancePage = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [defaultStart, defaultEnd] = useDefaultDates();
    const [startDate, setStartDate] = useState(defaultStart);
    const [endDate, setEndDate] = useState(defaultEnd);

    const fetchReport = async () => {
        setLoading(true);
        try {
            const result = await financialReportsAPI.getTrialBalance({ start_date: startDate, end_date: endDate });
            setData(result);
        } catch (err) {
            toast.error('Failed to load trial balance');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchReport(); }, [startDate, endDate]);

    return (
        <ReportLayout title="Trial Balance" subtitle="Debit and credit verification" icon={Calculator} onRefresh={fetchReport} loading={loading}
            filters={<DateRangeFilter startDate={startDate} endDate={endDate} onStartChange={setStartDate} onEndChange={setEndDate} />}>
            {data && (
                <div className="bg-theme-secondary rounded-xl border border-theme shadow-theme-sm overflow-hidden">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-theme bg-theme-tertiary/50">
                                <th className="text-left px-6 py-3 text-xs font-medium text-theme-muted uppercase">Account</th>
                                <th className="text-right px-6 py-3 text-xs font-medium text-theme-muted uppercase">Debit</th>
                                <th className="text-right px-6 py-3 text-xs font-medium text-theme-muted uppercase">Credit</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.accounts.map((acc, i) => (
                                <tr key={i} className="border-b border-theme hover:bg-theme-tertiary/30">
                                    <td className="px-6 py-3 text-sm text-theme-primary">{acc.account}</td>
                                    <td className="px-6 py-3 text-sm text-right font-medium text-theme-primary">{acc.debit > 0 ? formatCurrency(acc.debit) : '-'}</td>
                                    <td className="px-6 py-3 text-sm text-right font-medium text-theme-primary">{acc.credit > 0 ? formatCurrency(acc.credit) : '-'}</td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot>
                            <tr className="border-t-2 border-theme bg-theme-tertiary/30">
                                <td className="px-6 py-3 text-sm font-bold text-theme-primary">Totals</td>
                                <td className="px-6 py-3 text-sm text-right font-bold text-theme-primary">{formatCurrency(data.totals.debits)}</td>
                                <td className="px-6 py-3 text-sm text-right font-bold text-theme-primary">{formatCurrency(data.totals.credits)}</td>
                            </tr>
                            <tr>
                                <td colSpan={3} className="px-6 py-2">
                                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${data.totals.balanced ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                                        {data.totals.balanced ? 'Balanced' : 'Not Balanced'}
                                    </span>
                                </td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            )}
        </ReportLayout>
    );
};

export default TrialBalancePage;
