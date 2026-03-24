import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useBranding } from '../context/BrandingContext';

const Login = () => {
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();
    const { config } = useBranding();

    // Branding values with safe fallbacks
    const accent = config.accent_color || '#D4AF37';
    const hover = config.hover_color || '#C5A353';
    const companyName = config.company_name || 'General BMS';
    const logoUrl = config.logo_url;
    const logoIconText = config.logo_icon_text || 'BMS';
    const activeText = config.active_text_color || '#FFFFFF';

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm();

    const onSubmit = async (data) => {
        setLoading(true);
        try {
            await login(data.email, data.password);
            toast.success('Login successful!');
            navigate('/');
        } catch (error) {
            console.error('Login error:', error);
            toast.error(
                error.response?.data?.message || 'Login failed. Please check your credentials.'
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-700 px-3 sm:px-4">
            <div className="w-full max-w-md">
                <div className="bg-white rounded-lg sm:rounded-xl shadow-2xl p-6 sm:p-8 animate-fadeIn">
                    <div className="text-center mb-6 sm:mb-8">
                        {logoUrl ? (
                            <img
                                src={logoUrl}
                                alt={companyName}
                                className="h-14 sm:h-16 mx-auto mb-3 object-contain rounded-lg"
                            />
                        ) : (
                            <div
                                className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl mx-auto mb-3 flex items-center justify-center text-xl sm:text-2xl font-bold"
                                style={{ backgroundColor: accent, color: activeText }}
                            >
                                {logoIconText}
                            </div>
                        )}
                        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">{companyName}</h1>
                        <p className="text-gray-600 mt-1 sm:mt-2 text-sm sm:text-base">Sign in to your account</p>
                    </div>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 sm:space-y-6">
                        <div>
                            <label htmlFor="email" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                                Email address
                            </label>
                            <input
                                id="email"
                                type="email"
                                autoComplete="email"
                                className={`block w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-gray-50 border ${errors.email ? 'border-red-500' : 'border-gray-200'} rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 transition-all text-sm sm:text-base`}
                                style={{
                                    '--tw-ring-color': `${accent}4D`,
                                    borderColor: errors.email ? undefined : undefined,
                                }}
                                onFocus={e => {
                                    if (!errors.email) {
                                        e.target.style.borderColor = accent;
                                        e.target.style.boxShadow = `0 0 0 2px ${accent}30`;
                                    }
                                }}
                                onBlur={e => {
                                    e.target.style.borderColor = '';
                                    e.target.style.boxShadow = '';
                                }}
                                placeholder="name@company.com"
                                {...register('email', {
                                    required: 'Email is required',
                                    pattern: {
                                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                                        message: 'Invalid email address',
                                    },
                                })}
                            />
                            {errors.email && (
                                <p className="mt-1 text-xs sm:text-sm text-red-600">{errors.email.message}</p>
                            )}
                        </div>

                        <div>
                            <div className="flex items-center justify-between mb-1">
                                <label htmlFor="password" className="block text-xs sm:text-sm font-medium text-gray-700">
                                    Password
                                </label>
                                <a
                                    href="/forgot-password"
                                    className="text-xs sm:text-sm font-medium transition-colors"
                                    style={{ color: accent }}
                                    onMouseOver={e => (e.target.style.color = hover)}
                                    onMouseOut={e => (e.target.style.color = accent)}
                                >
                                    Forgot password?
                                </a>
                            </div>
                            <div className="relative">
                                <input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    autoComplete="current-password"
                                    className={`block w-full px-3 sm:px-4 py-2.5 sm:py-3 pr-10 bg-gray-50 border ${errors.password ? 'border-red-500' : 'border-gray-200'} rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 transition-all text-sm sm:text-base`}
                                    onFocus={e => {
                                        if (!errors.password) {
                                            e.target.style.borderColor = accent;
                                            e.target.style.boxShadow = `0 0 0 2px ${accent}30`;
                                        }
                                    }}
                                    onBlur={e => {
                                        e.target.style.borderColor = '';
                                        e.target.style.boxShadow = '';
                                    }}
                                    placeholder="Enter your password"
                                    {...register('password', {
                                        required: 'Password is required',
                                        minLength: {
                                            value: 6,
                                            message: 'Password must be at least 6 characters',
                                        },
                                    })}
                                />
                                <button
                                    type="button"
                                    className="absolute inset-y-0 right-0 flex items-center pr-3"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword ? (
                                        <EyeOff className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 hover:text-gray-600 transition-colors" />
                                    ) : (
                                        <Eye className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 hover:text-gray-600 transition-colors" />
                                    )}
                                </button>
                            </div>
                            {errors.password && (
                                <p className="mt-1 text-xs sm:text-sm text-red-600">
                                    {errors.password.message}
                                </p>
                            )}
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full flex items-center justify-center gap-2 font-semibold py-2.5 sm:py-3 rounded-lg transition-all transform active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed shadow-lg hover:shadow-xl text-sm sm:text-base"
                            style={{
                                backgroundColor: accent,
                                color: activeText,
                            }}
                            onMouseOver={e => (e.target.style.backgroundColor = hover)}
                            onMouseOut={e => (e.target.style.backgroundColor = accent)}
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                                    Signing in...
                                </>
                            ) : (
                                'Sign in'
                            )}
                        </button>
                    </form>

                    <div className="mt-6 sm:mt-8 text-center border-t border-gray-100 pt-4 sm:pt-6">
                        <p className="text-gray-500 text-xs sm:text-sm">
                            Don't have an account?{' '}
                            <a
                                href="#"
                                className="font-medium transition-colors"
                                style={{ color: accent }}
                                onMouseOver={e => (e.target.style.color = hover)}
                                onMouseOut={e => (e.target.style.color = accent)}
                            >
                                Contact Admin
                            </a>
                        </p>
                    </div>
                </div>

                <div className="text-center mt-4 sm:mt-6 text-gray-400 text-[10px] sm:text-xs">
                    &copy; {new Date().getFullYear()} {companyName}. All rights reserved.
                </div>
            </div>
        </div>
    );
};

export default Login;
