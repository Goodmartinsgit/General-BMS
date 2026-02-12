import React from 'react';

/**
 * Card Component
 * Reusable card container with header and optional hover effects
 */
const Card = ({
  children,
  title,
  subtitle,
  headerAction,
  footer,
  variant = 'default',
  hoverable = false,
  className = '',
  bodyClassName = '',
}) => {
  const baseStyles = 'bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden';

  const variants = {
    default: '',
    bordered: 'border-2',
    elevated: 'shadow-lg',
  };

  const hoverStyles = hoverable ? 'hover:shadow-lg transition-shadow duration-200 cursor-pointer' : '';

  return (
    <div className={`${baseStyles} ${variants[variant]} ${hoverStyles} ${className}`.trim()}>
      {/* Header */}
      {(title || headerAction) && (
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div>
              {title && <h3 className="text-lg font-semibold text-gray-900">{title}</h3>}
              {subtitle && <p className="text-sm text-gray-600 mt-1">{subtitle}</p>}
            </div>
            {headerAction && <div>{headerAction}</div>}
          </div>
        </div>
      )}

      {/* Body */}
      <div className={`p-6 ${bodyClassName}`.trim()}>{children}</div>

      {/* Footer */}
      {footer && (
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          {footer}
        </div>
      )}
    </div>
  );
};

export default Card;
