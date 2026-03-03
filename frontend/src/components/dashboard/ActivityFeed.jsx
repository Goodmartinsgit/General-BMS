import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import {
    ShoppingCart, CreditCard, Package, Users, FileText, Settings,
    AlertTriangle, TrendingUp, RotateCcw
} from 'lucide-react';
import LoadingSpinner from '../ui/LoadingSpinner';

const getActivityIcon = (type) => {
    switch (type) {
        case 'sale':
        case 'sales':
            return <ShoppingCart className="w-4 h-4 text-green-500" />;
        case 'expense':
            return <CreditCard className="w-4 h-4 text-red-500" />;
        case 'stock':
        case 'inventory':
        case 'stock_transfer':
            return <Package className="w-4 h-4 text-blue-500" />;
        case 'user':
        case 'staff':
            return <Users className="w-4 h-4 text-indigo-500" />;
        case 'task':
            return <FileText className="w-4 h-4 text-purple-500" />;
        case 'return':
        case 'returns':
            return <RotateCcw className="w-4 h-4 text-orange-500" />;
        case 'alert':
        case 'warning':
            return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
        case 'revenue':
            return <TrendingUp className="w-4 h-4 text-emerald-500" />;
        case 'settings':
            return <Settings className="w-4 h-4 text-gray-500" />;
        default:
            return <FileText className="w-4 h-4 text-theme-muted" />;
    }
};

const timeAgo = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now - date;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffMs / 60000);
    const diffHr = Math.floor(diffMs / 3600000);
    const diffDay = Math.floor(diffMs / 86400000);

    if (diffSec < 60) return 'Just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHr < 24) return `${diffHr}h ago`;
    if (diffDay < 7) return `${diffDay}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const ActivityFeed = () => {
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchActivities();
    }, []);

    const fetchActivities = async () => {
        setLoading(true);
        try {
            const res = await api.get('/dashboard/activity-feed');
            const data = Array.isArray(res.data) ? res.data : (res.data.activities || []);
            setActivities(data);
        } catch (error) {
            console.error('Error fetching activity feed:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-theme-secondary rounded-lg border border-theme p-4 shadow-theme-sm">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-theme-primary uppercase tracking-wide">
                    Recent Activity
                </h3>
                <button
                    onClick={fetchActivities}
                    className="text-theme-muted hover:text-accent-gold transition p-1"
                    title="Refresh"
                >
                    <RotateCcw className="w-4 h-4" />
                </button>
            </div>

            <div className="max-h-[400px] overflow-y-auto pr-1 -mr-1 custom-scrollbar">
                {loading ? (
                    <div className="flex items-center justify-center py-8">
                        <LoadingSpinner size="sm" />
                    </div>
                ) : activities.length === 0 ? (
                    <div className="text-center py-8">
                        <FileText className="w-10 h-10 text-theme-muted mx-auto mb-2" />
                        <p className="text-sm text-theme-muted">No recent activity</p>
                    </div>
                ) : (
                    <ul className="space-y-1">
                        {activities.map((activity, index) => (
                            <li
                                key={activity.id || index}
                                className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-theme-tertiary transition group"
                            >
                                {/* Icon */}
                                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-theme-primary border border-theme flex items-center justify-center mt-0.5">
                                    {getActivityIcon(activity.type)}
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm text-theme-primary leading-snug line-clamp-2">
                                        {activity.description}
                                    </p>
                                    <div className="flex items-center gap-2 mt-1">
                                        {activity.user_name && (
                                            <span className="text-xs font-medium text-theme-muted">
                                                {activity.user_name}
                                            </span>
                                        )}
                                        {activity.user_name && (
                                            <span className="text-xs text-theme-muted">-</span>
                                        )}
                                        <span className="text-xs text-theme-muted">
                                            {timeAgo(activity.created_at || activity.timestamp)}
                                        </span>
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
};

export default ActivityFeed;
