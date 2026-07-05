import React, { useState, useEffect } from "react";
import { Save, User } from "lucide-react";

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
}

export default function ProfileTab({ triggerToast, onNameChange }: ProfileTabProps) {
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
      const res = await fetchWithAuth("http://localhost:8080/api/profile");
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
    
    // Chuẩn bị payload (Xoá khoảng trắng trong sdt trước khi lưu)
    const payload = {
      ...profile,
      namSinh: profile.namSinh ? parseInt(String(profile.namSinh)) : null,
      sdt: profile.sdt.replace(/\s/g, ""),
    };

    try {
      const res = await fetchWithAuth("http://localhost:8080/api/profile", {
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
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm animate-fade-in">
      <div className="flex items-center gap-3 border-b border-slate-100 pb-4 mb-6">
        <div className="p-3 bg-blue-50 text-blue-600 rounded-full">
          <User className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-800">Thông tin cá nhân</h2>
          <p className="text-xs text-slate-500">Xem và chỉnh sửa thông tin nhân viên của bạn.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">Tên đăng nhập (Username)</label>
            <input
              type="text"
              name="tenDangNhap"
              value={profile.tenDangNhap}
              disabled
              className="w-full bg-slate-100 px-3 py-2 border border-slate-200 rounded-lg text-xs outline-none text-slate-500 cursor-not-allowed font-mono font-semibold"
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
              className={`w-full bg-white px-3 py-2 border rounded-lg text-xs outline-none transition-colors ${profileErrors.hoTen ? "border-red-500 focus:border-red-500 bg-red-50" : "border-slate-200 focus:border-blue-500"}`}
            />
            {profileErrors.hoTen && <p className="text-[10px] text-red-500 font-bold mt-1">{profileErrors.hoTen}</p>}
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
              className={`w-full bg-white px-3 py-2 border rounded-lg text-xs outline-none transition-colors ${profileErrors.cmnd ? "border-red-500 focus:border-red-500 bg-red-50" : "border-slate-200 focus:border-blue-500"}`}
            />
            {profileErrors.cmnd && <p className="text-[10px] text-red-500 font-bold mt-1">{profileErrors.cmnd}</p>}
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">Email</label>
            <input
              type="email"
              name="email"
              maxLength={255}
              value={profile.email}
              onChange={handleChange}
              className="w-full bg-white px-3 py-2 border border-slate-200 rounded-lg text-xs outline-none focus:border-blue-500 transition-colors"
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
              className={`w-full bg-white px-3 py-2 border rounded-lg text-xs outline-none transition-colors ${profileErrors.namSinh ? "border-red-500 focus:border-red-500 bg-red-50" : "border-slate-200 focus:border-blue-500"}`}
            />
            {profileErrors.namSinh && <p className="text-[10px] text-red-500 font-bold mt-1">{profileErrors.namSinh}</p>}
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">
              Số điện thoại <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="sdt"
              placeholder="090 123 4567"
              value={profile.sdt}
              onChange={handlePhoneChange}
              className={`w-full bg-white px-3 py-2 border rounded-lg text-xs outline-none transition-colors font-mono ${profileErrors.sdt ? "border-red-500 focus:border-red-500 bg-red-50" : "border-slate-200 focus:border-blue-500"}`}
            />
            {profileErrors.sdt && <p className="text-[10px] text-red-500 font-bold mt-1">{profileErrors.sdt}</p>}
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-slate-600 mb-1">Nơi ở hiện tại</label>
            <input
              type="text"
              name="noiO"
              maxLength={255}
              value={profile.noiO}
              onChange={handleChange}
              className="w-full bg-white px-3 py-2 border border-slate-200 rounded-lg text-xs outline-none focus:border-blue-500 transition-colors"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-slate-600 mb-1">Mô tả thêm về chức vụ / Kỹ năng (Notes)</label>
            <textarea
              name="moTa"
              maxLength={1000}
              value={profile.moTa}
              onChange={handleChange}
              rows={3}
              className="w-full bg-white px-3 py-2 border border-slate-200 rounded-lg text-xs outline-none resize-none focus:border-blue-500 transition-colors font-sans"
            />
          </div>
        </div>

        <div className="flex justify-end pt-5 border-t border-slate-100">
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2.5 bg-blue-600 text-white rounded-lg text-xs font-semibold shadow-sm hover:bg-blue-700 flex items-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer"
          >
            <Save className="w-4 h-4" /> {loading ? "Đang lưu..." : "Lưu"}
          </button>
        </div>
      </form>
    </div>
  );
}