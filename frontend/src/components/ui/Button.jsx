import React from 'react';

/**
 * Button Component
 * Reusable button with multiple variants and sizes
 */
const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  disabled = false,
  loading = false,
  icon: Icon,
  iconPosition = 'left',
  type = 'button',
  className = '',
  onClick,
  ...props
}) => {
  // Base styles
  const baseStyles = 'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

  // Variant styles
  const variants = {
    primary: 'bg-accent-gold hover:bg-accent-goldDark text-white focus:ring-accent-gold/20 shadow-lg shadow-accent-gold/20',
    secondary: 'bg-theme-tertiary hover:bg-theme-primary text-theme-primary focus:ring-accent-gold/20 border border-theme',
    success: 'bg-green-600 hover:bg-green-700 text-white focus:ring-green-500/20 shadow-lg shadow-green-600/20',
    danger: 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-500/20 shadow-lg shadow-red-600/20',
    warning: 'bg-yellow-500 hover:bg-yellow-600 text-white focus:ring-yellow-400/20 shadow-lg shadow-yellow-500/20',
    outline: 'border-2 border-theme text-theme-primary hover:bg-theme-tertiary focus:ring-accent-gold/20',
    ghost: 'text-theme-secondary hover:bg-theme-tertiary focus:ring-accent-gold/20',
  };

  // Size styles
  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
    xl: 'px-8 py-4 text-lg',
  };

  // Icon size mapping
  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
    xl: 'w-6 h-6',
  };

  const buttonClasses = `
    ${baseStyles}
    ${variants[variant] || variants.primary}
    ${sizes[size] || sizes.md}
    ${fullWidth ? 'w-full' : ''}
    ${className}
  `.trim();

  return (
    <button
      type={type}
      className={buttonClasses}
      disabled={disabled || loading}
      onClick={onClick}
      {...props}
    >
      {loading ? (
        <>
          <svg
            className={`animate-spin -ml-1 mr-2 ${iconSizes[size]}`}
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          Loading...
        </>
      ) : (
        <>
          {Icon && iconPosition === 'left' && (
            <Icon className={`${iconSizes[size]} ${children ? 'mr-2' : ''}`} />
          )}
          {children}
          {Icon && iconPosition === 'right' && (
            <Icon className={`${iconSizes[size]} ${children ? 'ml-2' : ''}`} />
          )}
        </>
      )}
    </button>
  );
};

export default Button;
