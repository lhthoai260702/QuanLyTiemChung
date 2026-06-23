import React, { useState, useEffect } from 'react';
import { Users, CalendarDays, Plus, Search, Save, X, Clock, MapPin, Shield, Edit, Trash2 } from 'lucide-react';

// --- ĐỊNH NGHĨA KIỂU DỮ LIỆU ---
export interface TaiKhoan {
  maTaiKhoan: number | string;
  tenDangNhap: string;
  hoTen: string;
  cmnd: string;
  noiO: string;
  moTa: string;
  email?: string;
  phanQuyen?: string;
  maQuyen?: number;
  // Bổ sung các cột tải thêm từ backend
  namSinh?: number;
  sdt?: string;
  ngaySinh?: string;
  diaChi?: string;
  nguoiGiamHo?: string;
  gioiTinh?: string;
  flagDelete?: boolean;
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
  const [accounts, setAccounts] = useState<TaiKhoan[]>([]);

  // HÀM CALL API LẤY DANH SÁCH USER
  const fetchAccounts = async () => {
    try {
      const response = await fetch('http://localhost:8080/api/admin/accounts');
      if (response.ok) {
        const data = await response.json();
        setAccounts(data);
      } else {
        triggerToast('Lỗi khi tải danh sách người dùng từ máy chủ!');
      }
    } catch (error) {
      console.error('Error fetching accounts:', error);
      triggerToast('Không thể kết nối đến Backend Server!');
    }
  };

  useEffect(() => {
    if (activeTab === 'accounts') fetchAccounts();
  }, [activeTab]);

  const [schedules, setSchedules] = useState<LichTiemChungSRS[]>([
    { maLichTiem: 'LTC001', ngay: '25', thang: '06', nam: '2026', thoiGian: '07:30 - 11:30', loaiVacXin: 'Vắc xin 6 trong 1 (Hexaxim)', soLuong: 150, doTuoi: 'Trẻ em từ 2 đến 24 tháng', diaDiem: 'Phòng tiêm số 1', ghiChu: 'Chuẩn bị kỹ dây chuyền lạnh.', danhSachBacSi: ['BS. Nguyễn Văn Ánh', 'ĐD. Huỳnh Ngọc Khánh'], flag_delete: false, danhSachNguoiDangKy: [] }
  ]);

  const [selectedSchedule, setSelectedSchedule] = useState<LichTiemChungSRS | null>(null);

  useEffect(() => {
    if (schedules.length > 0 && !selectedSchedule) setSelectedSchedule(schedules[0]);
  }, [schedules, selectedSchedule]);

  // --- STATE QUẢN LÝ CHẾ ĐỘ EDIT ---
  const [editingAccountId, setEditingAccountId] = useState<number | string | null>(null);
  const [editingScheduleId, setEditingScheduleId] = useState<string | null>(null);

  // --- FORM STATE ---
  const [showAddAccount, setShowAddAccount] = useState(false);
  const [accForm, setAccForm] = useState({
    tenDangNhap: '', matKhau: '', maQuyen: 5, hoTen: '', cmnd: '', noiO: '', moTa: '', email: '',
    namSinh: '', sdt: '', ngaySinh: '', diaChi: '', nguoiGiamHo: '', gioiTinh: 'Nam'
  });

