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
      container: 'border-b border-theme',
      tab: (isActive) => `
        px-4 py-2 text-sm font-medium border-b-2 transition-colors
        ${isActive
          ? 'border-accent-gold text-accent-gold'
          : 'border-transparent text-theme-muted hover:text-theme-primary hover:border-theme'
        }
      `,
    },
    pills: {
      container: 'bg-theme-tertiary p-1 rounded-lg inline-flex',
      tab: (isActive) => `
        px-4 py-2 text-sm font-medium rounded-md transition-all
        ${isActive
          ? 'bg-accent-gold text-white shadow-sm'
          : 'text-theme-muted hover:text-theme-primary'
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
                <span className="ml-1 px-2 py-0.5 text-xs bg-accent-gold/10 text-accent-gold rounded-full border border-accent-gold/20">
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
