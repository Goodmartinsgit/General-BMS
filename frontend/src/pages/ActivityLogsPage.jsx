import React, { useState, useEffect, useCallback } from 'react';
import api from '../api/axios';
import PageHeader from '../components/common/PageHeader';
import PeriodFilter from '../components/common/PeriodFilter';
import { useCurrency } from '../context/CurrencyContext';
import {
  Activity,
  Search,
  Filter,
  ShoppingBag,
  DollarSign,
  Package,
  Users,
  Trash2,
  Edit,
  Plus,
  ArrowRightLeft,
  Clock,
  Loader2
} from 'lucide-react';

const ActivityLogsPage = () => {
  const { formatCurrency } = useCurrency();
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [dateRange, setDateRange] = useState(null);

  useEffect(() => {
    fetchActivities();
  }, [dateRange]);

  const fetchActivities = async () => {
    try {
      setLoading(true);
      const params = { limit: 50 };
      if (dateRange?.start_date) params.start_date = dateRange.start_date;
      if (dateRange?.end_date) params.end_date = dateRange.end_date;
      const response = await api.get('/dashboard/activity-feed', { params });
      const data = response.data;
      setActivities(Array.isArray(data) ? data : data?.activities || data?.feed || []);
    } catch (error) {
      console.error('Error fetching activity logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePeriodChange = useCallback((range) => {
    setDateRange(range);
  }, []);

  const getTypeIcon = (type) => {
    switch (type?.toLowerCase()) {
      case 'sale':
      case 'sales':
        return <ShoppingBag className="w-4 h-4" />;
      case 'expense':
      case 'payment':
        return <DollarSign className="w-4 h-4" />;
      case 'product':
      case 'inventory':
      case 'stock':
        return <Package className="w-4 h-4" />;
      case 'customer':
      case 'user':
        return <Users className="w-4 h-4" />;
      case 'delete':
        return <Trash2 className="w-4 h-4" />;
      case 'update':
      case 'edit':
        return <Edit className="w-4 h-4" />;
      case 'create':
        return <Plus className="w-4 h-4" />;
      case 'transfer':
        return <ArrowRightLeft className="w-4 h-4" />;
      default:
        return <Activity className="w-4 h-4" />;
    }
  };

  const getTypeBadgeStyle = (type) => {
    switch (type?.toLowerCase()) {
      case 'sale':
      case 'sales':
        return 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400';
      case 'expense':
      case 'payment':
        return 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400';
      case 'product':
      case 'inventory':
      case 'stock':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400';
      case 'customer':
      case 'user':
        return 'bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400';
      case 'delete':
        return 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400';
      case 'update':
      case 'edit':
        return 'bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400';
      case 'create':
        return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400';
      case 'transfer':
        return 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-400';
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const formatTimestamp = (dateString) => {
    if (!dateString) return '--';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getRelativeTime = (dateString) => {
    if (!dateString) return '';
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return '';
  };

  // Extract unique types for filter dropdown
  const uniqueTypes = [...new Set(
    activities.map(a => a.type || a.activity_type || a.action || '').filter(Boolean)
  )];

  const filteredActivities = activities.filter((a) => {
    const type = (a.type || a.activity_type || a.action || '').toLowerCase();
    const description = (a.description || a.message || a.details || '').toLowerCase();
    const userName = (a.user || a.user_name || a.performed_by || '').toLowerCase();

    const matchesSearch = !searchTerm ||
      description.includes(searchTerm.toLowerCase()) ||
      type.includes(searchTerm.toLowerCase()) ||
      userName.includes(searchTerm.toLowerCase());

    const matchesType = !typeFilter || type === typeFilter.toLowerCase();

    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-6 max-w-[1700px] mx-auto pb-10">
      <PageHeader
        title="Activity Logs"
        subtitle="Track all system activities and changes"
        icon={Activity}
        badge={`${activities.length} Activities`}
        actions={<PeriodFilter storageKey="activity-logs" onChange={handlePeriodChange} />}
      />

      {/* Search & Filter Bar */}
      <div className="bg-theme-secondary p-4 rounded-lg border border-theme shadow-theme-sm flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-grow w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-theme-muted w-5 h-5 pointer-events-none" />
          <input
            type="text"
            placeholder="Search activities by description, type, or user..."
            className="w-full pl-10 pr-4 py-2.5 bg-theme-primary border border-theme rounded-lg focus:ring-2 focus:ring-accent-gold/20 focus:border-accent-gold/30 outline-none transition-all text-sm text-theme-primary placeholder-theme-muted"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="flex items-center gap-2 px-4 py-2.5 bg-theme-primary border border-theme rounded-lg">
            <Filter className="w-4 h-4 text-theme-muted" />
            <select
              className="bg-transparent text-sm font-medium text-theme-primary outline-none cursor-pointer"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="" className="bg-theme-secondary text-theme-primary">All Types</option>
              {uniqueTypes.map((type) => (
                <option key={type} value={type} className="bg-theme-secondary text-theme-primary">
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Activity Table */}
      <div className="bg-theme-secondary rounded-lg border border-theme shadow-theme-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-theme-primary border-b border-theme">
                <th className="px-6 py-3 text-xs font-semibold text-theme-muted uppercase">Type</th>
                <th className="px-6 py-3 text-xs font-semibold text-theme-muted uppercase">Description</th>
                <th className="px-6 py-3 text-xs font-semibold text-theme-muted uppercase">User</th>
                <th className="px-6 py-3 text-xs font-semibold text-theme-muted uppercase">Amount</th>
                <th className="px-6 py-3 text-xs font-semibold text-theme-muted uppercase">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-theme">
              {loading ? (
                Array(8).fill(0).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-6 py-4"><div className="h-6 w-20 bg-theme-tertiary rounded-full"></div></td>
                    <td className="px-6 py-4"><div className="h-4 w-64 bg-theme-tertiary rounded"></div></td>
                    <td className="px-6 py-4"><div className="h-4 w-24 bg-theme-tertiary rounded"></div></td>
                    <td className="px-6 py-4"><div className="h-4 w-20 bg-theme-tertiary rounded"></div></td>
                    <td className="px-6 py-4"><div className="h-4 w-36 bg-theme-tertiary rounded"></div></td>
                  </tr>
                ))
              ) : filteredActivities.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-16 h-16 bg-theme-tertiary rounded-full flex items-center justify-center text-theme-muted">
                        <Activity size={32} />
                      </div>
                      <div>
                        <p className="font-semibold text-theme-primary text-lg">No activity found</p>
                        <p className="text-theme-muted text-sm mt-1">
                          {searchTerm || typeFilter
                            ? 'Try adjusting your search or filter criteria.'
                            : 'No activities have been recorded yet.'}
                        </p>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredActivities.map((activity, index) => {
                  const type = activity.type || activity.activity_type || activity.action || 'unknown';
                  const description = activity.description || activity.message || activity.details || '--';
                  const userName = activity.user || activity.user_name || activity.performed_by || 'System';
                  const amount = activity.amount || activity.value || null;
                  const timestamp = activity.timestamp || activity.created_at || activity.date;
                  const relativeTime = getRelativeTime(timestamp);

                  return (
                    <tr key={activity.id || index} className="hover:bg-theme-primary transition-colors">
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${getTypeBadgeStyle(type)}`}>
                          {getTypeIcon(type)}
                          {type.charAt(0).toUpperCase() + type.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-theme-primary line-clamp-2">{description}</p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-theme-tertiary flex items-center justify-center flex-shrink-0">
                            <Users className="w-3.5 h-3.5 text-theme-muted" />
                          </div>
                          <span className="text-sm text-theme-secondary font-medium">{userName}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {amount ? (
                          <span className="text-sm font-semibold text-theme-primary">
                            {formatCurrency(amount)}
                          </span>
                        ) : (
                          <span className="text-sm text-theme-muted">--</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-sm text-theme-secondary">
                          <Clock size={14} className="text-theme-muted flex-shrink-0" />
                          <div>
                            <p>{formatTimestamp(timestamp)}</p>
                            {relativeTime && (
                              <p className="text-xs text-theme-muted">{relativeTime}</p>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ActivityLogsPage;
