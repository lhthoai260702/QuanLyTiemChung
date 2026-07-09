import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Edit, Save, MapPin, Calendar, Syringe, Pill, X } from "lucide-react";

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
  username?: string; // Tên đăng nhập từ hệ thống
  history: HistoryRecord[];
}

interface MedicalModuleProps {
  patients: Patient[];
  setPatients: React.Dispatch<React.SetStateAction<Patient[]>>;
  vaccines: any[];
  triggerToast: (msg: string) => void;
}

export default function MedicalModule({ patients, setPatients, triggerToast }: MedicalModuleProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [vaccineOptions, setVaccineOptions] = useState<{ id: number; name: string }[]>([]);
  
  const [rightPaneMode, setRightPaneMode] = useState<"detail" | "edit_profile" | "edit_history" | "prescribe">("detail");
  const [activeInnerTab, setActiveInnerTab] = useState<"profile" | "history">("profile");

  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      triggerToast("Bạn chưa đăng nhập hoặc phiên làm việc đã hết hạn!");
      navigate("/");
    }
  }, [navigate, triggerToast]);

  const fetchWithAuth = async (url: string, options: RequestInit = {}) => {
    const token = localStorage.getItem("token");
    const headers = {
      ...options.headers,
      Authorization: `Bearer ${token}`,
    };
    const response = await fetch(url, { ...options, headers });
    if (response.status === 401 || response.status === 403) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      navigate("/");
      triggerToast("Phiên đăng nhập đã hết hạn hoặc bạn không có quyền. Vui lòng đăng nhập lại!");
      return Promise.reject("Unauthorized");
    }
    return response;
  };

  const fetchPatients = async () => {
    try {
      const response = await fetchWithAuth(`${import.meta.env.VITE_API_BASE_URL}/api/medical/patients`);
      if (response.ok) {
        const data = await response.json();
        setPatients(data);
        return data;
      } else {
        triggerToast("Lỗi: Không thể lấy dữ liệu hồ sơ bệnh án!");
      }
    } catch (error) {
      if (error !== "Unauthorized") triggerToast("Không thể kết nối đến Máy chủ Backend!");
    }
    return null;
  };

  const fetchVaccinesForCombobox = async () => {
    try {
      const response = await fetchWithAuth(`${import.meta.env.VITE_API_BASE_URL}/api/medical/vaccines`);
      if (response.ok) setVaccineOptions(await response.json());
    } catch (error) {}
  };

  useEffect(() => {
    fetchPatients();
    fetchVaccinesForCombobox();
  }, []);

  const filteredPatients = patients.filter((p) => p.id.includes(searchQuery) || p.fullName.toLowerCase().includes(searchQuery.toLowerCase()));

  useEffect(() => {
    if (filteredPatients.length > 0 && !selectedPatient) {
      handleSelectPatient(filteredPatients[0]);
    }
  }, [filteredPatients, selectedPatient]);

  // --- STATE FOR PROFILE EDIT ---
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
    matKhau: ""
  });
  const [updateErrors, setUpdateErrors] = useState<Record<string, string>>({});

  // --- STATE FOR HISTORY EDIT ---
  const [editingHistory, setEditingHistory] = useState<HistoryRecord | null>(null);
  const [historyErrors, setHistoryErrors] = useState<Record<string, string>>({});

  // --- STATE FOR PRESCRIBE ---
  const [prescribeForm, setPrescribeForm] = useState({
    patientId: "",
    vaccineId: "",
    date: "",
    time: "",
  });
  const [prescribeErrors, setPrescribeErrors] = useState<Record<string, string>>({});

  const handleSelectPatient = (patient: Patient) => {
    setSelectedPatient(patient);
    setRightPaneMode("detail");
    setActiveInnerTab("profile");
  };

  const handleEditProfileClick = () => {
    if (!selectedPatient) return;
    let formattedPhone = selectedPatient.phone.replace(/\D/g, "");
    if (formattedPhone.length > 3 && formattedPhone.length <= 6) {
      formattedPhone = `${formattedPhone.slice(0, 3)} ${formattedPhone.slice(3)}`;
    } else if (formattedPhone.length > 6) {
      formattedPhone = `${formattedPhone.slice(0, 3)} ${formattedPhone.slice(3, 6)} ${formattedPhone.slice(6)}`;
    }
    setUpdateForm({
      id: selectedPatient.id.replace(/\D/g, ""),
      username: selectedPatient.username || "Chưa liên kết tài khoản",
      fullName: selectedPatient.fullName,
      gender: selectedPatient.gender,
      age: selectedPatient.age?.toString() || "",
      guardianName: selectedPatient.guardianName || "",
      address: selectedPatient.address,
      phone: formattedPhone,
      cmnd: selectedPatient.cmnd || "",
      email: selectedPatient.email || "",
      matKhau: "",
    });
    setUpdateErrors({});
    setRightPaneMode("edit_profile");
  };

  const handleEditHistoryClick = (record: HistoryRecord) => {
    setEditingHistory({ ...record });
    setHistoryErrors({});
    setRightPaneMode("edit_history");
  };

  const handlePrescribeClick = () => {
    if (!selectedPatient) return;
    setPrescribeForm({ patientId: selectedPatient.id.replace(/\D/g, ""), vaccineId: "", date: "", time: "" });
    setPrescribeErrors({});
    setRightPaneMode("prescribe");
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
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
      const response = await fetchWithAuth(`${import.meta.env.VITE_API_BASE_URL}/api/medical/patients/${selectedPatient?.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: updateForm.fullName,
          gender: updateForm.gender,
          age: parseInt(updateForm.age),
          guardianName: updateForm.guardianName,
          address: updateForm.address,
          phone: updateForm.phone,
          cmnd: updateForm.cmnd,
          email: updateForm.email,
          matKhau: updateForm.matKhau
        }),
      });

      if (response.ok) {
        triggerToast("Cập nhật hồ sơ thành công!");
        const updatedPatients = await fetchPatients();
        if (updatedPatients && selectedPatient) {
          const freshPatient = updatedPatients.find((p: Patient) => p.id === selectedPatient.id);
          if (freshPatient) setSelectedPatient(freshPatient);
        }
        setRightPaneMode("detail");
      } else triggerToast(`Lỗi cập nhật server.`);
    } catch (error) {}
  };

  const handleHistorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingHistory) return;

    const errors: Record<string, string> = {};
    if (!editingHistory.date) errors.date = "Vui lòng chọn ngày tiêm/hẹn";

    if (Object.keys(errors).length > 0) {
      setHistoryErrors(errors);
      return;
    }

    try {
      const response = await fetchWithAuth(`${import.meta.env.VITE_API_BASE_URL}/api/medical/history/${editingHistory.recordId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: editingHistory.date,
          time: editingHistory.time,
          status: editingHistory.status,
          sideEffect: editingHistory.sideEffect,
          thoiGianTacDung: editingHistory.thoiGianTacDung
        }),
      });

      if (response.ok) {
        triggerToast("Cập nhật lịch sử tiêm thành công!");
        const updatedPatients = await fetchPatients();
        if (updatedPatients && selectedPatient) {
          const freshPatient = updatedPatients.find((p: Patient) => p.id === selectedPatient.id);
          if (freshPatient) setSelectedPatient(freshPatient);
        }
        setRightPaneMode("detail");
      } else {
        const errorText = await response.text();
        triggerToast(errorText);
      }
    } catch (error) {}
  };

  const handlePrescribeSubmit = async (e: React.FormEvent) => {
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
      const response = await fetchWithAuth(`${import.meta.env.VITE_API_BASE_URL}/api/medical/prescribe`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId: parseInt(prescribeForm.patientId),
          vaccineId: parseInt(prescribeForm.vaccineId),
          date: prescribeForm.date,
          time: prescribeForm.time,
        }),
      });

      if (response.ok) {
        triggerToast("Kê đơn và lên lịch thành công!");
        const updatedPatients = await fetchPatients();
        if (updatedPatients && selectedPatient) {
          const freshPatient = updatedPatients.find((p: Patient) => p.id === selectedPatient.id);
          if (freshPatient) setSelectedPatient(freshPatient);
        }
        setRightPaneMode("detail");
        setActiveInnerTab("history");
      } else {
        triggerToast("Lỗi kê đơn từ server.");
      }
    } catch (error) {}
  };

  return (
    <div className="space-y-6 animate-fade-in h-full flex flex-col">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">Quản lý bệnh án</h2>
        <p className="text-sm text-slate-500 mt-1">Quản lý hồ sơ bệnh án, kê đơn và theo dõi tiêm chủng lâm sàng.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
        {/* CỘT TRÁI - DANH SÁCH */}
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

        {/* CỘT PHẢI - CHI TIẾT / EDIT */}
        <div className="lg:col-span-2 space-y-6 h-[700px] overflow-y-auto">
          {!selectedPatient && (
            <div className="text-center p-12 border border-dashed border-slate-200 rounded-xl text-slate-400 text-sm bg-white">
              Chọn một hồ sơ bệnh án bên trái để hiển thị chi tiết hoặc thao tác.
            </div>
          )}

          {/* CHẾ ĐỘ HIỂN THỊ CHI TIẾT */}
          {selectedPatient && rightPaneMode === "detail" && (
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs relative animate-fade-in flex flex-col h-full">
              <div className="absolute top-6 right-6">
                <button
                  onClick={handlePrescribeClick}
                  className="text-emerald-600 bg-emerald-50 hover:bg-emerald-100 px-3 py-2 flex gap-1.5 rounded-lg items-center justify-center font-bold text-xs transition-colors"
                >
                  <Pill className="w-4 h-4" /> Kê đơn
                </button>
              </div>

              <div className="flex border-b border-slate-200 mb-5">
                <button
                  onClick={() => setActiveInnerTab("profile")}
                  className={`pb-3 mr-6 text-sm transition-colors ${activeInnerTab === "profile" ? "font-bold text-blue-600 border-b-2 border-blue-600" : "font-semibold text-slate-500 hover:text-slate-700"}`}
                >
                  Thông tin bệnh nhân
                </button>
                <button
                  onClick={() => setActiveInnerTab("history")}
                  className={`pb-3 text-sm transition-colors ${activeInnerTab === "history" ? "font-bold text-blue-600 border-b-2 border-blue-600" : "font-semibold text-slate-500 hover:text-slate-700"}`}
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
                      className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5"
                    >
                      <Edit className="w-4 h-4" /> Chỉnh sửa hồ sơ
                    </button>
                  </div>
                </div>
              )}

              {activeInnerTab === "history" && (
                <div className="space-y-3 animate-fade-in flex-1 overflow-y-auto pr-1">
                  {selectedPatient.history && selectedPatient.history.length > 0 ? (
                    selectedPatient.history.map((record, idx) => (
                      <div key={idx} className="bg-white border border-slate-200 rounded-lg p-3 shadow-sm flex flex-col gap-2 relative">
                        <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                          <div className="font-bold text-blue-700 text-sm flex items-center gap-1.5">
                            <Syringe className="w-4 h-4" /> {record.vaccineName}
                          </div>
                          <div className="flex items-center gap-2">
                            <button onClick={() => handleEditHistoryClick(record)} className="text-blue-500 hover:text-blue-700 bg-blue-50 p-1.5 rounded transition-colors">
                              <Edit className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 mt-1">
                          <div className="flex gap-1.5 items-center">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            <span className="font-mono">{record.date} {record.time ? `| ${record.time}` : ""}</span>
                          </div>
                          <div>
                            <span className="font-semibold text-slate-500">Loại:</span> {record.vaccineType}
                          </div>
                          <div>
                            <span className="font-semibold text-slate-500">Địa điểm:</span> {record.place}
                          </div>
                          <div>
                            <span className="font-semibold text-slate-500">Trạng thái:</span>{" "}
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              record.status === "Đã tiêm" ? "bg-emerald-100 text-emerald-700" :
                              record.status === "Bị hoãn" ? "bg-amber-100 text-amber-700" :
                              "bg-blue-100 text-blue-700"
                            }`}>
                              {record.status}
                            </span>
                          </div>
                        </div>
                        {record.status === "Đã tiêm" && (
                          <div className="bg-slate-50 p-2 rounded border border-slate-100 text-xs text-slate-600 mt-1">
                            <p><span className="font-semibold text-slate-500">Phản ứng:</span> {record.sideEffect || "Không"}</p>
                            <p className="mt-0.5"><span className="font-semibold text-slate-500">Hiệu lực:</span> {record.thoiGianTacDung || "---"}</p>
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="bg-slate-50 p-8 rounded-lg border border-slate-200 text-center text-xs text-slate-400 italic">
                      Chưa ghi nhận lịch sử tiêm chủng nào.
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* FORM: EDIT PROFILE */}
          {selectedPatient && rightPaneMode === "edit_profile" && (
            <form onSubmit={handleProfileSubmit} noValidate className="bg-blue-50/20 p-6 rounded-xl border border-blue-200 space-y-5 animate-fade-in shadow-sm">
              <div className="flex justify-between items-center border-b border-blue-100 pb-3">
                <h3 className="text-base font-bold text-blue-700 flex items-center gap-2"><Edit className="w-5 h-5" /> Chỉnh sửa hồ sơ bệnh nhân</h3>
                <button type="button" onClick={() => setRightPaneMode("detail")} className="text-blue-400 hover:text-blue-600"><X className="w-5 h-5" /></button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                
                {/* User Name */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Tên đăng nhập (Username)</label>
                  <input type="text" value={updateForm.username} disabled className="w-full bg-slate-100 text-slate-500 font-mono px-3 py-2.5 border border-slate-200 rounded-lg text-sm cursor-not-allowed outline-none" />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Họ và tên <span className="text-red-500 ml-1">*</span></label>
                  <input type="text" value={updateForm.fullName} onChange={(e) => { setUpdateForm({ ...updateForm, fullName: e.target.value }); setUpdateErrors({ ...updateErrors, fullName: "" }); }} className={`w-full bg-white px-3 py-2.5 border rounded-lg text-sm text-left outline-none transition-colors ${updateErrors.fullName ? "border-red-500 focus:border-red-500 bg-red-50" : "border-slate-300 focus:border-blue-500"}`} />
                  {updateErrors.fullName && <p className="text-xs text-red-500 font-bold mt-1">{updateErrors.fullName}</p>}
                </div>
                
                <div className="flex gap-4">
                  <div className="w-1/3">
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Tuổi <span className="text-red-500 ml-1">*</span></label>
                    <input type="text" value={updateForm.age} onChange={(e) => { setUpdateForm({ ...updateForm, age: e.target.value.replace(/\D/g, "") }); setUpdateErrors({ ...updateErrors, age: "" }); }} className={`w-full bg-white px-3 py-2.5 border rounded-lg text-sm text-right outline-none transition-colors ${updateErrors.age ? "border-red-500 focus:border-red-500 bg-red-50" : "border-slate-300 focus:border-blue-500"}`} />
                    {updateErrors.age && <p className="text-xs text-red-500 font-bold mt-1">{updateErrors.age}</p>}
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Giới tính <span className="text-red-500 ml-1">*</span></label>
                    <select value={updateForm.gender} onChange={(e) => setUpdateForm({ ...updateForm, gender: e.target.value })} className="w-full bg-white px-3 py-2.5 border border-slate-300 rounded-lg text-sm outline-none focus:border-blue-500 cursor-pointer">
                      <option value="Nam">Nam</option><option value="Nữ">Nữ</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">CMND/CCCD <span className="text-red-500 ml-1">*</span></label>
                  <input type="text" value={updateForm.cmnd} onChange={(e) => { setUpdateForm({ ...updateForm, cmnd: e.target.value.replace(/\D/g, "") }); setUpdateErrors({ ...updateErrors, cmnd: "" }); }} className={`w-full bg-white px-3 py-2.5 border rounded-lg text-sm font-mono text-left outline-none transition-colors ${updateErrors.cmnd ? "border-red-500 focus:border-red-500 bg-red-50" : "border-slate-300 focus:border-blue-500"}`} />
                  {updateErrors.cmnd && <p className="text-xs text-red-500 font-bold mt-1">{updateErrors.cmnd}</p>}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Điện thoại <span className="text-red-500 ml-1">*</span></label>
                  <input type="text" value={updateForm.phone} onChange={(e) => { setUpdateForm({ ...updateForm, phone: e.target.value }); setUpdateErrors({ ...updateErrors, phone: "" }); }} className={`w-full bg-white px-3 py-2.5 border rounded-lg text-sm font-mono text-left outline-none transition-colors ${updateErrors.phone ? "border-red-500 focus:border-red-500 bg-red-50" : "border-slate-300 focus:border-blue-500"}`} />
                  {updateErrors.phone && <p className="text-xs text-red-500 font-bold mt-1">{updateErrors.phone}</p>}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Email <span className="text-red-500 ml-1">*</span></label>
                  <input type="email" value={updateForm.email} onChange={(e) => { setUpdateForm({ ...updateForm, email: e.target.value }); setUpdateErrors({ ...updateErrors, email: "" }); }} className={`w-full bg-white px-3 py-2.5 border rounded-lg text-sm text-left outline-none transition-colors ${updateErrors.email ? "border-red-500 focus:border-red-500 bg-red-50" : "border-slate-300 focus:border-blue-500"}`} />
                  {updateErrors.email && <p className="text-xs text-red-500 font-bold mt-1">{updateErrors.email}</p>}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Mật khẩu mới (Tùy chọn)</label>
                  <input type="password" value={updateForm.matKhau} onChange={(e) => setUpdateForm({ ...updateForm, matKhau: e.target.value })} placeholder="Bỏ trống nếu giữ nguyên..." className="w-full bg-white px-3 py-2.5 border border-slate-300 rounded-lg text-sm outline-none focus:border-blue-500" />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Địa chỉ <span className="text-red-500 ml-1">*</span></label>
                  <input type="text" value={updateForm.address} onChange={(e) => { setUpdateForm({ ...updateForm, address: e.target.value }); setUpdateErrors({ ...updateErrors, address: "" }); }} className={`w-full bg-white px-3 py-2.5 border rounded-lg text-sm text-left outline-none transition-colors ${updateErrors.address ? "border-red-500 focus:border-red-500 bg-red-50" : "border-slate-300 focus:border-blue-500"}`} />
                  {updateErrors.address && <p className="text-xs text-red-500 font-bold mt-1">{updateErrors.address}</p>}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Người giám hộ (Nếu có)</label>
                  <input type="text" value={updateForm.guardianName} onChange={(e) => setUpdateForm({ ...updateForm, guardianName: e.target.value })} className="w-full bg-white px-3 py-2.5 border border-slate-300 rounded-lg text-sm text-left outline-none focus:border-blue-500" />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-5 mt-2 border-t border-blue-100">
                <button type="button" onClick={() => setRightPaneMode("detail")} className="px-6 py-2.5 border border-slate-300 rounded-lg text-sm font-semibold text-slate-600 bg-white hover:bg-slate-50 cursor-pointer transition-colors">Hủy bỏ</button>
                <button type="submit" className="px-6 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 flex items-center gap-2 cursor-pointer transition-colors shadow-sm"><Save className="w-4 h-4"/> Lưu thay đổi</button>
              </div>
            </form>
          )}

          {/* FORM: EDIT HISTORY RECORD */}
          {selectedPatient && rightPaneMode === "edit_history" && editingHistory && (() => {
            // Xác định xem lịch sử đã lưu dưới DB là "Đã tiêm" chưa
            const isAlreadyInjected = selectedPatient.history.find(h => h.recordId === editingHistory.recordId)?.status === "Đã tiêm";

            return (
              <form onSubmit={handleHistorySubmit} noValidate className="bg-indigo-50/40 p-6 rounded-xl border border-indigo-200 space-y-5 animate-fade-in shadow-sm">
                <div className="flex justify-between items-center border-b border-indigo-100 pb-3">
                  <h3 className="text-base font-bold text-indigo-700 flex items-center gap-2"><Edit className="w-5 h-5" /> Cập nhật Lịch sử: {editingHistory.vaccineName}</h3>
                  <button type="button" onClick={() => setRightPaneMode("detail")} className="text-indigo-400 hover:text-indigo-600"><X className="w-5 h-5" /></button>
                </div>
                <div className="grid grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Ngày tiêm/hẹn <span className="text-red-500 ml-1">*</span></label>
                    <input 
                      type="date" 
                      value={editingHistory.date} 
                      disabled={isAlreadyInjected}
                      onChange={(e) => { setEditingHistory({...editingHistory, date: e.target.value}); setHistoryErrors({...historyErrors, date: ""}); }} 
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
                      onChange={(e) => setEditingHistory({...editingHistory, time: e.target.value})} 
                      className={`w-full px-3 py-2.5 border rounded-lg text-sm outline-none transition-colors ${isAlreadyInjected ? "bg-slate-100 text-slate-500 cursor-not-allowed border-slate-200" : "bg-white border-slate-300 focus:border-indigo-500"}`} 
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Trạng thái <span className="text-red-500 ml-1">*</span></label>
                    <div className={`flex gap-5 p-3 rounded-lg border ${isAlreadyInjected ? "bg-slate-50 border-slate-200" : "bg-white border-slate-200"}`}>
                      <label className={`flex items-center gap-2 text-sm font-bold ${isAlreadyInjected ? "text-slate-400 cursor-not-allowed" : "text-blue-700 cursor-pointer"}`}>
                        <input type="radio" disabled={isAlreadyInjected} checked={editingHistory.status === "Chưa tiêm"} onChange={() => setEditingHistory({...editingHistory, status: "Chưa tiêm"})} className={`w-4 h-4 accent-blue-600 ${isAlreadyInjected ? "cursor-not-allowed" : "cursor-pointer"}`} /> Chưa tiêm
                      </label>
                      <label className={`flex items-center gap-2 text-sm font-bold ${isAlreadyInjected ? "text-emerald-700 cursor-not-allowed" : "text-emerald-700 cursor-pointer"}`}>
                        <input type="radio" disabled={isAlreadyInjected} checked={editingHistory.status === "Đã tiêm"} onChange={() => setEditingHistory({...editingHistory, status: "Đã tiêm"})} className={`w-4 h-4 accent-emerald-600 ${isAlreadyInjected ? "cursor-not-allowed" : "cursor-pointer"}`} /> Đã tiêm
                      </label>
                      <label className={`flex items-center gap-2 text-sm font-bold ${isAlreadyInjected ? "text-slate-400 cursor-not-allowed" : "text-amber-700 cursor-pointer"}`}>
                        <input type="radio" disabled={isAlreadyInjected} checked={editingHistory.status === "Bị hoãn"} onChange={() => setEditingHistory({...editingHistory, status: "Bị hoãn"})} className={`w-4 h-4 accent-amber-600 ${isAlreadyInjected ? "cursor-not-allowed" : "cursor-pointer"}`} /> Bị hoãn
                      </label>
                    </div>
                  </div>
                  
                  {editingHistory.status === "Đã tiêm" && (
                    <>
                      <div className="col-span-2">
                        <label className="block text-sm font-semibold text-slate-700 mb-1">Phản ứng sau tiêm</label>
                        <input type="text" value={editingHistory.sideEffect} onChange={(e) => setEditingHistory({...editingHistory, sideEffect: e.target.value})} placeholder="Sốt nhẹ, sưng..." className="w-full bg-white px-3 py-2.5 border border-slate-300 rounded-lg text-sm outline-none focus:border-indigo-500" />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-sm font-semibold text-slate-700 mb-1">Thời gian tác dụng</label>
                        <input type="text" value={editingHistory.thoiGianTacDung} onChange={(e) => setEditingHistory({...editingHistory, thoiGianTacDung: e.target.value})} placeholder="1 năm, 6 tháng..." className="w-full bg-white px-3 py-2.5 border border-slate-300 rounded-lg text-sm outline-none focus:border-indigo-500" />
                      </div>
                      {isAlreadyInjected ? (
                        <p className="col-span-2 text-xs font-bold text-blue-600 italic">* Bản ghi này đã được xác nhận tiêm, bạn chỉ có thể cập nhật Phản ứng sau tiêm và Thời gian tác dụng.</p>
                      ) : (
                        <p className="col-span-2 text-xs font-bold text-red-500 italic">* Lưu ý: Sau khi lưu với trạng thái "Đã tiêm", thời gian và trạng thái sẽ bị khóa vĩnh viễn.</p>
                      )}
                    </>
                  )}
                </div>
                <div className="flex justify-end gap-3 pt-5 mt-2 border-t border-indigo-100">
                  <button type="button" onClick={() => setRightPaneMode("detail")} className="px-6 py-2.5 border border-slate-300 rounded-lg text-sm font-semibold text-slate-600 bg-white hover:bg-slate-50 cursor-pointer transition-colors">Hủy bỏ</button>
                  <button type="submit" className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 flex items-center gap-2 cursor-pointer shadow-sm transition-colors"><Save className="w-4 h-4"/> Cập nhật</button>
                </div>
              </form>
            );
          })()}

          {/* FORM: PRESCRIBE */}
          {selectedPatient && rightPaneMode === "prescribe" && (
            <form onSubmit={handlePrescribeSubmit} noValidate className="bg-emerald-50/40 p-6 rounded-xl border border-emerald-200 space-y-5 animate-fade-in shadow-sm">
              <div className="flex justify-between items-center border-b border-emerald-100 pb-3">
                <h3 className="text-base font-bold text-emerald-700 flex items-center gap-2"><Pill className="w-5 h-5" /> Kê đơn Vắc-xin</h3>
                <button type="button" onClick={() => setRightPaneMode("detail")} className="text-emerald-400 hover:text-emerald-600"><X className="w-5 h-5" /></button>
              </div>
              <div className="space-y-5 max-w-lg">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Vắc-xin cần tiêm <span className="text-red-500 ml-1">*</span></label>
                  <select
                    value={prescribeForm.vaccineId}
                    onChange={(e) => { setPrescribeForm({ ...prescribeForm, vaccineId: e.target.value }); setPrescribeErrors({ ...prescribeErrors, vaccineId: "" }); }}
                    className={`w-full bg-white px-3 py-2.5 border rounded-lg text-sm outline-none transition-colors cursor-pointer ${prescribeErrors.vaccineId ? "border-red-500 focus:border-red-500 bg-red-50" : "border-slate-300 focus:border-emerald-500"}`}
                  >
                    <option value="" disabled>-- Chọn Vắc-xin --</option>
                    {vaccineOptions.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
                  </select>
                  {prescribeErrors.vaccineId && <p className="text-xs text-red-500 font-bold mt-1">{prescribeErrors.vaccineId}</p>}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Ngày hẹn <span className="text-red-500 ml-1">*</span></label>
                    <input
                      type="date"
                      value={prescribeForm.date}
                      onChange={(e) => { setPrescribeForm({ ...prescribeForm, date: e.target.value }); setPrescribeErrors({ ...prescribeErrors, date: "" }); }}
                      className={`w-full bg-white px-3 py-2.5 border rounded-lg text-sm outline-none transition-colors ${prescribeErrors.date ? "border-red-500 focus:border-red-500 bg-red-50" : "border-slate-300 focus:border-emerald-500"}`}
                    />
                    {prescribeErrors.date && <p className="text-xs text-red-500 font-bold mt-1">{prescribeErrors.date}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Giờ hẹn <span className="text-red-500 ml-1">*</span></label>
                    <input
                      type="time"
                      value={prescribeForm.time}
                      onChange={(e) => { setPrescribeForm({ ...prescribeForm, time: e.target.value }); setPrescribeErrors({ ...prescribeErrors, time: "" }); }}
                      className={`w-full bg-white px-3 py-2.5 border rounded-lg text-sm outline-none transition-colors ${prescribeErrors.time ? "border-red-500 focus:border-red-500 bg-red-50" : "border-slate-300 focus:border-emerald-500"}`}
                    />
                    {prescribeErrors.time && <p className="text-xs text-red-500 font-bold mt-1">{prescribeErrors.time}</p>}
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-5 mt-2 border-t border-emerald-100">
                <button type="button" onClick={() => setRightPaneMode("detail")} className="px-6 py-2.5 border border-slate-300 rounded-lg text-sm font-semibold text-slate-600 bg-white hover:bg-slate-50 cursor-pointer transition-colors">Hủy bỏ</button>
                <button type="submit" className="px-6 py-2.5 bg-emerald-600 text-white rounded-lg text-sm font-semibold hover:bg-emerald-700 flex items-center gap-2 cursor-pointer shadow-sm transition-colors"><Save className="w-4 h-4" /> Kê đơn mới</button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}