import React, { useState, useEffect } from "react";
import { Save, User, Shield, ArrowLeft } from "lucide-react";

interface ProfileForm {
  tenDangNhap: string;
  hoTen: string;
  cmnd: string;
  noiO: string;
  moTa: string;
  email: string;
  namSinh: number | string;
  sdt: string;
}

interface ProfileTabProps {
  triggerToast: (msg: string) => void;
  onNameChange?: (name: string) => void;
  onBack?: () => void;
}

export default function ProfileTab({ triggerToast, onNameChange, onBack }: ProfileTabProps) {
  const [profile, setProfile] = useState<ProfileForm>({
    tenDangNhap: "",
    hoTen: "",
    cmnd: "",
    noiO: "",
    moTa: "",
    email: "",
    namSinh: "",
    sdt: "",
  });
  
  const [profileErrors, setProfileErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [userRoleBadge, setUserRoleBadge] = useState<string>("Tài khoản Hệ thống");

  const fetchWithAuth = async (url: string, options: RequestInit = {}) => {
    const token = localStorage.getItem("token");
    const headers = {
      ...options.headers,
      Authorization: `Bearer ${token}`,
    };
    return fetch(url, { ...options, headers });
  };

  const loadProfile = async () => {
    try {
      const res = await fetchWithAuth(`${import.meta.env.VITE_API_BASE_URL}/api/profile`);
      if (res.ok) {
        const data = await res.json();

        // Format số điện thoại khi load lên
        let formattedPhone = data.sdt ? data.sdt.replace(/\D/g, "") : "";
        if (formattedPhone.length > 3 && formattedPhone.length <= 6) {
          formattedPhone = `${formattedPhone.slice(0, 3)} ${formattedPhone.slice(3)}`;
        } else if (formattedPhone.length > 6) {
          formattedPhone = `${formattedPhone.slice(0, 3)} ${formattedPhone.slice(3, 6)} ${formattedPhone.slice(6)}`;
        }

        setProfile({
          tenDangNhap: data.tenDangNhap || "",
          hoTen: data.hoTen || "",
          cmnd: data.cmnd || "",
          noiO: data.noiO || "",
          moTa: data.moTa || "",
          email: data.email || "",
          namSinh: data.namSinh || "",
          sdt: formattedPhone,
        });

        // Đọc maQuyen từ LocalStorage hiển thị chức vụ
        const userStr = localStorage.getItem("user");
        if (userStr) {
          const u = JSON.parse(userStr);
          if (u.maQuyen === 1) setUserRoleBadge("Administrator");
          else if (u.maQuyen === 2) setUserRoleBadge("Nhân viên Kho");
          else if (u.maQuyen === 3) setUserRoleBadge("Nhân sự Tài chính");
          else if (u.maQuyen === 4) setUserRoleBadge("CSKH & Hỗ trợ");
          else if (u.maQuyen === 5) setUserRoleBadge("Nhân viên Y tế");
          else if (u.maQuyen === 6) setUserRoleBadge("Khách hàng");
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
    if (profileErrors[e.target.name]) setProfileErrors({ ...profileErrors, [e.target.name]: "" });
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, "");
    if (val.length > 10) val = val.substring(0, 10);
    let formatted = val;
    if (val.length > 3 && val.length <= 6) formatted = `${val.slice(0, 3)} ${val.slice(3)}`;
    else if (val.length > 6) formatted = `${val.slice(0, 3)} ${val.slice(3, 6)} ${val.slice(6)}`;
    setProfile({ ...profile, sdt: formatted });
    if (profileErrors.sdt) setProfileErrors({ ...profileErrors, sdt: "" });
  };

  const handleNumberOnlyChange = (field: keyof ProfileForm, maxLength: number) => (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, "");
    if (val.length > maxLength) val = val.substring(0, maxLength);
    setProfile({ ...profile, [field]: val });
    if (profileErrors[field]) setProfileErrors({ ...profileErrors, [field]: "" });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // --- VALIDATION ---
    const newErrors: Record<string, string> = {};

    if (!profile.hoTen.trim()) newErrors.hoTen = "Vui lòng nhập họ và tên";
    if (!profile.cmnd) newErrors.cmnd = "Vui lòng nhập CCCD/CMND";

    const phoneNum = profile.sdt.replace(/\s/g, "");
    if (!phoneNum) newErrors.sdt = "Vui lòng nhập số điện thoại";
    else if (phoneNum.length < 10) newErrors.sdt = "Số điện thoại phải đủ 10 số";

    if (!profile.namSinh) newErrors.namSinh = "Vui lòng nhập năm sinh";
    else if (String(profile.namSinh).length < 4) newErrors.namSinh = "Năm sinh không hợp lệ";

    if (Object.keys(newErrors).length > 0) {
      setProfileErrors(newErrors);
      triggerToast("Vui lòng kiểm tra lại các trường bị lỗi viền đỏ.");
      return;
    }

    setLoading(true);
    
    const payload = {
      ...profile,
      namSinh: profile.namSinh ? parseInt(String(profile.namSinh)) : null,
      sdt: profile.sdt.replace(/\s/g, ""),
    };

    try {
      const res = await fetchWithAuth(`${import.meta.env.VITE_API_BASE_URL}/api/profile`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        triggerToast("Cập nhật thông tin thành công!");
        if (onNameChange) {
          onNameChange(profile.hoTen);
        }
      } else {
        triggerToast("Lỗi: Cập nhật thông tin thất bại!");
      }
    } catch (e) {
      triggerToast("Lỗi kết nối máy chủ");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in relative h-full flex flex-col">
      {/* Header Module */}
      <div className="shrink-0 flex items-center justify-between">
        <div className="flex items-center gap-4">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="p-2 border border-slate-200 bg-white rounded-lg text-slate-500 hover:bg-slate-50 hover:text-slate-800 transition-colors shadow-sm cursor-pointer"
              title="Trở về trang trước"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
              <User className="w-6 h-6 text-blue-600" />
              Hồ Sơ Của Tôi
            </h2>
            <p className="text-sm text-slate-500 mt-1">Quản lý tài khoản, thông tin bảo mật và liên hệ cá nhân.</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-8 shadow-sm">
        <div className="flex items-center gap-4 border-b border-slate-100 pb-6 mb-8">
          <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-full flex flex-col items-center justify-center border-4 border-white shadow-md">
            <User className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800">{profile.hoTen || "Đang tải dữ liệu..."}</h2>
            <div className="flex items-center gap-2 mt-1">
              <Shield className="w-3.5 h-3.5 text-emerald-500" />
              <p className="text-xs font-bold text-emerald-600 tracking-wide uppercase">{userRoleBadge}</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} noValidate className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Tên đăng nhập (Username)</label>
              <input
                type="text"
                name="tenDangNhap"
                value={profile.tenDangNhap}
                disabled
                className="w-full bg-slate-50 px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none text-slate-500 cursor-not-allowed font-mono font-semibold"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">
                Họ và tên <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="hoTen"
                maxLength={50}
                value={profile.hoTen}
                onChange={handleChange}
                className={`w-full bg-white px-3 py-2 border rounded-lg text-sm outline-none transition-colors ${profileErrors.hoTen ? "border-red-500 focus:border-red-500 bg-red-50" : "border-slate-200 focus:border-blue-500"}`}
              />
              {profileErrors.hoTen && <p className="text-xs text-red-500 font-bold mt-1">{profileErrors.hoTen}</p>}
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">
                CMND / CCCD <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="cmnd"
                value={profile.cmnd}
                onChange={handleNumberOnlyChange("cmnd", 12)}
                placeholder="Chỉ nhập số..."
                className={`w-full bg-white px-3 py-2 border rounded-lg text-sm outline-none transition-colors ${profileErrors.cmnd ? "border-red-500 focus:border-red-500 bg-red-50" : "border-slate-200 focus:border-blue-500"}`}
              />
              {profileErrors.cmnd && <p className="text-xs text-red-500 font-bold mt-1">{profileErrors.cmnd}</p>}
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Email</label>
              <input
                type="email"
                name="email"
                maxLength={255}
                value={profile.email}
                onChange={handleChange}
                className="w-full bg-white px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">
                Năm sinh <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="namSinh"
                placeholder="YYYY"
                value={profile.namSinh}
                onChange={handleNumberOnlyChange("namSinh", 4)}
                className={`w-full bg-white px-3 py-2 border rounded-lg text-sm outline-none transition-colors ${profileErrors.namSinh ? "border-red-500 focus:border-red-500 bg-red-50" : "border-slate-200 focus:border-blue-500"}`}
              />
              {profileErrors.namSinh && <p className="text-xs text-red-500 font-bold mt-1">{profileErrors.namSinh}</p>}
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">
                Số điện thoại liên hệ <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="sdt"
                placeholder="090 123 4567"
                value={profile.sdt}
                onChange={handlePhoneChange}
                className={`w-full bg-white px-3 py-2 border rounded-lg text-sm outline-none transition-colors font-mono ${profileErrors.sdt ? "border-red-500 focus:border-red-500 bg-red-50" : "border-slate-200 focus:border-blue-500"}`}
              />
              {profileErrors.sdt && <p className="text-xs text-red-500 font-bold mt-1">{profileErrors.sdt}</p>}
            </div>
            <div className="md:col-span-2 pt-2 border-t border-slate-100">
              <label className="block text-xs font-bold text-slate-600 mb-1">Địa chỉ / Nơi cư trú hiện tại</label>
              <input
                type="text"
                name="noiO"
                maxLength={255}
                value={profile.noiO}
                onChange={handleChange}
                className="w-full bg-white px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-500 transition-colors"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-600 mb-1">Mô tả thêm (Kỹ năng, Ghi chú y tế...)</label>
              <textarea
                name="moTa"
                maxLength={1000}
                value={profile.moTa}
                onChange={handleChange}
                rows={3}
                className="w-full bg-white px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none resize-none focus:border-blue-500 transition-colors font-sans"
              />
            </div>
          </div>

          <div className="flex justify-end pt-5 border-t border-slate-100">
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-bold shadow-sm hover:bg-blue-700 flex items-center gap-2 transition-colors disabled:opacity-50 cursor-pointer"
            >
              <Save className="w-4 h-4" /> {loading ? "Đang xử lý..." : "Lưu thay đổi"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}