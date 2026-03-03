import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

const StatsSummaryCard = ({
    title,
    value,
    subtitle,
    trend,
    trendLabel,
    icon: Icon,
    color = 'blue',
    size = 'default',
    className = ''
}) => {
    const colorVariants = {
        blue: {
            iconBg: 'bg-blue-100 dark:bg-blue-900/20',
            iconColor: 'text-blue-600 dark:text-blue-400'
        },
        green: {
            iconBg: 'bg-green-100 dark:bg-green-900/20',
            iconColor: 'text-green-600 dark:text-green-400'
        },
        purple: {
            iconBg: 'bg-purple-100 dark:bg-purple-900/20',
            iconColor: 'text-purple-600 dark:text-purple-400'
        },
        orange: {
            iconBg: 'bg-orange-100 dark:bg-orange-900/20',
            iconColor: 'text-orange-600 dark:text-orange-400'
        },
        red: {
            iconBg: 'bg-red-100 dark:bg-red-900/20',
            iconColor: 'text-red-600 dark:text-red-400'
        },
        cyan: {
            iconBg: 'bg-cyan-100 dark:bg-cyan-900/20',
            iconColor: 'text-cyan-600 dark:text-cyan-400'
        },
        amber: {
            iconBg: 'bg-amber-100 dark:bg-amber-900/20',
            iconColor: 'text-amber-600 dark:text-amber-400'
        },
        gold: {
            iconBg: 'bg-accent-gold/10',
            iconColor: 'text-accent-gold'
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
        if (trend > 0) return 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/20';
        if (trend < 0) return 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/20';
        return 'text-theme-muted bg-theme-tertiary';
    };

    return (
        <div className={`bg-theme-secondary rounded-lg border border-theme shadow-theme-sm ${sizes.padding} ${className}`}>
            <div className="flex items-start justify-between mb-4">
                {Icon && (
                    <div className={`${sizes.iconSize} rounded-lg ${colors.iconBg} flex items-center justify-center`}>
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
                <p className={`${sizes.titleSize} font-medium text-theme-muted uppercase tracking-wider mb-1`}>
                    {title}
                </p>
                <p className={`${sizes.valueSize} font-bold text-theme-primary`}>
                    {value}
                </p>
                {subtitle && (
                    <p className={`${sizes.subtitleSize} text-theme-muted mt-1`}>
                        {subtitle}
                    </p>
                )}
                {trendLabel && (
                    <p className="text-xs text-theme-muted mt-2">
                        {trendLabel}
                    </p>
                )}
            </div>
        </div>
    );
};

export default StatsSummaryCard;
