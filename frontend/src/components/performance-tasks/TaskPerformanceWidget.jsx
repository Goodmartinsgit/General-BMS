import React, { useState, useEffect } from 'react';
import { FiTarget, FiChevronUp, FiChevronDown, FiActivity } from 'react-icons/fi';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import ProgressBar from './ProgressBar';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const TaskPerformanceWidget = () => {
    const { auth } = useAuth();
    const [tasks, setTasks] = useState([]);
    const [isExpanded, setIsExpanded] = useState(false);
    const [loading, setLoading] = useState(false);

    const isStaff = auth.user?.role_name?.toLowerCase() === 'staff' || auth.user?.role_name?.toLowerCase() === 'retail_staff';

    useEffect(() => {
        if (isStaff && auth.accessToken) {
            fetchMyActiveTasks();
            const interval = setInterval(fetchMyActiveTasks, 60000); // Update every minute
            return () => clearInterval(interval);
        }
    }, [isStaff, auth.accessToken]);

    const fetchMyActiveTasks = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${API_URL}/retail-performance-tasks/my-tasks`);
            const activeOnes = res.data.filter(t => t.status === 'active' || t.status === 'paused');
            setTasks(activeOnes);
        } catch (error) {
            console.error('Error fetching widget tasks:', error);
        } finally {
            setLoading(false);
        }
    };

    if (!isStaff || tasks.length === 0) return null;

    return (
        <div className={`fixed bottom-6 right-6 z-40 transition-all duration-300 transform ${isExpanded ? 'w-80' : 'w-16'}`}>
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-blue-100 dark:border-gray-700 overflow-hidden flex flex-col">
                {/* Header / Toggle */}
                <button 
                    onClick={() => setIsExpanded(!isExpanded)}
                    className={`flex items-center justify-between p-4 bg-blue-600 text-white transition-all ${isExpanded ? 'rounded-t-2xl' : 'rounded-2xl'}`}
                >
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <FiTarget size={24} />
                            <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-blue-600 animate-pulse"></div>
                        </div>
                        {isExpanded && <span className="font-bold text-sm tracking-widest">PERFORMANCE</span>}
                    </div>
                    {isExpanded ? <FiChevronDown size={20} /> : null}
                </button>

                {/* Body */}
                {isExpanded && (
                    <div className="p-4 space-y-4 max-h-[400px] overflow-y-auto bg-gray-50 dark:bg-gray-900/50">
                        {tasks.map(task => {
                            const unit = task.task_type === 'sales_amount' ? 'NGN' : 
                                         task.task_type === 'sales_count' ? 'sales' : 
                                         task.task_type === 'tiles_quantity' ? 'cartons' : 'units';
                            
                            // Find current user's progress for this task
                            // We need to fetch individual progress if not already in the list
                            // For simplicity, we assume the list has total progress which we can use or we should have individual progress
                            const progress = parseFloat(task.current_total_progress || 0);

                            return (
                                <div key={task.id} className="bg-white dark:bg-gray-800 p-3 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
                                    <div className="flex justify-between items-start mb-2">
                                        <h4 className="text-xs font-bold text-gray-700 dark:text-white line-clamp-1">{task.title}</h4>
                                        {task.status === 'paused' && <span className="text-[8px] font-bold text-amber-600 animate-pulse">PAUSED</span>}
                                    </div>
                                    <ProgressBar 
                                        current={progress}
                                        target={parseFloat(task.target_value)}
                                        unit={unit}
                                        size="sm"
                                        showValues={true}
                                        showPercentage={true}
                                    />
                                </div>
                            );
                        })}
                        <div className="text-[10px] text-center text-gray-400 font-bold uppercase py-2 border-t border-gray-200 dark:border-gray-800 tracking-widest flex items-center justify-center gap-2">
                            <FiActivity className="text-blue-500" /> Real-time tracking
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TaskPerformanceWidget;
