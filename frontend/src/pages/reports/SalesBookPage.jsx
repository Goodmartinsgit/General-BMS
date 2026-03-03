import React, { useState, useEffect } from 'react';
import { BookOpen, ChevronLeft, ChevronRight } from 'lucide-react';
import ReportLayout, { DateRangeFilter, useBranches, useDefaultDates, formatCurrency } from '../../components/reports/ReportLayout';
import { financialReportsAPI } from '../../api/financialReports';
import { toast } from 'react-toastify';

const SalesBookPage = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [defaultStart, defaultEnd] = useDefaultDates();
    const [startDate, setStartDate] = useState(defaultStart);
    const [endDate, setEndDate] = useState(defaultEnd);
    const [branchId, setBranchId] = useState('');
    const [page, setPage] = useState(1);
    const branches = useBranches();

    const fetchReport = async () => {
        setLoading(true);
        try {
            const result = await financialReportsAPI.getSalesBook({ start_date: startDate, end_date: endDate, branch_id: branchId || undefined, page, limit: 50 });
            setData(result);
        } catch (err) {
            toast.error('Failed to load sales book');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchReport(); }, [startDate, endDate, branchId, page]);

    return (
        <ReportLayout title="Sales Book" subtitle="Detailed sales transaction ledger" icon={BookOpen} onRefresh={fetchReport} loading={loading}
            filters={<DateRangeFilter startDate={startDate} endDate={endDate} onStartChange={setStartDate} onEndChange={setEndDate} branchId={branchId} onBranchChange={setBranchId} branches={branches} />}>
            {data && (
                <>
                    {/* Totals Summary */}
                    <div className="grid grid-cols-3 gap-4 mb-6">
                        {[
                            { label: 'Subtotal', value: data.totals.subtotal },
                            { label: 'Tax', value: data.totals.tax },
                            { label: 'Total', value: data.totals.total },
                        ].map((item, i) => (
                            <div key={i} className="bg-theme-secondary rounded-xl border border-theme p-4 text-center">
                                <p className="text-xs text-theme-muted uppercase">{item.label}</p>
                                <p className="text-lg font-bold text-theme-primary mt-1">{formatCurrency(item.value)}</p>
                            </div>
                        ))}
                    </div>

                    {/* Table */}
                    <div className="bg-theme-secondary rounded-xl border border-theme shadow-theme-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-theme bg-theme-tertiary/50">
                                        <th className="text-left px-4 py-3 text-xs font-medium text-theme-muted uppercase">Sale #</th>
                                        <th className="text-left px-4 py-3 text-xs font-medium text-theme-muted uppercase">Date</th>
                                        <th className="text-left px-4 py-3 text-xs font-medium text-theme-muted uppercase">Customer</th>
                                        <th className="text-left px-4 py-3 text-xs font-medium text-theme-muted uppercase">Branch</th>
                                        <th className="text-left px-4 py-3 text-xs font-medium text-theme-muted uppercase">Cashier</th>
                                        <th className="text-left px-4 py-3 text-xs font-medium text-theme-muted uppercase">Payment</th>
                                        <th className="text-right px-4 py-3 text-xs font-medium text-theme-muted uppercase">Subtotal</th>
                                        <th className="text-right px-4 py-3 text-xs font-medium text-theme-muted uppercase">Tax</th>
                                        <th className="text-right px-4 py-3 text-xs font-medium text-theme-muted uppercase">Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.sales.length === 0 ? (
                                        <tr><td colSpan={9} className="text-center py-8 text-theme-muted">No sales found for this period</td></tr>
                                    ) : data.sales.map((sale) => (
                                        <tr key={sale.id} className="border-b border-theme hover:bg-theme-tertiary/30">
                                            <td className="px-4 py-3 text-sm font-medium text-accent-gold">{sale.sale_number}</td>
                                            <td className="px-4 py-3 text-sm text-theme-secondary">{new Date(sale.sale_date).toLocaleDateString()}</td>
                                            <td className="px-4 py-3 text-sm text-theme-secondary">{sale.customer_name || 'Walk-in'}</td>
                                            <td className="px-4 py-3 text-sm text-theme-secondary">{sale.branch_name || '-'}</td>
                                            <td className="px-4 py-3 text-sm text-theme-secondary">{sale.cashier_name || '-'}</td>
                                            <td className="px-4 py-3 text-sm text-theme-secondary capitalize">{sale.payment_method || '-'}</td>
                                            <td className="px-4 py-3 text-sm text-right text-theme-primary">{formatCurrency(sale.subtotal)}</td>
                                            <td className="px-4 py-3 text-sm text-right text-theme-muted">{formatCurrency(sale.tax_amount)}</td>
                                            <td className="px-4 py-3 text-sm text-right font-medium text-theme-primary">{formatCurrency(sale.total_amount)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {data.pagination.pages > 1 && (
                            <div className="flex items-center justify-between px-4 py-3 border-t border-theme">
                                <span className="text-xs text-theme-muted">Page {data.pagination.page} of {data.pagination.pages} ({data.pagination.total} records)</span>
                                <div className="flex gap-2">
                                    <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1} className="p-1.5 rounded border border-theme text-theme-muted hover:text-theme-primary disabled:opacity-30"><ChevronLeft size={16} /></button>
                                    <button onClick={() => setPage(p => Math.min(data.pagination.pages, p + 1))} disabled={page >= data.pagination.pages} className="p-1.5 rounded border border-theme text-theme-muted hover:text-theme-primary disabled:opacity-30"><ChevronRight size={16} /></button>
                                </div>
                            </div>
                        )}
                    </div>
                </>
            )}
        </ReportLayout>
    );
};

export default SalesBookPage;
