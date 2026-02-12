import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FiPlus, FiTarget, FiActivity, FiClock, FiCheckSquare, FiFilter, FiSearch } from 'react-icons/fi';
import CreateTaskModal from '../components/performance-tasks/CreateTaskModal';
import PerformanceTaskCard from '../components/performance-tasks/PerformanceTaskCard';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

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

            const res = await axios.get(`${API_URL}/retail-performance-tasks`, {
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

    return (
        <div className="p-4 md:p-8 bg-gray-50 min-h-screen dark:bg-gray-900">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                            <FiTarget className="text-accent-gold" /> Performance Tasks
                        </h1>
                        <p className="text-gray-500 mt-1">Manage staff targets and reward high performers</p>
                    </div>
                    <button 
                        onClick={() => setIsModalOpen(true)}
                        className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-blue-200 dark:shadow-none transition-transform hover:scale-[1.02] active:scale-[0.98]"
                    >
                        <FiPlus size={20} /> Create New Task
                    </button>
                </div>

                {/* Stats Summary (Mini) */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">Total Tasks</span>
                        <span className="text-2xl font-bold">{tasks.length}</span>
                    </div>
                    {/* Add more tiny stats if needed */}
                </div>

                {/* Filters and Search */}
                <div className="bg-white dark:bg-gray-800 p-2 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 mb-8 flex flex-col md:flex-row items-center gap-2">
                    <div className="flex bg-gray-100 dark:bg-gray-900 p-1 rounded-xl w-full md:w-auto">
                        <button 
                            onClick={() => setActiveTab('active')}
                            className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'active' ? 'bg-white dark:bg-gray-800 text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            <FiActivity /> Active
                        </button>
                        <button 
                            onClick={() => setActiveTab('scheduled')}
                            className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'scheduled' ? 'bg-white dark:bg-gray-800 text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            <FiClock /> Scheduled
                        </button>
                        <button 
                            onClick={() => setActiveTab('inactive')}
                            className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'inactive' ? 'bg-white dark:bg-gray-800 text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            <FiCheckSquare /> History
                        </button>
                    </div>

                    <div className="relative flex-grow w-full">
                        <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input 
                            type="text" 
                            placeholder="Search tasks by title or #ID..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-gray-900 border-none rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </div>
                </div>

                {/* Tasks Grid */}
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                        <p className="text-gray-500 font-medium">Loading tasks...</p>
                    </div>
                ) : filteredTasks.length === 0 ? (
                    <div className="bg-white dark:bg-gray-800 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700 py-20 flex flex-col items-center justify-center">
                        <FiTarget size={48} className="text-gray-300 mb-4" />
                        <h3 className="text-xl font-bold text-gray-400">No {activeTab} tasks found</h3>
                        <p className="text-gray-400 mt-1">Start by creating a new performance target for your staff.</p>
                        <button 
                             onClick={() => setIsModalOpen(true)}
                             className="mt-6 text-blue-600 font-bold hover:underline"
                        >
                            Create one now
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
            </div>

            <CreateTaskModal 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)} 
                onSuccess={fetchTasks} 
            />
        </div>
    );
};

export default AdminPerformanceTasksPage;
