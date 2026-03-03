import React, { useState, useEffect } from 'react';
import { Printer, RefreshCw, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import PageHeader from '../common/PageHeader';
import api from '../../api/axios';

const ReportLayout = ({ title, subtitle, icon, children, onRefresh, loading, filters }) => {
    const actions = (
        <div className="flex items-center gap-3">
            <Link to="/reports" className="px-4 py-2.5 text-sm font-medium text-theme-secondary bg-theme-tertiary hover:bg-theme-primary border border-theme rounded-lg transition-colors flex items-center gap-2">
                <ArrowLeft size={16} /> Back to Reports
            </Link>
            {onRefresh && (
                <button onClick={onRefresh} className="px-4 py-2.5 text-sm font-medium text-theme-secondary bg-theme-tertiary hover:bg-theme-primary border border-theme rounded-lg transition-colors flex items-center gap-2">
                    <RefreshCw size={16} /> Refresh
                </button>
            )}
            <button onClick={() => window.print()} className="px-4 py-2.5 text-sm font-semibold bg-accent-gold text-white rounded-lg hover:bg-accent-goldDark transition-colors flex items-center gap-2">
                <Printer size={16} /> Print
            </button>
        </div>
    );

    return (
        <div className="space-y-6 max-w-[1700px] mx-auto pb-10">
            <PageHeader title={title} subtitle={subtitle} icon={icon} actions={actions} />
            {filters && <div className="bg-theme-secondary rounded-xl border border-theme shadow-theme-sm p-4">{filters}</div>}
            {loading ? (
                <div className="bg-theme-secondary rounded-xl border border-theme p-8 animate-pulse">
                    <div className="space-y-4">
                        {Array(6).fill(0).map((_, i) => (<div key={i} className="h-8 bg-theme-tertiary rounded"></div>))}
                    </div>
                </div>
            ) : children}
        </div>
    );
};

export const DateRangeFilter = ({ startDate, endDate, onStartChange, onEndChange, branchId, onBranchChange, branches }) => {
    const inputClass = "px-3 py-2 bg-theme-primary border border-theme rounded-lg text-sm text-theme-primary focus:ring-2 focus:ring-accent-gold/20 focus:border-accent-gold/30 outline-none transition-all";
    return (
        <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
                <label className="text-xs font-medium text-theme-muted uppercase">From</label>
                <input type="date" value={startDate} onChange={(e) => onStartChange(e.target.value)} className={inputClass} />
            </div>
            <div className="flex items-center gap-2">
                <label className="text-xs font-medium text-theme-muted uppercase">To</label>
                <input type="date" value={endDate} onChange={(e) => onEndChange(e.target.value)} className={inputClass} />
            </div>
            {onBranchChange && (
                <div className="flex items-center gap-2">
                    <label className="text-xs font-medium text-theme-muted uppercase">Branch</label>
                    <select value={branchId || ''} onChange={(e) => onBranchChange(e.target.value)} className={`${inputClass} appearance-none cursor-pointer`}>
                        <option value="">All Branches</option>
                        {(branches || []).map(b => (<option key={b.id} value={b.id}>{b.branch_name}</option>))}
                    </select>
                </div>
            )}
        </div>
    );
};

export const useBranches = () => {
    const [branches, setBranches] = useState([]);
    useEffect(() => {
        api.get('/branches').then(res => setBranches(res.data?.branches || res.data || [])).catch(() => {});
    }, []);
    return branches;
};

export const useDefaultDates = () => {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const lastDay = now.toISOString().split('T')[0];
    return [firstDay, lastDay];
};

export const formatCurrency = (val) => {
    const num = parseFloat(val) || 0;
    return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', minimumFractionDigits: 2 }).format(num);
};

export default ReportLayout;
