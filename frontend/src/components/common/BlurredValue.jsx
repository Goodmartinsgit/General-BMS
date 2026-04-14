import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

const BlurredValue = ({ value, className = '' }) => {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <span className={`transition-all duration-300 font-mono tracking-wider ${isVisible ? '' : 'blur-md select-none'}`}>
        {isVisible ? value : '***,***.**'}
      </span>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setIsVisible(!isVisible);
        }}
        className="text-theme-muted hover:text-theme-primary transition-colors focus:outline-none"
        title={isVisible ? "Hide value" : "Show value"}
      >
        {isVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
      </button>
    </div>
  );
};

export default BlurredValue;
