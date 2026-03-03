import React, { useState, useEffect, useCallback } from 'react';
import api from '../api/axios';
import {
    Bell, CheckCheck, Trash2, ShoppingCart, CreditCard, AlertTriangle,
    Package, Users, FileText, Settings, Info, ChevronDown, Loader2
} from 'lucide-react';
import PageHeader from '../components/common/PageHeader';

const getNotificationIcon = (type) => {
    switch (type) {
        case 'sale':
        case 'sales':
            return <ShoppingCart className="w-5 h-5 text-green-500" />;
        case 'expense':
            return <CreditCard className="w-5 h-5 text-red-500" />;
        case 'stock':
        case 'inventory':
            return <Package className="w-5 h-5 text-blue-500" />;
        case 'task':
            return <FileText className="w-5 h-5 text-purple-500" />;
        case 'user':
        case 'staff':
            return <Users className="w-5 h-5 text-indigo-500" />;
        case 'alert':
        case 'warning':
            return <AlertTriangle className="w-5 h-5 text-orange-500" />;
        case 'system':
        case 'settings':
            return <Settings className="w-5 h-5 text-gray-500" />;
        default:
            return <Info className="w-5 h-5 text-accent-gold" />;
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
    const diffWeek = Math.floor(diffDay / 7);

    if (diffSec < 60) return 'Just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHr < 24) return `${diffHr}h ago`;
    if (diffDay < 7) return `${diffDay}d ago`;
    if (diffWeek < 4) return `${diffWeek}w ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const NotificationsPage = () => {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [markingAll, setMarkingAll] = useState(false);

    const LIMIT = 20;

    const fetchNotifications = useCallback(async (pageNum = 1, append = false) => {
        if (pageNum === 1) setLoading(true);
        else setLoadingMore(true);

        try {
            const res = await api.get('/notifications', {
                params: { page: pageNum, limit: LIMIT },
            });
            const data = Array.isArray(res.data) ? res.data : (res.data.notifications || []);
            const total = res.data.total || null;

            if (append) {
                setNotifications(prev => [...prev, ...data]);
            } else {
                setNotifications(data);
            }

            if (total !== null) {
                setHasMore(pageNum * LIMIT < total);
            } else {
                setHasMore(data.length === LIMIT);
            }
        } catch (error) {
            console.error('Error fetching notifications:', error);
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    }, []);

    useEffect(() => {
        fetchNotifications(1);
    }, [fetchNotifications]);

    const handleLoadMore = () => {
        const nextPage = page + 1;
        setPage(nextPage);
        fetchNotifications(nextPage, true);
    };

    const handleMarkAsRead = async (notificationId) => {
        try {
            await api.put(`/notifications/${notificationId}/read`);
            setNotifications(prev =>
                prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
            );
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    };

    const handleMarkAllAsRead = async () => {
        setMarkingAll(true);
        try {
            await api.put('/notifications/read-all');
            setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
        } catch (error) {
            console.error('Error marking all as read:', error);
        } finally {
            setMarkingAll(false);
        }
    };

    const handleDelete = async (notificationId) => {
        try {
            await api.delete(`/notifications/${notificationId}`);
            setNotifications(prev => prev.filter(n => n.id !== notificationId));
        } catch (error) {
            console.error('Error deleting notification:', error);
        }
    };

    const unreadCount = notifications.filter(n => !n.is_read).length;

    const actions = (
        <button
            onClick={handleMarkAllAsRead}
            disabled={markingAll || unreadCount === 0}
            className="bg-accent-gold text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg font-semibold text-xs sm:text-sm hover:bg-accent-goldDark transition flex items-center justify-center gap-1.5 sm:gap-2 disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
        >
            <CheckCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            {markingAll ? 'Marking...' : 'Mark All as Read'}
        </button>
    );

    return (
        <div className="space-y-4 sm:space-y-6 max-w-[900px] mx-auto pb-6 sm:pb-10">
            <PageHeader
                title="Notifications"
                subtitle="Stay up to date with everything happening in your business"
                badge={unreadCount > 0 ? `${unreadCount} Unread` : undefined}
                icon={Bell}
                actions={actions}
            />

            {/* Notification List */}
            {loading ? (
                <div className="space-y-3">
                    {Array(5).fill(0).map((_, i) => (
                        <div key={i} className="bg-theme-secondary p-4 rounded-lg border border-theme shadow-theme-sm animate-pulse">
                            <div className="flex items-start gap-4">
                                <div className="w-10 h-10 bg-theme-tertiary rounded-full flex-shrink-0"></div>
                                <div className="flex-1">
                                    <div className="h-4 w-48 bg-theme-tertiary rounded mb-2"></div>
                                    <div className="h-3 w-full bg-theme-tertiary rounded mb-1"></div>
                                    <div className="h-3 w-20 bg-theme-tertiary rounded"></div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : notifications.length === 0 ? (
                <div className="bg-theme-secondary p-12 rounded-lg border border-theme shadow-theme-sm text-center">
                    <Bell className="w-16 h-16 text-theme-muted mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-theme-primary mb-2">No notifications</h3>
                    <p className="text-theme-muted">You are all caught up. Notifications will appear here as activity happens.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {notifications.map(notification => (
                        <div
                            key={notification.id}
                            onClick={() => {
                                if (!notification.is_read) handleMarkAsRead(notification.id);
                            }}
                            className={`bg-theme-secondary rounded-lg border shadow-theme-sm transition-all cursor-pointer group ${
                                notification.is_read
                                    ? 'border-theme'
                                    : 'border-l-4 border-l-accent-gold border-t border-r border-b border-t-theme border-r-theme border-b-theme'
                            }`}
                        >
                            <div className="p-4 flex items-start gap-4">
                                {/* Icon */}
                                <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                                    notification.is_read
                                        ? 'bg-theme-tertiary'
                                        : 'bg-accent-gold/10'
                                }`}>
                                    {getNotificationIcon(notification.type)}
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-2">
                                        <h4 className={`text-sm font-semibold line-clamp-1 ${
                                            notification.is_read ? 'text-theme-primary' : 'text-theme-primary'
                                        }`}>
                                            {notification.title}
                                            {!notification.is_read && (
                                                <span className="inline-block w-2 h-2 bg-accent-gold rounded-full ml-2 align-middle"></span>
                                            )}
                                        </h4>
                                        <span className="text-xs text-theme-muted flex-shrink-0 whitespace-nowrap">
                                            {timeAgo(notification.created_at)}
                                        </span>
                                    </div>
                                    <p className={`text-sm mt-0.5 line-clamp-2 ${
                                        notification.is_read ? 'text-theme-muted' : 'text-theme-secondary'
                                    }`}>
                                        {notification.message}
                                    </p>
                                </div>

                                {/* Delete Button */}
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleDelete(notification.id);
                                    }}
                                    className="flex-shrink-0 p-1.5 rounded-md text-theme-muted hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition opacity-0 group-hover:opacity-100"
                                    title="Delete notification"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))}

                    {/* Load More */}
                    {hasMore && (
                        <div className="text-center pt-4">
                            <button
                                onClick={handleLoadMore}
                                disabled={loadingMore}
                                className="px-6 py-2.5 text-theme-secondary bg-theme-primary hover:bg-theme-tertiary border border-theme rounded-lg transition font-semibold text-sm inline-flex items-center gap-2"
                            >
                                {loadingMore ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" /> Loading...
                                    </>
                                ) : (
                                    <>
                                        <ChevronDown className="w-4 h-4" /> Load More
                                    </>
                                )}
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default NotificationsPage;
