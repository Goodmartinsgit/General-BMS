import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useBranch } from '../../context/BranchContext';
import { LogOut, User, Menu, Bell, Settings as SettingsIcon, ChevronDown, Key, Building2 } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import ThemeSwitcher from '../ThemeSwitcher';
import api from '../../api/axios';

const Navbar = ({ onMenuClick }) => {
    const { auth, logout } = useAuth();
    const { singleBranchMode, branches, currentBranchId, setCurrentBranch } = useBranch();
    const user = auth?.user;
    const navigate = useNavigate();
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        fetchUnreadCount();
        const interval = setInterval(fetchUnreadCount, 60000);
        return () => clearInterval(interval);
    }, []);

    const fetchUnreadCount = async () => {
        try {
            const res = await api.get('/notifications/unread-count');
            setUnreadCount(res.data.count || 0);
        } catch {
            // Silently fail — notifications are non-critical
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <nav className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8 bg-theme-secondary shadow-theme-sm border-b border-theme transition-all duration-300">
            {/* Left side */}
            <div className="flex items-center gap-4">
                <button
                    onClick={onMenuClick}
                    className="lg:hidden p-2 hover:bg-theme-tertiary rounded-lg transition-colors text-theme-secondary hover:text-theme-primary"
                >
                    <Menu className="w-6 h-6" />
                </button>

                <div className="hidden lg:flex flex-col">
                    <h2 className="text-lg font-semibold text-theme-primary">
                        Welcome back, {user?.full_name?.split(' ')[0] || 'User'}
                    </h2>
                    <p className="text-xs text-theme-muted">
                        {user?.role_name || 'System User'}
                    </p>
                </div>
            </div>

            {/* Right side */}
            <div className="flex items-center gap-3">
                {/* Branch selector — only in multi-branch mode */}
                {!singleBranchMode && branches.length > 0 && (
                    <div className="hidden sm:flex items-center gap-1.5 bg-theme-tertiary border border-theme rounded-lg px-2 py-1.5">
                        <Building2 className="w-3.5 h-3.5 text-accent-gold flex-shrink-0" />
                        <select
                            value={currentBranchId || ''}
                            onChange={e => setCurrentBranch(e.target.value ? parseInt(e.target.value) : null)}
                            className="text-xs font-medium bg-transparent text-theme-primary focus:outline-none cursor-pointer max-w-[140px]"
                        >
                            {branches.map(b => (
                                <option key={b.id} value={b.id}>
                                    {b.branch_name}{b.main_branch ? ' ★' : ''}
                                </option>
                            ))}
                        </select>
                    </div>
                )}

                {/* Theme Switcher */}
                <ThemeSwitcher variant="navbar" />

                {/* Notifications Bell — links to notifications page */}
                <Link
                    to="/notifications"
                    className="p-2 rounded-lg text-theme-secondary hover:bg-theme-tertiary hover:text-theme-primary transition-all relative"
                    title="Notifications"
                >
                    <Bell className="w-5 h-5" />
                    {unreadCount > 0 && (
                        <span className="absolute top-1 right-1 min-w-[18px] h-[18px] px-1 bg-red-500 rounded-full border-2 border-theme-secondary flex items-center justify-center">
                            <span className="text-white text-[9px] font-bold leading-none">
                                {unreadCount > 99 ? '99+' : unreadCount}
                            </span>
                        </span>
                    )}
                </Link>

                {/* Divider */}
                <div className="hidden sm:block w-px h-8 bg-theme mx-1"></div>

                {/* Profile Dropdown */}
                <div className="relative">
                    <button
                        onClick={() => setShowProfileMenu(!showProfileMenu)}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-theme-tertiary transition-colors"
                    >
                        <div className="w-8 h-8 bg-accent-gold rounded-full flex items-center justify-center text-black font-bold text-sm">
                            {user?.full_name?.charAt(0)?.toUpperCase() || <User className="w-4 h-4" />}
                        </div>
                        <span className="hidden sm:block text-sm font-medium text-theme-primary">
                            {user?.full_name}
                        </span>
                        <ChevronDown className="h-4 w-4 text-theme-muted" />
                    </button>

                    {showProfileMenu && (
                        <>
                            <div className="fixed inset-0 z-10" onClick={() => setShowProfileMenu(false)}></div>
                            <div className="absolute right-0 mt-2 w-52 bg-theme-secondary rounded-lg shadow-theme-lg border border-theme py-1 z-20">
                                <div className="px-4 py-2 border-b border-theme">
                                    <p className="text-sm font-medium text-theme-primary">{user?.full_name}</p>
                                    <p className="text-xs text-theme-muted truncate">{user?.email}</p>
                                </div>

                                <Link
                                    to="/settings"
                                    onClick={() => setShowProfileMenu(false)}
                                    className="flex items-center gap-2 px-4 py-2 text-sm text-theme-secondary hover:bg-theme-tertiary transition-colors"
                                >
                                    <SettingsIcon className="w-4 h-4" />
                                    Settings
                                </Link>

                                {(user?.permissions?.change_password === true || user?.permissions?.admin === true) && (
                                    <Link
                                        to="/change-password"
                                        onClick={() => setShowProfileMenu(false)}
                                        className="flex items-center gap-2 px-4 py-2 text-sm text-theme-secondary hover:bg-theme-tertiary transition-colors"
                                    >
                                        <Key className="w-4 h-4" />
                                        Change Password
                                    </Link>
                                )}

                                <div className="border-t border-theme mt-1 pt-1">
                                    <button
                                        onClick={handleLogout}
                                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-theme-tertiary transition-colors text-left"
                                    >
                                        <LogOut className="w-4 h-4" />
                                        Logout
                                    </button>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
