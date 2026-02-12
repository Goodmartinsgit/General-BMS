import React from 'react';
import { useAuth } from '../context/AuthContext';
import AdminPerformanceTasksPage from './AdminPerformanceTasksPage';
import StaffPerformanceTasksPage from './StaffPerformanceTasksPage';

const PerformanceTasksPage = () => {
    const { auth } = useAuth();
    const role = auth.user?.role_name?.toLowerCase();

    if (role === 'admin' || role === 'super_admin' || role === 'retail_admin') {
        return <AdminPerformanceTasksPage />;
    }

    return <StaffPerformanceTasksPage />;
};

export default PerformanceTasksPage;
