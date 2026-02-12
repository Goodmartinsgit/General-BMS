import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiClock, FiPause, FiPlay, FiXCircle, FiUsers, FiTrendingUp, FiTrash2 } from 'react-icons/fi';
import axios from 'axios';
import ProgressBar from '../components/performance-tasks/ProgressBar';
import CountdownTimer from '../components/performance-tasks/CountdownTimer';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const PerformanceTaskDetailPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [task, setTask] = useState(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [showStatusModal, setShowStatusModal] = useState(false);
    const [newStatus, setNewStatus] = useState('');
    const [reason, setReason] = useState('');

    useEffect(() => {
        fetchTask();
        const interval = setInterval(fetchTask, 30000); // Auto-refresh every 30s
        return () => clearInterval(interval);
    }, [id]);

    const fetchTask = async () => {
        try {
            const res = await axios.get(`${API_URL}/retail-performance-tasks/${id}`);
            setTask(res.data);
        } catch (error) {
            console.error('Error fetching task details:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStatus = async (status, reasonInput = '') => {
        setActionLoading(true);
        try {
            await axios.patch(`${API_URL}/retail-performance-tasks/${id}/status`, { 
                status: status,
                reason: reasonInput
            });
            setShowStatusModal(false);
            setReason('');
            fetchTask();
        } catch (error) {
            alert(error.response?.data?.message || 'Error updating status');
        } finally {
            setActionLoading(false);
        }
    };

    if (loading) return <div className="p-8 text-center font-bold">Loading task details...</div>;
    if (!task) return <div className="p-8 text-center font-bold text-red-500">Task not found</div>;

    const unit = task.task_type === 'sales_amount' ? 'NGN' : 
                 task.task_type === 'sales_count' ? 'sales' : 
                 task.task_type === 'tiles_quantity' ? 'cartons' : 'units';

    const isInactive = ['completed', 'failed', 'cancelled', 'ended'].includes(task.status);

    return (
        <div className="p-4 md:p-8 bg-gray-50 min-h-screen dark:bg-gray-900">
            <div className="max-w-5xl mx-auto">
                {/* Header */}
                <button 
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 text-gray-500 hover:text-gray-900 mb-6 font-bold text-sm"
                >
                    <FiArrowLeft /> BACK TO TASKS
                </button>

                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden mb-8">
                    <div className="p-8 border-b dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded dark:bg-blue-900/40 tracking-widest">{task.task_number}</span>
                                <h1 className="text-3xl font-bold mt-2">{task.title}</h1>
                                <p className="text-gray-500 mt-2 max-w-2xl">{task.description}</p>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                                <span className={`px-4 py-1.5 rounded-full text-sm font-bold border ${
                                    task.status === 'active' ? 'bg-green-100 text-green-800 border-green-200' :
                                    task.status === 'paused' ? 'bg-amber-100 text-amber-800 border-amber-200' :
                                    'bg-gray-100 text-gray-800'
                                }`}>
                                    {task.status.toUpperCase()}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="p-8 grid grid-cols-1 md:grid-cols-3 gap-8">
                        {/* Overall Progress */}
                        <div className="md:col-span-2 space-y-8">
                            <div>
                                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Overall Performance</h3>
                                <ProgressBar 
                                    current={task.assignments.reduce((sum, a) => sum + parseFloat(a.progress || 0), 0)}
                                    target={parseFloat(task.target_value)}
                                    unit={unit}
                                    size="lg"
                                />
                            </div>

                            <div>
                                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Member Breakdown</h3>
                                <div className="space-y-4">
                                    {task.assignments.map(assign => (
                                        <div key={assign.id} className="p-4 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800">
                                            <div className="flex justify-between items-center mb-2">
                                                <span className="font-bold">{assign.full_name}</span>
                                                <span className="text-xs font-bold text-gray-400">{assign.role}</span>
                                            </div>
                                            <ProgressBar 
                                                current={parseFloat(assign.progress || 0)}
                                                target={parseFloat(task.target_value)}
                                                unit={unit}
                                                size="md"
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Sidebar: Timing and Actions */}
                        <div className="space-y-6">
                            <div className="bg-gray-50 dark:bg-gray-900 p-6 rounded-2xl border border-gray-100 dark:border-gray-800">
                                <CountdownTimer 
                                    targetTime={task.start_time} 
                                    extendedTime={task.end_time} // Using end_time as target for ongoing
                                    mode={task.status === 'scheduled' ? 'start' : 'end'}
                                    isPaused={task.status === 'paused'}
                                />
                            </div>

                            <div className="space-y-2">
                                <h3 className="text-[10px] font-bold text-gray-400 uppercase px-2 mb-2">Management Actions</h3>
                                {task.status === 'active' && (
                                    <button 
                                        onClick={() => { setNewStatus('paused'); setShowStatusModal(true); }}
                                        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold transition-all"
                                    >
                                        <FiPause /> Pause Task
                                    </button>
                                )}
                                {task.status === 'paused' && (
                                    <button 
                                        onClick={() => handleUpdateStatus('active')}
                                        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold transition-all"
                                    >
                                        <FiPlay /> Resume Task
                                    </button>
                                )}
                                {!isInactive && (
                                    <button 
                                        onClick={() => { setNewStatus('cancelled'); setShowStatusModal(true); }}
                                        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-100 hover:bg-red-200 text-red-600 rounded-xl font-bold transition-all"
                                    >
                                        <FiXCircle /> Cancel Task
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Reason Modal */}
            {showStatusModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full shadow-2xl">
                        <h3 className="text-xl font-bold mb-2">Reason for {newStatus}</h3>
                        <p className="text-sm text-gray-500 mb-4">Please provide a reason for this status change.</p>
                        <textarea 
                            value={reason} 
                            onChange={(e) => setReason(e.target.value)}
                            placeholder="Type here..."
                            rows="4"
                            className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none mb-4"
                        ></textarea>
                        <div className="flex gap-3">
                            <button onClick={() => setShowStatusModal(false)} className="flex-1 px-4 py-3 border rounded-xl font-bold">Cancel</button>
                            <button 
                                onClick={() => handleUpdateStatus(newStatus, reason)}
                                disabled={actionLoading}
                                className={`flex-1 px-4 py-3 rounded-xl font-bold text-white shadow-lg ${
                                    newStatus === 'cancelled' ? 'bg-red-600' : 'bg-amber-500'
                                }`}
                            >
                                {actionLoading ? 'Updating...' : `Confirm ${newStatus}`}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PerformanceTaskDetailPage;
