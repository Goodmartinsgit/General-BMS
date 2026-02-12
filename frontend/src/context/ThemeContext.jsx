import React, { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext();

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};

export const ThemeProvider = ({ children }) => {
    // Check local storage or system preference
    const [theme, setTheme] = useState(() => {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme) return savedTheme;
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'midnight' : 'light';
    });

    useEffect(() => {
        const root = window.document.documentElement;
        
        // Remove old theme classes
        root.classList.remove('theme-light', 'theme-midnight', 'theme-charcoal', 'theme-ocean', 'dark');

        if (theme === 'light') {
            root.classList.add('theme-light');
            root.classList.remove('dark');
        } else {
            root.classList.add(`theme-${theme}`);
            root.classList.add('dark');
        }

        localStorage.setItem('theme', theme);
    }, [theme]);

    const toggleTheme = (newTheme) => {
        setTheme(newTheme);
    };

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};
