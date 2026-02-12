import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { LogOut, User, Menu, Moon, Sun, Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Navbar = ({ onMenuClick }) => {
    const { user, logout } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const navigate = useNavigate();

    const handleLogout = () => {
        if (window.confirm('Are you sure you want to logout?')) {
            logout();
            navigate('/login');
        }
    };

    return (
        <nav className="bg-theme-secondary border-b border-theme px-4 md:px-6 py-4 transition-colors sticky top-0 z-30">
            <div className="flex items-center justify-between">
                {/* Left side - Menu button (mobile) + Greeting */}
                <div className="flex items-center gap-4">
                    {/* Hamburger Menu - Mobile Only */}
                    <button
                        onClick={onMenuClick}
                        className="lg:hidden p-2 hover:bg-theme-tertiary rounded-lg transition-colors text-theme-primary"
                    >
                        <Menu className="w-6 h-6" />
                    </button>

                    {/* Greeting */}
                    <div>
                        <h2 className="text-sm md:text-xl font-semibold text-theme-primary">
                            Welcome back, {user?.full_name || 'User'}!
                        </h2>
                        <p className="text-xs md:text-sm text-theme-secondary capitalize">
                            {user?.role_name || user?.role}
                        </p>
                    </div>
                </div>

                {/* Right side - Actions */}
                <div className="flex items-center gap-2 md:gap-4">
                    
                    {/* Theme Switcher */}
                    <button
                        onClick={() => toggleTheme(theme === 'light' ? 'midnight' : 'light')}
                        className="p-2 rounded-lg text-theme-secondary hover:bg-theme-tertiary transition-colors"
                        title="Toggle Theme"
                    >
                        {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                    </button>

                    {/* Notifications (Placeholder) */}
                    <button className="p-2 rounded-lg text-theme-secondary hover:bg-theme-tertiary transition-colors relative">
                        <Bell className="w-5 h-5" />
                        <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-gray-800"></span>
                    </button>

                    {/* Profile - Hidden on small screens */}
                    <div className="hidden md:flex items-center gap-3 px-3 py-2 hover:bg-theme-tertiary rounded-lg transition-colors cursor-pointer">
                        <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                            <User className="w-5 h-5 text-blue-600 dark:text-blue-300" />
                        </div>
                        <span className="text-sm font-medium text-theme-primary">
                            {user?.full_name}
                        </span>
                    </div>

                    {/* Logout */}
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 px-3 md:px-4 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    >
                        <LogOut className="w-5 h-5" />
                        <span className="hidden sm:inline text-sm font-medium">Logout</span>
                    </button>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
