import React from 'react';

const ProgressBar = ({ 
    current = 0, 
    target = 100, 
    targetMin = null, 
    targetMax = null, 
    unit = '', 
    size = 'md', 
    showPercentage = true, 
    showValues = true 
}) => {
    const percentage = Math.min(Math.round((current / target) * 100), 100);
    const isOverTarget = current >= target;
    
    // Sizes
    const heightMap = {
        sm: 'h-2',
        md: 'h-4',
        lg: 'h-6'
    };

    const bgColor = isOverTarget ? 'bg-green-500' : 'bg-blue-500';

    return (
        <div className="w-full">
            <div className="flex justify-between items-end mb-1">
                {showValues && (
                    <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                        {current.toLocaleString()} / {target.toLocaleString()} {unit}
                    </span>
                )}
                {showPercentage && (
                    <span className={`text-xs font-bold ${isOverTarget ? 'text-green-600' : 'text-blue-600'}`}>
                        {Math.round((current / target) * 100)}%
                    </span>
                )}
            </div>
            
            <div className={`w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden ${heightMap[size]}`}>
                <div 
                    className={`${bgColor} h-full transition-all duration-500 ease-out flex items-center justify-center`}
                    style={{ width: `${percentage}%` }}
                >
                    {size === 'lg' && percentage > 15 && (
                        <span className="text-[10px] text-white font-bold drop-shadow-sm">
                            {percentage}%
                        </span>
                    )}
                </div>
            </div>

            {(targetMin || targetMax) && (
                <div className="flex justify-between mt-1 px-1">
                    {targetMin && (
                        <span className="text-[10px] text-gray-500">Min: {targetMin.toLocaleString()}</span>
                    )}
                    {targetMax && (
                        <span className="text-[10px] text-gray-500">Max: {targetMax.toLocaleString()}</span>
                    )}
                </div>
            )}
        </div>
    );
};

export default ProgressBar;
