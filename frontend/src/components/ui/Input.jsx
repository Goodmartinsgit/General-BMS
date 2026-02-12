import React, { forwardRef } from 'react';

/**
 * Input Component
 * Reusable input field with label, error handling, and icons
 */
const Input = forwardRef(({
  label,
  type = 'text',
  placeholder,
  value,
  onChange,
  onBlur,
  error,
  helperText,
  required = false,
  disabled = false,
  icon: Icon,
  iconPosition = 'left',
  className = '',
  inputClassName = '',
  name,
  id,
  ...props
}, ref) => {
  const inputId = id || name;

  const baseInputStyles = 'w-full px-3 py-2 border rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 disabled:bg-theme-tertiary disabled:cursor-not-allowed bg-theme-primary text-theme-primary placeholder-gray-400';

  const inputStyles = error
    ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
    : 'border-theme focus:border-blue-500 focus:ring-blue-500';

  const iconPaddingLeft = Icon && iconPosition === 'left' ? 'pl-10' : '';
  const iconPaddingRight = Icon && iconPosition === 'right' ? 'pr-10' : '';

  return (
    <div className={`space-y-1 ${className}`}>
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-theme-secondary"
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      <div className="relative">
        {Icon && iconPosition === 'left' && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Icon className="h-5 w-5 text-gray-400" />
          </div>
        )}

        <input
          ref={ref}
          type={type}
          id={inputId}
          name={name}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          className={`
            ${baseInputStyles}
            ${inputStyles}
            ${iconPaddingLeft}
            ${iconPaddingRight}
            ${inputClassName}
          `.trim()}
          {...props}
        />

        {Icon && iconPosition === 'right' && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <Icon className="h-5 w-5 text-gray-400" />
          </div>
        )}
      </div>

      {(error || helperText) && (
        <p className={`text-sm ${error ? 'text-red-600' : 'text-gray-500'}`}>
          {error || helperText}
        </p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;
