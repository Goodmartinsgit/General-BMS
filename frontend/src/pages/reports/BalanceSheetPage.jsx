import React, { useState, useEffect } from 'react';
import { Scale } from 'lucide-react';
import ReportLayout, { formatCurrency } from '../../components/reports/ReportLayout';
import { financialReportsAPI } from '../../api/financialReports';
import { toast } from 'react-toastify';

const BalanceSheetPage = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [asOfDate, setAsOfDate] = useState(new Date().toISOString().split('T')[0]);

    const fetchReport = async () => {
        setLoading(true);
        try {
            const result = await financialReportsAPI.getBalanceSheet({ as_of_date: asOfDate });
            setData(result);
        } catch (err) {
            toast.error('Failed to load balance sheet');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchReport(); }, [asOfDate]);

    const filters = (
        <div className="flex items-center gap-4">
            <label className="text-xs font-medium text-theme-muted uppercase">As of Date</label>
            <input type="date" value={asOfDate} onChange={(e) => setAsOfDate(e.target.value)} className="px-3 py-2 bg-theme-primary border border-theme rounded-lg text-sm text-theme-primary focus:ring-2 focus:ring-accent-gold/20 outline-none" />
        </div>
    );

    const Section = ({ title, items, total, totalLabel }) => (
        <div className="mb-6">
            <h3 className="text-sm font-semibold text-theme-muted uppercase tracking-wider mb-3">{title}</h3>
            <div className="space-y-2">
                {items.map(([label, value], i) => (
                    <div key={i} className="flex justify-between py-2 border-b border-theme">
                        <span className="text-sm text-theme-secondary">{label}</span>
                        <span className="text-sm font-medium text-theme-primary">{formatCurrency(value)}</span>
                    </div>
                ))}
                <div className="flex justify-between py-2 border-b-2 border-theme">
                    <span className="text-sm font-semibold text-theme-primary">{totalLabel || `Total ${title}`}</span>
                    <span className="text-sm font-bold text-theme-primary">{formatCurrency(total)}</span>
                </div>
            </div>
        </div>
    );

    return (
        <ReportLayout title="Balance Sheet" subtitle={`As of ${asOfDate}`} icon={Scale} onRefresh={fetchReport} loading={loading} filters={filters}>
            {data && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-theme-secondary rounded-xl border border-theme shadow-theme-sm p-6">
                        <Section title="Assets" items={[
                            ['Cash & Bank', data.assets.current.cash_and_bank],
                            ['Accounts Receivable', data.assets.current.accounts_receivable],
                            ['Inventory', data.assets.current.inventory],
                        ]} total={data.assets.total} totalLabel="Total Assets" />
                    </div>
                    <div className="bg-theme-secondary rounded-xl border border-theme shadow-theme-sm p-6">
                        <Section title="Liabilities" items={[
                            ['Accounts Payable', data.liabilities.current.accounts_payable],
                        ]} total={data.liabilities.total} totalLabel="Total Liabilities" />
                        <Section title="Equity" items={[
                            ['Retained Earnings', data.equity.retained_earnings],
                        ]} total={data.equity.total} totalLabel="Total Equity" />
                        <div className="bg-theme-primary rounded-lg p-4 border border-theme mt-4">
                            <div className="flex justify-between items-center">
                                <span className="text-sm font-bold text-theme-primary">Total Liabilities + Equity</span>
                                <span className="text-lg font-bold text-accent-gold">{formatCurrency(data.total_liabilities_and_equity)}</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </ReportLayout>
    );
};

export default BalanceSheetPage;
