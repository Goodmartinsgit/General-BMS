import React, { useState, useRef, useEffect } from 'react';
import { Palette, Check, Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const ThemeSwitcher = ({ collapsed = false, variant = 'default' }) => {
  const { theme, persistTheme, themes, currentTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleThemeSelect = (themeId) => {
    persistTheme(themeId);  // Save to localStorage + backend
    setIsOpen(false);
  };

  if (variant === 'navbar') {
    return (
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 hover:bg-theme-tertiary rounded-lg transition-colors"
          title={`Theme: ${currentTheme.name}`}
        >
          {theme === 'light' ? (
            <Sun className="w-5 h-5 text-amber-500" />
          ) : (
            <Moon className="w-5 h-5 text-blue-400" />
          )}
        </button>

        {isOpen && (
          <div className="absolute right-0 top-full mt-2 z-50 bg-theme-secondary border border-theme rounded-xl shadow-theme-lg py-2 min-w-[200px]">
            <div className="px-3 py-2 border-b border-theme">
              <span className="text-xs font-semibold text-theme-muted uppercase tracking-wider">
                Choose Theme
              </span>
            </div>
            
            {themes.map((t) => (
              <button
                key={t.id}
                onClick={() => handleThemeSelect(t.id)}
                className={`
                  w-full flex items-center gap-3 px-3 py-2.5
                  hover:bg-theme-tertiary transition-colors
                  ${theme === t.id ? 'bg-theme-tertiary' : ''}
                `}
              >
                <span className="flex-1 text-left text-sm text-theme-primary font-medium">
                  {t.icon} {t.name}
                </span>
                
                {theme === t.id && (
                  <Check className="w-4 h-4 text-theme-accent" />
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`
          flex items-center gap-2 w-full px-3 py-2.5 rounded-lg
          bg-theme-tertiary hover:bg-theme-accent/20
          text-theme-secondary hover:text-theme-primary
          transition-all duration-200
          ${collapsed ? 'justify-center' : 'justify-between'}
        `}
        title={collapsed ? `Theme: ${currentTheme.name}` : undefined}
      >
        <div className="flex items-center gap-2">
          <div 
            className="w-5 h-5 rounded-full border-2 border-theme"
            style={{ backgroundColor: currentTheme.preview.bg }}
          />
          {!collapsed && (
            <span className="text-sm font-medium">{currentTheme.name}</span>
          )}
        </div>
        {!collapsed && (
          <Palette className="w-4 h-4" />
        )}
      </button>

      {isOpen && (
        <div 
          className={`
            absolute z-50 bg-theme-secondary border border-theme rounded-lg shadow-theme-lg
            py-2 min-w-[180px]
            ${collapsed ? 'left-full ml-2 bottom-0' : 'bottom-full mb-2 left-0 right-0'}
          `}
        >
          <div className="px-3 py-1.5 border-b border-theme mb-1">
            <span className="text-xs font-semibold text-theme-muted uppercase tracking-wider">
              Choose Theme
            </span>
          </div>
          
          {themes.map((t) => (
            <button
              key={t.id}
              onClick={() => handleThemeSelect(t.id)}
              className={`
                w-full flex items-center gap-3 px-3 py-2
                hover:bg-theme-tertiary transition-colors
                ${theme === t.id ? 'bg-theme-tertiary' : ''}
              `}
            >
              <span className="flex-1 text-left text-sm text-theme-primary">
                {t.icon} {t.name}
              </span>
              
              {theme === t.id && (
                <Check className="w-4 h-4 text-theme-accent" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ThemeSwitcher;
