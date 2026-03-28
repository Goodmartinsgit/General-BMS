import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Clock } from 'lucide-react';
import Sidebar from './layout/Sidebar';
import Navbar from './layout/Navbar';
import TaskPerformanceWidget from './performance-tasks/TaskPerformanceWidget';
import { useAuth } from '../context/AuthContext';

const Layout = () => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const { sessionWarning, dismissSessionWarning } = useAuth();

    const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
    const closeSidebar = () => setSidebarOpen(false);
    const toggleCollapse = () => setSidebarCollapsed(!sidebarCollapsed);

    return (
        <div className="flex h-screen bg-theme-primary overflow-hidden">
            {/* Sidebar */}
            <Sidebar 
                isOpen={sidebarOpen} 
                onClose={closeSidebar} 
                isCollapsed={sidebarCollapsed}
                toggleCollapse={toggleCollapse}
            />

            {/* Overlay for mobile */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-30 lg:hidden"
                    onClick={closeSidebar}
                />
            )}

            {/* Main Content */}
            <div 
                className={`
                    flex-1 flex flex-col min-w-0 transition-all duration-300 ease-in-out
                    ${sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-[var(--sidebar-width)]'}
                `}
            >
                <Navbar onMenuClick={toggleSidebar} isCollapsed={sidebarCollapsed} />
                
                {/* Session timeout warning */}
                {sessionWarning && (
                    <div className="bg-amber-500 text-white px-4 py-2.5 flex items-center justify-between gap-3 text-sm shadow-md z-40">
                        <div className="flex items-center gap-2">
                            <Clock size={16} className="shrink-0" />
                            <span className="font-medium">Your session is about to expire due to inactivity. Move your mouse or press any key to stay logged in.</span>
                        </div>
                        <button
                            onClick={dismissSessionWarning}
                            className="shrink-0 px-3 py-1 bg-white/20 hover:bg-white/30 rounded text-xs font-semibold transition"
                        >
                            Stay Logged In
                        </button>
                    </div>
                )}

                <main className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6 lg:p-8 bg-theme-primary transition-all">
                    <Outlet />
                </main>
            </div>
            
            <TaskPerformanceWidget />
        </div>
    );
};

export default Layout;
