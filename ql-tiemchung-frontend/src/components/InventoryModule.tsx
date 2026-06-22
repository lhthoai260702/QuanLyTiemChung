import React, { useState } from 'react';
import { Vaccine, StockLog, SystemLog } from '../types';
import { Archive, Plus, Search, Table, FileSpreadsheet, PlusCircle, MinusCircle, AlertTriangle, HelpCircle } from 'lucide-react';

interface InventoryModuleProps {
  vaccines: Vaccine[];
  setVaccines: React.Dispatch<React.SetStateAction<Vaccine[]>>;
  stockLogs: StockLog[];
  setStockLogs: React.Dispatch<React.SetStateAction<StockLog[]>>;
  systemLogs: SystemLog[];
  setSystemLogs: React.Dispatch<React.SetStateAction<SystemLog[]>>;
  triggerToast: (msg: string) => void;
}

export default function InventoryModule({
  vaccines,
  setVaccines,
  stockLogs,
  setStockLogs,
  systemLogs,
  setSystemLogs,
  triggerToast
}: InventoryModuleProps) {
  const [activeTab, setActiveTab] = useState<'view' | 'import' | 'export' | 'history'>('view');
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchCriteria, setSearchCriteria] = useState<'name' | 'code' | 'origin' | 'age'>('name');

  // Input states for New Vaccine/Addition
  const [isNewVaccine, setIsNewVaccine] = useState(false);
  const [selectedVaccineId, setSelectedVaccineId] = useState(vaccines[0]?.id || '');
  
  const [newVacName, setNewVacName] = useState('');
  const [newVacCode, setNewVacCode] = useState('');
  const [newVacQty, setNewVacQty] = useState(100);
  const [newVacExp, setNewVacExp] = useState('2027-06-30');
  const [newVacLicense, setNewVacLicense] = useState('6/2/2026');
  const [newVacOrigin, setNewVacOrigin] = useState('Pháp');
  const [newVacDosage, setNewVacDosage] = useState('0.5 ml');
  const [newVacTemp, setNewVacTemp] = useState('2°C - 8°C');
  const [newVacAge, setNewVacAge] = useState('Trẻ em');
  const [newImportPrice, setNewImportPrice] = useState(150000);
  const [newSellingPrice, setNewSellingPrice] = useState(250000);

  // States for export
  const [exportVacId, setExportVacId] = useState(vaccines[0]?.id || '');
  const [exportQty, setExportQty] = useState(10);
  const [exportNotes, setExportNotes] = useState('Xuất kho phục vụ ca tiêm chủng phòng khám bên cạnh');

  // Filter logic
  const filteredVaccines = vaccines.filter((v) => {
    const q = searchQuery.toLowerCase();
    if (!q) return true;
    if (searchCriteria === 'name') return v.name.toLowerCase().includes(q);
    if (searchCriteria === 'code') return v.code.toLowerCase().includes(q);
    if (searchCriteria === 'origin') return v.origin.toLowerCase().includes(q);
    if (searchCriteria === 'age') return v.ageGroup.toLowerCase().includes(q);
    return true;
  });

  const lowStockCount = vaccines.filter((v) => v.stock <= 50).length;

  const handleImportSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (isNewVaccine) {
      if (!newVacName || !newVacCode) {
        triggerToast('Vui lòng điền tên và mã vắc-xin.');
        return;
      }

      const newVac: Vaccine = {
        id: `VAC-${String(vaccines.length + 1).padStart(3, '0')}`,
        name: `${newVacName} - ${newVacCode}`,
        code: newVacCode.toUpperCase(),
        receivedDate: new Date().toISOString().split('T')[0],
        expiryDate: newVacExp,
        licenseNo: newVacLicense,
        origin: newVacOrigin,
        dosage: newVacDosage,
        stock: newVacQty,
        tempRange: newVacTemp,
        ageGroup: newVacAge,
        importPrice: newImportPrice,
        sellingPrice: newSellingPrice,
        status: newVacQty === 0 ? 'Đã hết' : newVacQty <= 50 ? 'Sắp hết' : 'Sẵn có',
      };

      setVaccines([...vaccines, newVac]);
      triggerToast(`Nhập kho thành công vắc-xin mới: ${newVacName}!`);

      // Log
      setStockLogs([
        {
          id: `SL-${Date.now()}`,
          vaccineName: newVac.name,
          quantity: newVacQty,
          type: 'Nhập kho',
          date: new Date().toISOString().split('T')[0],
          handler: 'Trần Thị Mỹ Linh (Kho)',
          notes: `Nhập đợt đầu số lô vắc-xin mới. Nước sản xuất: ${newVacOrigin}`,
        },
        ...stockLogs,
      ]);

      // System Log
      setSystemLogs([
        {
          id: `LOG-${Date.now()}`,
          time: new Date().toISOString().replace('T', ' ').substring(0, 19),
          handler: 'Trần Thị Mỹ Linh (Kho)',
          action: 'Khai báo vaccine mới',
          details: `Đã khai báo và nhập vắc-xin ${newVac.name}, số lượng ${newVacQty} đơn vị liều.`,
        },
        ...systemLogs,
      ]);
    } else {
      // Add quantity to existing vaccine
      const updated = vaccines.map((v) => {
        if (v.id === selectedVaccineId) {
          const newQty = v.stock + newVacQty;
          return {
            ...v,
            stock: newQty,
            status: newQty === 0 ? 'Đã hết' : newQty <= 50 ? 'Sắp hết' : 'Sẵn có' as any,
          };
        }
        return v;
      });

      const affected = vaccines.find((v) => v.id === selectedVaccineId);
      setVaccines(updated);
      triggerToast(`Đã cộng dồn +${newVacQty} liều vào vắc-xin ${affected?.name}!`);

      // Log
      setStockLogs([
        {
          id: `SL-${Date.now()}`,
          vaccineName: affected ? affected.name : 'Vắc-xin',
          quantity: newVacQty,
          type: 'Nhập kho',
          date: new Date().toISOString().split('T')[0],
          handler: 'Trần Thị Mỹ Linh',
          notes: 'Nhập bổ sung định kỳ từ đối tác phân phối chính hãng',
        },
        ...stockLogs,
      ]);

      // System Log
      setSystemLogs([
        {
          id: `LOG-${Date.now()}`,
          time: new Date().toISOString().replace('T', ' ').substring(0, 19),
          handler: 'Trần Thị Mỹ Linh (Kho)',
          action: 'Nhập kho bổ sung',
          details: `Bổ sung ${newVacQty} liều cho vắc-xin ${affected?.name}. Tổng tồn kho hiện tại: ${(affected?.stock || 0) + newVacQty}`,
        },
        ...systemLogs,
      ]);
    }

    // Reset input fields
    setNewVacName('');
    setNewVacCode('');
  };

  const handleExportSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const targetVac = vaccines.find((v) => v.id === exportVacId);
    if (!targetVac) return;

    if (exportQty > targetVac.stock) {
      triggerToast(`Lỗi xuất kho: Số lượng xuất (${exportQty}) vượt quá tồn kho thực tế (${targetVac.stock}).`);
      return;
    }

    const updated = vaccines.map((v) => {
      if (v.id === exportVacId) {
        const newQty = v.stock - exportQty;
        return {
          ...v,
          stock: newQty,
          status: newQty === 0 ? 'Đã hết' : newQty <= 50 ? 'Sắp hết' : 'Sẵn có' as any,
        };
      }
      return v;
    });

    setVaccines(updated);
    triggerToast(`Đã xuất và khấu trừ -${exportQty} liều vaccine ${targetVac.name}.`);

    // Record logs
    setStockLogs([
      {
        id: `SL-${Date.now()}`,
        vaccineName: targetVac.name,
        quantity: exportQty,
        type: 'Xuất kho',
        date: new Date().toISOString().split('T')[0],
        handler: 'Trần Thị Mỹ Linh',
        notes: exportNotes,
      },
      ...stockLogs,
    ]);

    setSystemLogs([
      {
        id: `LOG-${Date.now()}`,
        time: new Date().toISOString().replace('T', ' ').substring(0, 19),
        handler: 'Trần Thị Mỹ Linh (Kho)',
        action: 'Xuất kho vaccine',
        details: `Xuất và trừ hao ${exportQty} liều ${targetVac.name}. Tồn kho còn: ${targetVac.stock - exportQty}`,
      },
      ...systemLogs,
    ]);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">📦 Quản lý Kho Vắc-xin & Bảo quản lạnh</h2>
        <p className="text-sm text-slate-500 mt-1">Giám sát hạn sử dụng lô thuốc, nhiệt độ lạnh bảo quản, lập hóa đơn xuất nhập vật tư y khoa.</p>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 flex items-center justify-between shadow-sm">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Chủng loại Vắc-xin</p>
            <h3 className="text-2xl font-extrabold text-slate-800 mt-1">{vaccines.length} chủng loại</h3>
          </div>
          <Archive className="w-10 h-10 text-blue-500 bg-blue-50 p-2 rounded-lg" />
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 flex items-center justify-between shadow-sm">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Cảnh báo sắp hết</p>
            <h3 className={`text-2xl font-extrabold mt-1 ${lowStockCount > 0 ? 'text-amber-600' : 'text-slate-800'}`}>
              {lowStockCount} loại (&lt;=50 liều)
            </h3>
          </div>
          <AlertTriangle className={`w-10 h-10 p-2 rounded-lg ${lowStockCount > 0 ? 'text-amber-500 bg-amber-50' : 'text-slate-400 bg-slate-50'}`} />
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 flex items-center justify-between shadow-sm">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Tiêu chuẩn bảo quản</p>
            <h3 className="text-2xl font-extrabold text-emerald-600 mt-1">2°C - 8°C GSP</h3>
          </div>
          <HelpCircle className="w-10 h-10 text-emerald-500 bg-emerald-50 p-2 rounded-lg" />
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 flex items-center justify-between shadow-sm">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Tổng nhật ký kho</p>
            <h3 className="text-2xl font-extrabold text-slate-800 mt-1">{stockLogs.length} lần giao dịch</h3>
          </div>
          <FileSpreadsheet className="w-10 h-10 text-slate-500 bg-slate-50 p-2 rounded-lg" />
        </div>
      </div>

      {/* Navigation tabs */}
      <div className="border-b border-slate-200 flex space-x-2">
        <button
          onClick={() => setActiveTab('view')}
          className={`px-4 py-2.5 font-medium text-sm border-b-2 transition-colors ${
            activeTab === 'view' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          📂 Danh sách Vắc-xin tồn kho
        </button>
        <button
          onClick={() => setActiveTab('import')}
          className={`px-4 py-2.5 font-medium text-sm border-b-2 transition-colors ${
            activeTab === 'import' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          ➕ Nhập thuốc vào kho
        </button>
        <button
          onClick={() => setActiveTab('export')}
          className={`px-4 py-2.5 font-medium text-sm border-b-2 transition-colors ${
            activeTab === 'export' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          ➖ Xuất kho hao phí / Sử dụng
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`px-4 py-2.5 font-medium text-sm border-b-2 transition-colors ${
            activeTab === 'history' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          📜 Báo cáo Xuất - Nhập kho
        </button>
      </div>

      {/* Tabs Layout */}
      {activeTab === 'view' && (
        <div className="space-y-4">
          {/* Search Box & Filters */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nhập từ khóa cần tìm kiếm</label>
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Nhập thông tin tìm kiếm vắc-xin..."
                    className="w-full pl-9 pr-4 py-1.5 rounded-lg border border-slate-200 text-sm outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div>
                <span className="block text-xs font-bold text-slate-700 mb-1">Tiêu chí tìm kiếm</span>
                <div className="flex flex-wrap gap-4 mt-2">
                  <label className="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer">
                    <input
                      type="radio"
                      name="criteria"
                      checked={searchCriteria === 'name'}
                      onChange={() => setSearchCriteria('name')}
                      className="text-blue-600"
                    />
                    Tên vắc-xin
                  </label>
                  <label className="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer">
                    <input
                      type="radio"
                      name="criteria"
                      checked={searchCriteria === 'code'}
                      onChange={() => setSearchCriteria('code')}
                      className="text-blue-600"
                    />
                    Mã phòng bệnh (BCG,...)
                  </label>
                  <label className="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer">
                    <input
                      type="radio"
                      name="criteria"
                      checked={searchCriteria === 'origin'}
                      onChange={() => setSearchCriteria('origin')}
                      className="text-blue-600"
                    />
                    Nơi sản xuất
                  </label>
                  <label className="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer">
                    <input
                      type="radio"
                      name="criteria"
                      checked={searchCriteria === 'age'}
                      onChange={() => setSearchCriteria('age')}
                      className="text-blue-600"
                    />
                    Độ tuổi tiêm chủng
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
              <h3 className="font-semibold text-slate-800 text-sm">Danh Mục Vắc-xin & Bảo quản Y tế</h3>
              <div className="flex gap-2">
                <button
                  onClick={() => triggerToast('Đang tải tài liệu bảng tồn kho...')}
                  className="p-1 px-2.5 bg-white border border-slate-200 text-xs rounded font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Tải xuống Excel
                </button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse whitespace-nowrap">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold text-xs tracking-wider uppercase">
                    <th className="px-4 py-3">Tên vắc-xin / Phòng bệnh</th>
                    <th className="px-4 py-3">Mã phòng</th>
                    <th className="px-4 py-3">Hạn sử dụng</th>
                    <th className="px-4 py-3">Số giấy phép</th>
                    <th className="px-4 py-3">Nước sản xuất</th>
                    <th className="px-4 py-3">Hàm lượng</th>
                    <th className="px-4 py-3 text-center">Tồn kho (liều)</th>
                    <th className="px-4 py-3">Bảo quản lạnh</th>
                    <th className="px-4 py-3">Đối tượng độ tuổi</th>
                    <th className="px-4 py-3 text-right">Tình trạng</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-600">
                  {filteredVaccines.length > 0 ? (
                    filteredVaccines.map((v) => (
                      <tr key={v.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-4 py-3.5 font-bold text-slate-800">{v.name}</td>
                        <td className="px-4 py-3.5 font-mono text-xs">{v.code}</td>
                        <td className="px-4 py-3.5 text-xs text-red-600 font-semibold">{v.expiryDate}</td>
                        <td className="px-4 py-3.5 font-mono text-xs text-slate-400">{v.licenseNo}</td>
                        <td className="px-4 py-3.5">{v.origin}</td>
                        <td className="px-4 py-3.5 text-xs font-medium">{v.dosage}</td>
                        <td className="px-4 py-3.5 text-center font-bold text-slate-800">{v.stock}</td>
                        <td className="px-4 py-3.5 text-xs text-cyan-700 bg-cyan-50/50 px-2 py-0.5 rounded font-mono w-fit inline-block mt-3">{v.tempRange}</td>
                        <td className="px-4 py-3.5 text-xs text-slate-500">{v.ageGroup}</td>
                        <td className="px-4 py-3.5 text-right">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                              v.stock === 0
                                ? 'bg-red-50 text-red-700'
                                : v.stock <= 50
                                ? 'bg-amber-50 text-amber-700'
                                : 'bg-emerald-50 text-emerald-700'
                            }`}
                          >
                            ● {v.stock === 0 ? 'Hết hàng' : v.stock <= 50 ? 'Sắp hết' : 'Sẵn sàng'}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={10} className="px-4 py-10 text-center text-slate-400">
                        Không tìm thấy loại vaccine nào trùng khớp với từ khóa tìm kiếm.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'import' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-6">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-base font-bold text-slate-800">Cộng lô nhập kho và khai báo vaccine</h3>
              <p className="text-xs text-slate-500 mt-1">Cấp hạn ngạch mới hoặc cộng dồn vào lô hàng có sẵn trong phần mềm.</p>
            </div>
            <div className="flex bg-slate-100 p-1 rounded-lg">
              <button
                type="button"
                onClick={() => setIsNewVaccine(false)}
                className={`px-3 py-1 text-xs rounded-md font-semibold transition-all cursor-pointer ${
                  !isNewVaccine ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'
                }`}
              >
                Nhập bổ sung liên kết
              </button>
              <button
                type="button"
                onClick={() => setIsNewVaccine(true)}
                className={`px-3 py-1 text-xs rounded-md font-semibold transition-all cursor-pointer ${
                  isNewVaccine ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'
                }`}
              >
                Khai báo vắc-xin mới tinh
              </button>
            </div>
          </div>

          <form onSubmit={handleImportSubmit} className="space-y-4">
            {!isNewVaccine ? (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Chọn vắc-xin liên kết để tăng số lượng *</label>
                <select
                  value={selectedVaccineId}
                  onChange={(e) => setSelectedVaccineId(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg p-2.5 text-sm bg-white outline-none focus:ring-1 focus:ring-blue-500"
                >
                  {vaccines.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name} (Tồn hiện thực: {v.stock} liều)
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Tên Vắc-xin đầy đủ *</label>
                  <input
                    type="text"
                    required
                    placeholder="VD: Phòng Phế Cầu - Synflorix"
                    value={newVacName}
                    onChange={(e) => setNewVacName(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg p-2 text-sm outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Mã Viết Tắt (Kí hiệu) *</label>
                  <input
                    type="text"
                    required
                    placeholder="VD: SYNFLORIX"
                    value={newVacCode}
                    onChange={(e) => setNewVacCode(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg p-2 text-sm outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Số giấy đăng ký lưu hành y tế *</label>
                  <input
                    type="text"
                    required
                    value={newVacLicense}
                    onChange={(e) => setNewVacLicense(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg p-2 text-sm outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Nước sản xuất *</label>
                  <input
                    type="text"
                    required
                    value={newVacOrigin}
                    onChange={(e) => setNewVacOrigin(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg p-2 text-sm outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Hàm lượng / Liều tiêm (Dung tích) *</label>
                  <input
                    type="text"
                    required
                    value={newVacDosage}
                    onChange={(e) => setNewVacDosage(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg p-2 text-sm outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Nhiệt độ quy chuẩn trữ đông *</label>
                  <input
                    type="text"
                    required
                    value={newVacTemp}
                    onChange={(e) => setNewVacTemp(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg p-2 text-sm outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Đối tượng khuyến nghị *</label>
                  <input
                    type="text"
                    required
                    value={newVacAge}
                    onChange={(e) => setNewVacAge(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg p-2 text-sm outline-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Giá nhập kho (VND) *</label>
                    <input
                      type="number"
                      required
                      value={newImportPrice}
                      onChange={(e) => setNewImportPrice(Number(e.target.value))}
                      className="w-full border border-slate-200 rounded-lg p-2 text-sm outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Giá bán tiêm dịch vụ (VND) *</label>
                    <input
                      type="number"
                      required
                      value={newSellingPrice}
                      onChange={(e) => setNewSellingPrice(Number(e.target.value))}
                      className="w-full border border-slate-200 rounded-lg p-2 text-sm outline-none"
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-slate-100 pt-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Số lượng liều nhập mới *</label>
                <input
                  type="number"
                  min={1}
                  required
                  value={newVacQty}
                  onChange={(e) => setNewVacQty(Number(e.target.value))}
                  className="w-full border border-slate-200 rounded-lg p-2 text-sm outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Mốc thời hạn hết hạn lô hàng *</label>
                <input
                  type="date"
                  required
                  value={newVacExp}
                  onChange={(e) => setNewVacExp(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg p-2 text-sm outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-5 py-2.5 rounded-lg flex items-center gap-1.5 cursor-pointer shadow-sm transition-colors"
              >
                <PlusCircle className="w-4.5 h-4.5" /> Ghi nhận nhập kho và gửi phòng Kế Toán
              </button>
            </div>
          </form>
        </div>
      )}

      {activeTab === 'export' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-6">
          <div>
            <h3 className="text-base font-bold text-slate-800 font-sans">Mua xuất kho hao hụt, chuyển khoa hoặc tiêu độc thuốc hết hạn</h3>
            <p className="text-xs text-slate-500 mt-1">Xuất xả kho y khoa có ghi nhận biên bản số lượng và lý do thanh toán chi tiết.</p>
          </div>

          <form onSubmit={handleExportSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Chọn vắc-xin cần xuất kho *</label>
                <select
                  value={exportVacId}
                  onChange={(e) => setExportVacId(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg p-2.5 text-sm bg-white outline-none focus:ring-1 focus:ring-blue-500"
                >
                  {vaccines.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name} (Số lượng trong kho: {v.stock} liều)
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Số lượng xuất (liều) *</label>
                <input
                  type="number"
                  min={1}
                  required
                  value={exportQty}
                  onChange={(e) => setExportQty(Number(e.target.value))}
                  className="w-full border border-slate-200 rounded-lg p-2 text-sm outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Biên bản / Lý do xuất kho chính thức *</label>
              <textarea
                required
                value={exportNotes}
                onChange={(e) => setExportNotes(e.target.value)}
                placeholder="Ví dụ: Tiêm chủng mở rộng cơ sở 3, hủy liều nứt gãy vỏ bảo quản, hết hạn sử dụng không an toàn..."
                className="w-full border border-slate-200 rounded-lg p-3 text-sm h-24 outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold px-5 py-2.5 rounded-lg flex items-center gap-1.5 cursor-pointer shadow-sm transition-colors"
              >
                <MinusCircle className="w-4.5 h-4.5" /> Ghi nhận biên bản khấu trừ
              </button>
            </div>
          </form>
        </div>
      )}

      {activeTab === 'history' && (
        <div className="space-y-4 animate-fade-in">
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="p-4 bg-slate-50 border-b border-slate-200 text-slate-800 text-sm font-semibold">
              Nhật ký biến động kho bãi gần đây (Nhập kho & Xuất kho)
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 font-semibold text-xs tracking-wider border-b border-slate-200 uppercase">
                    <th className="px-5 py-3">Mã phiên giao dịch</th>
                    <th className="px-5 py-3">Vắc-xin biến động</th>
                    <th className="px-5 py-3 text-center">Biến động</th>
                    <th className="px-5 py-3">Phân loại</th>
                    <th className="px-5 py-3">Ngày thao tác</th>
                    <th className="px-5 py-3">Thủ kho ký duyệt</th>
                    <th className="px-5 py-3">Ghi chú biên bản</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700 text-xs">
                  {stockLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-5 py-3 font-mono font-bold text-slate-400">{log.id}</td>
                      <td className="px-5 py-3 font-semibold text-slate-900">{log.vaccineName}</td>
                      <td className={`px-5 py-3 text-center font-bold font-sans text-sm ${
                        log.type === 'Nhập kho' ? 'text-emerald-600' : 'text-red-500'
                      }`}>
                        {log.type === 'Nhập kho' ? `+${log.quantity}` : `-${log.quantity}`}
                      </td>
                      <td className="px-5 py-3">
                        <span className={`inline-flex px-2 py-0.5 rounded text-xs font-semibold ${
                          log.type === 'Nhập kho' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'
                        }`}>
                          {log.type}
                        </span>
                      </td>
                      <td className="px-5 py-3 font-mono text-slate-400">{log.date}</td>
                      <td className="px-5 py-3 font-semibold text-slate-800">{log.handler}</td>
                      <td className="px-5 py-3 text-slate-500 font-sans italic">{log.notes}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
