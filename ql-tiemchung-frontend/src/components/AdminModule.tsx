import React, { useState } from 'react';
import { UserAccount, SystemLog } from '../types';
import { Users, Shield, Clock, Sliders, Plus, Search, Trash2, ShieldAlert, CheckCircle2, Save } from 'lucide-react';

interface AdminModuleProps {
  users: UserAccount[];
  setUsers: React.Dispatch<React.SetStateAction<UserAccount[]>>;
  systemLogs: SystemLog[];
  setSystemLogs: React.Dispatch<React.SetStateAction<SystemLog[]>>;
  triggerToast: (msg: string) => void;
}

export default function AdminModule({ users, setUsers, systemLogs, setSystemLogs, triggerToast }: AdminModuleProps) {
  const [activeTab, setActiveTab] = useState<'users' | 'logs' | 'config'>('users');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Form state for new user
  const [newFullName, setNewFullName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newRole, setNewRole] = useState<'Admin' | 'Inventory' | 'Medical' | 'Customer' | 'Support' | 'Finance'>('Medical');
  const [showAddForm, setShowAddForm] = useState(false);

  // General configuration state
  const [clinicName, setClinicName] = useState('Bệnh viện Đa khoa MediFlow Pro');
  const [clinicPhone, setClinicPhone] = useState('1900 6868');
  const [clinicAddress, setClinicAddress] = useState('Số 120 Hải Châu, Quận Hải Châu, Đà Nẵng');
  const [alertThreshold, setAlertThreshold] = useState(10);

  const filteredUsers = users.filter((u) =>
    u.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.phone.includes(searchQuery)
  );

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFullName || !newEmail || !newPhone) {
      triggerToast('Vui lòng điền đầy đủ các thông tin bắt buộc.');
      return;
    }

    const newUser: UserAccount = {
      id: `US-${String(users.length + 1).padStart(3, '0')}`,
      fullName: newFullName,
      email: newEmail,
      phone: newPhone,
      role: newRole,
      status: 'Hoạt động',
      createdAt: new Date().toISOString().split('T')[0],
    };

    setUsers([newUser, ...users]);
    
    // Add to system log
    const log: SystemLog = {
      id: `LOG-${Date.now()}`,
      time: new Date().toISOString().replace('T', ' ').substring(0, 19),
      handler: 'Phạm Hải Đăng (Admin)',
      action: 'Thêm người dùng mới',
      details: `Đã cấp tài khoản phân hệ ${newRole} cho ${newFullName} (${newEmail})`,
    };
    setSystemLogs([log, ...systemLogs]);

    // Reset
    setNewFullName('');
    setNewEmail('');
    setNewPhone('');
    setShowAddForm(false);
    triggerToast(`Đã thêm thành viên và kích hoạt tài khoản ${newFullName}!`);
  };

  const toggleUserStatus = (userId: string) => {
    let affectedName = '';
    let currStatus = '';
    const updated = users.map((u) => {
      if (u.id === userId) {
        affectedName = u.fullName;
        currStatus = u.status === 'Hoạt động' ? 'Bị khóa' : 'Hoạt động';
        return { ...u, status: currStatus as any };
      }
      return u;
    });

    setUsers(updated);
    triggerToast(`Đã ${currStatus === 'Bị khóa' ? 'khóa' : 'mở khóa'} thành công tài khoản ${affectedName}!`);

    const log: SystemLog = {
      id: `LOG-${Date.now()}`,
      time: new Date().toISOString().replace('T', ' ').substring(0, 19),
      handler: 'Phạm Hải Đăng (Admin)',
      action: 'Cập nhật trạng thái người dùng',
      details: `Thay đổi trạng thái tài khoản ${affectedName} thành ${currStatus}`,
    };
    setSystemLogs([log, ...systemLogs]);
  };

  const handleSaveConfig = () => {
    triggerToast('Đã lưu cấu hình phân hệ hệ thống và đồng bộ hoàn tất!');
    const log: SystemLog = {
      id: `LOG-${Date.now()}`,
      time: new Date().toISOString().replace('T', ' ').substring(0, 19),
      handler: 'Phạm Hải Đăng (Admin)',
      action: 'Sửa cấu hình hệ thống',
      details: `Cập nhật cấu hình: ${clinicName}, sđt: ${clinicPhone}, nồng độ cảnh báo kho: ${alertThreshold} véc-xin`,
    };
    setSystemLogs([log, ...systemLogs]);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Module Title */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">👑 Phân hệ Ban Quản Trị (Admin)</h2>
        <p className="text-sm text-slate-500 mt-1">Quản lý định chế người dùng toàn trung tâm, giám sát audit traces bảo mật và cài đặt hệ thống.</p>
      </div>

      {/* Metrics Banner */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 flex items-center justify-between shadow-sm">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Tổng Nhân sự</p>
            <h3 className="text-2xl font-extrabold text-slate-800 mt-1">{users.length}</h3>
          </div>
          <Users className="w-10 h-10 text-blue-500 bg-blue-50 p-2 rounded-lg" />
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 flex items-center justify-between shadow-sm">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Mức bảo mật</p>
            <h3 className="text-2xl font-extrabold text-emerald-600 mt-1">SHA-256</h3>
          </div>
          <Shield className="w-10 h-10 text-emerald-500 bg-emerald-50 p-2 rounded-lg" />
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 flex items-center justify-between shadow-sm">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Trạng thái máy chủ</p>
            <h3 className="text-2xl font-extrabold text-emerald-600 mt-1">Ổn định</h3>
          </div>
          <CheckCircle2 className="w-10 h-10 text-emerald-500 bg-emerald-50 p-2 rounded-lg" />
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 flex items-center justify-between shadow-sm">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Sổ nhật ký audit</p>
            <h3 className="text-2xl font-extrabold text-slate-800 mt-1">{systemLogs.length}</h3>
          </div>
          <Clock className="w-10 h-10 text-slate-500 bg-slate-50 p-2 rounded-lg" />
        </div>
      </div>

      {/* Navigation tabs inside module */}
      <div className="border-b border-slate-200 flex space-x-2">
        <button
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2.5 font-medium text-sm border-b-2 transition-colors ${
            activeTab === 'users' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          👤 Quản lý người dùng ({users.length})
        </button>
        <button
          onClick={() => setActiveTab('logs')}
          className={`px-4 py-2.5 font-medium text-sm border-b-2 transition-colors ${
            activeTab === 'logs' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          📜 Nhật ký Audit Traces
        </button>
        <button
          onClick={() => setActiveTab('config')}
          className={`px-4 py-2.5 font-medium text-sm border-b-2 transition-colors ${
            activeTab === 'config' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          ⚙️ Cấu hình hệ thống chung
        </button>
      </div>

      {/* Tab Area */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm nhân sự theo tên, sđt hoặc email..."
                className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-blue-100 placeholder:text-slate-400 outline-none"
              />
            </div>
            {/* Toggle Add form */}
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="bg-blue-600 text-white text-xs font-semibold px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Thêm thành viên cấp cao
            </button>
          </div>

          {/* New User Form */}
          {showAddForm && (
            <form onSubmit={handleAddUser} className="bg-slate-50 p-5 rounded-xl border border-slate-200 space-y-4 animate-fade-in">
              <div className="flex justify-between items-center border-b border-slate-200 pb-2 mb-2">
                <h4 className="text-sm font-bold text-slate-800">Cấp thẻ tài khoản nhân viên mới</h4>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="text-xs text-slate-400 hover:text-slate-600"
                >
                  Đóng
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Họ tên đầy đủ *</label>
                  <input
                    type="text"
                    required
                    value={newFullName}
                    onChange={(e) => setNewFullName(e.target.value)}
                    placeholder="VD: Nguyễn Văn Nam"
                    className="w-full bg-white px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Địa chỉ Email *</label>
                  <input
                    type="email"
                    required
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="VD: nam.nv@mediflow.com"
                    className="w-full bg-white px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Số điện thoại *</label>
                  <input
                    type="text"
                    required
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    placeholder="VD: 0905111222"
                    className="w-full bg-white px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Cấp quyền Phân hệ (Role Module)</label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value as any)}
                    className="w-full bg-white px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-500"
                  >
                    <option value="Admin">Admin (Bảo mật & Cấu hình)</option>
                    <option value="Inventory">Quản Lý Kho (Nhà Thuốc & Vận chuyển)</option>
                    <option value="Medical">Nhân viên Y tế (Bác sĩ, Y tá và Khám sàng lọc)</option>
                    <option value="Customer">Khách Hàng (Bệnh nhân & Người bảo hộ)</option>
                    <option value="Support">Nhân viên tư vấn (Chăm sóc khánh hàng)</option>
                    <option value="Finance">Nhân viên Tài chính (Công nợ & Thu hóa đơn)</option>
                  </select>
                </div>
                <div className="flex items-end justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="px-4 py-2 border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 bg-white hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors cursor-pointer"
                  >
                    Kích hoạt ngay
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* Listing Table of Users */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 text-xs uppercase tracking-wider">
                    <th className="px-5 py-3">Mã NV / Cấp bậc</th>
                    <th className="px-5 py-3">Họ và Tên</th>
                    <th className="px-5 py-3">Email & SĐT</th>
                    <th className="px-5 py-3">Cấp quyền Phân hệ</th>
                    <th className="px-5 py-3">Ngày gia nhập</th>
                    <th className="px-5 py-3 text-center">Trạng thái</th>
                    <th className="px-5 py-3 text-right">Khóa hành vi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredUsers.length > 0 ? (
                    filteredUsers.map((u) => (
                      <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-5 py-3.5 font-mono text-xs font-bold text-slate-400">{u.id}</td>
                        <td className="px-5 py-3.5 font-semibold text-slate-800">{u.fullName}</td>
                        <td className="px-5 py-3.5 text-xs text-slate-500">
                          <div>{u.email}</div>
                          <div className="mt-0.5">{u.phone}</div>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full bg-blue-50 text-blue-700">
                            {u.role}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-xs text-slate-400">{u.createdAt}</td>
                        <td className="px-5 py-3.5 text-center">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                              u.status === 'Hoạt động' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                            }`}
                          >
                            ● {u.status}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <button
                            onClick={() => toggleUserStatus(u.id)}
                            className={`text-xs px-2.5 py-1 rounded border font-medium cursor-pointer transition-colors ${
                              u.status === 'Hoạt động'
                                ? 'border-slate-200 text-slate-600 hover:bg-red-50 hover:text-red-600 hover:border-red-200'
                                : 'border-emerald-200 text-emerald-600 hover:bg-emerald-50 hover:border-emerald-300'
                            }`}
                          >
                            {u.status === 'Hoạt động' ? 'Khóa Thẻ' : 'Bỏ Khóa'}
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="px-5 py-10 text-center text-slate-400">
                        Không tìm thấy người dùng nào khớp với truy vấn tìm kiếm.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'logs' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div>
              <h4 className="text-sm font-bold text-slate-800">Cam kết an toàn thông tin & Nhật ký hành trình</h4>
              <p className="text-xs text-slate-500">Trace log lưu trữ 100% thay đổi của Trung Tâm Phân Hệ Tiêm Chủng, không thể bị sữa đổi bất ngờ.</p>
            </div>
            <button
              onClick={() => {
                triggerToast('Đang biên dịch tệp PDF trace logs... Tải xuống thành công!');
              }}
              className="px-3 py-1.5 bg-white border border-slate-200 text-xs font-semibold rounded-lg hover:bg-slate-50 transition-colors cursor-pointer text-slate-700 shadow-sm"
            >
              Tải Audit logs (PDF)
            </button>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 text-xs uppercase tracking-wider">
                    <th className="px-5 py-3 w-40">Mốc thời gian</th>
                    <th className="px-5 py-3 w-48">Nhân viên thao tác</th>
                    <th className="px-5 py-3 w-48">Hành vi</th>
                    <th className="px-5 py-3">Chi tiết kỹ thuật</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-600 text-xs font-mono">
                  {systemLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-5 py-3 text-slate-400 font-sans">{log.time}</td>
                      <td className="px-5 py-3 font-semibold text-slate-800 font-sans">{log.handler}</td>
                      <td className="px-5 py-3">
                        <span className="text-blue-600 font-semibold text-xs font-sans">{log.action}</span>
                      </td>
                      <td className="px-5 py-3 text-slate-600 font-sans">{log.details}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'config' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-6">
          <div className="border-b border-slate-200 pb-4">
            <h3 className="text-base font-bold text-slate-800">Tham số trung tâm và Cấu hình ngắt cảnh báo</h3>
            <p className="text-xs text-slate-500 mt-1">Các giá trị này sẽ thay đổi giao diện Khách Hàng, Y Tế và hệ thống Cảnh báo tự động.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5">Tên cơ sở y khoa chính</label>
              <input
                type="text"
                value={clinicName}
                onChange={(e) => setClinicName(e.target.value)}
                className="w-full px-3, py-2 border border-slate-200 text-sm rounded-lg outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5">Hotline trợ giúp tư vấn khẩn cấp</label>
              <input
                type="text"
                value={clinicPhone}
                onChange={(e) => setClinicPhone(e.target.value)}
                className="w-full px-3, py-2 border border-slate-200 text-sm rounded-lg outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5">Địa chỉ trụ sở chính</label>
              <input
                type="text"
                value={clinicAddress}
                onChange={(e) => setClinicAddress(e.target.value)}
                className="w-full px-3, py-2 border border-slate-200 text-sm rounded-lg outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5">Ngưỡng báo động tồn kho (vaccine ít hơn mức này sẽ là 'Sắp hết' hoặc 'Đã hết')</label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  value={alertThreshold}
                  onChange={(e) => setAlertThreshold(Number(e.target.value))}
                  className="w-24 px-3, py-2 border border-slate-200 text-sm rounded-lg outline-none focus:ring-1 focus:ring-blue-500"
                />
                <span className="text-xs text-slate-400">Liều thuốc dự trữ</span>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-200 pt-5 flex justify-end">
            <button
              onClick={handleSaveConfig}
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2 rounded-lg flex items-center gap-1 cursor-pointer transition-colors shadow-sm"
            >
              <Save className="w-4 h-4" /> Lưu cấu hình đồng bộ
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
