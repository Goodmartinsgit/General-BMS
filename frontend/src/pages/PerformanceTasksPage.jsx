import React from 'react';
import { useAuth } from '../context/AuthContext';
import AdminPerformanceTasksPage from './AdminPerformanceTasksPage';
import StaffPerformanceTasksPage from './StaffPerformanceTasksPage';

const PerformanceTasksPage = () => {
    const { auth } = useAuth();
    const perms = auth.user?.permissions || {};
    const canManage = perms['manage_performance_tasks'] === true || perms['admin'] === true;

    if (canManage) {
        return <AdminPerformanceTasksPage />;
    }

    return <StaffPerformanceTasksPage />;
};

export default PerformanceTasksPage;
