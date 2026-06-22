import React, { useState } from 'react';
import { FAQ, SupportTicket, SystemLog } from '../types';
import { HelpCircle, MessageSquare, Plus, Edit3, Send, Star, CheckCircle2, Save, Trash2, Clock, Check } from 'lucide-react';

interface SupportModuleProps {
  faqs: FAQ[];
  setFaqs: React.Dispatch<React.SetStateAction<FAQ[]>>;
  tickets: SupportTicket[];
  setTickets: React.Dispatch<React.SetStateAction<SupportTicket[]>>;
  systemLogs: SystemLog[];
  setSystemLogs: React.Dispatch<React.SetStateAction<SystemLog[]>>;
  triggerToast: (msg: string) => void;
}

export default function SupportModule({
  faqs,
  setFaqs,
  tickets,
  setTickets,
  systemLogs,
  setSystemLogs,
  triggerToast
}: SupportModuleProps) {
  const [activeTab, setActiveTab] = useState<'faq' | 'tickets'>('faq');

  // FAQ Editor state
  const [selectedFaq, setSelectedFaq] = useState<FAQ | null>(faqs[0] || null);
  const [faqQuestion, setFaqQuestion] = useState(faqs[0]?.question || '');
  const [faqAnswer, setFaqAnswer] = useState(faqs[0]?.answer || '');

  // Ticket processing state
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(tickets[0] || null);
  const [ticketResponse, setTicketResponse] = useState('');
  const [ticketStatus, setTicketStatus] = useState<'Mới' | 'Đang xử lý' | 'Đã giải quyết'>('Mới');

  const selectFaqForEditing = (faq: FAQ) => {
    setSelectedFaq(faq);
    setFaqQuestion(faq.question);
    setFaqAnswer(faq.answer);
  };

  const handleUpdateFaq = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFaq) return;

    const updated = faqs.map((f) => {
      if (f.id === selectedFaq.id) {
        return {
          ...f,
          question: faqQuestion,
          answer: faqAnswer,
          updatedAt: new Date().toISOString().split('T')[0],
        };
      }
      return f;
    });

    setFaqs(updated);
    triggerToast(`Đã cập nhật thành công câu hỏi FAQ: ${faqQuestion.substring(0, 30)}...`);

    // Log update
    setSystemLogs([
      {
        id: `LOG-${Date.now()}`,
        time: new Date().toISOString().replace('T', ' ').substring(0, 19),
        handler: 'Lê Văn Thanh (Hỗ trợ)',
        action: 'Cập nhật FAQ',
        details: `Cập nhật câu hỏi ID ${selectedFaq.id}. Câu hỏi sửa: "${faqQuestion.substring(0, 50)}"`,
      },
      ...systemLogs,
    ]);
  };

  const handleAddFaq = () => {
    const newFaq: FAQ = {
      id: `FAQ-${String(faqs.length + 1).padStart(3, '0')}`,
      question: 'Câu hỏi mới tiêm chủng bổ sung?',
      answer: 'Viết nội dung giải đáp câu hỏi tiêm chủng tại đây...',
      updatedAt: new Date().toISOString().split('T')[0],
    };

    setFaqs([...faqs, newFaq]);
    selectFaqForEditing(newFaq);
    triggerToast('Đã thêm một câu hỏi FAQ mẫu mới! Hãy chỉnh sửa nội dung bên phải.');
  };

  const selectTicketForProcessing = (t: SupportTicket) => {
    setSelectedTicket(t);
    setTicketResponse(t.responseText || '');
    setTicketStatus(t.status);
  };

  const handleProcessTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket) return;

    const updated = tickets.map((t) => {
      if (t.id === selectedTicket.id) {
        return {
          ...t,
          status: ticketStatus,
          responseText: ticketResponse,
        };
      }
      return t;
    });

    setTickets(updated);
    
    // Also reload active view
    setSelectedTicket({
      ...selectedTicket,
      status: ticketStatus,
      responseText: ticketResponse,
    });

    triggerToast(`Đã cập nhật phản hồi thành công cho phiếu phản ánh ${selectedTicket.id}!`);

    // System log
    setSystemLogs([
      {
        id: `LOG-${Date.now()}`,
        time: new Date().toISOString().replace('T', ' ').substring(0, 19),
        handler: 'Lê Văn Thanh (Hỗ trợ)',
        action: 'Giải quyết Hỗ Trợ',
        details: `Đã cập nhật ticket ${selectedTicket.id} từ ${selectedTicket.customerName}. Trạng thái mới: ${ticketStatus}. Phản hồi: "${ticketResponse.substring(0, 50)}"`,
      },
      ...systemLogs,
    ]);
  };

  const avgRating = tickets.length
    ? (tickets.reduce((acc, curr) => acc + curr.rating, 0) / tickets.length).toFixed(1)
    : '5.0';

  const pendingTicketsCount = tickets.filter((t) => t.status !== 'Đã giải quyết').length;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Module Title */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">💬 Phân hệ Hỗ Trợ & Tư Vấn Bệnh Nhân (Support)</h2>
        <p className="text-sm text-slate-500 mt-1">Biên tập hệ thống câu hỏi thường gặp FAQ, tiếp nhận phản ánh khiếu nại của phụ huynh và cập nhật phản hồi hỗ trợ.</p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between animate-fade-in">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Hỏi đáp Khai thác (FAQs)</p>
            <h3 className="text-2xl font-extrabold text-slate-800 mt-1">{faqs.length} Câu hỏi thường gặp</h3>
          </div>
          <HelpCircle className="w-10 h-10 text-blue-500 bg-blue-50 p-2 rounded-lg" />
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Mức đánh giá hài lòng</p>
            <h3 className="text-2xl font-extrabold text-amber-600 mt-1">⭐ {avgRating} / 5.0</h3>
          </div>
          <Star className="w-10 h-10 text-amber-500 bg-amber-50 p-2 rounded-lg fill-amber-400" />
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Số cuộc phản ánh tồn đọng</p>
            <h3 className={`text-2xl font-extrabold mt-1 ${pendingTicketsCount > 0 ? 'text-red-500 animate-pulse' : 'text-slate-800'}`}>
              {pendingTicketsCount} Phiếu cần trợ giúp
            </h3>
          </div>
          <MessageSquare className="w-10 h-10 text-red-500 bg-red-50 p-2 rounded-lg" />
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200 flex space-x-2">
        <button
          onClick={() => setActiveTab('faq')}
          className={`px-4 py-2.5 font-medium text-sm border-b-2 transition-colors ${
            activeTab === 'faq' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          📘 Soạn thảo câu hỏi FAQ
        </button>
        <button
          onClick={() => setActiveTab('tickets')}
          className={`px-4 py-2.5 font-medium text-sm border-b-2 transition-colors ${
            activeTab === 'tickets' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          📩 Phiếu phản ánh & Tư vấn cứu hộ ({tickets.length})
        </button>
      </div>

      {/* Panel contents */}
      {activeTab === 'faq' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* FAQ List on Left */}
          <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm flex flex-col h-[520px]">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
              <h3 className="font-bold text-slate-800 text-sm">Danh sách câu hỏi FAQ</h3>
              <button
                onClick={handleAddFaq}
                className="p-1 text-blue-600 bg-white border border-slate-200 rounded hover:bg-blue-50 transition-colors flex items-center gap-0.5 text-xs font-semibold cursor-pointer shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" /> Thêm câu hỏi
              </button>
            </div>
            
            <div className="overflow-y-auto flex-1 divide-y divide-slate-100">
              {faqs.map((faq, idx) => (
                <div
                  key={faq.id}
                  onClick={() => selectFaqForEditing(faq)}
                  className={`p-4 cursor-pointer text-sm transition-colors text-left relative overflow-hidden flex ${
                    selectedFaq?.id === faq.id ? 'bg-blue-50/50 border-l-4 border-blue-600 font-semibold' : 'hover:bg-slate-50'
                  }`}
                >
                  <span className="font-mono text-xs text-slate-400 w-10 shrink-0 mt-0.5">{idx + 1}</span>
                  <div className="flex-1 text-slate-800 truncate pr-2">{faq.question}</div>
                  <Edit3 className="w-4 h-4 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity ml-auto shrink-0" />
                </div>
              ))}
            </div>
          </div>

          {/* FAQ Detail Editor on Right */}
          {selectedFaq ? (
            <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 p-6 shadow-sm flex flex-col h-[520px]">
              <div className="border-b border-slate-100 pb-3 flex justify-between items-start">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">Phiên bản lưu ID: {selectedFaq.id}</span>
                  <h3 className="text-base font-bold text-slate-900 mt-1">Giao diện điều chỉnh chi tiết hỏi đáp</h3>
                </div>
                <span className="text-xs text-slate-400 font-mono">Cận nhật: {selectedFaq.updatedAt}</span>
              </div>

              <form onSubmit={handleUpdateFaq} className="space-y-4 flex-1 flex flex-col pt-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Mô tả và nội dung câu hỏi thường gặp *</label>
                  <input
                    type="text"
                    required
                    value={faqQuestion}
                    onChange={(e) => setFaqQuestion(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg p-2.5 text-sm font-semibold text-slate-800 outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div className="flex-1 flex flex-col">
                  <label className="block text-xs font-bold text-slate-700 mb-1">Nội dung giải đáp y khoa và lời khuyên chính quy *</label>
                  <textarea
                    required
                    value={faqAnswer}
                    onChange={(e) => setFaqAnswer(e.target.value)}
                    className="w-full flex-1 border border-slate-200 rounded-lg p-3 text-sm h-48 outline-none focus:ring-1 focus:ring-blue-500 font-sans leading-relaxed text-slate-700"
                  />
                </div>

                <div className="border-t border-slate-100 pt-4 flex justify-end">
                  <button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs px-5 py-2.5 rounded-lg flex items-center gap-1.5 cursor-pointer shadow-sm transition-colors"
                  >
                    <Save className="w-4 h-4" /> Ký tên & Cập nhật lên tệp bài viết FAQ
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="lg:col-span-7 bg-slate-50 rounded-xl border border-dashed border-slate-200 p-8 text-center text-slate-400">
              Chưa chọn câu hỏi nào. Nhấp vào danh sách bên trái để mở giao dịch soạn thảo.
            </div>
          )}
        </div>
      )}

      {activeTab === 'tickets' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Ticket List Left */}
          <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm flex flex-col h-[520px]">
            <div className="p-4 bg-slate-50 border-b border-slate-200 text-sm font-bold text-slate-800">
              Đường dây phản ảnh của Khách Hàng
            </div>
            
            <div className="overflow-y-auto flex-1 divide-y divide-slate-100">
              {tickets.length > 0 ? (
                tickets.map((t) => (
                  <div
                    key={t.id}
                    onClick={() => selectTicketForProcessing(t)}
                    className={`p-4 cursor-pointer text-sm transition-colors flex flex-col space-y-2 ${
                      selectedTicket?.id === t.id ? 'bg-blue-50/50 border-l-4 border-blue-600 font-semibold' : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-mono text-xs font-bold text-slate-400">{t.id} | {t.customerName}</span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          t.status === 'Đã giải quyết'
                            ? 'bg-emerald-50 text-emerald-800'
                            : t.status === 'Đang xử lý'
                            ? 'bg-blue-50 text-blue-800'
                            : 'bg-red-50 text-red-800'
                        }`}
                      >
                        {t.status}
                      </span>
                    </div>
                    <div className="text-xs text-slate-600 truncate">{t.comments}</div>
                    <div className="flex justify-between items-center text-[10px] text-slate-400 font-mono">
                      <span>Đánh giá: {'⭐'.repeat(t.rating)}</span>
                      <span>{t.date}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-slate-400">Không có phản ánh nào từ người dân.</div>
              )}
            </div>
          </div>

          {/* Ticket response detailed Right */}
          {selectedTicket ? (
            <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 p-6 shadow-sm flex flex-col h-[520px] justify-between">
              <div>
                <div className="border-b border-slate-100 pb-3 flex justify-between items-center">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 font-mono">PHẢN ÁNH THƯỜNG THIẾT ID: {selectedTicket.id}</span>
                    <h3 className="text-base font-bold text-slate-900 mt-0.5">Xử lý thư khiếu nại & khảo sát ý kiến</h3>
                  </div>
                  <span className="text-xs font-mono text-slate-400">{selectedTicket.date}</span>
                </div>

                <div className="mt-4 space-y-3">
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <p className="text-xs text-slate-400 font-bold">Ý KIẾN KHÁCH HÀNG (SĐT: {selectedTicket.phone}):</p>
                    <p className="text-sm text-slate-700 mt-2 italic">"{selectedTicket.comments}"</p>
                    <div className="mt-2 text-xs flex items-center gap-1.5 text-amber-500 font-semibold font-sans">
                      Duyệt độ hài lòng: {'⭐'.repeat(selectedTicket.rating)} ({selectedTicket.rating} Sao)
                    </div>
                  </div>
                </div>
              </div>

              <form onSubmit={handleProcessTicket} className="space-y-4 pt-4 border-t border-slate-100">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Bố trí trạng thái giải quyết</label>
                    <select
                      value={ticketStatus}
                      onChange={(e) => setTicketStatus(e.target.value as any)}
                      className="w-full border border-slate-200 rounded-lg p-2 text-sm bg-white outline-none"
                    >
                      <option value="Mới">Mới tiếp nhận (Chưa phản hồi)</option>
                      <option value="Đang xử lý">Đang phân tích định chế (Đang xử lý)</option>
                      <option value="Đã giải quyết">Đã giải quyết & Gửi SMS lời khuyên</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Thư của bàn giải đáp gửi Khách hàng *</label>
                  <textarea
                    required
                    value={ticketResponse}
                    onChange={(e) => setTicketResponse(e.target.value)}
                    placeholder="Viết thư hồi đáp cụ thể tới quý phụ huynh chi tiết..."
                    className="w-full border border-slate-200 rounded-lg p-2.5 text-sm h-32 outline-none"
                  />
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs px-5 py-2.5 rounded-lg flex items-center gap-1.5 cursor-pointer shadow-sm transition-colors animate-pulse"
                  >
                    <Send className="w-4 h-4" /> Ký đóng hồ sơ & Lưu gửi thư
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="lg:col-span-7 bg-slate-50 rounded-xl border border-slate-200 p-8 text-center text-slate-400">
              Nhấp chọn một thư phản hồi từ bên trái để viết hồi đáp.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
