import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, Pause, Play, XCircle, X } from 'lucide-react';
import api from '../api/axios';
import ProgressBar from '../components/performance-tasks/ProgressBar';
import CountdownTimer from '../components/performance-tasks/CountdownTimer';

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
        const interval = setInterval(fetchTask, 30000);
        return () => clearInterval(interval);
    }, [id]);

    const fetchTask = async () => {
        try {
            const res = await api.get(`/retail-performance-tasks/${id}`);
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
            await api.patch(`/retail-performance-tasks/${id}/status`, {
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

    if (loading) {
        return (
            <div className="space-y-6 max-w-[1200px] mx-auto pb-10">
                <div className="h-8 w-32 bg-theme-tertiary rounded animate-pulse"></div>
                <div className="bg-theme-secondary rounded-lg border border-theme shadow-theme-sm animate-pulse p-8">
                    <div className="h-6 w-48 bg-theme-tertiary rounded mb-4"></div>
                    <div className="h-8 w-64 bg-theme-tertiary rounded mb-2"></div>
                    <div className="h-4 w-96 bg-theme-tertiary rounded"></div>
                </div>
            </div>
        );
    }

    if (!task) {
        return (
            <div className="space-y-6 max-w-[1200px] mx-auto pb-10">
                <div className="bg-theme-secondary rounded-lg border border-theme shadow-theme-sm py-16 flex flex-col items-center">
                    <XCircle size={48} className="text-red-500 dark:text-red-400 mb-4" />
                    <h3 className="text-lg font-semibold text-theme-primary">Task not found</h3>
                    <button onClick={() => navigate(-1)} className="mt-4 text-accent-gold font-semibold text-sm hover:underline">Go Back</button>
                </div>
            </div>
        );
    }

    const unit = task.task_type === 'sales_amount' ? 'NGN' :
                 task.task_type === 'sales_count' ? 'sales' :
                 task.task_type === 'tiles_quantity' ? 'cartons' : 'units';

    const isInactive = ['completed', 'failed', 'cancelled', 'ended'].includes(task.status);

    return (
        <div className="space-y-6 max-w-[1200px] mx-auto pb-10">
            {/* Back Button */}
            <button
                onClick={() => navigate(-1)}
                className="flex items-center gap-2 text-theme-muted hover:text-theme-primary font-semibold text-sm transition-colors"
            >
                <ArrowLeft size={16} /> BACK TO TASKS
            </button>

            {/* Main Card */}
            <div className="bg-theme-secondary rounded-lg border border-theme shadow-theme-sm overflow-hidden">
                {/* Header Section */}
                <div className="p-8 border-b border-theme bg-theme-primary">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <span className="text-[10px] font-bold text-accent-gold bg-accent-gold/10 px-2 py-1 rounded border border-accent-gold/20 tracking-widest">
                                {task.task_number}
                            </span>
                            <h1 className="text-3xl font-bold text-theme-primary mt-2">{task.title}</h1>
                            <p className="text-theme-muted mt-2 max-w-2xl">{task.description}</p>
                        </div>
                        <span className={`px-4 py-1.5 rounded-full text-sm font-bold border ${
                            task.status === 'active' ? 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800' :
                            task.status === 'paused' ? 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-800' :
                            task.status === 'scheduled' ? 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800' :
                            'bg-theme-tertiary text-theme-secondary border-theme'
                        }`}>
                            {task.status.toUpperCase()}
                        </span>
                    </div>
                </div>

                {/* Content Grid */}
                <div className="p-8 grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Overall Progress */}
                    <div className="md:col-span-2 space-y-8">
                        <div>
                            <h3 className="text-xs font-bold text-theme-muted uppercase tracking-widest mb-4">Overall Performance</h3>
                            <ProgressBar
                                current={task.assignments.reduce((sum, a) => sum + parseFloat(a.progress || 0), 0)}
                                target={parseFloat(task.target_value)}
                                unit={unit}
                                size="lg"
                            />
                        </div>

                        <div>
                            <h3 className="text-xs font-bold text-theme-muted uppercase tracking-widest mb-4">Member Breakdown</h3>
                            <div className="space-y-4">
                                {task.assignments.map(assign => (
                                    <div key={assign.id} className="p-4 bg-theme-primary rounded-lg border border-theme">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="font-bold text-theme-primary text-sm">{assign.full_name}</span>
                                            <span className="text-xs font-medium text-theme-muted">{assign.role}</span>
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
                        <div className="bg-theme-primary p-6 rounded-lg border border-theme">
                            <CountdownTimer
                                targetTime={task.start_time}
                                extendedTime={task.end_time}
                                mode={task.status === 'scheduled' ? 'start' : 'end'}
                                isPaused={task.status === 'paused'}
                            />
                        </div>

                        <div className="space-y-2">
                            <h3 className="text-[10px] font-bold text-theme-muted uppercase px-2 mb-2">Management Actions</h3>
                            {task.status === 'active' && (
                                <button
                                    onClick={() => { setNewStatus('paused'); setShowStatusModal(true); }}
                                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-bold transition-all"
                                >
                                    <Pause size={16} /> Pause Task
                                </button>
                            )}
                            {task.status === 'paused' && (
                                <button
                                    onClick={() => handleUpdateStatus('active')}
                                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold transition-all"
                                >
                                    <Play size={16} /> Resume Task
                                </button>
                            )}
                            {!isInactive && (
                                <button
                                    onClick={() => { setNewStatus('cancelled'); setShowStatusModal(true); }}
                                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-100 hover:bg-red-200 text-red-600 dark:bg-red-900/20 dark:hover:bg-red-900/30 dark:text-red-400 rounded-lg font-bold transition-all"
                                >
                                    <XCircle size={16} /> Cancel Task
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Reason Modal */}
            {showStatusModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowStatusModal(false)}>
                    <div className="bg-theme-secondary rounded-xl max-w-md w-full shadow-2xl border border-theme" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between p-6 border-b border-theme">
                            <h3 className="text-xl font-bold text-theme-primary">Reason for {newStatus}</h3>
                            <button onClick={() => setShowStatusModal(false)} className="p-1.5 text-theme-muted hover:text-theme-primary hover:bg-theme-tertiary rounded-lg transition-colors">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <p className="text-sm text-theme-muted">Please provide a reason for this status change.</p>
                            <textarea
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                placeholder="Type here..."
                                rows="4"
                                className="w-full px-3 py-2.5 bg-theme-primary border border-theme rounded-lg focus:ring-2 focus:ring-accent-gold/20 focus:border-accent-gold/30 outline-none transition-all text-sm text-theme-primary placeholder-theme-muted resize-none"
                            ></textarea>
                            <div className="flex gap-3 pt-2 border-t border-theme">
                                <button
                                    onClick={() => setShowStatusModal(false)}
                                    className="flex-1 px-4 py-2.5 bg-theme-secondary border border-theme text-theme-secondary rounded-lg hover:bg-theme-tertiary transition font-medium"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => handleUpdateStatus(newStatus, reason)}
                                    disabled={actionLoading}
                                    className={`flex-1 px-4 py-2.5 rounded-lg font-semibold text-white transition ${
                                        newStatus === 'cancelled' ? 'bg-red-600 hover:bg-red-700' : 'bg-amber-500 hover:bg-amber-600'
                                    }`}
                                >
                                    {actionLoading ? 'Updating...' : `Confirm ${newStatus}`}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PerformanceTaskDetailPage;
