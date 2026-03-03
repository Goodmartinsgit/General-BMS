import React from 'react';
import { ChevronDown } from 'lucide-react';

const PremiumSelect = ({
  label,
  icon: Icon,
  error,
  options = [],
  className = '',
  ...props
}) => {
  return (
    <div className={`space-y-3 w-full animate-in fade-in duration-500 ${className}`}>
      {label && (
        <label className="flex items-center gap-2 text-[10px] font-black text-theme-muted uppercase tracking-[0.25em] ml-1">
          {label}
        </label>
      )}
      <div className="relative group">
        {Icon && (
          <div className="absolute left-5 top-1/2 -translate-y-1/2 text-theme-muted group-focus-within:text-theme-accent transition-colors duration-300 pointer-events-none z-10">
            <Icon size={18} />
          </div>
        )}
        <select
          className={`
            w-full py-4 text-sm font-bold bg-theme-primary border rounded-[1.25rem] transition-all duration-300
            appearance-none cursor-pointer focus:ring-8 focus:ring-theme-accent/5 focus:bg-theme-secondary outline-none
            ${Icon ? 'pl-14 pr-12' : 'pl-6 pr-12'}
            ${error 
              ? 'border-red-500/50 focus:border-red-500 text-red-500' 
              : 'border-theme-accent/5 focus:border-theme-accent/40 text-theme-primary'
            }
          `}
          {...props}
        >
          {options.map((opt, idx) => (
            <option key={idx} value={opt.value} className="bg-theme-secondary text-theme-primary font-bold">
              {opt.label}
            </option>
          ))}
        </select>
        
        <div className="absolute right-5 top-1/2 -translate-y-1/2 text-theme-muted pointer-events-none group-focus-within:text-theme-accent group-hover:translate-y-[-40%] transition-transform">
          <ChevronDown size={18} />
        </div>

        {/* Glow effect */}
        <div className="absolute inset-0 -z-10 bg-theme-accent/0 group-hover:bg-theme-accent/2 transition-colors duration-700 rounded-[1.25rem] blur-xl opacity-0 group-focus-within:opacity-100"></div>
      </div>
      {error && (
        <p className="text-[10px] text-red-500 font-black uppercase tracking-widest ml-1 animate-in slide-in-from-left-2">
          {error}
        </p>
      )}
    </div>
  );
};

export default PremiumSelect;
