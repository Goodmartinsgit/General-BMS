import React from 'react';
import { Loader2 } from 'lucide-react';

const PremiumButton = ({
  children,
  icon: Icon,
  variant = 'primary', // primary, secondary, tertiary, danger
  size = 'md', // sm, md, lg
  loading = false,
  className = '',
  ...props
}) => {
  const variants = {
    primary: 'bg-theme-accent text-white shadow-theme-md hover:shadow-theme-lg hover:scale-[1.02] border-transparent',
    secondary: 'bg-theme-tertiary text-theme-secondary border-theme hover:bg-theme-secondary hover:border-theme-accent/30',
    tertiary: 'bg-transparent text-theme-muted hover:text-theme-primary border-transparent',
    danger: 'bg-red-500 text-white shadow-red-500/20 hover:shadow-red-500/40 hover:scale-[1.02] border-transparent'
  };

  const sizes = {
    sm: 'px-4 py-2 text-[10px]',
    md: 'px-6 py-3.5 text-xs',
    lg: 'px-8 py-4.5 text-sm'
  };

  return (
    <button
      disabled={loading || props.disabled}
      className={`
        relative flex items-center justify-center gap-2.5 font-black uppercase tracking-[0.15em] rounded-[1.25rem] border transition-all duration-300 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none group
        ${variants[variant]}
        ${sizes[size]}
        ${className}
      `}
      {...props}
    >
      {loading ? (
        <Loader2 className="w-5 h-5 animate-spin" />
      ) : (
        <>
          {Icon && <Icon className="w-4 h-4 transition-transform group-hover:rotate-12" />}
          {children}
        </>
      )}
      
      {/* Subtle shine effect for primary/danger buttons */}
      {(variant === 'primary' || variant === 'danger') && (
        <div className="absolute inset-0 w-full h-full overflow-hidden rounded-[1.25rem] pointer-events-none">
          <div className="absolute top-0 -left-[100%] w-1/2 h-full bg-white/20 skew-x-[45deg] transition-all duration-1000 group-hover:left-[150%]"></div>
        </div>
      )}
    </button>
  );
};

export default PremiumButton;
