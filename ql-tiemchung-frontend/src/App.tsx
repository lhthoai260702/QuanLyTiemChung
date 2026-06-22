import React, { useState, useEffect } from 'react';
import {
  initialUsers,
  initialVaccines,
  initialPatients,
  initialAppointments,
  initialTickets,
  initialFAQs,
  initialInvoices,
  initialSystemLogs,
  initialStockLogs
} from './mockData';

import {
  UserAccount,
  Vaccine,
  Patient,
  Appointment,
  SupportTicket,
  FAQ,
  Invoice,
  SystemLog,
  StockLog
} from './types';

// Importing submodules
import AdminModule from './components/AdminModule';
import InventoryModule from './components/InventoryModule';
import MedicalModule from './components/MedicalModule';
import CustomerModule from './components/CustomerModule';
import SupportModule from './components/SupportModule';
import FinanceModule from './components/FinanceModule';

// Lucide icons
import {
  Syringe,
  Layers,
  Bell,
  Settings,
  Shield,
  Activity,
  Archive,
  Users,
  Heart,
  MessageSquare,
  DollarSign,
  Info,
  CheckCircle2,
  Lock,
  Menu,
  ChevronRight,
  LogOut,
  Sliders,
  Sparkles,
  Home,
  ArrowRight
} from 'lucide-react';

type RoleType = 'Admin' | 'Inventory' | 'Medical' | 'Customer' | 'Support' | 'Finance';

