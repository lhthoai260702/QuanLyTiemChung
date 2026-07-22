import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Syringe, User, Lock, ArrowRight, AlertCircle, ShieldCheck, RefreshCcw } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';

const Login: React.FC = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false); // Thêm trạng thái loading để tránh spam click
    const navigate = useNavigate();

    // === STATE & REF CHO CAPTCHA ===
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [captchaText, setCaptchaText] = useState('');
    const [captchaInput, setCaptchaInput] = useState('');

    // Dùng useCallback cho drawCaptcha để tránh tạo lại hàm
    const drawCaptcha = useCallback((text: string) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Xóa nền cũ và tô nền xám nhạt
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#f8fafc'; // Màu nền
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Vẽ các đường nhiễu (noise lines) để đánh lừa bot
        for (let i = 0; i < 7; i++) {
            ctx.beginPath();
            ctx.moveTo(Math.random() * canvas.width, Math.random() * canvas.height);
            ctx.lineTo(Math.random() * canvas.width, Math.random() * canvas.height);
            ctx.strokeStyle = '#cbd5e1'; 
            ctx.lineWidth = 1.5;
            ctx.stroke();
        }

        // Cấu hình font chữ và in mã lên Canvas
        ctx.font = 'bold 24px "Courier New", monospace';
        ctx.fillStyle = '#334155';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Vẽ chữ hơi lệch một chút để tạo độ khó cho máy đọc
        ctx.setTransform(1, Math.random() * 0.1 - 0.05, Math.random() * 0.1 - 0.05, 1, 0, 0);
        ctx.fillText(text, canvas.width / 2, canvas.height / 2 + 2);
        ctx.setTransform(1, 0, 0, 1, 0, 0); // Trả lại gốc
    }, []);

    // Hàm sinh ngẫu nhiên mã CAPTCHA
    const generateCaptcha = useCallback(() => {
        const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
        let captcha = '';
        for (let i = 0; i < 6; i++) {
            captcha += chars[Math.floor(Math.random() * chars.length)];
        }
        setCaptchaText(captcha);
        drawCaptcha(captcha);
    }, [drawCaptcha]);

    // Khởi tạo CAPTCHA ngay khi load trang
    useEffect(() => {
        generateCaptcha();
    }, [generateCaptcha]);
    // ==================================

    // Hàm đăng nhập truyền thống (Username/Password)
    const handleLogin = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();

        // 1. KIỂM TRA CAPTCHA TRƯỚC KHI GỌI API
        if (captchaInput !== captchaText) {
            setError('Mã xác nhận (CAPTCHA) không chính xác!');
            generateCaptcha(); // Bắt buộc nhập lại mã mới
            setCaptchaInput('');
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            const data = await response.json();

            if (data.success) {
                localStorage.setItem('user', JSON.stringify({ 
                    hoTen: data.hoTen,
                    maQuyen: data.maQuyen
                }));
                
                if (data.token) {
                    localStorage.setItem('token', data.token);
                }

                navigate('/app');
            } else {
                setError(data.message || 'Tên đăng nhập hoặc mật khẩu không chính xác.');
                generateCaptcha(); // Refresh mã khi sai pass
                setCaptchaInput('');
            }
        } catch (err) {
            setError('Lỗi kết nối đến server! Vui lòng kiểm tra lại Backend.');
        } finally {
            setIsLoading(false);
        }
    }, [username, password, captchaInput, captchaText, generateCaptcha, navigate]);

    // Hàm xử lý đăng nhập bằng Google
    const handleGoogleSuccess = useCallback(async (credentialResponse: any) => {
        const googleToken = credentialResponse.credential;
        setIsLoading(true);
        setError('');
        
        try {
            const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/auth/google`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token: googleToken })
            });
            
            const data = await response.json();
            
            if (data.success) { 
                localStorage.setItem('user', JSON.stringify({ 
                    hoTen: data.hoTen,
                    maQuyen: data.maQuyen 
                }));
                
                if (data.token) {
                    localStorage.setItem('token', data.token);
                }
                navigate('/app'); 
            } else {
                setError(data.message || 'Xác thực Google thất bại!');
            }
        } catch (error) {
            setError('Lỗi kết nối đến server khi xác thực Google!');
        } finally {
            setIsLoading(false);
        }
    }, [navigate]);

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
                    <p className="text-sm text-slate-500 mt-1.5 font-medium">Hệ thống Quản lý Tiêm chủng</p>
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
                                disabled={isLoading}
                                className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-slate-50 focus:bg-white text-slate-800 font-medium placeholder:text-slate-400 disabled:opacity-60"
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
                                disabled={isLoading}
                                className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-slate-50 focus:bg-white text-slate-800 font-medium placeholder:text-slate-400 disabled:opacity-60"
                            />
                        </div>
                    </div>

                    {/* === KHỐI NHẬP MÃ CAPTCHA === */}
                    <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">
                            Mã xác nhận
                        </label>
                        <div className="flex gap-3">
                            <div className="relative flex-1">
                                <ShieldCheck className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                                <input
                                    type="text"
                                    value={captchaInput}
                                    onChange={(e) => setCaptchaInput(e.target.value)}
                                    placeholder="Nhập mã bên cạnh..."
                                    required
                                    maxLength={6}
                                    disabled={isLoading}
                                    className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-slate-50 focus:bg-white text-slate-800 font-bold placeholder:text-slate-400 placeholder:font-medium tracking-widest disabled:opacity-60"
                                />
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                                {/* Thẻ Canvas vẽ CAPTCHA */}
                                <canvas 
                                    ref={canvasRef} 
                                    width="110" 
                                    height="42" 
                                    className="border border-slate-200 rounded-xl shadow-sm cursor-pointer hover:border-blue-400 transition-colors bg-[#f8fafc]" 
                                    onClick={!isLoading ? generateCaptcha : undefined} 
                                    title="Nhấn để đổi mã mới"
                                ></canvas>
                                {/* Nút Refresh */}
                                <button 
                                    type="button" 
                                    onClick={generateCaptcha} 
                                    disabled={isLoading}
                                    className="p-2.5 bg-slate-100 hover:bg-blue-50 hover:text-blue-600 text-slate-500 rounded-xl transition-colors outline-none cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed" 
                                    title="Đổi mã khác"
                                >
                                    <RefreshCcw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                                </button>
                            </div>
                        </div>
                    </div>
                    {/* ============================== */}

                    <div className="pt-2">
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm px-5 py-3.5 rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-blue-600/20 transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed group"
                        >
                            {isLoading ? "Đang xác thực..." : "Đăng nhập"}
                            {!isLoading && <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />}
                        </button>
                    </div>
                </form>

                {/* Khối Đăng nhập bằng Google */}
                <div className="relative z-10 mt-6">
                    <div className="flex items-center justify-between mb-6">
                        <span className="border-b border-slate-200 w-1/5 lg:w-1/4"></span>
                        <span className="text-[11px] text-center text-slate-400 uppercase font-bold tracking-widest">Hoặc đăng nhập bằng</span>
                        <span className="border-b border-slate-200 w-1/5 lg:w-1/4"></span>
                    </div>
                    
                    <div className="flex justify-center">
                        <div className={isLoading ? "opacity-50 pointer-events-none" : ""}>
                            <GoogleLogin 
                                onSuccess={handleGoogleSuccess} 
                                onError={() => setError('Đăng nhập Google bị hủy hoặc có lỗi xảy ra!')}
                                theme="outline"
                                size="large"
                                text="signin_with"
                                shape="pill"
                            />
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default Login;