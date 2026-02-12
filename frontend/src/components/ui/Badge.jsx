import React from 'react';

/**
 * Badge Component
 * Reusable badge for status indicators
 */
const Badge = ({
  children,
  variant = 'default',
  size = 'md',
  rounded = false,
  icon: Icon,
  className = '',
}) => {
  const baseStyles = 'inline-flex items-center font-medium';

  const variants = {
    default: 'bg-gray-100 text-gray-800',
    primary: 'bg-blue-100 text-blue-800',
    success: 'bg-green-100 text-green-800',
    warning: 'bg-yellow-100 text-yellow-800',
    danger: 'bg-red-100 text-red-800',
    info: 'bg-cyan-100 text-cyan-800',
    purple: 'bg-purple-100 text-purple-800',
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-0.5 text-sm',
    lg: 'px-3 py-1 text-base',
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  const roundedStyle = rounded ? 'rounded-full' : 'rounded';

  return (
    <span
      className={`
        ${baseStyles}
        ${variants[variant] || variants.default}
        ${sizes[size] || sizes.md}
        ${roundedStyle}
        ${className}
      `.trim()}
    >
      {Icon && <Icon className={`${iconSizes[size]} ${children ? 'mr-1' : ''}`} />}
      {children}
    </span>
  );
};

export default Badge;
