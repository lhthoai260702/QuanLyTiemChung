import React, { useState } from 'react';
import { Patient, Vaccine, StockLog, SystemLog, VaccineHistoryItem } from '../types';
import { Syringe, Search, FileText, CheckCircle2, AlertCircle, Plus, Users, FolderOpen, Heart, Calendar } from 'lucide-react';

interface MedicalModuleProps {
  patients: Patient[];
  setPatients: React.Dispatch<React.SetStateAction<Patient[]>>;
  vaccines: Vaccine[];
  setVaccines: React.Dispatch<React.SetStateAction<Vaccine[]>>;
  stockLogs: StockLog[];
  setStockLogs: React.Dispatch<React.SetStateAction<StockLog[]>>;
  systemLogs: SystemLog[];
  setSystemLogs: React.Dispatch<React.SetStateAction<SystemLog[]>>;
  triggerToast: (msg: string) => void;
}

export default function MedicalModule({
  patients,
  setPatients,
  vaccines,
  setVaccines,
  stockLogs,
  setStockLogs,
  systemLogs,
  setSystemLogs,
  triggerToast
}: MedicalModuleProps) {
  const [activeTab, setActiveTab] = useState<'search' | 'record' | 'screening'>('search');
  
  // Search patient state
  const [searchPatientId, setSearchPatientId] = useState('BN-2023-001');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(
    patients.find((p) => p.id === 'BN-2023-001') || null
  );

  // States for new injection form
  const [injPatientId, setInjPatientId] = useState(patients[0]?.id || '');
  const [injVacId, setInjVacId] = useState(vaccines[0]?.id || '');
  const [injSideEffect, setInjSideEffect] = useState('Bình thường (Không phản ứng phụ)');
  const [injNextDose, setInjNextDose] = useState('TETAVAX (6 Tháng sau)');
  const [injDocName, setInjDocName] = useState('Dr. Hoàng Quốc Việt');
  const [injNotes, setInjNotes] = useState('');

  // States for pre-screening test
  const [screenPatientId, setScreenPatientId] = useState(patients[0]?.id || '');
  const [screenWeight, setScreenWeight] = useState('12 kg');
  const [screenTemp, setScreenTemp] = useState('36.6 °C');
  const [screenHeart, setScreenHeart] = useState('Nhịp đều, mạch ổn định');
  const [screenStatus, setScreenStatus] = useState<'Đủ điều kiện' | 'Tạm hoãn' | 'Chống chỉ định'>('Đủ điều kiện');
  const [screenNotes, setScreenNotes] = useState('Trẻ khỏe mạnh, đủ chỉ số cân nặng lý tưởng cho đợt tiêm sởi.');

  const handleSearchPatient = (e: React.FormEvent) => {
    e.preventDefault();
    const found = patients.find((p) => p.id.trim().toUpperCase() === searchPatientId.trim().toUpperCase());
    if (found) {
      setSelectedPatient(found);
      triggerToast(`Tìm thấy hồ sơ tóm tắt của bệnh án: ${found.fullName}!`);
    } else {
      setSelectedPatient(null);
      triggerToast('Lỗi: Không tìm thấy hồ sơ bệnh án khớp với mã đã nhập.');
    }
  };

  const handleRecordInjection = (e: React.FormEvent) => {
    e.preventDefault();

    const patient = patients.find((p) => p.id === injPatientId);
    const vaccine = vaccines.find((v) => v.id === injVacId);

    if (!patient || !vaccine) {
      triggerToast('Bệnh nhân hoặc vắc-xin lựa chọn không hợp lệ.');
      return;
    }

    if (vaccine.stock <= 0) {
      triggerToast(`Lỗi lâm sàng: Vắc-xin ${vaccine.name} đã HẾT tồn kho thực tế. Vui lòng nhập thêm ở Phân hệ Kho.`);
      return;
    }

    // 1. Deduct vaccine stock
    const updatedVaccines = vaccines.map((v) => {
      if (v.id === vaccine.id) {
        const nextQty = v.stock - 1;
        return {
          ...v,
          stock: nextQty,
          status: nextQty === 0 ? 'Đã hết' : nextQty <= 50 ? 'Sắp hết' : 'Sẵn có' as any,
        };
      }
      return v;
    });
    setVaccines(updatedVaccines);

    // 2. Add history node to patient
    const newRecord: VaccineHistoryItem = {
      id: `H-${Date.now()}`,
      vaccineName: vaccine.name,
      date: new Date().toISOString().split('T')[0],
      sideEffect: injSideEffect,
      nextDose: injNextDose,
      doctorName: injDocName,
    };

    const updatedPatients = patients.map((p) => {
      if (p.id === patient.id) {
        return {
          ...p,
          history: [newRecord, ...p.history],
        };
      }
      return p;
    });
    setPatients(updatedPatients);

    // If searching active patient, reload their view
    if (selectedPatient && selectedPatient.id === patient.id) {
      setSelectedPatient({
        ...selectedPatient,
        history: [newRecord, ...selectedPatient.history],
      });
    }

    // 3. Log stock movement
    setStockLogs([
      {
        id: `SL-${Date.now()}`,
        vaccineName: vaccine.name,
        quantity: 1,
        type: 'Xuất kho',
        date: new Date().toISOString().split('T')[0],
        handler: 'Dr. Hoàng Quốc Việt',
        notes: `Sử dụng để cấp mũi tiêm tại chỗ bệnh án ${patient.fullName} (${patient.id})`,
      },
      ...stockLogs,
    ]);

    // 4. Record audit trace
    setSystemLogs([
      {
        id: `LOG-${Date.now()}`,
        time: new Date().toISOString().replace('T', ' ').substring(0, 19),
        handler: 'Dr. Hoàng Quốc Việt (Y tế)',
        action: 'Tiêm chủng lâm sàng',
        details: `Đã thực hiện tiêm mũi ${vaccine.name} cho bệnh nhân ${patient.fullName} (${patient.id}). Phản ứng ghi nhận: ${injSideEffect}`,
      },
      ...systemLogs,
    ]);

    triggerToast(`Đã tiêm chủng thành công vắc-xin ${vaccine.code} cho ${patient.fullName}! Lịch sử bệnh án đã được lưu.`);
  };

  const handlePreScreenSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const patient = patients.find((p) => p.id === screenPatientId);
    if (!patient) return;

    triggerToast(`Đã lưu biên bản khám sàng lọc cho ${patient.fullName}. Kết quả: ${screenStatus}!`);
    
    setSystemLogs([
      {
        id: `LOG-${Date.now()}`,
        time: new Date().toISOString().replace('T', ' ').substring(0, 19),
        handler: 'Dr. Hoàng Quốc Việt (Y tế)',
        action: 'Khám sàng lọc',
        details: `Đã khám sàng lọc bệnh nhân ${patient.fullName}. Cân nặng: ${screenWeight}, nhiệt độ: ${screenTemp}, Phán quyết: ${screenStatus}. Ghi chú: ${screenNotes}`,
      },
      ...systemLogs,
    ]);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Module Title */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">🩺 Phân hệ Bác sĩ & Nhân viên Y tế (Medical)</h2>
        <p className="text-sm text-slate-500 mt-1">Khám sàng lọc đo sinh hiệu, lập biên bản tiêm chủng lâm sàng y tế, theo dõi phản ứng mẫn cảm và hẹn tái tiêm.</p>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 flex items-center justify-between shadow-sm">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Hồ sơ bệnh án</p>
            <h3 className="text-2xl font-extrabold text-slate-800 mt-1">{patients.length} bệnh nhân lưu trữ</h3>
          </div>
          <Users className="w-10 h-10 text-blue-500 bg-blue-50 p-2 rounded-lg" />
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 flex items-center justify-between shadow-sm">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Ca tiêm thành công hôm nay</p>
            <h3 className="text-2xl font-extrabold text-emerald-600 mt-1">42 đợt cấp</h3>
          </div>
          <CheckCircle2 className="w-10 h-10 text-emerald-500 bg-emerald-50 p-2 rounded-lg" />
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 flex items-center justify-between shadow-sm">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Mức phản ứng phụ ghi nhận</p>
            <h3 className="text-2xl font-extrabold text-slate-800 mt-1">0.12% (An toàn cao)</h3>
          </div>
          <Heart className="w-10 h-10 text-red-500 bg-red-50 p-2 rounded-lg" />
        </div>
      </div>

      {/* Navigation tabs */}
      <div className="border-b border-slate-200 flex space-x-2">
        <button
          onClick={() => setActiveTab('search')}
          className={`px-4 py-2.5 font-medium text-sm border-b-2 transition-colors ${
            activeTab === 'search' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          🔍 Bệnh án & Lịch sử tiêm chủng
        </button>
        <button
          onClick={() => setActiveTab('screening')}
          className={`px-4 py-2.5 font-medium text-sm border-b-2 transition-colors ${
            activeTab === 'screening' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          📋 Khám sàng lọc sinh hiệu
        </button>
        <button
          onClick={() => setActiveTab('record')}
          className={`px-4 py-2.5 font-medium text-sm border-b-2 transition-colors ${
            activeTab === 'record' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          💉 Chỉ định & Ghi nhận mũi tiêm mới
        </button>
      </div>

      {/* Tabs */}
      {activeTab === 'search' && (
        <div className="space-y-6">
          {/* Query Form */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <form onSubmit={handleSearchPatient} className="flex flex-col sm:flex-row gap-3 items-end">
              <div className="flex-1">
                <label className="block text-xs font-bold text-slate-600 mb-1.5">Mã số hồ sơ Bệnh Nhân (Patient ID)</label>
                <input
                  type="text"
                  required
                  value={searchPatientId}
                  onChange={(e) => setSearchPatientId(e.target.value)}
                  placeholder="Nhập mã bệnh nhân. Ví dụ: BN-2023-001 hoặc BN-2023-002"
                  className="w-full border border-slate-200 rounded-lg px-3.5 py-2 text-sm outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs px-5 py-2.5 rounded-lg flex items-center justify-center gap-1 cursor-pointer transition-colors"
              >
                <Search className="w-4 h-4" /> Tra cứu bệnh án
              </button>
            </form>
          </div>

          {/* Records Display Card */}
          {selectedPatient ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fade-in">
              {/* Personal Card */}
              <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
                <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
                  <div className="bg-blue-50 text-blue-600 p-2 rounded-lg">
                    <FolderOpen className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-slate-800">Thông Tin Hành Chính</h3>
                </div>
                <div className="divide-y divide-slate-100 text-sm">
                  <div className="py-2.5 flex justify-between">
                    <span className="text-slate-400">Họ và tên trẻ:</span>
                    <span className="font-bold text-slate-800">{selectedPatient.fullName}</span>
                  </div>
                  <div className="py-2.5 flex justify-between">
                    <span className="text-slate-400">Giới tính:</span>
                    <span className="font-semibold">{selectedPatient.gender}</span>
                  </div>
                  <div className="py-2.5 flex justify-between">
                    <span className="text-slate-400">Ngày sinh:</span>
                    <span className="font-mono">{selectedPatient.dob}</span>
                  </div>
                  <div className="py-2.5 flex justify-between">
                    <span className="text-slate-400">Người đại diện bảo hộ:</span>
                    <span className="font-semibold text-slate-700">{selectedPatient.guardianName}</span>
                  </div>
                  <div className="py-2.5 flex justify-between">
                    <span className="text-slate-400">Số điện thoại phụ huynh:</span>
                    <span className="font-bold text-blue-600 font-mono">{selectedPatient.phone}</span>
                  </div>
                  <div className="py-2.5 flex flex-col gap-1">
                    <span className="text-slate-400">Địa chỉ cư trú đăng ký:</span>
                    <span className="font-medium text-slate-800 text-right">{selectedPatient.address}</span>
                  </div>
                </div>
              </div>

              {/* History Chronology timeline */}
              <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
                <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
                  <div className="bg-slate-100 text-slate-600 p-2 rounded-lg">
                    <FileText className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-slate-800">Sổ Tiêm Chủng Điện Tử</h3>
                </div>

                {selectedPatient.history.length > 0 ? (
                  <div className="space-y-4 relative border-l border-slate-200 pl-4 mt-2">
                    {selectedPatient.history.map((record) => (
                      <div key={record.id} className="relative pb-2">
                        {/* Bullet circle */}
                        <div className="absolute -left-[20.5px] top-1.5 w-3 h-3 bg-blue-600 rounded-full border-2 border-white"></div>
                        
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                          <div className="flex justify-between items-start">
                            <div>
                              <span className="bg-emerald-50 text-emerald-700 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded mr-2">
                                Đã tiêm
                              </span>
                              <strong className="text-slate-900">{record.vaccineName}</strong>
                            </div>
                            <span className="text-xs text-slate-400 font-mono flex items-center gap-0.5">
                              <Calendar className="w-3 h-3" /> {record.date}
                            </span>
                          </div>
                          
                          <div className="text-xs space-y-0.5 text-slate-600">
                            <div>
                              <span className="text-slate-400">Phản ứng sau tiêm chủng:</span>{' '}
                              <span className="font-semibold text-emerald-700 bg-emerald-50/50 px-2 py-0.5 rounded">
                                {record.sideEffect}
                              </span>
                            </div>
                            <div className="pt-1">
                              <span className="text-slate-400 font-medium">Chỉ định liều nối tiếp:</span>{' '}
                              <span className="font-bold text-blue-600 select-all">{record.nextDose}</span>
                            </div>
                            <div className="pt-0.5">
                              <span className="text-slate-400">Bác sĩ phụ trách:</span>{' '}
                              <span className="font-semibold text-slate-800">{record.doctorName}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-12 text-center text-slate-400 space-y-1">
                    <AlertCircle className="w-10 h-10 mx-auto text-slate-300" />
                    <p className="text-sm font-semibold">Bệnh nhân chưa từng tiêm chủng vaccine</p>
                    <p className="text-xs">Chưa ghi nhận lịch sử tiêm nào lưu trữ trong cơ sở dữ liệu.</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-12 text-center text-slate-400">
              <AlertCircle className="w-12 h-12 mx-auto text-slate-300 mb-2" />
              <p className="text-base font-bold text-slate-700">Mã Bệnh nhân không tồn tại hoặc chưa tìm kiếm</p>
              <p className="text-xs mt-1">Sử dụng mã 'BN-2023-001', 'BN-2023-002', hoặc 'BN-2023-003' để trải nghiệm dữ liệu.</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'screening' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-6">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-base font-bold text-slate-800">Biên bản khám sàng lọc lâm sàng</h3>
            <p className="text-xs text-slate-500 mt-1">Đo đạc kiểm tra thể trạng sức khỏe trước khi bắt tay tiêm chủng chính thức.</p>
          </div>

          <form onSubmit={handlePreScreenSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Chọn bệnh nhi khám *</label>
                <select
                  value={screenPatientId}
                  onChange={(e) => setScreenPatientId(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg p-2 text-sm bg-white outline-none"
                >
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.fullName} ({p.id})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Trọng lượng cơ thể (kg) *</label>
                <input
                  type="text"
                  required
                  value={screenWeight}
                  onChange={(e) => setScreenWeight(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg p-2 text-sm outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nhiệt độ cơ thể (°C) *</label>
                <input
                  type="text"
                  required
                  value={screenTemp}
                  onChange={(e) => setScreenTemp(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg p-2 text-sm outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nhịp tim & Tai mũi họng *</label>
                <input
                  type="text"
                  required
                  value={screenHeart}
                  onChange={(e) => setScreenHeart(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg p-2 text-sm outline-none"
                />
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
              <label className="block text-xs font-bold text-slate-700 mb-2">Phán quyết kết quả Khám sàng lọc *</label>
              <div className="flex gap-4">
                <label className="flex items-center gap-1.5 text-xs text-emerald-700 font-semibold cursor-pointer">
                  <input
                    type="radio"
                    name="screen_decision"
                    checked={screenStatus === 'Đủ điều kiện'}
                    onChange={() => setScreenStatus('Đủ điều kiện')}
                  />
                  Đủ điều kiện tiêm chủng ngay
                </label>
                <label className="flex items-center gap-1.5 text-xs text-amber-700 font-semibold cursor-pointer">
                  <input
                    type="radio"
                    name="screen_decision"
                    checked={screenStatus === 'Tạm hoãn'}
                    onChange={() => setScreenStatus('Tạm hoãn')}
                  />
                  Tạm hoãn (Hẹn đợt sau)
                </label>
                <label className="flex items-center gap-1.5 text-xs text-red-700 font-semibold cursor-pointer">
                  <input
                    type="radio"
                    name="screen_decision"
                    checked={screenStatus === 'Chống chỉ định'}
                    onChange={() => setScreenStatus('Chống chỉ định')}
                  />
                  Chống chỉ định tiêm loại này
                </label>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Ghi chú lâm sàng chi tiết</label>
              <textarea
                value={screenNotes}
                onChange={(e) => setScreenNotes(e.target.value)}
                className="w-full border border-slate-200 rounded-lg p-3 text-sm h-24 outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs px-5 py-2.5 rounded-lg flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <CheckCircle2 className="w-4 h-4" /> Ký xác nhận biên bản khám
              </button>
            </div>
          </form>
        </div>
      )}

      {activeTab === 'record' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-6">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-base font-bold text-slate-800 font-sans">Ghi nhận tiêm chủng vắc-xin lâm sàng</h3>
            <p className="text-xs text-slate-500 mt-1">Lập báo cáo sau khi hoàn tất tiêm một liều vắc-xin thành công cho trẻ.</p>
          </div>

          <form onSubmit={handleRecordInjection} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Bệnh nhi thụ hưởng *</label>
                <select
                  value={injPatientId}
                  onChange={(e) => setInjPatientId(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg p-2.5 text-sm bg-white outline-none"
                >
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.fullName} ({p.id})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Loại vắc-xin đã tiêm *</label>
                <select
                  value={injVacId}
                  onChange={(e) => setInjVacId(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg p-2.5 text-sm bg-white outline-none"
                >
                  {vaccines.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name} (Số liều khả dụng: {v.stock} liều)
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Phản ứng sau tiêm (30 Phút ghi nhận) *</label>
                <input
                  type="text"
                  required
                  value={injSideEffect}
                  onChange={(e) => setInjSideEffect(e.target.value)}
                  placeholder="VD: Bình thường hoặc Sốt nhẹ dưới 38 độ C"
                  className="w-full border border-slate-200 rounded-lg p-2 text-sm outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Chỉ định tiêm chủng tiếp theo *</label>
                <input
                  type="text"
                  required
                  value={injNextDose}
                  onChange={(e) => setInjNextDose(e.target.value)}
                  placeholder="VD: TRIMOVAX (hẹn 3 tháng sau)"
                  className="w-full border border-slate-200 rounded-lg p-2 text-sm outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Bác sĩ tiêm chính *</label>
                <input
                  type="text"
                  required
                  value={injDocName}
                  onChange={(e) => setInjDocName(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg p-2 text-sm outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Địa điểm tiêm</label>
                <input
                  type="text"
                  disabled
                  value="Phòng tiêm lâm sàng chuẩn GSP số 3"
                  className="w-full border border-slate-200 rounded-lg p-2 text-sm outline-none bg-slate-50 text-slate-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Ghi chú bổ sung</label>
              <textarea
                value={injNotes}
                onChange={(e) => setInjNotes(e.target.value)}
                placeholder="VD: Bố mẹ lưu ý cho trẻ uống đủ nước lọc và uống thuốc hạ sốt nếu tăng nhiệt độ lên quá 38.5 độ C..."
                className="w-full border border-slate-200 rounded-lg p-3 text-sm h-20 outline-none"
              />
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs px-5 py-2.5 rounded-lg flex items-center gap-1.5 cursor-pointer shadow-sm transition-colors"
              >
                <Syringe className="w-4 h-4" /> Xác nhận tiêm thành công và trừ kho
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
