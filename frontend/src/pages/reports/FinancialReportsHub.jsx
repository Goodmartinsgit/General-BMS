import React from 'react';
import { Link } from 'react-router-dom';
import { BarChart3, FileText, TrendingUp, Scale, Calculator, Building2, PieChart, Package, BookOpen, Users, Truck } from 'lucide-react';
import PageHeader from '../../components/common/PageHeader';

const reports = [
    { title: 'Income Statement', desc: 'Revenue, expenses, and net income (P&L)', icon: TrendingUp, href: '/reports/income-statement', color: 'text-green-400 bg-green-500/10' },
    { title: 'Balance Sheet', desc: 'Assets, liabilities, and equity snapshot', icon: Scale, href: '/reports/balance-sheet', color: 'text-blue-400 bg-blue-500/10' },
    { title: 'Trial Balance', desc: 'Verify debit and credit balances', icon: Calculator, href: '/reports/trial-balance', color: 'text-purple-400 bg-purple-500/10' },
    { title: 'Cash Flow', desc: 'Cash inflows, outflows, and net position', icon: PieChart, href: '/reports/cash-flow', color: 'text-cyan-400 bg-cyan-500/10' },
    { title: 'Sales Book', desc: 'Detailed sales transaction ledger', icon: BookOpen, href: '/reports/sales-book', color: 'text-amber-400 bg-amber-500/10' },
    { title: 'Branch P&L', desc: 'Profit & loss by individual branch', icon: Building2, href: '/reports/branch-pl', color: 'text-orange-400 bg-orange-500/10' },
    { title: 'Consolidated P&L', desc: 'Multi-branch consolidated profitability', icon: BarChart3, href: '/reports/consolidated-pl', color: 'text-pink-400 bg-pink-500/10' },
    { title: 'Inventory Valuation', desc: 'Stock value by product and branch', icon: Package, href: '/reports/inventory-valuation', color: 'text-teal-400 bg-teal-500/10' },
    { title: 'AR Aging', desc: 'Accounts receivable by age bucket', icon: Users, href: '/reports/ar-aging', color: 'text-red-400 bg-red-500/10' },
    { title: 'AP Aging', desc: 'Accounts payable outstanding balances', icon: Truck, href: '/reports/ap-aging', color: 'text-indigo-400 bg-indigo-500/10' },
];

const FinancialReportsHub = () => {
    return (
        <div className="space-y-6 max-w-[1700px] mx-auto pb-10">
            <PageHeader title="Financial Reports" subtitle="Generate and view accounting statements and analytics" icon={FileText} />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {reports.map((report) => (
                    <Link key={report.href} to={report.href}
                        className="group bg-theme-secondary rounded-xl border border-theme shadow-theme-sm p-5 hover:border-accent-gold/30 hover:shadow-theme-md transition-all">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${report.color}`}>
                            <report.icon size={20} />
                        </div>
                        <h3 className="font-semibold text-sm text-theme-primary group-hover:text-accent-gold transition-colors">{report.title}</h3>
                        <p className="text-xs text-theme-muted mt-1">{report.desc}</p>
                    </Link>
                ))}
            </div>
        </div>
    );
};

export default FinancialReportsHub;
