import React, { useState, useEffect, useCallback } from 'react';
import api from '../api/axios';
import { useCurrency } from '../context/CurrencyContext';
import PageHeader from '../components/common/PageHeader';
import PeriodFilter from '../components/common/PeriodFilter';
import {
  PieChart,
  DollarSign,
  TrendingDown,
  Calendar,
  ArrowDown,
  Loader2,
  BarChart3,
  Tag,
  Receipt
} from 'lucide-react';

const ExpenseAnalyticsPage = () => {
  const { formatCurrency } = useCurrency();
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState(null);

  useEffect(() => {
    fetchExpenses();
  }, [dateRange]);

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const params = {};
      if (dateRange?.start_date) params.start_date = dateRange.start_date;
      if (dateRange?.end_date) params.end_date = dateRange.end_date;
      const response = await api.get('/expenses', { params });
      setExpenses(Array.isArray(response.data) ? response.data : response.data?.expenses || []);
    } catch (error) {
      console.error('Error fetching expenses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePeriodChange = useCallback((range) => {
    setDateRange(range);
  }, []);

  // Calculate summary stats
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const thisMonthExpenses = expenses.filter(e => {
    const expDate = new Date(e.expense_date || e.created_at);
    return expDate >= startOfMonth;
  });

  const totalThisMonth = thisMonthExpenses.reduce((sum, e) => sum + parseFloat(e.amount || 0), 0);

  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const currentDay = now.getDate();
  const avgPerDay = currentDay > 0 ? totalThisMonth / currentDay : 0;

  // Group by category
  const categoryMap = {};
  expenses.forEach(e => {
    const cat = e.category_name || e.category || 'Uncategorized';
    if (!categoryMap[cat]) {
      categoryMap[cat] = { name: cat, total: 0, count: 0 };
    }
    categoryMap[cat].total += parseFloat(e.amount || 0);
    categoryMap[cat].count += 1;
  });

  const categories = Object.values(categoryMap).sort((a, b) => b.total - a.total);
  const highestCategory = categories.length > 0 ? categories[0] : null;
  const totalAllExpenses = expenses.reduce((sum, e) => sum + parseFloat(e.amount || 0), 0);

  // Monthly trend (group by month)
  const monthlyMap = {};
  expenses.forEach(e => {
    const date = new Date(e.expense_date || e.created_at);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const label = date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
    if (!monthlyMap[key]) {
      monthlyMap[key] = { key, label, total: 0 };
    }
    monthlyMap[key].total += parseFloat(e.amount || 0);
  });

  const monthlyTrend = Object.values(monthlyMap).sort((a, b) => a.key.localeCompare(b.key)).slice(-12);
  const maxMonthly = Math.max(...monthlyTrend.map(m => m.total), 1);

  // Top expenses
  const topExpenses = [...expenses]
    .sort((a, b) => parseFloat(b.amount || 0) - parseFloat(a.amount || 0))
    .slice(0, 10);

  // Category colors
  const categoryColors = [
    'bg-blue-500',
    'bg-green-500',
    'bg-purple-500',
    'bg-amber-500',
    'bg-rose-500',
    'bg-indigo-500',
    'bg-teal-500',
    'bg-orange-500',
    'bg-cyan-500',
    'bg-pink-500'
  ];

  const formatDate = (dateString) => {
    if (!dateString) return '--';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="space-y-6 max-w-[1700px] mx-auto pb-10">
        <PageHeader
          title="Expense Analytics"
          subtitle="Analyze expense patterns and trends"
          icon={PieChart}
        />
        <div className="flex items-center justify-center py-32">
          <Loader2 className="w-8 h-8 animate-spin text-accent-gold" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-[1700px] mx-auto pb-10">
      <PageHeader
        title="Expense Analytics"
        subtitle="Analyze expense patterns and trends"
        icon={PieChart}
        badge={`${expenses.length} Expenses`}
        actions={<PeriodFilter storageKey="expense-analytics" onChange={handlePeriodChange} />}
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-theme-secondary rounded-lg border border-theme p-6 shadow-theme-sm">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400 rounded-lg">
              <TrendingDown size={24} />
            </div>
            <div>
              <p className="text-sm text-theme-muted">Total Expenses (This Month)</p>
              <p className="text-2xl font-bold text-theme-primary mt-1">{formatCurrency(totalThisMonth)}</p>
            </div>
          </div>
        </div>
        <div className="bg-theme-secondary rounded-lg border border-theme p-6 shadow-theme-sm">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 rounded-lg">
              <Calendar size={24} />
            </div>
            <div>
              <p className="text-sm text-theme-muted">Average Per Day</p>
              <p className="text-2xl font-bold text-theme-primary mt-1">{formatCurrency(avgPerDay)}</p>
            </div>
          </div>
        </div>
        <div className="bg-theme-secondary rounded-lg border border-theme p-6 shadow-theme-sm">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-100 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400 rounded-lg">
              <Tag size={24} />
            </div>
            <div>
              <p className="text-sm text-theme-muted">Highest Category</p>
              <p className="text-2xl font-bold text-theme-primary mt-1">
                {highestCategory ? highestCategory.name : 'N/A'}
              </p>
              {highestCategory && (
                <p className="text-xs text-theme-muted mt-0.5">{formatCurrency(highestCategory.total)}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Expenses by Category Breakdown */}
        <div className="bg-theme-secondary rounded-lg border border-theme shadow-theme-sm p-6">
          <div className="flex items-center gap-2 mb-6">
            <PieChart className="w-5 h-5 text-accent-gold" />
            <h3 className="font-semibold text-theme-primary text-base">Expenses by Category</h3>
          </div>
          {categories.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-theme-muted text-sm">No expense data available</p>
            </div>
          ) : (
            <div className="space-y-4">
              {categories.map((cat, index) => {
                const percentage = totalAllExpenses > 0 ? (cat.total / totalAllExpenses) * 100 : 0;
                const colorClass = categoryColors[index % categoryColors.length];
                return (
                  <div key={cat.name}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${colorClass}`}></div>
                        <span className="text-sm font-medium text-theme-primary">{cat.name}</span>
                        <span className="text-xs text-theme-muted">({cat.count})</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-semibold text-theme-primary">{formatCurrency(cat.total)}</span>
                        <span className="text-xs text-theme-muted w-12 text-right">{percentage.toFixed(1)}%</span>
                      </div>
                    </div>
                    <div className="w-full bg-theme-tertiary rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${colorClass} transition-all duration-500`}
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Monthly Trend */}
        <div className="bg-theme-secondary rounded-lg border border-theme shadow-theme-sm p-6">
          <div className="flex items-center gap-2 mb-6">
            <BarChart3 className="w-5 h-5 text-accent-gold" />
            <h3 className="font-semibold text-theme-primary text-base">Monthly Trend</h3>
          </div>
          {monthlyTrend.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-theme-muted text-sm">No monthly data available</p>
            </div>
          ) : (
            <div className="space-y-3">
              {monthlyTrend.map((month) => {
                const percentage = (month.total / maxMonthly) * 100;
                return (
                  <div key={month.key}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-theme-secondary w-24">{month.label}</span>
                      <span className="text-sm font-semibold text-theme-primary">{formatCurrency(month.total)}</span>
                    </div>
                    <div className="w-full bg-theme-tertiary rounded-full h-3">
                      <div
                        className="h-3 rounded-full bg-accent-gold transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Top Expenses List */}
      <div className="bg-theme-secondary rounded-lg border border-theme shadow-theme-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-theme">
          <div className="flex items-center gap-2">
            <ArrowDown className="w-5 h-5 text-accent-gold" />
            <h3 className="font-semibold text-theme-primary text-base">Top Expenses</h3>
          </div>
          <p className="text-xs text-theme-muted mt-0.5">Highest value expense transactions</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-theme-primary border-b border-theme">
                <th className="px-6 py-3 text-xs font-semibold text-theme-muted uppercase">#</th>
                <th className="px-6 py-3 text-xs font-semibold text-theme-muted uppercase">Description</th>
                <th className="px-6 py-3 text-xs font-semibold text-theme-muted uppercase">Category</th>
                <th className="px-6 py-3 text-xs font-semibold text-theme-muted uppercase">Date</th>
                <th className="px-6 py-3 text-xs font-semibold text-theme-muted uppercase text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-theme">
              {topExpenses.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-16 h-16 bg-theme-tertiary rounded-full flex items-center justify-center text-theme-muted">
                        <Receipt size={32} />
                      </div>
                      <div>
                        <p className="font-semibold text-theme-primary text-lg">No expenses recorded</p>
                        <p className="text-theme-muted text-sm mt-1">Start tracking expenses to see analytics.</p>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                topExpenses.map((exp, index) => (
                  <tr key={exp.id || index} className="hover:bg-theme-primary transition-colors">
                    <td className="px-6 py-4">
                      <span className="text-sm font-bold text-theme-muted">{index + 1}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400 flex items-center justify-center flex-shrink-0">
                          <Receipt className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-theme-primary">{exp.description || 'No description'}</p>
                          <p className="text-xs text-theme-muted font-mono mt-0.5">{exp.expense_number || ''}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-block text-xs font-medium px-2.5 py-1 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-300">
                        {exp.category_name || exp.category || 'Uncategorized'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-theme-secondary">{formatDate(exp.expense_date || exp.created_at)}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-sm font-bold text-red-600 dark:text-red-400">
                        {formatCurrency(exp.amount || 0)}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ExpenseAnalyticsPage;
