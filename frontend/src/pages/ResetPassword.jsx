import React, { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, Loader2, Lock, ArrowLeft, CheckCircle } from 'lucide-react';
import api from '../api/axios';

const ResetPassword = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const token = searchParams.get('token');

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!password) {
            setError('Password is required');
            return;
        }
        if (password.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }
        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }
        if (!token) {
            setError('Invalid or missing reset token. Please request a new reset link.');
            return;
        }

        setLoading(true);
        try {
            await api.post('/auth/reset-password', { token, password });
            setSuccess(true);
            setTimeout(() => {
                navigate('/login');
            }, 3000);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to reset password. The link may have expired.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-700 px-4">
            <div className="w-full max-w-md">
                <div className="bg-white rounded-xl shadow-2xl p-8 animate-fadeIn">
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">General BMS</h1>
                        <p className="text-gray-600 mt-2">Create a new password</p>
                    </div>

                    {success ? (
                        <div className="text-center space-y-4">
                            <div className="flex justify-center">
                                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                                    <CheckCircle className="w-8 h-8 text-green-600" />
                                </div>
                            </div>
                            <h2 className="text-lg font-semibold text-gray-900">Password reset successful</h2>
                            <p className="text-gray-600 text-sm">
                                Your password has been reset successfully. You will be redirected to the login page shortly.
                            </p>
                            <Link
                                to="/login"
                                className="inline-flex items-center gap-2 text-[#D4AF37] hover:text-[#C5A353] font-medium text-sm transition-colors mt-4"
                            >
                                <ArrowLeft className="w-4 h-4" />
                                Go to sign in now
                            </Link>
                        </div>
                    ) : !token ? (
                        <div className="text-center space-y-4">
                            <div className="flex justify-center">
                                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                                    <Lock className="w-8 h-8 text-red-600" />
                                </div>
                            </div>
                            <h2 className="text-lg font-semibold text-gray-900">Invalid Reset Link</h2>
                            <p className="text-gray-600 text-sm">
                                This password reset link is invalid or has expired. Please request a new one.
                            </p>
                            <Link
                                to="/forgot-password"
                                className="inline-flex items-center gap-2 text-[#D4AF37] hover:text-[#C5A353] font-medium text-sm transition-colors mt-4"
                            >
                                Request new reset link
                            </Link>
                        </div>
                    ) : (
                        <>
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div>
                                    <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                                        New Password
                                    </label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                        <input
                                            id="password"
                                            type={showPassword ? 'text' : 'password'}
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className="block w-full pl-10 pr-10 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/30 focus:border-[#D4AF37] transition-all"
                                            placeholder="Enter new password"
                                        />
                                        <button
                                            type="button"
                                            className="absolute inset-y-0 right-0 flex items-center pr-3"
                                            onClick={() => setShowPassword(!showPassword)}
                                        >
                                            {showPassword ? (
                                                <EyeOff className="w-5 h-5 text-gray-400 hover:text-gray-600 transition-colors" />
                                            ) : (
                                                <Eye className="w-5 h-5 text-gray-400 hover:text-gray-600 transition-colors" />
                                            )}
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                                        Confirm New Password
                                    </label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                        <input
                                            id="confirmPassword"
                                            type={showConfirmPassword ? 'text' : 'password'}
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            className="block w-full pl-10 pr-10 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/30 focus:border-[#D4AF37] transition-all"
                                            placeholder="Confirm new password"
                                        />
                                        <button
                                            type="button"
                                            className="absolute inset-y-0 right-0 flex items-center pr-3"
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        >
                                            {showConfirmPassword ? (
                                                <EyeOff className="w-5 h-5 text-gray-400 hover:text-gray-600 transition-colors" />
                                            ) : (
                                                <Eye className="w-5 h-5 text-gray-400 hover:text-gray-600 transition-colors" />
                                            )}
                                        </button>
                                    </div>
                                </div>

                                {error && (
                                    <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
                                )}

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full flex items-center justify-center gap-2 bg-[#D4AF37] hover:bg-[#C5A353] text-white font-semibold py-3 rounded-lg transition-all transform active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            Resetting...
                                        </>
                                    ) : (
                                        'Reset Password'
                                    )}
                                </button>
                            </form>

                            <div className="mt-6 text-center">
                                <Link
                                    to="/login"
                                    className="inline-flex items-center gap-2 text-[#D4AF37] hover:text-[#C5A353] font-medium text-sm transition-colors"
                                >
                                    <ArrowLeft className="w-4 h-4" />
                                    Back to sign in
                                </Link>
                            </div>
                        </>
                    )}
                </div>

                <div className="text-center mt-6 text-gray-400 text-xs">
                    &copy; {new Date().getFullYear()} General BMS. All rights reserved.
                </div>
            </div>
        </div>
    );
};

export default ResetPassword;
