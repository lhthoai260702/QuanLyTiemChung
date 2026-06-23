import React, { useState, useEffect } from 'react';
import { Users, CalendarDays, Plus, Search, Save, X, Clock, MapPin, Shield, Edit } from 'lucide-react';

// --- ĐỊNH NGHĨA KIỂU DỮ LIỆU ---
export interface TaiKhoan {
  maTaiKhoan: string;
  tenDangNhap: string;
  hoTen: string;
  cmnd: string;
  noiO: string;
  moTa: string;
  phanQuyen: string;
  flag_delete: boolean;
}

export interface NguoiDangKy {
  stt: number;
  maBenhNhan: string;
  tenBenhNhan: string;
  ngaySinh: string;
  gioiTinh: string;
  sdt: string;
  trangThaiTiem: 'Chờ khám sàng lọc' | 'Đủ điều kiện tiêm' | 'Đã tiêm' | 'Đã hủy';
}

export interface LichTiemChungSRS {
  maLichTiem: string;
  ngay: string;
  thang: string;
  nam: string;
  thoiGian: string;
  loaiVacXin: string;
  soLuong: number;
  doTuoi: string;
  diaDiem: string;
  ghiChu: string;
  danhSachBacSi: string[];
  danhSachNguoiDangKy: NguoiDangKy[];
  flag_delete: boolean;
}

interface AdminModuleProps {
  triggerToast?: (msg: string) => void;
}

