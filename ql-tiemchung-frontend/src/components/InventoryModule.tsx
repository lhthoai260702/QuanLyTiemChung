import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  Search,
  PlusCircle,
  MinusCircle,
  Edit,
  Trash2,
  X,
  Save,
  ChevronLeft,
  ChevronRight,
  Filter,
  RefreshCw,
  AlertCircle
} from 'lucide-react';

// --- ĐỊNH NGHĨA KIỂU DỮ LIỆU ĐỒNG BỘ VỚI BACKEND DTO ---
export interface KhoVacXin {
  soLo: number;           
  tenVacXin: string;      
  loaiVacXin: string;     
  ngayNhan: string;       
  giayPhep: string;       
  nuocSanXuat: string;    
  hamLuong: string;       
  hanSuDung: string;      
  dieuKienBaoQuan: string;
  doTuoiTiemChung: string;
  tinhTrang: string;      
  soLuong: number;        
  donGia?: number;        
}

// Kiểu dữ liệu cho danh mục Loại Vắc Xin từ DB
interface LoaiVacXinDB {
  maLoaiVacXin: number;
  tenLoaiVacXin: string;
}

interface InventoryModuleProps {
  triggerToast: (msg: string) => void;
}

export default function InventoryModule({ triggerToast }: InventoryModuleProps) {
  const [activeTab, setActiveTab] = useState<'view' | 'import' | 'export'>('view');
  
  // --- STATE DỮ LIỆU & API ---
  const [vaccines, setVaccines] = useState<KhoVacXin[]>([]);
  const [loaiVacXinList, setLoaiVacXinList] = useState<LoaiVacXinDB[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchInventoryData();
    fetchLoaiVacXinData();
  }, []);

  const fetchInventoryData = async () => {
    try {
      setLoading(true);
      const response = await fetch("http://localhost:8080/api/inventory/vaccines");
      if (!response.ok) throw new Error("Lỗi kết nối Database. Đang sử dụng dữ liệu mẫu.");
      const data = await response.json();
      setVaccines(data);
      setError(null);
    } catch (err: any) {
      setError(err.message);
      setVaccines([
        { soLo: 1001, tenVacXin: 'Synflorix', loaiVacXin: 'Phế cầu khuẩn', ngayNhan: '2024-06-01', giayPhep: 'GP123456', nuocSanXuat: 'Bỉ', hamLuong: '0.5ml', hanSuDung: '2026-12-31', dieuKienBaoQuan: '2°C - 8°C', doTuoiTiemChung: 'Trẻ sơ sinh', tinhTrang: 'Bình thường', soLuong: 150, donGia: 1050000 },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const fetchLoaiVacXinData = async () => {
    try {
      const response = await fetch("http://localhost:8080/api/inventory/vaccine-types");
      if (response.ok) {
        const data = await response.json();
        setLoaiVacXinList(data);
      }
    } catch (err) {
      console.error("Lỗi khi lấy danh mục loại vắc-xin", err);
    }
  };

  // --- STATE TÌM KIẾM, LỌC & PHÂN TRANG ---
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('Tất cả');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const ITEMS_PER_PAGE = 10; 

  const categories = useMemo(() => {
    const uniqueTypes = Array.from(new Set(vaccines.map(v => v.loaiVacXin)));
    return ['Tất cả', ...uniqueTypes];
  }, [vaccines]);

  const getCategoryCount = (cat: string) => {
    if (cat === 'Tất cả') return vaccines.length;
    return vaccines.filter(v => v.loaiVacXin === cat).length;
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, activeCategory]);

  const filteredVaccines = vaccines.filter((v) => {
    const matchSearch = v.tenVacXin.toLowerCase().includes(searchQuery.toLowerCase());
    const matchCategory = activeCategory === 'Tất cả' || v.loaiVacXin === activeCategory;
    return matchSearch && matchCategory;
  });

  const totalPages = Math.ceil(filteredVaccines.length / ITEMS_PER_PAGE) || 1;
  const currentVaccines = filteredVaccines.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // --- STATE FORMS ---
  const [editingVacId, setEditingVacId] = useState<number | null>(null);
  const [itemToDelete, setItemToDelete] = useState<number | null>(null);
  const [customTypeVal, setCustomTypeVal] = useState<string>('');
  
  const [importForm, setImportForm] = useState<Partial<KhoVacXin>>({
    tenVacXin: '', loaiVacXin: '', ngayNhan: '', giayPhep: '',
    nuocSanXuat: '', hamLuong: '', hanSuDung: '', dieuKienBaoQuan: '',
    doTuoiTiemChung: '', tinhTrang: 'Bình thường', soLuong: 0, donGia: 0
  });
  const [importErrors, setImportErrors] = useState<Record<string, string>>({});

  const [exportForm, setExportForm] = useState({ soLoId: '', soLuongXuat: '' });
  const [exportErrors, setExportErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    handleCancelForm();
    handleCancelExport();
  }, [activeTab]);

  // --- CÁC HÀM TIỆN ÍCH CHO NHẬP LIỆU ---
  const handleNumberOnlyChange = (setter: any, field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, ''); 
    setter((prev: any) => ({ ...prev, [field]: val }));
    setImportErrors((prev) => ({ ...prev, [field]: '' }));
    setExportErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const formatCurrency = (val: number | string | undefined) => {
    if (!val) return '';
    return val.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  const handleDonGiaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, ''); 
    if (!val) {
      setImportForm({ ...importForm, donGia: 0 });
      setImportErrors({ ...importErrors, donGia: '' });
      return;
    }
    
    const num = Number(val);
    if (num < 100000000000) {
      setImportForm({ ...importForm, donGia: num });
      setImportErrors({ ...importErrors, donGia: '' });
    }
  };

  const getDynamicStatus = (v: KhoVacXin) => {
    if (v.soLuong === 0) return 'Đã hết';
    if (v.soLuong <= 50) return 'Sắp hết';
    return v.tinhTrang || 'Sẵn có';
  };

  const handleEdit = (vac: KhoVacXin) => {
    setImportForm({ ...vac });
    setEditingVacId(vac.soLo);
    setImportErrors({});
  };

  // Hàm này chỉ làm nhiệm vụ mở Popup và lưu ID cần xóa
  const handleDelete = (soLo: number) => {
    setItemToDelete(soLo);
  };

  // Hàm này thực hiện gọi API xóa khi người dùng bấm "Xác nhận" trên Popup
  const confirmDelete = async () => {
    if (itemToDelete === null) return;
    
    try {
      const res = await fetch(`http://localhost:8080/api/inventory/vaccines/${itemToDelete}`, {
        method: "DELETE"
      });
      
      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText || "Lỗi khi xóa");
      }
      
      triggerToast('Hủy Lô Vắc-xin thành công!');
      fetchInventoryData(); // Tải lại danh sách
    } catch (err: any) {
      triggerToast('Lỗi: ' + err.message);
    } finally {
      setItemToDelete(null); // Đóng popup dù thành công hay thất bại
    }
  };

  // --- XỬ LÝ SUBMIT: THÊM / SỬA ---
  const handleSaveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};

    if (!importForm.tenVacXin?.trim()) errors.tenVacXin = 'Bắt buộc nhập tên vắc-xin';
    
    // --- BẮT ĐẦU: KIỂM TRA LOẠI VẮC XIN ---
    if (importForm.loaiVacXin === 'OTHER') {
      if (!customTypeVal.trim()) errors.customTypeVal = 'Bắt buộc nhập tên loại vắc-xin mới';
    } else if (!importForm.loaiVacXin?.trim()) {
      errors.loaiVacXin = 'Vui lòng chọn loại vắc-xin';
    }
    // --- KẾT THÚC: KIỂM TRA LOẠI VẮC XIN ---

    if (!importForm.ngayNhan) errors.ngayNhan = 'Bắt buộc chọn ngày nhận';
    if (!importForm.giayPhep?.trim()) errors.giayPhep = 'Bắt buộc nhập số giấy phép';
    if (!importForm.nuocSanXuat?.trim()) errors.nuocSanXuat = 'Bắt buộc nhập nơi sản xuất';
    if (!importForm.hamLuong?.trim()) errors.hamLuong = 'Bắt buộc nhập hàm lượng';
    if (!importForm.hanSuDung) errors.hanSuDung = 'Bắt buộc chọn hạn sử dụng';
    if (!importForm.dieuKienBaoQuan?.trim()) errors.dieuKienBaoQuan = 'Bắt buộc nhập điều kiện bảo quản';
    if (!importForm.doTuoiTiemChung?.trim()) errors.doTuoiTiemChung = 'Bắt buộc nhập độ tuổi tiêm chủng';
    
    if (importForm.soLuong === undefined || Number(importForm.soLuong) < 0 || importForm.soLuong.toString() === '') errors.soLuong = 'Số lượng không hợp lệ';
    if (!importForm.donGia || Number(importForm.donGia) <= 0) errors.donGia = 'Đơn giá phải lớn hơn 0';

    // === THÊM LOGIC KIỂM TRA NGÀY TẠI ĐÂY ===
    if (importForm.ngayNhan && importForm.hanSuDung) {
      const ngayNhanDate = new Date(importForm.ngayNhan);
      const hanSuDungDate = new Date(importForm.hanSuDung);
      
      // Nếu Hạn sử dụng nhỏ hơn hoặc bằng Ngày nhận
      if (hanSuDungDate <= ngayNhanDate) {
        errors.hanSuDung = 'Hạn sử dụng phải lớn hơn ngày nhận';
      }
    }
    // ========================================

    if (Object.keys(errors).length > 0) {
      setImportErrors(errors);
      triggerToast('Báo lỗi: Vui lòng kiểm tra các trường bị thiếu hoặc sai logic');
      return;
    }

    try {
      // --- BẮT ĐẦU: XỬ LÝ PAYLOAD GỬI XUỐNG BACKEND ---
      // Nếu chọn OTHER, lấy giá trị từ ô input customTypeVal, ngược lại lấy giá trị mặc định từ Select
      const finalLoaiVacXin = importForm.loaiVacXin === 'OTHER' ? customTypeVal.trim() : importForm.loaiVacXin;
      const payload = { ...importForm, loaiVacXin: finalLoaiVacXin, soLo: editingVacId || null };
      // --- KẾT THÚC: XỬ LÝ PAYLOAD GỬI XUỐNG BACKEND ---

      const res = await fetch("http://localhost:8080/api/inventory/vaccines", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error("Lưu thất bại");
      
      triggerToast(editingVacId ? 'Chỉnh sửa Lô vắc-xin thành công!' : 'Nhập Lô vắc-xin mới thành công');
      fetchInventoryData();
      handleCancelForm();
    } catch (error) {
      triggerToast('Lỗi khi lưu vào Database');
    }
  };

  const handleCancelForm = () => {
    setImportForm({
      tenVacXin: '', loaiVacXin: '', ngayNhan: '', giayPhep: '',
      nuocSanXuat: '', hamLuong: '', hanSuDung: '', dieuKienBaoQuan: '',
      doTuoiTiemChung: '', tinhTrang: 'Bình thường', soLuong: 0, donGia: 0
    });
    setEditingVacId(null);
    setImportErrors({});
    setCustomTypeVal('');
  };

  const handleExportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};

    if (!exportForm.soLoId) errors.soLoId = 'Vui lòng chọn Lô vắc-xin cần xuất';
    
    const qtyToExport = Number(exportForm.soLuongXuat);
    if (!exportForm.soLuongXuat || isNaN(qtyToExport) || qtyToExport <= 0) {
      errors.soLuongXuat = 'Báo lỗi: Số lượng xuất phải hợp lệ';
    }

    if (Object.keys(errors).length > 0) {
      setExportErrors(errors);
      triggerToast('Báo lỗi nhập liệu.');
      return;
    }

    const targetVac = vaccines.find(v => v.soLo === Number(exportForm.soLoId));
    if (targetVac) {
      if (qtyToExport > targetVac.soLuong) {
        setExportErrors({ soLuongXuat: 'Số lượng xuất vượt quá tồn kho' });
        triggerToast('Báo lỗi: Số lô vắc xin trong kho không đủ');
        return;
      }

      try {
        // Gọi API Backend thực hiện trừ tồn kho
        const res = await fetch(`http://localhost:8080/api/inventory/vaccines/${targetVac.soLo}/export?quantity=${qtyToExport}`, {
          method: "POST"
        });

        if (!res.ok) {
          const errText = await res.text();
          throw new Error(errText || "Lỗi khi xuất kho");
        }

        triggerToast(`Thông báo: Xuất thành công ${qtyToExport} liều từ Lô #${targetVac.soLo}`);
        handleCancelExport();
        fetchInventoryData(); // Tải lại dữ liệu trực tiếp từ CSDL sau khi xuất kho thành công
        setActiveTab('view'); // Tự động quay về Tab xem danh sách
      } catch (err: any) {
        triggerToast('Báo lỗi: ' + err.message);
      }
    }
  };

  const handleCancelExport = () => {
    setExportForm({ soLoId: '', soLuongXuat: '' });
    setExportErrors({});
  };

  // --- COMPONENT GIAO DIỆN FORM CÓ HIỂN THỊ ERROR ---
  const renderVaccineForm = () => (
    <form onSubmit={handleSaveSubmit} noValidate className="bg-slate-50 p-6 rounded-xl border border-blue-200 space-y-5 animate-fade-in shadow-sm ring-1 ring-blue-50">
      <div className="flex justify-between items-center border-b border-slate-200 pb-3">
        <h3 className="text-sm font-bold text-blue-700 flex items-center gap-2">
          {editingVacId ? <Edit className="w-5 h-5" /> : <PlusCircle className="w-5 h-5" />}
          {editingVacId ? `Chỉnh sửa Lô #${editingVacId}: ${importForm.tenVacXin}` : 'Nhập Lô Vắc-xin mới vào Hệ thống'}
        </h3>
        <button type="button" onClick={handleCancelForm} className="text-slate-400 hover:text-slate-600">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Cột 1 */}
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Tên vắc-xin <span className="text-red-500">*</span></label>
            <input 
              type="text" 
              maxLength={100}
              value={importForm.tenVacXin} 
              onChange={(e) => { setImportForm({...importForm, tenVacXin: e.target.value}); setImportErrors({...importErrors, tenVacXin: ''}); }} 
              className={`w-full bg-white px-3 py-2 border rounded-lg text-xs outline-none transition-colors ${importErrors.tenVacXin ? 'border-red-500 bg-red-50' : 'border-slate-200 focus:border-blue-500'}`} 
            />
            {importErrors.tenVacXin && <p className="text-[10px] text-red-500 font-bold mt-1">{importErrors.tenVacXin}</p>}
          </div>
          
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Loại vắc-xin <span className="text-red-500">*</span></label>
            <select 
              value={importForm.loaiVacXin} 
              onChange={(e) => { 
                setImportForm({...importForm, loaiVacXin: e.target.value}); 
                setImportErrors({...importErrors, loaiVacXin: ''}); 
              }} 
              className={`w-full bg-white px-3 py-2 border rounded-lg text-xs outline-none cursor-pointer transition-colors ${importErrors.loaiVacXin ? 'border-red-500 bg-red-50' : 'border-slate-200 focus:border-blue-500'}`}
            >
              <option value="">-- Chọn Loại Vắc-xin --</option>
              {loaiVacXinList.map((type) => (
                <option key={type.maLoaiVacXin} value={type.tenLoaiVacXin}>
                  {type.tenLoaiVacXin}
                </option>
              ))}
              {/* THÊM OPTION KHÁC VÀO ĐÂY */}
              <option value="OTHER" className="font-bold text-blue-600">➕ Khác (Thêm mới...)</option>
            </select>
            {importErrors.loaiVacXin && <p className="text-[10px] text-red-500 font-bold mt-1">{importErrors.loaiVacXin}</p>}

            {/* Ô INPUT XUẤT HIỆN KHI CHỌN "KHÁC" */}
            {importForm.loaiVacXin === 'OTHER' && (
              <div className="mt-2 animate-fade-in">
                <input 
                  type="text" 
                  placeholder="Nhập tên loại vắc-xin mới..." 
                  value={customTypeVal} 
                  onChange={(e) => { 
                    setCustomTypeVal(e.target.value); 
                    setImportErrors({...importErrors, customTypeVal: ''}); 
                  }} 
                  className={`w-full bg-blue-50/50 px-3 py-2 border rounded-lg text-xs outline-none transition-colors focus:bg-white ${importErrors.customTypeVal ? 'border-red-500 bg-red-50' : 'border-blue-300 focus:border-blue-500'}`}
                />
                {importErrors.customTypeVal && <p className="text-[10px] text-red-500 font-bold mt-1">{importErrors.customTypeVal}</p>}
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Nước sản xuất <span className="text-red-500">*</span></label>
            <input 
              type="text" 
              maxLength={50}
              value={importForm.nuocSanXuat} 
              onChange={(e) => { setImportForm({...importForm, nuocSanXuat: e.target.value}); setImportErrors({...importErrors, nuocSanXuat: ''}); }} 
              className={`w-full bg-white px-3 py-2 border rounded-lg text-xs outline-none transition-colors ${importErrors.nuocSanXuat ? 'border-red-500 bg-red-50' : 'border-slate-200 focus:border-blue-500'}`} 
            />
            {importErrors.nuocSanXuat && <p className="text-[10px] text-red-500 font-bold mt-1">{importErrors.nuocSanXuat}</p>}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Hàm lượng <span className="text-red-500">*</span></label>
            <input 
              type="text" 
              maxLength={50}
              value={importForm.hamLuong} 
              onChange={(e) => { setImportForm({...importForm, hamLuong: e.target.value}); setImportErrors({...importErrors, hamLuong: ''}); }} 
              className={`w-full bg-white px-3 py-2 border rounded-lg text-xs outline-none transition-colors ${importErrors.hamLuong ? 'border-red-500 bg-red-50' : 'border-slate-200 focus:border-blue-500'}`} 
            />
            {importErrors.hamLuong && <p className="text-[10px] text-red-500 font-bold mt-1">{importErrors.hamLuong}</p>}
          </div>
        </div>

        {/* Cột 2 */}
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Ngày nhận <span className="text-red-500">*</span></label>
            <input 
              type="date" 
              value={importForm.ngayNhan} 
              onChange={(e) => { setImportForm({...importForm, ngayNhan: e.target.value}); setImportErrors({...importErrors, ngayNhan: ''}); }} 
              className={`w-full bg-white px-3 py-2 border rounded-lg text-xs outline-none transition-colors ${importErrors.ngayNhan ? 'border-red-500 bg-red-50' : 'border-slate-200 focus:border-blue-500'}`} 
            />
            {importErrors.ngayNhan && <p className="text-[10px] text-red-500 font-bold mt-1">{importErrors.ngayNhan}</p>}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Hạn sử dụng <span className="text-red-500">*</span></label>
            <input 
              type="date" 
              value={importForm.hanSuDung} 
              onChange={(e) => { setImportForm({...importForm, hanSuDung: e.target.value}); setImportErrors({...importErrors, hanSuDung: ''}); }} 
              className={`w-full bg-white px-3 py-2 border rounded-lg text-xs outline-none transition-colors ${importErrors.hanSuDung ? 'border-red-500 bg-red-50' : 'border-slate-200 focus:border-blue-500'}`} 
            />
            {importErrors.hanSuDung && <p className="text-[10px] text-red-500 font-bold mt-1">{importErrors.hanSuDung}</p>}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Bảo quản (Nhiệt độ) <span className="text-red-500">*</span></label>
            <input 
              type="text" 
              maxLength={50} 
              value={importForm.dieuKienBaoQuan} 
              onChange={(e) => { setImportForm({...importForm, dieuKienBaoQuan: e.target.value}); setImportErrors({...importErrors, dieuKienBaoQuan: ''}); }} 
              placeholder="VD: 2°C - 8°C" 
              className={`w-full bg-white px-3 py-2 border rounded-lg text-xs outline-none transition-colors ${importErrors.dieuKienBaoQuan ? 'border-red-500 bg-red-50' : 'border-slate-200 focus:border-blue-500'}`} 
            />
            {importErrors.dieuKienBaoQuan && <p className="text-[10px] text-red-500 font-bold mt-1">{importErrors.dieuKienBaoQuan}</p>}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Độ tuổi tiêm chủng <span className="text-red-500">*</span></label>
            <input 
              type="text" 
              maxLength={50}
              value={importForm.doTuoiTiemChung} 
              onChange={(e) => { setImportForm({...importForm, doTuoiTiemChung: e.target.value}); setImportErrors({...importErrors, doTuoiTiemChung: ''}); }} 
              className={`w-full bg-white px-3 py-2 border rounded-lg text-xs outline-none transition-colors ${importErrors.doTuoiTiemChung ? 'border-red-500 bg-red-50' : 'border-slate-200 focus:border-blue-500'}`} 
            />
            {importErrors.doTuoiTiemChung && <p className="text-[10px] text-red-500 font-bold mt-1">{importErrors.doTuoiTiemChung}</p>}
          </div>
        </div>

        {/* Cột 3 */}
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Giấy phép ĐK (Số) <span className="text-red-500">*</span></label>
            <input 
              type="text" 
              maxLength={20}
              value={importForm.giayPhep} 
              onChange={handleNumberOnlyChange(setImportForm, 'giayPhep')} 
              className={`w-full bg-white px-3 py-2 border rounded-lg text-xs outline-none transition-colors ${importErrors.giayPhep ? 'border-red-500 bg-red-50' : 'border-slate-200 focus:border-blue-500'}`} 
            />
            {importErrors.giayPhep && <p className="text-[10px] text-red-500 font-bold mt-1">{importErrors.giayPhep}</p>}
          </div>

          <div className="bg-blue-50/50 p-3 rounded-lg border border-blue-100">
            <label className="block text-xs font-bold text-slate-700 mb-1">Số lượng tồn kho (liều) <span className="text-red-500">*</span></label>
            <input 
              type="text" 
              maxLength={7}
              value={importForm.soLuong ?? ''} 
              onChange={handleNumberOnlyChange(setImportForm, 'soLuong')} 
              className={`w-full bg-white px-3 py-2 border rounded-lg text-xs font-bold text-blue-600 outline-none transition-colors ${importErrors.soLuong ? 'border-red-500 bg-red-50' : 'border-blue-200 focus:border-blue-500'}`} 
            />
            {importErrors.soLuong && <p className="text-[10px] text-red-500 font-bold mt-1">{importErrors.soLuong}</p>}
          </div>

          <div className="bg-emerald-50/50 p-3 rounded-lg border border-emerald-100">
            <label className="block text-xs font-bold text-slate-700 mb-1">Đơn giá (VND) <span className="text-red-500">*</span></label>
            <input 
              type="text" 
              value={formatCurrency(importForm.donGia)} 
              onChange={handleDonGiaChange} 
              placeholder="VD: 1,050,000"
              className={`w-full bg-white px-3 py-2 border rounded-lg text-xs font-bold text-emerald-600 outline-none transition-colors ${importErrors.donGia ? 'border-red-500 bg-red-50' : 'border-emerald-200 focus:border-emerald-500'}`} 
            />
            {importErrors.donGia && <p className="text-[10px] text-red-500 font-bold mt-1">{importErrors.donGia}</p>}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Tình trạng Lô</label>
            <select value={importForm.tinhTrang} onChange={(e) => setImportForm({...importForm, tinhTrang: e.target.value})} className="w-full bg-white px-3 py-2 border border-slate-200 rounded-lg text-xs outline-none focus:border-blue-500">
              <option value="Bình thường">Bình thường</option>
              <option value="Cận date">Cận date</option>
              <option value="Hỏng/Lỗi">Hỏng/Lỗi</option>
            </select>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-4 border-t border-slate-200">
        <button type="button" onClick={handleCancelForm} className="px-5 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-600 bg-white hover:bg-slate-50 transition-colors">Hủy</button>
        <button type="submit" className="px-5 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold shadow-sm hover:bg-blue-700 flex items-center gap-1.5 transition-colors">
          <Save className="w-4 h-4" /> {editingVacId ? 'Cập nhật Lô' : 'Nhập Kho'}
        </button>
      </div>
    </form>
  );

  return (
    <div className="space-y-6 animate-fade-in h-full flex flex-col">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">📦 Quản lý Kho bãi</h2>
        <p className="text-sm text-slate-500 mt-1">Quản lý chi tiết số lượng, xuất/nhập, hạn sử dụng theo từng Lô Vắc-xin.</p>
      </div>

      <div className="border-b border-slate-200 flex space-x-2">
        <button onClick={() => setActiveTab('view')} className={`px-4 py-2.5 font-medium text-sm border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'view' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>
          <Search className="w-4 h-4" /> Xem tình hình kho bãi
        </button>
        <button onClick={() => setActiveTab('import')} className={`px-4 py-2.5 font-medium text-sm border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'import' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>
          <PlusCircle className="w-4 h-4" /> Nhập vắc-xin (Lô mới)
        </button>
        <button onClick={() => setActiveTab('export')} className={`px-4 py-2.5 font-medium text-sm border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'export' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>
          <MinusCircle className="w-4 h-4" /> Xuất vắc-xin (Trừ kho)
        </button>
      </div>

      {error && (
        <div className="p-3 bg-amber-50 text-amber-700 border border-amber-200 rounded-lg text-sm flex items-center gap-2">
          <AlertCircle size={18} /> {error}
        </div>
      )}

      {/* --- VIEW TAB --- */}
      {activeTab === 'view' && (
        <div className="space-y-4 flex-1 flex flex-col min-h-0">
          {editingVacId && renderVaccineForm()}

          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4 shrink-0">
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
              <div className="w-full sm:w-1/3 relative">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Tìm tên vắc-xin..." className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-blue-100" />
              </div>

              <div className="w-full sm:w-2/3 flex flex-wrap items-center justify-end gap-2">
                <Filter className="w-4 h-4 text-slate-400 mr-1" />
                {categories.map((cat) => {
                  const count = getCategoryCount(cat);
                  return (
                    <button key={cat} onClick={() => setActiveCategory(cat)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${activeCategory === cat ? "bg-slate-800 text-white border-slate-800 shadow-md" : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"}`}>
                      <span>{cat}</span>
                      <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${activeCategory === cat ? "bg-slate-600 text-slate-100" : "bg-slate-100 text-slate-500"}`}>{count}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col flex-1 overflow-hidden">
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
              <span className="font-bold text-xs text-slate-500 uppercase tracking-wider">Danh Mục Lô Vắc-xin Trong Kho</span>
              <button onClick={fetchInventoryData} className="text-blue-600 text-xs flex items-center gap-1 hover:underline">
                <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Làm mới dữ liệu
              </button>
            </div>
            
            <div className="overflow-y-auto overflow-x-hidden flex-1">
              {/* Thêm table-fixed và bỏ min-w-[800px] */}
              <table className="w-full text-left text-xs border-collapse table-fixed">
                <thead className="sticky top-0 bg-slate-50 z-10 shadow-sm">
                  <tr className="text-slate-500 font-bold border-b border-slate-200 uppercase">
                    {/* Giảm nhẹ padding ngang (px-2) để tối ưu không gian trên màn hình nhỏ */}
                    <th className="px-2 sm:px-3 py-3 w-[10%]">Mã Lô</th>
                    <th className="px-2 sm:px-3 py-3 w-[25%]">Tên vắc-xin</th>
                    <th className="px-2 sm:px-3 py-3 w-[20%]">Loại (Nhóm)</th>
                    <th className="px-2 sm:px-3 py-3 w-[15%] text-center">Hạn SD</th>
                    <th className="px-2 sm:px-3 py-3 w-[10%] text-right">Tồn</th>
                    <th className="px-2 sm:px-3 py-3 w-[10%] text-center">Tình trạng</th>
                    <th className="px-2 sm:px-3 py-3 w-[10%] text-center">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {loading ? (
                    <tr><td colSpan={7} className="text-center py-10 text-slate-500">Đang tải dữ liệu từ CSDL...</td></tr>
                  ) : currentVaccines.length > 0 ? (
                    currentVaccines.map((v) => {
                      const status = getDynamicStatus(v);
                      return (
                        <tr key={v.soLo} className="hover:bg-slate-50/50">
                          {/* Thêm break-words vào tất cả các ô để chữ dài tự xuống dòng */}
                          <td className="px-2 sm:px-3 py-3.5 font-bold text-slate-500 break-words">#{v.soLo}</td>
                          <td className="px-2 sm:px-3 py-3.5 font-bold text-blue-800 break-words">{v.tenVacXin}</td>
                          <td className="px-2 sm:px-3 py-3.5 break-words">{v.loaiVacXin}</td>
                          <td className="px-2 sm:px-3 py-3.5 text-center font-mono text-red-600 font-semibold break-words">{v.hanSuDung}</td>
                          <td className="px-2 sm:px-3 py-3.5 text-right font-extrabold text-blue-600 break-words">{v.soLuong}</td>
                          <td className="px-2 sm:px-3 py-3.5 text-center">
                            {/* Cho phép text trạng thái xuống dòng nếu cột quá nhỏ */}
                            <span className={`inline-block px-1.5 py-1 rounded-md text-[10px] font-bold whitespace-normal break-words ${
                              status === 'Đã hết' ? 'bg-red-50 text-red-700 border-red-200' :
                              status === 'Sắp hết' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                              status === 'Hỏng/Lỗi' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                              'bg-emerald-50 text-emerald-700 border-emerald-200'
                            } border`}>{status}</span>
                          </td>
                          <td className="px-2 sm:px-3 py-3.5">
                            {/* Dùng flex-wrap thay vì whitespace-nowrap để các nút tự rớt dòng khi chật */}
                            <div className="flex items-center justify-center gap-1 flex-wrap">
                              <button onClick={() => handleEdit(v)} className="text-blue-600 bg-blue-50 hover:bg-blue-100 p-1.5 rounded"><Edit className="w-4 h-4" /></button>
                              <button onClick={() => handleDelete(v.soLo)} className="text-red-600 bg-red-50 hover:bg-red-100 p-1.5 rounded"><Trash2 className="w-4 h-4" /></button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr><td colSpan={7} className="px-4 py-8 text-center text-red-500 font-semibold bg-red-50/30">Báo lỗi: Không có vắc xin cần tìm</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 bg-slate-50/50 shrink-0">
                <span className="text-[11px] font-semibold text-slate-500">Đang hiển thị {(currentPage - 1) * ITEMS_PER_PAGE + 1} - {Math.min(currentPage * ITEMS_PER_PAGE, filteredVaccines.length)} / {filteredVaccines.length}</span>
                <div className="flex items-center gap-1">
                  <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-1 border border-slate-200 rounded hover:bg-white disabled:opacity-40"><ChevronLeft className="w-4 h-4" /></button>
                  <span className="text-[11px] font-bold px-3 py-1 bg-white border border-slate-200 rounded">{currentPage} / {totalPages}</span>
                  <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="p-1 border border-slate-200 rounded hover:bg-white disabled:opacity-40"><ChevronRight className="w-4 h-4" /></button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* --- IMPORT TAB --- */}
      {activeTab === 'import' && <div className="animate-fade-in">{renderVaccineForm()}</div>}

      {/* --- EXPORT TAB --- */}
      {activeTab === 'export' && (
        <form onSubmit={handleExportSubmit} noValidate className="bg-amber-50/30 p-6 rounded-xl border border-amber-200 space-y-5 animate-fade-in shadow-sm ring-1 ring-amber-50">
          <div className="flex justify-between items-center border-b border-amber-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-amber-700 flex items-center gap-2"><MinusCircle className="w-5 h-5" /> Xuất vắc-xin khỏi Kho</h3>
              <p className="text-[11px] text-amber-600/70 mt-1">Lưu ý: Chỉ chọn được những Lô (LoVacXin) đang còn số lượng lớn hơn 0.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Chọn Lô Vắc-xin cần xuất <span className="text-red-500">*</span></label>
              <select value={exportForm.soLoId} onChange={(e) => { setExportForm({...exportForm, soLoId: e.target.value}); setExportErrors({...exportErrors, soLoId: ''}); }} className={`w-full bg-white px-3 py-2.5 border rounded-lg text-xs outline-none transition-colors cursor-pointer ${exportErrors.soLoId ? 'border-red-500 bg-red-50' : 'border-slate-300 focus:border-amber-500'}`}>
                <option value="">-- Chọn Lô Vắc-xin --</option>
                {vaccines.filter(v => v.soLuong > 0).map((v) => (
                  <option key={v.soLo} value={v.soLo}>
                    Lô #{v.soLo} | {v.tenVacXin} - {v.loaiVacXin} (Tồn: {v.soLuong} liều)
                  </option>
                ))}
              </select>
              {exportErrors.soLoId && <p className="text-[10px] text-red-500 font-bold mt-1">{exportErrors.soLoId}</p>}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Nhập số lượng cần xuất (Liều) <span className="text-red-500">*</span></label>
              <input 
                type="text" 
                maxLength={7}
                value={exportForm.soLuongXuat} 
                onChange={handleNumberOnlyChange(setExportForm, 'soLuongXuat')} 
                placeholder="Nhập số lượng..." 
                className={`w-full bg-white px-3 py-2.5 border rounded-lg text-xs font-bold outline-none transition-colors ${exportErrors.soLuongXuat ? 'border-red-500 text-red-600 bg-red-50' : 'border-slate-300 focus:border-amber-500'}`} 
              />
              {exportErrors.soLuongXuat && <p className="text-[10px] text-red-500 font-bold mt-1">{exportErrors.soLuongXuat}</p>}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-amber-100">
            <button type="button" onClick={handleCancelExport} className="px-5 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-600 bg-white hover:bg-slate-50 transition-colors">Hủy</button>
            <button type="submit" className="px-5 py-2 bg-amber-600 text-white rounded-lg text-xs font-semibold shadow-sm hover:bg-amber-700 flex items-center gap-1.5 transition-colors"><MinusCircle className="w-4 h-4" /> Xác nhận Xuất Kho</button>
          </div>
        </form>
      )}
      {/* --- CUSTOM CONFIRM DELETE POPUP DÙNG PORTAL --- */}
      {itemToDelete !== null && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-[90%] max-w-md p-6 space-y-4">
            <div className="flex items-center gap-3 text-red-600 border-b border-slate-100 pb-3">
              <AlertCircle className="w-6 h-6" />
              <h3 className="text-lg font-bold">Xác nhận xóa dữ liệu</h3>
            </div>
            <p className="text-sm text-slate-600">
              Bạn có chắc chắn muốn hủy lô vắc-xin <span className="font-bold text-red-600">#{itemToDelete}</span> khỏi kho không? Dữ liệu này sẽ được ẩn khỏi hệ thống.
            </p>
            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                onClick={() => setItemToDelete(null)}
                className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-semibold text-slate-700 bg-white hover:bg-slate-50 transition-colors"
              >
                Hủy bỏ
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700 transition-colors shadow-sm flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" /> Xác nhận Xóa
              </button>
            </div>
          </div>
        </div>,
        document.body // Đẩy UI này ra thẳng thẻ <body> của trình duyệt
      )}
    </div>
  );
}