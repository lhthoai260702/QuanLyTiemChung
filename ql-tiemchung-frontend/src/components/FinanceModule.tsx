import React, { useState } from 'react';
import { Invoice, Vaccine, SystemLog } from '../types';
import { CreditCard, DollarSign, BarChart2, PieChart, Plus, Check, Sliders, ChevronDown, CheckCircle2, TrendingUp, RefreshCw, Printer } from 'lucide-react';

interface FinanceModuleProps {
  invoices: Invoice[];
  setInvoices: React.Dispatch<React.SetStateAction<Invoice[]>>;
  vaccines: Vaccine[];
  systemLogs: SystemLog[];
  setSystemLogs: React.Dispatch<React.SetStateAction<SystemLog[]>>;
  triggerToast: (msg: string) => void;
}

export default function FinanceModule({
  invoices,
  setInvoices,
  vaccines,
  systemLogs,
  setSystemLogs,
  triggerToast
}: FinanceModuleProps) {
  const [activeTab, setActiveTab] = useState<'billing' | 'charts' | 'pricing'>('billing');
  const [searchInvoiceQuery, setSearchInvoiceQuery] = useState('');

  // Surcharges for overhead pricing computation
  const [preservationFee, setPreservationFee] = useState(50000);
  const [laborFee, setLaborFee] = useState(30000);

  // Financial aggregates calculated dynamically
  const totalRevenues = invoices
    .filter((inv) => inv.status === 'Đã thanh toán')
    .reduce((sum, current) => sum + current.totalAmount, 0);

  const pendingRevenues = invoices
    .filter((inv) => inv.status === 'Chờ thanh toán')
    .reduce((sum, current) => sum + current.totalAmount, 0);

  const totalInvoicedCount = invoices.length;
  const paidInvoiceCount = invoices.filter((inv) => inv.status === 'Đã thanh toán').length;

  const handlePayInvoice = (invId: string) => {
    let affectedName = '';
    let affectedTarget = '';
    let affectedAmt = 0;
    
    const updated = invoices.map((inv) => {
      if (inv.id === invId) {
        affectedName = inv.customerName;
        affectedTarget = inv.vaccineName;
        affectedAmt = inv.totalAmount;
        return { ...inv, status: 'Đã thanh toán' as const };
      }
      return inv;
    });

    setInvoices(updated);
    triggerToast(`Đã thu ngân và lập biên nhận số: ${invId}. Nhận thành công: ${affectedAmt.toLocaleString()} ₫ từ ${affectedName}!`);

    // Record audit trade log
    setSystemLogs([
      {
        id: `LOG-${Date.now()}`,
        time: new Date().toISOString().replace('T', ' ').substring(0, 19),
        handler: 'Tống Khánh Linh (Tài chính)',
        action: 'Duyệt thanh toán hóa đơn',
        details: `Phê chuẩn hóa đơn ID ${invId} cho bệnh nhi ${affectedName} tiêm ${affectedTarget}. Số tiền thu quỹ: ${affectedAmt.toLocaleString()} VND.`,
      },
      ...systemLogs,
    ]);
  };

  const handleApplyFees = (e: React.FormEvent) => {
    e.preventDefault();
    triggerToast('Đã áp dụng định mức chi phí y khoa phụ trội mới thành công!');
    
    setSystemLogs([
      {
        id: `LOG-${Date.now()}`,
        time: new Date().toISOString().replace('T', ' ').substring(0, 19),
        handler: 'Tống Khánh Linh (Tài chính)',
        action: 'Sửa phí dịch vụ phụ trội',
        details: `Cập nhật phí bảo quản âm lạnh: ${preservationFee.toLocaleString()} VND, phí khám hao tổn: ${laborFee.toLocaleString()} VND`,
      },
      ...systemLogs,
    ]);
  };

  const filteredInvoices = invoices.filter((inv) =>
    inv.customerName.toLowerCase().includes(searchInvoiceQuery.toLowerCase()) ||
    inv.vaccineName.toLowerCase().includes(searchInvoiceQuery.toLowerCase()) ||
    inv.id.toLowerCase().includes(searchInvoiceQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Module Title */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">💵 Phân hệ Quản Lý Kế Toán & Kế Hoạch Tài Chính (Finance)</h2>
        <p className="text-sm text-slate-500 mt-1">Xuất hóa đơn thanh toán chương trình tiêm chủng dịch vụ, lập bảng biểu báo cáo doanh thu ngày, chỉnh sửa định phí bảo lạnh.</p>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Doanh thu thực tế đã thu</p>
            <h3 className="text-2xl font-extrabold text-emerald-600 mt-1">{totalRevenues.toLocaleString()} ₫</h3>
          </div>
          <DollarSign className="w-10 h-10 text-emerald-500 bg-emerald-50 p-2 rounded-lg" />
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Doanh số chờ thanh toán</p>
            <h3 className="text-2xl font-extrabold text-amber-600 mt-1">{pendingRevenues.toLocaleString()} ₫</h3>
          </div>
          <TrendingUp className="w-10 h-10 text-amber-500 bg-amber-50 p-2 rounded-lg" />
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Hóa đơn đã xuất quỹ</p>
            <h3 className="text-2xl font-extrabold text-slate-800 mt-1">{totalInvoicedCount} Hóa Đơn</h3>
          </div>
          <CreditCard className="w-10 h-10 text-blue-500 bg-blue-50 p-2 rounded-lg" />
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Tỷ lệ thanh toán nợ</p>
            <h3 className="text-2xl font-extrabold text-slate-800 mt-1">
              {totalInvoicedCount > 0 ? ((paidInvoiceCount / totalInvoicedCount) * 100).toFixed(0) : 0}%
            </h3>
          </div>
          <CheckCircle2 className="w-10 h-10 text-slate-500 bg-slate-50 p-2 rounded-lg" />
        </div>
      </div>

      {/* Tabs list */}
      <div className="border-b border-slate-200 flex space-x-2">
        <button
          onClick={() => setActiveTab('billing')}
          className={`px-4 py-2.5 font-medium text-sm border-b-2 transition-colors ${
            activeTab === 'billing' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          💳 Thu quỹ & Lập hóa đơn ({invoices.length})
        </button>
        <button
          onClick={() => setActiveTab('charts')}
          className={`px-4 py-2.5 font-medium text-sm border-b-2 transition-colors ${
            activeTab === 'charts' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          📊 Phân tích hiệu suất doanh thu (Charts)
        </button>
        <button
          onClick={() => setActiveTab('pricing')}
          className={`px-4 py-2.5 font-medium text-sm border-b-2 transition-colors ${
            activeTab === 'pricing' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          ⚙️ Cấu hình cấu trúc Đơn Giá vaccine
        </button>
      </div>

      {/* Tab Area */}
      {activeTab === 'billing' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex-1">
              <input
                type="text"
                value={searchInvoiceQuery}
                onChange={(e) => setSearchInvoiceQuery(e.target.value)}
                placeholder="Tìm hóa đơn nhanh theo tên cha mẹ, trẻ em, vaccine hoặc ID..."
                className="w-full bg-white px-4 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <button
              onClick={() => {
                triggerToast('Đang tạo báo cáo kết toán tổng hợp lên XML...');
              }}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg flex items-center gap-1 cursor-pointer"
            >
              <Printer className="w-4 h-4" /> Xuất chứng từ giao dịch
            </button>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs uppercase tracking-wider font-semibold">
                    <th className="px-5 py-3">Mã hóa đơn</th>
                    <th className="px-5 py-3">Người thanh toán</th>
                    <th className="px-5 py-3">Dịch vụ thụ hưởng</th>
                    <th className="px-5 py-3">Ngày xuất hóa đơn</th>
                    <th className="px-5 py-3 text-right">Tổng thành tiền</th>
                    <th className="px-5 py-3 text-center">Trạng thái quỹ</th>
                    <th className="px-5 py-3 text-right">Hành động thu phí</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700 text-sm">
                  {filteredInvoices.length > 0 ? (
                    filteredInvoices.map((inv) => (
                      <tr key={inv.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-5 py-3.5 font-mono text-xs font-bold text-slate-400">{inv.id}</td>
                        <td className="px-5 py-3.5">
                          <div className="font-semibold text-slate-800">{inv.customerName}</div>
                          <div className="text-[10px] text-slate-400 mt-0.5">SĐT: 090XXXXX</div>
                        </td>
                        <td className="px-5 py-3.5 font-medium text-slate-600">{inv.vaccineName}</td>
                        <td className="px-5 py-3.5 text-xs text-slate-400 font-mono">{inv.date}</td>
                        <td className="px-5 py-3.5 text-right font-extrabold text-blue-600 font-sans">
                          {inv.totalAmount.toLocaleString()} ₫
                        </td>
                        <td className="px-5 py-3.5 text-center">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold leading-none ${
                              inv.status === 'Đã thanh toán'
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-100'
                                : 'bg-red-50 text-red-800 border border-red-100 animate-pulse'
                            }`}
                          >
                            ● {inv.status}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          {inv.status === 'Chờ thanh toán' ? (
                            <button
                              onClick={() => handlePayInvoice(inv.id)}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg border border-emerald-700 transition-colors shadow-sm cursor-pointer"
                            >
                              Duyệt thanh toán
                            </button>
                          ) : (
                            <span className="text-xs text-slate-400 font-semibold italic flex items-center justify-end gap-1.5">
                              <Check className="w-4 h-4 text-emerald-500" /> Đã kết sổ quỹ
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="px-5 py-10 text-center text-slate-400">
                        Không tìm thấy hóa đơn nào trùng khớp với từ khóa tìm kiếm.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'charts' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fade-in">
          {/* Revenue column chart SVG */}
          <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1">
                <BarChart2 className="w-5 h-5 text-blue-600" /> Thống kê doanh thu theo tháng (2026)
              </h3>
              <span className="text-xs text-slate-400">Chỉ số: Triệu VND</span>
            </div>

            <div className="pt-4">
              {/* Custom SVG Column Chart representing revenue performance */}
              <div className="relative h-64 w-full flex items-end justify-between px-4 pb-6 border-b border-l border-slate-200 mt-2">
                {[
                  { m: 'T1', key: 120, h: 'h-[40%]', val: 120 },
                  { m: 'T2', key: 190, h: 'h-[65%]', val: 190 },
                  { m: 'T3', key: 240, h: 'h-[80%]', val: 240 },
                  { m: 'T4', key: 310, h: 'h-[95%]', val: 310 },
                  { m: 'T5', key: 280, h: 'h-[88%]', val: 280 },
                  { m: 'T6', key: 342, h: 'h-[100%]', val: 342 },
                ].map((col, idx) => (
                  <div key={idx} className="flex flex-col items-center flex-1 group relative">
                    <span className="absolute -top-6 text-[10px] font-bold text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">
                      {col.val}M
                    </span>
                    <div className={`${col.h} w-10 sm:w-12 bg-gradient-to-t from-blue-600 to-indigo-500 rounded-t-lg shadow-md hover:from-blue-500 hover:to-indigo-400 transition-all cursor-all-scroll`}></div>
                    <span className="text-xs font-semibold text-slate-500 mt-2">{col.m}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <p className="text-xs text-slate-400 italic text-center mt-2">
              📊 Biểu đồ cột thể hiện mức tăng trưởng liên tiếp nhờ kết nối hiệu quả của phân hệ dịch vụ cao cấp.
            </p>
          </div>

          {/* Market Share distribution vaccine */}
          <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1">
                <PieChart className="w-5 h-5 text-purple-600" /> Phân bổ thị phần vaccine yêu cầu
              </h3>
            </div>

            <div className="space-y-4 pt-2">
              {[
                { name: 'Sởi - Sởi, Quai Bị, Rubella (MMR II)', rate: '42%', color: 'bg-blue-600' },
                { name: 'Phế Cầu - Synflorix Bỉ', rate: '28%', color: 'bg-emerald-500' },
                { name: 'Bạch Hầu, Ho Gà, Uốn Ván - Infanrix Hexa', rate: '20%', color: 'bg-purple-500' },
                { name: 'Các vắc-xin dịch vụ đơn lẻ khác', rate: '10%', color: 'bg-slate-400' },
              ].map((share, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-700 truncate max-w-xs">{share.name}</span>
                    <span className="text-slate-900">{share.rate}</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div className={`${share.color} h-full`} style={{ width: share.rate }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'pricing' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-6 animate-fade-in">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-base font-bold text-slate-800">Cấu hình tham số phụ tội dịch vụ tiêm</h3>
            <p className="text-xs text-slate-500 mt-1">Định chất bán lẻ dịch vụ bằng thuốc nhập cộng thêm chi phí bảo dông lạnh nghiêm ngặt GSP và công khám.</p>
          </div>

          <form onSubmit={handleApplyFees} className="grid grid-cols-1 md:grid-cols-3 gap-4 border-b border-slate-100 pb-6">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Phí bảo quản âm lạnh GSP (VND)</label>
              <input
                type="number"
                value={preservationFee}
                onChange={(e) => setPreservationFee(Number(e.target.value))}
                className="w-full border border-slate-200 rounded-lg p-2 text-sm outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Công bác sĩ khám lâm sàng (VND)</label>
              <input
                type="number"
                value={laborFee}
                onChange={(e) => setLaborFee(Number(e.target.value))}
                className="w-full border border-slate-200 rounded-lg p-2 text-sm outline-none"
              />
            </div>
            <div className="flex items-end shadow-none">
              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs px-4 py-2 rounded-lg flex items-center justify-center gap-1 cursor-pointer transition-colors"
              >
                <Sliders className="w-4 h-4" /> Đồng bộ định giá
              </button>
            </div>
          </form>

          <div>
            <h4 className="text-sm font-bold text-slate-800 mb-2.5">Simulate: Giả lập đối chiếu bảng giá bán lẻ chính chức</h4>
            <div className="bg-slate-50 rounded-xl border border-slate-200 overflow-hidden">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="bg-slate-100/80 border-b border-slate-200 text-slate-500 text-xs font-semibold">
                    <th className="px-4 py-2.5">Vaccine</th>
                    <th className="px-4 py-2.5">Giá gốc (Pháp/Bỉ)</th>
                    <th className="px-4 py-2.5">Hào tổn GSP (+{preservationFee.toLocaleString()}₫)</th>
                    <th className="px-4 py-2.5">Khám định kỳ (+{laborFee.toLocaleString()}₫)</th>
                    <th className="px-4 py-2.5 text-right font-bold text-blue-700">Retail Giá Bán Lẻ (VND)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {vaccines.map((v) => (
                    <tr key={v.id}>
                      <td className="px-4 py-3 font-semibold text-slate-800">{v.name}</td>
                      <td className="px-4 py-3 font-mono">{(v.sellingPrice - preservationFee - laborFee).toLocaleString()} ₫</td>
                      <td className="px-4 py-3 font-mono text-cyan-700">{preservationFee.toLocaleString()} ₫</td>
                      <td className="px-4 py-3 font-mono text-slate-500">{laborFee.toLocaleString()} ₫</td>
                      <td className="px-4 py-3 text-right font-extrabold text-blue-600 font-mono italic text-sm">
                        {v.sellingPrice.toLocaleString()} ₫
                      </td>
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
