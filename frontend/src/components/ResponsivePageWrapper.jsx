import React from 'react';

/**
 * ResponsivePageWrapper - A wrapper component that applies consistent mobile-responsive styles
 * to all pages in the application
 */
const ResponsivePageWrapper = ({ children, className = '' }) => {
    return (
        <div className={`w-full ${className}`}>
            {children}
        </div>
    );
};

/**
 * PageHeader - Responsive page header component
 */
export const PageHeader = ({ 
    title, 
    subtitle, 
    actions, 
    className = '' 
}) => {
    return (
        <div className={`bg-theme-secondary shadow-theme-sm mb-3 sm:mb-4 md:mb-6 border-b border-theme ${className}`}>
            <div className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 md:py-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-3 md:gap-4">
                    <div className="flex-1 min-w-0">
                        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-theme-primary truncate">
                            {title}
                        </h1>
                        {subtitle && (
                            <p className="mt-0.5 sm:mt-1 text-xs sm:text-sm text-theme-secondary">
                                {subtitle}
                            </p>
                        )}
                    </div>
                    {actions && (
                        <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
                            {actions}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

/**
 * PageContent - Responsive page content container
 */
export const PageContent = ({ children, className = '' }) => {
    return (
        <div className={`px-3 sm:px-4 md:px-6 py-3 sm:py-4 md:py-6 ${className}`}>
            {children}
        </div>
    );
};

/**
 * ResponsiveCard - Mobile-friendly card component
 */
export const ResponsiveCard = ({ 
    children, 
    className = '',
    padding = true 
}) => {
    return (
        <div className={`
            bg-theme-secondary rounded-lg border border-theme shadow-theme-sm
            ${padding ? 'p-3 sm:p-4 md:p-6' : ''}
            ${className}
        `}>
            {children}
        </div>
    );
};

/**
 * ResponsiveGrid - Mobile-friendly grid layout
 */
export const ResponsiveGrid = ({ 
    children, 
    cols = 3,
    className = '' 
}) => {
    const gridClasses = {
        2: 'grid-cols-1 sm:grid-cols-2',
        3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
        4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
        5: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5'
    };

    return (
        <div className={`grid ${gridClasses[cols] || gridClasses[3]} gap-3 sm:gap-4 md:gap-6 ${className}`}>
            {children}
        </div>
    );
};

/**
 * ResponsiveButton - Touch-friendly button
 */
export const ResponsiveButton = ({ 
    children, 
    className = '',
    size = 'md',
    ...props 
}) => {
    const sizeClasses = {
        sm: 'px-2 py-1 text-xs sm:px-3 sm:py-1.5 sm:text-sm',
        md: 'px-3 py-1.5 text-xs sm:px-4 sm:py-2 sm:text-sm',
        lg: 'px-4 py-2 text-sm sm:px-6 sm:py-3 sm:text-base'
    };

    return (
        <button 
            className={`
                inline-flex items-center justify-center gap-1.5 sm:gap-2
                font-semibold rounded-lg transition-colors
                min-h-[44px] sm:min-h-0
                ${sizeClasses[size]}
                ${className}
            `}
            {...props}
        >
            {children}
        </button>
    );
};

/**
 * ResponsiveTable - Mobile-friendly table wrapper
 */
export const ResponsiveTable = ({ children, className = '' }) => {
    return (
        <div className={`overflow-x-auto -mx-3 sm:mx-0 ${className}`}>
            <div className="inline-block min-w-full align-middle">
                <div className="overflow-hidden border border-theme rounded-lg">
                    {children}
                </div>
            </div>
        </div>
    );
};

export default ResponsivePageWrapper;
