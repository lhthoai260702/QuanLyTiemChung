import React, { useState, useEffect } from "react";
import { Invoice, Vaccine, SystemLog } from "../types";
import {
  CreditCard,
  DollarSign,
  Plus,
  Check,
  X,
  Edit,
  Trash2,
  Search,
  Save,
  TrendingUp,
  ShoppingCart,
  Truck,
  Tag,
  Banknote,
  Package,
  Activity,
} from "lucide-react";

interface FinanceModuleProps {
  invoices: Invoice[];
  setInvoices: React.Dispatch<React.SetStateAction<Invoice[]>>;
  vaccines: Vaccine[];
  systemLogs: SystemLog[];
  setSystemLogs: React.Dispatch<React.SetStateAction<SystemLog[]>>;
  triggerToast: (msg: string) => void;
}

// Model tương ứng với DTO CustomerTransactionProjection
export interface CustomerTransaction {
  id: string;
  date: string;
  vaccineCode: string; // Bản chất là Tên vắc-xin do query SQL gán Alias
  quantity: number;
  customerName: string;
  price: number;
}

export interface VaccinePrice {
  id: string;
  name: string;
  dosage: string;
  year: string;
  price: number;
}

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

interface ItemDB {
  id: number;
  name: string;
}
interface VacXinDB extends ItemDB {
  loaiVacXin?: any;
  hamLuong: string;
  hanSuDung: string;
  dieuKienBaoQuan: string;
  doTuoiTiemChung: string;
  donGia: number;
}

