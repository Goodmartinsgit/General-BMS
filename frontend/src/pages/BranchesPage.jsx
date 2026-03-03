import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { branchesAPI } from '../api/branches';
import { useAuth } from '../context/AuthContext';
import { useBranch } from '../context/BranchContext';
import { toast } from 'react-toastify';
import BranchFormModal from '../components/BranchFormModal';
import {
  Building2, Plus, Edit2, Users, Package,
  LayoutGrid, List, MapPin, Phone, Mail, CheckCircle, XCircle,
  Search, ChevronRight, Warehouse, Star, Hash
} from 'lucide-react';

const BranchesPage = () => {
  const navigate = useNavigate();
  const { auth } = useAuth();
  const { refreshMode } = useBranch();
  const [branches, setBranches] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState(() => localStorage.getItem('branchViewMode') || 'grid');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    localStorage.setItem('branchViewMode', viewMode);
  }, [viewMode]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [branchData, orgData] = await Promise.all([
        branchesAPI.getBranches(),
        branchesAPI.getOrganizations().catch(() => [])
      ]);
      setBranches(Array.isArray(branchData) ? branchData : []);
      setOrganizations(Array.isArray(orgData) ? orgData : []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load branches');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBranch = () => {
    setEditingBranch(null);
    setIsModalOpen(true);
  };

  const handleEditBranch = (e, branch) => {
    e.stopPropagation();
    setEditingBranch(branch);
    setIsModalOpen(true);
  };

  const handleSubmit = async (data) => {
    try {
      if (editingBranch) {
        await branchesAPI.updateBranch(editingBranch.id, data);
        toast.success('Branch updated successfully');
      } else {
        await branchesAPI.createBranch(data);
        toast.success('Branch created successfully');
      }
      setIsModalOpen(false);
      setEditingBranch(null);
      fetchData();
      // Refresh branch mode so navbar selector and all pages respond to the change
      refreshMode();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Operation failed');
    }
  };

  // Filter branches
  const filteredBranches = branches.filter(b => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      (b.branch_name || '').toLowerCase().includes(q) ||
      (b.branch_code || '').toLowerCase().includes(q) ||
      (b.city || '').toLowerCase().includes(q) ||
      (b.state || '').toLowerCase().includes(q) ||
      (b.manager_name || '').toLowerCase().includes(q)
    );
  });

  // Statistics
  const stats = {
    total: branches.length,
    active: branches.filter(b => b.is_active).length,
    warehouses: branches.filter(b => b.is_warehouse).length,
    withManager: branches.filter(b => b.manager_user_id).length
  };

  return (
    <div className="space-y-6 p-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-primary">Branches</h1>
          <p className="text-sm text-secondary mt-1">Manage your business locations</p>
        </div>
        <button
          onClick={handleCreateBranch}
          className="btn-primary flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all hover:shadow-lg"
        >
          <Plus size={18} />
          Add Branch
        </button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={Building2} label="Total Branches" value={stats.total} color="blue" />
        <StatCard icon={CheckCircle} label="Active" value={stats.active} color="green" />
        <StatCard icon={Warehouse} label="Warehouses" value={stats.warehouses} color="purple" />
        <StatCard icon={Users} label="Manager Assigned" value={stats.withManager} color="amber" />
      </div>

      {/* Search & View Toggle */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary" />
          <input
            type="text"
            placeholder="Search by name, code, city, or manager..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-card border border-default rounded-xl text-sm text-primary placeholder:text-secondary focus:outline-none focus:ring-2 focus:ring-accent/30 transition"
          />
        </div>
        <div className="flex items-center gap-1 bg-card border border-default rounded-xl p-1">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded-lg transition ${viewMode === 'grid' ? 'bg-accent text-white' : 'text-secondary hover:text-primary'}`}
            title="Grid view"
          >
            <LayoutGrid size={18} />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded-lg transition ${viewMode === 'list' ? 'bg-accent text-white' : 'text-secondary hover:text-primary'}`}
            title="List view"
          >
            <List size={18} />
          </button>
        </div>
      </div>

      {/* Results Count */}
      <p className="text-xs text-secondary">
        Showing {filteredBranches.length} of {branches.length} branches
      </p>

      {/* Branch Cards/List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-theme border-t-accent-gold rounded-full animate-spin" />
        </div>
      ) : filteredBranches.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Building2 size={48} className="text-secondary/30 mb-4" />
          <p className="text-primary font-medium">No branches found</p>
          <p className="text-sm text-secondary mt-1">
            {searchQuery ? 'Try adjusting your search' : 'Create your first branch to get started'}
          </p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredBranches.map(branch => (
            <BranchCard
              key={branch.id}
              branch={branch}
              onEdit={handleEditBranch}
              onClick={() => navigate(`/branches/${branch.id}`)}
            />
          ))}
        </div>
      ) : (
        <div className="bg-card border border-default rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-default">
                <th className="text-left py-3 px-4 text-xs font-semibold text-secondary uppercase tracking-wider">Branch</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-secondary uppercase tracking-wider hidden md:table-cell">Location</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-secondary uppercase tracking-wider hidden lg:table-cell">Manager</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-secondary uppercase tracking-wider">Status</th>
                <th className="text-right py-3 px-4 text-xs font-semibold text-secondary uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredBranches.map(branch => (
                <BranchRow
                  key={branch.id}
                  branch={branch}
                  onEdit={handleEditBranch}
                  onClick={() => navigate(`/branches/${branch.id}`)}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      <BranchFormModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditingBranch(null); }}
        onSubmit={handleSubmit}
        branch={editingBranch}
        organizations={organizations}
        users={users}
      />
    </div>
  );
};

// ─── Stat Card ─────────────────────────────────────────────
const StatCard = ({ icon: Icon, label, value, color }) => {
  const colorMap = {
    blue: 'from-blue-500/10 to-blue-600/5 text-blue-600 border-blue-200/30',
    green: 'from-emerald-500/10 to-emerald-600/5 text-emerald-600 border-emerald-200/30',
    purple: 'from-purple-500/10 to-purple-600/5 text-purple-600 border-purple-200/30',
    amber: 'from-amber-500/10 to-amber-600/5 text-amber-600 border-amber-200/30',
  };

  return (
    <div className={`bg-gradient-to-br ${colorMap[color]} border rounded-2xl p-4 transition hover:shadow-md`}>
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-xl bg-white/60 dark:bg-white/10`}>
          <Icon size={20} />
        </div>
        <div>
          <p className="text-2xl font-bold">{value}</p>
          <p className="text-xs opacity-80">{label}</p>
        </div>
      </div>
    </div>
  );
};

// ─── Branch Card (Grid View) ──────────────────────────────
const BranchCard = ({ branch, onEdit, onClick }) => (
  <div
    onClick={onClick}
    className="group bg-card border border-default rounded-2xl p-5 hover:shadow-lg hover:border-accent/30 transition-all cursor-pointer"
  >
    {/* Header */}
    <div className="flex items-start justify-between mb-4">
      <div className="flex items-center gap-3">
        <div className={`shrink-0 w-11 h-11 rounded-xl flex items-center justify-center ${
          branch.is_warehouse
            ? 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400'
            : 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
        }`}>
          {branch.is_warehouse ? <Warehouse size={20} /> : <Building2 size={20} />}
        </div>
        <div className="min-w-0">
          <h3 className="font-semibold text-primary truncate group-hover:text-accent transition">
            {branch.branch_name}
          </h3>
          <span className="text-xs font-mono text-secondary">{branch.branch_code}</span>
        </div>
      </div>
      <button
        onClick={(e) => onEdit(e, branch)}
        className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-hover transition"
        title="Edit"
      >
        <Edit2 size={14} className="text-secondary" />
      </button>
    </div>

    {/* Details */}
    <div className="space-y-2 text-sm">
      {(branch.city || branch.state) && (
        <div className="flex items-center gap-2 text-secondary">
          <MapPin size={14} className="shrink-0" />
          <span className="truncate">{[branch.city, branch.state].filter(Boolean).join(', ')}</span>
        </div>
      )}
      {branch.phone_number && (
        <div className="flex items-center gap-2 text-secondary">
          <Phone size={14} className="shrink-0" />
          <span className="truncate">{branch.phone_number}</span>
        </div>
      )}
      {branch.manager_name && (
        <div className="flex items-center gap-2 text-secondary">
          <Users size={14} className="shrink-0" />
          <span className="truncate">{branch.manager_name}</span>
        </div>
      )}
    </div>

    {/* Footer */}
    <div className="mt-4 pt-3 border-t border-default flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${
          branch.is_active
            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
            : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
        }`}>
          {branch.is_active ? <CheckCircle size={12} /> : <XCircle size={12} />}
          {branch.is_active ? 'Active' : 'Inactive'}
        </span>
        {branch.is_warehouse && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 font-medium">
            Warehouse
          </span>
        )}
      </div>
      <ChevronRight size={16} className="text-secondary group-hover:text-accent transition" />
    </div>
  </div>
);

// ─── Branch Row (List View) ──────────────────────────────
const BranchRow = ({ branch, onEdit, onClick }) => (
  <tr
    onClick={onClick}
    className="border-b border-default last:border-b-0 hover:bg-hover cursor-pointer transition group"
  >
    <td className="py-3 px-4">
      <div className="flex items-center gap-3">
        <div className={`shrink-0 w-9 h-9 rounded-lg flex items-center justify-center ${
          branch.is_warehouse
            ? 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400'
            : 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
        }`}>
          {branch.is_warehouse ? <Warehouse size={16} /> : <Building2 size={16} />}
        </div>
        <div>
          <p className="font-medium text-primary group-hover:text-accent transition">{branch.branch_name}</p>
          <p className="text-xs font-mono text-secondary">{branch.branch_code}</p>
        </div>
      </div>
    </td>
    <td className="py-3 px-4 hidden md:table-cell">
      <div className="flex items-center gap-1.5 text-secondary text-sm">
        <MapPin size={13} className="shrink-0" />
        {[branch.city, branch.state].filter(Boolean).join(', ') || '—'}
      </div>
    </td>
    <td className="py-3 px-4 hidden lg:table-cell">
      <span className="text-sm text-secondary">{branch.manager_name || '—'}</span>
    </td>
    <td className="py-3 px-4">
      <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${
        branch.is_active
          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
          : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
      }`}>
        {branch.is_active ? 'Active' : 'Inactive'}
      </span>
    </td>
    <td className="py-3 px-4 text-right">
      <button
        onClick={(e) => onEdit(e, branch)}
        className="p-1.5 rounded-lg hover:bg-hover transition opacity-0 group-hover:opacity-100"
        title="Edit"
      >
        <Edit2 size={14} className="text-secondary" />
      </button>
    </td>
  </tr>
);

export default BranchesPage;
