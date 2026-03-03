import React, { useState, useEffect } from 'react';
import { X, Lock, Unlock, RefreshCw, UserCog, Copy, Check, AlertTriangle } from 'lucide-react';
import { toast } from 'react-toastify';
import usersAPI from '../api/users';

const ROLE_BADGE = {
  colours: (level) => {
    if (level <= 1) return 'bg-accent-gold/20 text-accent-gold';
    if (level === 2) return 'bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400';
    if (level === 3) return 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400';
    return 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400';
  }
};

const EditUserModal = ({ isOpen, onClose, user, currentUserRoleLevel, onRefresh }) => {
  const [manageableRoles, setManageableRoles] = useState([]);
  const [formData, setFormData] = useState({ full_name: '', phone_number: '' });
  const [selectedRoleId, setSelectedRoleId] = useState('');
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState('');
  const [resetPasswordResult, setResetPasswordResult] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (user && isOpen) {
      setFormData({ full_name: user.full_name || '', phone_number: user.phone_number || '' });
      setSelectedRoleId(user.role_id?.toString() || '');
      setResetPasswordResult('');

      usersAPI.getManageableRoles()
        .then(res => setManageableRoles(res.data || []))
        .catch(() => setManageableRoles([]));
    }
  }, [user, isOpen]);

  if (!isOpen || !user) return null;

  const isProtected = currentUserRoleLevel != null && user.role_level != null
    ? user.role_level <= currentUserRoleLevel
    : false;

  const canChangeRole = !isProtected && manageableRoles.length > 0;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await usersAPI.update(user.id, formData);
      toast.success('User updated successfully');
      onRefresh?.();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update user');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleLock = async () => {
    const isLocked = user.is_locked || user.status === 'LOCKED';
    let reason = null;

    if (!isLocked) {
      reason = window.prompt('Enter a reason for locking this account (required):');
      if (!reason?.trim()) return;
    }

    setActionLoading('lock');
    try {
      if (isLocked) {
        await usersAPI.unlock(user.id);
        toast.success('Account unlocked');
      } else {
        await usersAPI.lock(user.id, reason);
        toast.success('Account locked');
      }
      onRefresh?.();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed');
    } finally {
      setActionLoading('');
    }
  };

  const handleResetPassword = async () => {
    if (!window.confirm(`Reset password for ${user.full_name}? A new temporary password will be generated.`)) return;

    setActionLoading('reset');
    try {
      const res = await usersAPI.resetPassword(user.id);
      setResetPasswordResult(res.data.temporary_password);
      toast.success('Password reset. Share it securely with the user.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Password reset failed');
    } finally {
      setActionLoading('');
    }
  };

  const handleRoleChange = async () => {
    if (!selectedRoleId || selectedRoleId === user.role_id?.toString()) {
      toast.info('Please select a different role');
      return;
    }
    if (!window.confirm(`Change ${user.full_name}'s role? They will be signed out and must log in again.`)) return;

    setActionLoading('role');
    try {
      const res = await usersAPI.changeRole(user.id, parseInt(selectedRoleId));
      toast.success(res.data.message || 'Role changed successfully');
      onRefresh?.();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Role change failed');
    } finally {
      setActionLoading('');
    }
  };

  const handleCopyPassword = () => {
    navigator.clipboard.writeText(resetPasswordResult);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isLocked = user.is_locked || user.status === 'LOCKED';

  const inp = 'w-full px-3 py-2.5 bg-theme-primary border border-theme rounded-lg text-sm text-theme-primary placeholder-theme-muted focus:ring-2 focus:ring-accent-gold/20 focus:border-accent-gold/30 outline-none transition-all';

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50" onClick={onClose}>
      <div
        className="bg-theme-secondary rounded-xl shadow-theme-lg border border-theme w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center p-5 border-b border-theme">
          <h2 className="text-lg font-semibold text-theme-primary">Edit User</h2>
          <button onClick={onClose} className="text-theme-muted hover:text-theme-primary p-1 rounded-lg hover:bg-theme-tertiary transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Protected warning */}
          {isProtected && (
            <div className="flex items-start gap-3 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
              <AlertTriangle size={16} className="text-amber-600 mt-0.5 shrink-0" />
              <p className="text-sm text-amber-800 dark:text-amber-300">
                You cannot manage users at or above your own privilege level.
              </p>
            </div>
          )}

          {/* User summary */}
          <div className="flex items-center gap-4 pb-4 border-b border-theme">
            <div className="w-14 h-14 rounded-full bg-accent-gold/10 flex items-center justify-center shrink-0">
              <span className="text-accent-gold font-bold text-xl">
                {user.full_name?.charAt(0)?.toUpperCase() || 'U'}
              </span>
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-theme-primary truncate">{user.full_name}</p>
              <p className="text-sm text-theme-muted truncate">{user.email}</p>
              <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-semibold ${ROLE_BADGE.colours(user.role_level)}`}>
                {user.role_name}
              </span>
            </div>
          </div>

          {/* Account status */}
          <div className="flex items-center justify-between p-3 bg-theme-primary rounded-lg border border-theme">
            <div className="flex items-center gap-2">
              {isLocked ? (
                <><Lock size={15} className="text-red-500" /><span className="text-sm font-medium text-red-600 dark:text-red-400">Locked</span></>
              ) : (
                <><Unlock size={15} className="text-green-500" /><span className="text-sm font-medium text-green-600 dark:text-green-400">Active</span></>
              )}
            </div>
            {!isProtected && (
              <button
                type="button"
                onClick={handleToggleLock}
                disabled={actionLoading === 'lock'}
                className={`text-sm font-medium transition-colors ${isLocked
                  ? 'text-green-600 hover:text-green-800'
                  : 'text-red-600 hover:text-red-800'
                } disabled:opacity-50`}
              >
                {actionLoading === 'lock' ? '...' : isLocked ? 'Unlock Account' : 'Lock Account'}
              </button>
            )}
          </div>

          {/* Lock reason */}
          {isLocked && user.lock_reason && (
            <div className="px-3 py-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-xs text-red-700 dark:text-red-400">
                <span className="font-semibold">Lock reason:</span> {user.lock_reason}
              </p>
            </div>
          )}

          {/* Edit profile fields */}
          {!isProtected && (
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-theme-muted uppercase tracking-wider mb-1.5">Full Name</label>
                <input type="text" name="full_name" value={formData.full_name} onChange={handleChange} className={inp} placeholder="Full name" />
              </div>
              <div>
                <label className="block text-xs font-medium text-theme-muted uppercase tracking-wider mb-1.5">Phone Number</label>
                <input type="text" name="phone_number" value={formData.phone_number} onChange={handleChange} className={inp} placeholder="Phone number" />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 text-sm font-semibold bg-accent-gold text-white rounded-lg hover:bg-accent-goldDark transition-colors disabled:opacity-50"
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </form>
          )}

          {/* Role change */}
          {canChangeRole && (
            <div className="p-4 bg-theme-primary border border-theme rounded-lg space-y-3">
              <div className="flex items-center gap-2">
                <UserCog size={16} className="text-theme-muted" />
                <span className="text-sm font-medium text-theme-primary">Change Role</span>
              </div>
              <select
                value={selectedRoleId}
                onChange={e => setSelectedRoleId(e.target.value)}
                className={`${inp} cursor-pointer`}
                disabled={actionLoading === 'role'}
              >
                <option value="">Current: {user.role_name}</option>
                {manageableRoles.map(r => (
                  <option key={r.id} value={r.id}>{r.role_name}</option>
                ))}
              </select>
              <button
                type="button"
                onClick={handleRoleChange}
                disabled={actionLoading === 'role' || !selectedRoleId || selectedRoleId === user.role_id?.toString()}
                className="w-full py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {actionLoading === 'role' ? 'Changing...' : 'Apply Role Change'}
              </button>
              <p className="text-xs text-theme-muted">The user will be signed out and must log in again for the new role to take effect.</p>
            </div>
          )}

          {/* Password reset */}
          {!isProtected && (
            <div className="space-y-2">
              <button
                type="button"
                onClick={handleResetPassword}
                disabled={actionLoading === 'reset'}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border border-theme text-theme-secondary text-sm font-medium rounded-lg hover:bg-theme-primary transition-colors disabled:opacity-50"
              >
                <RefreshCw size={15} />
                {actionLoading === 'reset' ? 'Resetting...' : 'Reset Password'}
              </button>
              <p className="text-xs text-theme-muted text-center">Generates a temporary password the user must change on login.</p>
            </div>
          )}

          {/* Reset password result */}
          {resetPasswordResult && (
            <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg space-y-2">
              <p className="text-xs font-semibold text-green-700 dark:text-green-400">New Temporary Password:</p>
              <div className="flex gap-2">
                <code className="flex-1 px-3 py-2 bg-theme-primary border border-theme rounded text-sm font-mono text-theme-primary">
                  {resetPasswordResult}
                </code>
                <button
                  onClick={handleCopyPassword}
                  className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                </button>
              </div>
              <p className="text-xs text-green-700 dark:text-green-400">Share this with the user securely.</p>
            </div>
          )}

          {/* Close */}
          <div className="pt-2 border-t border-theme">
            <button
              type="button"
              onClick={onClose}
              className="w-full px-4 py-2.5 text-sm font-medium text-theme-secondary bg-theme-tertiary hover:bg-theme-primary border border-theme rounded-lg transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditUserModal;