	const [accErrors, setAccErrors] = useState<Record<string, string>>({});
  // Hàm format số điện thoại: 090 123 4567
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, ''); // Xóa chữ, chỉ giữ số
    if (val.length > 10) val = val.substring(0, 10); // Giới hạn 10 số

    // Tự động thêm khoảng trắng
    let formatted = val;
    if (val.length > 3 && val.length <= 6) formatted = `${val.slice(0, 3)} ${val.slice(3)}`;
    else if (val.length > 6) formatted = `${val.slice(0, 3)} ${val.slice(3, 6)} ${val.slice(6)}`;

    setAccForm({ ...accForm, sdt: formatted });
    if (accErrors.sdt) setAccErrors({ ...accErrors, sdt: '' }); // Tắt lỗi khi gõ
  };

  // Hàm chặn nhập chữ (Dành cho CCCD, Năm sinh)
  const handleNumberOnlyChange = (field: keyof typeof accForm, maxLength: number) => (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, '');
    if (val.length > maxLength) val = val.substring(0, maxLength);
    setAccForm({ ...accForm, [field]: val });
    if (accErrors[field]) setAccErrors({ ...accErrors, [field]: '' });
  };

	const formatDisplayPhone = (phone?: string) => {
    if (!phone) return 'Chưa cập nhật';
    const val = phone.replace(/\D/g, ''); // Lọc lấy số
    if (val.length <= 3) return val;
    if (val.length <= 6) return `${val.slice(0, 3)} ${val.slice(3)}`;
    return `${val.slice(0, 3)} ${val.slice(3, 6)} ${val.slice(6)}`; // Output: 090 123 4567
  };

  const getRoleBadgeStyle = (roleName?: string) => {
    if (!roleName) return 'bg-slate-100 text-slate-500 border-slate-200';
    const name = roleName.toLowerCase();

    // Xử lý 6 quyền với 6 màu khác nhau
    if (name.includes('admin')) return 'bg-rose-50 text-rose-700 border-rose-200';       // Đỏ (Rose)
    if (name.includes('kho')) return 'bg-amber-50 text-amber-700 border-amber-200';      // Vàng cam (Amber)
    if (name.includes('tài chính')) return 'bg-emerald-50 text-emerald-700 border-emerald-200'; // Xanh lá (Emerald)
    if (name.includes('hỗ trợ')) return 'bg-violet-50 text-violet-700 border-violet-200';    // Tím (Violet)
    if (name.includes('y tế')) return 'bg-blue-50 text-blue-700 border-blue-200';        // Xanh dương (Blue)
    if (name.includes('khách')) return 'bg-slate-100 text-slate-700 border-slate-300';   // Xám (Slate)

    // Trường hợp user được cấp nhiều quyền cùng lúc (cách nhau dấu phẩy)
    if (name.includes(',')) return 'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200';
    return 'bg-gray-100 text-gray-600 border-gray-200';
  };

  const [showAddSchedule, setShowAddSchedule] = useState(false);
  const [scheduleForm, setScheduleForm] = useState({
    dateInput: '', thoiGian: '', loaiVacXin: '', soLuong: 0, doTuoi: '', diaDiem: '', ghiChu: '', bacSiRaw: ''
  });

  const handleDateChange = (dateStr: string) => setScheduleForm({ ...scheduleForm, dateInput: dateStr });

  // HÀM CALL API XÓA MỀM USER
  const handleDeleteAccount = async (id: number | string) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa tài khoản người dùng này không?')) {
      return;
    }
    try {
      const response = await fetch(`http://localhost:8080/api/admin/accounts/${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        triggerToast('Xóa tài khoản người dùng thành công!');
        fetchAccounts(); // Tải lại danh sách ngay lập tức
      } else {
        triggerToast('Lỗi khi thực hiện xóa tài khoản trên máy chủ!');
      }
    } catch (error) {
      console.error('Error deleting account:', error);
      triggerToast('Không thể kết nối đến máy chủ!');
    }
  };

  // --- HÀM RESET FORMS ---
	const resetAccountForm = () => {
    setAccForm({ tenDangNhap: '', matKhau: '', maQuyen: 5, hoTen: '', cmnd: '', noiO: '', moTa: '', email: '', namSinh: '', sdt: '', ngaySinh: '', diaChi: '', nguoiGiamHo: '', gioiTinh: 'Nam' });
    setAccErrors({}); // Cần reset cả lỗi
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
      maQuyen: acc.maQuyen || 5,
      hoTen: acc.hoTen,
      cmnd: acc.cmnd,
      noiO: acc.noiO,
      moTa: acc.moTa,
      email: acc.email || '',
      namSinh: acc.namSinh?.toString() || '',
      sdt: acc.sdt || '',
      ngaySinh: acc.ngaySinh || '',
      diaChi: acc.diaChi || '',
      nguoiGiamHo: acc.nguoiGiamHo || '',
      gioiTinh: acc.gioiTinh || 'Nam'
    });
    setEditingAccountId(acc.maTaiKhoan);
    setShowAddAccount(true);
  };

  const handleEditSchedule = (sch: LichTiemChungSRS) => {
    setScheduleForm({
      dateInput: `${sch.nam}-${sch.thang}-${sch.ngay}`,
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
  const handleSaveAccount = async (e: React.FormEvent) => {
    e.preventDefault(); // Chặn hành vi submit mặc định

    // 1. CHẠY VALIDATION TỰ TẠO
    const newErrors: Record<string, string> = {};

    // Validate Tài khoản: Check rỗng và check trùng lặp (chỉ check trùng khi thêm mới)
    if (!accForm.tenDangNhap.trim()) {
      newErrors.tenDangNhap = 'Vui lòng nhập tên đăng nhập';
    } else if (!editingAccountId) {
      // Tìm xem Tài khoản đã tồn tại trong danh sách accounts hiện tại chưa (không phân biệt hoa thường)
      const isDuplicate = accounts.some(
        (a) => a.tenDangNhap.toLowerCase() === accForm.tenDangNhap.trim().toLowerCase()
      );
      if (isDuplicate) {
        newErrors.tenDangNhap = 'Tài khoản không được trùng';
      }
    }

    if (!editingAccountId && !accForm.matKhau) newErrors.matKhau = 'Vui lòng nhập mật khẩu';
    if (!accForm.hoTen.trim()) newErrors.hoTen = 'Vui lòng nhập họ và tên';
    if (!accForm.cmnd) newErrors.cmnd = 'Vui lòng nhập CCCD/CMND';

    const phoneNum = accForm.sdt.replace(/\s/g, '');
    if (!phoneNum) newErrors.sdt = 'Vui lòng nhập số điện thoại';
    else if (phoneNum.length < 10) newErrors.sdt = 'Số điện thoại phải đủ 10 số';

    if (accForm.maQuyen === 6) {
      if (!accForm.ngaySinh) newErrors.ngaySinh = 'Vui lòng chọn ngày sinh';
    } else {
      if (!accForm.namSinh) newErrors.namSinh = 'Vui lòng nhập năm sinh';
      else if (accForm.namSinh.length < 4) newErrors.namSinh = 'Năm sinh không hợp lệ';
    }

    if (Object.keys(newErrors).length > 0) {
      setAccErrors(newErrors);
      triggerToast('Vui lòng kiểm tra lại các trường bị lỗi viền đỏ.');
      return;
    }

    // 2. CHUẨN BỊ PAYLOAD VÀ GỌI API
    const payload = {
        ...accForm,
        namSinh: accForm.namSinh ? parseInt(accForm.namSinh) : null,
        sdt: accForm.sdt.replace(/\s/g, '') // Lưu vào DB xóa khoảng trắng, chỉ giữ 10 số
    };

    try {
      const url = editingAccountId
          ? `http://localhost:8080/api/admin/accounts/${editingAccountId}`
          : 'http://localhost:8080/api/admin/accounts';

      const response = await fetch(url, {
        method: editingAccountId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        triggerToast(editingAccountId ? 'Cập nhật tài khoản thành công!' : 'Tạo mới và phân luồng thành công!');
        fetchAccounts();
        resetAccountForm();
      } else {
        triggerToast('Lỗi khi lưu tài khoản trên máy chủ!');
      }
    } catch (error) {
      console.error(error);
      triggerToast('Lỗi kết nối đến máy chủ!');
    }
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
       const updatedSchedules = schedules.map(s => {
         if (s.maLichTiem === editingScheduleId) {
           const updated = { ...s, ngay: d, thang: m, nam: y, ...scheduleForm, soLuong: Number(scheduleForm.soLuong), danhSachBacSi: scheduleForm.bacSiRaw ? scheduleForm.bacSiRaw.split(',').map(b => b.trim()) : [] };
           setSelectedSchedule(updated);
           return updated;
         }
         return s;
       });
       setSchedules(updatedSchedules);
       triggerToast('Cập nhật thông tin Lịch Tiêm Chủng thành công!');
    } else {
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
            <form onSubmit={handleSaveAccount} noValidate className="bg-slate-50 p-6 rounded-xl border border-blue-200 space-y-4 shadow-sm animate-fade-in ring-1 ring-blue-50">
              <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-blue-600" />
                  <h4 className="text-sm font-bold text-slate-800">{editingAccountId ? `Chỉnh sửa User: ${accForm.tenDangNhap}` : 'Tạo Tài khoản & Phân quyền'}</h4>
                </div>
                <button type="button" onClick={resetAccountForm} className="text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Tài khoản <span className="text-red-500">*</span></label>
                    <input type="text" maxLength={50} disabled={!!editingAccountId} value={accForm.tenDangNhap} onChange={(e) => { setAccForm({...accForm, tenDangNhap: e.target.value}); setAccErrors({...accErrors, tenDangNhap: ''}) }} className={`w-full bg-white px-3 py-2 border rounded-lg text-xs outline-none transition-colors ${accErrors.tenDangNhap ? 'border-red-500 focus:border-red-500 bg-red-50' : 'border-slate-200 focus:border-blue-500'} disabled:bg-slate-100 disabled:border-slate-200`} />
                    {accErrors.tenDangNhap && <p className="text-[10px] text-red-500 font-bold mt-1">{accErrors.tenDangNhap}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Mật khẩu {!editingAccountId && <span className="text-red-500">*</span>}</label>
                    <input type="password" maxLength={20} value={accForm.matKhau} onChange={(e) => { setAccForm({...accForm, matKhau: e.target.value}); setAccErrors({...accErrors, matKhau: ''}) }} placeholder={editingAccountId ? "Bỏ trống nếu không đổi mật khẩu" : "Nhập mật khẩu..."} className={`w-full bg-white px-3 py-2 border rounded-lg text-xs outline-none transition-colors ${accErrors.matKhau ? 'border-red-500 focus:border-red-500 bg-red-50' : 'border-slate-200 focus:border-blue-500'}`} />
                    {accErrors.matKhau && <p className="text-[10px] text-red-500 font-bold mt-1">{accErrors.matKhau}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Chức vụ <span className="text-red-500">*</span></label>
                    <select value={accForm.maQuyen} onChange={(e) => setAccForm({...accForm, maQuyen: Number(e.target.value)})} className="w-full bg-white px-3 py-2 border border-slate-200 rounded-lg text-xs outline-none focus:border-blue-500 cursor-pointer">
                      <option value={1}>Administrator</option>
                      <option value={2}>Quản lý kho</option>
                      <option value={3}>Tài chính</option>
                      <option value={4}>Hỗ trợ khách hàng</option>
                      <option value={5}>Nhân viên y tế</option>
                      <option value={6}>Khách hàng</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Email</label>
                    <input type="email" maxLength={255} value={accForm.email} onChange={(e) => setAccForm({...accForm, email: e.target.value})} className="w-full bg-white px-3 py-2 border border-slate-200 rounded-lg text-xs outline-none focus:border-blue-500" />
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Họ và tên <span className="text-red-500">*</span></label>
                    <input type="text" maxLength={255} value={accForm.hoTen} onChange={(e) => { setAccForm({...accForm, hoTen: e.target.value}); setAccErrors({...accErrors, hoTen: ''}) }} className={`w-full bg-white px-3 py-2 border rounded-lg text-xs outline-none transition-colors ${accErrors.hoTen ? 'border-red-500 focus:border-red-500 bg-red-50' : 'border-slate-200 focus:border-blue-500'}`} />
                    {accErrors.hoTen && <p className="text-[10px] text-red-500 font-bold mt-1">{accErrors.hoTen}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">CMND/CCCD <span className="text-red-500">*</span></label>
                    <input type="text" value={accForm.cmnd} onChange={handleNumberOnlyChange('cmnd', 12)} className={`w-full bg-white px-3 py-2 border rounded-lg text-xs outline-none transition-colors ${accErrors.cmnd ? 'border-red-500 focus:border-red-500 bg-red-50' : 'border-slate-200 focus:border-blue-500'}`} placeholder="Chỉ nhập số..." />
                    {accErrors.cmnd && <p className="text-[10px] text-red-500 font-bold mt-1">{accErrors.cmnd}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Hộ khẩu thường trú</label>
                    <input type="text" maxLength={255} value={accForm.noiO} onChange={(e) => setAccForm({...accForm, noiO: e.target.value})} className="w-full bg-white px-3 py-2 border border-slate-200 rounded-lg text-xs outline-none focus:border-blue-500" />
                  </div>
                </div>

                {/* FORM RẼ NHÁNH DỰA VÀO QUYỀN */}
                <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4 mt-2 pt-4 border-t border-slate-200">
                  <div className="md:col-span-2 text-xs font-extrabold text-blue-600 uppercase">Thông tin bổ sung ({accForm.maQuyen === 6 ? 'Khách hàng' : 'Nhân sự'})</div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Số điện thoại liên hệ <span className="text-red-500">*</span></label>
                    <input type="text" value={accForm.sdt} onChange={handlePhoneChange} placeholder="090 123 4567" className={`w-full bg-white px-3 py-2 border rounded-lg text-xs outline-none transition-colors ${accErrors.sdt ? 'border-red-500 focus:border-red-500 bg-red-50' : 'border-slate-200 focus:border-blue-500'}`} />
                    {accErrors.sdt && <p className="text-[10px] text-red-500 font-bold mt-1">{accErrors.sdt}</p>}
                  </div>

                  {accForm.maQuyen === 6 ? (
                    <>
                      <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1">Ngày sinh <span className="text-red-500">*</span></label>
                        <input type="date" value={accForm.ngaySinh} onChange={(e) => { setAccForm({...accForm, ngaySinh: e.target.value}); setAccErrors({...accErrors, ngaySinh: ''}) }} className={`w-full bg-white px-3 py-2 border rounded-lg text-xs outline-none transition-colors ${accErrors.ngaySinh ? 'border-red-500 focus:border-red-500 bg-red-50' : 'border-slate-200 focus:border-blue-500'}`} />
                        {accErrors.ngaySinh && <p className="text-[10px] text-red-500 font-bold mt-1">{accErrors.ngaySinh}</p>}
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1">Giới tính <span className="text-red-500">*</span></label>
                        <select value={accForm.gioiTinh} onChange={(e) => setAccForm({...accForm, gioiTinh: e.target.value})} className="w-full bg-white px-3 py-2 border border-slate-200 rounded-lg text-xs outline-none focus:border-blue-500 cursor-pointer">
                          <option value="Nam">Nam</option><option value="Nữ">Nữ</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1">Người giám hộ (Nếu là trẻ em)</label>
                        <input type="text" maxLength={255} value={accForm.nguoiGiamHo} onChange={(e) => setAccForm({...accForm, nguoiGiamHo: e.target.value})} className="w-full bg-white px-3 py-2 border border-slate-200 rounded-lg text-xs outline-none focus:border-blue-500" />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-xs font-bold text-slate-600 mb-1">Địa chỉ hiện tại</label>
                        <input type="text" maxLength={255} value={accForm.diaChi} onChange={(e) => setAccForm({...accForm, diaChi: e.target.value})} className="w-full bg-white px-3 py-2 border border-slate-200 rounded-lg text-xs outline-none focus:border-blue-500" />
                      </div>
                    </>
                  ) : (
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">Năm sinh <span className="text-red-500">*</span></label>
                      <input type="text" value={accForm.namSinh} onChange={handleNumberOnlyChange('namSinh', 4)} placeholder="YYYY" className={`w-full bg-white px-3 py-2 border rounded-lg text-xs outline-none transition-colors ${accErrors.namSinh ? 'border-red-500 focus:border-red-500 bg-red-50' : 'border-slate-200 focus:border-blue-500'}`} />
                      {accErrors.namSinh && <p className="text-[10px] text-red-500 font-bold mt-1">{accErrors.namSinh}</p>}
                    </div>
                  )}
                </div>

                <div className="md:col-span-2 pt-2">
                  <label className="block text-xs font-bold text-slate-600 mb-1">Mô tả (Notes)</label>
                  <textarea value={accForm.moTa} onChange={(e) => setAccForm({...accForm, moTa: e.target.value})} className="w-full bg-white px-3 py-2 border border-slate-200 rounded-lg text-xs outline-none h-16 text-slate-700 font-sans resize-none focus:border-blue-500"></textarea>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button type="button" onClick={resetAccountForm} className="px-5 py-2 border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 bg-white hover:bg-slate-50 cursor-pointer">Thoát</button>
                <button type="submit" className="px-5 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold shadow-sm hover:bg-blue-700 cursor-pointer flex items-center gap-1"><Save className="w-4 h-4"/> Lưu lại</button>
              </div>
            </form>
          )}

          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs mt-4">
            <table className="w-full text-left text-xs border-collapse table-fixed">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 uppercase tracking-wider">
                  <th className="px-3 py-3 w-[15%]">Tài khoản</th>
                  <th className="px-3 py-3 w-[30%]">Họ và Tên</th>
                  <th className="px-3 py-3 w-[25%]">Phân Quyền</th>
                  <th className="px-3 py-3 w-[15%]">Điện thoại</th>
                  <th className="px-3 py-3 w-[15%] text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
	              {accounts.filter(a => a.hoTen.toLowerCase().includes(searchQuery.toLowerCase()) || a.tenDangNhap.toLowerCase().includes(searchQuery.toLowerCase())).map((a) => (
	                <tr key={a.maTaiKhoan} className="hover:bg-slate-50/50">
	                  <td className="px-3 py-3 font-semibold text-blue-600 truncate" title={a.tenDangNhap}>{a.tenDangNhap}</td>
	                  <td className="px-3 py-3 font-bold text-slate-800 break-words">{a.hoTen}</td>

	                  {/* Ô Phân quyền: Gọi hàm gán màu */}
	                  <td className="px-3 py-3">
	                    <span className={`inline-block px-2 py-1 rounded text-[10px] font-bold border leading-tight ${getRoleBadgeStyle(a.phanQuyen)}`}>
	                      {a.phanQuyen || 'Thành viên'}
	                    </span>
	                  </td>

	                  {/* Ô Điện thoại: Gọi hàm tách khoảng trắng */}
	                  <td className="px-3 py-3 text-slate-500 font-mono truncate">
	                    {formatDisplayPhone(a.sdt)}
	                  </td>

	                  <td className="px-3 py-3 text-right space-x-1 whitespace-nowrap">
	                    <button onClick={() => handleEditAccount(a)} className="text-blue-600 bg-blue-50 hover:bg-blue-100 p-1.5 rounded inline-flex items-center gap-1 font-semibold transition-colors">
	                      <Edit className="w-3.5 h-3.5" />
	                    </button>
	                    <button onClick={() => handleDeleteAccount(a.maTaiKhoan)} className="text-red-600 bg-red-50 hover:bg-red-100 p-1.5 rounded inline-flex items-center gap-1 font-semibold transition-colors">
	                      <Trash2 className="w-3.5 h-3.5" />
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