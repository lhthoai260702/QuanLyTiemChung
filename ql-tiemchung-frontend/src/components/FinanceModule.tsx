import React, { useState, useEffect } from "react";
import { Invoice, Vaccine, SystemLog } from "../types";
import { CreditCard, DollarSign, Plus, Check, X, Edit, Trash2, Search, Save, TrendingUp, ShoppingCart, Truck, Tag } from "lucide-react";

interface FinanceModuleProps {
  invoices: Invoice[];
  setInvoices: React.Dispatch<React.SetStateAction<Invoice[]>>;
  vaccines: Vaccine[];
  systemLogs: SystemLog[];
  setSystemLogs: React.Dispatch<React.SetStateAction<SystemLog[]>>;
  triggerToast: (msg: string) => void;
}

// --- ĐỊNH NGHĨA KIỂU DỮ LIỆU ---
export interface CustomerTransaction {
  id: string;
  date: string;
  vaccineCode: string;
  quantity: number;
  customerName: string;
  price: number;
}

export interface SupplierTransaction {
  id: string;
  date: string;
  vaccineCode: string;
  quantity: number;
  supplierName: string;
  price: number;
}

export interface VaccinePrice {
  id: string;
  name: string;
  dosage: string;
  year: string;
  price: number;
}

export default function FinanceModule({ invoices, setInvoices, vaccines, systemLogs, setSystemLogs, triggerToast }: FinanceModuleProps) {
  const [activeTab, setActiveTab] = useState<"customer_tx" | "supplier_tx" | "pricing">("customer_tx");

  // ==========================================
  // HÀM FORMAT TIỀN TỆ CHO INPUT (Tự chèn dấu phẩy)
  // ==========================================
  const formatCurrencyInput = (value: number) => {
    if (!value || value === 0) return ""; // Nếu là 0 hoặc rỗng thì trả về chuỗi rỗng để xoá sạch ô
    return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

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
  // STATE: GIAO DỊCH VỚI NHÀ CUNG CẤP
  // ==========================================
  const [supplierTxs, setSupplierTxs] = useState<SupplierTransaction[]>([]);
  const [searchSupplierQuery, setSearchSupplierQuery] = useState("");
  const [showSupplierForm, setShowSupplierForm] = useState(false);
  const [editingSupplierTxId, setEditingSupplierTxId] = useState<string | null>(null);

  const [supplierForm, setSupplierForm] = useState<SupplierTransaction>({
    id: "",
    date: "",
    vaccineCode: "",
    quantity: 1,
    supplierName: "",
    price: 0,
  });

  // ==========================================
  // STATE: QUẢN LÝ GIÁ VẮC XIN TỪ DATABASE
  // ==========================================
  const [vaccinePrices, setVaccinePrices] = useState<VaccinePrice[]>([]);
  const [searchPriceQuery, setSearchPriceQuery] = useState("");
  const [showPriceForm, setShowPriceForm] = useState(false);
  const [editingPriceId, setEditingPriceId] = useState<string | null>(null);

  // Hàm lấy dữ liệu nhà cung cấp từ Backend
  const fetchSupplierTransactions = async () => {
    try {
      const response = await fetch("http://localhost:8080/api/finance/supplier-transactions");
      if (response.ok) {
        const data = await response.json();
        setSupplierTxs(data);
      }
    } catch (error) {
      console.error(error);
      triggerToast("Lỗi kết nối tải dữ liệu nhà cung cấp!");
    }
  };

  // Cập nhật useEffect (Thêm case fetch cho supplier_tx)
  useEffect(() => {
    if (activeTab === 'pricing') {
      fetchVaccinePrices();
    } else if (activeTab === 'customer_tx') {
      fetchCustomerTransactions();
    } else if (activeTab === 'supplier_tx') {
      fetchSupplierTransactions();
    }
  }, [activeTab]);

  const [priceForm, setPriceForm] = useState<VaccinePrice>({
    id: "",
    name: "",
    dosage: "",
    year: "",
    price: 0,
  });

  const fetchCustomerTransactions = async () => {
    try {
      const response = await fetch("http://localhost:8080/api/finance/customer-transactions");
      if (response.ok) {
        const data = await response.json();
        setCustomerTxs(data);
      }
    } catch (error) {
      console.error(error);
      triggerToast("Không thể kết nối tải thông tin giao dịch khách hàng!");
    }
  };

  useEffect(() => {
    if (activeTab === "customer_tx") {
      fetchCustomerTransactions();
    }
  }, [activeTab]);

  // HÀM CALL API LẤY BẢNG GIÁ TỪ DATABASE
  const fetchVaccinePrices = async () => {
    try {
      const response = await fetch("http://localhost:8080/api/finance/vaccine-prices");
      if (response.ok) {
        const data = await response.json();
        setVaccinePrices(data);
      }
    } catch (error) {
      console.error(error);
      triggerToast("Không thể kết nối tải thông tin giá vắc-xin!");
    }
  };

  useEffect(() => {
    if (activeTab === "pricing") {
      fetchVaccinePrices();
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
    if (!window.confirm("Bạn có chắc chắn muốn xóa giao dịch này?")) return;
    try {
      const response = await fetch(`http://localhost:8080/api/finance/customer-transactions/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setCustomerTxs(customerTxs.filter((tx) => tx.id !== id));
        triggerToast("Đã xóa thông tin giao dịch thành công!");
      } else {
        triggerToast("Tác vụ lỗi: Xóa hóa đơn thất bại!");
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
        // GỌI API CẬP NHẬT GIÁ
        const response = await fetch(`http://localhost:8080/api/finance/customer-transactions/${editingCustomerTxId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(customerForm),
        });

        if (response.ok) {
          fetchCustomerTransactions();
          triggerToast("Cập nhật kết quả lên datagridview thành công!");
          resetCustomerForm();
        } else {
          triggerToast("Lỗi cập nhật hóa đơn trên máy chủ!");
        }
      } else {
        // Giao dịch nên được sinh ra tự động từ Hồ sơ bệnh án thay vì tạo thủ công
        triggerToast("Lưu ý: Hóa đơn/giao dịch mới nên được hệ thống sinh tự động từ phân hệ khám bệnh.");
        resetCustomerForm();
      }
    } catch (error) {
      triggerToast("Lỗi kết nối máy chủ!");
    }
  };

  // ==========================================
  // HANDLERS: NHÀ CUNG CẤP
  // ==========================================
  const resetSupplierForm = () => {
    setSupplierForm({ id: "", date: "", vaccineCode: "", quantity: 1, supplierName: "", price: 0 });
    setEditingSupplierTxId(null);
    setShowSupplierForm(false);
  };

  const handleEditSupplier = (tx: SupplierTransaction) => {
    setSupplierForm(tx);
    setEditingSupplierTxId(tx.id);
    setShowSupplierForm(true);
  };

  const handleDeleteSupplier = async (id: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa giao dịch nhập kho này?')) return;
    try {
      const response = await fetch(`http://localhost:8080/api/finance/supplier-transactions/${id}`, {
        method: "DELETE"
      });

      if (response.ok) {
        setSupplierTxs(supplierTxs.filter(tx => tx.id !== id));
        triggerToast('Cập nhật datagridview'); // Thành công
      } else {
        triggerToast('Lỗi xóa'); // Lỗi chuẩn SRS
      }
    } catch (error) {
      triggerToast('Lỗi xóa');
    }
  };

  const handleSaveSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierForm.id || !supplierForm.supplierName || !supplierForm.date) {
      triggerToast('Lỗi lưu lại'); 
      return;
    }

    try {
      if (editingSupplierTxId) {
        // CẬP NHẬT
        const response = await fetch(`http://localhost:8080/api/finance/supplier-transactions/${editingSupplierTxId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(supplierForm)
        });

        if (response.ok) {
          fetchSupplierTransactions();
          triggerToast('Cập nhật datagridview'); // SRS: Thành công
          resetSupplierForm();
        } else {
          triggerToast('Lỗi chỉnh sửa'); // SRS: Lỗi chỉnh sửa
        }
      } else {
        // THÊM MỚI
        const response = await fetch(`http://localhost:8080/api/finance/supplier-transactions`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(supplierForm)
        });

        if (response.ok) {
          fetchSupplierTransactions();
          triggerToast('Cập nhật datagridview'); // SRS: Thành công
          resetSupplierForm();
        } else {
          triggerToast('Lỗi tạo mới'); // SRS: Lỗi tạo mới
        }
      }
    } catch (error) {
      triggerToast('Lỗi lưu lại'); // SRS: Lỗi lưu tổng quát
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
    if (!window.confirm("Bạn có chắc chắn muốn ngừng kinh doanh và xóa định giá vắc-xin này không? (Dữ liệu sẽ được xóa mềm khỏi hệ thống)")) return;

    try {
      const response = await fetch(`http://localhost:8080/api/finance/vaccine-prices/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        triggerToast("Đã xóa bảng giá vắc-xin thành công!");
        fetchVaccinePrices();
      } else {
        triggerToast("Lỗi khi thực hiện xóa trên máy chủ!");
      }
    } catch (error) {
      console.error(error);
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
      tx.supplierName.toLowerCase().includes(searchSupplierQuery.toLowerCase()) ||
      tx.id.toLowerCase().includes(searchSupplierQuery.toLowerCase()) ||
      tx.vaccineCode.toLowerCase().includes(searchSupplierQuery.toLowerCase()),
  );

  const filteredPrices = vaccinePrices.filter(
    (p) => p.id.toString().toLowerCase().includes(searchPriceQuery.toLowerCase()) || p.name.toLowerCase().includes(searchPriceQuery.toLowerCase()),
  );

  const totalCustomerRevenue = customerTxs.reduce((sum, tx) => sum + tx.price * tx.quantity, 0);
  const totalSupplierCost = supplierTxs.reduce((sum, tx) => sum + tx.price * tx.quantity, 0);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Module Title & Metrics */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">💵 Phân hệ Kế Toán & Quản Lý Giao Dịch</h2>
        <p className="text-sm text-slate-500 mt-1">Quản lý thống kê các giao dịch với khách hàng, nhà cung cấp và niêm yết giá vắc-xin.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Doanh thu giao dịch khách hàng</p>
            <h3 className="text-2xl font-extrabold text-emerald-600 mt-1">{totalCustomerRevenue.toLocaleString()} VNĐ</h3>
          </div>
          <DollarSign className="w-10 h-10 text-emerald-500 bg-emerald-50 p-2 rounded-lg" />
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Chi phí giao dịch NCC</p>
            <h3 className="text-2xl font-extrabold text-rose-600 mt-1">{totalSupplierCost.toLocaleString()} VNĐ</h3>
          </div>
          <TrendingUp className="w-10 h-10 text-rose-500 bg-rose-50 p-2 rounded-lg" />
        </div>
      </div>

      {/* Tabs list */}
      <div className="border-b border-slate-200 flex space-x-2">
        <button
          onClick={() => setActiveTab("customer_tx")}
          className={`px-4 py-2.5 font-medium text-sm border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === "customer_tx" ? "border-blue-600 text-blue-600" : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <ShoppingCart className="w-4 h-4" /> Giao dịch Khách hàng
        </button>
        <button
          onClick={() => setActiveTab("supplier_tx")}
          className={`px-4 py-2.5 font-medium text-sm border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === "supplier_tx" ? "border-blue-600 text-blue-600" : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Truck className="w-4 h-4" /> Giao dịch Nhà cung cấp
        </button>
        <button
          onClick={() => setActiveTab("pricing")}
          className={`px-4 py-2.5 font-medium text-sm border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === "pricing" ? "border-amber-600 text-amber-600" : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
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
                placeholder="Tìm kiếm theo Mã HĐ, Tên khách hàng, Mã vắc xin..."
                className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-blue-100 outline-none"
              />
            </div>
            <button
              onClick={() => {
                resetCustomerForm();
                setShowCustomerForm(true);
              }}
              className="bg-blue-600 text-white text-xs font-semibold px-4 py-2.5 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-1 cursor-pointer whitespace-nowrap"
            >
              <Plus className="w-4 h-4" /> Tạo giao dịch mới
            </button>
          </div>

          {/* Form Thêm/Sửa Khách Hàng */}
          {showCustomerForm && (
            <form onSubmit={handleSaveCustomer} className="bg-blue-50/40 p-5 rounded-xl border border-blue-200 shadow-sm animate-fade-in relative">
              <button type="button" onClick={resetCustomerForm} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1">
                <X className="w-5 h-5" />
              </button>
              <h3 className="text-sm font-bold text-blue-800 mb-4 flex items-center gap-2">
                <Edit className="w-4 h-4" /> {editingCustomerTxId ? "Chỉnh sửa Giao dịch Khách hàng" : "Thêm mới Giao dịch Khách hàng"}
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Mã hóa đơn <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    disabled={!!editingCustomerTxId}
                    value={customerForm.id}
                    onChange={(e) => setCustomerForm({ ...customerForm, id: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Ngày tiêm chủng <span className="text-red-500">*</span>
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
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Tên khách hàng <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={customerForm.customerName}
                    onChange={(e) => setCustomerForm({ ...customerForm, customerName: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Mã vắc xin</label>
                  <input
                    type="text"
                    required
                    value={customerForm.vaccineCode}
                    onChange={(e) => setCustomerForm({ ...customerForm, vaccineCode: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Số lượng</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={customerForm.quantity}
                    onChange={(e) => setCustomerForm({ ...customerForm, quantity: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Giá thành (VND)</label>
                  <input
                    type="text"
                    required
                    value={formatCurrencyInput(customerForm.price)}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, ""); // Chỉ lấy số
                      setCustomerForm({ ...customerForm, price: val ? Number(val) : 0 });
                    }}
                    placeholder="VD: 1,000,000"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="flex justify-end mt-4">
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold shadow-sm hover:bg-blue-700 flex items-center gap-1.5 transition-colors"
                >
                  <Save className="w-4 h-4" /> Lưu thông tin
                </button>
              </div>
            </form>
          )}

          {/* Grid View Khách Hàng */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="font-bold text-sm text-slate-700">Danh sách giao dịch khách hàng</h3>
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
                    <th className="px-4 py-3">Mã hóa đơn</th>
                    <th className="px-4 py-3">Tên khách hàng</th>
                    <th className="px-4 py-3">Mã vắc xin</th>
                    <th className="px-4 py-3 text-center">Số lượng</th>
                    <th className="px-4 py-3 text-right">Giá</th>
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
                        <td className="px-4 py-3.5 text-sm text-right font-extrabold text-slate-800">{tx.price.toLocaleString()} VNĐ</td>
                        <td className="px-4 py-3.5 text-right space-x-2">
                          <button
                            onClick={() => handleEditCustomer(tx)}
                            className="text-blue-600 bg-blue-50 hover:bg-blue-100 p-1.5 rounded transition-colors"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteCustomer(tx.id)}
                            className="text-red-600 bg-red-50 hover:bg-red-100 p-1.5 rounded transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={8} className="px-4 py-8 text-center text-slate-400 text-xs">
                        Không có dữ liệu giao dịch.
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
      {/* TAB 2: GIAO DỊCH NHÀ CUNG CẤP */}
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
                placeholder="Tìm kiếm giao dịch kho..."
                className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-emerald-100 outline-none"
              />
            </div>
            <button
              onClick={() => {
                resetSupplierForm();
                setShowSupplierForm(true);
              }}
              className="bg-emerald-600 text-white text-xs font-semibold px-4 py-2.5 rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-1 cursor-pointer whitespace-nowrap"
            >
              <Plus className="w-4 h-4" /> Tạo giao dịch nhập mới
            </button>
          </div>

          {/* Form Thêm/Sửa Nhà Cung Cấp */}
          {showSupplierForm && (
            <form
              onSubmit={handleSaveSupplier}
              className="bg-emerald-50/40 p-5 rounded-xl border border-emerald-200 shadow-sm animate-fade-in relative"
            >
              <button type="button" onClick={resetSupplierForm} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1">
                <X className="w-5 h-5" />
              </button>
              <h3 className="text-sm font-bold text-emerald-800 mb-4 flex items-center gap-2">
                <Edit className="w-4 h-4" /> {editingSupplierTxId ? "Chỉnh sửa Giao dịch NCC" : "Thêm mới Giao dịch NCC"}
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Mã hóa đơn nhập <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    disabled={!!editingSupplierTxId}
                    value={supplierForm.id}
                    onChange={(e) => setSupplierForm({ ...supplierForm, id: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Ngày nhập <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={supplierForm.date}
                    onChange={(e) => setSupplierForm({ ...supplierForm, date: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nhà cung cấp <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={supplierForm.supplierName}
                    onChange={(e) => setSupplierForm({ ...supplierForm, supplierName: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Mã vắc xin nhập</label>
                  <input
                    type="text"
                    required
                    value={supplierForm.vaccineCode}
                    onChange={(e) => setSupplierForm({ ...supplierForm, vaccineCode: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Số lượng</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={supplierForm.quantity}
                    onChange={(e) => setSupplierForm({ ...supplierForm, quantity: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Giá (VND)</label>
                  <input
                    type="text"
                    required
                    value={formatCurrencyInput(supplierForm.price)}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, "");
                      setSupplierForm({ ...supplierForm, price: val ? Number(val) : 0 });
                    }}
                    placeholder="VD: 1,000,000"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="flex justify-end mt-4">
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 text-white rounded-lg text-xs font-semibold shadow-sm hover:bg-emerald-700 flex items-center gap-1.5 transition-colors"
                >
                  <Save className="w-4 h-4" /> Lưu thông tin
                </button>
              </div>
            </form>
          )}

          {/* Grid View Nhà Cung Cấp */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="font-bold text-sm text-slate-700">Danh sách giao dịch nhập vắc-xin</h3>
              <span className="bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-xs font-extrabold border border-emerald-100">
                Tổng số: {filteredSupplierTxs.length} bản ghi
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs uppercase font-bold tracking-wider">
                    <th className="px-4 py-3">STT</th>
                    <th className="px-4 py-3">Ngày</th>
                    <th className="px-4 py-3">Mã hóa đơn</th>
                    <th className="px-4 py-3">Nhà cung cấp</th>
                    <th className="px-4 py-3">Mã vắc xin</th>
                    <th className="px-4 py-3 text-center">Số lượng</th>
                    <th className="px-4 py-3 text-right">Giá</th>
                    <th className="px-4 py-3 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredSupplierTxs.length > 0 ? (
                    filteredSupplierTxs.map((tx, idx) => (
                      <tr key={tx.id} className="hover:bg-slate-50/50">
                        <td className="px-4 py-3.5 text-xs text-slate-500 font-bold">{idx + 1}</td>
                        <td className="px-4 py-3.5 text-xs text-slate-600 font-mono">{tx.date}</td>
                        <td className="px-4 py-3.5 text-xs font-bold text-emerald-600 font-mono">{tx.id}</td>
                        <td className="px-4 py-3.5 text-sm font-semibold text-slate-800">{tx.supplierName}</td>
                        <td className="px-4 py-3.5 text-xs text-slate-600">{tx.vaccineCode}</td>
                        <td className="px-4 py-3.5 text-sm text-center font-bold text-slate-700">{tx.quantity}</td>
                        <td className="px-4 py-3.5 text-sm text-right font-extrabold text-slate-800">{tx.price.toLocaleString()} VNĐ</td>
                        <td className="px-4 py-3.5 text-right space-x-2">
                          <button
                            onClick={() => handleEditSupplier(tx)}
                            className="text-emerald-600 bg-emerald-50 hover:bg-emerald-100 p-1.5 rounded transition-colors"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteSupplier(tx.id)}
                            className="text-red-600 bg-red-50 hover:bg-red-100 p-1.5 rounded transition-colors"
                            title="Delete"
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
      {/* TAB 3: QUẢN LÝ GIÁ VẮC XIN TỪ DB - Responsive table-fixed */}
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

          {/* Form Chỉnh Sửa Giá Vắc Xin */}
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
                      const val = e.target.value.replace(/\D/g, ""); // Xóa chữ cái
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

          {/* Grid View Quản lý Giá (Responsive 12-inch friendly) */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
            {/* ĐÃ THÊM HEADER VÀ TỔNG SỐ BẢN GHI CHO TAB 3 */}
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
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeletePrice(p.id)}
                            className="text-red-600 bg-red-50 hover:bg-red-100 p-1.5 rounded transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-slate-400 text-xs">
                        Không có dữ liệu định giá vắc xin.
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