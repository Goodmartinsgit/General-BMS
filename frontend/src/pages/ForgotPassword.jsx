import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, Loader2, CheckCircle } from 'lucide-react';
import api from '../api/axios';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!email.trim()) {
            setError('Email is required');
            return;
        }

        setLoading(true);
        try {
            await api.post('/auth/forgot-password', { email });
            setSubmitted(true);
        } catch (err) {
            setError(err.response?.data?.message || 'Something went wrong. Please try again.');
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
                        <p className="text-gray-600 mt-2">Reset your password</p>
                    </div>

                    {submitted ? (
                        <div className="text-center space-y-4">
                            <div className="flex justify-center">
                                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                                    <CheckCircle className="w-8 h-8 text-green-600" />
                                </div>
                            </div>
                            <h2 className="text-lg font-semibold text-gray-900">Check your email</h2>
                            <p className="text-gray-600 text-sm">
                                If an account exists with <span className="font-medium">{email}</span>, we've sent a password reset link. Please check your inbox and spam folder.
                            </p>
                            <Link
                                to="/login"
                                className="inline-flex items-center gap-2 text-[#D4AF37] hover:text-[#C5A353] font-medium text-sm transition-colors mt-4"
                            >
                                <ArrowLeft className="w-4 h-4" />
                                Back to sign in
                            </Link>
                        </div>
                    ) : (
                        <>
                            <p className="text-gray-600 text-sm text-center mb-6">
                                Enter your email address and we'll send you a link to reset your password.
                            </p>

                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div>
                                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                                        Email address
                                    </label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                        <input
                                            id="email"
                                            type="email"
                                            autoComplete="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className={`block w-full pl-10 pr-4 py-3 bg-gray-50 border ${error ? 'border-red-500' : 'border-gray-200'} rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/30 focus:border-[#D4AF37] transition-all`}
                                            placeholder="name@company.com"
                                        />
                                    </div>
                                    {error && (
                                        <p className="mt-1 text-sm text-red-600">{error}</p>
                                    )}
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full flex items-center justify-center gap-2 bg-[#D4AF37] hover:bg-[#C5A353] text-white font-semibold py-3 rounded-lg transition-all transform active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            Sending...
                                        </>
                                    ) : (
                                        'Send Reset Link'
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

export default ForgotPassword;
