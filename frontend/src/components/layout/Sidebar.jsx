import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
    LayoutDashboard,
    ShoppingCart,
    Package,
    Users,
    MapPin,
    ClipboardList,
    Tags,
    History,
    CreditCard,
    Truck,
    Landmark,
    Wallet,
    Target,
    ArrowLeftRight,
    AlertTriangle,
    BarChart3,
    Settings,
    FilePlus,
    ChevronDown,
    ChevronRight,
    X,
    FolderOpen,
    FileBox,
    RotateCcw,
    Activity,
    Trash2
} from 'lucide-react';

const Sidebar = ({ isOpen, onClose }) => {
    const { user } = useAuth();
    const location = useLocation();
    const [expandedSections, setExpandedSections] = useState(['inventory', 'commerce', 'financials']);

    const toggleSection = (sectionId) => {
        setExpandedSections(prev =>
            prev.includes(sectionId)
                ? prev.filter(id => id !== sectionId)
                : [...prev, sectionId]
        );
    };

    const isActive = (path) => location.pathname === path;

    const navGroups = [
        {
            id: 'dashboard',
            name: 'Dashboard',
            icon: LayoutDashboard,
            path: '/',
            standalone: true
        },
        {
            id: 'commerce',
            name: 'Commerce',
            icon: ShoppingCart,
            children: [
                { name: 'Point of Sale', path: '/pos', icon: ShoppingCart },
                { name: 'Sales History', path: '/sales', icon: History },
                { name: 'Quotations', path: '/quotations', icon: FilePlus },
                { name: 'Wholesale Orders', path: '/wholesale-orders', icon: FileBox },
            ]
        },
        {
            id: 'inventory',
            name: 'Inventory',
            icon: Package,
            children: [
                { name: 'Catalog', path: '/products', icon: Package },
                { name: 'Stock Levels', path: '/inventory', icon: ClipboardList },
                { name: 'Categories', path: '/categories', icon: Tags },
                { name: 'Transfers', path: '/stock-transfers', icon: ArrowLeftRight },
                { name: 'Stock Damages', path: '/stock-damages', icon: AlertTriangle },
                { name: 'Stock Activity', path: '/stock-activity', icon: Activity },
                { name: 'Returns', path: '/returns', icon: RotateCcw },
                { name: 'Purchase Orders', path: '/purchase-orders', icon: FileBox },
            ]
        },
        {
            id: 'relationships',
            name: 'Relationships',
            icon: Users,
            children: [
                { name: 'Customers', path: '/customers', icon: Users },
                { name: 'Suppliers', path: '/suppliers', icon: Truck },
                { name: 'Referrers', path: '/referrers', icon: Users },
            ]
        },
        {
            id: 'financials',
            name: 'Financials',
            icon: Landmark,
            children: [
                { name: 'Cash Flow', path: '/cash-flow', icon: Landmark },
                { name: 'Expenses', path: '/expenses', icon: CreditCard },
                { name: 'Budgets', path: '/budgets', icon: Target },
                { name: 'Payments', path: '/payments', icon: Wallet },
                { name: 'Price Tiers', path: '/price-tiers', icon: Tags },
            ]
        },
        {
            id: 'analytics',
            name: 'Analytics',
            icon: BarChart3,
            children: [
                { name: 'Sales Analytics', path: '/analytics/sales', icon: BarChart3 },
                { name: 'Inventory Analytics', path: '/analytics/inventory', icon: BarChart3 },
                { name: 'Customer Analytics', path: '/analytics/customers', icon: BarChart3 },
            ]
        },
        {
            id: 'system',
            name: 'System',
            icon: Settings,
            roles: ['Admin'],
            children: [
                 { name: 'Users', path: '/users', icon: Users },
                 { name: 'Branches', path: '/branches', icon: MapPin },
                 { name: 'Settings', path: '/settings', icon: Settings },
                 { name: 'Recycle Bin', path: '/recycle-bin', icon: Trash2 },
            ].filter(child => !child.roles || child.roles.includes(user?.role_name))
        }
    ];

    // Filter groups based on roles if needed (currently simple check)
    const filteredGroups = navGroups.filter(group => !group.roles || group.roles.includes(user?.role_name));

    return (
        <aside
            className={`fixed inset-y-0 left-0 z-40 w-[var(--sidebar-width)] bg-theme-secondary border-r border-theme transform transition-transform duration-300 ease-in-out lg:translate-x-0 cursor-default ${
                isOpen ? 'translate-x-0' : '-translate-x-full'
            }`}
        >
            {/* Logo area */}
             <div className="flex items-center justify-between h-16 px-6 border-b border-theme flex-shrink-0">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Package className="text-white w-5 h-5" />
                    </div>
                    <span className="text-lg font-bold text-theme-primary tracking-tight">General BMS</span>
                </div>
                <button onClick={onClose} className="lg:hidden text-theme-secondary hover:text-theme-primary">
                    <X className="w-6 h-6" />
                </button>
            </div>

             {/* Navigation */}
            <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
                {filteredGroups.map(group => {
                    if (group.standalone) {
                        return (
                             <Link
                                key={group.id}
                                to={group.path}
                                onClick={onClose}
                                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all font-medium ${
                                    isActive(group.path)
                                        ? 'bg-blue-600 text-white shadow-md shadow-blue-200 dark:shadow-none'
                                        : 'text-theme-secondary hover:bg-theme-tertiary hover:text-theme-primary'
                                }`}
                            >
                                <group.icon className="w-5 h-5" />
                                <span>{group.name}</span>
                            </Link>
                        );
                    }

                    const isExpanded = expandedSections.includes(group.id);
                    // Check if any child is active to highlight group
                    const isGroupActive = group.children?.some(child => isActive(child.path));

                    return (
                        <div key={group.id} className="mb-2">
                             <button
                                onClick={() => toggleSection(group.id)}
                                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-all font-medium ${
                                    isGroupActive
                                        ? 'text-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400'
                                        : 'text-theme-secondary hover:bg-theme-tertiary hover:text-theme-primary'
                                }`}
                            >
                                <div className="flex items-center gap-3">
                                    <group.icon className="w-5 h-5" />
                                    <span>{group.name}</span>
                                </div>
                                {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                            </button>

                            {isExpanded && (
                                <div className="mt-1 ml-4 space-y-0.5 border-l border-theme-light pl-2">
                                    {group.children.map(child => (
                                        <Link
                                            key={child.path}
                                            to={child.path}
                                            onClick={onClose}
                                            className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all text-sm font-medium ${
                                                isActive(child.path)
                                                    ? 'text-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400'
                                                    : 'text-theme-secondary hover:text-theme-primary hover:bg-theme-tertiary'
                                            }`}
                                        >
                                            <child.icon className="w-4 h-4" />
                                            <span>{child.name}</span>
                                        </Link>
                                    ))}
                                </div>
                            )}

                        </div>
                    );
                })}
            </nav>

        </aside>
    );
};

export default Sidebar;
