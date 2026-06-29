import React, { useState, useEffect } from "react";
import {
  User,
  Syringe,
  CalendarDays,
  Bug,
  MessageSquare,
  Search,
  Edit,
  Save,
  X,
  PlusCircle,
  Send,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

interface CustomerModuleProps {
  triggerToast: (msg: string) => void;
}

// --- ĐỊNH NGHĨA KIỂU DỮ LIỆU VẮC XIN THEO BACKEND ---
export interface VaccineCatalog {
  maVacXin: number;
  tenVacXin: string;
  loaiVacXin: string;
  phongNguaBenh: string;
  doTuoiTiemChung: string;
  donGia: number;
  tonKho: number;
}

export default function CustomerModule({ triggerToast }: CustomerModuleProps) {
  // --- STATES: ĐIỀU HƯỚNG TABS ---
  const [activeTab, setActiveTab] = useState<"profile" | "vaccines" | "schedules" | "diseases" | "feedback">("profile");

  // --- DỮ LIỆU THẬT LẤY TỪ DATABASE ---
  const [profile, setProfile] = useState({
    id: "1", // Tạm thời hardcode người dùng đang đăng nhập có id = 1
    name: "",
    dob: "",
    gender: "Nam",
    phone: "",
    address: "",
  });
  const [history, setHistory] = useState<any[]>([]);
  const [schedules, setSchedules] = useState<any[]>([]);

  // Dữ liệu mock tĩnh cho tab Dịch Bệnh (chưa có API)
  const [diseases, setDiseases] = useState<any[]>([]);

  const fetchDiseases = async () => {
    try {
      const response = await fetch("http://localhost:8080/api/customer/diseases");
      if (response.ok) {
        const data = await response.json();
        setDiseases(data);
      }
    } catch (error) {
      console.error("Lỗi lấy thông tin dịch bệnh:", error);
      triggerToast("Không thể kết nối tải thông tin dịch bệnh!");
    }
  };

  // Form states cho Profile (Đã loại bỏ khai báo trùng lặp ở phía dưới)
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({ ...profile });
  const [profileErrors, setProfileErrors] = useState<Record<string, string>>({});

  // --- STATES: QUẢN LÝ DỮ LIỆU TỪ BACKEND ---
  const [vaccines, setVaccines] = useState<VaccineCatalog[]>([]);

  // --- HÀM TẢI DỮ LIỆU CÁ NHÂN TỪ API ---
  const fetchProfile = async () => {
    try {
      const response = await fetch("http://localhost:8080/api/customer/profile/1");
      if (response.ok) {
        const data = await response.json();
        const profileData = {
          id: data.id,
          name: data.fullName || "",
          dob: data.dob || "",
          gender: data.gender || "Nam",
          phone: data.phone || "",
          address: data.address || "",
        };
        setProfile(profileData);
        setProfileForm(profileData); // Cập nhật form form default khi load xong dữ liệu

        // Map đầy đủ lịch sử tiêm theo các trường mở rộng
        const formattedHistory = data.history.map((h: any, i: number) => ({
          id: h.recordId || i,
          date: h.date || "---",
          place: h.place || "Chưa xác định", // Database chưa lưu địa điểm tiêm, dùng giá trị mặc định trực quan
          vacName: h.vaccineName || "---",
          vacType: h.vaccineType || "Chưa xác định", // Dự phòng mô tả loại vắc xin
          dosage: h.dosage || "Chưa xác định", // Dự phòng hàm lượng tiêu chuẩn
          status: h.nextDose || "Chưa xác định", // Kết quả/Trạng thái
        }));
        setHistory(formattedHistory);
      }
    } catch (error) {
      console.error("Lỗi lấy thông tin:", error);
      triggerToast("Không thể tải thông tin hồ sơ từ máy chủ!");
    }
  };

  const fetchVaccines = async () => {
    try {
      const response = await fetch("http://localhost:8080/api/customer/vaccines");
      if (response.ok) {
        const data = await response.json();
        setVaccines(data);
      } else {
        triggerToast("Lỗi tải danh mục vắc-xin từ máy chủ!");
      }
    } catch (error) {
      console.error(error);
      triggerToast("Không thể kết nối đến Backend Server!");
    }
  };

  const fetchSchedules = async () => {
    try {
      const response = await fetch("http://localhost:8080/api/admin/schedules");
      if (response.ok) {
        const data = await response.json();
        setSchedules(data);
      } else {
        triggerToast("Lỗi: Không thể lấy dữ liệu lịch tiêm chủng!");
      }
    } catch (error) {
      console.error("Lỗi kết nối Backend:", error);
      triggerToast("Không thể kết nối đến Máy chủ Backend!");
    }
  };

  // Gọi API mỗi khi người dùng truy cập các tab tương ứng
  useEffect(() => {
    if (activeTab === "profile") {
      fetchProfile();
    }
    if (activeTab === "vaccines") {
      fetchVaccines();
    }
    if (activeTab === "schedules") {
      fetchSchedules();
    }
    if (activeTab === "diseases") {
      fetchDiseases();
    }
  }, [activeTab]);

  // --- STATES: FORMS & VALIDATION ---
  // 2. Phản hồi
  const [feedbackType, setFeedbackType] = useState<"after_vaccine" | "high_level">("after_vaccine");
  const [feedbackForm, setFeedbackForm] = useState({
    vacName: "",
    time: "",
    place: "",
    doctor: "",
    normalContent: "",
    highLevelType: "Phàn nàn",
    highLevelContent: "",
  });
  const [feedbackErrors, setFeedbackErrors] = useState<Record<string, string>>({});

  // 3. Đăng ký Tiêm (Modal)
  const [bookModal, setBookModal] = useState<{ isOpen: boolean; type: "vaccine" | "schedule"; data: any }>({
    isOpen: false,
    type: "vaccine",
    data: null,
  });

  // --- HÀM TIỆN ÍCH CHO FORMS ---
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>, setter: Function, formState: any, errorState: any, setErrorState: Function) => {
    let val = e.target.value.replace(/\D/g, ""); // Chỉ lấy số
    if (val.length > 10) val = val.substring(0, 10); // Giới hạn 10 số
    let formatted = val;
    if (val.length > 3 && val.length <= 6) formatted = `${val.slice(0, 3)} ${val.slice(3)}`;
    else if (val.length > 6) formatted = `${val.slice(0, 3)} ${val.slice(3, 6)} ${val.slice(6)}`;

    setter({ ...formState, phone: formatted });
    if (errorState.phone) setErrorState({ ...errorState, phone: "" });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN").format(amount) + " ₫";
  };

  // --- XỬ LÝ SUBMIT HỒ SƠ QUA API ---
  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};

    if (!profileForm.name.trim()) errors.name = "Vui lòng nhập họ và tên";
    if (!profileForm.dob) errors.dob = "Vui lòng chọn ngày sinh";

    const phoneNum = profileForm.phone.replace(/\s/g, "");
    if (!phoneNum) errors.phone = "Vui lòng nhập số điện thoại";
    else if (phoneNum.length < 10) errors.phone = "Số điện thoại phải đủ 10 số";

    if (!profileForm.address.trim()) errors.address = "Vui lòng nhập địa chỉ";

    if (Object.keys(errors).length > 0) {
      setProfileErrors(errors);
      triggerToast("Vui lòng kiểm tra lại các trường thông tin bị lỗi!");
      return;
    }

    try {
      const payload = {
        fullName: profileForm.name,
        dob: profileForm.dob,
        gender: profileForm.gender,
        phone: profileForm.phone,
        address: profileForm.address,
      };

      const res = await fetch(`http://localhost:8080/api/customer/profile/1`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Có lỗi xảy ra");
      }

      setProfile({ ...profileForm });
      setIsEditingProfile(false);
      triggerToast("Cập nhật thông tin cá nhân lên hệ thống thành công!");
    } catch (error: any) {
      triggerToast("Lỗi cập nhật: " + error.message);
    }
  };

  // --- XỬ LÝ SUBMIT PHẢN HỒI ---
  // Hàm xử lý Hủy bỏ (Xóa trắng Form)
  const handleCancelFeedback = () => {
    setFeedbackForm({ vacName: "", time: "", place: "", doctor: "", normalContent: "", highLevelType: "Phàn nàn", highLevelContent: "" });
    setFeedbackErrors({});
  };

  // Hàm xử lý Submit Phản hồi lên DB
  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};

    if (feedbackType === "after_vaccine") {
      if (!feedbackForm.vacName.trim()) errors.vacName = "Vui lòng nhập tên vắc-xin";
      if (!feedbackForm.time) errors.time = "Vui lòng nhập/chọn thời gian tiêm";
      if (!feedbackForm.place.trim()) errors.place = "Vui lòng nhập địa điểm";
      if (!feedbackForm.doctor.trim()) errors.doctor = "Vui lòng nhập tên nhân viên";
      if (!feedbackForm.normalContent.trim()) errors.normalContent = "Vui lòng nhập nội dung phản hồi"; // <-- THÊM VALIDATE
    } else {
      if (!feedbackForm.highLevelContent.trim()) errors.highLevelContent = "Vui lòng nhập nội dung phản hồi";
    }

    if (Object.keys(errors).length > 0) {
      setFeedbackErrors(errors);
      triggerToast(feedbackType === "after_vaccine" ? "Vui lòng điền đầy đủ thông tin" : "Phản hồi gửi thất bại");
      return;
    }

    try {
      const endpoint = feedbackType === "after_vaccine" ? "/api/customer/feedback/normal" : "/api/customer/feedback/high-level";

      const payload = {
        maBenhNhan: 1,
        vacName: feedbackForm.vacName,
        time: feedbackForm.time,
        place: feedbackForm.place,
        doctor: feedbackForm.doctor,
        normalContent: feedbackForm.normalContent, // <-- THÊM VÀO PAYLOAD GỬI ĐI
        highLevelType: feedbackForm.highLevelType,
        highLevelContent: feedbackForm.highLevelContent,
      };

      const res = await fetch(`http://localhost:8080${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error("API trả về lỗi");
      }

      // Thông báo đúng như SRS yêu cầu
      triggerToast(feedbackType === "after_vaccine" ? "Gửi thành công" : "Phản hồi gửi đi thành công.");
      handleCancelFeedback(); // Reset form sau khi gửi
    } catch (error) {
      triggerToast(feedbackType === "after_vaccine" ? "Gửi thất bại" : "Phản hồi gửi thất bại");
    }
  };

  // --- XỬ LÝ ĐĂNG KÝ (XÁC NHẬN) ---
  const [bookingDate, setBookingDate] = useState<string>("");

  const handleConfirmBooking = async () => {
    if (bookModal.type === "vaccine" && !bookingDate) {
      triggerToast("Vui lòng chọn ngày mong muốn tiêm!");
      return;
    }

    try {
      const payload: any = {
        maBenhNhan: 1,
      };

      if (bookModal.type === "vaccine") {
        payload.maVacXin = bookModal.data.maVacXin;
        payload.ngayMongMuon = bookingDate;
      } else {
        const rawId = bookModal.data.maLichTiem;
        const numericId = typeof rawId === "string" ? parseInt(rawId.replace(/\D/g, ""), 10) : rawId;
        payload.maLichTiem = numericId;

        if (bookModal.data.ngay && bookModal.data.thang && bookModal.data.nam) {
          payload.ngayMongMuon = `${bookModal.data.nam}-${bookModal.data.thang}-${bookModal.data.ngay}`;
        } else {
          payload.ngayMongMuon = bookingDate || new Date().toISOString().split("T")[0];
        }
      }

      const res = await fetch("http://localhost:8080/api/customer/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Có lỗi xảy ra khi đăng ký");
      }

      triggerToast("Đăng ký thành công! Hệ thống đã lưu phiếu đăng ký lịch tiêm vào CSDL.");
      setBookModal({ isOpen: false, type: "vaccine", data: null });
      setBookingDate("");
    } catch (err: any) {
      triggerToast("Lỗi: " + err.message);
    }
  };

  // --- TÌM KIẾM, LỌC & PHÂN TRANG VẮC XIN TỪ DATABASE ---
  const [vacSearchType, setVacSearchType] = useState("Tất cả");
  const [vacSearchName, setVacSearchName] = useState("");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const ITEMS_PER_PAGE = 8;

  const uniqueTypes = ["Tất cả", ...Array.from(new Set(vaccines.map((v) => v.loaiVacXin).filter(Boolean)))];

  useEffect(() => {
    setCurrentPage(1);
  }, [vacSearchType, vacSearchName]);

  const filteredVaccines = vaccines.filter(
    (v) =>
      (vacSearchType === "Tất cả" || (v.loaiVacXin && v.loaiVacXin === vacSearchType)) &&
      v.tenVacXin.toLowerCase().includes(vacSearchName.toLowerCase()),
  );

  const totalPages = Math.ceil(filteredVaccines.length / ITEMS_PER_PAGE) || 1;
  const currentVaccines = filteredVaccines.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const getVaccineTypeCount = (type: string) => {
    if (type === "Tất cả") return vaccines.length;
    return vaccines.filter((v) => v.loaiVacXin === type).length;
  };

  return (
    <>
      <div className="space-y-6 animate-fade-in h-full flex flex-col">
        {/* HEADER CHUẨN */}
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">👤 Phân hệ Khách Hàng (Customer)</h2>
          <p className="text-sm text-slate-500 mt-1">Tra cứu thông tin, đăng ký tiêm chủng và quản lý hồ sơ cá nhân.</p>
        </div>

        {/* MENU TABS */}
        <div className="border-b border-slate-200 flex space-x-2 overflow-x-auto no-scrollbar">
          {[
            { id: "profile", icon: User, label: "Hồ sơ cá nhân" },
            { id: "vaccines", icon: Syringe, label: "Xem thông tin Vắc-xin" },
            { id: "schedules", icon: CalendarDays, label: "Tra cứu lịch tiêm" },
            { id: "diseases", icon: Bug, label: "Tình hình dịch bệnh" },
            { id: "feedback", icon: MessageSquare, label: "Gửi phản hồi" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2.5 font-medium text-sm border-b-2 transition-colors whitespace-nowrap flex items-center gap-2 ${
                activeTab === tab.id ? "border-blue-600 text-blue-600" : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* NỘI DUNG TABS */}
        <div className="flex-1 overflow-y-auto pb-6">
          {/* ======================= TAB 1: HỒ SƠ CÁ NHÂN ======================= */}
          {activeTab === "profile" && (
            <div className="space-y-6 animate-fade-in">
              {/* KHỐI 1: THÔNG TIN CÁ NHÂN / FORM CHỈNH SỬA */}
              <div className="w-full">
                {!isEditingProfile ? (
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                    {/* Header thông tin - Thay đổi thiết kế phẳng, đồng bộ, cân đối */}
                    <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-5 flex flex-wrap md:items-center md:justify-between gap-4">
                      <div>
                        <h3 className="text-2xl font-black text-white tracking-tight">{profile.name || "Chưa cập nhật tên"}</h3>
                        <p className="text-[11px] font-bold text-indigo-100 uppercase tracking-wider mt-0.5 opacity-90">
                          Mã Bệnh Nhân: BN{String(profile.id).padStart(4, "0")}
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          setProfileForm({ ...profile });
                          setProfileErrors({});
                          setIsEditingProfile(true);
                        }}
                        className="bg-white/10 hover:bg-white/20 text-white border border-white/20 px-4 py-2.5 rounded-xl text-xs font-bold transition-all backdrop-blur-sm flex items-center gap-2 cursor-pointer shadow-sm self-start md:self-center"
                      >
                        <Edit className="w-3.5 h-3.5" /> Chỉnh sửa hồ sơ
                      </button>
                    </div>

                    {/* Lưới thông tin chi tiết */}
                    <div className="px-8 py-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5 bg-white">
                      <div className="bg-slate-50/70 px-4 py-3.5 rounded-xl border border-slate-100 flex flex-col justify-center">
                        <span className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1">Ngày sinh</span>
                        <span className="text-sm font-bold text-slate-700">{profile.dob || "---"}</span>
                      </div>
                      <div className="bg-slate-50/70 px-4 py-3.5 rounded-xl border border-slate-100 flex flex-col justify-center">
                        <span className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1">Giới tính</span>
                        <span className="text-sm font-bold text-slate-700">{profile.gender || "---"}</span>
                      </div>
                      <div className="bg-slate-50/70 px-4 py-3.5 rounded-xl border border-slate-100 flex flex-col justify-center">
                        <span className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1">Điện thoại</span>
                        <span className="text-sm font-extrabold font-mono text-blue-600">{profile.phone || "---"}</span>
                      </div>
                      <div className="bg-slate-50/70 px-4 py-3.5 rounded-xl border border-slate-100 flex flex-col justify-center">
                        <span className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1">Địa chỉ thường trú</span>
                        <span className="text-sm font-bold text-slate-700 truncate block" title={profile.address}>
                          {profile.address || "---"}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <form
                    onSubmit={handleProfileSubmit}
                    className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col animate-fade-in"
                  >
                    <div className="p-5 border-b border-slate-100 bg-slate-50/80 flex items-center gap-3">
                      <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                        <Edit className="w-5 h-5" />
                      </div>
                      <h3 className="font-bold text-slate-800 text-lg">Cập nhật thông tin hồ sơ cá nhân</h3>
                    </div>

                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">
                          Họ và tên bệnh nhân <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          maxLength={50}
                          value={profileForm.name}
                          onChange={(e) => {
                            setProfileForm({ ...profileForm, name: e.target.value });
                            setProfileErrors({ ...profileErrors, name: "" });
                          }}
                          className={`w-full px-3.5 py-2.5 border rounded-xl text-sm outline-none transition-all ${profileErrors.name ? "border-red-500 bg-red-50 focus:ring-4 focus:ring-red-500/10" : "border-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"}`}
                        />
                        {profileErrors.name && <p className="text-[11px] text-red-500 font-bold mt-1.5">{profileErrors.name}</p>}
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1.5">
                            Ngày sinh <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="date"
                            value={profileForm.dob}
                            onChange={(e) => {
                              setProfileForm({ ...profileForm, dob: e.target.value });
                              setProfileErrors({ ...profileErrors, dob: "" });
                            }}
                            className={`w-full px-3.5 py-2.5 border rounded-xl text-sm outline-none transition-all ${profileErrors.dob ? "border-red-500 bg-red-50 focus:ring-4 focus:ring-red-500/10" : "border-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"}`}
                          />
                          {profileErrors.dob && <p className="text-[11px] text-red-500 font-bold mt-1.5">{profileErrors.dob}</p>}
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1.5">
                            Giới tính <span className="text-red-500">*</span>
                          </label>
                          <div className="flex gap-4 items-center h-[42px] px-3 bg-white border border-slate-300 rounded-xl">
                            <label className="flex items-center gap-2 text-sm cursor-pointer font-medium text-slate-700">
                              <input
                                type="radio"
                                checked={profileForm.gender === "Nam"}
                                onChange={() => setProfileForm({ ...profileForm, gender: "Nam" })}
                                className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                              />{" "}
                              Nam
                            </label>
                            <label className="flex items-center gap-2 text-sm cursor-pointer font-medium text-slate-700">
                              <input
                                type="radio"
                                checked={profileForm.gender === "Nữ"}
                                onChange={() => setProfileForm({ ...profileForm, gender: "Nữ" })}
                                className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                              />{" "}
                              Nữ
                            </label>
                          </div>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">
                          Số điện thoại liên lạc <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={profileForm.phone}
                          placeholder="090 123 4567"
                          onChange={(e) => handlePhoneChange(e, setProfileForm, profileForm, profileErrors, setProfileErrors)}
                          className={`w-full px-3.5 py-2.5 border rounded-xl font-mono text-sm outline-none transition-all ${profileErrors.phone ? "border-red-500 bg-red-50 focus:ring-4 focus:ring-red-500/10" : "border-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"}`}
                        />
                        {profileErrors.phone && <p className="text-[11px] text-red-500 font-bold mt-1.5">{profileErrors.phone}</p>}
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">
                          Địa chỉ thường trú <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          maxLength={255}
                          value={profileForm.address}
                          onChange={(e) => {
                            setProfileForm({ ...profileForm, address: e.target.value });
                            setProfileErrors({ ...profileErrors, address: "" });
                          }}
                          className={`w-full px-3.5 py-2.5 border rounded-xl text-sm outline-none transition-all ${profileErrors.address ? "border-red-500 bg-red-50 focus:ring-4 focus:ring-red-500/10" : "border-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"}`}
                        />
                        {profileErrors.address && <p className="text-[11px] text-red-500 font-bold mt-1.5">{profileErrors.address}</p>}
                      </div>

                      <div className="col-span-1 md:col-span-2 flex justify-end gap-3 pt-2 border-t border-slate-100 mt-2">
                        <button
                          type="button"
                          onClick={() => setIsEditingProfile(false)}
                          className="px-5 py-2.5 border border-slate-300 rounded-xl text-sm font-bold text-slate-600 bg-white cursor-pointer hover:bg-slate-100 transition-colors"
                        >
                          Hủy bỏ
                        </button>
                        <button
                          type="submit"
                          className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold cursor-pointer flex items-center gap-2 hover:bg-blue-700 shadow-md shadow-blue-600/20 transition-all"
                        >
                          <Save className="w-4 h-4" /> Lưu thông tin mới
                        </button>
                      </div>
                    </div>
                  </form>
                )}
              </div>

              {/* KHỐI 2: BẢNG LỊCH SỬ TIÊM PHÒNG */}
              <div className="w-full bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
                      <Syringe className="w-5 h-5" />
                    </div>
                    <h3 className="font-bold text-lg text-slate-800">Lịch sử và Nhật ký tiêm chủng chi tiết</h3>
                  </div>
                  <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-extrabold border border-blue-100">
                    Đã tiêm: {history.length} mũi
                  </span>
                </div>

                <div className="overflow-x-auto p-5">
                  <table className="w-full text-left text-sm border-collapse min-w-[900px]">
                    <thead>
                      <tr className="border-b-2 border-slate-200 text-slate-500 uppercase tracking-wider text-[11px] font-black bg-slate-50/50">
                        <th className="px-4 py-3 w-[5%]">STT</th>
                        <th className="px-4 py-3 w-[14%]">Thời gian</th>
                        <th className="px-4 py-3 w-[18%]">Địa điểm</th>
                        <th className="px-4 py-3 w-[26%]">Tên Vắc-xin</th>
                        <th className="px-4 py-3 w-[17%]">Loại Vắc-xin</th>
                        <th className="px-4 py-3 w-[8%]">Liều</th>
                        <th className="px-4 py-3 w-[12%] text-center">Kết quả</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {history.length > 0 ? (
                        history.map((h, i) => (
                          <tr key={h.id} className="hover:bg-slate-50/60 transition-colors group">
                            <td className="px-4 py-3.5 font-mono text-slate-400 font-medium">{i + 1}</td>
                            <td className="px-4 py-3.5 font-mono text-slate-600 font-medium">{h.date}</td>
                            <td className="px-4 py-3.5 text-slate-600">{h.place}</td>
                            <td className="px-4 py-3.5 font-black text-slate-800 group-hover:text-blue-700 transition-colors">{h.vacName}</td>
                            <td className="px-4 py-3.5 text-slate-600">{h.vacType}</td>
                            <td className="px-4 py-3.5 font-mono font-bold text-slate-500">{h.dosage}</td>
                            <td className="px-4 py-3.5 text-center">
                              <span
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold inline-flex items-center justify-center border shadow-sm ${
                                  h.status === "Hoàn thành"
                                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                    : "bg-amber-50 text-amber-700 border-amber-200"
                                }`}
                              >
                                {h.status}
                              </span>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={7} className="text-center py-12">
                            <div className="flex flex-col items-center justify-center text-slate-400">
                              <CalendarDays className="w-12 h-12 mb-3 text-slate-300" />
                              <p className="font-medium">Chưa ghi nhận lịch sử tiêm chủng nào của bệnh nhân trên hệ thống.</p>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ======================= TAB 2: XEM THÔNG TIN VẮC-XIN LẤY TỪ DB ======================= */}
          {activeTab === "vaccines" && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col h-full min-h-0">
              {/* Thanh Tìm kiếm và Lọc */}
              <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center gap-3 shrink-0">
                <div className="flex-1 flex gap-2">
                  <select
                    value={vacSearchType}
                    onChange={(e) => setVacSearchType(e.target.value)}
                    className="px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-500 bg-white cursor-pointer"
                  >
                    {uniqueTypes.map((type, idx) => (
                      <option key={idx} value={type}>
                        {type} ({getVaccineTypeCount(type)})
                      </option>
                    ))}
                  </select>
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Tìm kiếm nhanh loại vắc-xin..."
                      value={vacSearchName}
                      onChange={(e) => setVacSearchName(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 text-sm focus:border-blue-500 outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Bảng Hiển thị Vắc Xin chuẩn Inventory, Fix Cột, Break-Words */}
              <div className="overflow-y-auto overflow-x-hidden flex-1">
                <table className="w-full text-left text-xs border-collapse table-fixed">
                  <thead className="sticky top-0 bg-slate-50 z-10 shadow-sm">
                    <tr className="text-slate-500 font-bold border-b border-slate-200 uppercase tracking-wider">
                      <th className="px-2 sm:px-3 py-3 w-[8%]">Mã VX</th>
                      <th className="px-2 sm:px-3 py-3 w-[20%]">Tên Vắc-xin</th>
                      <th className="px-2 sm:px-3 py-3 w-[15%]">Phân loại</th>
                      <th className="px-2 sm:px-3 py-3 w-[17%]">Phòng bệnh</th>
                      <th className="px-2 sm:px-3 py-3 w-[12%]">Độ tuổi</th>
                      <th className="px-2 sm:px-3 py-3 w-[10%] text-right">Đơn giá</th>
                      <th className="px-2 sm:px-3 py-3 w-[8%] text-center">Tồn</th>
                      <th className="px-2 sm:px-3 py-3 w-[10%] text-center">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {currentVaccines.length > 0 ? (
                      currentVaccines.map((v) => (
                        <tr key={v.maVacXin} className="hover:bg-slate-50/50">
                          <td className="px-2 sm:px-3 py-3.5 font-mono text-slate-400 break-words">VX{String(v.maVacXin).padStart(3, "0")}</td>
                          <td className="px-2 sm:px-3 py-3.5 font-bold text-slate-800 break-words">{v.tenVacXin}</td>
                          <td className="px-2 sm:px-3 py-3.5 break-words">{v.loaiVacXin || "Chưa phân loại"}</td>
                          <td className="px-2 sm:px-3 py-3.5 text-[11px] text-slate-600 break-words">{v.phongNguaBenh}</td>
                          <td className="px-2 sm:px-3 py-3.5 text-slate-600 break-words">{v.doTuoiTiemChung}</td>
                          <td className="px-2 sm:px-3 py-3.5 text-right font-extrabold text-blue-700 break-words">{formatCurrency(v.donGia)}</td>
                          <td className="px-2 sm:px-3 py-3.5 text-center">
                            {v.tonKho > 0 ? (
                              <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-1 rounded-md text-[10px] font-bold">
                                Sẵn có
                              </span>
                            ) : (
                              <span className="bg-red-50 text-red-700 border border-red-200 px-1.5 py-1 rounded-md text-[10px] font-bold">
                                Đã hết
                              </span>
                            )}
                          </td>
                          <td className="px-2 sm:px-3 py-3.5 text-center">
                            <button
                              title="Đăng ký"
                              disabled={v.tonKho <= 0}
                              onClick={() => {
                                setBookModal({ isOpen: true, type: "vaccine", data: v });
                              }}
                              className="bg-blue-600 text-white p-2 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer inline-flex items-center justify-center transition-colors"
                            >
                              <PlusCircle className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={8} className="text-center py-8 text-slate-400">
                          Không tìm thấy dữ liệu hoặc chưa kết nối đến Database.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination Footer */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 bg-slate-50/50 shrink-0">
                  <span className="text-[11px] font-semibold text-slate-500">
                    Đang hiển thị {(currentPage - 1) * ITEMS_PER_PAGE + 1} - {Math.min(currentPage * ITEMS_PER_PAGE, filteredVaccines.length)} /{" "}
                    {filteredVaccines.length}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="p-1 border border-slate-200 rounded hover:bg-white disabled:opacity-40 cursor-pointer"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="text-[11px] font-bold px-3 py-1 bg-white border border-slate-200 rounded shadow-sm">
                      {currentPage} / {totalPages}
                    </span>
                    <button
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="p-1 border border-slate-200 rounded hover:bg-white disabled:opacity-40 cursor-pointer"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ======================= TAB 3: TRA CỨU LỊCH TIÊM ======================= */}
          {activeTab === "schedules" && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col">
              <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center shrink-0">
                <h3 className="font-bold text-xs text-slate-500 uppercase tracking-wider">Lịch tiêm phòng trung tâm</h3>
                <span className="bg-blue-100 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded-full">{schedules.length} record</span>
              </div>

              <div className="p-4 overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse table-fixed min-w-[1000px]">
                  <thead>
                    <tr className="bg-slate-100 text-slate-600 font-bold border-b border-slate-200">
                      <th className="px-4 py-3 w-[10%]">Mã Lịch</th>
                      <th className="px-4 py-3 w-[15%]">Ngày & Thời gian</th>
                      <th className="px-4 py-3 w-[15%]">Địa điểm</th>
                      <th className="px-4 py-3 w-[18%]">Tên Vắc-xin</th>
                      <th className="px-4 py-3 w-[12%]">Loại Vắc-xin</th>
                      <th className="px-4 py-3 w-[8%] text-center">SL</th>
                      <th className="px-4 py-3 w-[10%]">Đối tượng</th>
                      <th className="px-4 py-3 w-[12%]">Ghi chú</th>
                      <th className="px-4 py-3 text-center w-[10%]">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {schedules.map((s) => (
                      <tr key={s.maLichTiem} className="hover:bg-slate-50">
                        <td className="px-4 py-3 font-mono text-xs text-slate-400 break-words">{s.maLichTiem}</td>
                        <td className="px-4 py-3 text-xs text-slate-600 break-words">
                          <span className="font-bold text-red-600">
                            {s.ngay}/{s.thang}/{s.nam}
                          </span>{" "}
                          <br />
                          <span className="text-[11px]">{s.thoiGian}</span>
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-600 break-words">{s.diaDiem}</td>
                        <td className="px-4 py-3 font-bold text-xs text-blue-800 break-words">{s.tenVacXin}</td>
                        <td className="px-4 py-3 text-xs text-slate-600 break-words">{s.loaiVacXin}</td>
                        <td className="px-4 py-3 text-xs text-slate-600 break-words font-mono font-semibold text-center">{s.soLuong}</td>
                        <td className="px-4 py-3 text-xs text-slate-600 break-words">{s.doTuoi}</td>
                        <td className="px-4 py-3 text-xs text-slate-600 break-words">{s.ghiChu}</td>
                        <td className="px-4 py-3 text-center">
                          <button
                            title="Đăng ký"
                            onClick={() => setBookModal({ isOpen: true, type: "schedule", data: s })}
                            className="bg-blue-600 text-white p-2 rounded-lg font-semibold hover:bg-blue-700 cursor-pointer inline-flex items-center justify-center mx-auto transition-colors"
                          >
                            <PlusCircle className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {schedules.length === 0 && (
                      <tr>
                        <td colSpan={9} className="text-center py-8 text-slate-400 text-xs">
                          Không có lịch tiêm chủng nào.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ======================= TAB 4: TÌNH HÌNH DỊCH BỆNH ======================= */}
          {activeTab === "diseases" && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
              <div className="p-4 bg-slate-50 border-b border-slate-200">
                <h3 className="font-bold text-xs text-slate-500 uppercase tracking-wider">Bảng tra cứu dịch bệnh tại địa phương</h3>
              </div>
              <div className="p-4 overflow-x-auto">
                {/* Đã thêm table-fixed và bỏ min-w để bảng co giãn vừa màn hình */}
                <table className="w-full table-fixed text-left text-sm border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-slate-600 font-bold border-b border-slate-200 text-xs">
                      <th className="px-2 py-3 w-[5%] text-center">STT</th>
                      <th className="px-2 py-3 w-[10%]">Thời điểm KS</th>
                      <th className="px-2 py-3 w-[12%]">Địa chỉ</th>
                      <th className="px-2 py-3 w-[14%]">Loại dịch bệnh</th>
                      <th className="px-2 py-3 w-[9%] text-center">Ca nhiễm</th>
                      <th className="px-2 py-3 w-[18%]">Đường lây nhiễm</th>
                      <th className="px-2 py-3 w-[18%]">Tác hại sức khoẻ</th>
                      <th className="px-2 py-3 w-[14%]">Vắc-xin phòng</th>
                      {/* Đã xóa cột Ghi chú */}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700 text-xs">
                    {diseases.length > 0 ? (
                      diseases.map((d, idx) => (
                        <tr key={d.id || idx} className="hover:bg-slate-50 align-top">
                          {/* Bổ sung break-words để text quá dài sẽ tự xuống dòng */}
                          <td className="px-2 py-3 font-mono text-center font-bold text-slate-400 break-words">{idx + 1}</td>
                          <td className="px-2 py-3 font-mono text-slate-600 break-words">{d.thoiDiemKhaoSat || "---"}</td>
                          <td className="px-2 py-3 text-slate-600 break-words">{d.diaChi || "---"}</td>
                          <td className="px-2 py-3 font-bold text-red-600 break-words">{d.tenDichBenh || "---"}</td>
                          <td className="px-2 py-3 text-center font-mono font-bold text-amber-600 bg-amber-50/30 break-words">
                            {d.soNguoiNhiem ? new Intl.NumberFormat("vi-VN").format(d.soNguoiNhiem) : 0}
                          </td>
                          <td className="px-2 py-3 text-slate-600 leading-relaxed break-words">{d.duongLayNhiem || "---"}</td>
                          <td className="px-2 py-3 text-slate-600 leading-relaxed break-words">{d.tacHai || "---"}</td>
                          <td className="px-2 py-3 font-semibold text-blue-700 break-words">
                            {d.vacXinPhong ? (
                              <span className="bg-blue-50 text-blue-700 border border-blue-200 px-2 py-1 rounded-md inline-block break-words">
                                {d.vacXinPhong}
                              </span>
                            ) : (
                              <span className="text-slate-400 font-normal italic">Chưa có dữ liệu</span>
                            )}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={8} className="text-center py-10 text-slate-400">
                          <Bug className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                          Chưa có dữ liệu dịch bệnh nào được ghi nhận trên hệ thống.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ======================= TAB 5: GỬI PHẢN HỒI ======================= */}
          {activeTab === "feedback" && (
            <div className="max-w-3xl mx-auto space-y-6">
              <div className="flex gap-4">
                <label
                  className={`flex-1 border p-4 rounded-xl cursor-pointer transition-colors ${feedbackType === "after_vaccine" ? "border-blue-500 bg-blue-50 shadow-sm" : "border-slate-200 bg-white hover:bg-slate-50"}`}
                >
                  <input
                    type="radio"
                    className="hidden"
                    checked={feedbackType === "after_vaccine"}
                    onChange={() => {
                      setFeedbackType("after_vaccine");
                      setFeedbackErrors({});
                    }}
                  />
                  <div className="font-bold text-slate-800 mb-1">💬 Phản hồi sau khi tiêm</div>
                  <div className="text-xs text-slate-500">Thông báo tình trạng sức khỏe cho bác sĩ/y tá.</div>
                </label>
                <label
                  className={`flex-1 border p-4 rounded-xl cursor-pointer transition-colors ${feedbackType === "high_level" ? "border-amber-500 bg-amber-50 shadow-sm" : "border-slate-200 bg-white hover:bg-slate-50"}`}
                >
                  <input
                    type="radio"
                    className="hidden"
                    checked={feedbackType === "high_level"}
                    onChange={() => {
                      setFeedbackType("high_level");
                      setFeedbackErrors({});
                    }}
                  />
                  <div className="font-bold text-slate-800 mb-1">⭐ Phản hồi cấp cao</div>
                  <div className="text-xs text-slate-500">Gửi trực tiếp lên Lãnh đạo / Giám đốc trung tâm.</div>
                </label>
              </div>

              <form onSubmit={handleFeedbackSubmit} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
                {feedbackType === "after_vaccine" ? (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Tên vắc-xin đã tiêm <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          maxLength={100}
                          value={feedbackForm.vacName}
                          onChange={(e) => {
                            setFeedbackForm({ ...feedbackForm, vacName: e.target.value });
                            setFeedbackErrors({ ...feedbackErrors, vacName: "" });
                          }}
                          className={`w-full px-3 py-2 border rounded-lg text-xs outline-none ${feedbackErrors.vacName ? "border-red-500 bg-red-50" : "border-slate-300 focus:border-blue-500"}`}
                        />
                        {feedbackErrors.vacName && <p className="text-[10px] text-red-500 font-bold mt-1">{feedbackErrors.vacName}</p>}
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Thời gian tiêm <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="date"
                          value={feedbackForm.time}
                          onChange={(e) => {
                            setFeedbackForm({ ...feedbackForm, time: e.target.value });
                            setFeedbackErrors({ ...feedbackErrors, time: "" });
                          }}
                          className={`w-full px-3 py-2 border rounded-lg text-xs outline-none ${feedbackErrors.time ? "border-red-500 bg-red-50" : "border-slate-300 focus:border-blue-500"}`}
                        />
                        {feedbackErrors.time && <p className="text-[10px] text-red-500 font-bold mt-1">{feedbackErrors.time}</p>}
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Địa điểm tiêm <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          maxLength={200}
                          value={feedbackForm.place}
                          onChange={(e) => {
                            setFeedbackForm({ ...feedbackForm, place: e.target.value });
                            setFeedbackErrors({ ...feedbackErrors, place: "" });
                          }}
                          className={`w-full px-3 py-2 border rounded-lg text-xs outline-none ${feedbackErrors.place ? "border-red-500 bg-red-50" : "border-slate-300 focus:border-blue-500"}`}
                        />
                        {feedbackErrors.place && <p className="text-[10px] text-red-500 font-bold mt-1">{feedbackErrors.place}</p>}
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Nhân viên phụ trách <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          maxLength={50}
                          value={feedbackForm.doctor}
                          onChange={(e) => {
                            setFeedbackForm({ ...feedbackForm, doctor: e.target.value });
                            setFeedbackErrors({ ...feedbackErrors, doctor: "" });
                          }}
                          className={`w-full px-3 py-2 border rounded-lg text-xs outline-none ${feedbackErrors.doctor ? "border-red-500 bg-red-50" : "border-slate-300 focus:border-blue-500"}`}
                        />
                        {feedbackErrors.doctor && <p className="text-[10px] text-red-500 font-bold mt-1">{feedbackErrors.doctor}</p>}
                      </div>
                    </div>
                    <div className="pt-2">
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Nội dung phản hồi tình trạng <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        maxLength={1000}
                        value={feedbackForm.normalContent}
                        placeholder="Nhập tình trạng sức khỏe, phản ứng sau tiêm hoặc ý kiến đóng góp của bạn..."
                        onChange={(e) => {
                          setFeedbackForm({ ...feedbackForm, normalContent: e.target.value });
                          setFeedbackErrors({ ...feedbackErrors, normalContent: "" });
                        }}
                        className={`w-full px-3 py-2 border rounded-lg text-xs outline-none h-20 resize-none ${feedbackErrors.normalContent ? "border-red-500 bg-red-50" : "border-slate-300 focus:border-blue-500"}`}
                      />
                      {feedbackErrors.normalContent && <p className="text-[10px] text-red-500 font-bold mt-1">{feedbackErrors.normalContent}</p>}
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Loại phản hồi <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={feedbackForm.highLevelType}
                        onChange={(e) => setFeedbackForm({ ...feedbackForm, highLevelType: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs outline-none focus:border-blue-500 bg-white"
                      >
                        <option>Phàn nàn</option>
                        <option>Khen ngợi</option>
                        <option>Động viên</option>
                        <option>Khuyến khích</option>
                        <option>Ủng hộ</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Nội dung <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        maxLength={1000}
                        value={feedbackForm.highLevelContent}
                        placeholder="Chi tiết phần trình bày phản hồi..."
                        onChange={(e) => {
                          setFeedbackForm({ ...feedbackForm, highLevelContent: e.target.value });
                          setFeedbackErrors({ ...feedbackErrors, highLevelContent: "" });
                        }}
                        className={`w-full px-3 py-2 border rounded-lg text-xs outline-none h-24 resize-none ${feedbackErrors.highLevelContent ? "border-red-500 bg-red-50" : "border-slate-300 focus:border-blue-500"}`}
                      />
                      {feedbackErrors.highLevelContent && (
                        <p className="text-[10px] text-red-500 font-bold mt-1">{feedbackErrors.highLevelContent}</p>
                      )}
                    </div>
                  </>
                )}

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleCancelFeedback}
                    className="px-6 py-2 bg-white border border-slate-300 text-slate-600 rounded-lg text-xs font-semibold cursor-pointer hover:bg-slate-50 transition-colors"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold cursor-pointer flex items-center gap-1.5 hover:bg-blue-700"
                  >
                    <Send className="w-4 h-4" /> Gửi phản hồi
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>

      {/* ======================= MODAL: ĐĂNG KÍ TIÊM PHÒNG ======================= */}
      {bookModal.isOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden border border-blue-100 flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="p-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white flex justify-between items-center shrink-0">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5" /> Đăng ký tiêm phòng Vắc-xin
              </h3>
              <button
                onClick={() => {
                  setBookModal({ isOpen: false, type: "vaccine", data: null });
                  setBookingDate("");
                }}
                className="hover:bg-blue-800 p-1 rounded-full cursor-pointer transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 overflow-y-auto space-y-5">
              <div className="text-center border-b border-slate-100 pb-4">
                <span className="bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase mb-2 inline-block">
                  Thông tin vắc-xin
                </span>
                <h4 className="text-xl font-extrabold text-slate-800 leading-tight">{bookModal.data.tenVacXin}</h4>
              </div>

              {/* Bảng Hiển thị chi tiết trọn vẹn thông tin đối tượng đăng ký */}
              {bookModal.type === "vaccine" ? (
                <div className="grid grid-cols-2 gap-3 text-sm animate-fade-in">
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <span className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Mã Vắc-xin</span>
                    <span className="font-mono text-slate-700 font-semibold">VX{String(bookModal.data.maVacXin).padStart(3, "0")}</span>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <span className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Nhóm (Phân loại)</span>
                    <span className="text-slate-700 font-semibold">{bookModal.data.loaiVacXin || "Chưa phân loại"}</span>
                  </div>
                  <div className="col-span-2 bg-blue-50/50 p-3 rounded-lg border border-blue-100/50">
                    <span className="block text-[10px] uppercase font-bold text-blue-400 mb-1">Phòng bệnh</span>
                    <span className="text-blue-900 font-medium text-xs">{bookModal.data.phongNguaBenh}</span>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <span className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Độ tuổi khuyên dùng</span>
                    <span className="text-slate-700 font-medium text-xs">{bookModal.data.doTuoiTiemChung}</span>
                  </div>
                  <div className="bg-emerald-50 p-3 rounded-lg border border-emerald-100 text-right flex flex-col justify-center">
                    <span className="block text-[10px] uppercase font-bold text-emerald-500 mb-0.5">Đơn giá niêm yết</span>
                    <span className="font-extrabold text-emerald-700 text-base">
                      {new Intl.NumberFormat("vi-VN").format(bookModal.data.donGia)} ₫
                    </span>
                  </div>
                </div>
              ) : (
                /* HIỂN THỊ ĐẦY ĐỦ THÔNG TIN TOÀN BỘ CỦA LỊCH TIÊM TRUNG TÂM */
                <div className="space-y-3 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200 shadow-inner animate-fade-in">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <span className="block text-[10px] font-bold uppercase text-slate-400 mb-0.5">Mã Lịch Tiêm</span>
                      <span className="font-mono text-slate-800 font-bold text-sm">{bookModal.data.maLichTiem}</span>
                    </div>
                    <div>
                      <span className="block text-[10px] font-bold uppercase text-slate-400 mb-0.5">Thời Gian Tiêm Cố Định</span>
                      <span className="text-red-600 font-extrabold text-sm">
                        {bookModal.data.ngay}/{bookModal.data.thang}/{bookModal.data.nam}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 border-t border-slate-200 pt-2">
                    <div>
                      <span className="block text-[10px] font-bold uppercase text-slate-400 mb-0.5">Nhóm phân loại</span>
                      <span className="text-slate-700 font-semibold">{bookModal.data.loaiVacXin}</span>
                    </div>
                    <div>
                      <span className="block text-[10px] font-bold uppercase text-slate-400 mb-0.5">Khung giờ hoạt động</span>
                      <span className="text-slate-700 font-medium font-mono">{bookModal.data.thoiGian}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 border-t border-slate-200 pt-2">
                    <div>
                      <span className="block text-[10px] font-bold uppercase text-slate-400 mb-0.5">Đối tượng chỉ định</span>
                      <span className="text-slate-700 font-medium">{bookModal.data.doTuoi || "Mọi đối tượng"}</span>
                    </div>
                    <div>
                      <span className="block text-[10px] font-bold uppercase text-slate-400 mb-0.5">Số lượng dự kiến</span>
                      <span className="text-slate-700 font-bold font-mono">{bookModal.data.soLuong} người</span>
                    </div>
                  </div>

                  <div className="border-t border-slate-200 pt-2">
                    <span className="block text-[10px] font-bold uppercase text-slate-400 mb-0.5">Địa điểm tổ chức</span>
                    <p className="text-slate-700 font-medium flex items-center gap-1">📍 {bookModal.data.diaDiem}</p>
                  </div>

                  {bookModal.data.danhSachBacSi && bookModal.data.danhSachBacSi.length > 0 && (
                    <div className="border-t border-slate-200 pt-2">
                      <span className="block text-[10px] font-bold uppercase text-slate-400 mb-0.5">Đội ngũ y tế phụ trách</span>
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        {bookModal.data.danhSachBacSi.map((doc: string, idx: number) => (
                          <span
                            key={idx}
                            className="bg-blue-100/70 text-blue-800 border border-blue-200/50 px-2 py-0.5 rounded text-[11px] font-medium"
                          >
                            {doc}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {bookModal.data.ghiChu && (
                    <div className="border-t border-slate-200 pt-2">
                      <span className="block text-[10px] font-bold uppercase text-slate-400 mb-0.5">Ghi chú lưu ý</span>
                      <p className="text-slate-500 italic leading-tight">{bookModal.data.ghiChu}</p>
                    </div>
                  )}
                </div>
              )}

              {/* ============================================================================= */}
              {/* KHU VỰC ĐIỀU CHỈNH Ô NHẬP NGÀY / THÔNG BÁO THEO TỪNG PHÂN HỆ ĐĂNG KÝ            */}
              {/* ============================================================================= */}
              {bookModal.type === "vaccine" ? (
                /* 1. TRƯỜNG HỢP ĐĂNG KÝ VẮC XIN TỰ DO */
                <div className="pt-2 animate-fade-in">
                  <label className="block text-xs font-bold text-slate-700 mb-2">
                    Ngày mong muốn tiêm <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={bookingDate}
                    onChange={(e) => setBookingDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:border-blue-500 outline-none shadow-sm cursor-pointer"
                  />
                </div>
              ) : (
                /* 2. TRƯỜNG HỢP ĐĂNG KÝ LỊCH TRUNG TÂM */
                <div className="pt-2 space-y-3 animate-fade-in">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-2">Ngày tiêm chỉ định (Cố định theo lịch trung tâm)</label>
                    <input
                      type="date"
                      disabled
                      value={bookModal.data ? `${bookModal.data.nam}-${bookModal.data.thang}-${bookModal.data.ngay}` : ""}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-100 text-slate-500 text-sm cursor-not-allowed outline-none font-medium"
                    />
                  </div>
                  <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                    <p className="text-[11px] text-blue-700 leading-relaxed">
                      Hệ thống tự động đồng bộ ngày tiêm{" "}
                      <span className="font-bold">
                        {bookModal.data?.ngay}/{bookModal.data?.thang}/{bookModal.data?.nam}
                      </span>{" "}
                      vào phiếu đăng ký của bạn. Vui lòng đến đúng khung giờ <span className="font-bold">{bookModal.data?.thoiGian}</span> tại địa
                      điểm để được phục vụ tốt nhất.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Footer Buttons */}
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3 shrink-0">
              <button
                onClick={() => {
                  setBookModal({ isOpen: false, type: "vaccine", data: null });
                  setBookingDate("");
                }}
                className="px-5 py-2.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer transition-colors"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleConfirmBooking}
                className="px-5 py-2.5 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 shadow-md shadow-blue-600/20 cursor-pointer transition-colors flex items-center gap-1.5"
              >
                <PlusCircle className="w-4 h-4" /> Xác nhận đăng ký
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
