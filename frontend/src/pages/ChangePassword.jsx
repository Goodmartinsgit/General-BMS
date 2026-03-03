import React, { useState } from 'react';
import { Eye, EyeOff, Loader2, Lock, CheckCircle, ShieldCheck, Mail, UserCog } from 'lucide-react';
import { toast } from 'react-toastify';
import api from '../api/axios';
import PageHeader from '../components/common/PageHeader';
import { useAuth } from '../context/AuthContext';

// ── Reusable password input ───────────────────────────────────────────────────
function PasswordInput({ value, onChange, placeholder, error, show, onToggle }) {
  const border = error ? 'border-red-500' : 'border-theme';
  return (
    <div className="relative">
      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-theme-muted" />
      <input
        type={show ? 'text' : 'password'}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`w-full pl-10 pr-10 py-2.5 border ${border} bg-theme-primary text-theme-primary rounded-lg focus:ring-2 focus:ring-accent-gold/20 focus:border-accent-gold outline-none transition-all text-sm`}
      />
      <button type="button" onClick={onToggle} className="absolute inset-y-0 right-0 flex items-center pr-3">
        {show
          ? <EyeOff className="w-4 h-4 text-theme-muted hover:text-theme-primary transition-colors" />
          : <Eye className="w-4 h-4 text-theme-muted hover:text-theme-primary transition-colors" />
        }
      </button>
    </div>
  );
}

// ── Email change section ──────────────────────────────────────────────────────
function EmailSection({ currentEmail, setAuth }) {
  const [newEmail, setNewEmail]         = useState('');
  const [password, setPassword]         = useState('');
  const [showPw, setShowPw]             = useState(false);
  const [errors, setErrors]             = useState({});
  const [loading, setLoading]           = useState(false);

  const validate = () => {
    const e = {};
    if (!newEmail)                                     e.email    = 'New email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) e.email = 'Invalid email address';
    else if (newEmail.toLowerCase() === currentEmail?.toLowerCase()) e.email = 'New email must differ from current email';
    if (!password)                                     e.password = 'Current password is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const res = await api.patch('/auth/profile', { email: newEmail, currentPassword: password });
      // Update in-memory auth so the navbar / anywhere that shows email reflects the change
      setAuth(prev => ({ ...prev, user: { ...prev.user, email: res.data.email } }));
      toast.success('Email updated successfully');
      setNewEmail('');
      setPassword('');
      setErrors({});
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to update email';
      toast.error(msg);
      if (msg.toLowerCase().includes('password')) setErrors({ password: msg });
      else if (msg.toLowerCase().includes('email'))   setErrors({ email: msg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-theme-secondary rounded-lg border border-theme shadow-theme-sm p-6">
      <div className="flex items-center gap-2 mb-5">
        <Mail className="w-5 h-5 text-accent-gold" />
        <h2 className="text-base font-semibold text-theme-primary">Change Email</h2>
      </div>

      {/* Current email display */}
      <div className="mb-5 px-3 py-2.5 bg-theme-primary border border-theme rounded-lg">
        <p className="text-xs text-theme-muted mb-0.5">Current email</p>
        <p className="text-sm font-medium text-theme-primary">{currentEmail || '—'}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-theme-primary mb-1">New Email Address</label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-theme-muted" />
            <input
              type="email"
              value={newEmail}
              onChange={e => setNewEmail(e.target.value)}
              placeholder="Enter new email"
              className={`w-full pl-10 pr-4 py-2.5 border ${errors.email ? 'border-red-500' : 'border-theme'} bg-theme-primary text-theme-primary rounded-lg focus:ring-2 focus:ring-accent-gold/20 focus:border-accent-gold outline-none transition-all text-sm`}
            />
          </div>
          {errors.email && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.email}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-theme-primary mb-1">Confirm with Current Password</label>
          <PasswordInput
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Enter current password"
            error={errors.password}
            show={showPw}
            onToggle={() => setShowPw(v => !v)}
          />
          {errors.password && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.password}</p>}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="bg-accent-gold text-white px-5 py-2.5 rounded-lg font-semibold text-sm hover:bg-accent-goldDark transition flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {loading
            ? <><Loader2 className="w-4 h-4 animate-spin" />Updating...</>
            : <><CheckCircle className="w-4 h-4" />Update Email</>
          }
        </button>
      </form>
    </div>
  );
}

