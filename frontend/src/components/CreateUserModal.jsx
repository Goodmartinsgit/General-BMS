import React, { useState, useEffect } from 'react';
import { X, Eye, EyeOff, Copy, Check, RefreshCw } from 'lucide-react';
import { toast } from 'react-toastify';
import usersAPI from '../api/users';
import useFormDraft from '../hooks/useFormDraft';
import DraftRecoveryBanner from './common/DraftRecoveryBanner';

const defaultUserData = {
  full_name: '',
  email: '',
  phone_number: '',
  role_id: '',
  password: '',
  generate_password: true
};

const CreateUserModal = ({ isOpen, onClose, onSuccess }) => {
  const [manageableRoles, setManageableRoles] = useState([]);
  const [formData, setFormData] = useState(defaultUserData);

  const { draftData, hasDraft, applyDraft, dismissDraft, saveDraft, clearDraft } = useFormDraft('user_create', {
    label: 'New User',
    entityType: 'user',
    initialData: defaultUserData,
    isOpen,
  });

  useEffect(() => { saveDraft(formData); }, [formData, saveDraft]);

  const handleRestoreDraft = () => {
    if (draftData) {
      setFormData(prev => ({ ...prev, ...draftData }));
      applyDraft();
    }
  };
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [createdUser, setCreatedUser] = useState(null);
  const [temporaryPassword, setTemporaryPassword] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen) {
      usersAPI.getManageableRoles()
        .then(res => {
          const roles = res.data || [];
          setManageableRoles(roles);
          if (roles.length > 0) {
            setFormData(prev => ({ ...prev, role_id: roles[0].id }));
          }
        })
        .catch(() => toast.error('Failed to load roles'));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(temporaryPassword);
    setCopied(true);
    toast.success('Password copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        full_name: formData.full_name,
        email: formData.email,
        phone_number: formData.phone_number || undefined,
        role_id: formData.role_id,
        generate_password: formData.generate_password,
        password: formData.generate_password ? undefined : formData.password
      };

      const res = await usersAPI.create(payload);
      const data = res.data;
      clearDraft();

      if (data.temporary_password) {
        setTemporaryPassword(data.temporary_password);
        setCreatedUser(data.user);
      } else {
        toast.success('User created successfully');
        onSuccess?.();
        handleClose();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create user');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({ full_name: '', email: '', phone_number: '', role_id: manageableRoles[0]?.id || '', password: '', generate_password: true });
    setCreatedUser(null);
    setTemporaryPassword('');
    setCopied(false);
    onClose();
  };

  const handleDone = () => {
    onSuccess?.();
    handleClose();
  };

  const inp = 'w-full px-3 py-2.5 bg-theme-primary border border-theme rounded-lg text-sm text-theme-primary placeholder-theme-muted focus:ring-2 focus:ring-accent-gold/20 focus:border-accent-gold/30 outline-none transition-all';

  // ── Success screen ──────────────────────────────────────────────────────────
  if (createdUser && temporaryPassword) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50" onClick={handleDone}>
        <div className="bg-theme-secondary rounded-xl shadow-theme-lg border border-theme w-full max-w-md mx-4" onClick={e => e.stopPropagation()}>
          <div className="flex justify-between items-center p-5 border-b border-theme">
            <h2 className="text-lg font-semibold text-theme-primary">User Created Successfully</h2>
            <button onClick={handleDone} className="text-theme-muted hover:text-theme-primary p-1 rounded-lg hover:bg-theme-tertiary transition-colors">
              <X size={20} />
            </button>
          </div>
          <div className="p-5 space-y-4">
            <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <p className="text-sm text-green-800 dark:text-green-300">
                <strong>{createdUser.full_name}</strong> ({createdUser.email}) has been created.
              </p>
            </div>

            <div>
              <label className="block text-xs font-medium text-theme-muted uppercase tracking-wider mb-1.5">
                Temporary Password
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={temporaryPassword}
                  readOnly
                  className="flex-1 px-3 py-2.5 bg-theme-primary border border-theme rounded-lg text-sm font-mono text-theme-primary"
                />
                <button
                  onClick={handleCopy}
                  className="px-4 py-2.5 bg-accent-gold text-white rounded-lg hover:bg-accent-goldDark transition-colors flex items-center gap-1.5 text-sm font-medium"
                >
                  {copied ? <><Check size={14} /> Copied</> : <><Copy size={14} /> Copy</>}
                </button>
              </div>
            </div>

            <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
              <p className="text-sm text-amber-800 dark:text-amber-300">
                <strong>Important:</strong> Share this password securely. The user will be required to change it on first login.
              </p>
            </div>

            <button
              onClick={handleDone}
              className="w-full py-2.5 bg-accent-gold text-white font-semibold rounded-lg hover:bg-accent-goldDark transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Create form ─────────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50" onClick={handleClose}>
      <div
        className="bg-theme-secondary rounded-xl shadow-theme-lg border border-theme w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center p-5 border-b border-theme">
          <h2 className="text-lg font-semibold text-theme-primary">Add New User</h2>
          <button onClick={handleClose} className="text-theme-muted hover:text-theme-primary p-1 rounded-lg hover:bg-theme-tertiary transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <DraftRecoveryBanner
            visible={hasDraft}
            label="New User"
            updatedAt={draftData?._savedAt}
            onRestore={handleRestoreDraft}
            onDiscard={dismissDraft}
          />
          {/* Role */}
          <div>
            <label className="block text-xs font-medium text-theme-muted uppercase tracking-wider mb-1.5">Role *</label>
            <select name="role_id" value={formData.role_id} onChange={handleChange} className={`${inp} cursor-pointer`} required>
              <option value="">Select role...</option>
              {manageableRoles.map(r => (
                <option key={r.id} value={r.id}>{r.role_name}</option>
              ))}
            </select>
            {manageableRoles.length === 0 && (
              <p className="text-xs text-amber-600 mt-1">No manageable roles available for your account level.</p>
            )}
          </div>

          {/* Full name */}
          <div>
            <label className="block text-xs font-medium text-theme-muted uppercase tracking-wider mb-1.5">Full Name *</label>
            <input type="text" name="full_name" value={formData.full_name} onChange={handleChange} className={inp} placeholder="Enter full name" required />
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs font-medium text-theme-muted uppercase tracking-wider mb-1.5">Email *</label>
            <input type="email" name="email" value={formData.email} onChange={handleChange} className={inp} placeholder="Enter email address" required />
          </div>

          {/* Phone */}
          <div>
            <label className="block text-xs font-medium text-theme-muted uppercase tracking-wider mb-1.5">Phone Number</label>
            <input type="text" name="phone_number" value={formData.phone_number} onChange={handleChange} className={inp} placeholder="Optional" />
          </div>

          {/* Auto-generate password */}
          <div className="flex items-center gap-2.5">
            <input
              type="checkbox"
              id="generate_password"
              name="generate_password"
              checked={formData.generate_password}
              onChange={handleChange}
              className="w-4 h-4 rounded border-theme text-accent-gold focus:ring-accent-gold/20"
            />
            <label htmlFor="generate_password" className="text-sm text-theme-secondary flex items-center gap-1.5">
              <RefreshCw size={14} className="text-theme-muted" />
              Auto-generate secure password
            </label>
          </div>

          {/* Manual password */}
          {!formData.generate_password && (
            <div>
              <label className="block text-xs font-medium text-theme-muted uppercase tracking-wider mb-1.5">Password *</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className={`${inp} pr-10`}
                  placeholder="Min 8 chars, upper, lower, number, special"
                  required
                  minLength={8}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-theme-muted hover:text-theme-primary"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
          )}

          {/* Info */}
          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <p className="text-xs text-blue-800 dark:text-blue-300">
              {formData.generate_password
                ? 'A secure temporary password will be generated. You will see it after creation.'
                : 'The user must change this password on first login.'}
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2 border-t border-theme">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="flex-1 px-4 py-2.5 text-sm font-medium text-theme-secondary bg-theme-tertiary hover:bg-theme-primary border border-theme rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || manageableRoles.length === 0}
              className="flex-1 px-4 py-2.5 text-sm font-semibold bg-accent-gold text-white rounded-lg hover:bg-accent-goldDark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating...' : 'Create User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateUserModal;
