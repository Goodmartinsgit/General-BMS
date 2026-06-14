import { useMemo } from 'react';
import { useAuth } from '../context/AuthContext';

/**
 * Centralized permission checking hook.
 * Reads from auth context and provides convenience methods.
 */
const usePermissions = () => {
  const { auth } = useAuth();
  const permissions = auth?.user?.permissions || {};

  const helpers = useMemo(() => {
    const isAdmin = permissions['admin'] === true;

    /** Check if user has a specific permission (or is admin) */
    const hasPerm = (key) => isAdmin || permissions[key] === true;

    /** Check if user has ANY of the listed permissions */
    const hasAnyPerm = (...keys) => isAdmin || keys.some(k => permissions[k] === true);

    /** Shortcut: can user see financial data (cost prices, margins, values, revenue) */
    const canViewFinancials = hasPerm('view_dashboard_financials');

    /** Category & Brand permission helpers */
    const canViewCategories = hasPerm('view_categories');
    const canCreateCategories = hasPerm('create_categories');
    const canUpdateCategories = hasPerm('update_categories');
    const canDeleteCategories = hasPerm('delete_categories');
    const canViewBrands = hasPerm('view_brands');
    const canCreateBrands = hasPerm('create_brands');
    const canUpdateBrands = hasPerm('update_brands');
    const canDeleteBrands = hasPerm('delete_brands');

    /** Shortcut: can user manage a specific module */
    const canManage = (module) => hasPerm(`manage_${module}`);

    return {
      permissions,
      isAdmin,
      hasPerm,
      hasAnyPerm,
      canViewFinancials,
      canManage,
      canViewCategories,
      canCreateCategories,
      canUpdateCategories,
      canDeleteCategories,
      canViewBrands,
      canCreateBrands,
      canUpdateBrands,
      canDeleteBrands,
    };
  }, [permissions]);

  return helpers;
};

export default usePermissions;
