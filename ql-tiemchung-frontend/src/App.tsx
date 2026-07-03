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
import { useNavigate } from 'react-router-dom';
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
  Shield,
  Activity,
  Archive,
  Users,
  MessageSquare,
  DollarSign,
  CheckCircle2,
  ArrowRight,
  LogOut
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

  const navigate = useNavigate();
  const handleLogout = () => {
    localStorage.removeItem('user'); // Xóa thông tin đã lưu
    localStorage.removeItem('token'); // Xóa token
    navigate('/login'); // Chuyển hướng về trang đăng nhập
  };

  // 2. Navigation Active States
  const [activeRole, setActiveRole] = useState<RoleType>('Admin');
  const [viewMode, setViewMode] = useState<'hub' | 'module'>('hub');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  
  // STATE LƯU THÔNG TIN NGƯỜI DÙNG ĐĂNG NHẬP VÀ PHÂN QUYỀN
  const [loggedInName, setLoggedInName] = useState<string>("Người dùng");
  const [userRole, setUserRole] = useState<number>(1);

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

  // LẤY HỌ TÊN VÀ QUYỀN TỪ LOCAL STORAGE KHI COMPONENT MOUNT
  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const userData = JSON.parse(userStr);
        // Lấy tên
        if (userData && userData.hoTen) {
          setLoggedInName(userData.hoTen);
        } else if (userData && userData.name) {
          setLoggedInName(userData.name);
        }

        // --- LOGIC PHÂN QUYỀN (RBAC) ---
        if (userData && userData.maQuyen) {
          setUserRole(userData.maQuyen);
          
          // NẾU KHÔNG PHẢI ADMIN -> CHUYỂN THẲNG VÀO MODULE VÀ BỎ QUA HUB
          if (userData.maQuyen !== 1) {
            setViewMode('module');
            if (userData.maQuyen === 2) setActiveRole('Inventory');
            else if (userData.maQuyen === 3) setActiveRole('Finance');
            else if (userData.maQuyen === 4) setActiveRole('Support');
            else if (userData.maQuyen === 5) setActiveRole('Medical');
            else if (userData.maQuyen === 6) setActiveRole('Customer');
          }
        }
      } catch (e) {
        // Nếu userStr không phải chuỗi JSON mà là plain text thì lấy trực tiếp
        setLoggedInName(userStr);
      }
    }
  }, []);

  // Toast trigger utility
  const triggerToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  };

  return (
    <div className="min-h-screen bg-sky-50 flex flex-col font-sans select-none antialiased overflow-x-hidden">
      
      {/* ========================================================= */}
      {/* 1. UNIFIED NAVBAR CỐ ĐỊNH CHUNG CHO CẢ 2 TRẠNG THÁI (HUB & MODULE) */}
      {/* ========================================================= */}
      <nav className="h-16 bg-white border-b border-sky-100 flex items-center justify-between px-6 sm:px-8 shrink-0 shadow-sm z-10 relative">
        {/* Nút bấm để quay về trang chủ (Hub) - CHỈ ADMIN ĐƯỢC PHÉP QUAY LẠI HUB */}
        <div 
          onClick={() => { if (userRole === 1) setViewMode('hub') }}
          className={`flex items-center gap-3 transition-opacity ${userRole === 1 ? 'cursor-pointer hover:opacity-80' : 'cursor-default'}`}
          title={userRole === 1 ? "Về Trang chủ" : "VaccineFlow Pro"}
        >
          <div className="w-10 h-10 bg-gradient-to-tr from-blue-600 to-sky-500 rounded-xl flex items-center justify-center text-white font-extrabold text-xl shadow-md shadow-blue-500/20">
            <Syringe className="w-5 h-5" />
          </div>
          <span className="text-xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-blue-700 to-sky-500 tracking-tight">
            VaccineFlow Pro
          </span>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            {/* HIỂN THỊ TÊN NGƯỜI DÙNG Ở ĐÂY */}
            <span className="text-sm font-bold text-slate-800 hidden sm:block">Xin chào, {loggedInName}</span>
            {/* Nút Đăng xuất màu đỏ */}
            <button
              onClick={handleLogout}
              className="p-2 text-red-500 bg-red-50 border border-red-100 hover:text-red-600 hover:bg-red-100 rounded-lg transition-colors cursor-pointer flex items-center justify-center"
              title="Đăng xuất"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </nav>

      {/* ========================================================= */}
      {/* 2. KHU VỰC HIỂN THỊ NỘI DUNG (THAY ĐỔI THEO TRẠNG THÁI) */}
      {/* ========================================================= */}
      {viewMode === 'hub' ? (
        <div className="flex-1 flex flex-col">
          {/* Main Content Hub */}
          <main className="flex-1 max-w-7xl mx-auto w-full p-6 sm:p-10 flex flex-col justify-center my-auto">
            <div className="mb-8">
              <span className="text-xs font-extrabold text-blue-600 tracking-widest uppercase mb-1.5 block">Hệ thống Tiêm chủng VaccineFlow Pro</span>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-950 tracking-tight">Cổng Phân Hệ Công Việc</h1>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {/* Card 1: Admin */}
              {userRole === 1 && (
                <button onClick={() => { setActiveRole('Admin'); setViewMode('module'); }} className="bg-white rounded-3xl p-6 border-2 border-white shadow-xl shadow-blue-900/5 hover:border-blue-200/50 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 text-left relative overflow-hidden group outline-none cursor-pointer flex flex-col h-full">
                  <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-blue-200 text-white relative z-10"><Shield className="w-7 h-7" /></div>
                  <h3 className="text-xl font-bold text-slate-800 mb-2 group-hover:text-blue-700 transition-colors">Administrator</h3>
                  <p className="text-sm text-slate-500 leading-relaxed mb-6 flex-grow">Có toàn quyền đối với hệ thống, như sửa, thêm, xóa dữ liệu, phân quyền cho các user khác.</p>
                  <div className="mt-auto flex items-center justify-between pt-4 border-t border-slate-50 text-[11px] font-bold uppercase tracking-wider text-blue-600">
                    <span>Quản trị toàn quyền hệ thống</span>
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </button>
              )}

              {/* Card 2: Inventory */}
              {(userRole === 1 || userRole === 2) && (
                <button onClick={() => { setActiveRole('Inventory'); setViewMode('module'); }} className="bg-white rounded-3xl p-6 border-2 border-white shadow-xl shadow-blue-900/5 hover:border-emerald-200/50 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 text-left relative overflow-hidden group outline-none cursor-pointer flex flex-col h-full">
                  <div className="w-14 h-14 bg-emerald-500 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-emerald-200 text-white relative z-10"><Archive className="w-7 h-7" /></div>
                  <h3 className="text-xl font-bold text-slate-800 mb-2 group-hover:text-emerald-700 transition-colors">Quản lí kho</h3>
                  <p className="text-sm text-slate-500 leading-relaxed mb-6 flex-grow">Có chức năng quản lí các thông tin về kho thuốc của trung tâm.</p>
                  <div className="mt-auto flex items-center justify-between pt-4 border-t border-slate-50 text-[11px] font-bold uppercase tracking-wider text-emerald-600">
                    <span>Quản lý danh mục vắc-xin</span>
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </button>
              )}

              {/* Card 3: Finance */}
              {(userRole === 1 || userRole === 3) && (
                <button onClick={() => { setActiveRole('Finance'); setViewMode('module'); }} className="bg-white rounded-3xl p-6 border-2 border-white shadow-xl shadow-blue-900/5 hover:border-cyan-200/50 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 text-left relative overflow-hidden group outline-none cursor-pointer flex flex-col h-full">
                  <div className="w-14 h-14 bg-cyan-500 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-cyan-200 text-white relative z-10"><DollarSign className="w-7 h-7" /></div>
                  <h3 className="text-xl font-bold text-slate-800 mb-2 group-hover:text-cyan-700 transition-colors">Tài chính</h3>
                  <p className="text-sm text-slate-500 leading-relaxed mb-6 flex-grow">Có chức năng quản lí các thông tin về tài chính của trung tâm.</p>
                  <div className="mt-auto flex items-center justify-between pt-4 border-t border-slate-50 text-[11px] font-bold uppercase tracking-wider text-cyan-600">
                    <span>Quản lý giao dịch và giá</span>
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </button>
              )}

              {/* Card 4: Support */}
              {(userRole === 1 || userRole === 4) && (
                <button onClick={() => { setActiveRole('Support'); setViewMode('module'); }} className="bg-white rounded-3xl p-6 border-2 border-white shadow-xl shadow-blue-900/5 hover:border-purple-200/50 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 text-left relative overflow-hidden group outline-none cursor-pointer flex flex-col h-full">
                  <div className="w-14 h-14 bg-purple-500 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-purple-200 text-white relative z-10"><MessageSquare className="w-7 h-7" /></div>
                  <h3 className="text-xl font-bold text-slate-800 mb-2 group-hover:text-purple-700 transition-colors">Hỗ trợ khách hàng</h3>
                  <p className="text-sm text-slate-500 leading-relaxed mb-6 flex-grow">Có chức năng nắm bắt thông tin, hỗ trợ và phản hồi các thông tin từ khách hàng.</p>
                  <div className="mt-auto flex items-center justify-between pt-4 border-t border-slate-50 text-[11px] font-bold uppercase tracking-wider text-purple-600">
                    <span>Giải đáp và Nhắc nhở tiêm</span>
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </button>
              )}

              {/* Card 5: Medical */}
              {(userRole === 1 || userRole === 5) && (
                <button onClick={() => { setActiveRole('Medical'); setViewMode('module'); }} className="bg-white rounded-3xl p-6 border-2 border-white shadow-xl shadow-blue-900/5 hover:border-rose-200/50 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 text-left relative overflow-hidden group outline-none cursor-pointer flex flex-col h-full">
                  <div className="w-14 h-14 bg-rose-500 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-rose-200 text-white relative z-10"><Activity className="w-7 h-7" /></div>
                  <h3 className="text-xl font-bold text-slate-800 mb-2 group-hover:text-rose-700 transition-colors">Nhân viên y tế</h3>
                  <p className="text-sm text-slate-500 leading-relaxed mb-6 flex-grow">Là người trực tiếp khám chữa bệnh cho bệnh nhân, có chức năng cập nhật thông tình trạng của bệnh nhân, kê đơn thuốc.</p>
                  <div className="mt-auto flex items-center justify-between pt-4 border-t border-slate-50 text-[11px] font-bold uppercase tracking-wider text-rose-600">
                    <span>Quản lý hồ sơ bệnh án</span>
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </button>
              )}

              {/* Card 6: Customer */}
              {(userRole === 1 || userRole === 6) && (
                <button onClick={() => { setActiveRole('Customer'); setViewMode('module'); }} className="bg-white rounded-3xl p-6 border-2 border-white shadow-xl shadow-blue-900/5 hover:border-amber-200/50 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 text-left relative overflow-hidden group outline-none cursor-pointer flex flex-col h-full">
                  <div className="w-14 h-14 bg-amber-500 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-amber-200 text-white relative z-10"><Users className="w-7 h-7" /></div>
                  <h3 className="text-xl font-bold text-slate-800 mb-2 group-hover:text-amber-700 transition-colors">Khách hàng</h3>
                  <p className="text-sm text-slate-500 leading-relaxed mb-6 flex-grow">Có quyền xem thông tin từng loại vắc xin, đăng kí tiêm phòng; xem lịch tiêm phòng; xem hồ sơ tiêm phòng cá nhân; yêu cầu hỗ trợ từ trung tâm; xem tình hình dịch bệnh; feedback cho quản lý.</p>
                  <div className="mt-auto flex items-center justify-between pt-4 border-t border-slate-50 text-[11px] font-bold uppercase tracking-wider text-amber-600">
                    <span>Tra cứu và Đăng ký lịch</span>
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </button>
              )}
            </div>
          </main>
        </div>
      ) : (
        <div className="flex-1 flex overflow-hidden">
          <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 relative">
            {/* 3. CORE SUBMODULE SWITCHBOARD */}
            <div className="max-w-7xl mx-auto">
              {activeRole === 'Admin' && (
                <AdminModule
                  triggerToast={triggerToast}
                />
              )}

              {activeRole === 'Inventory' && (
                <InventoryModule
                  triggerToast={triggerToast}
                />
              )}

              {activeRole === 'Medical' && (
                <MedicalModule
                  patients={patients}
                  setPatients={setPatients}
                  vaccines={vaccines}
                  triggerToast={triggerToast}
                />
              )}

              {activeRole === 'Customer' && (
                <CustomerModule
                  triggerToast={triggerToast}
                />
              )}

              {activeRole === 'Support' && (
                <SupportModule
                  faqs={faqs}
                  setFaqs={setFaqs}
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
      )}

      {/* FOOTER */}
      <footer className="h-10 bg-slate-900 border-t border-slate-800 shrink-0">
      </footer>

      {/* 4. REAL-TIME EVENT POPUP TOAST NOTIFIER */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white rounded-xl shadow-2xl p-4 max-w-sm border border-slate-700/80 animate-slide-in flex items-start gap-3">
          <div className="bg-emerald-500 text-slate-950 p-1.5 rounded-lg shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h4 className="text-xs font-bold text-slate-100 font-sans tracking-wide">THÔNG BÁO HỆ THỐNG</h4>
            <p className="text-xs text-slate-300 leading-relaxed font-semibold">{toastMessage}</p>
          </div>
        </div>
      )}
    </div>
  );
}