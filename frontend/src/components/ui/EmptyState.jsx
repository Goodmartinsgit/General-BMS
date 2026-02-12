import React from 'react';
import { Package, FileX, Search, AlertCircle } from 'lucide-react';
import Button from './Button';

/**
 * EmptyState Component
 * Displays when there's no data to show
 */
const EmptyState = ({
  icon: CustomIcon,
  title = 'No data found',
  description,
  action,
  actionLabel,
  variant = 'default',
  className = '',
}) => {
  // Default icons for different variants
  const defaultIcons = {
    default: Package,
    search: Search,
    error: AlertCircle,
    empty: FileX,
  };

  const Icon = CustomIcon || defaultIcons[variant] || defaultIcons.default;

  return (
    <div className={`flex flex-col items-center justify-center py-12 px-4 text-center ${className}`.trim()}>
      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
        <Icon className="w-8 h-8 text-gray-400" />
      </div>

      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>

      {description && (
        <p className="text-sm text-gray-600 max-w-md mb-6">{description}</p>
      )}

      {action && actionLabel && (
        <Button onClick={action} variant="primary">
          {actionLabel}
        </Button>
      )}
    </div>
  );
};

export default EmptyState;
