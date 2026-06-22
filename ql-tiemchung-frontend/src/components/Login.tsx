import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Syringe, User, Lock, ArrowRight, AlertCircle, ShieldCheck } from 'lucide-react';

const Login: React.FC = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const response = await fetch('http://localhost:8080/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            const data = await response.json();

            if (data.success) {
                // Lưu trạng thái đăng nhập vào localStorage
                localStorage.setItem('user', JSON.stringify({ hoTen: data.hoTen }));
                // Chuyển hướng sang trang App (Dashboard)
                navigate('/app');
            } else {
                setError(data.message || 'Tên đăng nhập hoặc mật khẩu không chính xác.');
            }
        } catch (err) {
            setError('Lỗi kết nối đến server! Vui lòng thử lại sau.');
        }
    };

    return (
        <div className="min-h-screen bg-sky-50 flex items-center justify-center p-4 font-sans select-none antialiased">
            <div className="bg-white w-full max-w-md rounded-[2rem] border border-sky-100 shadow-xl shadow-blue-900/5 p-8 relative overflow-hidden">
                {/* Decorative Elements */}
                <div className="absolute -right-16 -top-16 w-48 h-48 bg-blue-50/50 rounded-full"></div>
                <div className="absolute -left-8 -bottom-8 w-32 h-32 bg-sky-50/50 rounded-full"></div>

                {/* Header */}
                <div className="relative z-10 mb-8 text-center">
                    <div className="w-16 h-16 bg-gradient-to-tr from-blue-600 to-sky-500 rounded-2xl flex items-center justify-center text-white mx-auto shadow-lg shadow-blue-500/20 mb-5">
                        <Syringe className="w-8 h-8" />
                    </div>
                    <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">VaccineFlow Pro</h2>
                    <p className="text-sm text-slate-500 mt-1.5 font-medium">Hệ thống Quản lý Tiêm chủng GSP V.2</p>
                </div>

                {/* Error Banner */}
                {error && (
                    <div className="relative z-10 mb-6 p-3.5 bg-red-50 border border-red-100 rounded-xl flex items-start gap-2.5 text-red-600 text-sm animate-fade-in shadow-sm">
                        <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                        <span className="font-medium">{error}</span>
                    </div>
                )}

                {/* Login Form */}
                <form onSubmit={handleLogin} className="relative z-10 space-y-5">
                    <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">
                            Tên đăng nhập
                        </label>
                        <div className="relative">
                            <User className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                placeholder="Nhập tài khoản của bạn..."
                                required
                                className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-slate-50 focus:bg-white text-slate-800 font-medium placeholder:text-slate-400"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">
                            Mật khẩu truy cập
                        </label>
                        <div className="relative">
                            <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                required
                                className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-slate-50 focus:bg-white text-slate-800 font-medium placeholder:text-slate-400"
                            />
                        </div>
                    </div>

                    <div className="pt-2">
                        <button
                            type="submit"
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm px-5 py-3.5 rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-blue-600/20 transition-all active:scale-[0.98] group"
                        >
                            Đăng nhập vào Hệ thống
                            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </button>
                    </div>
                </form>

                {/* Footer notes */}
                <div className="relative z-10 mt-8 pt-6 border-t border-slate-100 flex items-center justify-center gap-1.5 text-[11px] text-slate-400 font-semibold uppercase tracking-wider">
                    <ShieldCheck className="w-4 h-4" />
                    <span>Hệ thống bảo mật nội bộ 256-bit</span>
                </div>
            </div>
        </div>
    );
};

export default Login;