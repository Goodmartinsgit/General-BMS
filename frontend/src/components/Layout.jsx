import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './layout/Sidebar';
import Navbar from './layout/Navbar';
import TaskPerformanceWidget from './performance-tasks/TaskPerformanceWidget';

const Layout = () => {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
    const closeSidebar = () => setSidebarOpen(false);

    return (
        <div className="flex h-screen bg-theme-primary overflow-hidden">
            {/* Sidebar */}
            <Sidebar isOpen={sidebarOpen} onClose={closeSidebar} />

            {/* Overlay for mobile */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-30 lg:hidden"
                    onClick={closeSidebar}
                />
            )}

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0 transition-all duration-300 lg:ml-[var(--sidebar-width)]">
                <Navbar onMenuClick={toggleSidebar} />
                
                <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 bg-theme-primary">
                    <Outlet />
                </main>
            </div>
            
            <TaskPerformanceWidget />
        </div>
    );
};

export default Layout;
