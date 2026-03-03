import React from 'react';

const LoadingSpinner = ({
  size = 'md',
  text,
  fullScreen = false,
  className = '',
}) => {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
  };

  const spinner = (
    <div className={`border-2 border-theme border-t-accent-gold rounded-full animate-spin ${sizes[size]}`} />
  );

  const content = (
    <div className={`flex flex-col items-center justify-center gap-3 ${className}`.trim()}>
      {spinner}
      {text && <p className="text-sm text-theme-muted">{text}</p>}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-theme-primary/90">
        {content}
      </div>
    );
  }

  return content;
};

export default LoadingSpinner;
