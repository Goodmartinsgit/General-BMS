import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import {
    CheckSquare, Plus, Search, Filter, Calendar, User,
    AlertTriangle, Clock, ChevronRight, Tag
} from 'lucide-react';
import PageHeader from '../components/common/PageHeader';
import TaskFormModal from '../components/TaskFormModal';

const STATUSES = [
    { key: 'all', label: 'All' },
    { key: 'pending', label: 'Pending' },
    { key: 'in_progress', label: 'In Progress' },
    { key: 'completed', label: 'Completed' },
    { key: 'cancelled', label: 'Cancelled' },
];

const PRIORITIES = ['all', 'low', 'medium', 'high', 'urgent'];

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

const TasksPage = () => {
    const navigate = useNavigate();
    const [tasks, setTasks] = useState([]);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTask, setEditingTask] = useState(null);
    const [activeStatus, setActiveStatus] = useState('all');
    const [priorityFilter, setPriorityFilter] = useState('all');
    const [assigneeFilter, setAssigneeFilter] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        fetchTasks();
        fetchUsers();
    }, []);

    const fetchTasks = async () => {
        setLoading(true);
        try {
            const res = await api.get('/tasks');
            setTasks(res.data);
        } catch (error) {
            console.error('Error fetching tasks:', error);
        } finally {
            setLoading(false);
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

    const handleCreateOrUpdate = async (formData) => {
        try {
            if (editingTask) {
                await api.put(`/tasks/${editingTask.id}`, formData);
            } else {
                await api.post('/tasks', formData);
            }
            setIsModalOpen(false);
            setEditingTask(null);
            fetchTasks();
        } catch (error) {
            console.error('Error saving task:', error);
        }
    };

    const openCreate = () => {
        setEditingTask(null);
        setIsModalOpen(true);
    };

    const filteredTasks = tasks.filter(task => {
        if (activeStatus !== 'all' && task.status !== activeStatus) return false;
        if (priorityFilter !== 'all' && task.priority !== priorityFilter) return false;
        if (assigneeFilter !== 'all' && String(task.assigned_to) !== assigneeFilter) return false;
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            const matchTitle = task.title?.toLowerCase().includes(q);
            const matchDesc = task.description?.toLowerCase().includes(q);
            const matchCategory = task.category?.toLowerCase().includes(q);
            if (!matchTitle && !matchDesc && !matchCategory) return false;
        }
        return true;
    });

    const getDisplayStatus = (task) => {
        if (task.status === 'pending' || task.status === 'in_progress') {
            if (task.due_date && new Date(task.due_date) < new Date()) {
                return 'overdue';
            }
        }
        return task.status;
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return 'No due date';
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    const actions = (
        <button
            onClick={openCreate}
            className="bg-accent-gold text-white px-4 py-2 rounded-lg font-semibold text-sm hover:bg-accent-goldDark transition flex items-center gap-2"
        >
            <Plus className="w-4 h-4" /> New Task
        </button>
    );

    return (
        <div className="space-y-6 max-w-[1700px] mx-auto pb-10">
            <PageHeader
                title="Task Management"
                subtitle="Create, assign, and track tasks across your team"
                badge={`${tasks.length} Tasks`}
                icon={CheckSquare}
                actions={actions}
            />

            {/* Stats Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-theme-secondary p-4 rounded-lg border border-theme shadow-theme-sm flex items-center gap-3">
                    <div className="p-2.5 bg-yellow-100 text-yellow-600 dark:bg-yellow-900/20 dark:text-yellow-400 rounded-lg">
                        <Clock size={20} />
                    </div>
                    <div>
                        <div className="text-xs text-theme-muted font-medium">Pending</div>
                        <div className="text-xl font-semibold text-theme-primary">
                            {tasks.filter(t => t.status === 'pending').length}
                        </div>
                    </div>
                </div>
                <div className="bg-theme-secondary p-4 rounded-lg border border-theme shadow-theme-sm flex items-center gap-3">
                    <div className="p-2.5 bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 rounded-lg">
                        <AlertTriangle size={20} />
                    </div>
                    <div>
                        <div className="text-xs text-theme-muted font-medium">In Progress</div>
                        <div className="text-xl font-semibold text-theme-primary">
                            {tasks.filter(t => t.status === 'in_progress').length}
                        </div>
                    </div>
                </div>
                <div className="bg-theme-secondary p-4 rounded-lg border border-theme shadow-theme-sm flex items-center gap-3">
                    <div className="p-2.5 bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400 rounded-lg">
                        <CheckSquare size={20} />
                    </div>
                    <div>
                        <div className="text-xs text-theme-muted font-medium">Completed</div>
                        <div className="text-xl font-semibold text-theme-primary">
                            {tasks.filter(t => t.status === 'completed').length}
                        </div>
                    </div>
                </div>
                <div className="bg-theme-secondary p-4 rounded-lg border border-theme shadow-theme-sm flex items-center gap-3">
                    <div className="p-2.5 bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400 rounded-lg">
                        <AlertTriangle size={20} />
                    </div>
                    <div>
                        <div className="text-xs text-theme-muted font-medium">Overdue</div>
                        <div className="text-xl font-semibold text-theme-primary">
                            {tasks.filter(t =>
                                (t.status === 'pending' || t.status === 'in_progress') &&
                                t.due_date && new Date(t.due_date) < new Date()
                            ).length}
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters Bar */}
            <div className="bg-theme-secondary p-4 rounded-lg border border-theme shadow-theme-sm flex flex-col lg:flex-row items-stretch lg:items-center gap-4">
                {/* Status Tabs */}
                <div className="flex bg-theme-primary p-1 rounded-lg border border-theme overflow-x-auto">
                    {STATUSES.map(tab => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveStatus(tab.key)}
                            className={`flex-shrink-0 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                                activeStatus === tab.key
                                    ? 'bg-accent-gold text-white shadow-sm'
                                    : 'text-theme-muted hover:text-theme-primary'
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Priority Dropdown */}
                <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-theme-muted flex-shrink-0" />
                    <select
                        value={priorityFilter}
                        onChange={(e) => setPriorityFilter(e.target.value)}
                        className="px-3 py-2 border border-theme bg-theme-primary text-theme-primary rounded-lg focus:ring-2 focus:ring-accent-gold/20 focus:border-accent-gold outline-none text-sm"
                    >
                        <option value="all">All Priorities</option>
                        {PRIORITIES.filter(p => p !== 'all').map(p => (
                            <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
                        ))}
                    </select>
                </div>

                {/* Assignee Dropdown */}
                <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-theme-muted flex-shrink-0" />
                    <select
                        value={assigneeFilter}
                        onChange={(e) => setAssigneeFilter(e.target.value)}
                        className="px-3 py-2 border border-theme bg-theme-primary text-theme-primary rounded-lg focus:ring-2 focus:ring-accent-gold/20 focus:border-accent-gold outline-none text-sm"
                    >
                        <option value="all">All Assignees</option>
                        {users.map(u => (
                            <option key={u.id} value={String(u.id)}>
                                {u.first_name} {u.last_name}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Search */}
                <div className="relative flex-grow">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-theme-muted w-5 h-5 pointer-events-none" />
                    <input
                        type="text"
                        placeholder="Search tasks..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-theme-primary border border-theme rounded-lg focus:ring-2 focus:ring-accent-gold/20 focus:border-accent-gold outline-none transition-all text-sm text-theme-primary placeholder-theme-muted"
                    />
                </div>
            </div>

            {/* Task Cards Grid */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {Array(6).fill(0).map((_, i) => (
                        <div key={i} className="bg-theme-secondary p-5 rounded-lg border border-theme shadow-theme-sm animate-pulse">
                            <div className="flex justify-between mb-3">
                                <div className="h-5 w-20 bg-theme-tertiary rounded-full"></div>
                                <div className="h-5 w-16 bg-theme-tertiary rounded-full"></div>
                            </div>
                            <div className="h-5 w-3/4 bg-theme-tertiary rounded mb-2"></div>
                            <div className="h-4 w-full bg-theme-tertiary rounded mb-1"></div>
                            <div className="h-4 w-2/3 bg-theme-tertiary rounded mb-4"></div>
                            <div className="flex justify-between">
                                <div className="h-4 w-24 bg-theme-tertiary rounded"></div>
                                <div className="h-4 w-20 bg-theme-tertiary rounded"></div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : filteredTasks.length === 0 ? (
                <div className="bg-theme-secondary p-12 rounded-lg border border-theme shadow-theme-sm text-center">
                    <CheckSquare className="w-16 h-16 text-theme-muted mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-theme-primary mb-2">No tasks found</h3>
                    <p className="text-theme-muted mb-6">
                        {searchQuery || activeStatus !== 'all' || priorityFilter !== 'all'
                            ? 'Try adjusting your filters or search query.'
                            : 'Get started by creating your first task.'}
                    </p>
                    <button
                        onClick={openCreate}
                        className="bg-accent-gold text-white px-6 py-2 rounded-lg font-semibold hover:bg-accent-goldDark transition inline-flex items-center gap-2"
                    >
                        <Plus className="w-4 h-4" /> New Task
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredTasks.map(task => {
                        const displayStatus = getDisplayStatus(task);
                        return (
                            <div
                                key={task.id}
                                onClick={() => navigate(`/tasks/${task.id}`)}
                                className="bg-theme-secondary rounded-lg border border-theme shadow-theme-sm hover:shadow-theme-md transition-shadow p-5 flex flex-col cursor-pointer group"
                            >
                                {/* Top Row: Status + Priority */}
                                <div className="flex justify-between items-start mb-3">
                                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${getStatusStyle(displayStatus)}`}>
                                        {formatStatusLabel(displayStatus)}
                                    </span>
                                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${getPriorityStyle(task.priority)}`}>
                                        {task.priority?.charAt(0).toUpperCase() + task.priority?.slice(1)}
                                    </span>
                                </div>

                                {/* Title */}
                                <h3 className="text-base font-bold text-theme-primary mb-1 line-clamp-1 group-hover:text-accent-gold transition-colors">
                                    {task.title}
                                </h3>

                                {/* Description excerpt */}
                                <p className="text-sm text-theme-muted mb-4 line-clamp-2 min-h-[40px]">
                                    {task.description || 'No description provided.'}
                                </p>

                                {/* Category */}
                                {task.category && (
                                    <div className="flex items-center gap-1.5 mb-3">
                                        <Tag className="w-3.5 h-3.5 text-theme-muted" />
                                        <span className="text-xs text-theme-muted">{task.category}</span>
                                    </div>
                                )}

                                {/* Footer: Assigned To + Due Date */}
                                <div className="flex items-center justify-between pt-3 border-t border-theme mt-auto">
                                    <div className="flex items-center gap-1.5 text-theme-muted">
                                        <User className="w-3.5 h-3.5" />
                                        <span className="text-xs font-medium">
                                            {task.assigned_to_name || 'Unassigned'}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-1.5 text-theme-muted">
                                        <Calendar className="w-3.5 h-3.5" />
                                        <span className={`text-xs font-medium ${displayStatus === 'overdue' ? 'text-red-500' : ''}`}>
                                            {formatDate(task.due_date)}
                                        </span>
                                    </div>
                                </div>

                                {/* View Details Link */}
                                <div className="flex justify-end mt-3">
                                    <span className="text-xs font-semibold text-accent-gold group-hover:text-accent-goldDark flex items-center gap-1 transition-colors">
                                        View Details <ChevronRight size={14} />
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            <TaskFormModal
                isOpen={isModalOpen}
                onClose={() => { setIsModalOpen(false); setEditingTask(null); }}
                onSubmit={handleCreateOrUpdate}
                task={editingTask}
            />
        </div>
    );
};

export default TasksPage;
