import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

/**
 * StatsSummaryCard Component
 * Displays a summary statistic with optional trend indicator
 */
const StatsSummaryCard = ({
    title,
    value,
    subtitle,
    trend,
    trendLabel,
    icon: Icon,
    color = 'blue',
    size = 'default', // 'default', 'small', 'large'
    className = ''
}) => {
    const colorVariants = {
        blue: {
            bg: 'bg-blue-50',
            iconBg: 'bg-blue-100',
            iconColor: 'text-blue-600',
            accent: 'text-blue-600'
        },
        green: {
            bg: 'bg-green-50',
            iconBg: 'bg-green-100',
            iconColor: 'text-green-600',
            accent: 'text-green-600'
        },
        purple: {
            bg: 'bg-purple-50',
            iconBg: 'bg-purple-100',
            iconColor: 'text-purple-600',
            accent: 'text-purple-600'
        },
        orange: {
            bg: 'bg-orange-50',
            iconBg: 'bg-orange-100',
            iconColor: 'text-orange-600',
            accent: 'text-orange-600'
        },
        red: {
            bg: 'bg-red-50',
            iconBg: 'bg-red-100',
            iconColor: 'text-red-600',
            accent: 'text-red-600'
        },
        cyan: {
            bg: 'bg-cyan-50',
            iconBg: 'bg-cyan-100',
            iconColor: 'text-cyan-600',
            accent: 'text-cyan-600'
        },
        gray: {
            bg: 'bg-gray-50',
            iconBg: 'bg-gray-100',
            iconColor: 'text-gray-600',
            accent: 'text-gray-600'
        }
    };

    const sizeVariants = {
        small: {
            padding: 'p-4',
            iconSize: 'w-8 h-8',
            iconInnerSize: 'w-4 h-4',
            titleSize: 'text-xs',
            valueSize: 'text-xl',
            subtitleSize: 'text-xs'
        },
        default: {
            padding: 'p-6',
            iconSize: 'w-12 h-12',
            iconInnerSize: 'w-6 h-6',
            titleSize: 'text-sm',
            valueSize: 'text-3xl',
            subtitleSize: 'text-sm'
        },
        large: {
            padding: 'p-8',
            iconSize: 'w-16 h-16',
            iconInnerSize: 'w-8 h-8',
            titleSize: 'text-base',
            valueSize: 'text-4xl',
            subtitleSize: 'text-base'
        }
    };

    const colors = colorVariants[color] || colorVariants.blue;
    const sizes = sizeVariants[size] || sizeVariants.default;

    const getTrendIcon = () => {
        if (trend === undefined || trend === null) return null;
        if (trend > 0) return <TrendingUp className="w-4 h-4" />;
        if (trend < 0) return <TrendingDown className="w-4 h-4" />;
        return <Minus className="w-4 h-4" />;
    };

    const getTrendColor = () => {
        if (trend === undefined || trend === null) return '';
        if (trend > 0) return 'text-green-600 bg-green-50';
        if (trend < 0) return 'text-red-600 bg-red-50';
        return 'text-gray-600 bg-gray-50';
    };

    return (
        <div className={`bg-white rounded-xl border border-gray-200 ${sizes.padding} ${className}`}>
            <div className="flex items-start justify-between mb-4">
                {Icon && (
                    <div className={`${sizes.iconSize} rounded-xl ${colors.iconBg} flex items-center justify-center`}>
                        <Icon className={`${sizes.iconInnerSize} ${colors.iconColor}`} />
                    </div>
                )}
                {trend !== undefined && trend !== null && (
                    <div className={`flex items-center gap-1 px-2 py-1 rounded-full ${getTrendColor()}`}>
                        {getTrendIcon()}
                        <span className="text-xs font-semibold">{Math.abs(trend)}%</span>
                    </div>
                )}
            </div>
            <div>
                <p className={`${sizes.titleSize} font-medium text-gray-500 uppercase tracking-wider mb-1`}>
                    {title}
                </p>
                <p className={`${sizes.valueSize} font-bold text-gray-900`}>
                    {value}
                </p>
                {subtitle && (
                    <p className={`${sizes.subtitleSize} text-gray-500 mt-1`}>
                        {subtitle}
                    </p>
                )}
                {trendLabel && (
                    <p className="text-xs text-gray-400 mt-2">
                        {trendLabel}
                    </p>
                )}
            </div>
        </div>
    );
};

export default StatsSummaryCard;
