import React from 'react';

const PageHeader = ({
  title,
  subtitle,
  actions,
  badge,
  icon: Icon
}) => {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
      <div className="flex items-start gap-2 sm:gap-3 md:gap-4">
        {Icon && (
          <div className="hidden sm:flex w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-accent-gold text-white items-center justify-center flex-shrink-0">
            <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-theme-primary">{title}</h1>
            {badge && (
              <span className="bg-accent-gold/10 text-accent-gold px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-medium border border-accent-gold/20">
                {badge}
              </span>
            )}
          </div>
          {subtitle && (
            <p className="text-theme-muted text-xs sm:text-sm mt-0.5 sm:mt-1">{subtitle}</p>
          )}
        </div>
      </div>

      {actions && (
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          {actions}
        </div>
      )}
    </div>
  );
};

export default PageHeader;
