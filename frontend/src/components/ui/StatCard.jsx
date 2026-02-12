import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

/**
 * StatCard Component
 * Displays statistics with trend indicators
 */
const StatCard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  trendLabel,
  iconColor = 'blue',
  className = '',
}) => {
  const iconColors = {
    blue: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
    green: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
    red: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
    yellow: 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400',
    purple: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
    gray: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  };

  const trendColor = trend > 0 ? 'text-green-600 dark:text-green-400' : trend < 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-600 dark:text-gray-400';
  const TrendIcon = trend > 0 ? TrendingUp : TrendingDown;

  return (
    <div className={`bg-theme-secondary rounded-2xl shadow-theme-sm border border-theme p-6 transition-all duration-300 hover:shadow-theme-md ${className}`.trim()}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-bold text-theme-muted uppercase tracking-wider mb-2">{title}</p>
          <p className="text-3xl font-black text-theme-primary tracking-tight">{value}</p>

          {(trend !== undefined || trendLabel) && (
            <div className="flex items-center gap-2 mt-3">
              {trend !== undefined && (
                <div className={`flex items-center gap-1 ${trendColor} bg-theme-tertiary px-2 py-1 rounded-full text-xs font-bold`}>
                  <TrendIcon className="w-3 h-3" />
                  <span>
                    {Math.abs(trend)}%
                  </span>
                </div>
              )}
              {trendLabel && (
                <span className="text-xs font-medium text-theme-muted">{trendLabel}</span>
              )}
            </div>
          )}

          {subtitle && !trend && !trendLabel && (
            <p className="text-xs font-medium text-theme-muted mt-2">{subtitle}</p>
          )}
        </div>

        {Icon && (
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${iconColors[iconColor] || iconColors.blue}`}>
            <Icon className="w-7 h-7" />
          </div>
        )}
      </div>
    </div>
  );
};

export default StatCard;
