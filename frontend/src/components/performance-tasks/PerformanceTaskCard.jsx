import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FiClock, FiUsers, FiTrendingUp, FiCheckCircle, FiXCircle, FiPlay, FiPause } from 'react-icons/fi';
import ProgressBar from './ProgressBar';

const PerformanceTaskCard = ({ task, onAction }) => {
    const navigate = useNavigate();
    
    const getStatusStyle = (status) => {
        switch (status) {
            case 'active': return 'bg-green-100 text-green-800 border-green-200';
            case 'paused': return 'bg-amber-100 text-amber-800 border-amber-200';
            case 'scheduled': return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'completed': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
            case 'failed': return 'bg-red-100 text-red-800 border-red-200';
            case 'cancelled': return 'bg-gray-100 text-gray-800 border-gray-200';
            default: return 'bg-gray-50 text-gray-600 border-gray-100';
        }
    };

    const getTypeLabel = (type) => {
        const types = {
            sales_count: 'Sales Count',
            sales_amount: 'Sales Amount',
            tiles_quantity: 'Tiles Quantity',
            accessories_quantity: 'Accessories Quantity',
            general_product_quantity: 'Product Quantity'
        };
        return types[type] || type;
    };

    const unit = task.task_type === 'sales_amount' ? 'NGN' : 
                 task.task_type === 'sales_count' ? 'sales' : 
                 task.task_type === 'tiles_quantity' ? 'cartons' : 'units';

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow p-5 flex flex-col h-full">
            <div className="flex justify-between items-start mb-3">
                <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${getStatusStyle(task.status)}`}>
                    {task.status.toUpperCase()}
                </span>
                <span className="text-xs text-gray-400 font-mono">#{task.task_number}</span>
            </div>

            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1 line-clamp-1">{task.title}</h3>
            <p className="text-sm text-gray-500 mb-4 line-clamp-2 min-h-[40px]">{task.description || 'No description provided.'}</p>

            <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="flex flex-col">
                    <span className="text-[10px] text-gray-400 font-bold uppercase">Type</span>
                    <span className="text-sm font-semibold">{getTypeLabel(task.task_type)}</span>
                </div>
                <div className="flex flex-col text-right">
                    <span className="text-[10px] text-gray-400 font-bold uppercase">Target</span>
                    <span className="text-sm font-bold text-accent-gold">{parseFloat(task.target_value).toLocaleString()} {unit}</span>
                </div>
            </div>

            <div className="mb-4 flex-grow">
                <ProgressBar 
                    current={parseFloat(task.current_total_progress || 0)} 
                    target={parseFloat(task.target_value)} 
                    unit={unit}
                    size="md"
                />
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-gray-50 dark:border-gray-700 mt-auto">
                <div className="flex items-center gap-3 text-gray-500">
                    <div className="flex items-center gap-1" title="Assigned Users">
                        <FiUsers className="w-4 h-4" />
                        <span className="text-xs font-bold">{task.assigned_count || 0}</span>
                    </div>
                </div>
                <button 
                    onClick={() => navigate(`/performance-tasks/${task.id}`)}
                    className="text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline"
                >
                    VIEW DETAILS
                </button>
            </div>
        </div>
    );
};

export default PerformanceTaskCard;
