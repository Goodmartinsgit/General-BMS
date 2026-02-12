import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FiTarget, FiActivity, FiClock, FiCheckSquare, FiSearch } from 'react-icons/fi';
import PerformanceTaskCard from '../components/performance-tasks/PerformanceTaskCard';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

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
            const res = await axios.get(`${API_URL}/retail-performance-tasks/my-tasks`);
            // Filtering by status on frontend for simplicity in staff view
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
        <div className="p-4 md:p-8 bg-gray-50 min-h-screen dark:bg-gray-900">
            <div className="max-w-7xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                        <FiTarget className="text-blue-600" /> My Performance Tasks
                    </h1>
                    <p className="text-gray-500 mt-1">Track your growth and achievements in real-time</p>
                </div>

                {/* Tab Switcher */}
                <div className="bg-white dark:bg-gray-800 p-2 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 mb-8 flex flex-col md:flex-row items-center gap-2">
                    <div className="flex bg-gray-100 dark:bg-gray-900 p-1 rounded-xl w-full md:w-auto">
                        <button 
                            onClick={() => setActiveTab('active')}
                            className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'active' ? 'bg-white dark:bg-gray-800 text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            <FiActivity /> Ongoing
                        </button>
                        <button 
                            onClick={() => setActiveTab('scheduled')}
                            className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'scheduled' ? 'bg-white dark:bg-gray-800 text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            <FiClock /> Upcoming
                        </button>
                        <button 
                            onClick={() => setActiveTab('inactive')}
                            className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'inactive' ? 'bg-white dark:bg-gray-800 text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            <FiCheckSquare /> Completed
                        </button>
                    </div>

                    <div className="relative flex-grow w-full">
                        <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input 
                            type="text" 
                            placeholder="Search your tasks..." 
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
                        <p className="text-gray-500 font-medium">Updating progress...</p>
                    </div>
                ) : filteredTasks.length === 0 ? (
                    <div className="bg-white dark:bg-gray-800 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700 py-20 flex flex-col items-center justify-center">
                        <FiTarget size={48} className="text-gray-200 mb-4" />
                        <h3 className="text-xl font-bold text-gray-400">No tasks assigned here</h3>
                        <p className="text-gray-400 mt-1">You're all clear for now! Check back later.</p>
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
        </div>
    );
};

export default StaffPerformanceTasksPage;
