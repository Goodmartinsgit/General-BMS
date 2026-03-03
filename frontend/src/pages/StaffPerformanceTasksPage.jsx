import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { Target, Activity, Clock, CheckSquare, Search } from 'lucide-react';
import PageHeader from '../components/common/PageHeader';
import PerformanceTaskCard from '../components/performance-tasks/PerformanceTaskCard';

const StaffPerformanceTasksPage = () => {
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('active');
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        fetchMyTasks();
    }, [activeTab]);

    const fetchMyTasks = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/retail-performance-tasks/my-tasks`);
            let filtered = res.data;
            if (activeTab === 'active') {
                filtered = res.data.filter(t => t.status === 'active' || t.status === 'paused');
            } else if (activeTab === 'scheduled') {
                filtered = res.data.filter(t => t.status === 'scheduled');
            } else {
                filtered = res.data.filter(t => ['completed', 'failed', 'ended', 'cancelled'].includes(t.status));
            }
            setTasks(filtered);
        } catch (error) {
            console.error('Error fetching my tasks:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredTasks = tasks.filter(t =>
        t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.task_number.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-6 max-w-[1700px] mx-auto pb-10">
            <PageHeader
                title="My Performance Tasks"
                subtitle="Track your growth and achievements in real-time"
                badge={`${tasks.length} Tasks`}
                icon={Target}
            />

            {/* Tab Switcher + Search */}
            <div className="bg-theme-secondary p-3 rounded-lg border border-theme shadow-theme-sm flex flex-col md:flex-row items-center gap-3">
                <div className="flex bg-theme-tertiary p-1 rounded-lg w-full md:w-auto">
                    {[
                        { key: 'active', label: 'Ongoing', icon: Activity },
                        { key: 'scheduled', label: 'Upcoming', icon: Clock },
                        { key: 'inactive', label: 'Completed', icon: CheckSquare },
                    ].map(tab => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
                                activeTab === tab.key
                                    ? 'bg-accent-gold text-white shadow-sm'
                                    : 'text-theme-muted hover:text-theme-primary'
                            }`}
                        >
                            <tab.icon size={16} /> {tab.label}
                        </button>
                    ))}
                </div>

                <div className="relative flex-grow w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-theme-muted w-5 h-5 pointer-events-none" />
                    <input
                        type="text"
                        placeholder="Search your tasks..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-theme-primary border border-theme rounded-lg text-sm focus:ring-2 focus:ring-accent-gold/20 focus:border-accent-gold/30 outline-none transition-all text-theme-primary placeholder-theme-muted"
                    />
                </div>
            </div>

            {/* Tasks Grid */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {Array(6).fill(0).map((_, i) => (
                        <div key={i} className="bg-theme-secondary p-6 rounded-lg border border-theme shadow-theme-sm animate-pulse">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 bg-theme-tertiary rounded-lg"></div>
                                <div className="space-y-2 flex-1">
                                    <div className="h-4 w-32 bg-theme-tertiary rounded"></div>
                                    <div className="h-3 w-20 bg-theme-tertiary rounded"></div>
                                </div>
                            </div>
                            <div className="h-4 w-full bg-theme-tertiary rounded mb-3"></div>
                            <div className="h-3 w-2/3 bg-theme-tertiary rounded"></div>
                        </div>
                    ))}
                </div>
            ) : filteredTasks.length === 0 ? (
                <div className="bg-theme-secondary rounded-lg border border-theme shadow-theme-sm py-16 flex flex-col items-center justify-center">
                    <div className="w-16 h-16 bg-theme-tertiary rounded-full flex items-center justify-center text-theme-muted mb-4">
                        <Target size={32} />
                    </div>
                    <h3 className="text-lg font-semibold text-theme-primary mb-1">No tasks assigned here</h3>
                    <p className="text-theme-muted text-sm">You're all clear for now! Check back later.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredTasks.map(task => (
                        <PerformanceTaskCard
                            key={task.id}
                            task={task}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default StaffPerformanceTasksPage;