export default function FinanceModule({ invoices, setInvoices, vaccines, systemLogs, setSystemLogs, triggerToast }: FinanceModuleProps) {
  const [activeTab, setActiveTab] = useState<"customer_tx" | "supplier_tx" | "pricing">("customer_tx");

  const formatCurrencyInput = (value: number | undefined) => {
    if (!value || value === 0) return "";
    return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  const formatCurrency = (val: number | undefined) => (val ? val.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") : "0");

  // --- STATE: METADATA CHO FORM ---
  const [loaiVacXinList, setLoaiVacXinList] = useState<ItemDB[]>([]);
  const [vacXinCatalog, setVacXinCatalog] = useState<VacXinDB[]>([]);
  const [supplierList, setSupplierList] = useState<ItemDB[]>([]);

  // ==========================================
  // STATE: GIAO DỊCH VỚI KHÁCH HÀNG
  // ==========================================
  const [customerTxs, setCustomerTxs] = useState<CustomerTransaction[]>([]);
  const [searchCustomerQuery, setSearchCustomerQuery] = useState("");
  const [showCustomerForm, setShowCustomerForm] = useState(false);
  const [editingCustomerTxId, setEditingCustomerTxId] = useState<string | null>(null);

  const [customerForm, setCustomerForm] = useState<CustomerTransaction>({
    id: "",
    date: "",
    vaccineCode: "",
    quantity: 1,
    customerName: "",
    price: 0,
  });

  // ==========================================
  // STATE: GIAO DỊCH VỚI NHÀ CUNG CẤP (SUPPLIER - KHO)
  // ==========================================
  const [supplierTxs, setSupplierTxs] = useState<KhoVacXin[]>([]);
  const [searchSupplierQuery, setSearchSupplierQuery] = useState("");
  const [showSupplierForm, setShowSupplierForm] = useState(false);
  const [editingSupplierTxId, setEditingSupplierTxId] = useState<number | null>(null);

  const [supplierForm, setSupplierForm] = useState<Partial<KhoVacXin>>({
    soLuong: 0,
    donGia: 0,
    tongTien: 0,
    tinhTrang: "Bình thường",
  });
  const [supplierErrors, setSupplierErrors] = useState<Record<string, string>>({});
  const [isNewVaccine, setIsNewVaccine] = useState(false);
  const [isNewSupplier, setIsNewSupplier] = useState(false);

  // ==========================================
  // STATE: QUẢN LÝ GIÁ VẮC XIN TỪ DATABASE
  // ==========================================
  const [vaccinePrices, setVaccinePrices] = useState<VaccinePrice[]>([]);
  const [searchPriceQuery, setSearchPriceQuery] = useState("");
  const [showPriceForm, setShowPriceForm] = useState(false);
  const [editingPriceId, setEditingPriceId] = useState<string | null>(null);

  const [priceForm, setPriceForm] = useState<VaccinePrice>({
    id: "",
    name: "",
    dosage: "",
    year: "",
    price: 0,
  });

  // ==========================================
  // CALL API
  // ==========================================
  const fetchMetadata = async () => {
    try {
      const [resType, resVac, resSup] = await Promise.all([
        fetch("http://localhost:8080/api/inventory/vaccine-types"),
        fetch("http://localhost:8080/api/inventory/vaccine-list"),
        fetch("http://localhost:8080/api/inventory/suppliers"),
      ]);
      if (resType.ok) {
        const data = await resType.json();
        setLoaiVacXinList(data.map((d: any) => ({ id: d.maLoaiVacXin, name: d.tenLoaiVacXin })));
      }
      if (resVac.ok) {
        const data = await resVac.json();
        setVacXinCatalog(
          data.map((d: any) => ({
            id: d.maVacXin,
            name: d.tenVacXin,
            loaiVacXin: d.loaiVacXin?.tenLoaiVacXin,
            hamLuong: d.hamLuong,
            hanSuDung: d.hanSuDung,
            dieuKienBaoQuan: d.dieuKienBaoQuan,
            doTuoiTiemChung: d.doTuoiTiemChung,
            donGia: d.donGia,
          })),
        );
      }
      if (resSup.ok) {
        const data = await resSup.json();
        setSupplierList(data.map((d: any) => ({ id: d.maNhaCungCap, name: d.tenNhaCungCap })));
      }
    } catch (e) {
      console.error("Lỗi lấy siêu dữ liệu", e);
    }
  };

  const fetchCustomerTransactions = async () => {
    try {
      const response = await fetch("http://localhost:8080/api/finance/customer-transactions");
      if (response.ok) setCustomerTxs(await response.json());
    } catch (error) {
      triggerToast("Không thể kết nối tải thông tin khách hàng!");
    }
  };

  const fetchSupplierTransactions = async () => {
    try {
      const response = await fetch("http://localhost:8080/api/inventory/vaccines");
      if (response.ok) setSupplierTxs(await response.json());
    } catch (error) {
      triggerToast("Lỗi kết nối tải dữ liệu nhà cung cấp!");
    }
  };

  const fetchVaccinePrices = async () => {
    try {
      const response = await fetch("http://localhost:8080/api/finance/vaccine-prices");
      if (response.ok) setVaccinePrices(await response.json());
    } catch (error) {
      triggerToast("Không thể kết nối tải thông tin giá vắc-xin!");
    }
  };

  useEffect(() => {
    if (activeTab === "pricing") fetchVaccinePrices();
    else if (activeTab === "customer_tx") fetchCustomerTransactions();
    else if (activeTab === "supplier_tx") {
      fetchSupplierTransactions();
      fetchMetadata();
    }
  }, [activeTab]);

  // ==========================================
  // HANDLERS: KHÁCH HÀNG
  // ==========================================
  const resetCustomerForm = () => {
    setCustomerForm({ id: "", date: "", vaccineCode: "", quantity: 1, customerName: "", price: 0 });
    setEditingCustomerTxId(null);
    setShowCustomerForm(false);
  };

  const handleEditCustomer = (tx: CustomerTransaction) => {
    setCustomerForm(tx);
    setEditingCustomerTxId(tx.id);
    setShowCustomerForm(true);
  };

  const handleDeleteCustomer = async (id: string) => {
    if (!window.confirm("Bạn có chắc chắn muốn hủy giao dịch (hóa đơn) này? Thao tác này có thể ảnh hưởng đến kết quả kinh doanh.")) return;
    try {
      const response = await fetch(`http://localhost:8080/api/finance/customer-transactions/${id}`, { method: "DELETE" });
      if (response.ok) {
        setCustomerTxs(customerTxs.filter((tx) => tx.id !== id));
        triggerToast("Đã hủy và xóa mềm hóa đơn thành công!");
      } else {
        triggerToast("Tác vụ lỗi: Hủy hóa đơn thất bại!");
      }
    } catch (error) {
      triggerToast("Lỗi kết nối máy chủ");
    }
  };

  const handleSaveCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerForm.id || !customerForm.customerName || !customerForm.date) {
      triggerToast("Vui lòng nhập đủ thông tin bắt buộc");
      return;
    }
    try {
      if (editingCustomerTxId) {
        // Gọi API PUT Update để đồng bộ lại HoSoBenhAn và Các bảng liên quan
        const response = await fetch(`http://localhost:8080/api/finance/customer-transactions/${editingCustomerTxId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(customerForm),
        });
        if (response.ok) {
          fetchCustomerTransactions();
          triggerToast("Cập nhật hóa đơn và đồng bộ hồ sơ bệnh án thành công!");
          resetCustomerForm();
        } else {
          triggerToast("Lỗi cập nhật hóa đơn trên máy chủ!");
        }
      }
    } catch (error) {
      triggerToast("Lỗi kết nối máy chủ!");
    }
  };

  // ==========================================
  // HANDLERS: NHÀ CUNG CẤP (SỬ DỤNG FORM NHƯ INVENTORY)
  // ==========================================
  const resetSupplierForm = () => {
    setSupplierForm({ soLuong: 0, donGia: 0, tongTien: 0, tinhTrang: "Bình thường" });
    setSupplierErrors({});
    setIsNewVaccine(false);
    setIsNewSupplier(false);
    setEditingSupplierTxId(null);
    setShowSupplierForm(false);
  };

  const handleEditSupplier = (tx: KhoVacXin) => {
    setSupplierForm(tx);
    setIsNewVaccine(false);
    setIsNewSupplier(false);
    setEditingSupplierTxId(tx.soLo);
    setShowSupplierForm(true);
  };

  const handleDeleteSupplier = async (soLo: number) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa giao dịch nhập lô này khỏi hệ thống?")) return;
    try {
      const response = await fetch(`http://localhost:8080/api/inventory/vaccines/${soLo}`, { method: "DELETE" });
      if (response.ok) {
        setSupplierTxs(supplierTxs.filter((tx) => tx.soLo !== soLo));
        triggerToast("Hủy hóa đơn nhập lô thành công!");
      } else {
        triggerToast("Lỗi xóa giao dịch");
      }
    } catch (error) {
      triggerToast("Lỗi kết nối xóa lô");
    }
  };

  const handleDonGiaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, "");
    if (!val) {
      setSupplierForm({ ...supplierForm, donGia: 0 });
      setSupplierErrors({ ...supplierErrors, donGia: "" });
      return;
    }
    const num = Number(val);
    if (num < 10000000000) {
      setSupplierForm({ ...supplierForm, donGia: num });
      setSupplierErrors({ ...supplierErrors, donGia: "" });
    }
  };

  const handleTongTienChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, "");
    if (!val) {
      setSupplierForm({ ...supplierForm, tongTien: 0 });
      setSupplierErrors({ ...supplierErrors, tongTien: "" });
      return;
    }
    const num = Number(val);
    if (num < 100000000000) {
      setSupplierForm({ ...supplierForm, tongTien: num });
      setSupplierErrors({ ...supplierErrors, tongTien: "" });
    }
  };

  const handleSelectVaccine = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (val === "OTHER") {
      setIsNewVaccine(true);
      setSupplierForm((prev) => ({
        ...prev,
        maVacXin: undefined,
        tenVacXin: "",
        loaiVacXin: "",
        hamLuong: "",
        hanSuDung: "",
        dieuKienBaoQuan: "",
        doTuoiTiemChung: "",
        donGia: 0,
      }));
    } else if (val) {
      setIsNewVaccine(false);
      const selected = vacXinCatalog.find((v) => v.id === Number(val));
      if (selected) {
        setSupplierForm((prev) => ({
          ...prev,
          maVacXin: selected.id,
          tenVacXin: selected.name,
          loaiVacXin: selected.loaiVacXin || "",
          hamLuong: selected.hamLuong,
          hanSuDung: selected.hanSuDung,
          dieuKienBaoQuan: selected.dieuKienBaoQuan,
          doTuoiTiemChung: selected.doTuoiTiemChung,
          donGia: selected.donGia,
        }));

        setSupplierErrors((prev) => ({
          ...prev,
          maVacXin: "",
          tenVacXin: "",
          loaiVacXin: "",
          donGia: "",
          hanSuDung: "",
          hamLuong: "",
          dieuKienBaoQuan: "",
          doTuoiTiemChung: "",
        }));
      }
    } else {
      setIsNewVaccine(false);
      setSupplierForm((prev) => ({ ...prev, maVacXin: undefined }));
    }
  };

  const handleSelectSupplier = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (val === "OTHER") {
      setIsNewSupplier(true);
      setSupplierForm((prev) => ({ ...prev, maNhaCungCap: undefined, tenNhaCungCap: "" }));
    } else if (val) {
      setIsNewSupplier(false);
      const selected = supplierList.find((s) => s.id === Number(val));
      if (selected) {
        setSupplierForm((prev) => ({ ...prev, maNhaCungCap: selected.id, tenNhaCungCap: selected.name }));
        setSupplierErrors((prev) => ({
          ...prev,
          maNhaCungCap: "",
          tenNhaCungCap: "",
        }));
      }
    } else {
      setIsNewSupplier(false);
      setSupplierForm((prev) => ({ ...prev, maNhaCungCap: undefined }));
    }
  };

  const handleSaveSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!supplierForm.ngayNhan) newErrors.ngayNhan = "Vui lòng chọn ngày nhận";
    if (!supplierForm.soLuong || Number(supplierForm.soLuong) <= 0) newErrors.soLuong = "Số lượng phải > 0";
    if (!supplierForm.giayPhep?.trim()) newErrors.giayPhep = "Vui lòng nhập giấy phép";
    if (!supplierForm.nuocSanXuat?.trim()) newErrors.nuocSanXuat = "Vui lòng nhập nơi sản xuất";
    if (!supplierForm.tongTien || Number(supplierForm.tongTien) <= 0) newErrors.tongTien = "Tổng tiền HĐ phải > 0";

    if (!supplierForm.maVacXin && !isNewVaccine) newErrors.maVacXin = "Vui lòng chọn vắc-xin";
    if (!supplierForm.tenVacXin?.trim()) newErrors.tenVacXin = "Vui lòng nhập tên vắc-xin";
    if (!supplierForm.loaiVacXin?.trim()) newErrors.loaiVacXin = "Vui lòng nhập loại vắc-xin";
    if (!supplierForm.donGia || Number(supplierForm.donGia) <= 0) newErrors.donGia = "Đơn giá phải > 0";
    if (!supplierForm.hanSuDung) newErrors.hanSuDung = "Vui lòng chọn hạn SD";

    if (!supplierForm.maNhaCungCap && !isNewSupplier) newErrors.maNhaCungCap = "Vui lòng chọn nhà cung cấp";
    if (!supplierForm.tenNhaCungCap?.trim()) newErrors.tenNhaCungCap = "Vui lòng nhập tên nhà CC";

    if (Object.keys(newErrors).length > 0) {
      setSupplierErrors(newErrors);
      triggerToast("Vui lòng kiểm tra lại các trường bị lỗi viền đỏ.");
      return;
    }

    try {
      const payload = {
        ...supplierForm,
        soLo: editingSupplierTxId || null,
        maVacXin: isNewVaccine ? null : supplierForm.maVacXin,
        maNhaCungCap: isNewSupplier ? null : supplierForm.maNhaCungCap,
      };

      const res = await fetch("http://localhost:8080/api/inventory/vaccines", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Lưu thất bại");
      triggerToast("Thao tác khởi tạo chứng từ nhập thành công!");

      fetchSupplierTransactions();
      fetchMetadata();
      resetSupplierForm();
    } catch (error) {
      triggerToast("Lỗi khi lưu Database");
    }
  };

  // ==========================================
  // HANDLERS: QUẢN LÝ GIÁ VẮC XIN (CONNECT DB)
  // ==========================================
  const resetPriceForm = () => {
    setPriceForm({ id: "", name: "", dosage: "", year: "", price: 0 });
    setEditingPriceId(null);
    setShowPriceForm(false);
  };

  const handleEditPrice = (priceRec: VaccinePrice) => {
    setPriceForm(priceRec);
    setEditingPriceId(priceRec.id);
    setShowPriceForm(true);
  };

  const handleDeletePrice = async (id: string) => {
    if (!window.confirm("Bạn có chắc chắn muốn ngừng kinh doanh và xóa định giá vắc-xin này không?")) return;
    try {
      const response = await fetch(`http://localhost:8080/api/finance/vaccine-prices/${id}`, { method: "DELETE" });
      if (response.ok) {
        triggerToast("Đã xóa bảng giá vắc-xin thành công!");
        fetchVaccinePrices();
      } else {
        triggerToast("Lỗi khi thực hiện xóa trên máy chủ!");
      }
    } catch (error) {
      triggerToast("Lỗi kết nối đến máy chủ!");
    }
  };

  const handleSavePrice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!priceForm.id || !priceForm.price) {
      triggerToast("Vui lòng điền đủ thông tin");
      return;
    }
    try {
      const response = await fetch(`http://localhost:8080/api/finance/vaccine-prices/${priceForm.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(priceForm),
      });
      if (response.ok) {
        triggerToast("Cập nhật giá vắc-xin thành công!");
        fetchVaccinePrices();
        resetPriceForm();
      } else {
        triggerToast("Lỗi cập nhật giá trên máy chủ!");
      }
    } catch (error) {
      triggerToast("Lỗi cập nhật hệ thống!");
    }
  };

  // ==========================================
  // LỌC DỮ LIỆU
  // ==========================================
  const filteredCustomerTxs = customerTxs.filter(
    (tx) =>
      tx.customerName.toLowerCase().includes(searchCustomerQuery.toLowerCase()) ||
      tx.id.toLowerCase().includes(searchCustomerQuery.toLowerCase()) ||
      tx.vaccineCode.toLowerCase().includes(searchCustomerQuery.toLowerCase()),
  );

  const filteredSupplierTxs = supplierTxs.filter(
    (tx) =>
      (tx.tenNhaCungCap && tx.tenNhaCungCap.toLowerCase().includes(searchSupplierQuery.toLowerCase())) ||
      tx.soLo.toString().includes(searchSupplierQuery) ||
      (tx.tenVacXin && tx.tenVacXin.toLowerCase().includes(searchSupplierQuery.toLowerCase())),
  );

  const filteredPrices = vaccinePrices.filter(
    (p) => p.id.toString().toLowerCase().includes(searchPriceQuery.toLowerCase()) || p.name.toLowerCase().includes(searchPriceQuery.toLowerCase()),
  );

  const totalCustomerRevenue = customerTxs.reduce((sum, tx) => sum + tx.price * tx.quantity, 0);
  const totalSupplierCost = supplierTxs.reduce((sum, tx) => sum + (tx.tongTien || 0), 0);

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      {/* Module Title & Metrics */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">💵 Phân hệ Kế Toán & Quản Lý Giao Dịch</h2>
        <p className="text-sm text-slate-500 mt-1">Quản lý thống kê các giao dịch với khách hàng, nhà cung cấp và niêm yết giá vắc-xin.</p>
      </div>

      {/* Tabs list */}
      <div className="border-b border-slate-200 flex space-x-2">
        <button
          onClick={() => setActiveTab("customer_tx")}
          className={`px-4 py-2.5 font-medium text-sm border-b-2 transition-colors flex items-center gap-2 ${activeTab === "customer_tx" ? "border-blue-600 text-blue-600" : "border-transparent text-slate-500 hover:text-slate-800"}`}
        >
          <ShoppingCart className="w-4 h-4" /> Giao dịch Khách hàng
        </button>
        <button
          onClick={() => {
            setActiveTab("supplier_tx");
            resetSupplierForm();
          }}
          className={`px-4 py-2.5 font-medium text-sm border-b-2 transition-colors flex items-center gap-2 ${activeTab === "supplier_tx" ? "border-blue-600 text-blue-600" : "border-transparent text-slate-500 hover:text-slate-800"}`}
        >
          <Truck className="w-4 h-4" /> Hóa đơn Nhà cung cấp
        </button>
        <button
          onClick={() => setActiveTab("pricing")}
          className={`px-4 py-2.5 font-medium text-sm border-b-2 transition-colors flex items-center gap-2 ${activeTab === "pricing" ? "border-amber-600 text-amber-600" : "border-transparent text-slate-500 hover:text-slate-800"}`}
        >
          <Tag className="w-4 h-4" /> Quản lý giá vắc xin
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: GIAO DỊCH KHÁCH HÀNG */}
      {/* ========================================================================= */}
      {activeTab === "customer_tx" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchCustomerQuery}
                onChange={(e) => setSearchCustomerQuery(e.target.value)}
                placeholder="Tìm kiếm theo Mã HĐ, Tên khách hàng, Tên vắc-xin..."
                className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-blue-100 outline-none"
              />
            </div>
            {/* LƯU Ý: ĐÃ XÓA BUTTON TẠO GIAO DỊCH MỚI CỦA KHÁCH THEO YÊU CẦU */}
          </div>

          {showCustomerForm && (
            <form onSubmit={handleSaveCustomer} className="bg-blue-50/40 p-5 rounded-xl border border-blue-200 shadow-sm animate-fade-in relative">
              <button type="button" onClick={resetCustomerForm} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1">
                <X className="w-5 h-5" />
              </button>
              <h3 className="text-sm font-bold text-blue-800 mb-4 flex items-center gap-2">
                <Edit className="w-4 h-4" /> Chỉnh sửa Giao dịch Khách hàng
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Mã hóa đơn</label>
                  <input
                    type="text"
                    required
                    disabled
                    value={customerForm.id}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs outline-none bg-slate-100 text-slate-500 cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Ngày xuất/tiêm <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={customerForm.date}
                    onChange={(e) => setCustomerForm({ ...customerForm, date: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Tên khách hàng</label>
                  <input
                    type="text"
                    disabled
                    value={customerForm.customerName}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs outline-none bg-slate-100 text-slate-500 cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Tên vắc xin</label>
                  <input
                    type="text"
                    required
                    disabled
                    value={customerForm.vaccineCode}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs outline-none bg-slate-100 text-slate-500 cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Số lượng</label>
                  <input
                    type="number"
                    min="1"
                    required
                    disabled
                    value={customerForm.quantity}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs outline-none bg-slate-100 text-slate-500 cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Thanh toán (VND)</label>
                  <input
                    type="text"
                    required
                    value={formatCurrencyInput(customerForm.price)}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, "");
                      setCustomerForm({ ...customerForm, price: val ? Number(val) : 0 });
                    }}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs outline-none focus:border-blue-500 font-bold text-emerald-600"
                  />
                </div>
              </div>

              <div className="flex justify-end mt-4">
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold shadow-sm hover:bg-blue-700 flex items-center gap-1.5 transition-colors"
                >
                  <Save className="w-4 h-4" /> Cập nhật đồng bộ CSDL
                </button>
              </div>
            </form>
          )}

          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="font-bold text-sm text-slate-700">Danh sách giao dịch hóa đơn khách hàng</h3>
              <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-extrabold border border-blue-100">
                Tổng số: {filteredCustomerTxs.length} bản ghi
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs uppercase font-bold tracking-wider">
                    <th className="px-4 py-3">STT</th>
                    <th className="px-4 py-3">Ngày</th>
                    <th className="px-4 py-3">Mã Hóa đơn</th>
                    <th className="px-4 py-3">Khách hàng</th>
                    <th className="px-4 py-3">Tên vắc xin</th>
                    <th className="px-4 py-3 text-center">Số lượng</th>
                    <th className="px-4 py-3 text-right">Đã thu (VNĐ)</th>
                    <th className="px-4 py-3 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredCustomerTxs.length > 0 ? (
                    filteredCustomerTxs.map((tx, idx) => (
                      <tr key={tx.id} className="hover:bg-slate-50/50">
                        <td className="px-4 py-3.5 text-xs text-slate-500 font-bold">{idx + 1}</td>
                        <td className="px-4 py-3.5 text-xs text-slate-600 font-mono">{tx.date}</td>
                        <td className="px-4 py-3.5 text-xs font-bold text-blue-600 font-mono">{tx.id}</td>
                        <td className="px-4 py-3.5 text-sm font-semibold text-slate-800">{tx.customerName}</td>
                        <td className="px-4 py-3.5 text-xs text-slate-600">{tx.vaccineCode}</td>
                        <td className="px-4 py-3.5 text-sm text-center font-bold text-slate-700">{tx.quantity}</td>
                        <td className="px-4 py-3.5 text-sm text-right font-extrabold text-emerald-600">{tx.price.toLocaleString()} VNĐ</td>
                        <td className="px-4 py-3.5 text-right space-x-2">
                          <button
                            onClick={() => handleEditCustomer(tx)}
                            className="text-blue-600 bg-blue-50 hover:bg-blue-100 p-1.5 rounded transition-colors"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteCustomer(tx.id)}
                            className="text-red-600 bg-red-50 hover:bg-red-100 p-1.5 rounded transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={8} className="px-4 py-8 text-center text-slate-400 text-xs">
                        Không có dữ liệu hóa đơn.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: GIAO DỊCH NHÀ CUNG CẤP (FORM KIỂU INVENTORY) */}
      {/* ========================================================================= */}
      {activeTab === "supplier_tx" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchSupplierQuery}
                onChange={(e) => setSearchSupplierQuery(e.target.value)}
                placeholder="Tìm kiếm theo mã Lô, Nhà cung cấp hoặc Vắc-xin..."
                className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-emerald-100 outline-none"
              />
            </div>
            <button
              onClick={() => {
                resetSupplierForm();
                setShowSupplierForm(true);
              }}
              className="bg-emerald-600 text-white text-xs font-semibold px-4 py-2.5 rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-1 cursor-pointer whitespace-nowrap shadow-sm"
            >
              <Plus className="w-4 h-4" /> Biên Bản Nhập Kho Hóa Đơn
            </button>
          </div>

          {showSupplierForm && (
            <form
              onSubmit={handleSaveSupplier}
              noValidate
              className="space-y-6 bg-slate-50 p-6 rounded-xl border border-slate-200 shadow-sm animate-fade-in relative"
            >
              <button
                type="button"
                onClick={resetSupplierForm}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 bg-white rounded-full border shadow-sm"
              >
                <X className="w-5 h-5" />
              </button>

              {/* PHẦN 1 */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                <h3 className="text-sm font-bold text-emerald-700 flex items-center gap-2 mb-4 border-b border-slate-100 pb-2">
                  <Package className="w-5 h-5" /> PHẦN 1: THÔNG TIN LÔ (BATCH) & HOÁ ĐƠN
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Ngày nhận lô <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={supplierForm.ngayNhan || ""}
                      onChange={(e) => {
                        setSupplierForm({ ...supplierForm, ngayNhan: e.target.value });
                        setSupplierErrors({ ...supplierErrors, ngayNhan: "" });
                      }}
                      className={`w-full px-3 py-2 border rounded-lg text-xs outline-none transition-colors ${supplierErrors.ngayNhan ? "border-red-500 bg-red-50" : "border-slate-300 focus:border-emerald-500"}`}
                    />
                    {supplierErrors.ngayNhan && <p className="text-[10px] text-red-500 font-bold mt-1">{supplierErrors.ngayNhan}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Số lượng nhập (liều) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={supplierForm.soLuong || ""}
                      onChange={(e) => {
                        setSupplierForm({ ...supplierForm, soLuong: Number(e.target.value) });
                        setSupplierErrors({ ...supplierErrors, soLuong: "" });
                      }}
                      className={`w-full px-3 py-2 border rounded-lg text-xs font-bold outline-none transition-colors ${supplierErrors.soLuong ? "border-red-500 bg-red-50 text-red-600" : "border-slate-300 focus:border-emerald-500 text-emerald-700"}`}
                    />
                    {supplierErrors.soLuong && <p className="text-[10px] text-red-500 font-bold mt-1">{supplierErrors.soLuong}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Tình trạng Lô <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={supplierForm.tinhTrang || "Bình thường"}
                      onChange={(e) => setSupplierForm({ ...supplierForm, tinhTrang: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs outline-none focus:border-emerald-500 cursor-pointer"
                    >
                      <option value="Bình thường">Bình thường</option>
                      <option value="Cận date">Cận date</option>
                      <option value="Hỏng/Lỗi">Hỏng/Lỗi</option>
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Số giấy phép HQ / Lô SX <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      maxLength={50}
                      value={supplierForm.giayPhep || ""}
                      onChange={(e) => {
                        setSupplierForm({ ...supplierForm, giayPhep: e.target.value });
                        setSupplierErrors({ ...supplierErrors, giayPhep: "" });
                      }}
                      className={`w-full px-3 py-2 border rounded-lg text-xs outline-none transition-colors ${supplierErrors.giayPhep ? "border-red-500 bg-red-50" : "border-slate-300 focus:border-emerald-500"}`}
                    />
                    {supplierErrors.giayPhep && <p className="text-[10px] text-red-500 font-bold mt-1">{supplierErrors.giayPhep}</p>}
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Nơi sản xuất Lô <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      maxLength={100}
                      value={supplierForm.nuocSanXuat || ""}
                      onChange={(e) => {
                        setSupplierForm({ ...supplierForm, nuocSanXuat: e.target.value });
                        setSupplierErrors({ ...supplierErrors, nuocSanXuat: "" });
                      }}
                      className={`w-full px-3 py-2 border rounded-lg text-xs outline-none transition-colors ${supplierErrors.nuocSanXuat ? "border-red-500 bg-red-50" : "border-slate-300 focus:border-emerald-500"}`}
                    />
                    {supplierErrors.nuocSanXuat && <p className="text-[10px] text-red-500 font-bold mt-1">{supplierErrors.nuocSanXuat}</p>}
                  </div>

                  <div className="col-span-1 md:col-span-4 bg-emerald-50/50 p-4 rounded-lg border border-emerald-200">
                    <label className="block text-xs font-bold text-emerald-800 mb-1">
                      Tổng tiền thanh toán Hóa đơn nhập (VNĐ) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formatCurrency(supplierForm.tongTien)}
                      onChange={handleTongTienChange}
                      placeholder="VD: Nhập tổng giá trị lô hàng..."
                      className={`w-full md:w-1/2 px-3 py-2.5 border rounded-lg text-sm font-bold outline-none transition-colors ${supplierErrors.tongTien ? "border-red-500 bg-red-50 text-red-600" : "border-emerald-300 focus:border-emerald-500 text-emerald-700"}`}
                    />
                    {supplierErrors.tongTien && <p className="text-[10px] text-red-500 font-bold mt-1">{supplierErrors.tongTien}</p>}
                  </div>
                </div>
              </div>

              {/* PHẦN 2 */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                <h3 className="text-sm font-bold text-indigo-700 flex items-center gap-2 mb-4 border-b border-slate-100 pb-2">
                  <Activity className="w-5 h-5" /> PHẦN 2: CHỈ ĐỊNH VẮC XIN ĐƯỢC NHẬP
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
                  <div className="col-span-4 bg-indigo-50/50 p-4 border border-indigo-200 rounded-lg">
                    <label className="block text-sm font-bold text-indigo-800 mb-2">
                      1. Chọn Vắc xin từ CSDL <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={isNewVaccine ? "OTHER" : supplierForm.maVacXin || ""}
                      onChange={handleSelectVaccine}
                      className={`w-full md:w-1/2 px-3 py-2.5 border rounded-lg text-sm font-bold outline-none cursor-pointer transition-colors ${supplierErrors.maVacXin ? "border-red-500 bg-red-50 text-red-700" : "border-indigo-300 text-indigo-700 focus:border-indigo-500"}`}
                    >
                      <option value="">-- Click để chọn danh mục đã có --</option>
                      {vacXinCatalog.map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.name} (Giá bán ra: {formatCurrency(v.donGia)}đ)
                        </option>
                      ))}
                      <option value="OTHER">➕ TẠO DANH MỤC VẮC XIN HOÀN TOÀN MỚI...</option>
                    </select>
                    {supplierErrors.maVacXin && <p className="text-[10px] text-red-500 font-bold mt-1.5">{supplierErrors.maVacXin}</p>}
                    <p className="text-[11px] text-indigo-600 mt-1.5 italic">
                      * Chọn vắc xin đã có để tự động điền thông tin. Bạn có thể chỉnh sửa các ô bên dưới nếu giá trị thay đổi để lưu đè lại vào CSDL.
                    </p>
                  </div>

                  <div className="col-span-1 md:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Tên Vắc-xin <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      maxLength={100}
                      value={supplierForm.tenVacXin || ""}
                      onChange={(e) => {
                        setSupplierForm({ ...supplierForm, tenVacXin: e.target.value });
                        setSupplierErrors({ ...supplierErrors, tenVacXin: "" });
                      }}
                      className={`w-full px-3 py-2 border rounded-lg text-xs font-bold outline-none transition-colors ${supplierErrors.tenVacXin ? "border-red-500 bg-red-50" : "bg-white border-blue-300 focus:border-blue-600"}`}
                    />
                    {supplierErrors.tenVacXin && <p className="text-[10px] text-red-500 font-bold mt-1">{supplierErrors.tenVacXin}</p>}
                  </div>
                  <div className="col-span-1">
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Loại (Nhóm) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      maxLength={100}
                      placeholder={isNewVaccine ? "VD: Cúm, Phế cầu..." : ""}
                      value={supplierForm.loaiVacXin || ""}
                      onChange={(e) => {
                        setSupplierForm({ ...supplierForm, loaiVacXin: e.target.value });
                        setSupplierErrors({ ...supplierErrors, loaiVacXin: "" });
                      }}
                      className={`w-full px-3 py-2 border rounded-lg text-xs outline-none transition-colors ${supplierErrors.loaiVacXin ? "border-red-500 bg-red-50" : "bg-white border-blue-300 focus:border-blue-600"}`}
                    />
                    {supplierErrors.loaiVacXin && <p className="text-[10px] text-red-500 font-bold mt-1">{supplierErrors.loaiVacXin}</p>}
                  </div>
                  <div className="col-span-1">
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Giá bán ra khách hàng (VNĐ) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formatCurrency(supplierForm.donGia)}
                      onChange={handleDonGiaChange}
                      className={`w-full px-3 py-2 border rounded-lg text-xs font-bold outline-none transition-colors ${supplierErrors.donGia ? "border-red-500 bg-red-50 text-red-600" : "bg-white border-emerald-400 focus:border-emerald-600 text-emerald-700"}`}
                    />
                    {supplierErrors.donGia && <p className="text-[10px] text-red-500 font-bold mt-1">{supplierErrors.donGia}</p>}
                  </div>

                  <div className="col-span-1">
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Hạn sử dụng <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={supplierForm.hanSuDung || ""}
                      onChange={(e) => {
                        setSupplierForm({ ...supplierForm, hanSuDung: e.target.value });
                        setSupplierErrors({ ...supplierErrors, hanSuDung: "" });
                      }}
                      className={`w-full px-3 py-2 border rounded-lg text-xs outline-none transition-colors ${supplierErrors.hanSuDung ? "border-red-500 bg-red-50" : "bg-white border-blue-300 focus:border-blue-600"}`}
                    />
                    {supplierErrors.hanSuDung && <p className="text-[10px] text-red-500 font-bold mt-1">{supplierErrors.hanSuDung}</p>}
                  </div>
                  <div className="col-span-1">
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Hàm lượng <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      maxLength={50}
                      value={supplierForm.hamLuong || ""}
                      onChange={(e) => {
                        setSupplierForm({ ...supplierForm, hamLuong: e.target.value });
                        setSupplierErrors({ ...supplierErrors, hamLuong: "" });
                      }}
                      className={`w-full px-3 py-2 border rounded-lg text-xs outline-none transition-colors ${supplierErrors.hamLuong ? "border-red-500 bg-red-50" : "bg-white border-blue-300 focus:border-blue-600"}`}
                    />
                    {supplierErrors.hamLuong && <p className="text-[10px] text-red-500 font-bold mt-1">{supplierErrors.hamLuong}</p>}
                  </div>
                  <div className="col-span-1">
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      ĐK Bảo quản <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      maxLength={100}
                      value={supplierForm.dieuKienBaoQuan || ""}
                      onChange={(e) => {
                        setSupplierForm({ ...supplierForm, dieuKienBaoQuan: e.target.value });
                        setSupplierErrors({ ...supplierErrors, dieuKienBaoQuan: "" });
                      }}
                      className={`w-full px-3 py-2 border rounded-lg text-xs outline-none transition-colors ${supplierErrors.dieuKienBaoQuan ? "border-red-500 bg-red-50" : "bg-white border-blue-300 focus:border-blue-600"}`}
                    />
                    {supplierErrors.dieuKienBaoQuan && <p className="text-[10px] text-red-500 font-bold mt-1">{supplierErrors.dieuKienBaoQuan}</p>}
                  </div>
                  <div className="col-span-1">
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Tuổi tiêm <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      maxLength={100}
                      value={supplierForm.doTuoiTiemChung || ""}
                      onChange={(e) => {
                        setSupplierForm({ ...supplierForm, doTuoiTiemChung: e.target.value });
                        setSupplierErrors({ ...supplierErrors, doTuoiTiemChung: "" });
                      }}
                      className={`w-full px-3 py-2 border rounded-lg text-xs outline-none transition-colors ${supplierErrors.doTuoiTiemChung ? "border-red-500 bg-red-50" : "bg-white border-blue-300 focus:border-blue-600"}`}
                    />
                    {supplierErrors.doTuoiTiemChung && <p className="text-[10px] text-red-500 font-bold mt-1">{supplierErrors.doTuoiTiemChung}</p>}
                  </div>
                </div>
              </div>

              {/* PHẦN 3 */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                <h3 className="text-sm font-bold text-violet-700 flex items-center gap-2 mb-4 border-b border-slate-100 pb-2">
                  <Truck className="w-5 h-5" /> PHẦN 3: ĐỐI TÁC NHÀ CUNG CẤP
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="bg-violet-50/50 p-4 border border-violet-200 rounded-lg">
                    <label className="block text-sm font-bold text-violet-800 mb-2">
                      1. Chọn Nhà CC từ CSDL <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={isNewSupplier ? "OTHER" : supplierForm.maNhaCungCap || ""}
                      onChange={handleSelectSupplier}
                      className={`w-full px-3 py-2.5 border rounded-lg text-sm font-bold outline-none cursor-pointer transition-colors ${supplierErrors.maNhaCungCap ? "border-red-500 bg-red-50 text-red-700" : "border-violet-300 text-violet-800 focus:border-violet-500"}`}
                    >
                      <option value="">-- Click để chọn nhà cung cấp --</option>
                      {supplierList.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                      <option value="OTHER">➕ TẠO DANH MỤC ĐỐI TÁC MỚI...</option>
                    </select>
                    {supplierErrors.maNhaCungCap && <p className="text-[10px] text-red-500 font-bold mt-1.5">{supplierErrors.maNhaCungCap}</p>}
                    <p className="text-[11px] text-violet-600 mt-1.5 italic">
                      * Chỉnh sửa trực tiếp tên bên dưới sẽ cập nhật lại thông tin đối tác vào CSDL.
                    </p>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Tên Tổ chức / Nhà cung cấp <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      maxLength={255}
                      value={supplierForm.tenNhaCungCap || ""}
                      onChange={(e) => {
                        setSupplierForm({ ...supplierForm, tenNhaCungCap: e.target.value });
                        setSupplierErrors({ ...supplierErrors, tenNhaCungCap: "" });
                      }}
                      className={`w-full px-3 py-3 border rounded-lg text-sm font-bold outline-none transition-colors ${supplierErrors.tenNhaCungCap ? "border-red-500 bg-red-50" : "bg-white border-blue-400 focus:border-blue-600"}`}
                    />
                    {supplierErrors.tenNhaCungCap && <p className="text-[10px] text-red-500 font-bold mt-1">{supplierErrors.tenNhaCungCap}</p>}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 mt-2">
                <button
                  type="button"
                  onClick={() => setShowSupplierForm(false)}
                  className="px-6 py-2.5 border border-slate-300 rounded-lg text-sm font-semibold text-slate-700 bg-white hover:bg-slate-50 transition-colors"
                >
                  Đóng Form
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-emerald-600 text-white rounded-lg text-sm font-bold shadow-md hover:bg-emerald-700 flex items-center gap-2 transition-colors"
                >
                  <Save className="w-5 h-5" /> Lưu CSDL Nhập Kho Hóa Đơn
                </button>
              </div>
            </form>
          )}

          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="font-bold text-sm text-slate-700">Lịch sử hóa đơn nhập hàng từ Nhà Cung Cấp</h3>
              <span className="bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-xs font-extrabold border border-emerald-100">
                Tổng số: {filteredSupplierTxs.length} Lô
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs uppercase font-bold tracking-wider">
                    <th className="px-4 py-3">STT</th>
                    <th className="px-4 py-3">Ngày nhận</th>
                    <th className="px-4 py-3">Mã Lô</th>
                    <th className="px-4 py-3">Nhà cung cấp</th>
                    <th className="px-4 py-3">Tên vắc xin</th>
                    <th className="px-4 py-3 text-center">Số lượng</th>
                    <th className="px-4 py-3 text-right">Tổng tiền HĐ</th>
                    <th className="px-4 py-3 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredSupplierTxs.length > 0 ? (
                    filteredSupplierTxs.map((tx, idx) => (
                      <tr key={tx.soLo} className="hover:bg-slate-50/50">
                        <td className="px-4 py-3.5 text-xs text-slate-500 font-bold">{idx + 1}</td>
                        <td className="px-4 py-3.5 text-xs text-slate-600 font-mono">{tx.ngayNhan}</td>
                        <td className="px-4 py-3.5 text-xs font-bold text-emerald-600 font-mono">#{tx.soLo}</td>
                        <td className="px-4 py-3.5 text-sm font-semibold text-slate-800">{tx.tenNhaCungCap || "---"}</td>
                        <td className="px-4 py-3.5 text-xs text-slate-600 font-bold">{tx.tenVacXin}</td>
                        <td className="px-4 py-3.5 text-sm text-center font-bold text-emerald-700 bg-emerald-50/30">{tx.soLuong}</td>
                        <td className="px-4 py-3.5 text-sm text-right font-extrabold text-slate-800">{(tx.tongTien || 0).toLocaleString()} VNĐ</td>
                        <td className="px-4 py-3.5 text-right space-x-2">
                          <button
                            onClick={() => handleEditSupplier(tx)}
                            className="text-emerald-600 bg-emerald-50 hover:bg-emerald-100 p-1.5 rounded transition-colors"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteSupplier(tx.soLo)}
                            className="text-red-600 bg-red-50 hover:bg-red-100 p-1.5 rounded transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={8} className="px-4 py-8 text-center text-slate-400 text-xs">
                        Không có dữ liệu giao dịch nhập kho.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: QUẢN LÝ GIÁ VẮC XIN TỪ DB */}
      {/* ========================================================================= */}
      {activeTab === "pricing" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchPriceQuery}
                onChange={(e) => setSearchPriceQuery(e.target.value)}
                placeholder="Tìm kiếm theo Mã vắc xin, Tên vắc-xin..."
                className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-amber-100 outline-none"
              />
            </div>
          </div>

          {showPriceForm && (
            <form onSubmit={handleSavePrice} className="bg-amber-50/40 p-5 rounded-xl border border-amber-200 shadow-sm animate-fade-in relative">
              <button type="button" onClick={resetPriceForm} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1">
                <X className="w-5 h-5" />
              </button>
              <h3 className="text-sm font-bold text-amber-800 mb-4 flex items-center gap-2">
                <Tag className="w-4 h-4" /> Chỉnh sửa Thiết lập Giá Vắc xin
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Mã vắc xin <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    disabled
                    value={`VX${String(priceForm.id).padStart(3, "0")}`}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono outline-none bg-slate-100 text-slate-500 cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Tên vắc xin</label>
                  <input
                    type="text"
                    disabled
                    value={priceForm.name}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs outline-none bg-slate-100 text-slate-600 cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Đơn vị (Hàm lượng) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={priceForm.dosage}
                    onChange={(e) => setPriceForm({ ...priceForm, dosage: e.target.value })}
                    placeholder="VD: 0.5 ml"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Đơn giá (VND) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formatCurrencyInput(priceForm.price)}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, "");
                      setPriceForm({ ...priceForm, price: val ? Number(val) : 0 });
                    }}
                    placeholder="VD: 1,000,000"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs outline-none focus:border-amber-500 font-bold text-emerald-600"
                  />
                </div>
              </div>

              <div className="flex justify-end mt-4">
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-600 text-white rounded-lg text-xs font-semibold shadow-sm hover:bg-amber-700 flex items-center gap-1.5 transition-colors"
                >
                  <Save className="w-4 h-4" /> Cập nhật lên CSDL
                </button>
              </div>
            </form>
          )}

          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="font-bold text-sm text-slate-700">Danh sách vắc xin</h3>
              <span className="bg-amber-50 text-amber-700 px-3 py-1 rounded-full text-xs font-extrabold border border-amber-100">
                Tổng số: {filteredPrices.length} bản ghi
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse table-fixed">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs uppercase font-bold tracking-wider">
                    <th className="px-2 sm:px-3 py-3 w-[5%] text-center">STT</th>
                    <th className="px-2 sm:px-3 py-3 w-[12%]">Mã vắc xin</th>
                    <th className="px-2 sm:px-3 py-3 w-[30%]">Tên vắc xin</th>
                    <th className="px-2 sm:px-3 py-3 w-[15%] text-center">Hàm lượng</th>
                    <th className="px-2 sm:px-3 py-3 w-[12%] text-center">Hạn SD</th>
                    <th className="px-2 sm:px-3 py-3 w-[15%] text-right">Đơn giá (VND)</th>
                    <th className="px-2 sm:px-3 py-3 w-[11%] text-center">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredPrices.length > 0 ? (
                    filteredPrices.map((p, idx) => (
                      <tr key={p.id} className="hover:bg-slate-50/50">
                        <td className="px-2 sm:px-3 py-3.5 text-xs text-slate-500 font-bold text-center break-words">{idx + 1}</td>
                        <td className="px-2 sm:px-3 py-3.5 text-xs font-bold text-amber-600 font-mono break-words">
                          VX{String(p.id).padStart(3, "0")}
                        </td>
                        <td className="px-2 sm:px-3 py-3.5 text-sm font-bold text-slate-800 break-words">{p.name}</td>
                        <td className="px-2 sm:px-3 py-3.5 text-sm text-center font-semibold text-slate-700 break-words">{p.dosage}</td>
                        <td className="px-2 sm:px-3 py-3.5 text-sm text-center text-slate-600 font-mono break-words">{p.year}</td>
                        <td className="px-2 sm:px-3 py-3.5 text-sm text-right font-extrabold text-emerald-700 break-words">
                          {p.price.toLocaleString()} VNĐ
                        </td>
                        <td className="px-2 sm:px-3 py-3.5 text-center flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleEditPrice(p)}
                            className="text-amber-600 bg-amber-50 hover:bg-amber-100 p-1.5 rounded transition-colors"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeletePrice(p.id)}
                            className="text-red-600 bg-red-50 hover:bg-red-100 p-1.5 rounded transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-slate-400 text-xs">
                        Không có dữ liệu định giá.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
