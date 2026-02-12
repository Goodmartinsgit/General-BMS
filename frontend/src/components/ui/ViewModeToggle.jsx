import React from 'react';
import { Grid, List, LayoutGrid, AlignJustify } from 'lucide-react';

/**
 * ViewModeToggle Component
 * Toggle between different view modes (grid, list, compact, detailed)
 */
const ViewModeToggle = ({
  mode = 'grid',
  onModeChange,
  modes = ['grid', 'list'],
  className = '',
}) => {
  const modeIcons = {
    grid: Grid,
    list: AlignJustify,
    compact: LayoutGrid,
    detailed: List,
  };

  const modeLabels = {
    grid: 'Grid View',
    list: 'List View',
    compact: 'Compact View',
    detailed: 'Detailed View',
  };

  return (
    <div className={`inline-flex bg-gray-100 rounded-lg p-1 ${className}`.trim()}>
      {modes.map((viewMode) => {
        const Icon = modeIcons[viewMode];
        const isActive = mode === viewMode;

        return (
          <button
            key={viewMode}
            onClick={() => onModeChange(viewMode)}
            className={`
              px-3 py-1.5 rounded-md transition-all duration-200
              ${isActive
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
              }
            `.trim()}
            title={modeLabels[viewMode]}
          >
            <Icon className="w-4 h-4" />
          </button>
        );
      })}
    </div>
  );
};

export default ViewModeToggle;
