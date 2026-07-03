import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  Search, PlusCircle, MinusCircle, Edit, Trash2, X, Save,
  ChevronLeft, ChevronRight, RefreshCw, AlertCircle, Package, Activity, Truck
} from 'lucide-react';

// --- INTERFACES ---
export interface KhoVacXin {
  soLo: number;
  tenVacXin: string;
  maVacXin?: number;
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
  maNhaCungCap?: number;
  tenNhaCungCap?: string;
  tongTien?: number;
}

interface ItemDB { id: number; name: string; }
interface VacXinDB extends ItemDB { loaiVacXin?: any, hamLuong: string, hanSuDung: string, dieuKienBaoQuan: string, doTuoiTiemChung: string, donGia: number }

interface InventoryModuleProps { triggerToast: (msg: string) => void; }

export default function InventoryModule({ triggerToast }: InventoryModuleProps) {
  const [activeTab, setActiveTab] = useState<'view' | 'import' | 'export'>('view');
  
  // =========================================================================
  // BẢO MẬT & HÀM GỌI API CHUNG CÓ ĐÍNH KÈM TOKEN
  // =========================================================================
  const fetchWithAuth = async (url: string, options: RequestInit = {}) => {
    const token = localStorage.getItem("token");
    const headers = {
      ...options.headers,
      Authorization: `Bearer ${token}`,
    };
    const response = await fetch(url, { ...options, headers });
    
    if (response.status === 401 || response.status === 403) {
      triggerToast("Phiên đăng nhập đã hết hạn hoặc bạn không có quyền. Vui lòng đăng nhập lại!");
      return Promise.reject("Unauthorized");
    }
    return response;
  };

  // States
  const [vaccines, setVaccines] = useState<KhoVacXin[]>([]);
  const [loaiVacXinList, setLoaiVacXinList] = useState<ItemDB[]>([]);
  const [vacXinCatalog, setVacXinCatalog] = useState<VacXinDB[]>([]);
  const [supplierList, setSupplierList] = useState<ItemDB[]>([]);
  
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchInventoryData();
    fetchMetadata();
  }, []);

  const fetchInventoryData = async () => {
    try {
      setLoading(true);
      const res = await fetchWithAuth("http://localhost:8080/api/inventory/vaccines");
      if (!res.ok) throw new Error("Lỗi kết nối");
      setVaccines(await res.json());
      setError(null);
    } catch (err: any) {
      if (err !== "Unauthorized") setError(err.message);
    } finally { setLoading(false); }
  };

  const fetchMetadata = async () => {
    try {
      const [resType, resVac, resSup] = await Promise.all([
        fetchWithAuth("http://localhost:8080/api/inventory/vaccine-types"),
        fetchWithAuth("http://localhost:8080/api/inventory/vaccine-list"),
        fetchWithAuth("http://localhost:8080/api/inventory/suppliers")
      ]);
      if (resType.ok) {
        const data = await resType.json();
        setLoaiVacXinList(data.map((d: any) => ({ id: d.maLoaiVacXin, name: d.tenLoaiVacXin })));
      }
      if (resVac.ok) {
        const data = await resVac.json();
        setVacXinCatalog(data.map((d: any) => ({ 
          id: d.maVacXin, name: d.tenVacXin, loaiVacXin: d.loaiVacXin?.tenLoaiVacXin,
          hamLuong: d.hamLuong, hanSuDung: d.hanSuDung, dieuKienBaoQuan: d.dieuKienBaoQuan, doTuoiTiemChung: d.doTuoiTiemChung, donGia: d.donGia
        })));
      }
      if (resSup.ok) {
        const data = await resSup.json();
        setSupplierList(data.map((d: any) => ({ id: d.maNhaCungCap, name: d.tenNhaCungCap })));
      }
    } catch (e) { 
      if (e !== "Unauthorized") console.error("Lỗi lấy siêu dữ liệu", e); 
    }
  };

  // Lọc & Phân trang
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;
  
  const filteredVaccines = vaccines.filter(v => v.tenVacXin.toLowerCase().includes(searchQuery.toLowerCase()));
  const totalPages = Math.ceil(filteredVaccines.length / ITEMS_PER_PAGE) || 1;
  const currentVaccines = filteredVaccines.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  // Forms
  const [editingVacId, setEditingVacId] = useState<number | null>(null);
  const [itemToDelete, setItemToDelete] = useState<number | null>(null);
  
  const [importForm, setImportForm] = useState<Partial<KhoVacXin>>({
    soLuong: 0, donGia: 0, tongTien: 0, tinhTrang: 'Bình thường'
  });
  const [importErrors, setImportErrors] = useState<Record<string, string>>({});
  
  const [exportForm, setExportForm] = useState({ soLoId: '', soLuongXuat: '' });
  const [exportErrors, setExportErrors] = useState<Record<string, string>>({});

  // Trạng thái kiểm soát Disable
  const [isNewVaccine, setIsNewVaccine] = useState(false);
  const [isNewSupplier, setIsNewSupplier] = useState(false);

  const formatCurrency = (val: number | undefined) => val ? val.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") : '0';

  const handleDonGiaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, ''); 
    if (!val) {
      setImportForm({ ...importForm, donGia: 0 });
      setImportErrors({ ...importErrors, donGia: '' });
      return;
    }
    const num = Number(val);
    if (num < 10000000000) {
      setImportForm({ ...importForm, donGia: num });
      setImportErrors({ ...importErrors, donGia: '' });
    }
  };

  // TÁCH BIỆT: Xử lý riêng cho ô Tổng Tiền Hóa Đơn Nhập
  const handleTongTienChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, ''); 
    if (!val) {
      setImportForm({ ...importForm, tongTien: 0 });
      setImportErrors({ ...importErrors, tongTien: '' });
      return;
    }
    const num = Number(val);
    if (num < 100000000000) { // Giới hạn số tiền lớn
      setImportForm({ ...importForm, tongTien: num });
      setImportErrors({ ...importErrors, tongTien: '' });
    }
  };

  // Handle Vaccine Selection
  const handleSelectVaccine = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (val === 'OTHER') {
      setIsNewVaccine(true);
      setImportForm(prev => ({ ...prev, maVacXin: undefined, tenVacXin: '', loaiVacXin: '', hamLuong: '', hanSuDung: '', dieuKienBaoQuan: '', doTuoiTiemChung: '', donGia: 0 }));
    } else if (val) {
      setIsNewVaccine(false);
      const selected = vacXinCatalog.find(v => v.id === Number(val));
      if (selected) {
        setImportForm(prev => ({ 
          ...prev, maVacXin: selected.id, tenVacXin: selected.name, loaiVacXin: selected.loaiVacXin || '',
          hamLuong: selected.hamLuong, hanSuDung: selected.hanSuDung, dieuKienBaoQuan: selected.dieuKienBaoQuan, 
          doTuoiTiemChung: selected.doTuoiTiemChung, donGia: selected.donGia 
        }));
      }
    } else {
      setIsNewVaccine(false);
      setImportForm(prev => ({ ...prev, maVacXin: undefined }));
    }
  };

  // Handle Supplier Selection
  const handleSelectSupplier = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (val === 'OTHER') {
      setIsNewSupplier(true);
      setImportForm(prev => ({ ...prev, maNhaCungCap: undefined, tenNhaCungCap: '' }));
    } else if (val) {
      setIsNewSupplier(false);
      const selected = supplierList.find(s => s.id === Number(val));
      if (selected) {
        setImportForm(prev => ({ ...prev, maNhaCungCap: selected.id, tenNhaCungCap: selected.name }));
      }
    } else {
      setIsNewSupplier(false);
      setImportForm(prev => ({ ...prev, maNhaCungCap: undefined }));
    }
  };

  const handleSaveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    // Validate Lô & Hóa đơn
    if (!importForm.ngayNhan) newErrors.ngayNhan = "Vui lòng chọn ngày nhận";
    if (!importForm.soLuong || Number(importForm.soLuong) <= 0) newErrors.soLuong = "Số lượng phải > 0";
    if (!importForm.giayPhep?.trim()) newErrors.giayPhep = "Vui lòng nhập giấy phép";
    if (!importForm.nuocSanXuat?.trim()) newErrors.nuocSanXuat = "Vui lòng nhập nơi sản xuất";
    if (!importForm.tongTien || Number(importForm.tongTien) <= 0) newErrors.tongTien = "Tổng tiền HĐ phải > 0";

    // Validate Vaccine
    if (isNewVaccine) {
      if (!importForm.tenVacXin?.trim()) newErrors.tenVacXin = "Vui lòng nhập tên vắc-xin";
      if (!importForm.loaiVacXin?.trim()) newErrors.loaiVacXin = "Vui lòng nhập loại vắc-xin";
      if (!importForm.donGia || Number(importForm.donGia) <= 0) newErrors.donGia = "Đơn giá phải > 0";
      if (!importForm.hanSuDung) newErrors.hanSuDung = "Vui lòng chọn hạn SD";
      if (!importForm.hamLuong?.trim()) newErrors.hamLuong = "Vui lòng nhập hàm lượng";
      if (!importForm.dieuKienBaoQuan?.trim()) newErrors.dieuKienBaoQuan = "Vui lòng nhập ĐK bảo quản";
      if (!importForm.doTuoiTiemChung?.trim()) newErrors.doTuoiTiemChung = "Vui lòng nhập độ tuổi";
    } else {
      if (!importForm.maVacXin) newErrors.maVacXin = "Vui lòng chọn vắc-xin";
    }

    // Validate Supplier
    if (isNewSupplier) {
      if (!importForm.tenNhaCungCap?.trim()) newErrors.tenNhaCungCap = "Vui lòng nhập tên nhà CC";
    } else {
      if (!importForm.maNhaCungCap) newErrors.maNhaCungCap = "Vui lòng chọn nhà cung cấp";
    }

    if (Object.keys(newErrors).length > 0) {
      setImportErrors(newErrors);
      triggerToast("Vui lòng kiểm tra lại các trường bị lỗi viền đỏ.");
      return;
    }

    try {
      const payload = { 
        ...importForm, 
        soLo: editingVacId || null,
        maVacXin: isNewVaccine ? null : importForm.maVacXin,
        maNhaCungCap: isNewSupplier ? null : importForm.maNhaCungCap,
      };
      
      const res = await fetchWithAuth("http://localhost:8080/api/inventory/vaccines", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error("Lưu thất bại");
      triggerToast('Thao tác nhập kho thành công!');
      
      fetchInventoryData();
      fetchMetadata(); 
      setActiveTab('view');
    } catch (error) { 
      if (error !== "Unauthorized") triggerToast('Lỗi khi lưu Database'); 
    }
  };

  const handleExportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};

    if (!exportForm.soLoId) errors.soLoId = "Vui lòng chọn Lô vắc-xin";
    if (!exportForm.soLuongXuat || Number(exportForm.soLuongXuat) <= 0) errors.soLuongXuat = "Số lượng xuất phải > 0";

    if (Object.keys(errors).length > 0) {
      setExportErrors(errors);
      return;
    }

    const targetVac = vaccines.find(v => v.soLo === Number(exportForm.soLoId));
    if (targetVac) {
      if (Number(exportForm.soLuongXuat) > targetVac.soLuong) {
          setExportErrors({ soLuongXuat: "Số lượng xuất không được vượt quá số lượng tồn!" });
          return;
      }

      try {
        const res = await fetchWithAuth(`http://localhost:8080/api/inventory/vaccines/${targetVac.soLo}/export?quantity=${exportForm.soLuongXuat}`, { method: "POST" });
        if (!res.ok) throw new Error("Lỗi khi xuất kho");
        triggerToast("Xuất kho thành công");
        setExportForm({ soLoId: '', soLuongXuat: '' });
        setExportErrors({});
        fetchInventoryData(); setActiveTab('view');
      } catch (err: any) { 
        if (err !== "Unauthorized") triggerToast(err.message); 
      }
    }
  };

  const confirmDelete = async () => {
    if (itemToDelete === null) return;
    try {
      await fetchWithAuth(`http://localhost:8080/api/inventory/vaccines/${itemToDelete}`, { method: "DELETE" });
      triggerToast('Hủy Lô Vắc-xin thành công!');
      fetchInventoryData();
    } catch (err: any) { 
      if (err !== "Unauthorized") triggerToast('Lỗi xóa lô'); 
    } finally { setItemToDelete(null); }
  };

  const renderImportForm = () => (
    <form onSubmit={handleSaveSubmit} noValidate className="space-y-6">
      
      {/* PHẦN 1: THÔNG TIN LÔ */}
      <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 shadow-sm animate-fade-in">
        <h3 className="text-sm font-bold text-blue-700 flex items-center gap-2 mb-4 border-b border-slate-200 pb-2">
          <Package className="w-5 h-5"/> PHẦN 1: THÔNG TIN LÔ (BATCH) & HOÁ ĐƠN
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Ngày nhận (Nhập kho) <span className="text-red-500">*</span></label>
            <input 
              type="date" 
              value={importForm.ngayNhan || ''} 
              onChange={e => { setImportForm({...importForm, ngayNhan: e.target.value}); setImportErrors({...importErrors, ngayNhan: ""}); }} 
              className={`w-full px-3 py-2 border rounded-lg text-xs outline-none transition-colors ${importErrors.ngayNhan ? "border-red-500 bg-red-50 focus:border-red-500" : "border-slate-300 focus:border-blue-500"}`} 
            />
            {importErrors.ngayNhan && <p className="text-[10px] text-red-500 font-bold mt-1">{importErrors.ngayNhan}</p>}
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Số lượng nhập (liều) <span className="text-red-500">*</span></label>
            <input 
              type="number" min="1" 
              value={importForm.soLuong || ''} 
              onChange={e => { setImportForm({...importForm, soLuong: Number(e.target.value)}); setImportErrors({...importErrors, soLuong: ""}); }} 
              className={`w-full px-3 py-2 border rounded-lg text-xs font-bold outline-none transition-colors ${importErrors.soLuong ? "border-red-500 bg-red-50 focus:border-red-500 text-red-600" : "border-slate-300 focus:border-blue-500 text-blue-600"}`} 
            />
            {importErrors.soLuong && <p className="text-[10px] text-red-500 font-bold mt-1">{importErrors.soLuong}</p>}
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Tình trạng Lô <span className="text-red-500">*</span></label>
            <select 
              value={importForm.tinhTrang || 'Bình thường'} 
              onChange={e => setImportForm({...importForm, tinhTrang: e.target.value})} 
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="Bình thường">Bình thường</option>
              <option value="Cận date">Cận date</option>
              <option value="Hỏng/Lỗi">Hỏng/Lỗi</option>
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-slate-700 mb-1">Số giấy phép HQ / Lô SX <span className="text-red-500">*</span></label>
            <input 
              type="text" maxLength={50}
              value={importForm.giayPhep || ''} 
              onChange={e => { setImportForm({...importForm, giayPhep: e.target.value}); setImportErrors({...importErrors, giayPhep: ""}); }} 
              className={`w-full px-3 py-2 border rounded-lg text-xs outline-none transition-colors ${importErrors.giayPhep ? "border-red-500 bg-red-50 focus:border-red-500" : "border-slate-300 focus:border-blue-500"}`} 
            />
            {importErrors.giayPhep && <p className="text-[10px] text-red-500 font-bold mt-1">{importErrors.giayPhep}</p>}
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-slate-700 mb-1">Nơi sản xuất Lô <span className="text-red-500">*</span></label>
            <input 
              type="text" maxLength={100}
              value={importForm.nuocSanXuat || ''} 
              onChange={e => { setImportForm({...importForm, nuocSanXuat: e.target.value}); setImportErrors({...importErrors, nuocSanXuat: ""}); }} 
              className={`w-full px-3 py-2 border rounded-lg text-xs outline-none transition-colors ${importErrors.nuocSanXuat ? "border-red-500 bg-red-50 focus:border-red-500" : "border-slate-300 focus:border-blue-500"}`} 
            />
            {importErrors.nuocSanXuat && <p className="text-[10px] text-red-500 font-bold mt-1">{importErrors.nuocSanXuat}</p>}
          </div>
          
          <div className="col-span-1 md:col-span-4 bg-emerald-50/50 p-4 rounded-lg border border-emerald-200">
             <label className="block text-xs font-bold text-emerald-800 mb-1">Tổng tiền thanh toán Hóa đơn nhập (VNĐ) <span className="text-red-500">*</span></label>
             <input 
              type="text" 
              value={formatCurrency(importForm.tongTien)} 
              onChange={handleTongTienChange} 
              placeholder="VD: Nhập tổng giá trị lô hàng..."
              className={`w-full md:w-1/2 px-3 py-2.5 border rounded-lg text-sm font-bold outline-none transition-colors ${importErrors.tongTien ? "border-red-500 bg-red-50 focus:border-red-500 text-red-600" : "border-emerald-300 focus:border-emerald-500 text-emerald-700"}`} 
            />
            {importErrors.tongTien && <p className="text-[10px] text-red-500 font-bold mt-1">{importErrors.tongTien}</p>}
          </div>
        </div>
      </div>

      {/* PHẦN 2: THÔNG TIN VẮC XIN */}
      <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 shadow-sm animate-fade-in">
        <h3 className="text-sm font-bold text-indigo-700 flex items-center gap-2 mb-4 border-b border-slate-200 pb-2">
          <Activity className="w-5 h-5"/> PHẦN 2: CHỈ ĐỊNH VẮC XIN ĐƯỢC NHẬP
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
          <div className="col-span-4 bg-indigo-50/50 p-4 border border-indigo-200 rounded-lg">
            <label className="block text-sm font-bold text-indigo-800 mb-2">1. Chọn Vắc xin<span className="text-red-500">*</span></label>
            <select 
              value={isNewVaccine ? 'OTHER' : importForm.maVacXin || ''} 
              onChange={e => { handleSelectVaccine(e); setImportErrors({...importErrors, maVacXin: ""}); }} 
              className={`w-full md:w-1/2 px-3 py-2.5 border rounded-lg text-sm font-bold outline-none cursor-pointer transition-colors ${importErrors.maVacXin ? "border-red-500 bg-red-50 text-red-700" : "border-indigo-300 text-indigo-700 focus:border-indigo-500"}`}
            >
              <option value="">-- Click để chọn danh mục đã có --</option>
              {vacXinCatalog.map(v => <option key={v.id} value={v.id}>{v.name} (Giá bán ra: {formatCurrency(v.donGia)}đ)</option>)}
              <option value="OTHER">➕ TẠO DANH MỤC VẮC XIN HOÀN TOÀN MỚI...</option>
            </select>
            {importErrors.maVacXin && <p className="text-[10px] text-red-500 font-bold mt-1.5">{importErrors.maVacXin}</p>}
          </div>
          
          <div className="col-span-1 md:col-span-2">
            <label className="block text-xs font-bold text-slate-700 mb-1">Tên Vắc-xin {isNewVaccine && <span className="text-red-500">*</span>}</label>
            <input 
              type="text" maxLength={100}
              value={importForm.tenVacXin || ''} 
              onChange={e => { setImportForm({...importForm, tenVacXin: e.target.value}); setImportErrors({...importErrors, tenVacXin: ""}); }} 
              disabled={!isNewVaccine} 
              className={`w-full px-3 py-2 border rounded-lg text-xs font-bold outline-none transition-colors ${!isNewVaccine ? 'bg-slate-100 text-slate-500 border-slate-200 cursor-not-allowed' : (importErrors.tenVacXin ? 'border-red-500 bg-red-50 focus:border-red-500' : 'bg-white border-blue-400 focus:border-blue-600')}`} 
            />
            {importErrors.tenVacXin && <p className="text-[10px] text-red-500 font-bold mt-1">{importErrors.tenVacXin}</p>}
          </div>
          <div className="col-span-1">
            <label className="block text-xs font-bold text-slate-700 mb-1">Loại (Nhóm) {isNewVaccine && <span className="text-red-500">*</span>}</label>
            <input 
              type="text" maxLength={100}
              placeholder={isNewVaccine ? "VD: Cúm, Phế cầu..." : ""} 
              value={importForm.loaiVacXin || ''} 
              onChange={e => { setImportForm({...importForm, loaiVacXin: e.target.value}); setImportErrors({...importErrors, loaiVacXin: ""}); }} 
              disabled={!isNewVaccine} 
              className={`w-full px-3 py-2 border rounded-lg text-xs outline-none transition-colors ${!isNewVaccine ? 'bg-slate-100 text-slate-500 border-slate-200 cursor-not-allowed' : (importErrors.loaiVacXin ? 'border-red-500 bg-red-50 focus:border-red-500' : 'bg-white border-blue-400 focus:border-blue-600')}`} 
            />
            {importErrors.loaiVacXin && <p className="text-[10px] text-red-500 font-bold mt-1">{importErrors.loaiVacXin}</p>}
          </div>
          <div className="col-span-1">
            <label className="block text-xs font-bold text-slate-700 mb-1">Giá bán ra khách hàng (VNĐ) {isNewVaccine && <span className="text-red-500">*</span>}</label>
            <input 
              type="text" 
              value={formatCurrency(importForm.donGia)} 
              onChange={handleDonGiaChange} 
              disabled={!isNewVaccine} 
              className={`w-full px-3 py-2 border rounded-lg text-xs font-bold outline-none transition-colors ${!isNewVaccine ? 'bg-slate-100 text-slate-500 border-slate-200 cursor-not-allowed' : (importErrors.donGia ? 'border-red-500 bg-red-50 focus:border-red-500 text-red-600' : 'bg-white border-emerald-400 focus:border-emerald-600 text-emerald-700')}`} 
            />
            {importErrors.donGia && <p className="text-[10px] text-red-500 font-bold mt-1">{importErrors.donGia}</p>}
          </div>

          <div className="col-span-1">
            <label className="block text-xs font-bold text-slate-700 mb-1">Hạn sử dụng {isNewVaccine && <span className="text-red-500">*</span>}</label>
            <input 
              type="date" 
              value={importForm.hanSuDung || ''} 
              onChange={e => { setImportForm({...importForm, hanSuDung: e.target.value}); setImportErrors({...importErrors, hanSuDung: ""}); }} 
              disabled={!isNewVaccine} 
              className={`w-full px-3 py-2 border rounded-lg text-xs outline-none transition-colors ${!isNewVaccine ? 'bg-slate-100 text-slate-500 border-slate-200 cursor-not-allowed' : (importErrors.hanSuDung ? 'border-red-500 bg-red-50 focus:border-red-500' : 'bg-white border-blue-400 focus:border-blue-600')}`} 
            />
            {importErrors.hanSuDung && <p className="text-[10px] text-red-500 font-bold mt-1">{importErrors.hanSuDung}</p>}
          </div>
          <div className="col-span-1">
            <label className="block text-xs font-bold text-slate-700 mb-1">Hàm lượng {isNewVaccine && <span className="text-red-500">*</span>}</label>
            <input 
              type="text" maxLength={50}
              value={importForm.hamLuong || ''} 
              onChange={e => { setImportForm({...importForm, hamLuong: e.target.value}); setImportErrors({...importErrors, hamLuong: ""}); }} 
              disabled={!isNewVaccine} 
              className={`w-full px-3 py-2 border rounded-lg text-xs outline-none transition-colors ${!isNewVaccine ? 'bg-slate-100 text-slate-500 border-slate-200 cursor-not-allowed' : (importErrors.hamLuong ? 'border-red-500 bg-red-50 focus:border-red-500' : 'bg-white border-blue-400 focus:border-blue-600')}`} 
            />
            {importErrors.hamLuong && <p className="text-[10px] text-red-500 font-bold mt-1">{importErrors.hamLuong}</p>}
          </div>
          <div className="col-span-1">
            <label className="block text-xs font-bold text-slate-700 mb-1">ĐK Bảo quản {isNewVaccine && <span className="text-red-500">*</span>}</label>
            <input 
              type="text" maxLength={100}
              value={importForm.dieuKienBaoQuan || ''} 
              onChange={e => { setImportForm({...importForm, dieuKienBaoQuan: e.target.value}); setImportErrors({...importErrors, dieuKienBaoQuan: ""}); }} 
              disabled={!isNewVaccine} 
              className={`w-full px-3 py-2 border rounded-lg text-xs outline-none transition-colors ${!isNewVaccine ? 'bg-slate-100 text-slate-500 border-slate-200 cursor-not-allowed' : (importErrors.dieuKienBaoQuan ? 'border-red-500 bg-red-50 focus:border-red-500' : 'bg-white border-blue-400 focus:border-blue-600')}`} 
            />
            {importErrors.dieuKienBaoQuan && <p className="text-[10px] text-red-500 font-bold mt-1">{importErrors.dieuKienBaoQuan}</p>}
          </div>
          <div className="col-span-1">
            <label className="block text-xs font-bold text-slate-700 mb-1">Tuổi tiêm {isNewVaccine && <span className="text-red-500">*</span>}</label>
            <input 
              type="text" maxLength={100}
              value={importForm.doTuoiTiemChung || ''} 
              onChange={e => { setImportForm({...importForm, doTuoiTiemChung: e.target.value}); setImportErrors({...importErrors, doTuoiTiemChung: ""}); }} 
              disabled={!isNewVaccine} 
              className={`w-full px-3 py-2 border rounded-lg text-xs outline-none transition-colors ${!isNewVaccine ? 'bg-slate-100 text-slate-500 border-slate-200 cursor-not-allowed' : (importErrors.doTuoiTiemChung ? 'border-red-500 bg-red-50 focus:border-red-500' : 'bg-white border-blue-400 focus:border-blue-600')}`} 
            />
            {importErrors.doTuoiTiemChung && <p className="text-[10px] text-red-500 font-bold mt-1">{importErrors.doTuoiTiemChung}</p>}
          </div>
        </div>
      </div>

      {/* PHẦN 3: NHÀ CUNG CẤP */}
      <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 shadow-sm animate-fade-in mb-6">
        <h3 className="text-sm font-bold text-violet-700 flex items-center gap-2 mb-4 border-b border-slate-200 pb-2">
          <Truck className="w-5 h-5"/> PHẦN 3: ĐỐI TÁC NHÀ CUNG CẤP
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="bg-violet-50/50 p-4 border border-violet-200 rounded-lg">
             <label className="block text-sm font-bold text-violet-800 mb-2">1. Chọn Nhà CC<span className="text-red-500">*</span></label>
             <select 
              value={isNewSupplier ? 'OTHER' : importForm.maNhaCungCap || ''} 
              onChange={e => { handleSelectSupplier(e); setImportErrors({...importErrors, maNhaCungCap: ""}); }} 
              className={`w-full px-3 py-2.5 border rounded-lg text-sm font-bold outline-none cursor-pointer transition-colors ${importErrors.maNhaCungCap ? "border-red-500 bg-red-50 text-red-700" : "border-violet-300 text-violet-800 focus:border-violet-500"}`}
            >
              <option value="">-- Click để chọn nhà cung cấp --</option>
              {supplierList.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              <option value="OTHER">➕ TẠO DANH MỤC ĐỐI TÁC MỚI...</option>
            </select>
            {importErrors.maNhaCungCap && <p className="text-[10px] text-red-500 font-bold mt-1.5">{importErrors.maNhaCungCap}</p>}
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Tên Tổ chức / Nhà cung cấp {isNewSupplier && <span className="text-red-500">*</span>}</label>
            <input 
              type="text" maxLength={255}
              value={importForm.tenNhaCungCap || ''} 
              onChange={e => { setImportForm({...importForm, tenNhaCungCap: e.target.value}); setImportErrors({...importErrors, tenNhaCungCap: ""}); }} 
              disabled={!isNewSupplier} 
              className={`w-full px-3 py-3 border rounded-lg text-sm font-bold outline-none transition-colors ${!isNewSupplier ? 'bg-slate-100 text-slate-500 border-slate-200 cursor-not-allowed' : (importErrors.tenNhaCungCap ? 'border-red-500 bg-red-50 focus:border-red-500' : 'bg-white border-blue-400 focus:border-blue-600')}`} 
            />
            {importErrors.tenNhaCungCap && <p className="text-[10px] text-red-500 font-bold mt-1">{importErrors.tenNhaCungCap}</p>}
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-3 sticky bottom-4 bg-white/90 p-4 backdrop-blur-md rounded-xl border shadow-lg border-slate-200 z-50">
        <button type="button" onClick={() => setActiveTab('view')} className="px-6 py-2.5 border border-slate-300 rounded-lg text-sm font-semibold text-slate-700 bg-white hover:bg-slate-50 transition-colors">
          Hủy Bỏ
        </button>
        <button type="submit" className="px-6 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-bold shadow-md hover:bg-blue-700 flex items-center gap-2 transition-colors">
          <Save className="w-5 h-5" /> Lưu Biên Bản Nhập Kho
        </button>
      </div>
    </form>
  );

  return (
    <div className="space-y-6 animate-fade-in h-full flex flex-col pb-10">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">📦 Quản lý Kho bãi</h2>
        <p className="text-sm text-slate-500 mt-1">Quản lý nhập lô phức hợp, lưu trữ vắc-xin mới và tạo hóa đơn tự động.</p>
      </div>

      <div className="border-b border-slate-200 flex space-x-2">
        <button onClick={() => {setActiveTab('view'); setEditingVacId(null);}} className={`px-4 py-2.5 font-medium text-sm border-b-2 ${activeTab === 'view' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>Xem tình hình kho bãi</button>
        <button onClick={() => {setActiveTab('import'); setImportForm({soLuong:0, donGia:0, tongTien: 0, tinhTrang:'Bình thường'}); setIsNewVaccine(false); setIsNewSupplier(false); setImportErrors({});}} className={`px-4 py-2.5 font-medium text-sm border-b-2 flex items-center gap-1 ${activeTab === 'import' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}><PlusCircle className="w-4 h-4"/> Form Nhập Kho (Mới)</button>
        <button onClick={() => {setActiveTab('export'); setExportErrors({}); setExportForm({soLoId:'', soLuongXuat:''});}} className={`px-4 py-2.5 font-medium text-sm border-b-2 flex items-center gap-1 ${activeTab === 'export' ? 'border-amber-600 text-amber-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}><MinusCircle className="w-4 h-4"/> Xuất vắc-xin</button>
      </div>

      {activeTab === 'view' && (
        <div className="bg-white rounded-xl border border-slate-200 flex flex-col flex-1 overflow-hidden shadow-sm">
           <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
             <div className="relative w-[300px]">
               <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
               <input type="text" placeholder="Tìm kiếm nhanh tên vắc-xin..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 text-sm focus:border-blue-500 outline-none" />
             </div>
             <button onClick={fetchInventoryData} className="text-blue-600 text-xs font-semibold flex items-center gap-1 hover:underline"><RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Tải lại dữ liệu</button>
           </div>
           <div className="overflow-auto flex-1">
             <table className="w-full text-left text-xs table-fixed">
               <thead className="bg-slate-100 text-slate-500 font-bold sticky top-0 z-10 shadow-sm border-b border-slate-200">
                 <tr>
                   <th className="p-3.5 w-[10%]">Mã Lô</th>
                   <th className="p-3.5 w-[25%]">Tên Vắc xin</th>
                   <th className="p-3.5 w-[20%]">Loại (Nhóm)</th>
                   <th className="p-3.5 w-[15%] text-center">Hạn SD</th>
                   <th className="p-3.5 w-[10%] text-right">Tồn Kho</th>
                   <th className="p-3.5 w-[10%] text-center">Tình trạng</th>
                   <th className="p-3.5 w-[10%] text-center">Thao tác</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-slate-100">
                 {currentVaccines.length > 0 ? (
                   currentVaccines.map(v => (
                     <tr key={v.soLo} className="hover:bg-slate-50 transition-colors">
                       <td className="p-3.5 font-mono font-bold text-slate-400">#{v.soLo}</td>
                       <td className="p-3.5 font-bold text-blue-700 truncate">{v.tenVacXin}</td>
                       <td className="p-3.5 text-slate-600 truncate">{v.loaiVacXin}</td>
                       <td className="p-3.5 text-center text-red-600 font-mono font-semibold">{v.hanSuDung}</td>
                       <td className="p-3.5 text-right text-blue-600 font-extrabold">{v.soLuong}</td>
                       <td className="p-3.5 text-center">
                         <span className={`px-2 py-1 rounded text-[10px] font-bold border ${v.soLuong === 0 ? 'bg-red-50 text-red-700 border-red-200' : (v.soLuong <= 50 ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200')}`}>
                           {v.soLuong === 0 ? 'Đã hết' : (v.soLuong <= 50 ? 'Sắp hết' : 'Sẵn có')}
                         </span>
                       </td>
                       <td className="p-3.5 text-center">
                         <button onClick={() => setItemToDelete(v.soLo)} className="text-red-500 hover:text-red-700 p-1.5 bg-red-50 hover:bg-red-100 rounded transition-colors" title="Xóa Lô">
                           <Trash2 className="w-4 h-4"/>
                         </button>
                       </td>
                     </tr>
                   ))
                 ) : (
                   <tr>
                     <td colSpan={7} className="px-4 py-8 text-center text-slate-400 font-medium">Không tìm thấy dữ liệu vắc-xin.</td>
                   </tr>
                 )}
               </tbody>
             </table>
           </div>
        </div>
      )}

      {activeTab === 'import' && renderImportForm()}

      {activeTab === 'export' && (
        <form onSubmit={handleExportSubmit} className="bg-slate-50 p-6 rounded-xl border border-slate-200 space-y-5 animate-fade-in shadow-sm">
          <h3 className="font-bold text-amber-700 mb-4 text-sm border-b border-slate-200 pb-2 flex items-center gap-2">
            <MinusCircle className="w-5 h-5"/> XUẤT KHO VẮC-XIN (TRỪ TỒN)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Chọn Lô vắc-xin cần xuất <span className="text-red-500">*</span>
              </label>
              <select 
                value={exportForm.soLoId} 
                onChange={e => { setExportForm({...exportForm, soLoId: e.target.value}); setExportErrors({...exportErrors, soLoId: ""}); }} 
                className={`w-full px-3 py-2.5 border rounded-lg text-sm outline-none cursor-pointer transition-colors ${exportErrors.soLoId ? "border-red-500 bg-red-50 focus:border-red-500" : "border-slate-300 focus:border-amber-500"}`}
              >
                <option value="">-- Chọn Lô vắc xin --</option>
                {vaccines.filter(v => v.soLuong > 0).map(v => <option key={v.soLo} value={v.soLo}>Lô #{v.soLo} - {v.tenVacXin} (Tồn: {v.soLuong} liều)</option>)}
              </select>
              {exportErrors.soLoId && <p className="text-[10px] text-red-500 font-bold mt-1">{exportErrors.soLoId}</p>}
            </div>
            <div className="md:col-span-1">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Số lượng xuất (liều) <span className="text-red-500">*</span>
              </label>
              <input 
                type="number" min="1"
                value={exportForm.soLuongXuat} 
                onChange={e => { setExportForm({...exportForm, soLuongXuat: e.target.value}); setExportErrors({...exportErrors, soLuongXuat: ""}); }} 
                placeholder="Nhập số lượng..." 
                className={`w-full px-3 py-2.5 border rounded-lg text-sm font-bold outline-none transition-colors ${exportErrors.soLuongXuat ? "border-red-500 text-red-600 bg-red-50 focus:border-red-500" : "border-slate-300 text-amber-700 focus:border-amber-500"}`} 
              />
              {exportErrors.soLuongXuat && <p className="text-[10px] text-red-500 font-bold mt-1">{exportErrors.soLuongXuat}</p>}
            </div>
          </div>
          <div className="flex justify-end pt-4 border-t border-slate-200 mt-4">
            <button type="submit" className="px-6 py-2.5 bg-amber-600 text-white rounded-lg font-bold text-sm hover:bg-amber-700 flex items-center gap-2 shadow-sm transition-colors">
              <MinusCircle className="w-4 h-4"/> Xác nhận Trừ Kho
            </button>
          </div>
        </form>
      )}

      {/* Modal Xóa chung */}
      {itemToDelete !== null && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-xl shadow-xl w-[90%] max-w-md p-6 space-y-4">
            <div className="flex items-center gap-3 text-red-600 border-b border-slate-100 pb-3">
              <AlertCircle className="w-6 h-6" />
              <h3 className="text-lg font-bold">Xác nhận xóa dữ liệu</h3>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed">
              Bạn có chắc chắn muốn hủy lô vắc-xin <span className="font-bold text-red-600 font-mono">#{itemToDelete}</span> khỏi kho không? Dữ liệu này sẽ được ẩn khỏi hệ thống hiển thị.
            </p>
            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 mt-2">
              <button onClick={() => setItemToDelete(null)} className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-semibold text-slate-700 bg-white hover:bg-slate-50 transition-colors">
                Hủy bỏ
              </button>
              <button onClick={confirmDelete} className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700 transition-colors shadow-sm flex items-center gap-2">
                <Trash2 className="w-4 h-4"/> Xác nhận Xóa Lô
              </button>
            </div>
          </div>
        </div>, document.body
      )}
    </div>
  );
}