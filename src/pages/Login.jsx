import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FiLock, FiMail, FiAlertCircle, FiEye, FiEyeOff } from 'react-icons/fi';
import loginBg from '../assets/loginbg3.jpg';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            setError('');
            setLoading(true);
            await login(email, password);
            navigate('/');
        } catch (err) {
            setError('Failed to log in. Please check your credentials.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen relative flex items-center justify-center p-4 overflow-hidden">
            {/* Background Image with Subtle Overlay */}
            <div
                className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                style={{ backgroundImage: `url(${loginBg})` }}
            >
                {/* Subtle dark overlay for text readability */}
                <div className="absolute inset-0 bg-black/30"></div>
            </div>

            {/* Login Card */}
            <div className="relative z-10 w-full max-w-md">
                {/* Logo/Brand Section */}
                <div className="text-center mb-8 animate-fade-in">
                    {/* <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 shadow-2xl mb-4 transform hover:scale-110 transition-transform duration-300">
                        <span className="text-3xl font-bold text-white">S</span>
                    </div> */}
                    <h1 className="text-4xl font-bold text-white mb-2 tracking-tight">
                        SANDHYA MANAGEMENT 
                    </h1>
                    {/* <p className="text-slate-300 text-lg">Sandhya Management System</p> */}
                </div>

                {/* Glassmorphic Card */}
                <div className="bg-white/15 backdrop-blur-2xl rounded-3xl shadow-[0_8px_32px_0_rgba(0,0,0,0.4)] p-8 border border-white/30 transform hover:scale-[1.01] transition-all duration-300">
                    {error && (
                        <div className="bg-red-500/20 border border-red-400/50 text-red-100 px-4 py-3 rounded-xl mb-6 flex items-center gap-3 animate-shake">
                            <FiAlertCircle className="w-5 h-5 flex-shrink-0" />
                            <span className="text-sm">{error}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Email Field */}
                        <div className="group">
                            <label className="block text-slate-200 text-sm font-semibold mb-2 ml-1">
                                Email Address
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <FiMail className="text-slate-400 group-focus-within:text-orange-400 transition-colors" />
                                </div>
                                <input
                                    type="email"
                                    required
                                    className="w-full pl-12 pr-4 py-3.5 bg-white/5 border border-slate-600/50 rounded-xl focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/50 text-white placeholder-slate-400 transition-all duration-300 hover:bg-white/10"
                                    placeholder="admin@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Password Field */}
                        <div className="group">
                            <label className="block text-slate-200 text-sm font-semibold mb-2 ml-1">
                                Password
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <FiLock className="text-slate-400 group-focus-within:text-orange-400 transition-colors" />
                                </div>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    required
                                    className="w-full pl-12 pr-12 py-3.5 bg-white/5 border border-slate-600/50 rounded-xl focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/50 text-white placeholder-slate-400 transition-all duration-300 hover:bg-white/10"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-orange-400 transition-colors"
                                >
                                    {showPassword ? <FiEyeOff className="w-5 h-5" /> : <FiEye className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>

                        {/* Remember Me & Forgot Password */}
                        <div className="flex items-center justify-between text-sm">
                            <label className="flex items-center gap-2 cursor-pointer group">
                                <input
                                    type="checkbox"
                                    className="w-4 h-4 rounded border-slate-600 bg-white/5 text-orange-500 focus:ring-orange-500 focus:ring-offset-0 cursor-pointer"
                                />
                                <span className="text-slate-300 group-hover:text-white transition-colors">Remember me</span>
                            </label>
                            <a href="#" className="text-orange-400 hover:text-orange-300 font-medium transition-colors">
                                Forgot password?
                            </a>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-4 px-6 bg-gradient-to-r from-orange-500 via-orange-600 to-orange-700 hover:from-orange-600 hover:via-orange-700 hover:to-orange-800 text-white font-bold rounded-xl shadow-lg shadow-orange-500/50 transform transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-orange-500/60 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none relative overflow-hidden group"
                        >
                            <span className="relative z-10">
                                {loading ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Signing in...
                                    </span>
                                ) : (
                                    'Sign In'
                                )}
                            </span>
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                        </button>
                    </form>

                    {/* Footer */}
                    <div className="mt-6 pt-6 border-t border-white/10 text-center">
                        <p className="text-slate-400 text-sm">
                            Don't have an account?{' '}
                            <a href="#" className="text-orange-400 hover:text-orange-300 font-semibold transition-colors">
                                Contact Admin
                            </a>
                        </p>
                    </div>
                </div>

                {/* Copyright */}
                {/* <div className="text-center mt-8 text-slate-400 text-sm">
                    <p>© 2025 Sandhya Management. All rights reserved.</p>
                </div> */}
            </div>

            {/* Custom Animations */}
            <style>{`
                @keyframes fade-in {
                    from {
                        opacity: 0;
                        transform: translateY(-20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                
                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    25% { transform: translateX(-5px); }
                    75% { transform: translateX(5px); }
                }

                .animate-fade-in {
                    animation: fade-in 0.6s ease-out;
                }

                .animate-shake {
                    animation: shake 0.4s ease-in-out;
                }

                .delay-1000 {
                    animation-delay: 1s;
                }
            `}</style>
        </div>
    );
};

export default Login;
