import React, { useState } from 'react';

/**
 * Tabs Component
 * Tab navigation with content panels
 */
const Tabs = ({
  tabs,
  defaultTab = 0,
  onChange,
  className = '',
  variant = 'default',
}) => {
  const [activeTab, setActiveTab] = useState(defaultTab);

  const handleTabChange = (index) => {
    setActiveTab(index);
    if (onChange) {
      onChange(index);
    }
  };

  const variants = {
    default: {
      container: 'border-b border-gray-200',
      tab: (isActive) => `
        px-4 py-2 text-sm font-medium border-b-2 transition-colors
        ${isActive
          ? 'border-blue-600 text-blue-600'
          : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
        }
      `,
    },
    pills: {
      container: 'bg-gray-100 p-1 rounded-lg inline-flex',
      tab: (isActive) => `
        px-4 py-2 text-sm font-medium rounded-md transition-all
        ${isActive
          ? 'bg-white text-blue-600 shadow-sm'
          : 'text-gray-600 hover:text-gray-900'
        }
      `,
    },
  };

  const config = variants[variant] || variants.default;

  return (
    <div className={className}>
      {/* Tab Headers */}
      <div className={`flex gap-1 ${config.container}`.trim()}>
        {tabs.map((tab, index) => {
          const Icon = tab.icon;
          const isActive = activeTab === index;

          return (
            <button
              key={index}
              onClick={() => handleTabChange(index)}
              disabled={tab.disabled}
              className={`
                ${config.tab(isActive)}
                ${tab.disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                flex items-center gap-2
              `.trim()}
            >
              {Icon && <Icon className="w-4 h-4" />}
              <span>{tab.label}</span>
              {tab.badge && (
                <span className="ml-1 px-2 py-0.5 text-xs bg-gray-200 text-gray-700 rounded-full">
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="mt-4">
        {tabs[activeTab]?.content}
      </div>
    </div>
  );
};

export default Tabs;
