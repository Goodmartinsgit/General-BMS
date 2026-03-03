import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import {
  ClipboardList,
  PackageX,
  FileWarning,
  Loader2
} from 'lucide-react';

const actions = [
  {
    key: 'pendingTasks',
    label: 'Pending Tasks',
    icon: ClipboardList,
    href: '/tasks',
    color: 'bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400'
  },
  {
    key: 'lowStockItems',
    label: 'Low Stock Items',
    icon: PackageX,
    href: '/inventory',
    color: 'bg-orange-100 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400'
  },
  {
    key: 'overdueBills',
    label: 'Overdue Bills',
    icon: FileWarning,
    href: '/bills',
    color: 'bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400'
  }
];

const QuickActions = () => {
  const [counts, setCounts] = useState({
    pendingTasks: 0,
    lowStockItems: 0,
    overdueBills: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCounts();
  }, []);

  const fetchCounts = async () => {
    try {
      setLoading(true);
      const response = await api.get('/dashboard/quick-actions');
      const data = response.data || {};
      setCounts({
        pendingTasks: data.pendingTasks ?? data.pending_tasks ?? 0,
        lowStockItems: data.lowStockItems ?? data.low_stock_items ?? 0,
        overdueBills: data.overdueBills ?? data.overdue_bills ?? 0
      });
    } catch (error) {
      console.error('Error fetching quick action counts:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-theme-secondary rounded-lg border border-theme shadow-theme-sm p-6">
        <h3 className="font-semibold text-theme-primary text-base mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {Array(3).fill(0).map((_, i) => (
            <div key={i} className="bg-theme-primary rounded-lg border border-theme p-4 animate-pulse">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-theme-tertiary rounded-lg"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-24 bg-theme-tertiary rounded"></div>
                  <div className="h-3 w-12 bg-theme-tertiary rounded"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-theme-secondary rounded-lg border border-theme shadow-theme-sm p-6">
      <h3 className="font-semibold text-theme-primary text-base mb-4">Quick Actions</h3>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {actions.map((action) => {
          const Icon = action.icon;
          const count = counts[action.key] || 0;
          return (
            <Link
              key={action.key}
              to={action.href}
              className="bg-theme-secondary rounded-lg border border-theme p-4 shadow-theme-sm hover:border-accent-gold/30 transition flex items-center gap-3"
            >
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${action.color}`}>
                <Icon className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-theme-primary truncate">{action.label}</p>
                <p className="text-xs text-theme-muted mt-0.5">
                  {count > 0 ? `${count} item${count !== 1 ? 's' : ''}` : 'None'}
                </p>
              </div>
              {count > 0 && (
                <span className="inline-flex items-center justify-center min-w-[24px] h-6 px-2 text-xs font-bold rounded-full bg-accent-gold/10 text-accent-gold border border-accent-gold/20">
                  {count}
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default QuickActions;