export default function AdminModule({ triggerToast = alert }: AdminModuleProps) {
  const [activeTab, setActiveTab] = useState<'schedules' | 'accounts'>('accounts');
  const [searchQuery, setSearchQuery] = useState('');

  const [accounts, setAccounts] = useState<TaiKhoan[]>([
    { maTaiKhoan: 'TK001', tenDangNhap: 'haidang.admin', hoTen: 'Phạm Hải Đăng', cmnd: '044095001234', noiO: 'Hải Châu, Đà Nẵng', moTa: 'Trưởng ban quản trị hệ thống', phanQuyen: 'Ban Quản Trị (Admin)', flag_delete: false },
    { maTaiKhoan: 'TK002', tenDangNhap: 'ngoc.khanh', hoTen: 'Huỳnh Ngọc Khánh', cmnd: '048098009988', noiO: 'Sơn Trà, Đà Nẵng', moTa: 'Điều dưỡng trưởng khối Nhi', phanQuyen: 'Nhân viên Y tế', flag_delete: false }
  ]);

  const [schedules, setSchedules] = useState<LichTiemChungSRS[]>([
    { maLichTiem: 'LTC001', ngay: '25', thang: '06', nam: '2026', thoiGian: '07:30 - 11:30', loaiVacXin: 'Vắc xin 6 trong 1 (Hexaxim)', soLuong: 150, doTuoi: 'Trẻ em từ 2 đến 24 tháng', diaDiem: 'Phòng tiêm số 1', ghiChu: 'Chuẩn bị kỹ dây chuyền lạnh.', danhSachBacSi: ['BS. Nguyễn Văn Ánh', 'ĐD. Huỳnh Ngọc Khánh'], flag_delete: false, danhSachNguoiDangKy: [] }
  ]);

  const [selectedSchedule, setSelectedSchedule] = useState<LichTiemChungSRS | null>(null);

  useEffect(() => {
    if (schedules.length > 0 && !selectedSchedule) setSelectedSchedule(schedules[0]);
  }, [schedules, selectedSchedule]);

  // --- STATE QUẢN LÝ CHẾ ĐỘ EDIT ---
  const [editingAccountId, setEditingAccountId] = useState<string | null>(null);
  const [editingScheduleId, setEditingScheduleId] = useState<string | null>(null);

  // --- FORM STATE ---
  const [showAddAccount, setShowAddAccount] = useState(false);
  const [accForm, setAccForm] = useState({
    tenDangNhap: '', matKhau: '', phanQuyen: 'Nhân viên Y tế', hoTen: '', cmnd: '', noiO: '', moTa: ''
  });

  const [showAddSchedule, setShowAddSchedule] = useState(false);
  const [scheduleForm, setScheduleForm] = useState({
    dateInput: '', thoiGian: '', loaiVacXin: '', soLuong: 0, doTuoi: '', diaDiem: '', ghiChu: '', bacSiRaw: ''
  });

  const handleDateChange = (dateStr: string) => setScheduleForm({ ...scheduleForm, dateInput: dateStr });

  // --- HÀM RESET FORMS ---
  const resetAccountForm = () => {
    setAccForm({ tenDangNhap: '', matKhau: '', phanQuyen: 'Nhân viên Y tế', hoTen: '', cmnd: '', noiO: '', moTa: '' });
    setEditingAccountId(null);
    setShowAddAccount(false);
  };

  const resetScheduleForm = () => {
    setScheduleForm({ dateInput: '', thoiGian: '', loaiVacXin: '', soLuong: 0, doTuoi: '', diaDiem: '', ghiChu: '', bacSiRaw: '' });
    setEditingScheduleId(null);
    setShowAddSchedule(false);
  };

  // --- XỬ LÝ NÚT CHỈNH SỬA (EDIT CLICKS) ---
  const handleEditAccount = (acc: TaiKhoan) => {
    setAccForm({
      tenDangNhap: acc.tenDangNhap,
      matKhau: '', // Không hiển thị mật khẩu cũ vì lý do bảo mật
      phanQuyen: acc.phanQuyen,
      hoTen: acc.hoTen,
      cmnd: acc.cmnd,
      noiO: acc.noiO,
      moTa: acc.moTa
    });
    setEditingAccountId(acc.maTaiKhoan);
    setShowAddAccount(true);
  };

  const handleEditSchedule = (sch: LichTiemChungSRS) => {
    setScheduleForm({
      dateInput: `${sch.nam}-${sch.thang}-${sch.ngay}`, // Đồng bộ hóa ngược lại format YYYY-MM-DD cho input
      thoiGian: sch.thoiGian,
      loaiVacXin: sch.loaiVacXin,
      soLuong: sch.soLuong,
      doTuoi: sch.doTuoi,
      diaDiem: sch.diaDiem,
      ghiChu: sch.ghiChu,
      bacSiRaw: sch.danhSachBacSi.join(', ')
    });
    setEditingScheduleId(sch.maLichTiem);
    setShowAddSchedule(true);
  };

  // --- HÀM LƯU DỮ LIỆU (ADD / UPDATE) ---
  const handleSaveAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!accForm.tenDangNhap || (!editingAccountId && !accForm.matKhau) || !accForm.hoTen) {
      triggerToast('Vui lòng điền các thông tin bắt buộc.');
      return;
    }

    if (editingAccountId) {
      // Cập nhật User
      setAccounts(accounts.map(a => a.maTaiKhoan === editingAccountId ? { ...a, ...accForm } : a));
      triggerToast('Cập nhật tài khoản nhân viên thành công!');
    } else {
      // Thêm mới User
      const newAccount: TaiKhoan = {
        maTaiKhoan: `TK${String(accounts.length + 1).padStart(3, '0')}`,
        ...accForm,
        flag_delete: false
      };
      setAccounts([newAccount, ...accounts]);
      triggerToast('Tạo tài khoản thành viên hoàn tất.');
    }
    resetAccountForm();
  };

  const handleSaveSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!scheduleForm.dateInput || !scheduleForm.loaiVacXin || !scheduleForm.diaDiem) {
      triggerToast('Vui lòng điền các thông tin bắt buộc theo quy định SRS.');
      return;
    }

    const parseDate = new Date(scheduleForm.dateInput);
    const d = String(parseDate.getDate()).padStart(2, '0');
    const m = String(parseDate.getMonth() + 1).padStart(2, '0');
    const y = String(parseDate.getFullYear());

    if (editingScheduleId) {
       // Cập nhật Lịch
       const updatedSchedules = schedules.map(s => {
         if (s.maLichTiem === editingScheduleId) {
           const updated = { ...s, ngay: d, thang: m, nam: y, ...scheduleForm, soLuong: Number(scheduleForm.soLuong), danhSachBacSi: scheduleForm.bacSiRaw ? scheduleForm.bacSiRaw.split(',').map(b => b.trim()) : [] };
           setSelectedSchedule(updated); // Cập nhật luôn màn hình detail
           return updated;
         }
         return s;
       });
       setSchedules(updatedSchedules);
       triggerToast('Cập nhật thông tin Lịch Tiêm Chủng thành công!');
    } else {
       // Thêm mới Lịch
       const newSchedule: LichTiemChungSRS = {
        maLichTiem: `LTC${String(schedules.length + 1).padStart(3, '0')}`,
        ngay: d, thang: m, nam: y, thoiGian: scheduleForm.thoiGian, loaiVacXin: scheduleForm.loaiVacXin, soLuong: Number(scheduleForm.soLuong), doTuoi: scheduleForm.doTuoi, diaDiem: scheduleForm.diaDiem, ghiChu: scheduleForm.ghiChu,
        danhSachBacSi: scheduleForm.bacSiRaw ? scheduleForm.bacSiRaw.split(',').map(b => b.trim()) : [],
        danhSachNguoiDangKy: [], flag_delete: false
      };
      setSchedules([newSchedule, ...schedules]);
      setSelectedSchedule(newSchedule);
      triggerToast('Lưu thông tin lịch tiêm chủng đợt mới thành công!');
    }
    resetScheduleForm();
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Module */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">👑 Phân hệ Ban Quản Trị Hệ Thống (Admin)</h2>
        <p className="text-sm text-slate-500 mt-1">Quản lý và điều chỉnh định mức danh mục hệ thống theo SRS V3.0.</p>
      </div>

      {/* Tabs Menu */}
      <div className="border-b border-slate-200 flex space-x-2">
        <button onClick={() => setActiveTab('accounts')} className={`px-4 py-2.5 font-medium text-sm border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'accounts' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>
          <Users className="w-4 h-4" /> 👤 Quản lý User
        </button>
        <button onClick={() => setActiveTab('schedules')} className={`px-4 py-2.5 font-medium text-sm border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'schedules' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>
          <CalendarDays className="w-4 h-4" /> 📅 Quản lý Lịch tiêm chủng
        </button>
      </div>

      {/* ========================================= TAB: USER ACCOUNT ========================================= */}
      {activeTab === 'accounts' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
              <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Tìm kiếm tài khoản..." className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-blue-100 outline-none" />
            </div>
            <button onClick={() => { resetAccountForm(); setShowAddAccount(true); }} className="bg-blue-600 text-white text-xs font-semibold px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-1 cursor-pointer">
              <Plus className="w-4 h-4" /> Tạo User
            </button>
          </div>

          {/* Dùng 1 Form chung cho cả Add & Edit */}
          {showAddAccount && (
            <form onSubmit={handleSaveAccount} className="bg-slate-50 p-6 rounded-xl border border-blue-200 space-y-4 shadow-sm animate-fade-in ring-1 ring-blue-50">
              <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-blue-600" />
                  <h4 className="text-sm font-bold text-slate-800">{editingAccountId ? `Chỉnh sửa User: ${editingAccountId}` : 'Tạo User Account & Phân quyền'}</h4>
                </div>
                <button type="button" onClick={resetAccountForm} className="text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Username (Tên đăng nhập) *</label>
                    <input type="text" required disabled={!!editingAccountId} value={accForm.tenDangNhap} onChange={(e) => setAccForm({...accForm, tenDangNhap: e.target.value})} className="w-full bg-white px-3 py-2 border border-slate-200 rounded-lg text-xs outline-none focus:border-blue-500 disabled:bg-slate-100" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Password (Mật khẩu) {editingAccountId ? '' : '*'}</label>
                    <input type="password" required={!editingAccountId} value={accForm.matKhau} onChange={(e) => setAccForm({...accForm, matKhau: e.target.value})} placeholder={editingAccountId ? "Bỏ trống nếu không muốn đổi mật khẩu" : "Nhập mật khẩu..."} className="w-full bg-white px-3 py-2 border border-slate-200 rounded-lg text-xs outline-none focus:border-blue-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Phân Quyền (ComboBox) *</label>
                    <select required value={accForm.phanQuyen} onChange={(e) => setAccForm({...accForm, phanQuyen: e.target.value})} className="w-full bg-white px-3 py-2 border border-slate-200 rounded-lg text-xs outline-none focus:border-blue-500 cursor-pointer">
                      <option value="Ban Quản Trị (Admin)">Ban Quản Trị (Admin)</option>
                      <option value="Nhân viên Y tế">Nhân viên Y tế</option>
                      <option value="Nhân viên Kho">Nhân viên Kho</option>
                      <option value="Nhân viên Tài chính">Nhân viên Tài chính</option>
                      <option value="Nhân viên CSKH">Nhân viên CSKH</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Họ tên (Họ tên nhân viên) *</label>
                    <input type="text" required value={accForm.hoTen} onChange={(e) => setAccForm({...accForm, hoTen: e.target.value})} className="w-full bg-white px-3 py-2 border border-slate-200 rounded-lg text-xs outline-none focus:border-blue-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">CMND (Số CMND/CCCD) *</label>
                    <input type="text" required value={accForm.cmnd} onChange={(e) => setAccForm({...accForm, cmnd: e.target.value})} className="w-full bg-white px-3 py-2 border border-slate-200 rounded-lg text-xs outline-none focus:border-blue-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Nơi ở (Địa chỉ)</label>
                    <input type="text" value={accForm.noiO} onChange={(e) => setAccForm({...accForm, noiO: e.target.value})} className="w-full bg-white px-3 py-2 border border-slate-200 rounded-lg text-xs outline-none focus:border-blue-500" />
                  </div>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-600 mb-1">Description (Thông tin nhân viên)</label>
                  <textarea value={accForm.moTa} onChange={(e) => setAccForm({...accForm, moTa: e.target.value})} className="w-full bg-white px-3 py-2 border border-slate-200 rounded-lg text-xs outline-none h-20 text-slate-700 font-sans resize-none focus:border-blue-500"></textarea>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button type="button" onClick={resetAccountForm} className="px-5 py-2 border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 bg-white hover:bg-slate-50 cursor-pointer">Thoát</button>
                <button type="submit" className="px-5 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold shadow-sm hover:bg-blue-700 cursor-pointer flex items-center gap-1"><Save className="w-4 h-4"/> Lưu</button>
              </div>
            </form>
          )}

          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs mt-4">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 uppercase tracking-wider">
                  <th className="px-4 py-3">Username</th>
                  <th className="px-4 py-3">Họ và Tên</th>
                  <th className="px-4 py-3">Phân Quyền</th>
                  <th className="px-4 py-3">CMND</th>
                  <th className="px-4 py-3 text-center">Trạng thái</th>
                  <th className="px-4 py-3 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {accounts.filter(a => a.hoTen.toLowerCase().includes(searchQuery.toLowerCase()) || a.tenDangNhap.toLowerCase().includes(searchQuery.toLowerCase())).map((a) => (
                  <tr key={a.maTaiKhoan} className="hover:bg-slate-50/50">
                    <td className="px-4 py-3 font-semibold text-blue-600">{a.tenDangNhap}</td>
                    <td className="px-4 py-3 font-bold text-slate-800">{a.hoTen}</td>
                    <td className="px-4 py-3"><span className="inline-flex px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">{a.phanQuyen}</span></td>
                    <td className="px-4 py-3 text-slate-500">{a.cmnd}</td>
                    <td className="px-4 py-3 text-center"><span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700">● Kích hoạt</span></td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => handleEditAccount(a)} className="text-blue-600 bg-blue-50 hover:bg-blue-100 p-1.5 rounded inline-flex items-center gap-1 font-semibold transition-colors">
                        <Edit className="w-3.5 h-3.5" /> Sửa
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================= TAB: LỊCH TIÊM CHỦNG ========================================= */}
      {activeTab === 'schedules' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-600" /> Điều chỉnh thiết lập lịch tiêm trung tâm
            </h3>
            <button onClick={() => { resetScheduleForm(); setShowAddSchedule(true); }} className="bg-blue-600 text-white text-xs font-semibold px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-1 cursor-pointer">
              <Plus className="w-4 h-4" /> Thêm mới lịch tiêm chủng đợt mới
            </button>
          </div>

          {/* Dùng 1 Form chung cho cả Add & Edit Lịch */}
          {showAddSchedule && (
            <form onSubmit={handleSaveSchedule} className="bg-slate-50 p-6 rounded-xl border border-blue-200 space-y-4 animate-fade-in shadow-sm ring-1 ring-blue-50">
              <div className="flex justify-between items-center border-b border-slate-200 pb-2.5">
                <div className="flex items-center gap-2">
                  <span className={`p-1.5 rounded-md text-xs font-bold ${editingScheduleId ? 'bg-amber-100 text-amber-700' : 'bg-blue-50 text-blue-600'}`}>{editingScheduleId ? 'Edit Action' : 'New Action'}</span>
                  <h4 className="text-sm font-bold text-slate-800">{editingScheduleId ? `Chỉnh sửa thông tin Lịch Tiêm: ${editingScheduleId}` : 'Thêm mới thông tin lịch tiêm'}</h4>
                </div>
                <button type="button" onClick={resetScheduleForm} className="text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="md:col-span-1 bg-white p-3 rounded-lg border border-slate-200 flex flex-col justify-between shadow-xs">
                  <label className="block text-xs font-bold text-slate-700 mb-2">📅 Lịch (MonthCalendar)</label>
                  <input type="date" required value={scheduleForm.dateInput} onChange={(e) => handleDateChange(e.target.value)} className="w-full px-2.5 py-1.5 border border-slate-200 rounded-md text-xs outline-none focus:border-blue-500" />
                  <div className="mt-3 pt-3 border-t border-slate-100 grid grid-cols-3 gap-1.5 text-center">
                    <div><span className="block text-[10px] text-slate-400 font-semibold">Ngày</span><input type="text" readOnly value={scheduleForm.dateInput ? String(new Date(scheduleForm.dateInput).getDate()).padStart(2, '0') : ''} className="w-full text-center bg-slate-50 border-0 text-xs font-bold py-1 rounded" /></div>
                    <div><span className="block text-[10px] text-slate-400 font-semibold">Tháng</span><input type="text" readOnly value={scheduleForm.dateInput ? String(new Date(scheduleForm.dateInput).getMonth() + 1).padStart(2, '0') : ''} className="w-full text-center bg-slate-50 border-0 text-xs font-bold py-1 rounded" /></div>
                    <div><span className="block text-[10px] text-slate-400 font-semibold">Năm</span><input type="text" readOnly value={scheduleForm.dateInput ? String(new Date(scheduleForm.dateInput).getFullYear()) : ''} className="w-full text-center bg-slate-50 border-0 text-xs font-bold py-1 rounded" /></div>
                  </div>
                </div>

                <div className="md:col-span-3 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div><label className="block text-xs font-semibold text-slate-600 mb-1">Thời gian tiêm chủng *</label><input type="text" required value={scheduleForm.thoiGian} onChange={(e) => setScheduleForm({...scheduleForm, thoiGian: e.target.value})} className="w-full bg-white px-3 py-2 border border-slate-200 rounded-lg text-xs" /></div>
                  <div><label className="block text-xs font-semibold text-slate-600 mb-1">Loại vắc xin đợt này *</label><input type="text" required value={scheduleForm.loaiVacXin} onChange={(e) => setScheduleForm({...scheduleForm, loaiVacXin: e.target.value})} className="w-full bg-white px-3 py-2 border border-slate-200 rounded-lg text-xs" /></div>
                  <div><label className="block text-xs font-semibold text-slate-600 mb-1">Số lượng vắc xin (liều) *</label><input type="number" required value={scheduleForm.soLuong || ''} onChange={(e) => setScheduleForm({...scheduleForm, soLuong: Number(e.target.value)})} className="w-full bg-white px-3 py-2 border border-slate-200 rounded-lg text-xs" /></div>
                  <div><label className="block text-xs font-semibold text-slate-600 mb-1">Độ tuổi khuyên dùng *</label><input type="text" required value={scheduleForm.doTuoi} onChange={(e) => setScheduleForm({...scheduleForm, doTuoi: e.target.value})} className="w-full bg-white px-3 py-2 border border-slate-200 rounded-lg text-xs" /></div>
                  <div className="sm:col-span-2"><label className="block text-xs font-semibold text-slate-600 mb-1">Địa điểm tổ chức *</label><input type="text" required value={scheduleForm.diaDiem} onChange={(e) => setScheduleForm({...scheduleForm, diaDiem: e.target.value})} className="w-full bg-white px-3 py-2 border border-slate-200 rounded-lg text-xs" /></div>
                </div>

                <div className="md:col-span-2"><label className="block text-xs font-semibold text-slate-600 mb-1">Bác sĩ phụ trách</label><textarea value={scheduleForm.bacSiRaw} onChange={(e) => setScheduleForm({...scheduleForm, bacSiRaw: e.target.value})} className="w-full bg-white px-3 py-2 border border-slate-200 rounded-lg text-xs h-16 resize-none"></textarea></div>
                <div className="md:col-span-2"><label className="block text-xs font-semibold text-slate-600 mb-1">Ghi chú (RichTextBox)</label><textarea value={scheduleForm.ghiChu} onChange={(e) => setScheduleForm({...scheduleForm, ghiChu: e.target.value})} className="w-full bg-white px-3 py-2 border border-slate-200 rounded-lg text-xs h-16 resize-none"></textarea></div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                <button type="button" onClick={resetScheduleForm} className="px-4 py-2 border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 bg-white hover:bg-slate-50">Cancel Thao tác</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold shadow-sm hover:bg-blue-700 flex items-center gap-1.5"><Save className="w-4 h-4" /> Save Lưu thông tin</button>
              </div>
            </form>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Lịch Tiêm - List Maste */}
            <div className="lg:col-span-1 bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="p-4 bg-slate-50 border-b border-slate-200 font-bold text-xs text-slate-500 uppercase tracking-wider">Danh sách lịch tiêm chủng định kỳ</div>
              <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto">
                {schedules.map((s) => (
                  <div key={s.maLichTiem} onClick={() => setSelectedSchedule(s)} className={`p-4 cursor-pointer transition-colors ${selectedSchedule?.maLichTiem === s.maLichTiem ? 'bg-blue-50/70 border-l-4 border-blue-600' : 'hover:bg-slate-50/50'}`}>
                    <div className="flex justify-between text-xs font-mono font-bold text-slate-400 mb-1"><span>{s.maLichTiem}</span><span className="text-slate-500 font-sans">{s.ngay}/{s.thang}/{s.nam}</span></div>
                    <div className="font-semibold text-slate-800 text-sm mb-1">{s.loaiVacXin}</div>
                    <div className="flex items-center text-slate-500 text-xs gap-1"><MapPin className="w-3.5 h-3.5 flex-shrink-0" /><span className="truncate">{s.diaDiem}</span></div>
                  </div>
                ))}
              </div>
            </div>

            {/* Lịch Tiêm - Details View */}
            <div className="lg:col-span-2 space-y-6">
              {selectedSchedule ? (
                <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-5 relative">
                  {/* Nút Edit Ngay trên Header của chi tiết */}
                  <button onClick={() => handleEditSchedule(selectedSchedule)} className="absolute top-6 right-6 text-blue-600 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg inline-flex items-center gap-1.5 text-xs font-bold transition-colors">
                    <Edit className="w-4 h-4" /> Edit Lịch
                  </button>

                  <div className="border-b border-slate-100 pb-4 pr-24">
                    <span className="text-xs font-mono font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded">MÃ ĐỢT: {selectedSchedule.maLichTiem}</span>
                    <h3 className="text-lg font-bold text-slate-800 mt-1">{selectedSchedule.loaiVacXin}</h3>
                    <p className="text-sm font-bold text-blue-600 mt-1">{selectedSchedule.thoiGian} ({selectedSchedule.ngay}/{selectedSchedule.thang}/{selectedSchedule.nam})</p>
                  </div>

                  {/* Chi tiết nội dung (đã thu gọn code hiển thị như cũ) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div className="bg-slate-50/60 p-3 rounded-lg border border-slate-100"><span className="block font-semibold text-slate-400 mb-1">🎯 Độ tuổi khuyên dùng</span><span className="font-medium text-slate-800 text-sm">{selectedSchedule.doTuoi}</span></div>
                    <div className="bg-slate-50/60 p-3 rounded-lg border border-slate-100"><span className="block font-semibold text-slate-400 mb-1">📦 Tổng cơ số vắc-xin</span><span className="font-bold text-slate-800 text-sm">{selectedSchedule.soLuong} liều thuốc</span></div>
                    <div className="sm:col-span-2 bg-slate-50/60 p-3 rounded-lg border border-slate-100 flex items-start gap-2"><MapPin className="w-4 h-4 text-slate-400 mt-0.5" /><div><span className="block font-semibold text-slate-400">📍 Địa điểm tổ chức</span><span className="font-medium text-slate-800">{selectedSchedule.diaDiem}</span></div></div>
                  </div>

                  {/* Bác sĩ & Ghi Chú ... */}
                  <div className="space-y-1.5"><label className="block text-xs font-bold text-slate-500 uppercase">👨‍⚕️ Hội đồng Y tế tham gia</label><div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 flex flex-wrap gap-2">{selectedSchedule.danhSachBacSi.length > 0 ? selectedSchedule.danhSachBacSi.map((doc, idx) => <span key={idx} className="bg-white border px-2.5 py-1 rounded-md flex items-center gap-1.5"><span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span> {doc}</span>) : <span className="text-slate-400 italic">Chưa chỉ định.</span>}</div></div>
                  <div className="space-y-1.5"><label className="block text-xs font-bold text-slate-500 uppercase">📝 Nhật ký (Ghi chú)</label><div className="bg-amber-50/50 border border-amber-200/60 p-3 rounded-lg text-xs text-slate-700 leading-relaxed whitespace-pre-line">{selectedSchedule.ghiChu || "Không có ghi chú."}</div></div>
                </div>
              ) : (
                <div className="text-center p-12 border border-dashed border-slate-200 rounded-xl text-slate-400 text-sm">Chọn một lịch tiêm để hiển thị chi tiết.</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}