import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { Plus, Target, Activity, Clock, CheckSquare, Search } from 'lucide-react';
import PageHeader from '../components/common/PageHeader';
import CreateTaskModal from '../components/performance-tasks/CreateTaskModal';
import PerformanceTaskCard from '../components/performance-tasks/PerformanceTaskCard';

const AdminPerformanceTasksPage = () => {
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [activeTab, setActiveTab] = useState('active');
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        fetchTasks();
    }, [activeTab]);

    const fetchTasks = async () => {
        setLoading(true);
        try {
            let statusFilter = '';
            if (activeTab === 'active') statusFilter = 'active';
            else if (activeTab === 'scheduled') statusFilter = 'scheduled';
            else statusFilter = 'completed,failed,ended,cancelled';

            const res = await api.get(`/retail-performance-tasks`, {
                params: { status: statusFilter }
            });
            setTasks(res.data);
        } catch (error) {
            console.error('Error fetching tasks:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredTasks = tasks.filter(t =>
        t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.task_number.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const activeTasks = tasks.filter(t => t.status === 'active').length;
    const scheduledTasks = tasks.filter(t => t.status === 'scheduled').length;
    const completedTasks = tasks.filter(t => t.status === 'completed').length;

    const tabs = [
        { key: 'active', label: 'Active', icon: Activity },
        { key: 'scheduled', label: 'Scheduled', icon: Clock },
        { key: 'inactive', label: 'History', icon: CheckSquare },
    ];

    const actions = (
        <button
            onClick={() => setIsModalOpen(true)}
            className="bg-accent-gold text-white px-4 py-2 rounded-lg font-semibold text-sm hover:bg-accent-goldDark transition flex items-center gap-2"
        >
            <Plus className="w-4 h-4" /> Create Task
        </button>
    );

    return (
        <div className="space-y-6 max-w-[1700px] mx-auto pb-10">
            <PageHeader
                title="Performance Tasks"
                subtitle="Manage staff targets and reward high performers"
                badge={`${tasks.length} Tasks`}
                icon={Target}
                actions={actions}
            />

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-theme-secondary p-6 rounded-lg border border-theme shadow-theme-sm flex items-center gap-4">
                    <div className="p-3 bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 rounded-lg">
                        <Target size={24} />
                    </div>
                    <div>
                        <div className="text-sm text-theme-muted font-medium">Total Tasks</div>
                        <div className="text-2xl font-semibold text-theme-primary">{tasks.length}</div>
                    </div>
                </div>
                <div className="bg-theme-secondary p-6 rounded-lg border border-theme shadow-theme-sm flex items-center gap-4">
                    <div className="p-3 bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400 rounded-lg">
                        <Activity size={24} />
                    </div>
                    <div>
                        <div className="text-sm text-theme-muted font-medium">Active</div>
                        <div className="text-2xl font-semibold text-theme-primary">{activeTasks}</div>
                    </div>
                </div>
                <div className="bg-theme-secondary p-6 rounded-lg border border-theme shadow-theme-sm flex items-center gap-4">
                    <div className="p-3 bg-amber-100 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400 rounded-lg">
                        <Clock size={24} />
                    </div>
                    <div>
                        <div className="text-sm text-theme-muted font-medium">Scheduled</div>
                        <div className="text-2xl font-semibold text-theme-primary">{scheduledTasks}</div>
                    </div>
                </div>
                <div className="bg-theme-secondary p-6 rounded-lg border border-theme shadow-theme-sm flex items-center gap-4">
                    <div className="p-3 bg-purple-100 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400 rounded-lg">
                        <CheckSquare size={24} />
                    </div>
                    <div>
                        <div className="text-sm text-theme-muted font-medium">Completed</div>
                        <div className="text-2xl font-semibold text-theme-primary">{completedTasks}</div>
                    </div>
                </div>
            </div>

            {/* Tabs + Search */}
            <div className="bg-theme-secondary p-4 rounded-lg border border-theme shadow-theme-sm flex flex-col md:flex-row items-stretch md:items-center gap-4">
                <div className="flex bg-theme-primary p-1 rounded-lg border border-theme">
                    {tabs.map(tab => {
                        const Icon = tab.icon;
                        return (
                            <button
                                key={tab.key}
                                onClick={() => setActiveTab(tab.key)}
                                className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-2 rounded-md text-sm font-medium transition-all ${
                                    activeTab === tab.key
                                        ? 'bg-accent-gold text-white shadow-sm'
                                        : 'text-theme-muted hover:text-theme-primary'
                                }`}
                            >
                                <Icon size={16} /> {tab.label}
                            </button>
                        );
                    })}
                </div>

                <div className="relative flex-grow">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-theme-muted w-5 h-5 pointer-events-none" />
                    <input
                        type="text"
                        placeholder="Search tasks by title or #ID..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-theme-primary border border-theme rounded-lg focus:ring-2 focus:ring-accent-gold/20 focus:border-accent-gold/30 outline-none transition-all text-sm text-theme-primary placeholder-theme-muted"
                    />
                </div>
            </div>

            {/* Tasks Grid */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {Array(3).fill(0).map((_, i) => (
                        <div key={i} className="bg-theme-secondary p-6 rounded-lg border border-theme shadow-theme-sm animate-pulse">
                            <div className="flex justify-between mb-4">
                                <div className="h-5 w-20 bg-theme-tertiary rounded-full"></div>
                                <div className="h-4 w-16 bg-theme-tertiary rounded"></div>
                            </div>
                            <div className="h-5 w-48 bg-theme-tertiary rounded mb-2"></div>
                            <div className="h-4 w-full bg-theme-tertiary rounded mb-4"></div>
                            <div className="h-3 w-full bg-theme-tertiary rounded-full mb-4"></div>
                            <div className="h-8 bg-theme-tertiary rounded"></div>
                        </div>
                    ))}
                </div>
            ) : filteredTasks.length === 0 ? (
                <div className="bg-theme-secondary p-12 rounded-lg border border-theme shadow-theme-sm text-center">
                    <Target className="w-16 h-16 text-theme-muted mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-theme-primary mb-2">No {activeTab} tasks found</h3>
                    <p className="text-theme-muted mb-6">Start by creating a new performance target for your staff.</p>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="bg-accent-gold text-white px-6 py-2 rounded-lg font-semibold hover:bg-accent-goldDark transition inline-flex items-center gap-2"
                    >
                        <Plus className="w-4 h-4" /> Create Task
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredTasks.map(task => (
                        <PerformanceTaskCard
                            key={task.id}
                            task={task}
                            onAction={fetchTasks}
                        />
                    ))}
                </div>
            )}

            <CreateTaskModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={fetchTasks}
            />
        </div>
    );
};

export default AdminPerformanceTasksPage;
