import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, Users, ChevronRight } from 'lucide-react';
import ProgressBar from './ProgressBar';

const PerformanceTaskCard = ({ task, onAction }) => {
    const navigate = useNavigate();

    const getStatusStyle = (status) => {
        switch (status) {
            case 'active': return 'bg-green-200 text-green-900 dark:bg-green-900/30 dark:text-green-300';
            case 'paused': return 'bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-300';
            case 'scheduled': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300';
            case 'completed': return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-300';
            case 'failed': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300';
            case 'cancelled': return 'bg-theme-tertiary text-theme-muted';
            default: return 'bg-theme-tertiary text-theme-muted';
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
        <div className="bg-theme-secondary rounded-lg border border-theme shadow-theme-sm hover:shadow-theme-md transition-shadow p-5 flex flex-col h-full">
            <div className="flex justify-between items-start mb-3">
                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${getStatusStyle(task.status)}`}>
                    {task.status.charAt(0).toUpperCase() + task.status.slice(1)}
                </span>
                <span className="text-xs text-theme-muted font-mono px-2 py-1 bg-theme-tertiary rounded">#{task.task_number}</span>
            </div>

            <h3 className="text-lg font-bold text-theme-primary mb-1 line-clamp-1">{task.title}</h3>
            <p className="text-sm text-theme-muted mb-4 line-clamp-2 min-h-[40px]">{task.description || 'No description provided.'}</p>

            <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="flex flex-col">
                    <span className="text-xs text-theme-muted font-medium">Type</span>
                    <span className="text-sm font-semibold text-theme-primary">{getTypeLabel(task.task_type)}</span>
                </div>
                <div className="flex flex-col text-right">
                    <span className="text-xs text-theme-muted font-medium">Target</span>
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

            <div className="flex items-center justify-between pt-4 border-t border-theme mt-auto">
                <div className="flex items-center gap-3 text-theme-muted">
                    <div className="flex items-center gap-1" title="Assigned Users">
                        <Users className="w-4 h-4" />
                        <span className="text-xs font-semibold">{task.assigned_count || 0}</span>
                    </div>
                </div>
                <button
                    onClick={() => navigate(`/performance-tasks/${task.id}`)}
                    className="text-xs font-semibold text-accent-gold hover:text-accent-goldDark flex items-center gap-1 transition-colors"
                >
                    View Details <ChevronRight size={14} />
                </button>
            </div>
        </div>
    );
};

export default PerformanceTaskCard;
