import React, { useState, useEffect } from "react";
import { Patient, Vaccine } from "../types";
import { Search, Edit, Trash2, Save, MapPin, Calendar, Syringe, Pill, X, ArrowLeft } from "lucide-react";

interface MedicalModuleProps {
  patients: Patient[];
  setPatients: React.Dispatch<React.SetStateAction<Patient[]>>;
  vaccines: Vaccine[];
  triggerToast: (msg: string) => void;
}

export default function MedicalModule({ patients, setPatients, vaccines, triggerToast }: MedicalModuleProps) {
  // --- STATE: QUẢN LÝ GIAO DIỆN ---
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [vaccineOptions, setVaccineOptions] = useState<{ id: number; name: string }[]>([]);

  // Quản lý trạng thái hiển thị của cột bên phải (Xem chi tiết | Form Sửa | Form Kê đơn)
  const [rightPaneMode, setRightPaneMode] = useState<"detail" | "edit" | "prescribe">("detail");

  // Gọi API Lấy danh sách bệnh án từ Backend Spring Boot
  const fetchPatients = async () => {
    try {
      const response = await fetch("http://localhost:8080/api/medical/patients");
      if (response.ok) {
        const data = await response.json();
        setPatients(data); // Đổ dữ liệu thật vào state
        return data; // THÊM DÒNG NÀY: Trả về dữ liệu để đồng bộ chi tiết
      } else {
        triggerToast("Lỗi: Không thể lấy dữ liệu hồ sơ bệnh án!");
      }
    } catch (error) {
      console.error("Lỗi kết nối Backend:", error);
      triggerToast("Không thể kết nối đến Máy chủ Backend!");
    }
    return null; // Trả về null nếu lỗi
  };

  const fetchVaccinesForCombobox = async () => {
    try {
      const response = await fetch("http://localhost:8080/api/medical/vaccines");
      if (response.ok) {
        const data = await response.json();
        setVaccineOptions(data);
      }
    } catch (error) {
      console.error("Lỗi lấy danh sách vắc xin:", error);
    }
  };

  // Cập nhật useEffect để gọi thêm hàm lấy danh sách Vắc-xin
  useEffect(() => {
    fetchPatients();
    fetchVaccinesForCombobox();
  }, []);

  // Chạy 1 lần duy nhất khi load Component
  useEffect(() => {
    fetchPatients();
  }, []);

  // Lọc danh sách bệnh nhân
  const filteredPatients = patients.filter((p) => p.id.includes(searchQuery) || p.fullName.toLowerCase().includes(searchQuery.toLowerCase()));

  // Tự động chọn bệnh nhân đầu tiên nếu danh sách thay đổi
  useEffect(() => {
    if (filteredPatients.length > 0 && !selectedPatient) {
      handleSelectPatient(filteredPatients[0]);
    }
  }, [filteredPatients, selectedPatient]);

  // --- STATE: FORM CẬP NHẬT HỒ SƠ ---
  const [updateForm, setUpdateForm] = useState({
    id: "",
    fullName: "",
    gender: "Nam",
    age: "",
    guardianName: "",
    address: "",
    phone: "",
    history: [] as any[],
  });
  const [updateErrors, setUpdateErrors] = useState<Record<string, string>>({});

  // --- STATE: FORM KÊ ĐƠN ---
  const [prescribeForm, setPrescribeForm] = useState({
    patientId: "",
    vaccineId: "", // Đổi từ vaccineName sang vaccineId
    date: "",
  });
  const [prescribeErrors, setPrescribeErrors] = useState<Record<string, string>>({});

  // --- HÀM TIỆN ÍCH CHO FORMS ---
  const handleNumberOnlyChange = (setter: any, field: string, maxLength?: number) => (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, "");
    if (maxLength && val.length > maxLength) val = val.substring(0, maxLength);
    setter((prev: any) => ({ ...prev, [field]: val }));

    // Xóa lỗi khi người dùng bắt đầu gõ
    if (rightPaneMode === "edit") setUpdateErrors((prev) => ({ ...prev, [field]: "" }));
    if (rightPaneMode === "prescribe") setPrescribeErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, "");
    if (val.length > 10) val = val.substring(0, 10);
    let formatted = val;
    if (val.length > 3 && val.length <= 6) formatted = `${val.slice(0, 3)} ${val.slice(3)}`;
    else if (val.length > 6) formatted = `${val.slice(0, 3)} ${val.slice(3, 6)} ${val.slice(6)}`;

    setUpdateForm({ ...updateForm, phone: formatted });
    setUpdateErrors({ ...updateErrors, phone: "" });
  };

  // --- HÀM XỬ LÝ SỰ KIỆN NÚT BẤM ---
  const handleSelectPatient = (patient: Patient) => {
    setSelectedPatient(patient);
    setRightPaneMode("detail"); // Luôn quay về chế độ Xem chi tiết khi chọn người khác
  };

  const handleEditClick = () => {
    if (!selectedPatient) return;
    let formattedPhone = selectedPatient.phone.replace(/\D/g, "");
    if (formattedPhone.length > 3 && formattedPhone.length <= 6) {
      formattedPhone = `${formattedPhone.slice(0, 3)} ${formattedPhone.slice(3)}`;
    } else if (formattedPhone.length > 6) {
      formattedPhone = `${formattedPhone.slice(0, 3)} ${formattedPhone.slice(3, 6)} ${formattedPhone.slice(6)}`;
    }

    setUpdateForm({
      id: selectedPatient.id.replace(/\D/g, ""),
      fullName: selectedPatient.fullName,
      gender: selectedPatient.gender,
      age: selectedPatient.age?.toString() || "",
      guardianName: selectedPatient.guardianName || "",
      address: selectedPatient.address,
      phone: formattedPhone,
      // Đổ mảng history cũ vào, dùng JSON parse stringify để deep copy tránh tham chiếu
      history: selectedPatient.history ? JSON.parse(JSON.stringify(selectedPatient.history)) : [],
    });
    setUpdateErrors({});
    setRightPaneMode("edit");
  };

  // THÊM HÀM NÀY NGAY DƯỚI handleEditClick
  const handleHistoryChange = (index: number, field: string, value: string) => {
    const newHistory = [...updateForm.history];
    newHistory[index] = { ...newHistory[index], [field]: value };
    setUpdateForm({ ...updateForm, history: newHistory });
  };

  // --- THÊM HÀM MỚI: XÓA LỊCH SỬ TIÊM ---
  const handleDeleteHistoryRecord = async (recordId: number, index: number) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa bản ghi lịch sử tiêm này không?")) return;

    try {
      const response = await fetch(`http://localhost:8080/api/medical/history/${recordId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        triggerToast("Đã xóa bản ghi lịch sử tiêm!");

        // 1. Xóa ngay lập tức trên UI của Form đang hiển thị
        const newHistory = [...updateForm.history];
        newHistory.splice(index, 1);
        setUpdateForm({ ...updateForm, history: newHistory });

        // 2. Đồng bộ lại dữ liệu selectedPatient ngầm bên dưới
        const updatedPatients = await fetchPatients();
        if (updatedPatients && selectedPatient) {
          const freshPatient = updatedPatients.find((p: Patient) => p.id === selectedPatient.id);
          if (freshPatient) setSelectedPatient(freshPatient);
        }
      } else {
        const errorText = await response.text();
        triggerToast(`Lỗi xóa lịch sử: ${errorText}`);
      }
    } catch (error) {
      console.error("Lỗi xóa lịch sử:", error);
      triggerToast("Không thể kết nối đến máy chủ để xóa!");
    }
  };

  const handlePrescribeClick = () => {
    if (!selectedPatient) return;
    setPrescribeForm({
      patientId: selectedPatient.id.replace(/\D/g, ""),
      vaccineId: "", // Reset combobox
      date: "",
    });
    setPrescribeErrors({});
    setRightPaneMode("prescribe");
  };

  const handleDeleteClick = async (id: string) => {
    if (window.confirm(`Bạn có chắc chắn muốn xóa hồ sơ bệnh nhân ID: ${id} không?`)) {
      // --- CALL API DELETE ---
      try {
        const response = await fetch(`http://localhost:8080/api/medical/patients/${id}`, {
          method: "DELETE",
        });

        if (response.ok) {
          triggerToast("Đã xóa hồ sơ bệnh án thành công!");
          await fetchPatients(); // Tải lại danh sách mới (đã lọc các tài khoản có flag_delete = true)
          setSelectedPatient(null);
          setRightPaneMode("detail");
        } else {
          const errorText = await response.text();
          triggerToast(`Lỗi xóa hồ sơ: ${errorText}`);
        }
      } catch (error) {
        console.error("Lỗi kết nối xoá:", error);
        triggerToast("Không thể kết nối đến máy chủ để thực hiện xóa!");
      }
    }
  };

  // --- XỬ LÝ SUBMIT FORMS ---
  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};

    if (!updateForm.id) errors.id = "Vui lòng nhập ID bệnh nhân";
    if (!updateForm.fullName.trim()) errors.fullName = "Vui lòng nhập họ và tên";
    if (!updateForm.age) errors.age = "Vui lòng nhập tuổi";
    if (!updateForm.address.trim()) errors.address = "Vui lòng nhập địa chỉ";

    const phoneNum = updateForm.phone.replace(/\s/g, "");
    if (!phoneNum) errors.phone = "Vui lòng nhập số điện thoại";
    else if (phoneNum.length < 10) errors.phone = "Số điện thoại phải đủ 10 số";

    if (Object.keys(errors).length > 0) {
      setUpdateErrors(errors);
      triggerToast("Báo lỗi: Vui lòng kiểm tra lại các trường bị lỗi viền đỏ.");
      return;
    }

    // --- CALL API UPDATE ---
    try {
      const response = await fetch(`http://localhost:8080/api/medical/patients/${selectedPatient?.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fullName: updateForm.fullName,
          gender: updateForm.gender,
          age: parseInt(updateForm.age),
          guardianName: updateForm.guardianName,
          address: updateForm.address,
          phone: updateForm.phone,
          history: updateForm.history,
        }),
      });

      if (response.ok) {
        triggerToast("Cập nhật hồ sơ thành công!");

        // --- SỬA TẠI ĐÂY: Lấy danh sách mới và nạp lại thông tin vào UI ngay lập tức ---
        const updatedPatients = await fetchPatients();
        if (updatedPatients && selectedPatient) {
          // Tìm lại bệnh nhân đang được chọn trong danh sách mới vừa fetch về
          const freshPatient = updatedPatients.find((p: Patient) => p.id === selectedPatient.id);
          if (freshPatient) {
            setSelectedPatient(freshPatient); // Nạp lại dữ liệu mới vào UI chi tiết
          }
        }

        setRightPaneMode("detail"); // Quay về chế độ xem chi tiết
      } else {
        const errorText = await response.text();
        triggerToast(`Lỗi từ server: ${errorText}`);
      }
    } catch (error) {
      console.error("Lỗi cập nhật:", error);
      triggerToast("Không thể kết nối đến máy chủ để cập nhật!");
    }
  };

  const handlePrescribeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};

    if (!prescribeForm.patientId) errors.patientId = "Lỗi ID bệnh nhân";
    if (!prescribeForm.vaccineId) errors.vaccineId = "Vui lòng chọn Vắc-xin";
    if (!prescribeForm.date) errors.date = "Vui lòng chọn thời gian hẹn tiêm";

    if (Object.keys(errors).length > 0) {
      setPrescribeErrors(errors);
      triggerToast("Vui lòng điền đầy đủ thông tin kê đơn.");
      return;
    }

    try {
      const response = await fetch("http://localhost:8080/api/medical/prescribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId: parseInt(prescribeForm.patientId),
          vaccineId: parseInt(prescribeForm.vaccineId),
          date: prescribeForm.date,
        }),
      });

      if (response.ok) {
        triggerToast("Kê đơn và lên lịch thành công!");

        // SỬA TẠI ĐÂY: Đồng bộ lại hiển thị ngay lập tức
        const updatedPatients = await fetchPatients();
        if (updatedPatients && selectedPatient) {
          const freshPatient = updatedPatients.find((p: Patient) => p.id === selectedPatient.id);
          if (freshPatient) setSelectedPatient(freshPatient); // Nạp lại lịch sử mới vào UI chi tiết
        }

        setRightPaneMode("detail");
      } else {
        const errorText = await response.text();
        triggerToast(`Lỗi kê đơn: ${errorText}`);
      }
    } catch (error) {
      console.error("Lỗi khi kê đơn:", error);
      triggerToast("Không thể kết nối với máy chủ!");
    }
  };

  return (
    <div className="space-y-6 animate-fade-in h-full flex flex-col">
      {/* Header Module */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">🩺 Phân hệ Y Tế (Medical)</h2>
        <p className="text-sm text-slate-500 mt-1">Quản lý hồ sơ bệnh án, kê đơn và theo dõi tiêm chủng lâm sàng.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
        {/* ========================================= CỘT TRÁI: DANH SÁCH BỆNH ÁN ========================================= */}
        <div className="lg:col-span-1 bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden flex flex-col h-[700px]">
          <div className="p-4 bg-slate-50 border-b border-slate-200 space-y-3">
            <div className="flex justify-between items-center">
              <span className="font-bold text-xs text-slate-500 uppercase tracking-wider">Danh sách Bệnh án</span>
              <span className="bg-blue-100 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded-full">{filteredPatients.length} record</span>
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
                  className={`p-4 cursor-pointer transition-colors ${
                    selectedPatient?.id === p.id ? "bg-blue-50/70 border-l-4 border-blue-600" : "hover:bg-slate-50/50"
                  }`}
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

        {/* ========================================= CỘT PHẢI: KHU VỰC HIỂN THỊ CHI TIẾT & FORM ========================================= */}
        <div className="lg:col-span-2 space-y-6 h-[700px] overflow-y-auto">
          {!selectedPatient && (
            <div className="text-center p-12 border border-dashed border-slate-200 rounded-xl text-slate-400 text-sm bg-white">
              Chọn một hồ sơ bệnh án bên trái để hiển thị chi tiết hoặc thao tác.
            </div>
          )}

          {/* CHẾ ĐỘ 1: XEM CHI TIẾT BỆNH ÁN */}
          {selectedPatient && rightPaneMode === "detail" && (
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-5 relative animate-fade-in">
              {/* Nút Thao tác Edit/Delete/Prescribe */}
              <div className="absolute top-6 right-6 flex items-center gap-2">
                <button
                  onClick={handleEditClick}
                  // Chỉnh lại padding thành p-2 để nút trở thành hình vuông chứa icon
                  className="text-blue-600 bg-blue-50 hover:bg-blue-100 p-2 rounded-lg inline-flex items-center justify-center transition-colors"
                  title="Sửa hồ sơ" // Thêm title để làm tooltip
                >
                  <Edit className="w-4 h-4" />
                </button>

                <button
                  onClick={handlePrescribeClick}
                  className="text-emerald-600 bg-emerald-50 hover:bg-emerald-100 p-2 rounded-lg inline-flex items-center justify-center transition-colors"
                  title="Kê đơn vắc-xin" // Thêm title để làm tooltip
                >
                  <Pill className="w-4 h-4" />
                </button>
              </div>

              <div className="border-b border-slate-100 pb-4 pr-[220px]">
                <span className="text-xs font-mono font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded">ID: {selectedPatient.id}</span>
                <h3 className="text-xl font-bold text-slate-800 mt-2">{selectedPatient.fullName}</h3>
                <p className="text-sm font-semibold text-blue-600 mt-1">
                  Giới tính: {selectedPatient.gender} | {selectedPatient.age} tuổi
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="bg-slate-50/60 p-3 rounded-lg border border-slate-100">
                  <span className="block font-semibold text-slate-400 mb-1">👨‍👩‍👧 Người giám hộ (nếu là trẻ em)</span>
                  <span className="font-medium text-slate-800 text-sm">{selectedPatient.guardianName || "Không có"}</span>
                </div>
                <div className="bg-slate-50/60 p-3 rounded-lg border border-slate-100">
                  <span className="block font-semibold text-slate-400 mb-1">📞 Điện thoại liên lạc</span>
                  <span className="font-bold text-slate-800 text-sm font-mono">{selectedPatient.phone}</span>
                </div>
                <div className="sm:col-span-2 bg-slate-50/60 p-3 rounded-lg border border-slate-100 flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-slate-400 mt-0.5" />
                  <div>
                    <span className="block font-semibold text-slate-400">📍 Địa chỉ liên lạc</span>
                    <span className="font-medium text-slate-800 text-sm">{selectedPatient.address}</span>
                  </div>
                </div>
              </div>

              {/* Lịch sử tiêm (Vắc xin đã tiêm, phản ứng, vắc xin cần tiêm) */}
              <div className="space-y-3 pt-2">
                <label className="block text-xs font-bold text-slate-500 uppercase">Lịch sử Tiêm chủng & Kê đơn</label>
                {selectedPatient.history && selectedPatient.history.length > 0 ? (
                  <div className="space-y-3">
                    {selectedPatient.history.map((record, idx) => (
                      <div key={idx} className="bg-white border border-slate-200 rounded-lg p-3 shadow-sm flex flex-col gap-2">
                        <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                          <div className="font-bold text-blue-700 text-sm flex items-center gap-1.5">
                            <Syringe className="w-4 h-4" /> Vắc-xin đã tiêm: {record.vaccineName}
                          </div>
                          <div className="text-xs font-mono text-slate-500 flex items-center gap-1">
                            <Calendar className="w-3 h-3" /> {record.date}
                          </div>
                        </div>
                        <div className="text-xs text-slate-600">
                          <span className="font-semibold text-slate-500">Phản ứng sau tiêm:</span>{" "}
                          <span className="font-medium text-emerald-700">{record.sideEffect || "Không có"}</span>
                        </div>
                        <div className="text-xs text-slate-600">
                          <span className="font-semibold text-slate-500">Vắc-xin cần tiêm (Đợt tới):</span>{" "}
                          <span className="font-bold text-amber-600">{record.nextDose || "Không có"}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 text-center text-xs text-slate-400 italic">
                    Chưa ghi nhận lịch sử tiêm chủng nào.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* CHẾ ĐỘ 2: FORM CẬP NHẬT HỒ SƠ */}
          {selectedPatient && rightPaneMode === "edit" && (
            <form
              onSubmit={handleUpdateSubmit}
              noValidate
              className="bg-blue-50/30 p-6 rounded-xl border border-blue-200 space-y-5 animate-fade-in shadow-sm ring-1 ring-blue-50"
            >
              <div className="flex justify-between items-center border-b border-blue-100 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-blue-700 flex items-center gap-2">
                    <Edit className="w-5 h-5" /> Cập nhật Hồ sơ Bệnh án
                  </h3>
                  <p className="text-[11px] text-blue-600/70 mt-1">
                    Đang chỉnh sửa dữ liệu của bệnh nhân: <span className="font-bold">{selectedPatient.fullName}</span>
                  </p>
                </div>
                <button type="button" onClick={() => setRightPaneMode("detail")} className="text-blue-400 hover:text-blue-600 cursor-pointer p-1">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">ID bệnh nhân</label>
                    <input
                      type="text"
                      value={updateForm.id}
                      disabled // Vô hiệu hóa thẻ input
                      className="w-full bg-slate-100 text-slate-500 cursor-not-allowed px-3 py-2 border border-slate-200 rounded-lg text-xs outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Họ và tên <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      maxLength={100}
                      value={updateForm.fullName}
                      onChange={(e) => {
                        setUpdateForm({
                          ...updateForm,
                          fullName: e.target.value,
                        });
                        setUpdateErrors({ ...updateErrors, fullName: "" });
                      }}
                      className={`w-full bg-white px-3 py-2 border rounded-lg text-xs outline-none transition-colors ${
                        updateErrors.fullName ? "border-red-500 focus:border-red-500 bg-red-50" : "border-slate-300 focus:border-blue-500"
                      }`}
                    />
                    {updateErrors.fullName && <p className="text-[10px] text-red-500 font-bold mt-1">{updateErrors.fullName}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Giới tính <span className="text-red-500">*</span>
                    </label>
                    <div className="flex gap-4 items-center h-[38px] px-2 bg-white border border-slate-200 rounded-lg">
                      <label className="flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer">
                        <input
                          type="radio"
                          name="gender"
                          checked={updateForm.gender === "Nam"}
                          onChange={() => setUpdateForm({ ...updateForm, gender: "Nam" })}
                          className="cursor-pointer"
                        />{" "}
                        Nam
                      </label>
                      <label className="flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer">
                        <input
                          type="radio"
                          name="gender"
                          checked={updateForm.gender === "Nữ"}
                          onChange={() => setUpdateForm({ ...updateForm, gender: "Nữ" })}
                          className="cursor-pointer"
                        />{" "}
                        Nữ
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Tuổi <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      maxLength={3}
                      value={updateForm.age}
                      onChange={handleNumberOnlyChange(setUpdateForm, "age")}
                      placeholder="Chỉ nhập số..."
                      className={`w-full bg-white px-3 py-2 border rounded-lg text-xs outline-none transition-colors ${
                        updateErrors.age ? "border-red-500 focus:border-red-500 bg-red-50" : "border-slate-300 focus:border-blue-500"
                      }`}
                    />
                    {updateErrors.age && <p className="text-[10px] text-red-500 font-bold mt-1">{updateErrors.age}</p>}
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Người giám hộ (Nếu bệnh nhân là trẻ em)</label>
                    <input
                      type="text"
                      maxLength={100}
                      value={updateForm.guardianName}
                      onChange={(e) =>
                        setUpdateForm({
                          ...updateForm,
                          guardianName: e.target.value,
                        })
                      }
                      className="w-full bg-white px-3 py-2 border border-slate-300 focus:border-blue-500 rounded-lg text-xs outline-none transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Điện thoại liên lạc <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={updateForm.phone}
                      onChange={handlePhoneChange}
                      placeholder="090 123 4567"
                      className={`w-full bg-white px-3 py-2 border rounded-lg text-xs outline-none font-mono transition-colors ${
                        updateErrors.phone ? "border-red-500 focus:border-red-500 bg-red-50" : "border-slate-300 focus:border-blue-500"
                      }`}
                    />
                    {updateErrors.phone && <p className="text-[10px] text-red-500 font-bold mt-1">{updateErrors.phone}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Địa chỉ <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      maxLength={255}
                      value={updateForm.address}
                      onChange={(e) => {
                        setUpdateForm({
                          ...updateForm,
                          address: e.target.value,
                        });
                        setUpdateErrors({ ...updateErrors, address: "" });
                      }}
                      className={`w-full bg-white px-3 py-2 border rounded-lg text-xs h-24 resize-none outline-none transition-colors ${
                        updateErrors.address ? "border-red-500 focus:border-red-500 bg-red-50" : "border-slate-300 focus:border-blue-500"
                      }`}
                    ></textarea>
                    {updateErrors.address && <p className="text-[10px] text-red-500 font-bold mt-1">{updateErrors.address}</p>}
                  </div>
                </div>
              </div>

              {/* --- BẮT ĐẦU: KHỐI CHỈNH SỬA LỊCH SỬ TIÊM --- */}
              {updateForm.history && updateForm.history.length > 0 && (
                <div className="md:col-span-2 pt-4 border-t border-blue-100/50 space-y-3">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">💉 Chỉnh sửa Lịch sử Tiêm / Kê đơn</h4>
                  {updateForm.history.map((record: any, idx: number) => (
                    <div
                      key={idx}
                      className="bg-white p-3 border border-slate-200 rounded-lg shadow-sm grid grid-cols-1 md:grid-cols-2 gap-3 relative hover:border-blue-300 transition-colors group"
                    >
                      <div className="md:col-span-2 font-semibold text-blue-700 text-sm flex justify-between items-center border-b border-slate-100 pb-2">
                        <div className="flex items-center gap-1.5">
                          <Syringe className="w-4 h-4" /> Vắc-xin: {record.vaccineName}
                        </div>

                        <button
                          type="button"
                          onClick={() => handleDeleteHistoryRecord(record.recordId, idx)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1.5 rounded-md transition-colors"
                          title="Xóa bản ghi này"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1">Thời gian (Ngày tiêm / Hẹn)</label>
                        <input
                          type="date"
                          value={record.date || ""}
                          onChange={(e) => handleHistoryChange(idx, "date", e.target.value)}
                          className="w-full bg-slate-50 px-3 py-1.5 border border-slate-200 rounded text-xs outline-none focus:border-blue-500 transition-colors"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1">Phản ứng sau tiêm</label>
                        <input
                          type="text"
                          value={record.sideEffect || ""}
                          onChange={(e) => handleHistoryChange(idx, "sideEffect", e.target.value)}
                          placeholder="Nhập nếu có (VD: Sốt nhẹ...)"
                          className="w-full bg-slate-50 px-3 py-1.5 border border-slate-200 rounded text-xs outline-none focus:border-blue-500 transition-colors"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {/* --- KẾT THÚC: KHỐI CHỈNH SỬA LỊCH SỬ TIÊM --- */}

              <div className="flex justify-end gap-2 pt-4 border-t border-blue-100">
                <button
                  type="button"
                  onClick={() => setRightPaneMode("detail")}
                  className="px-5 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-600 bg-white hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Hủy / Quay lại
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold shadow-sm hover:bg-blue-700 flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Save className="w-4 h-4" /> Cập nhật
                </button>
              </div>
            </form>
          )}

          {/* CHẾ ĐỘ 3: FORM KÊ ĐƠN */}
          {selectedPatient && rightPaneMode === "prescribe" && (
            <form
              onSubmit={handlePrescribeSubmit}
              noValidate
              className="bg-emerald-50/30 p-6 rounded-xl border border-emerald-200 space-y-5 animate-fade-in shadow-sm ring-1 ring-emerald-50"
            >
              {/* Header form giữ nguyên... */}
              <div className="flex justify-between items-center border-b border-emerald-100 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-emerald-700 flex items-center gap-2">
                    <Pill className="w-5 h-5" /> Kê đơn Vắc-xin
                  </h3>
                  <p className="text-[11px] text-emerald-600/70 mt-1">
                    Chỉ định lịch tiêm mũi tiếp theo cho bệnh nhân: <span className="font-bold">{selectedPatient.fullName}</span>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setRightPaneMode("detail")}
                  className="text-emerald-400 hover:text-emerald-600 cursor-pointer p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4 max-w-lg">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">ID bệnh nhân</label>
                  <input
                    type="text"
                    value={prescribeForm.patientId}
                    disabled // Không cho phép sửa ID người bệnh
                    className="w-full bg-slate-100 text-slate-500 cursor-not-allowed px-3 py-2 border border-slate-200 rounded-lg text-xs outline-none"
                  />
                </div>

                {/* --- SỬA THÀNH COMBOBOX --- */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Vắc-xin cần tiêm <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={prescribeForm.vaccineId}
                    onChange={(e) => {
                      setPrescribeForm({
                        ...prescribeForm,
                        vaccineId: e.target.value,
                      });
                      setPrescribeErrors({ ...prescribeErrors, vaccineId: "" });
                    }}
                    className={`w-full bg-white px-3 py-2 border rounded-lg text-xs outline-none transition-colors cursor-pointer ${
                      prescribeErrors.vaccineId ? "border-red-500 focus:border-red-500 bg-red-50" : "border-slate-300 focus:border-emerald-500"
                    }`}
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
                  {prescribeErrors.vaccineId && <p className="text-[10px] text-red-500 font-bold mt-1">{prescribeErrors.vaccineId}</p>}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Thời gian (Hẹn lịch tiêm) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={prescribeForm.date}
                    onChange={(e) => {
                      setPrescribeForm({
                        ...prescribeForm,
                        date: e.target.value,
                      });
                      setPrescribeErrors({ ...prescribeErrors, date: "" });
                    }}
                    className={`w-full bg-white px-3 py-2 border rounded-lg text-xs outline-none transition-colors cursor-pointer ${
                      prescribeErrors.date ? "border-red-500 focus:border-red-500 bg-red-50" : "border-slate-300 focus:border-emerald-500"
                    }`}
                  />
                  {prescribeErrors.date && <p className="text-[10px] text-red-500 font-bold mt-1">{prescribeErrors.date}</p>}
                </div>
              </div>

              {/* Nút submit giữ nguyên... */}
              <div className="flex justify-end gap-2 pt-4 border-t border-emerald-100">
                <button
                  type="button"
                  onClick={() => setRightPaneMode("detail")}
                  className="px-5 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-600 bg-white hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Hủy / Quay lại
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 text-white rounded-lg text-xs font-semibold shadow-sm hover:bg-emerald-700 flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Save className="w-4 h-4" /> Xác nhận Kê đơn
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