export default function App() {
  // 1. Core States with localStorage persistence
  const [users, setUsers] = useState<UserAccount[]>(() => {
    const saved = localStorage.getItem('mediflow_users');
    return saved ? JSON.parse(saved) : initialUsers;
  });

  const [vaccines, setVaccines] = useState<Vaccine[]>(() => {
    const saved = localStorage.getItem('mediflow_vaccines');
    return saved ? JSON.parse(saved) : initialVaccines;
  });

  const [patients, setPatients] = useState<Patient[]>(() => {
    const saved = localStorage.getItem('mediflow_patients');
    return saved ? JSON.parse(saved) : initialPatients;
  });

  const [appointments, setAppointments] = useState<Appointment[]>(() => {
    const saved = localStorage.getItem('mediflow_appointments');
    return saved ? JSON.parse(saved) : initialAppointments;
  });

  const [tickets, setTickets] = useState<SupportTicket[]>(() => {
    const saved = localStorage.getItem('mediflow_tickets');
    return saved ? JSON.parse(saved) : initialTickets;
  });

  const [faqs, setFaqs] = useState<FAQ[]>(() => {
    const saved = localStorage.getItem('mediflow_faqs');
    return saved ? JSON.parse(saved) : initialFAQs;
  });

  const [invoices, setInvoices] = useState<Invoice[]>(() => {
    const saved = localStorage.getItem('mediflow_invoices');
    return saved ? JSON.parse(saved) : initialInvoices;
  });

  const [systemLogs, setSystemLogs] = useState<SystemLog[]>(() => {
    const saved = localStorage.getItem('mediflow_system_logs');
    return saved ? JSON.parse(saved) : initialSystemLogs;
  });

  const [stockLogs, setStockLogs] = useState<StockLog[]>(() => {
    const saved = localStorage.getItem('mediflow_stock_logs');
    return saved ? JSON.parse(saved) : initialStockLogs;
  });

  // 2. Navigation Active States
  const [activeRole, setActiveRole] = useState<RoleType>('Admin');
  const [viewMode, setViewMode] = useState<'hub' | 'module'>('hub');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // 3. Persist hooks
  useEffect(() => {
    localStorage.setItem('mediflow_users', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem('mediflow_vaccines', JSON.stringify(vaccines));
  }, [vaccines]);

  useEffect(() => {
    localStorage.setItem('mediflow_patients', JSON.stringify(patients));
  }, [patients]);

  useEffect(() => {
    localStorage.setItem('mediflow_appointments', JSON.stringify(appointments));
  }, [appointments]);

  useEffect(() => {
    localStorage.setItem('mediflow_tickets', JSON.stringify(tickets));
  }, [tickets]);

  useEffect(() => {
    localStorage.setItem('mediflow_faqs', JSON.stringify(faqs));
  }, [faqs]);

  useEffect(() => {
    localStorage.setItem('mediflow_invoices', JSON.stringify(invoices));
  }, [invoices]);

  useEffect(() => {
    localStorage.setItem('mediflow_system_logs', JSON.stringify(systemLogs));
  }, [systemLogs]);

  useEffect(() => {
    localStorage.setItem('mediflow_stock_logs', JSON.stringify(stockLogs));
  }, [stockLogs]);

  // Toast trigger utility
  const triggerToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  };

  // Safe reset utility to purge localStorage and restart
  const resetDatabaseToDefault = () => {
    if (confirm('Bạn có thực sự muốn reset lại toàn bộ dữ liệu mẫu đã nhập về trạng thái ban đầu?')) {
      localStorage.removeItem('mediflow_users');
      localStorage.removeItem('mediflow_vaccines');
      localStorage.removeItem('mediflow_patients');
      localStorage.removeItem('mediflow_appointments');
      localStorage.removeItem('mediflow_tickets');
      localStorage.removeItem('mediflow_faqs');
      localStorage.removeItem('mediflow_invoices');
      localStorage.removeItem('mediflow_system_logs');
      localStorage.removeItem('mediflow_stock_logs');
      
      setUsers(initialUsers);
      setVaccines(initialVaccines);
      setPatients(initialPatients);
      setAppointments(initialAppointments);
      setTickets(initialTickets);
      setFaqs(initialFAQs);
      setInvoices(initialInvoices);
      setSystemLogs(initialSystemLogs);
      setStockLogs(initialStockLogs);
      
      triggerToast('Đã xóa dữ liệu cục bộ và khôi phục thành công Cơ sở dữ liệu mẫu GSP!');
    }
  };

  // Get active role user detail
  const getActiveUserDetail = () => {
    switch (activeRole) {
      case 'Admin':
        return { name: 'Phạm Hải Đăng', mail: 'dang.ph@mediflow.com', badge: '👑 Quản Trị Hệ Thống' };
      case 'Inventory':
        return { name: 'Trần Thị Mỹ Linh', mail: 'linh.ttm@mediflow.com', badge: '📦 Trưởng Kho Vật Tư' };
      case 'Medical':
        return { name: 'Dr. Hoàng Quốc Việt', mail: 'viet.hq@mediflow.com', badge: '🩺 Bác Sĩ Trưởng Khoa' };
      case 'Customer':
        return { name: 'Nguyễn Thị A (Bố Mẹ)', mail: 'parent.a@gmail.com', badge: '👤 Phụ huynh Trẻ nhỏ' };
      case 'Support':
        return { name: 'Lê Văn Thanh', mail: 'thanh.lv@mediflow.com', badge: '💬 Chăm Sóc Khách Hàng' };
      case 'Finance':
        return { name: 'Tống Khánh Linh', mail: 'linh.tk@mediflow.com', badge: '💵 Kiểm Toán Trường' };
    }
  };

  const userDetail = getActiveUserDetail();

  return (
    <div className="min-h-screen bg-sky-50 flex flex-col font-sans select-none antialiased overflow-x-hidden">
      
      {/* 1. VIEW MODE SWITCHBOARD */}
      {viewMode === 'hub' ? (
        <div className="flex-1 flex flex-col">
          {/* Top Navbar */}
          <nav className="h-16 bg-white border-b border-sky-100 flex items-center justify-between px-6 sm:px-8 shrink-0 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-tr from-blue-600 to-sky-500 rounded-xl flex items-center justify-center text-white font-extrabold text-xl shadow-md shadow-blue-500/20">
                <Syringe className="w-5 h-5" />
              </div>
              <span className="text-xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-blue-700 to-sky-500 tracking-tight">
                VaccineFlow Pro
              </span>
            </div>
            <div className="flex items-center gap-6">
              <div className="hidden sm:flex items-center gap-2 bg-sky-50 px-3 py-1.5 rounded-full border border-sky-200">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-xs font-semibold text-sky-800 uppercase tracking-wider">Hệ thống đang hoạt động</span>
              </div>
              
              <div className="flex items-center gap-3 border-l pl-6 border-sky-100">
                <div className="text-right hidden xs:block">
                  <p className="text-sm font-bold text-slate-800">{userDetail.name}</p>
                  <p className="text-[10px] text-sky-600 uppercase font-bold tracking-wider">{userDetail.badge}</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-blue-100 border-2 border-white shadow-sm flex items-center justify-center text-blue-600 font-bold uppercase">
                  {userDetail.name.substring(0, 2).toUpperCase()}
                </div>
              </div>
            </div>
          </nav>

          {/* Main Content Hub */}
          <main className="flex-1 max-w-7xl mx-auto w-full p-6 sm:p-10 flex flex-col justify-center my-auto">
            <div className="mb-8">
              <span className="text-xs font-extrabold text-blue-600 tracking-widest uppercase mb-1.5 block">Hệ thống Tiêm chủng Quốc gia</span>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-950 tracking-tight">Cổng Hành Chính Phân Hệ Công Việc</h1>
              <p className="text-slate-500 mt-1">Chào buổi sáng, {userDetail.name}! Vui lòng chọn phân hệ nghiệp vụ để kiểm thử liên ngành.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {/* Card 1: Admin */}
              <button
                onClick={() => {
                  setActiveRole('Admin');
                  setViewMode('module');
                  triggerToast('Góc nhìn Admin: Thiết lập điểm tiêm chủng và quản trị cổng');
                }}
                className="bg-white rounded-3xl p-6 border-2 border-white shadow-xl shadow-blue-900/5 hover:border-blue-200/50 hover:shadow-2xl hover:shadow-blue-900/10 hover:-translate-y-1 transition-all duration-300 text-left relative overflow-hidden group outline-none cursor-pointer"
              >
                <div className="absolute -right-4 -top-4 w-24 h-24 bg-blue-50/50 rounded-full transition-transform group-hover:scale-125 duration-300"></div>
                <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-blue-200 text-white relative z-10">
                  <Shield className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-2 relative z-10 group-hover:text-blue-700 transition-colors">Quản trị Hệ thống</h3>
                <p className="text-sm text-slate-500 leading-relaxed mb-6">Phân quyền, bảo mật, và cấu hình các điểm tiêm chủng toàn quốc.</p>
                <div className="mt-auto flex items-center justify-between pt-2 border-t border-slate-50 text-[11px] font-bold uppercase tracking-wider text-blue-600">
                  <span>{users.length} tài khoản thành viên</span>
                  <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all duration-300">
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              </button>

              {/* Card 2: Inventory */}
              <button
                onClick={() => {
                  setActiveRole('Inventory');
                  setViewMode('module');
                  triggerToast('Góc nhìn Thủ Kho: Chuỗi cung ứng lạnh và định lượng vắc-xin');
                }}
                className="bg-white rounded-3xl p-6 border-2 border-white shadow-xl shadow-blue-900/5 hover:border-emerald-200/50 hover:shadow-2xl hover:shadow-emerald-900/10 hover:-translate-y-1 transition-all duration-300 text-left relative overflow-hidden group outline-none cursor-pointer"
              >
                <div className="absolute -right-4 -top-4 w-24 h-24 bg-emerald-50/50 rounded-full transition-transform group-hover:scale-125 duration-300"></div>
                <div className="w-14 h-14 bg-emerald-500 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-emerald-200 text-white relative z-10">
                  <Archive className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-2 relative z-10 group-hover:text-emerald-700 transition-colors">Quản Lý Kho</h3>
                <p className="text-sm text-slate-500 leading-relaxed mb-6">Kiểm kê Vacxin, quản lý chuỗi lạnh (Cold Chain) và hạn sử dụng.</p>
                <div className="mt-auto flex items-center justify-between pt-2 border-t border-slate-50 text-[11px] font-bold uppercase tracking-wider text-emerald-600">
                  <span>{vaccines.length} vắc-xin kê khai</span>
                  <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-emerald-500 group-hover:text-white transition-all duration-300">
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              </button>

              {/* Card 3: Medical */}
              <button
                onClick={() => {
                  setActiveRole('Medical');
                  setViewMode('module');
                  triggerToast('Góc nhìn Y tế: Chỉ định chỉ số lâm sàng và lịch tiêm chủng');
                }}
                className="bg-white rounded-3xl p-6 border-2 border-white shadow-xl shadow-blue-900/5 hover:border-rose-200/50 hover:shadow-2xl hover:shadow-rose-900/10 hover:-translate-y-1 transition-all duration-300 text-left relative overflow-hidden group outline-none cursor-pointer"
              >
                <div className="absolute -right-4 -top-4 w-24 h-24 bg-rose-50/50 rounded-full transition-transform group-hover:scale-125 duration-300"></div>
                <div className="w-14 h-14 bg-rose-500 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-rose-200 text-white relative z-10">
                  <Activity className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-2 relative z-10 group-hover:text-rose-700 transition-colors">Nhân viên Y tế</h3>
                <p className="text-sm text-slate-500 leading-relaxed mb-6">Ghi nhận lịch sử tiêm, khám sàng lọc và phản ứng sau tiêm.</p>
                <div className="mt-auto flex items-center justify-between pt-2 border-t border-slate-50 text-[11px] font-bold uppercase tracking-wider text-rose-600">
                  <span>{appointments.length} lịch hẹn khám</span>
                  <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-rose-500 group-hover:text-white transition-all duration-300">
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              </button>

              {/* Card 4: Customer */}
              <button
                onClick={() => {
                  setActiveRole('Customer');
                  setViewMode('module');
                  triggerToast('Góc nhìn Khách hàng: Hồ sơ tiêm ngừa trẻ em và sổ sức khỏe');
                }}
                className="bg-white rounded-3xl p-6 border-2 border-white shadow-xl shadow-blue-900/5 hover:border-amber-200/50 hover:shadow-2xl hover:shadow-amber-900/10 hover:-translate-y-1 transition-all duration-300 text-left relative overflow-hidden group outline-none cursor-pointer"
              >
                <div className="absolute -right-4 -top-4 w-24 h-24 bg-amber-50/50 rounded-full transition-transform group-hover:scale-125 duration-300"></div>
                <div className="w-14 h-14 bg-amber-500 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-amber-200 text-white relative z-10">
                  <Users className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-2 relative z-10 group-hover:text-amber-700 transition-colors">Khách Hàng</h3>
                <p className="text-sm text-slate-500 leading-relaxed mb-6">Đăng ký tiêm chủng, tra cứu chứng nhận và nhắc lịch tiêm.</p>
                <div className="mt-auto flex items-center justify-between pt-2 border-t border-slate-50 text-[11px] font-bold uppercase tracking-wider text-amber-600">
                  <span>{patients.length} sổ tiêm liên kết</span>
                  <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-amber-500 group-hover:text-white transition-all duration-300">
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              </button>

              {/* Card 5: Support */}
              <button
                onClick={() => {
                  setActiveRole('Support');
                  setViewMode('module');
                  triggerToast('Góc nhìn Hỗ trợ: Hệ thống phản hồi tư vấn viên toàn quốc');
                }}
                className="bg-white rounded-3xl p-6 border-2 border-white shadow-xl shadow-blue-900/5 hover:border-purple-200/50 hover:shadow-2xl hover:shadow-purple-900/10 hover:-translate-y-1 transition-all duration-300 text-left relative overflow-hidden group outline-none cursor-pointer"
              >
                <div className="absolute -right-4 -top-4 w-24 h-24 bg-purple-50/50 rounded-full transition-transform group-hover:scale-125 duration-300"></div>
                <div className="w-14 h-14 bg-purple-500 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-purple-200 text-white relative z-10">
                  <MessageSquare className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-2 relative z-10 group-hover:text-purple-700 transition-colors">Nhân viên Hỗ trợ</h3>
                <p className="text-sm text-slate-500 leading-relaxed mb-6">Tư vấn trực tuyến, giải đáp thắc mắc và hỗ trợ kỹ thuật người dùng.</p>
                <div className="mt-auto flex items-center justify-between pt-2 border-t border-slate-50 text-[11px] font-bold uppercase tracking-wider text-purple-600">
                  <span>{tickets.filter(t => t.status === 'Mới' || t.status === 'Đang xử lý').length} phiếu đang trực</span>
                  <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-purple-500 group-hover:text-white transition-all duration-300">
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              </button>

              {/* Card 6: Finance */}
              <button
                onClick={() => {
                  setActiveRole('Finance');
                  setViewMode('module');
                  triggerToast('Góc nhìn Kế toán: Kết toán bảo hiểm y tế và thanh toán');
                }}
                className="bg-white rounded-3xl p-6 border-2 border-white shadow-xl shadow-blue-900/5 hover:border-cyan-200/50 hover:shadow-2xl hover:shadow-cyan-900/10 hover:-translate-y-1 transition-all duration-300 text-left relative overflow-hidden group outline-none cursor-pointer"
              >
                <div className="absolute -right-4 -top-4 w-24 h-24 bg-cyan-50/50 rounded-full transition-transform group-hover:scale-125 duration-300"></div>
                <div className="w-14 h-14 bg-cyan-500 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-cyan-200 text-white relative z-10">
                  <DollarSign className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-2 relative z-10 group-hover:text-cyan-700 transition-colors">Nhân viên Tài chính</h3>
                <p className="text-sm text-slate-500 leading-relaxed mb-6">Quản lý hóa đơn, thanh toán bảo hiểm và báo cáo doanh thu.</p>
                <div className="mt-auto flex items-center justify-between pt-2 border-t border-slate-50 text-[11px] font-bold uppercase tracking-wider text-cyan-600">
                  <span>Đạt {Math.round((invoices.filter(i => i.status === 'Đã thanh toán').length / (invoices.length || 1)) * 100)}% kế hoạch thu</span>
                  <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-cyan-500 group-hover:text-white transition-all duration-300">
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              </button>
            </div>
            
            {/* Quick Actions Panel */}
            <div className="mt-10 p-5 bg-white rounded-2xl border border-sky-100 flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-3">
                <Sparkles className="w-5 h-5 text-blue-600 animate-pulse" />
                <span className="text-xs font-extrabold text-slate-700 uppercase tracking-wide">Phổ Điểm Tiêm Chủng</span>
                <span className="text-xs text-slate-500 font-medium">Bất kỳ cập nhật dữ liệu nào ở một vai trò sẽ đồng bộ thời gian thực sang các vai trò khác của hệ thống.</span>
              </div>
              <button
                onClick={resetDatabaseToDefault}
                className="text-xs text-slate-600 hover:text-slate-800 font-bold flex items-center gap-1.5 cursor-pointer bg-slate-100/50 hover:bg-slate-100 px-3.5 py-2 rounded-xl transition-all border border-slate-200 shadow-sm"
              >
                🔄 Reset CSDL Mẫu
              </button>
            </div>
          </main>
        </div>
      ) : (
        <div className="flex-1 flex flex-col">
          {/* 1. COMPACT NAVBAR FOR WORKING SPACE */}
          <nav className="h-16 bg-white border-b border-sky-100 flex items-center justify-between px-4 sm:px-8 shrink-0 shadow-sm select-none">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setViewMode('hub')}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-50 text-sky-700 hover:bg-sky-100 transition-all font-bold text-xs rounded-xl border border-sky-200 shadow-sm group cursor-pointer"
              >
                <Home className="w-3.5 h-3.5" />
                <span>Về Trang Chủ</span>
              </button>
              <span className="text-slate-300 font-mono">/</span>
              <span className="text-sm font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-700 to-sky-500">
                {userDetail.badge}
              </span>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="hidden lg:flex items-center gap-2 bg-sky-50 px-3 py-1.5 rounded-full border border-sky-200">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-xs font-semibold text-sky-800 uppercase tracking-wider">Phân hệ đang mở</span>
              </div>
              
              <div className="flex items-center gap-3 border-l pl-4 border-sky-100">
                <div className="text-right hidden sm:block">
                  <p className="text-xs font-black text-slate-800 tracking-tight">{userDetail.name}</p>
                  <p className="text-[9px] text-slate-400 uppercase font-semibold tracking-wider font-mono">{userDetail.mail}</p>
                </div>
                <div className="w-9 h-9 rounded-xl bg-blue-600/10 border border-blue-100 flex items-center justify-center text-blue-700 font-extrabold text-xs uppercase shadow-sm">
                  {userDetail.name.substring(0, 2).toUpperCase()}
                </div>
              </div>
            </div>
          </nav>

          {/* 2. TOP EXPERIENTIAL RIBBON FOR CONVENIENT SHIFTING */}
          <div className="bg-slate-900 border-b border-slate-800 text-white shrink-0 shadow-lg relative z-50">
            <div className="max-w-7xl mx-auto px-4 py-2.5 flex flex-col md:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-[10px] tracking-wider uppercase font-extrabold text-blue-400">PHÂN HỆ TRẢI NGHIỆM</span>
                <span className="text-xs text-slate-300">| Hoán đổi tức thì giữa 6 vai trò:</span>
              </div>

              {/* Role pills */}
              <div className="flex flex-wrap gap-1.5 justify-center items-center">
                {[
                  { id: 'Admin', label: '👑 Admin', color: 'bg-indigo-600' },
                  { id: 'Inventory', label: '📦 Thủ Kho', color: 'bg-amber-600' },
                  { id: 'Medical', label: '🩺 Y Sĩ / BS', color: 'bg-emerald-600' },
                  { id: 'Customer', label: '👤 Khách Hàng', color: 'bg-blue-600' },
                  { id: 'Support', label: '💬 Hỗ Trợ', color: 'bg-purple-600' },
                  { id: 'Finance', label: '💵 Kế Toán', color: 'bg-rose-600' },
                ].map((r) => (
                  <button
                    key={r.id}
                    onClick={() => {
                      setActiveRole(r.id as RoleType);
                      triggerToast(`Đã chuyển đổi sang góc nhìn: ${r.label.substring(3)}`);
                    }}
                    className={`text-xs px-2.5 py-1.5 rounded-lg border font-semibold cursor-pointer transition-all ${
                      activeRole === r.id
                        ? `${r.color} text-white border-transparent scale-105 shadow-md shadow-white/10`
                        : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>

              <button
                onClick={resetDatabaseToDefault}
                className="text-[10px] text-slate-400 hover:text-white font-mono flex items-center gap-1 cursor-pointer bg-slate-800 px-2 py-1 rounded border border-slate-700 hover:border-slate-500"
              >
                🔄 Reset CSDL Mẫu
              </button>
            </div>
          </div>

          {/* 3. DYNAMIC WORKSPACE (Sidebar + Content Canvas) */}
          <div className="flex-1 flex overflow-hidden">
            
            {/* Left Sidebar Layout */}
            {isSidebarOpen && (
              <aside className="w-60 bg-white border-r border-sky-100 shrink-0 hidden md:flex flex-col justify-between p-4">
                <div className="space-y-6">
                  {/* Quick hub shortcut */}
                  <button
                    onClick={() => setViewMode('hub')}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl bg-gradient-to-r from-blue-700 to-sky-600 text-white hover:opacity-95 transition-all font-bold text-sm border border-blue-700 shadow-md cursor-pointer justify-center"
                  >
                    <Home className="w-4 h-4" />
                    <span>Trở về Trang Chủ</span>
                  </button>

                  {/* App Identity */}
                  <div className="flex items-center gap-2.5 px-2 pb-4 border-b border-sky-100">
                    <div className="bg-blue-600 text-white p-2 rounded-xl flex items-center justify-center shadow-md shadow-blue-500/20">
                      <Syringe className="w-5 h-5 animate-pulse" />
                    </div>
                    <div>
                      <h1 className="text-base font-extrabold text-slate-800 tracking-tight leading-none">MediFlow Pro</h1>
                      <span className="text-[10px] text-blue-600 font-extrabold tracking-wider uppercase mt-1 block">Vaccine GSP V.2</span>
                    </div>
                  </div>

                  {/* Navigation Guide Info */}
                  <div className="bg-sky-50/50 p-4 border border-sky-100 rounded-xl space-y-2">
                    <span className="text-[9px] font-extrabold text-sky-600 uppercase tracking-wider block">PHÂN QUYỀN TRUY CẬP</span>
                    <p className="text-xs text-slate-600 leading-relaxed font-medium">
                      Để kiểm thử tính năng liên ngành, bạn có thể thực hiện thao tác ở tab này và chuyển sang tab khác để xem dữ liệu cập nhật tức thời.
                    </p>
                  </div>
                </div>

                {/* Active User Card at bottom */}
                <div className="p-3 bg-sky-50/50 rounded-xl border border-sky-100">
                  <span className="text-[9px] font-extrabold text-sky-400 uppercase tracking-wider block">VĂN PHÒNG KHÁM CHỮA SC</span>
                  <div className="mt-2 flex items-center gap-2.5">
                    <div className="w-9 h-9 bg-blue-100 rounded-full flex items-center justify-center font-bold text-blue-700 text-xs uppercase border border-white">
                      {userDetail.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div className="truncate flex-1">
                      <div className="text-xs font-bold text-slate-800 truncate">{userDetail.name}</div>
                      <div className="text-[9px] text-slate-400 truncate font-mono">{userDetail.mail}</div>
                    </div>
                  </div>
                  <span className="mt-2 block w-full text-center bg-blue-100/50 text-blue-700 text-[9px] font-bold py-1 rounded">
                    {userDetail.badge}
                  </span>
                </div>
              </aside>
            )}

            {/* Core Content Area */}
            <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 relative">
              
              {/* Header Mobile Toolbar */}
              <div className="flex md:hidden items-center justify-between mb-4 bg-white p-3 border border-sky-100 rounded-xl shadow-sm">
                <div className="flex items-center gap-2">
                  <div className="bg-blue-600 text-white p-1 rounded">
                    <Syringe className="w-4 h-4" />
                  </div>
                  <span className="font-extrabold text-xs text-slate-800">MediFlow Pro GSP</span>
                </div>
                <button
                  onClick={() => setViewMode('hub')}
                  className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded border border-blue-200 flex items-center gap-1"
                >
                  <Home className="w-3 h-3" />
                  <span>Trang chủ</span>
                </button>
              </div>

              {/* 3. CORE SUBMODULE SWITCHBOARD */}
              <div className="max-w-7xl mx-auto">
                {activeRole === 'Admin' && (
                  <AdminModule
                    users={users}
                    setUsers={setUsers}
                    systemLogs={systemLogs}
                    setSystemLogs={setSystemLogs}
                    triggerToast={triggerToast}
                  />
                )}

                {activeRole === 'Inventory' && (
                  <InventoryModule
                    vaccines={vaccines}
                    setVaccines={setVaccines}
                    stockLogs={stockLogs}
                    setStockLogs={setStockLogs}
                    systemLogs={systemLogs}
                    setSystemLogs={setSystemLogs}
                    triggerToast={triggerToast}
                  />
                )}

                {activeRole === 'Medical' && (
                  <MedicalModule
                    patients={patients}
                    setPatients={setPatients}
                    vaccines={vaccines}
                    setVaccines={setVaccines}
                    stockLogs={stockLogs}
                    setStockLogs={setStockLogs}
                    systemLogs={systemLogs}
                    setSystemLogs={setSystemLogs}
                    triggerToast={triggerToast}
                  />
                )}

                {activeRole === 'Customer' && (
                  <CustomerModule
                    appointments={appointments}
                    setAppointments={setAppointments}
                    vaccines={vaccines}
                    tickets={tickets}
                    setTickets={setTickets}
                    systemLogs={systemLogs}
                    setSystemLogs={setSystemLogs}
                    triggerToast={triggerToast}
                  />
                )}

                {activeRole === 'Support' && (
                  <SupportModule
                    faqs={faqs}
                    setFaqs={setFaqs}
                    tickets={tickets}
                    setTickets={setTickets}
                    systemLogs={systemLogs}
                    setSystemLogs={setSystemLogs}
                    triggerToast={triggerToast}
                  />
                )}

                {activeRole === 'Finance' && (
                  <FinanceModule
                    invoices={invoices}
                    setInvoices={setInvoices}
                    vaccines={vaccines}
                    systemLogs={systemLogs}
                    setSystemLogs={setSystemLogs}
                    triggerToast={triggerToast}
                  />
                )}
              </div>
            </main>
          </div>
        </div>
      )}

      {/* FOOTER */}
      <footer className="h-12 bg-slate-900 border-t border-slate-800 text-slate-400 flex flex-row items-center justify-between px-6 sm:px-8 text-[10px] sm:text-[11px] uppercase tracking-widest font-semibold shrink-0 select-none">
        <span>Phiên bản 2.4.0 — Hệ thống bảo mật 256-bit</span>
        <div className="flex gap-4 sm:gap-6">
          <span>Hỗ trợ: 1900 8888</span>
          <span className="hidden xs:inline">Chính sách bảo mật</span>
        </div>
      </footer>

      {/* 4. REAL-TIME EVENT POPUP TOAST NOTIFIER */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white rounded-xl shadow-2xl p-4 max-w-sm border border-slate-700/80 animate-slide-in flex items-start gap-3">
          <div className="bg-emerald-500 text-slate-950 p-1.5 rounded-lg shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h4 className="text-xs font-bold text-slate-100 font-sans tracking-wide">THÊM/SỬA THÀNH CÔNG</h4>
            <p className="text-xs text-slate-300 leading-relaxed font-semibold">{toastMessage}</p>
          </div>
        </div>
      )}
    </div>
  );
}
