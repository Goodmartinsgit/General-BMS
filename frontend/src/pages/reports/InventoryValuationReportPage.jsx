import React, { useState, useEffect } from 'react';
import { Package } from 'lucide-react';
import ReportLayout, { useBranches, formatCurrency } from '../../components/reports/ReportLayout';
import { financialReportsAPI } from '../../api/financialReports';
import { toast } from 'react-toastify';

const InventoryValuationReportPage = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [branchId, setBranchId] = useState('');
    const branches = useBranches();

    const fetchReport = async () => {
        setLoading(true);
        try {
            const result = await financialReportsAPI.getInventoryValuation({ branch_id: branchId || undefined });
            setData(result);
        } catch (err) {
            toast.error('Failed to load inventory valuation');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchReport(); }, [branchId]);

    const filters = (
        <div className="flex items-center gap-4">
            <label className="text-xs font-medium text-theme-muted uppercase">Branch</label>
            <select value={branchId} onChange={(e) => setBranchId(e.target.value)} className="px-3 py-2 bg-theme-primary border border-theme rounded-lg text-sm text-theme-primary focus:ring-2 focus:ring-accent-gold/20 outline-none appearance-none cursor-pointer">
                <option value="">All Branches</option>
                {branches.map(b => (<option key={b.id} value={b.id}>{b.branch_name}</option>))}
            </select>
        </div>
    );

    return (
        <ReportLayout title="Inventory Valuation" subtitle="Stock value by product" icon={Package} onRefresh={fetchReport} loading={loading} filters={filters}>
            {data && (
                <>
                    {/* Summary */}
                    <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
                        {[
                            { label: 'Total Items', value: data.summary.total_items, isNum: true },
                            { label: 'Total Units', value: data.summary.total_units.toLocaleString(), isNum: true },
                            { label: 'Cost Value', value: data.summary.total_cost_value },
                            { label: 'Retail Value', value: data.summary.total_retail_value },
                            { label: 'Potential Profit', value: data.summary.potential_profit, color: 'text-green-400' },
                        ].map((item, i) => (
                            <div key={i} className="bg-theme-secondary rounded-xl border border-theme p-4 text-center">
                                <p className="text-xs text-theme-muted uppercase">{item.label}</p>
                                <p className={`text-lg font-bold mt-1 ${item.color || 'text-theme-primary'}`}>{item.isNum ? item.value : formatCurrency(item.value)}</p>
                            </div>
                        ))}
                    </div>

                    {/* Table */}
                    <div className="bg-theme-secondary rounded-xl border border-theme shadow-theme-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-theme bg-theme-tertiary/50">
                                        <th className="text-left px-4 py-3 text-xs font-medium text-theme-muted uppercase">Product</th>
                                        <th className="text-left px-4 py-3 text-xs font-medium text-theme-muted uppercase">SKU</th>
                                        <th className="text-left px-4 py-3 text-xs font-medium text-theme-muted uppercase">Branch</th>
                                        <th className="text-right px-4 py-3 text-xs font-medium text-theme-muted uppercase">Qty</th>
                                        <th className="text-right px-4 py-3 text-xs font-medium text-theme-muted uppercase">Cost Price</th>
                                        <th className="text-right px-4 py-3 text-xs font-medium text-theme-muted uppercase">Sell Price</th>
                                        <th className="text-right px-4 py-3 text-xs font-medium text-theme-muted uppercase">Cost Value</th>
                                        <th className="text-right px-4 py-3 text-xs font-medium text-theme-muted uppercase">Retail Value</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.items.length === 0 ? (
                                        <tr><td colSpan={8} className="text-center py-8 text-theme-muted">No inventory data</td></tr>
                                    ) : data.items.map((item, i) => (
                                        <tr key={i} className="border-b border-theme hover:bg-theme-tertiary/30">
                                            <td className="px-4 py-3 text-sm font-medium text-theme-primary">{item.product_name}</td>
                                            <td className="px-4 py-3 text-sm text-theme-muted">{item.sku || '-'}</td>
                                            <td className="px-4 py-3 text-sm text-theme-secondary">{item.branch_name || '-'}</td>
                                            <td className="px-4 py-3 text-sm text-right text-theme-primary">{item.quantity_on_hand}</td>
                                            <td className="px-4 py-3 text-sm text-right text-theme-muted">{formatCurrency(item.cost_price)}</td>
                                            <td className="px-4 py-3 text-sm text-right text-theme-muted">{formatCurrency(item.selling_price)}</td>
                                            <td className="px-4 py-3 text-sm text-right text-theme-primary">{formatCurrency(item.cost_value)}</td>
                                            <td className="px-4 py-3 text-sm text-right font-medium text-accent-gold">{formatCurrency(item.retail_value)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}
        </ReportLayout>
    );
};

export default InventoryValuationReportPage;
