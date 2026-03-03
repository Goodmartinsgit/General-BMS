import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

const KPICard = ({
  title,
  value,
  change,
  changeType = 'neutral',
  valueColorType = null, // 'positive' (green), 'negative' (red), null (theme default)
  icon: Icon,
  iconColor = 'bg-accent-gold',
  loading = false,
  error = null,
  onClick = null,
  label
}) => {
  const getChangeColor = () => {
    switch (changeType) {
      case 'positive': return 'text-green-500';
      case 'negative': return 'text-red-500';
      default: return 'text-theme-muted';
    }
  };

  const getChangeIcon = () => {
    switch (changeType) {
      case 'positive': return <TrendingUp className="w-3 h-3 inline-block ml-1" />;
      case 'negative': return <TrendingDown className="w-3 h-3 inline-block ml-1" />;
      default: return <Minus className="w-3 h-3 inline-block ml-1" />;
    }
  };

  if (loading) {
    return (
      <div className="bg-theme-secondary rounded-lg shadow-theme-md p-4 md:p-6 animate-pulse border border-theme">
        <div className="flex items-center justify-between mb-3 md:mb-4">
          <div className={`p-2 md:p-3 rounded-lg ${iconColor} opacity-50`}>
            <div className="h-5 w-5 md:h-6 md:w-6"></div>
          </div>
          <div className="h-4 w-12 bg-theme-tertiary rounded"></div>
        </div>
        <div className="h-4 w-20 bg-theme-tertiary rounded mb-2"></div>
        <div className="h-8 w-32 bg-theme-tertiary rounded"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-theme-secondary rounded-lg shadow-theme-md p-4 md:p-6 border-2 border-red-500">
        <div className="flex items-center justify-between mb-3">
          {Icon && (
            <div className="p-2 md:p-3 rounded-lg bg-red-100">
              <Icon className="h-5 w-5 md:h-6 md:w-6 text-red-600" />
            </div>
          )}
        </div>
        <h3 className="text-theme-muted text-xs font-medium mb-1">{title}</h3>
        <p className="text-sm text-red-500">Error loading data</p>
      </div>
    );
  }

  return (
    <div
      className={`bg-theme-secondary rounded-lg shadow-theme-md p-4 md:p-6 hover:shadow-theme-lg transition-all border border-theme hover:border-accent-gold ${
        onClick ? 'cursor-pointer' : ''
      }`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between mb-3 md:mb-4">
        {Icon && (
          <div className={`p-2 md:p-3 rounded-lg ${iconColor}`}>
            <Icon className="h-5 w-5 md:h-6 md:w-6 text-white" />
          </div>
        )}
        {change && (
          <span className={`text-xs md:text-sm font-medium ${getChangeColor()} flex items-center`}>
            {change}
            {getChangeIcon()}
          </span>
        )}
      </div>
      <h3 className="text-theme-muted text-fluid-sm font-medium mb-1">{title}</h3>
      <p className={`text-fluid-stat font-bold ${
        valueColorType === 'positive' ? 'text-green-600' :
        valueColorType === 'negative' ? 'text-red-600' :
        'text-theme-primary'
      }`}>{value}</p>
      {label && (
        <p className="text-xs text-theme-muted mt-2">{label}</p>
      )}
    </div>
  );
};

export default KPICard;