// ── Password change section ───────────────────────────────────────────────────
function PasswordSection() {
  const [currentPassword,    setCurrentPassword]    = useState('');
  const [newPassword,        setNewPassword]        = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showCurrent,        setShowCurrent]        = useState(false);
  const [showNew,            setShowNew]            = useState(false);
  const [showConfirm,        setShowConfirm]        = useState(false);
  const [loading,            setLoading]            = useState(false);
  const [errors,             setErrors]             = useState({});

  const validate = () => {
    const e = {};
    if (!currentPassword) e.currentPassword = 'Current password is required';
    if (!newPassword)     e.newPassword = 'New password is required';
    else if (newPassword.length < 8) e.newPassword = 'Password must be at least 8 characters';
    if (!confirmNewPassword) e.confirmNewPassword = 'Please confirm your new password';
    else if (newPassword !== confirmNewPassword) e.confirmNewPassword = 'Passwords do not match';
    if (currentPassword && newPassword && currentPassword === newPassword)
      e.newPassword = 'New password must differ from current password';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      await api.post('/auth/change-password', { currentPassword, newPassword });
      toast.success('Password changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
      setErrors({});
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to change password';
      toast.error(msg);
      if (msg.toLowerCase().includes('current password')) setErrors({ currentPassword: msg });
    } finally {
      setLoading(false);
    }
  };

  const checks = [
    { label: 'At least 8 characters',   met: newPassword.length >= 8 },
    { label: 'One uppercase letter',    met: /[A-Z]/.test(newPassword) },
    { label: 'One lowercase letter',    met: /[a-z]/.test(newPassword) },
    { label: 'One number',              met: /[0-9]/.test(newPassword) },
    { label: 'One special character',   met: /[@$!%*?&#^()_\-+=]/.test(newPassword) },
    { label: 'Passwords match',         met: newPassword.length > 0 && newPassword === confirmNewPassword },
  ];

  return (
    <div className="space-y-4">
      <div className="bg-theme-secondary rounded-lg border border-theme shadow-theme-sm p-6">
        <div className="flex items-center gap-2 mb-5">
          <Lock className="w-5 h-5 text-accent-gold" />
          <h2 className="text-base font-semibold text-theme-primary">Change Password</h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-theme-primary mb-1">Current Password</label>
            <PasswordInput
              value={currentPassword}
              onChange={e => setCurrentPassword(e.target.value)}
              placeholder="Enter current password"
              error={errors.currentPassword}
              show={showCurrent}
              onToggle={() => setShowCurrent(v => !v)}
            />
            {errors.currentPassword && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.currentPassword}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-theme-primary mb-1">New Password</label>
            <PasswordInput
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              placeholder="Enter new password"
              error={errors.newPassword}
              show={showNew}
              onToggle={() => setShowNew(v => !v)}
            />
            {errors.newPassword && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.newPassword}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-theme-primary mb-1">Confirm New Password</label>
            <PasswordInput
              value={confirmNewPassword}
              onChange={e => setConfirmNewPassword(e.target.value)}
              placeholder="Confirm new password"
              error={errors.confirmNewPassword}
              show={showConfirm}
              onToggle={() => setShowConfirm(v => !v)}
            />
            {errors.confirmNewPassword && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.confirmNewPassword}</p>}
          </div>

          <div className="pt-1">
            <button
              type="submit"
              disabled={loading}
              className="bg-accent-gold text-white px-5 py-2.5 rounded-lg font-semibold text-sm hover:bg-accent-goldDark transition flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading
                ? <><Loader2 className="w-4 h-4 animate-spin" />Updating...</>
                : <><CheckCircle className="w-4 h-4" />Update Password</>
              }
            </button>
          </div>
        </form>
      </div>

      {/* Live requirements */}
      <div className="bg-theme-secondary rounded-lg border border-theme shadow-theme-sm p-4">
        <h3 className="text-sm font-semibold text-theme-primary mb-3">Password Requirements</h3>
        <ul className="space-y-1.5">
          {checks.map(c => (
            <li key={c.label} className="flex items-center gap-2 text-sm text-theme-muted">
              <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${c.met ? 'bg-green-500' : 'bg-gray-400'}`} />
              {c.label}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
const ChangePassword = () => {
  const { auth, setAuth } = useAuth();
  const currentEmail = auth?.user?.email;

  return (
    <div className="space-y-6 max-w-[1700px] mx-auto pb-10">
      <PageHeader
        title="My Account"
        subtitle="Update your email address and password"
        icon={UserCog}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-4xl">
        <EmailSection currentEmail={currentEmail} setAuth={setAuth} />
        <PasswordSection />
      </div>
    </div>
  );
};

export default ChangePassword;
