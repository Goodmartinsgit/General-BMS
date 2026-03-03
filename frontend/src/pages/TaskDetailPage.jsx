import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import {
    ArrowLeft, Calendar, Clock, User, UserCheck, Tag,
    Trash2, CheckSquare, AlertTriangle, ChevronDown, RefreshCw
} from 'lucide-react';

const STATUS_OPTIONS = ['pending', 'in_progress', 'completed', 'cancelled'];

const getPriorityStyle = (priority) => {
    switch (priority) {
        case 'low':
            return 'bg-gray-100 text-gray-700 dark:bg-gray-800/40 dark:text-gray-300';
        case 'medium':
            return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300';
        case 'high':
            return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300';
        case 'urgent':
            return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300';
        default:
            return 'bg-gray-100 text-gray-700 dark:bg-gray-800/40 dark:text-gray-300';
    }
};

const getStatusStyle = (status) => {
    switch (status) {
        case 'pending':
            return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
        case 'in_progress':
            return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
        case 'completed':
            return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
        case 'cancelled':
            return 'bg-gray-100 text-gray-600 dark:bg-gray-800/40 dark:text-gray-400';
        case 'overdue':
            return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
        default:
            return 'bg-gray-100 text-gray-600 dark:bg-gray-800/40 dark:text-gray-400';
    }
};

const formatStatusLabel = (status) => {
    return status.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
};

const formatDate = (dateStr) => {
    if (!dateStr) return '--';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });
};

const formatDateTime = (dateStr) => {
    if (!dateStr) return '--';
    const date = new Date(dateStr);
    return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
};

const timeAgo = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now - date;
    const diffMin = Math.floor(diffMs / 60000);
    const diffHr = Math.floor(diffMs / 3600000);
    const diffDay = Math.floor(diffMs / 86400000);

    if (diffMin < 1) return 'Just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHr < 24) return `${diffHr}h ago`;
    if (diffDay < 30) return `${diffDay}d ago`;
    return formatDate(dateStr);
};

const TaskDetailPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [task, setTask] = useState(null);
    const [history, setHistory] = useState([]);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
    const [reassignDropdownOpen, setReassignDropdownOpen] = useState(false);
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        fetchTask();
        fetchHistory();
        fetchUsers();
    }, [id]);

    const fetchTask = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/tasks/${id}`);
            setTask(res.data);
        } catch (error) {
            console.error('Error fetching task:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchHistory = async () => {
        try {
            const res = await api.get(`/tasks/${id}/history`);
            setHistory(res.data);
        } catch (error) {
            console.error('Error fetching task history:', error);
        }
    };

    const fetchUsers = async () => {
        try {
            const res = await api.get('/users');
            setUsers(res.data);
        } catch (error) {
            console.error('Error fetching users:', error);
        }
    };

    const handleStatusChange = async (newStatus) => {
        try {
            await api.put(`/tasks/${id}`, { status: newStatus });
            setStatusDropdownOpen(false);
            fetchTask();
            fetchHistory();
        } catch (error) {
            console.error('Error updating status:', error);
        }
    };

    const handleReassign = async (userId) => {
        try {
            await api.put(`/tasks/${id}`, { assigned_to: Number(userId) });
            setReassignDropdownOpen(false);
            fetchTask();
            fetchHistory();
        } catch (error) {
            console.error('Error reassigning task:', error);
        }
    };

    const handleDelete = async () => {
        if (!window.confirm('Are you sure you want to delete this task? This action cannot be undone.')) return;
        setDeleting(true);
        try {
            await api.delete(`/tasks/${id}`);
            navigate('/tasks');
        } catch (error) {
            console.error('Error deleting task:', error);
            setDeleting(false);
        }
    };

    const getDisplayStatus = () => {
        if (!task) return '';
        if ((task.status === 'pending' || task.status === 'in_progress') && task.due_date) {
            if (new Date(task.due_date) < new Date()) return 'overdue';
        }
        return task.status;
    };

    const getHistoryIcon = (actionType) => {
        switch (actionType) {
            case 'created': return <CheckSquare className="w-4 h-4 text-green-500" />;
            case 'status_change': return <RefreshCw className="w-4 h-4 text-blue-500" />;
            case 'reassigned': return <UserCheck className="w-4 h-4 text-purple-500" />;
            case 'deleted': return <Trash2 className="w-4 h-4 text-red-500" />;
            default: return <Clock className="w-4 h-4 text-theme-muted" />;
        }
    };

    if (loading) {
        return (
            <div className="space-y-6 max-w-[1200px] mx-auto pb-10">
                <div className="animate-pulse">
                    <div className="h-8 w-32 bg-theme-tertiary rounded mb-6"></div>
                    <div className="bg-theme-secondary p-8 rounded-lg border border-theme shadow-theme-sm">
                        <div className="h-6 w-48 bg-theme-tertiary rounded mb-4"></div>
                        <div className="h-4 w-full bg-theme-tertiary rounded mb-2"></div>
                        <div className="h-4 w-3/4 bg-theme-tertiary rounded mb-6"></div>
                        <div className="grid grid-cols-2 gap-6">
                            <div className="h-20 bg-theme-tertiary rounded"></div>
                            <div className="h-20 bg-theme-tertiary rounded"></div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (!task) {
        return (
            <div className="space-y-6 max-w-[1200px] mx-auto pb-10">
                <button
                    onClick={() => navigate('/tasks')}
                    className="flex items-center gap-2 text-theme-muted hover:text-theme-primary transition text-sm font-medium"
                >
                    <ArrowLeft className="w-4 h-4" /> Back to Tasks
                </button>
                <div className="bg-theme-secondary p-12 rounded-lg border border-theme shadow-theme-sm text-center">
                    <AlertTriangle className="w-16 h-16 text-theme-muted mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-theme-primary mb-2">Task not found</h3>
                    <p className="text-theme-muted">The task you are looking for does not exist or has been deleted.</p>
                </div>
            </div>
        );
    }

    const displayStatus = getDisplayStatus();

    return (
        <div className="space-y-6 max-w-[1200px] mx-auto pb-10">
            {/* Back Button */}
            <button
                onClick={() => navigate('/tasks')}
                className="flex items-center gap-2 text-theme-muted hover:text-theme-primary transition text-sm font-medium"
            >
                <ArrowLeft className="w-4 h-4" /> Back to Tasks
            </button>

            {/* Task Detail Card */}
            <div className="bg-theme-secondary rounded-lg border border-theme shadow-theme-sm">
                {/* Header */}
                <div className="p-6 border-b border-theme">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                        <div className="flex-1">
                            <div className="flex items-center gap-3 flex-wrap mb-2">
                                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusStyle(displayStatus)}`}>
                                    {formatStatusLabel(displayStatus)}
                                </span>
                                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getPriorityStyle(task.priority)}`}>
                                    {task.priority?.charAt(0).toUpperCase() + task.priority?.slice(1)} Priority
                                </span>
                                {task.category && (
                                    <span className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-theme-tertiary text-theme-muted">
                                        <Tag className="w-3 h-3" /> {task.category}
                                    </span>
                                )}
                            </div>
                            <h1 className="text-2xl font-bold text-theme-primary">{task.title}</h1>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-2 flex-wrap">
                            {/* Status Dropdown */}
                            <div className="relative">
                                <button
                                    onClick={() => { setStatusDropdownOpen(!statusDropdownOpen); setReassignDropdownOpen(false); }}
                                    className="bg-accent-gold text-white px-4 py-2 rounded-lg font-semibold text-sm hover:bg-accent-goldDark transition flex items-center gap-2"
                                >
                                    Change Status <ChevronDown className="w-4 h-4" />
                                </button>
                                {statusDropdownOpen && (
                                    <div className="absolute right-0 mt-2 w-48 bg-theme-secondary border border-theme rounded-lg shadow-xl z-20">
                                        {STATUS_OPTIONS.map(status => (
                                            <button
                                                key={status}
                                                onClick={() => handleStatusChange(status)}
                                                disabled={task.status === status}
                                                className={`w-full text-left px-4 py-2.5 text-sm font-medium transition hover:bg-theme-tertiary first:rounded-t-lg last:rounded-b-lg ${
                                                    task.status === status
                                                        ? 'text-theme-muted cursor-not-allowed'
                                                        : 'text-theme-primary'
                                                }`}
                                            >
                                                <span className="flex items-center gap-2">
                                                    <span className={`w-2 h-2 rounded-full ${
                                                        status === 'pending' ? 'bg-yellow-400' :
                                                        status === 'in_progress' ? 'bg-blue-400' :
                                                        status === 'completed' ? 'bg-green-400' :
                                                        'bg-gray-400'
                                                    }`}></span>
                                                    {formatStatusLabel(status)}
                                                </span>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Reassign Dropdown */}
                            <div className="relative">
                                <button
                                    onClick={() => { setReassignDropdownOpen(!reassignDropdownOpen); setStatusDropdownOpen(false); }}
                                    className="px-4 py-2 text-theme-secondary bg-theme-primary hover:bg-theme-tertiary border border-theme rounded-lg transition font-semibold text-sm flex items-center gap-2"
                                >
                                    <UserCheck className="w-4 h-4" /> Reassign
                                </button>
                                {reassignDropdownOpen && (
                                    <div className="absolute right-0 mt-2 w-56 bg-theme-secondary border border-theme rounded-lg shadow-xl z-20 max-h-60 overflow-y-auto">
                                        {users.map(user => (
                                            <button
                                                key={user.id}
                                                onClick={() => handleReassign(user.id)}
                                                disabled={task.assigned_to === user.id}
                                                className={`w-full text-left px-4 py-2.5 text-sm font-medium transition hover:bg-theme-tertiary first:rounded-t-lg last:rounded-b-lg ${
                                                    task.assigned_to === user.id
                                                        ? 'text-theme-muted cursor-not-allowed'
                                                        : 'text-theme-primary'
                                                }`}
                                            >
                                                {user.first_name} {user.last_name}
                                                {task.assigned_to === user.id && (
                                                    <span className="text-xs text-theme-muted ml-2">(current)</span>
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Delete */}
                            <button
                                onClick={handleDelete}
                                disabled={deleting}
                                className="px-4 py-2 text-red-600 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg transition font-semibold text-sm flex items-center gap-2"
                            >
                                <Trash2 className="w-4 h-4" /> {deleting ? 'Deleting...' : 'Delete'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Body */}
                <div className="p-6">
                    {/* Description */}
                    {task.description && (
                        <div className="mb-6">
                            <h3 className="text-sm font-semibold text-theme-muted uppercase mb-2">Description</h3>
                            <p className="text-theme-primary leading-relaxed whitespace-pre-wrap">
                                {task.description}
                            </p>
                        </div>
                    )}

                    {/* Details Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="bg-theme-primary p-4 rounded-lg border border-theme">
                            <div className="flex items-center gap-2 text-theme-muted mb-1">
                                <User className="w-4 h-4" />
                                <span className="text-xs font-medium uppercase">Assigned To</span>
                            </div>
                            <p className="text-sm font-semibold text-theme-primary">
                                {task.assigned_to_name || 'Unassigned'}
                            </p>
                        </div>
                        <div className="bg-theme-primary p-4 rounded-lg border border-theme">
                            <div className="flex items-center gap-2 text-theme-muted mb-1">
                                <UserCheck className="w-4 h-4" />
                                <span className="text-xs font-medium uppercase">Assigned By</span>
                            </div>
                            <p className="text-sm font-semibold text-theme-primary">
                                {task.assigned_by_name || '--'}
                            </p>
                        </div>
                        <div className="bg-theme-primary p-4 rounded-lg border border-theme">
                            <div className="flex items-center gap-2 text-theme-muted mb-1">
                                <Calendar className="w-4 h-4" />
                                <span className="text-xs font-medium uppercase">Due Date</span>
                            </div>
                            <p className={`text-sm font-semibold ${displayStatus === 'overdue' ? 'text-red-500' : 'text-theme-primary'}`}>
                                {formatDate(task.due_date)}
                                {task.due_time && ` at ${task.due_time}`}
                            </p>
                        </div>
                        <div className="bg-theme-primary p-4 rounded-lg border border-theme">
                            <div className="flex items-center gap-2 text-theme-muted mb-1">
                                <Clock className="w-4 h-4" />
                                <span className="text-xs font-medium uppercase">Created</span>
                            </div>
                            <p className="text-sm font-semibold text-theme-primary">
                                {formatDateTime(task.created_at)}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* History Timeline */}
            <div className="bg-theme-secondary rounded-lg border border-theme shadow-theme-sm">
                <div className="p-6 border-b border-theme">
                    <h2 className="text-lg font-bold text-theme-primary flex items-center gap-2">
                        <Clock className="w-5 h-5 text-accent-gold" /> Task History
                    </h2>
                </div>
                <div className="p-6">
                    {history.length === 0 ? (
                        <p className="text-theme-muted text-sm text-center py-8">No history records found.</p>
                    ) : (
                        <div className="relative">
                            {/* Timeline line */}
                            <div className="absolute left-[17px] top-2 bottom-2 w-0.5 bg-theme-tertiary"></div>

                            <div className="space-y-6">
                                {history.map((entry, index) => (
                                    <div key={entry.id || index} className="relative flex gap-4">
                                        {/* Icon dot */}
                                        <div className="relative z-10 flex-shrink-0 w-9 h-9 rounded-full bg-theme-primary border-2 border-theme flex items-center justify-center">
                                            {getHistoryIcon(entry.action_type)}
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 bg-theme-primary p-4 rounded-lg border border-theme">
                                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 mb-1">
                                                <span className="text-sm font-semibold text-theme-primary">
                                                    {formatStatusLabel(entry.action_type || 'update')}
                                                </span>
                                                <span className="text-xs text-theme-muted">
                                                    {timeAgo(entry.created_at || entry.timestamp)}
                                                </span>
                                            </div>
                                            <p className="text-sm text-theme-muted">
                                                {entry.changed_by_name && (
                                                    <span className="font-medium text-theme-primary">{entry.changed_by_name}</span>
                                                )}
                                                {entry.notes && <span> &mdash; {entry.notes}</span>}
                                                {!entry.changed_by_name && !entry.notes && (
                                                    <span className="italic">No additional details</span>
                                                )}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TaskDetailPage;
