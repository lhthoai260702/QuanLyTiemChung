import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { Search, Edit, Save, MapPin, Calendar, Syringe, Pill, X, Filter, FileText, UserPlus, List } from "lucide-react";
import axiosClient from "../utils/axiosClient";

export interface HistoryRecord {
  recordId: number;
  vaccineName: string;
  date: string;
  time?: string;
  sideEffect: string;
  thoiGianTacDung: string;
  status: string;
  place: string;
  vaccineType: string;
  dosage: string;
  ghiChu?: string;
}

export interface Patient {
  id: string;
  fullName: string;
  dob: string;
  gender: string;
  age: number;
  address: string;
  guardianName: string;
  phone: string;
  cmnd?: string;
  email?: string;
  matKhau?: string;
  username?: string;
  history: HistoryRecord[];
}

interface MedicalModuleProps {
  patients: Patient[];
  setPatients: React.Dispatch<React.SetStateAction<Patient[]>>;
  vaccines: any[];
  triggerToast: (msg: string) => void;
}

type FilterStatus = "Tất cả" | "Chưa tiêm" | "Bị hoãn" | "Đã tiêm";

export default function MedicalModule({ patients, setPatients, triggerToast }: MedicalModuleProps) {
  // STATE ĐIỀU HƯỚNG TAB CHÍNH
  const [activeMainTab, setActiveMainTab] = useState<"list" | "create">("list");

  // STATE CHO VNPAY POPUP
  const [showPaymentPopup, setShowPaymentPopup] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [vaccineOptions, setVaccineOptions] = useState<{ id: number; name: string }[]>([]);

  const [rightPaneMode, setRightPaneMode] = useState<"detail" | "edit_profile" | "edit_history" | "prescribe">("detail");
  const [activeInnerTab, setActiveInnerTab] = useState<"profile" | "history">("profile");

  const [historyFilter, setHistoryFilter] = useState<FilterStatus>("Tất cả");

  // STATE CHO FORM TẠO BỆNH NHÂN MỚI
  const [createForm, setCreateForm] = useState({
    tenDangNhap: "",
    matKhau: "",
    hoTen: "",
    cmnd: "",
    noiO: "",
    moTa: "",
    email: "",
    sdt: "",
    ngaySinh: "",
    diaChi: "",
    nguoiGiamHo: "",
    gioiTinh: "Nam",
  });
  const [createErrors, setCreateErrors] = useState<Record<string, string>>({});

  // =========================================================================
  // CACHE SYSTEM & BẢO MẬT GỌI API
  // =========================================================================
  const apiCache = useRef<Record<string, { data: any; timestamp: number }>>({});
  const CACHE_TTL = 5 * 60 * 1000; // 5 phút

  const fetchWithCache = useCallback(async (url: string, forceRefetch = false) => {
    if (!forceRefetch && apiCache.current[url]) {
      const cached = apiCache.current[url];
      if (Date.now() - cached.timestamp < CACHE_TTL) {
        return cached.data;
      }
    }
    try {
      const response = await axiosClient.get(url);
      const data = response.data;
      apiCache.current[url] = { data, timestamp: Date.now() };
      return data;
    } catch (error: any) {
      if (error.response?.status === 401 || error.response?.status === 403) {
         triggerToast("Từ chối quyền truy cập hoặc phiên làm việc đã hết hạn!");
      }
      throw error;
    }
  }, [triggerToast]);

  // =========================================================================
  // FETCH DỮ LIỆU
  // =========================================================================
  const fetchPatients = useCallback(async (force = false) => {
    try {
      const data = await fetchWithCache(`/api/medical/patients`, force);
      setPatients(data);
      return data;
    } catch (error: any) {
       console.error("Lỗi lấy danh sách bệnh nhân:", error);
    }
    return null;
  }, [fetchWithCache, setPatients]);

  const fetchVaccinesForCombobox = useCallback(async () => {
    try {
      const data = await fetchWithCache(`/api/medical/vaccines`);
      setVaccineOptions(data);
    } catch (error) {}
  }, [fetchWithCache]);

  useEffect(() => {
    fetchPatients();
    fetchVaccinesForCombobox();
  }, [fetchPatients, fetchVaccinesForCombobox]);

  // =========================================================================
  // XỬ LÝ DEBOUNCE TÌM KIẾM BỆNH NHÂN
  // =========================================================================
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearchQuery(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const filteredPatients = useMemo(() => {
    return patients.filter((p) => 
      p.id.includes(debouncedSearchQuery) || p.fullName.toLowerCase().includes(debouncedSearchQuery.toLowerCase())
    );
  }, [patients, debouncedSearchQuery]);

  useEffect(() => {
    if (filteredPatients.length > 0 && !selectedPatient && activeMainTab === "list") {
      handleSelectPatient(filteredPatients[0]);
    }
  }, [filteredPatients, selectedPatient, activeMainTab]);

  // =========================================================================
  // STATES CHO FORMS (UPDATE, HISTORY, PRESCRIBE)
  // =========================================================================
  const [updateForm, setUpdateForm] = useState({
    id: "",
    username: "",
    fullName: "",
    gender: "Nam",
    age: "",
    guardianName: "",
    address: "",
    phone: "",
    cmnd: "",
    email: "",
    matKhau: "",
  });
  const [updateErrors, setUpdateErrors] = useState<Record<string, string>>({});

  const [editingHistory, setEditingHistory] = useState<HistoryRecord | null>(null);
  const [historyErrors, setHistoryErrors] = useState<Record<string, string>>({});

  const [prescribeForm, setPrescribeForm] = useState({
    patientId: "",
    vaccineId: "",
    date: "",
    time: "",
    ghiChu: "",
  });
  const [prescribeErrors, setPrescribeErrors] = useState<Record<string, string>>({});

  const handleSelectPatient = useCallback((patient: Patient) => {
    setSelectedPatient(patient);
    setRightPaneMode("detail");
    setActiveInnerTab("profile");
    setHistoryFilter("Tất cả");
  }, []);

  // =========================================================================
  // FORMAT SĐT CHUNG
  // =========================================================================
  const formatPhone = useCallback((val: string) => {
    let raw = val.replace(/\D/g, "");
    if (raw.length > 10) raw = raw.substring(0, 10);
    if (raw.length > 6) return `${raw.slice(0, 3)} ${raw.slice(3, 6)} ${raw.slice(6)}`;
    if (raw.length > 3) return `${raw.slice(0, 3)} ${raw.slice(3)}`;
    return raw;
  }, []);

  const handleCreatePhoneChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setCreateForm((prev) => ({ ...prev, sdt: formatPhone(e.target.value) }));
    setCreateErrors((prev) => ({ ...prev, sdt: "" }));
  }, [formatPhone]);

  const handleEditProfileClick = useCallback(() => {
    if (!selectedPatient) return;
    setUpdateForm({
      id: selectedPatient.id.replace(/\D/g, ""),
      username: selectedPatient.username || "Chưa liên kết tài khoản",
      fullName: selectedPatient.fullName,
      gender: selectedPatient.gender,
      age: selectedPatient.age?.toString() || "",
      guardianName: selectedPatient.guardianName || "",
      address: selectedPatient.address,
      phone: formatPhone(selectedPatient.phone),
      cmnd: selectedPatient.cmnd || "",
      email: selectedPatient.email || "",
      matKhau: "",
    });
    setUpdateErrors({});
    setRightPaneMode("edit_profile");
  }, [selectedPatient, formatPhone]);

  const handleEditHistoryClick = useCallback((record: HistoryRecord) => {
    setEditingHistory({ ...record });
    setHistoryErrors({});
    setRightPaneMode("edit_history");
  }, []);

  const handlePrescribeClick = useCallback(() => {
    if (!selectedPatient) return;
    setPrescribeForm({ patientId: selectedPatient.id.replace(/\D/g, ""), vaccineId: "", date: "", time: "", ghiChu: "" });
    setPrescribeErrors({});
    setRightPaneMode("prescribe");
  }, [selectedPatient]);

  // =========================================================================
  // TẠO HỒ SƠ MỚI
  // =========================================================================
  const handleCreateSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};

    if (!createForm.tenDangNhap.trim()) errors.tenDangNhap = "Vui lòng nhập tên đăng nhập";
    if (!createForm.matKhau) errors.matKhau = "Vui lòng nhập mật khẩu";
    if (!createForm.hoTen.trim()) errors.hoTen = "Vui lòng nhập họ và tên";
    if (!createForm.cmnd.trim()) errors.cmnd = "Vui lòng nhập CMND/CCCD";

    if (!createForm.email.trim()) {
      errors.email = "Vui lòng nhập email";
    } else if (!/^\S+@\S+\.\S+$/.test(createForm.email)) {
      errors.email = "Email không hợp lệ";
    }

    const phoneNum = createForm.sdt.replace(/\s/g, "");
    if (!phoneNum) errors.sdt = "Vui lòng nhập SĐT";
    else if (phoneNum.length < 10) errors.sdt = "SĐT phải đủ 10 số";

    if (!createForm.ngaySinh) errors.ngaySinh = "Vui lòng chọn ngày sinh";

    if (Object.keys(errors).length > 0) {
      setCreateErrors(errors);
      triggerToast("Vui lòng kiểm tra lại thông tin bị lỗi.");
      return;
    }

    const payload = {
      ...createForm,
      sdt: phoneNum,
    };

    try {
      await axiosClient.post(`/api/medical/patients/account`, payload);

      triggerToast("Tạo hồ sơ bệnh nhân thành công!");
      setCreateForm({
        tenDangNhap: "", matKhau: "", hoTen: "", cmnd: "", noiO: "", moTa: "",
        email: "", sdt: "", ngaySinh: "", diaChi: "", nguoiGiamHo: "", gioiTinh: "Nam",
      });
      fetchPatients(true); // Force refetch sau khi tạo mới
      setActiveMainTab("list");
    } catch (error: any) {
        triggerToast(error.response?.data?.error || "Tài khoản đã tồn tại hoặc lỗi máy chủ!");
    }
  }, [createForm, fetchPatients, triggerToast]);

  // =========================================================================
  // CẬP NHẬT HỒ SƠ
  // =========================================================================
  const handleProfileSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};
    if (!updateForm.fullName.trim()) errors.fullName = "Vui lòng nhập họ và tên";
    if (!updateForm.age) errors.age = "Vui lòng nhập tuổi";
    if (!updateForm.address.trim()) errors.address = "Vui lòng nhập địa chỉ";
    if (!updateForm.cmnd.trim()) errors.cmnd = "Vui lòng nhập CMND/CCCD";
    if (!updateForm.email.trim()) errors.email = "Vui lòng nhập Email";

    const phoneNum = updateForm.phone.replace(/\s/g, "");
    if (!phoneNum) errors.phone = "Vui lòng nhập SĐT";
    else if (phoneNum.length < 10) errors.phone = "Số điện thoại phải đủ 10 số";

    if (Object.keys(errors).length > 0) {
      setUpdateErrors(errors);
      triggerToast("Vui lòng kiểm tra lại các thông tin bắt buộc.");
      return;
    }

    try {
      await axiosClient.put(`/api/medical/patients/${selectedPatient?.id}`, {
        fullName: updateForm.fullName,
        gender: updateForm.gender,
        age: parseInt(updateForm.age),
        guardianName: updateForm.guardianName,
        address: updateForm.address,
        phone: updateForm.phone,
        cmnd: updateForm.cmnd,
        email: updateForm.email,
        matKhau: updateForm.matKhau,
      });

      triggerToast("Cập nhật hồ sơ thành công!");
      const updatedPatients = await fetchPatients(true);
      if (updatedPatients && selectedPatient) {
        const freshPatient = updatedPatients.find((p: Patient) => p.id === selectedPatient.id);
        if (freshPatient) setSelectedPatient(freshPatient);
      }
      setRightPaneMode("detail");
    } catch (error: any) {
       triggerToast(error.response?.data?.error || `Lỗi cập nhật server.`);
    }
  }, [updateForm, selectedPatient, fetchPatients, triggerToast]);

  // =========================================================================
  // CẬP NHẬT LỊCH SỬ TIÊM
  // =========================================================================
  const handleHistorySubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingHistory) return;

    const errors: Record<string, string> = {};
    if (!editingHistory.date) errors.date = "Vui lòng chọn ngày tiêm/hẹn";

    if (Object.keys(errors).length > 0) {
      setHistoryErrors(errors);
      return;
    }

    if (editingHistory.status === "Đã tiêm") {
      setShowPaymentPopup(true);
      return;
    }

    try {
      await axiosClient.put(`/api/medical/history/${editingHistory.recordId}`, {
        date: editingHistory.date,
        time: editingHistory.time,
        status: editingHistory.status,
        sideEffect: editingHistory.sideEffect,
        thoiGianTacDung: editingHistory.thoiGianTacDung,
        ghiChu: editingHistory.ghiChu,
      });

      triggerToast("Cập nhật lịch sử tiêm thành công!");
      const updatedPatients = await fetchPatients(true);
      if (updatedPatients && selectedPatient) {
        const freshPatient = updatedPatients.find((p: Patient) => p.id === selectedPatient.id);
        if (freshPatient) setSelectedPatient(freshPatient);
      }
      setRightPaneMode("detail");
    } catch (error: any) {
        triggerToast(error.response?.data?.error || "Lỗi cập nhật trạng thái");
    }
  }, [editingHistory, selectedPatient, fetchPatients, triggerToast]);

  const handleProceedToVNPay = useCallback(async () => {
    try {
      const response = await axiosClient.post(`/api/payment/create`, editingHistory);
      
      if (response.data && response.data.url) {
        window.location.href = response.data.url;
      } else {
        triggerToast("Có lỗi xảy ra khi tạo link thanh toán VNPay!");
      }
    } catch (error: any) {
      triggerToast(error.response?.data?.error || "Lỗi kết nối máy chủ");
    }
  }, [editingHistory, triggerToast]);

  // =========================================================================
  // KÊ ĐƠN
  // =========================================================================
  const handlePrescribeSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};
    if (!prescribeForm.vaccineId) errors.vaccineId = "Vui lòng chọn Vắc-xin";
    if (!prescribeForm.date) errors.date = "Vui lòng chọn ngày hẹn";
    if (!prescribeForm.time) errors.time = "Vui lòng chọn giờ hẹn";

    if (Object.keys(errors).length > 0) {
      setPrescribeErrors(errors);
      return;
    }

    try {
      await axiosClient.post(`/api/medical/prescribe`, {
        patientId: parseInt(prescribeForm.patientId),
        vaccineId: parseInt(prescribeForm.vaccineId),
        date: prescribeForm.date,
        time: prescribeForm.time,
        ghiChu: prescribeForm.ghiChu,
      });

      triggerToast("Kê đơn và lên lịch thành công!");
      const updatedPatients = await fetchPatients(true);
      if (updatedPatients && selectedPatient) {
        const freshPatient = updatedPatients.find((p: Patient) => p.id === selectedPatient.id);
        if (freshPatient) setSelectedPatient(freshPatient);
      }
      setRightPaneMode("detail");
      setActiveInnerTab("history");
    } catch (error: any) {
        triggerToast(error.response?.data?.error || "Lỗi kê đơn từ server.");
    }
  }, [prescribeForm, selectedPatient, fetchPatients, triggerToast]);

  // =========================================================================
  // MEMOIZE LỊCH SỬ TIÊM CHỦNG
  // =========================================================================
  const processedHistory = useMemo(() => {
    if (!selectedPatient?.history) return { sorted: [], grouped: { "Chưa tiêm": [] as HistoryRecord[], "Bị hoãn": [] as HistoryRecord[], "Đã tiêm": [] as HistoryRecord[] } };
    
    const sorted = [...selectedPatient.history].sort((a, b) => {
      const dateA = new Date(`${a.date}T${a.time || "00:00:00"}`).getTime();
      const dateB = new Date(`${b.date}T${b.time || "00:00:00"}`).getTime();
      if (isNaN(dateA) || isNaN(dateB)) {
        return `${b.date} ${b.time || ""}`.localeCompare(`${a.date} ${a.time || ""}`);
      }
      return dateB - dateA;
    });

    const grouped = {
      "Chưa tiêm": [] as HistoryRecord[],
      "Bị hoãn": [] as HistoryRecord[],
      "Đã tiêm": [] as HistoryRecord[],
    };

    sorted.forEach((record) => {
      if (grouped[record.status as keyof typeof grouped]) {
        grouped[record.status as keyof typeof grouped].push(record);
      } else {
        grouped["Chưa tiêm"].push(record);
      }
    });

    return { sorted, grouped };
  }, [selectedPatient?.history]);


  return (
    <div className="space-y-6 animate-fade-in h-full flex flex-col">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">Quản lý bệnh án & Người dùng</h2>
        <p className="text-sm text-slate-500 mt-1">Quản lý hồ sơ, tạo mới khách hàng, kê đơn và theo dõi tiêm chủng lâm sàng.</p>
      </div>

      <div className="border-b border-slate-200 flex space-x-2 shrink-0">
        <button
          onClick={() => setActiveMainTab("list")}
          className={`px-4 py-2.5 font-medium text-sm border-b-2 transition-colors flex items-center gap-2 ${activeMainTab === "list" ? "border-blue-600 text-blue-600" : "border-transparent text-slate-500 hover:text-slate-800"}`}
        >
          <List className="w-4 h-4" /> Danh sách bệnh án
        </button>
        <button
          onClick={() => setActiveMainTab("create")}
          className={`px-4 py-2.5 font-medium text-sm border-b-2 transition-colors flex items-center gap-2 ${activeMainTab === "create" ? "border-emerald-600 text-emerald-600" : "border-transparent text-slate-500 hover:text-slate-800"}`}
        >
          <UserPlus className="w-4 h-4" /> Tạo hồ sơ Bệnh nhân mới
        </button>
      </div>

      {activeMainTab === "list" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
          <div className="lg:col-span-1 bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden flex flex-col h-[700px]">
            <div className="p-4 bg-slate-50 border-b border-slate-200 space-y-3">
              <div className="flex justify-between items-center">
                <span className="font-bold text-xs text-slate-500 uppercase tracking-wider">Danh sách Bệnh án</span>
                <span className="bg-blue-100 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded-full">{filteredPatients.length} bản ghi</span>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tìm theo ID hoặc Tên..."
                  className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-blue-100 outline-none"
                />
              </div>
            </div>
            <div className="divide-y divide-slate-100 overflow-y-auto flex-1">
              {filteredPatients.length > 0 ? (
                filteredPatients.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => handleSelectPatient(p)}
                    className={`p-4 cursor-pointer transition-colors ${selectedPatient?.id === p.id ? "bg-blue-50/70 border-l-4 border-blue-600" : "hover:bg-slate-50/50"}`}
                  >
                    <div className="flex justify-between text-xs font-mono font-bold text-slate-400 mb-1">
                      <span>#{p.id}</span>
                      <span className="text-slate-500 font-sans">{p.age} tuổi</span>
                    </div>
                    <div className="font-semibold text-slate-800 text-sm mb-1">{p.fullName}</div>
                    <div className="flex items-center text-slate-500 text-xs gap-1">
                      <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                      <span className="truncate">{p.address}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-xs text-slate-400">Không tìm thấy bệnh án nào.</div>
              )}
            </div>
          </div>

          <div className="lg:col-span-2 space-y-6 h-[700px] overflow-y-auto">
            {!selectedPatient && (
              <div className="text-center p-12 border border-dashed border-slate-200 rounded-xl text-slate-400 text-sm bg-white">
                Chọn một hồ sơ bệnh án bên trái để hiển thị chi tiết hoặc thao tác.
              </div>
            )}

            {selectedPatient && rightPaneMode === "detail" && (
              <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs relative animate-fade-in flex flex-col h-full">
                <div className="absolute top-6 right-6">
                  <button
                    onClick={handlePrescribeClick}
                    className="text-emerald-600 bg-emerald-50 hover:bg-emerald-100 px-3 py-2 flex gap-1.5 rounded-lg items-center justify-center font-bold text-xs transition-colors cursor-pointer"
                  >
                    <Pill className="w-4 h-4" /> Kê đơn
                  </button>
                </div>

                <div className="flex border-b border-slate-200 mb-5">
                  <button
                    onClick={() => setActiveInnerTab("profile")}
                    className={`pb-3 mr-6 text-sm transition-colors cursor-pointer ${activeInnerTab === "profile" ? "font-bold text-blue-600 border-b-2 border-blue-600" : "font-semibold text-slate-500 hover:text-slate-700"}`}
                  >
                    Thông tin bệnh nhân
                  </button>
                  <button
                    onClick={() => setActiveInnerTab("history")}
                    className={`pb-3 text-sm transition-colors cursor-pointer ${activeInnerTab === "history" ? "font-bold text-blue-600 border-b-2 border-blue-600" : "font-semibold text-slate-500 hover:text-slate-700"}`}
                  >
                    Lịch sử tiêm chủng
                  </button>
                </div>

                {activeInnerTab === "profile" && (
                  <div className="space-y-5 animate-fade-in">
                    <div className="border-b border-slate-100 pb-4 pr-32">
                      <span className="text-xs font-mono font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded">ID: {selectedPatient.id}</span>
                      <h3 className="text-xl font-bold text-slate-800 mt-2">{selectedPatient.fullName}</h3>
                      <p className="text-sm font-semibold text-blue-600 mt-1">
                        Giới tính: {selectedPatient.gender} | {selectedPatient.age} tuổi
                      </p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                      <div className="bg-slate-50/60 p-3 rounded-lg border border-slate-100">
                        <span className="block font-semibold text-slate-400 mb-1">👨‍👩‍👧 Người giám hộ</span>
                        <span className="font-medium text-slate-800 text-sm">{selectedPatient.guardianName || "Không có"}</span>
                      </div>
                      <div className="bg-slate-50/60 p-3 rounded-lg border border-slate-100">
                        <span className="block font-semibold text-slate-400 mb-1">📞 Điện thoại</span>
                        <span className="font-bold text-slate-800 text-sm font-mono">{selectedPatient.phone}</span>
                      </div>
                      <div className="bg-slate-50/60 p-3 rounded-lg border border-slate-100">
                        <span className="block font-semibold text-slate-400 mb-1">🪪 CMND/CCCD</span>
                        <span className="font-bold text-slate-800 text-sm font-mono">{selectedPatient.cmnd || "---"}</span>
                      </div>
                      <div className="bg-slate-50/60 p-3 rounded-lg border border-slate-100">
                        <span className="block font-semibold text-slate-400 mb-1">✉️ Email</span>
                        <span className="font-medium text-slate-800 text-sm">{selectedPatient.email || "---"}</span>
                      </div>
                      <div className="sm:col-span-2 bg-slate-50/60 p-3 rounded-lg border border-slate-100 flex items-start gap-2">
                        <MapPin className="w-4 h-4 text-slate-400 mt-0.5" />
                        <div>
                          <span className="block font-semibold text-slate-400">Địa chỉ liên lạc</span>
                          <span className="font-medium text-slate-800 text-sm">{selectedPatient.address}</span>
                        </div>
                      </div>
                    </div>
                    <div className="pt-2">
                      <button
                        onClick={handleEditProfileClick}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
                      >
                        <Edit className="w-4 h-4" /> Chỉnh sửa hồ sơ
                      </button>
                    </div>
                  </div>
                )}

                {activeInnerTab === "history" && (
                  <div className="flex flex-col flex-1 h-full animate-fade-in overflow-hidden">
                    {selectedPatient.history && selectedPatient.history.length > 0 && (
                      <div className="flex gap-2 mb-4">
                        {(["Tất cả", "Chưa tiêm", "Bị hoãn", "Đã tiêm"] as const).map((status) => (
                          <button
                            key={status}
                            onClick={() => setHistoryFilter(status)}
                            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-colors border cursor-pointer ${
                              historyFilter === status
                                ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                                : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                            }`}
                          >
                            {status}
                          </button>
                        ))}
                      </div>
                    )}

                    <div className="space-y-6 flex-1 overflow-y-auto pr-1 pb-4">
                      {selectedPatient.history && selectedPatient.history.length > 0 ? (
                        (() => {
                          const { grouped } = processedHistory;

                          const renderGroup = (title: string, records: typeof processedHistory.sorted, badgeColor: string) => {
                            if (records.length === 0) return null;
                            return (
                              <div className="space-y-3">
                                <h4 className="font-bold text-sm text-slate-700 border-b border-slate-200 pb-2 flex items-center gap-2">
                                  {title} <span className={`px-2 py-0.5 rounded-full text-[10px] ${badgeColor}`}>{records.length}</span>
                                </h4>
                                {records.map((record, idx) => (
                                  <div
                                    key={idx}
                                    className="bg-white border border-slate-200 rounded-lg p-3 shadow-sm flex flex-col gap-2 relative hover:border-blue-200 transition-colors"
                                  >
                                    <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                                      <div className="font-bold text-blue-700 text-sm flex items-center gap-1.5">
                                        <Syringe className="w-4 h-4" /> {record.vaccineName}
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <button
                                          onClick={() => handleEditHistoryClick(record)}
                                          className="text-blue-500 hover:text-blue-700 bg-blue-50 p-1.5 rounded transition-colors cursor-pointer"
                                          title="Cập nhật lịch sử"
                                        >
                                          <Edit className="w-4 h-4" />
                                        </button>
                                      </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 mt-1">
                                      <div className="flex gap-1.5 items-center">
                                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                        <span className="font-mono text-blue-700 font-bold">
                                          {record.date} {record.time ? `| ${record.time}` : ""}
                                        </span>
                                      </div>
                                      <div>
                                        <span className="font-semibold text-slate-500">Loại:</span> {record.vaccineType}
                                      </div>
                                      <div>
                                        <span className="font-semibold text-slate-500">Địa điểm:</span> {record.place}
                                      </div>
                                      <div>
                                        <span className="font-semibold text-slate-500">Trạng thái:</span>{" "}
                                        <span
                                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                            record.status === "Đã tiêm"
                                              ? "bg-emerald-100 text-emerald-700"
                                              : record.status === "Bị hoãn"
                                                ? "bg-amber-100 text-amber-700"
                                                : "bg-blue-100 text-blue-700"
                                          }`}
                                        >
                                          {record.status}
                                        </span>
                                      </div>
                                    </div>
                                    {record.ghiChu && (
                                      <div className="mt-1 p-2 bg-yellow-50/80 rounded border border-yellow-200/50 text-xs text-yellow-800 flex gap-1.5">
                                        <FileText className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-yellow-600" />
                                        <p>
                                          <span className="font-semibold text-yellow-700">Ghi chú:</span> {record.ghiChu}
                                        </p>
                                      </div>
                                    )}

                                    {record.status === "Đã tiêm" && (
                                      <div className="bg-slate-50 p-2 rounded border border-slate-100 text-xs text-slate-600 mt-1">
                                        <p>
                                          <span className="font-semibold text-slate-500">Phản ứng:</span> {record.sideEffect || "Không"}
                                        </p>
                                        <p className="mt-0.5">
                                          <span className="font-semibold text-slate-500">Hiệu lực:</span> {record.thoiGianTacDung || "---"}
                                        </p>
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            );
                          };

                          return (
                            <>
                              {(historyFilter === "Tất cả" || historyFilter === "Chưa tiêm") &&
                                renderGroup("Lịch hẹn đợt tới (Chưa tiêm)", grouped["Chưa tiêm"], "bg-blue-100 text-blue-700")}
                              {(historyFilter === "Tất cả" || historyFilter === "Bị hoãn") &&
                                renderGroup("Lịch tiêm bị hoãn", grouped["Bị hoãn"], "bg-amber-100 text-amber-700")}
                              {(historyFilter === "Tất cả" || historyFilter === "Đã tiêm") &&
                                renderGroup("Lịch sử đã tiêm", grouped["Đã tiêm"], "bg-emerald-100 text-emerald-700")}

                              {historyFilter !== "Tất cả" && grouped[historyFilter].length === 0 && (
                                <div className="text-center p-8 bg-slate-50 border border-slate-200 rounded-lg text-slate-500 text-sm">
                                  Không có bản ghi nào với trạng thái <span className="font-bold">"{historyFilter}"</span>.
                                </div>
                              )}
                            </>
                          );
                        })()
                      ) : (
                        <div className="bg-slate-50 p-8 rounded-lg border border-slate-200 text-center text-xs text-slate-400 italic mt-4">
                          Chưa ghi nhận lịch sử tiêm chủng nào.
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {selectedPatient && rightPaneMode === "edit_profile" && (
              <form
                onSubmit={handleProfileSubmit}
                noValidate
                className="bg-blue-50/20 p-6 rounded-xl border border-blue-200 space-y-5 animate-fade-in shadow-sm"
              >
                <div className="flex justify-between items-center border-b border-blue-100 pb-3">
                  <h3 className="text-base font-bold text-blue-700 flex items-center gap-2">
                    <Edit className="w-5 h-5" /> Chỉnh sửa hồ sơ bệnh nhân
                  </h3>
                  <button type="button" onClick={() => setRightPaneMode("detail")} className="text-blue-400 hover:text-blue-600 cursor-pointer">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Tên đăng nhập (Username)</label>
                    <input
                      type="text"
                      value={updateForm.username}
                      disabled
                      className="w-full bg-slate-100 text-slate-500 font-mono px-3 py-2.5 border border-slate-200 rounded-lg text-sm cursor-not-allowed outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">
                      Họ và tên <span className="text-red-500 ml-1">*</span>
                    </label>
                    <input
                      type="text"
                      value={updateForm.fullName}
                      onChange={(e) => {
                        setUpdateForm({ ...updateForm, fullName: e.target.value });
                        setUpdateErrors({ ...updateErrors, fullName: "" });
                      }}
                      className={`w-full bg-white px-3 py-2.5 border rounded-lg text-sm text-left outline-none transition-colors ${updateErrors.fullName ? "border-red-500 focus:border-red-500 bg-red-50" : "border-slate-300 focus:border-blue-500"}`}
                    />
                    {updateErrors.fullName && <p className="text-xs text-red-500 font-bold mt-1">{updateErrors.fullName}</p>}
                  </div>

                  <div className="flex gap-4">
                    <div className="w-1/3">
                      <label className="block text-sm font-semibold text-slate-700 mb-1">
                        Tuổi <span className="text-red-500 ml-1">*</span>
                      </label>
                      <input
                        type="text"
                        value={updateForm.age}
                        onChange={(e) => {
                          setUpdateForm({ ...updateForm, age: e.target.value.replace(/\D/g, "") });
                          setUpdateErrors({ ...updateErrors, age: "" });
                        }}
                        className={`w-full bg-white px-3 py-2.5 border rounded-lg text-sm text-right outline-none transition-colors ${updateErrors.age ? "border-red-500 focus:border-red-500 bg-red-50" : "border-slate-300 focus:border-blue-500"}`}
                      />
                      {updateErrors.age && <p className="text-xs text-red-500 font-bold mt-1">{updateErrors.age}</p>}
                    </div>
                    <div className="flex-1">
                      <label className="block text-sm font-semibold text-slate-700 mb-1">
                        Giới tính <span className="text-red-500 ml-1">*</span>
                      </label>
                      <select
                        value={updateForm.gender}
                        onChange={(e) => setUpdateForm({ ...updateForm, gender: e.target.value })}
                        className="w-full bg-white px-3 py-2.5 border border-slate-300 rounded-lg text-sm outline-none focus:border-blue-500 cursor-pointer"
                      >
                        <option value="Nam">Nam</option>
                        <option value="Nữ">Nữ</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">
                      CMND/CCCD <span className="text-red-500 ml-1">*</span>
                    </label>
                    <input
                      type="text"
                      value={updateForm.cmnd}
                      onChange={(e) => {
                        setUpdateForm({ ...updateForm, cmnd: e.target.value.replace(/\D/g, "") });
                        setUpdateErrors({ ...updateErrors, cmnd: "" });
                      }}
                      className={`w-full bg-white px-3 py-2.5 border rounded-lg text-sm font-mono text-left outline-none transition-colors ${updateErrors.cmnd ? "border-red-500 focus:border-red-500 bg-red-50" : "border-slate-300 focus:border-blue-500"}`}
                    />
                    {updateErrors.cmnd && <p className="text-xs text-red-500 font-bold mt-1">{updateErrors.cmnd}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">
                      Điện thoại <span className="text-red-500 ml-1">*</span>
                    </label>
                    <input
                      type="text"
                      value={updateForm.phone}
                      onChange={(e) => {
                        setUpdateForm({ ...updateForm, phone: e.target.value });
                        setUpdateErrors({ ...updateErrors, phone: "" });
                      }}
                      className={`w-full bg-white px-3 py-2.5 border rounded-lg text-sm font-mono text-left outline-none transition-colors ${updateErrors.phone ? "border-red-500 focus:border-red-500 bg-red-50" : "border-slate-300 focus:border-blue-500"}`}
                    />
                    {updateErrors.phone && <p className="text-xs text-red-500 font-bold mt-1">{updateErrors.phone}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">
                      Email <span className="text-red-500 ml-1">*</span>
                    </label>
                    <input
                      type="email"
                      value={updateForm.email}
                      onChange={(e) => {
                        setUpdateForm({ ...updateForm, email: e.target.value });
                        setUpdateErrors({ ...updateErrors, email: "" });
                      }}
                      className={`w-full bg-white px-3 py-2.5 border rounded-lg text-sm text-left outline-none transition-colors ${updateErrors.email ? "border-red-500 focus:border-red-500 bg-red-50" : "border-slate-300 focus:border-blue-500"}`}
                    />
                    {updateErrors.email && <p className="text-xs text-red-500 font-bold mt-1">{updateErrors.email}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Mật khẩu mới (Tùy chọn)</label>
                    <input
                      type="password"
                      value={updateForm.matKhau}
                      onChange={(e) => setUpdateForm({ ...updateForm, matKhau: e.target.value })}
                      placeholder="Bỏ trống nếu giữ nguyên..."
                      className="w-full bg-white px-3 py-2.5 border border-slate-300 rounded-lg text-sm outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-slate-700 mb-1">
                      Địa chỉ <span className="text-red-500 ml-1">*</span>
                    </label>
                    <input
                      type="text"
                      value={updateForm.address}
                      onChange={(e) => {
                        setUpdateForm({ ...updateForm, address: e.target.value });
                        setUpdateErrors({ ...updateErrors, address: "" });
                      }}
                      className={`w-full bg-white px-3 py-2.5 border rounded-lg text-sm text-left outline-none transition-colors ${updateErrors.address ? "border-red-500 focus:border-red-500 bg-red-50" : "border-slate-300 focus:border-blue-500"}`}
                    />
                    {updateErrors.address && <p className="text-xs text-red-500 font-bold mt-1">{updateErrors.address}</p>}
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Người giám hộ (Nếu có)</label>
                    <input
                      type="text"
                      value={updateForm.guardianName}
                      onChange={(e) => setUpdateForm({ ...updateForm, guardianName: e.target.value })}
                      className="w-full bg-white px-3 py-2.5 border border-slate-300 rounded-lg text-sm text-left outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-3 pt-5 mt-2 border-t border-blue-100">
                  <button
                    type="button"
                    onClick={() => setRightPaneMode("detail")}
                    className="px-6 py-2.5 border border-slate-300 rounded-lg text-sm font-semibold text-slate-600 bg-white hover:bg-slate-50 cursor-pointer transition-colors"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 flex items-center gap-2 cursor-pointer transition-colors shadow-sm"
                  >
                    <Save className="w-4 h-4" /> Lưu thay đổi
                  </button>
                </div>
              </form>
            )}

            {selectedPatient &&
              rightPaneMode === "edit_history" &&
              editingHistory &&
              (() => {
                const isAlreadyInjected = selectedPatient.history.find((h) => h.recordId === editingHistory.recordId)?.status === "Đã tiêm";

                return (
                  <form
                    onSubmit={handleHistorySubmit}
                    noValidate
                    className="bg-indigo-50/40 p-6 rounded-xl border border-indigo-200 space-y-5 animate-fade-in shadow-sm"
                  >
                    <div className="flex justify-between items-center border-b border-indigo-100 pb-3">
                      <h3 className="text-base font-bold text-indigo-700 flex items-center gap-2">
                        <Edit className="w-5 h-5" /> Cập nhật Lịch sử: {editingHistory.vaccineName}
                      </h3>
                      <button type="button" onClick={() => setRightPaneMode("detail")} className="text-indigo-400 hover:text-indigo-600 cursor-pointer">
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-5">
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">
                          Ngày tiêm/hẹn <span className="text-red-500 ml-1">*</span>
                        </label>
                        <input
                          type="date"
                          value={editingHistory.date}
                          disabled={isAlreadyInjected}
                          onChange={(e) => {
                            setEditingHistory({ ...editingHistory, date: e.target.value });
                            setHistoryErrors({ ...historyErrors, date: "" });
                          }}
                          className={`w-full px-3 py-2.5 border rounded-lg text-sm outline-none transition-colors ${historyErrors.date ? "border-red-500 focus:border-red-500 bg-red-50" : "border-slate-300 focus:border-indigo-500"} ${isAlreadyInjected ? "bg-slate-100 text-slate-500 cursor-not-allowed border-slate-200" : "bg-white"}`}
                        />
                        {historyErrors.date && <p className="text-xs text-red-500 font-bold mt-1">{historyErrors.date}</p>}
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">Giờ tiêm/hẹn</label>
                        <input
                          type="time"
                          value={editingHistory.time || ""}
                          disabled={isAlreadyInjected}
                          onChange={(e) => setEditingHistory({ ...editingHistory, time: e.target.value })}
                          className={`w-full px-3 py-2.5 border rounded-lg text-sm outline-none transition-colors ${isAlreadyInjected ? "bg-slate-100 text-slate-500 cursor-not-allowed border-slate-200" : "bg-white border-slate-300 focus:border-indigo-500"}`}
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                          Trạng thái <span className="text-red-500 ml-1">*</span>
                        </label>
                        <div
                          className={`flex gap-5 p-3 rounded-lg border ${isAlreadyInjected ? "bg-slate-50 border-slate-200" : "bg-white border-slate-200"}`}
                        >
                          <label
                            className={`flex items-center gap-2 text-sm font-bold ${isAlreadyInjected ? "text-slate-400 cursor-not-allowed" : "text-blue-700 cursor-pointer"}`}
                          >
                            <input
                              type="radio"
                              disabled={isAlreadyInjected}
                              checked={editingHistory.status === "Chưa tiêm"}
                              onChange={() => setEditingHistory({ ...editingHistory, status: "Chưa tiêm" })}
                              className={`w-4 h-4 accent-blue-600 ${isAlreadyInjected ? "cursor-not-allowed" : "cursor-pointer"}`}
                            />{" "}
                            Chưa tiêm
                          </label>
                          <label
                            className={`flex items-center gap-2 text-sm font-bold ${isAlreadyInjected ? "text-emerald-700 cursor-not-allowed" : "text-emerald-700 cursor-pointer"}`}
                          >
                            <input
                              type="radio"
                              disabled={isAlreadyInjected}
                              checked={editingHistory.status === "Đã tiêm"}
                              onChange={() => setEditingHistory({ ...editingHistory, status: "Đã tiêm" })}
                              className={`w-4 h-4 accent-emerald-600 ${isAlreadyInjected ? "cursor-not-allowed" : "cursor-pointer"}`}
                            />{" "}
                            Đã tiêm
                          </label>
                          <label
                            className={`flex items-center gap-2 text-sm font-bold ${isAlreadyInjected ? "text-slate-400 cursor-not-allowed" : "text-amber-700 cursor-pointer"}`}
                          >
                            <input
                              type="radio"
                              disabled={isAlreadyInjected}
                              checked={editingHistory.status === "Bị hoãn"}
                              onChange={() => setEditingHistory({ ...editingHistory, status: "Bị hoãn" })}
                              className={`w-4 h-4 accent-amber-600 ${isAlreadyInjected ? "cursor-not-allowed" : "cursor-pointer"}`}
                            />{" "}
                            Bị hoãn
                          </label>
                        </div>
                      </div>

                      <div className="col-span-2">
                        <label className="block text-sm font-semibold text-slate-700 mb-1">Ghi chú</label>
                        <textarea
                          value={editingHistory.ghiChu || ""}
                          onChange={(e) => setEditingHistory({ ...editingHistory, ghiChu: e.target.value })}
                          placeholder="Ghi chú thêm về lịch tiêm này..."
                          className="w-full bg-white px-3 py-2.5 border border-slate-300 rounded-lg text-sm outline-none transition-colors focus:border-indigo-500 min-h-[80px]"
                        />
                      </div>

                      {editingHistory.status === "Đã tiêm" && (
                        <>
                          <div className="col-span-2">
                            <label className="block text-sm font-semibold text-slate-700 mb-1">Phản ứng sau tiêm</label>
                            <input
                              type="text"
                              value={editingHistory.sideEffect}
                              onChange={(e) => setEditingHistory({ ...editingHistory, sideEffect: e.target.value })}
                              placeholder="Sốt nhẹ, sưng..."
                              className="w-full bg-white px-3 py-2.5 border border-slate-300 rounded-lg text-sm outline-none focus:border-indigo-500"
                            />
                          </div>
                          <div className="col-span-2">
                            <label className="block text-sm font-semibold text-slate-700 mb-1">Thời gian tác dụng</label>
                            <input
                              type="text"
                              value={editingHistory.thoiGianTacDung}
                              onChange={(e) => setEditingHistory({ ...editingHistory, thoiGianTacDung: e.target.value })}
                              placeholder="1 năm, 6 tháng..."
                              className="w-full bg-white px-3 py-2.5 border border-slate-300 rounded-lg text-sm outline-none focus:border-indigo-500"
                            />
                          </div>
                          {isAlreadyInjected ? (
                            <p className="col-span-2 text-xs font-bold text-blue-600 italic">
                              * Bản ghi này đã được xác nhận tiêm, bạn chỉ có thể cập nhật Phản ứng sau tiêm và Thời gian tác dụng.
                            </p>
                          ) : (
                            <p className="col-span-2 text-xs font-bold text-red-500 italic">
                              * Lưu ý: Sau khi lưu với trạng thái "Đã tiêm", thời gian và trạng thái sẽ bị khóa vĩnh viễn.
                            </p>
                          )}
                        </>
                      )}
                    </div>
                    <div className="flex justify-end gap-3 pt-5 mt-2 border-t border-indigo-100">
                      <button
                        type="button"
                        onClick={() => setRightPaneMode("detail")}
                        className="px-6 py-2.5 border border-slate-300 rounded-lg text-sm font-semibold text-slate-600 bg-white hover:bg-slate-50 cursor-pointer transition-colors"
                      >
                        Hủy bỏ
                      </button>
                      <button
                        type="submit"
                        className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 flex items-center gap-2 cursor-pointer shadow-sm transition-colors"
                      >
                        <Save className="w-4 h-4" /> Cập nhật
                      </button>
                    </div>
                  </form>
                );
              })()}

            {selectedPatient && rightPaneMode === "prescribe" && (
              <form
                onSubmit={handlePrescribeSubmit}
                noValidate
                className="bg-emerald-50/40 p-6 rounded-xl border border-emerald-200 space-y-5 animate-fade-in shadow-sm"
              >
                <div className="flex justify-between items-center border-b border-emerald-100 pb-3">
                  <h3 className="text-base font-bold text-emerald-700 flex items-center gap-2">
                    <Pill className="w-5 h-5" /> Kê đơn Vắc-xin
                  </h3>
                  <button type="button" onClick={() => setRightPaneMode("detail")} className="text-emerald-400 hover:text-emerald-600 cursor-pointer">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="space-y-5 max-w-lg">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">
                      Vắc-xin cần tiêm <span className="text-red-500 ml-1">*</span>
                    </label>
                    <select
                      value={prescribeForm.vaccineId}
                      onChange={(e) => {
                        setPrescribeForm({ ...prescribeForm, vaccineId: e.target.value });
                        setPrescribeErrors({ ...prescribeErrors, vaccineId: "" });
                      }}
                      className={`w-full bg-white px-3 py-2.5 border rounded-lg text-sm outline-none transition-colors cursor-pointer ${prescribeErrors.vaccineId ? "border-red-500 focus:border-red-500 bg-red-50" : "border-slate-300 focus:border-emerald-500"}`}
                    >
                      <option value="" disabled>
                        -- Chọn Vắc-xin --
                      </option>
                      {vaccineOptions.map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.name}
                        </option>
                      ))}
                    </select>
                    {prescribeErrors.vaccineId && <p className="text-xs text-red-500 font-bold mt-1">{prescribeErrors.vaccineId}</p>}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">
                        Ngày hẹn <span className="text-red-500 ml-1">*</span>
                      </label>
                      <input
                        type="date"
                        value={prescribeForm.date}
                        onChange={(e) => {
                          setPrescribeForm({ ...prescribeForm, date: e.target.value });
                          setPrescribeErrors({ ...prescribeErrors, date: "" });
                        }}
                        className={`w-full bg-white px-3 py-2.5 border rounded-lg text-sm outline-none transition-colors ${prescribeErrors.date ? "border-red-500 focus:border-red-500 bg-red-50" : "border-slate-300 focus:border-emerald-500"}`}
                      />
                      {prescribeErrors.date && <p className="text-xs text-red-500 font-bold mt-1">{prescribeErrors.date}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">
                        Giờ hẹn <span className="text-red-500 ml-1">*</span>
                      </label>
                      <input
                        type="time"
                        value={prescribeForm.time}
                        onChange={(e) => {
                          setPrescribeForm({ ...prescribeForm, time: e.target.value });
                          setPrescribeErrors({ ...prescribeErrors, time: "" });
                        }}
                        className={`w-full bg-white px-3 py-2.5 border rounded-lg text-sm outline-none transition-colors ${prescribeErrors.time ? "border-red-500 focus:border-red-500 bg-red-50" : "border-slate-300 focus:border-emerald-500"}`}
                      />
                      {prescribeErrors.time && <p className="text-xs text-red-500 font-bold mt-1">{prescribeErrors.time}</p>}
                    </div>

                    <div className="col-span-2">
                      <label className="block text-sm font-semibold text-slate-700 mb-1">Ghi chú (Tùy chọn)</label>
                      <textarea
                        value={prescribeForm.ghiChu}
                        onChange={(e) => setPrescribeForm({ ...prescribeForm, ghiChu: e.target.value })}
                        placeholder="Ghi chú thêm về đơn kê này..."
                        className="w-full bg-white px-3 py-2.5 border border-slate-300 rounded-lg text-sm outline-none transition-colors focus:border-emerald-500 min-h-[80px]"
                      />
                    </div>
                  </div>
                </div>
                <div className="flex justify-end gap-3 pt-5 mt-2 border-t border-emerald-100">
                  <button
                    type="button"
                    onClick={() => setRightPaneMode("detail")}
                    className="px-6 py-2.5 border border-slate-300 rounded-lg text-sm font-semibold text-slate-600 bg-white hover:bg-slate-50 cursor-pointer transition-colors"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-emerald-600 text-white rounded-lg text-sm font-semibold hover:bg-emerald-700 flex items-center gap-2 cursor-pointer shadow-sm transition-colors"
                  >
                    <Save className="w-4 h-4" /> Kê đơn mới
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ================================= TẠO HỒ SƠ ================================= */}
      {activeMainTab === "create" && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 max-w-4xl animate-fade-in">
          <div className="flex justify-between items-center border-b border-slate-200 pb-4 mb-6">
            <div>
              <h3 className="text-lg font-bold text-emerald-700 flex items-center gap-2">
                <UserPlus className="w-5 h-5" /> Đăng ký Hồ sơ Bệnh nhân
              </h3>
              <p className="text-xs text-slate-500 mt-1">Tài khoản này sẽ tự động được gán quyền Khách hàng (Bệnh nhân).</p>
            </div>
            <button type="button" onClick={() => setActiveMainTab("list")} className="text-slate-400 hover:text-slate-600 cursor-pointer">
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleCreateSubmit} noValidate>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* CỘT TRÁI - THÔNG TIN TÀI KHOẢN */}
              <div className="space-y-4">
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 mb-2">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Thông tin tài khoản</span>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">
                    Tên đăng nhập <span className="text-red-500 ml-1">*</span>
                  </label>
                  <input
                    type="text"
                    value={createForm.tenDangNhap}
                    onChange={(e) => {
                      setCreateForm({ ...createForm, tenDangNhap: e.target.value });
                      setCreateErrors({ ...createErrors, tenDangNhap: "" });
                    }}
                    className={`w-full bg-white px-3 py-2.5 border rounded-lg text-sm outline-none transition-colors ${createErrors.tenDangNhap ? "border-red-500 focus:border-red-500 bg-red-50" : "border-slate-300 focus:border-emerald-500"}`}
                  />
                  {createErrors.tenDangNhap && <p className="text-xs text-red-500 font-bold mt-1">{createErrors.tenDangNhap}</p>}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">
                    Mật khẩu <span className="text-red-500 ml-1">*</span>
                  </label>
                  <input
                    type="password"
                    value={createForm.matKhau}
                    onChange={(e) => {
                      setCreateForm({ ...createForm, matKhau: e.target.value });
                      setCreateErrors({ ...createErrors, matKhau: "" });
                    }}
                    className={`w-full bg-white px-3 py-2.5 border rounded-lg text-sm outline-none transition-colors ${createErrors.matKhau ? "border-red-500 focus:border-red-500 bg-red-50" : "border-slate-300 focus:border-emerald-500"}`}
                  />
                  {createErrors.matKhau && <p className="text-xs text-red-500 font-bold mt-1">{createErrors.matKhau}</p>}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">
                    Email <span className="text-red-500 ml-1">*</span>
                  </label>
                  <input
                    type="email"
                    value={createForm.email}
                    onChange={(e) => {
                      setCreateForm({ ...createForm, email: e.target.value });
                      setCreateErrors({ ...createErrors, email: "" });
                    }}
                    className={`w-full bg-white px-3 py-2.5 border rounded-lg text-sm outline-none transition-colors ${createErrors.email ? "border-red-500 focus:border-red-500 bg-red-50" : "border-slate-300 focus:border-emerald-500"}`}
                  />
                  {createErrors.email && <p className="text-xs text-red-500 font-bold mt-1">{createErrors.email}</p>}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">
                    CMND/CCCD <span className="text-red-500 ml-1">*</span>
                  </label>
                  <input
                    type="text"
                    value={createForm.cmnd}
                    onChange={(e) => {
                      setCreateForm({ ...createForm, cmnd: e.target.value.replace(/\D/g, "") });
                      setCreateErrors({ ...createErrors, cmnd: "" });
                    }}
                    className={`w-full bg-white px-3 py-2.5 border rounded-lg text-sm font-mono outline-none transition-colors ${createErrors.cmnd ? "border-red-500 focus:border-red-500 bg-red-50" : "border-slate-300 focus:border-emerald-500"}`}
                  />
                  {createErrors.cmnd && <p className="text-xs text-red-500 font-bold mt-1">{createErrors.cmnd}</p>}
                </div>
              </div>

              {/* CỘT PHẢI - THÔNG TIN CÁ NHÂN */}
              <div className="space-y-4">
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 mb-2">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Thông tin cá nhân (Bệnh nhân)</span>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">
                    Họ và tên <span className="text-red-500 ml-1">*</span>
                  </label>
                  <input
                    type="text"
                    value={createForm.hoTen}
                    onChange={(e) => {
                      setCreateForm({ ...createForm, hoTen: e.target.value });
                      setCreateErrors({ ...createErrors, hoTen: "" });
                    }}
                    className={`w-full bg-white px-3 py-2.5 border rounded-lg text-sm outline-none transition-colors ${createErrors.hoTen ? "border-red-500 focus:border-red-500 bg-red-50" : "border-slate-300 focus:border-emerald-500"}`}
                  />
                  {createErrors.hoTen && <p className="text-xs text-red-500 font-bold mt-1">{createErrors.hoTen}</p>}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">
                      Ngày sinh <span className="text-red-500 ml-1">*</span>
                    </label>
                    <input
                      type="date"
                      value={createForm.ngaySinh}
                      onChange={(e) => {
                        setCreateForm({ ...createForm, ngaySinh: e.target.value });
                        setCreateErrors({ ...createErrors, ngaySinh: "" });
                      }}
                      className={`w-full bg-white px-3 py-2.5 border rounded-lg text-sm outline-none transition-colors ${createErrors.ngaySinh ? "border-red-500 focus:border-red-500 bg-red-50" : "border-slate-300 focus:border-emerald-500"}`}
                    />
                    {createErrors.ngaySinh && <p className="text-xs text-red-500 font-bold mt-1">{createErrors.ngaySinh}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">
                      Giới tính <span className="text-red-500 ml-1">*</span>
                    </label>
                    <select
                      value={createForm.gioiTinh}
                      onChange={(e) => setCreateForm({ ...createForm, gioiTinh: e.target.value })}
                      className="w-full bg-white px-3 py-2.5 border border-slate-300 rounded-lg text-sm outline-none focus:border-emerald-500 cursor-pointer"
                    >
                      <option value="Nam">Nam</option>
                      <option value="Nữ">Nữ</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">
                    Điện thoại liên hệ <span className="text-red-500 ml-1">*</span>
                  </label>
                  <input
                    type="text"
                    value={createForm.sdt}
                    onChange={handleCreatePhoneChange}
                    placeholder="090 123 4567"
                    className={`w-full bg-white px-3 py-2.5 border rounded-lg text-sm font-mono outline-none transition-colors ${createErrors.sdt ? "border-red-500 focus:border-red-500 bg-red-50" : "border-slate-300 focus:border-emerald-500"}`}
                  />
                  {createErrors.sdt && <p className="text-xs text-red-500 font-bold mt-1">{createErrors.sdt}</p>}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Địa chỉ thường trú</label>
                  <input
                    type="text"
                    value={createForm.diaChi}
                    onChange={(e) => setCreateForm({ ...createForm, diaChi: e.target.value })}
                    className="w-full bg-white px-3 py-2.5 border border-slate-300 rounded-lg text-sm outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Người giám hộ (Nếu trẻ em)</label>
                  <input
                    type="text"
                    value={createForm.nguoiGiamHo}
                    onChange={(e) => setCreateForm({ ...createForm, nguoiGiamHo: e.target.value })}
                    className="w-full bg-white px-3 py-2.5 border border-slate-300 rounded-lg text-sm outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-6 mt-6 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setActiveMainTab("list")}
                className="px-6 py-2.5 border border-slate-300 rounded-lg text-sm font-semibold text-slate-600 bg-white hover:bg-slate-50 cursor-pointer transition-colors"
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 bg-emerald-600 text-white rounded-lg text-sm font-semibold hover:bg-emerald-700 flex items-center gap-2 cursor-pointer transition-colors shadow-sm"
              >
                <Save className="w-4 h-4" /> Lưu & Đăng ký hồ sơ
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ================================= POPUP THANH TOÁN VNPAY ================================= */}
      {showPaymentPopup && editingHistory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-slide-up">
            <div className="bg-blue-600 p-5 text-center">
              <h3 className="text-xl font-bold text-white">Xác nhận thanh toán</h3>
              <p className="text-blue-100 text-sm mt-1">Vắc-xin: {editingHistory.vaccineName}</p>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-lg text-sm font-medium">
                <p>Hệ thống sẽ lưu hồ sơ bệnh án và tạo hóa đơn sau khi quá trình thanh toán hoàn tất.</p>
              </div>

              <div className="flex flex-col gap-3 pt-2">
                <button
                  onClick={handleProceedToVNPay}
                  className="w-full py-3.5 bg-[#005BAA] hover:bg-[#004A8C] text-white font-bold rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                >
                  <p  className="h-5" />
                  Thanh toán qua VNPay
                </button>
                <button
                  onClick={() => setShowPaymentPopup(false)}
                  className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl transition-all cursor-pointer"
                >
                  Hủy bỏ
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}