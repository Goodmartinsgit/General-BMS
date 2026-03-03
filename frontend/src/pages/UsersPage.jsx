import React, { useState, useEffect } from 'react';
import { UserPlus, Trash2, Search, Users, Shield, Lock, Unlock, LayoutGrid, List } from 'lucide-react';
import { toast } from 'react-toastify';
import PageHeader from '../components/common/PageHeader';
import CreateUserModal from '../components/CreateUserModal';
import EditUserModal from '../components/EditUserModal';
import usersAPI from '../api/users';
import { useAuth } from '../context/AuthContext';

// ── Role badge colour based on role_level ──────────────────────────────────────
function getRoleBadgeClass(roleLevel) {
  if (roleLevel <= 1) return 'bg-accent-gold/20 text-accent-gold';
  if (roleLevel === 2) return 'bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400';
  if (roleLevel === 3) return 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400';
  return 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400';
}

const UsersPage = () => {
  const { auth } = useAuth();
  const currentUser = auth?.user;
  const currentRoleLevel = currentUser?.role_level ?? 99;

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState(localStorage.getItem('usersViewMode') || 'list');
  const [showCreate, setShowCreate] = useState(false);
  const [editUser, setEditUser] = useState(null);

  useEffect(() => { localStorage.setItem('usersViewMode', viewMode); }, [viewMode]);

  useEffect(() => { fetchUsers(); }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await usersAPI.getAll();
      setUsers(Array.isArray(res.data) ? res.data : []);
    } catch {
      toast.error('Failed to load users');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (user) => {
    if (!window.confirm(`Delete "${user.full_name}"? This action cannot be undone.`)) return;
    try {
      await usersAPI.delete(user.id);
      toast.success('User deleted');
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete user');
    }
  };

  const canManage = (user) =>
    user.role_level == null || user.role_level > currentRoleLevel;

  const filtered = users.filter(u =>
    u.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // ── Actions header button ──────────────────────────────────────────────────
  const actions = (
    <button
      onClick={() => setShowCreate(true)}
      className="bg-accent-gold text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg font-semibold text-xs sm:text-sm hover:bg-accent-goldDark transition flex items-center gap-1.5 w-full sm:w-auto justify-center"
    >
      <UserPlus size={14} /> Add User
    </button>
  );

  // ── User card (grid view) ──────────────────────────────────────────────────
  const UserCard = ({ user }) => {
    const isLocked = user.is_locked || user.status === 'LOCKED';
    return (
      <div
        onClick={() => setEditUser(user)}
        className="bg-theme-secondary rounded-lg border border-theme shadow-theme-sm p-5 cursor-pointer hover:border-accent-gold/30 hover:shadow-theme-md transition-all"
      >
        <div className="flex items-start justify-between mb-3">
          <div className="w-12 h-12 rounded-full bg-accent-gold/10 flex items-center justify-center shrink-0">
            <span className="text-accent-gold font-bold text-lg">{user.full_name?.charAt(0)?.toUpperCase() || 'U'}</span>
          </div>
          {isLocked
            ? <span className="flex items-center gap-1 px-2 py-0.5 bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400 rounded-full text-xs font-medium"><Lock size={11} /> Locked</span>
            : <span className="flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400 rounded-full text-xs font-medium"><Unlock size={11} /> Active</span>
          }
        </div>
        <p className="font-semibold text-theme-primary truncate">{user.full_name}</p>
        <p className="text-xs text-theme-muted truncate mb-2">{user.email}</p>
        <div className="flex items-center justify-between">
          <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${getRoleBadgeClass(user.role_level)}`}>
            <Shield size={11} /> {user.role_name}
          </span>
          {canManage(user) && (
            <button
              onClick={e => { e.stopPropagation(); handleDelete(user); }}
              className="p-1.5 text-theme-muted hover:text-red-600 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-lg transition-colors"
              title="Delete"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4 sm:space-y-6 max-w-[1700px] mx-auto pb-6 sm:pb-10">
      <PageHeader
        title="User Management"
        subtitle="Manage system users, roles, and access levels"
        icon={Users}
        badge={!loading ? `${users.length} user${users.length !== 1 ? 's' : ''}` : undefined}
        actions={actions}
      />

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-theme-muted w-4 h-4 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="pl-9 pr-4 py-2 sm:py-2.5 border border-theme rounded-lg w-full bg-theme-primary text-xs sm:text-sm text-theme-primary focus:ring-2 focus:ring-accent-gold/20 focus:border-accent-gold/30 outline-none transition-all placeholder-theme-muted"
          />
        </div>

        {/* View toggle */}
        <div className="flex items-center bg-theme-primary border border-theme rounded-lg p-0.5 self-start sm:self-auto">
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded-md transition-all ${viewMode === 'list' ? 'bg-theme-secondary text-theme-primary shadow-sm' : 'text-theme-muted hover:text-theme-primary'}`}
            title="List view"
          >
            <List size={16} />
          </button>
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded-md transition-all ${viewMode === 'grid' ? 'bg-theme-secondary text-theme-primary shadow-sm' : 'text-theme-muted hover:text-theme-primary'}`}
            title="Grid view"
          >
            <LayoutGrid size={16} />
          </button>
        </div>
      </div>

      {/* ── Grid view ──────────────────────────────────────────────────────── */}
      {viewMode === 'grid' ? (
        loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array(8).fill(0).map((_, i) => (
              <div key={i} className="bg-theme-secondary rounded-lg border border-theme p-5 animate-pulse space-y-3">
                <div className="flex justify-between"><div className="w-12 h-12 bg-theme-tertiary rounded-full" /><div className="w-16 h-5 bg-theme-tertiary rounded-full" /></div>
                <div className="h-4 bg-theme-tertiary rounded w-3/4" />
                <div className="h-3 bg-theme-tertiary rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState searchTerm={searchTerm} />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map(u => <UserCard key={u.id} user={u} />)}
          </div>
        )
      ) : (
        /* ── List / Table view ───────────────────────────────────────────── */
        <div className="bg-theme-secondary rounded-lg border border-theme shadow-theme-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-theme-primary border-b border-theme">
                  <th className="px-4 sm:px-6 py-3 text-[10px] sm:text-xs font-semibold text-theme-muted uppercase tracking-wider">User</th>
                  <th className="px-4 sm:px-6 py-3 text-[10px] sm:text-xs font-semibold text-theme-muted uppercase tracking-wider hidden md:table-cell">Email</th>
                  <th className="px-4 sm:px-6 py-3 text-[10px] sm:text-xs font-semibold text-theme-muted uppercase tracking-wider">Role</th>
                  <th className="px-4 sm:px-6 py-3 text-[10px] sm:text-xs font-semibold text-theme-muted uppercase tracking-wider">Status</th>
                  <th className="px-4 sm:px-6 py-3 text-[10px] sm:text-xs font-semibold text-theme-muted uppercase tracking-wider hidden lg:table-cell">Last Login</th>
                  <th className="px-4 sm:px-6 py-3 text-right text-[10px] sm:text-xs font-semibold text-theme-muted uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-theme">
                {loading ? (
                  Array(5).fill(0).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="px-6 py-4"><div className="flex items-center gap-3"><div className="w-9 h-9 bg-theme-tertiary rounded-full" /><div className="h-4 w-28 bg-theme-tertiary rounded" /></div></td>
                      <td className="px-6 py-4 hidden md:table-cell"><div className="h-4 w-40 bg-theme-tertiary rounded" /></td>
                      <td className="px-6 py-4"><div className="h-5 w-20 bg-theme-tertiary rounded-full" /></td>
                      <td className="px-6 py-4"><div className="h-5 w-14 bg-theme-tertiary rounded-full" /></td>
                      <td className="px-6 py-4 hidden lg:table-cell"><div className="h-4 w-24 bg-theme-tertiary rounded" /></td>
                      <td className="px-6 py-4"><div className="h-4 w-16 bg-theme-tertiary rounded ml-auto" /></td>
                    </tr>
                  ))
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="py-16 text-center">
                      <EmptyState searchTerm={searchTerm} inline />
                    </td>
                  </tr>
                ) : filtered.map(user => {
                  const isLocked = user.is_locked || user.status === 'LOCKED';
                  return (
                    <tr
                      key={user.id}
                      onClick={() => setEditUser(user)}
                      className="hover:bg-theme-primary transition-colors cursor-pointer"
                    >
                      {/* Name */}
                      <td className="px-4 sm:px-6 py-3 sm:py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-accent-gold/10 flex items-center justify-center shrink-0">
                            <span className="text-accent-gold font-semibold text-sm">
                              {user.full_name?.charAt(0)?.toUpperCase() || 'U'}
                            </span>
                          </div>
                          <span className="font-semibold text-theme-primary text-sm">{user.full_name}</span>
                        </div>
                      </td>

                      {/* Email */}
                      <td className="px-4 sm:px-6 py-3 sm:py-4 text-sm text-theme-secondary hidden md:table-cell">
                        {user.email}
                      </td>

                      {/* Role */}
                      <td className="px-4 sm:px-6 py-3 sm:py-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${getRoleBadgeClass(user.role_level)}`}>
                          <Shield size={11} /> {user.role_name || '—'}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-4 sm:px-6 py-3 sm:py-4">
                        {isLocked ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400 rounded-full text-xs font-medium">
                            <Lock size={11} /> Locked
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400 rounded-full text-xs font-medium">
                            <Unlock size={11} /> Active
                          </span>
                        )}
                      </td>

                      {/* Last login */}
                      <td className="px-4 sm:px-6 py-3 sm:py-4 text-xs text-theme-muted hidden lg:table-cell">
                        {user.last_login_at
                          ? new Date(user.last_login_at).toLocaleDateString()
                          : <span className="italic">Never</span>}
                      </td>

                      {/* Actions */}
                      <td className="px-4 sm:px-6 py-3 sm:py-4 text-right" onClick={e => e.stopPropagation()}>
                        {canManage(user) ? (
                          <button
                            onClick={() => handleDelete(user)}
                            className="p-2 text-theme-muted hover:text-red-600 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                            title="Delete user"
                          >
                            <Trash2 size={15} />
                          </button>
                        ) : (
                          <span className="text-xs text-theme-muted italic px-2">Protected</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modals */}
      <CreateUserModal
        isOpen={showCreate}
        onClose={() => setShowCreate(false)}
        onSuccess={() => { setShowCreate(false); fetchUsers(); }}
      />

      <EditUserModal
        isOpen={!!editUser}
        onClose={() => setEditUser(null)}
        user={editUser}
        currentUserRoleLevel={currentRoleLevel}
        onRefresh={fetchUsers}
      />
    </div>
  );
};

function EmptyState({ searchTerm, inline }) {
  const content = (
    <div className="flex flex-col items-center gap-4">
      <div className="w-16 h-16 bg-theme-tertiary rounded-full flex items-center justify-center text-theme-muted">
        <Users size={28} />
      </div>
      <div>
        <p className="font-semibold text-theme-primary text-base">No users found</p>
        <p className="text-theme-muted text-sm mt-1">
          {searchTerm ? 'Try a different search term' : 'Add a user to get started'}
        </p>
      </div>
    </div>
  );
  return inline ? content : <div className="py-16 flex justify-center">{content}</div>;
}

export default UsersPage;
