import React, { useState, useEffect } from "react";
import { FAQ, SystemLog } from "../types";
import { HelpCircle, MessageSquare, Plus, Send, Save, Bell, Search, X, Mail } from "lucide-react";

export interface FAQType {
  id?: string | number | null;
  question: string;
  answer: string;
}

export interface Reminder {
  id: string | number;
  patientId: string | number;
  patientName: string;
  expectedDate: string;
  vaccineName: string;
  estimatedPrice: number;
  email: string;
  status: "Chưa gửi" | "Đã gửi";
}

// Định nghĩa kiểu dữ liệu Ticket (Giải đáp thắc mắc) chuẩn SRS
export interface SupportTicket {
  id: string | number;
  customerName: string;
  comments: string;
  email: string;
  status: "Chưa giải quyết" | "Đã giải quyết";
  responseText?: string;
  time?: string;
}

interface SupportModuleProps {
  faqs: FAQ[];
  setFaqs: React.Dispatch<React.SetStateAction<FAQ[]>>;
  systemLogs: SystemLog[];
  setSystemLogs: React.Dispatch<React.SetStateAction<SystemLog[]>>;
  triggerToast: (msg: string) => void;
}

export default function SupportModule({ faqs, setFaqs, systemLogs, setSystemLogs, triggerToast }: SupportModuleProps) {
  const [activeTab, setActiveTab] = useState<"reminder" | "faq" | "tickets">("tickets");

  // ==========================================
  // STATE: MÀN HÌNH 1 - NHẮC NHỞ TIÊM CHỦNG
  // ==========================================
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [selectedReminder, setSelectedReminder] = useState<Reminder | null>(null);
  const [reminderEmail, setReminderEmail] = useState("");
  const [reminderErrors, setReminderErrors] = useState<Record<string, string>>({});
  const [isLoadingReminders, setIsLoadingReminders] = useState(false);

  const fetchReminders = async () => {
    setIsLoadingReminders(true);
    try {
      const response = await fetch("http://localhost:8080/api/support/reminders");
      if (response.ok) {
        const data = await response.json();
        const today = new Date();
        const offset = today.getTimezoneOffset();
        const localToday = new Date(today.getTime() - offset * 60 * 1000).toISOString().split("T")[0];

        const mappedData: Reminder[] = data
          .filter((item: any) => item.expectedDate >= localToday)
          .map((item: any) => ({
            id: `DKT${String(item.id).padStart(3, "0")}`,
            patientId: `BN${String(item.patientId).padStart(3, "0")}`,
            patientName: item.patientName,
            expectedDate: item.expectedDate,
            vaccineName: item.vaccineName,
            estimatedPrice: item.estimatedPrice || 0,
            email: item.email || "",
            status: "Chưa gửi",
          }));
        setReminders(mappedData);
      }
    } catch (error) {
      console.error("Lỗi kết nối:", error);
    } finally {
      setIsLoadingReminders(false);
    }
  };

  // ==========================================
  // STATE: MÀN HÌNH 2 - TƯ VẤN TIÊM CHỦNG (FAQ)
  // ==========================================
  const [faqsList, setFaqsList] = useState<FAQType[]>([]);
  const [selectedFaq, setSelectedFaq] = useState<FAQType | null>(null);
  const [faqQuestion, setFaqQuestion] = useState("");
  const [faqAnswer, setFaqAnswer] = useState("");
  const [faqErrors, setFaqErrors] = useState<Record<string, string>>({});
  const [isLoadingFaqs, setIsLoadingFaqs] = useState(false);

  const fetchFaqs = async () => {
    setIsLoadingFaqs(true);
    try {
      const response = await fetch("http://localhost:8080/api/support/faqs");
      if (response.ok) {
        const data = await response.json();
        setFaqsList(data);
      } else {
        triggerToast("Lỗi lấy danh sách FAQ!");
      }
    } catch (error) {
      console.error("Lỗi kết nối:", error);
    } finally {
      setIsLoadingFaqs(false);
    }
  };

  // ==========================================
  // STATE: MÀN HÌNH 3 - GIẢI ĐÁP THẮC MẮC (TICKETS)
  // ==========================================
  const [ticketsList, setTicketsList] = useState<SupportTicket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [ticketResponse, setTicketResponse] = useState("");
  const [ticketEmail, setTicketEmail] = useState("");
  const [ticketErrors, setTicketErrors] = useState<Record<string, string>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoadingTickets, setIsLoadingTickets] = useState(false);

  const fetchTickets = async () => {
    setIsLoadingTickets(true);
    try {
      const res = await fetch("http://localhost:8080/api/customer/feedback/list");
      if (res.ok) {
        const data = await res.json();
        const mapped = data.map((t: any) => ({
          id: `PH-${String(t.id).padStart(3, "0")}`,
          customerName: t.customerName,
          comments: t.comments,
          email: t.email || "chua_cap_nhat@gmail.com",

          // SỬA LẠI DÒNG STATUS NÀY:
          status: t.responseText && t.responseText.trim() !== "" ? "Đã giải quyết" : "Chưa giải quyết",

          responseText: t.responseText,
          time: t.time || "Chưa cập nhật",
        }));
        setTicketsList(mapped);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingTickets(false);
    }
  };

  useEffect(() => {
    if (activeTab === "reminder") fetchReminders();
    if (activeTab === "faq") fetchFaqs();
    if (activeTab === "tickets") fetchTickets();
  }, [activeTab]);

  // ---------- HANDLERS NHẮC NHỞ ----------
  const handleSelectReminder = (rem: Reminder) => {
    setSelectedReminder(rem);
    setReminderEmail(rem.email);
    setReminderErrors({});
  };

  const handleSendReminder = (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};

    if (!reminderEmail.trim()) errors.email = "Vui lòng nhập Email để gởi";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(reminderEmail)) errors.email = "Email không hợp lệ";

    if (Object.keys(errors).length > 0) {
      setReminderErrors(errors);
      triggerToast("Lỗi gởi email");
      return;
    }

    const updated = reminders.map((r) => (r.id === selectedReminder?.id ? { ...r, status: "Đã gửi" as const, email: reminderEmail } : r));
    setReminders(updated);
    triggerToast("Email được gởi đi");
    setSelectedReminder(null);
  };

  const handleCancelReminder = () => {
    setSelectedReminder(null);
    setReminderErrors({});
  };

  // ----------------------------------------------------------------------
  // HANDLERS: TƯ VẤN TIÊM CHỦNG (FAQ)
  // ----------------------------------------------------------------------
  const selectFaqForEditing = (faq: FAQType) => {
    setSelectedFaq(faq);
    setFaqQuestion(faq.question);
    setFaqAnswer(faq.answer);
    setFaqErrors({});
  };

  const handleAddFaq = () => {
    const newFaq: FAQType = { id: null, question: "", answer: "" };
    setSelectedFaq(newFaq);
    setFaqQuestion("");
    setFaqAnswer("");
    setFaqErrors({});
  };

  const handleSaveFaq = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFaq) return;

    const errors: Record<string, string> = {};
    if (!faqQuestion.trim()) errors.question = "Vui lòng nhập nội dung câu hỏi";
    if (!faqAnswer.trim()) errors.answer = "Vui lòng nhập nội dung trả lời";

    if (Object.keys(errors).length > 0) {
      setFaqErrors(errors);
      triggerToast("Báo lỗi: Vui lòng nhập đầy đủ thông tin");
      return;
    }

    try {
      const isEditing = selectedFaq.id != null;
      const url = isEditing ? `http://localhost:8080/api/support/faqs/${selectedFaq.id}` : `http://localhost:8080/api/support/faqs`;

      const method = isEditing ? "PUT" : "POST";

      const response = await fetch(url, {
        method: method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: faqQuestion, answer: faqAnswer }),
      });

      if (response.ok) {
        triggerToast(isEditing ? "Đã cập nhật câu hỏi thành công" : "Đã thêm câu hỏi FAQ thành công");
        fetchFaqs();
        setSelectedFaq(null);
      } else {
        triggerToast("Lỗi khi lưu dữ liệu vào hệ thống!");
      }
    } catch (error) {
      triggerToast("Lỗi kết nối tới máy chủ!");
    }
  };

  // ----------------------------------------------------------------------
  // HANDLERS: GIẢI ĐÁP THẮC MẮC (TICKETS) - SỬA LẠI THEO HỆ THỐNG SRS
  // ----------------------------------------------------------------------
  const selectTicketForProcessing = (t: SupportTicket) => {
    setSelectedTicket(t);
    setTicketResponse(t.responseText || "");
    setTicketEmail(t.email || "");
    setTicketErrors({});
  };

  const handleCancelTicket = () => {
    setSelectedTicket(null);
    setTicketResponse("");
    setTicketEmail("");
    setTicketErrors({});
  };

  const handleProcessTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket) return;

    const errors: Record<string, string> = {};
    if (!ticketEmail.trim()) {
      errors.email = "Bắt buộc nhập Email";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(ticketEmail)) {
      errors.email = "Email không hợp lệ";
    }
    if (!ticketResponse.trim()) {
      errors.response = "Bắt buộc nhập nội dung trả lời";
    }

    if (Object.keys(errors).length > 0) {
      setTicketErrors(errors);
      triggerToast("Lỗi gởi email"); // Hiện thông báo lỗi màu đỏ theo SRS
      return;
    }

    try {
      // Bỏ phần chữ "PH-" để lấy ID gốc truyền cho Endpoint
      const rawId = String(selectedTicket.id).replace("PH-", "");
      const res = await fetch(`http://localhost:8080/api/customer/feedback/resolve/${rawId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ normalContent: ticketResponse }),
      });

      if (res.ok) {
        triggerToast("Email được gởi đi"); // Thành công: Email được gởi đi
        setSelectedTicket(null);
        fetchTickets();
      } else {
        triggerToast("Lỗi gởi email");
      }
    } catch (err) {
      triggerToast("Lỗi gởi email");
    }
  };

  const formatCurrency = (val: number) => {
    return val.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") + " VNĐ";
  };

  const filteredTickets = ticketsList.filter(
    (t) => t.customerName.toLowerCase().includes(searchQuery.toLowerCase()) || String(t.id).toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="space-y-6 animate-fade-in h-full flex flex-col">
      {/* Header Module */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">💬 Phân hệ Hỗ Trợ & Tư Vấn (Support)</h2>
        <p className="text-sm text-slate-500 mt-1">Gửi nhắc nhở tiêm chủng, biên tập FAQ và giải đáp thắc mắc người dân.</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200 flex space-x-2">
        <button
          onClick={() => setActiveTab("reminder")}
          className={`px-4 py-2.5 font-medium text-sm border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === "reminder" ? "border-blue-600 text-blue-600" : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Bell className="w-4 h-4" /> Nhắc nhở tiêm chủng
        </button>
        <button
          onClick={() => setActiveTab("faq")}
          className={`px-4 py-2.5 font-medium text-sm border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === "faq" ? "border-blue-600 text-blue-600" : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <HelpCircle className="w-4 h-4" /> Tư vấn tiêm chủng (FAQ)
        </button>
        <button
          onClick={() => setActiveTab("tickets")}
          className={`px-4 py-2.5 font-medium text-sm border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === "tickets" ? "border-blue-600 text-blue-600" : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <MessageSquare className="w-4 h-4" /> Giải đáp thắc mắc
        </button>
      </div>

      {/* ==================================================================================== */}
      {/* MÀN HÌNH 1: NHẮC NHỞ TIÊM CHỦNG */}
      {/* ==================================================================================== */}
      {activeTab === "reminder" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start h-[600px]">
          {/* Cột trái: Bảng danh sách */}
          <div className="lg:col-span-8 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-full">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
              <h3 className="font-bold text-slate-800 text-sm">Danh sách Bệnh nhân tới hạn tiêm</h3>
              <span className="bg-blue-100 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded-full">{reminders.length} danh sách</span>
            </div>
            <div className="overflow-auto flex-1">
              <table className="w-full text-left text-xs border-collapse table-fixed">
                <thead className="sticky top-0 bg-white shadow-sm z-10">
                  <tr className="text-slate-500 font-bold border-b border-slate-200 uppercase">
                    <th className="px-3 py-3 w-[10%]">STT</th>
                    <th className="px-3 py-3 w-[20%]">Ngày tiêm</th>
                    <th className="px-3 py-3 w-[35%]">Loại vắc xin</th>
                    <th className="px-3 py-3 w-[20%]">Giá dự kiến</th>
                    <th className="px-3 py-3 w-[15%] text-center">Trạng thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {isLoadingReminders ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                        Đang tải dữ liệu từ CSDL...
                      </td>
                    </tr>
                  ) : reminders.length > 0 ? (
                    reminders.map((rem, idx) => (
                      <tr
                        key={rem.id}
                        onClick={() => handleSelectReminder(rem)}
                        className={`cursor-pointer transition-colors ${
                          selectedReminder?.id === rem.id ? "bg-blue-50/70 border-l-4 border-blue-600" : "hover:bg-slate-50"
                        }`}
                      >
                        <td className="px-3 py-3.5 font-bold text-slate-500">{idx + 1}</td>
                        <td className="px-3 py-3.5 font-semibold text-slate-800">{rem.expectedDate}</td>
                        <td className="px-3 py-3.5 text-blue-700 break-words">{rem.vaccineName}</td>
                        <td className="px-3 py-3.5 font-mono text-slate-600">{formatCurrency(rem.estimatedPrice)}</td>
                        <td className="px-3 py-3.5 text-center">
                          <span
                            className={`inline-block px-2 py-1 rounded text-[10px] font-bold whitespace-nowrap ${rem.status === "Đã gửi" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}
                          >
                            {rem.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                        Không có bệnh nhân nào tới hạn tiêm.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Cột phải: Khung Action gửi Email */}
          <div className="lg:col-span-4 h-full">
            {!selectedReminder ? (
              <div className="bg-slate-50 rounded-xl border border-dashed border-slate-200 p-8 text-center text-slate-400 text-sm h-full flex items-center justify-center">
                Chọn một lịch tiêm bên trái để thao tác gởi Email.
              </div>
            ) : (
              <form
                onSubmit={handleSendReminder}
                noValidate
                className="bg-blue-50/30 p-5 rounded-xl border border-blue-200 shadow-sm flex flex-col h-full ring-1 ring-blue-50"
              >
                <div className="border-b border-blue-100 pb-3 mb-4">
                  <h3 className="text-sm font-bold text-blue-700 flex items-center gap-2">
                    <Mail className="w-4 h-4" /> Gởi Email Nhắc Nhở
                  </h3>
                </div>
                <div className="space-y-4 flex-1">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Bệnh nhân</label>
                    <div className="text-sm font-bold text-slate-800 break-words">{selectedReminder.patientName}</div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Loại vắc xin dự kiến</label>
                    <div className="text-sm font-semibold text-blue-700 break-words">{selectedReminder.vaccineName}</div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Ngày tiêm</label>
                    <div className="text-sm text-slate-800">{selectedReminder.expectedDate}</div>
                  </div>

                  <div className="pt-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Email Address (Khách hàng) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      maxLength={100}
                      value={reminderEmail}
                      onChange={(e) => {
                        setReminderEmail(e.target.value);
                        setReminderErrors({});
                      }}
                      className={`w-full px-3 py-2 border rounded-lg text-xs outline-none transition-colors ${reminderErrors.email ? "border-red-500 focus:border-red-500 bg-red-50" : "border-slate-300 focus:border-blue-500"}`}
                      placeholder="Nhập địa chỉ email..."
                    />
                    {reminderErrors.email && <p className="text-[10px] text-red-500 font-bold mt-1">{reminderErrors.email}</p>}
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t border-blue-100">
                  <button
                    type="button"
                    onClick={handleCancelReminder}
                    className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-600 bg-white hover:bg-slate-50 transition-colors"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 flex items-center gap-1.5 transition-colors"
                  >
                    <Send className="w-3.5 h-3.5" /> Gởi
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ==================================================================================== */}
      {/* MÀN HÌNH 2: TƯ VẤN TIÊM CHỦNG (FAQ) */}
      {/* ==================================================================================== */}
      {activeTab === "faq" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start h-[600px]">
          {/* Cột trái: Bảng câu hỏi */}
          <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-full">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
              <h3 className="font-bold text-slate-800 text-sm">Bảng câu hỏi (FAQ)</h3>
              <button
                onClick={handleAddFaq}
                className="px-2.5 py-1.5 text-blue-600 bg-white border border-slate-200 rounded-lg hover:bg-blue-50 transition-colors flex items-center gap-1 text-xs font-semibold shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" /> Thêm mới
              </button>
            </div>
            <div className="overflow-y-auto flex-1 divide-y divide-slate-100">
              {isLoadingFaqs ? (
                <div className="p-8 text-center text-xs text-slate-400">Đang tải câu hỏi từ hệ thống...</div>
              ) : faqsList.length > 0 ? (
                faqsList.map((faq, idx) => (
                  <div
                    key={faq.id}
                    onClick={() => selectFaqForEditing(faq)}
                    className={`p-4 cursor-pointer text-sm transition-colors flex items-start gap-2 ${
                      selectedFaq?.id === faq.id ? "bg-blue-50/70 border-l-4 border-blue-600" : "hover:bg-slate-50"
                    }`}
                  >
                    <span className="font-mono text-xs font-bold text-slate-400 mt-0.5">{idx + 1}.</span>
                    <div className="flex-1 text-slate-800 font-medium break-words pr-2 line-clamp-2">{faq.question}</div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-xs text-slate-400">Chưa có câu hỏi nào. Nhấn Thêm mới để tạo.</div>
              )}
            </div>
          </div>

          {/* Cột phải: Bảng trả lời (Textbox) */}
          <div className="lg:col-span-7 h-full">
            {!selectedFaq ? (
              <div className="bg-slate-50 rounded-xl border border-dashed border-slate-200 p-8 text-center text-slate-400 text-sm h-full flex items-center justify-center">
                Chọn một câu hỏi bên trái hoặc Thêm mới để biên tập.
              </div>
            ) : (
              <form onSubmit={handleSaveFaq} noValidate className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col h-full">
                <div className="border-b border-slate-100 pb-3 flex justify-between items-center mb-4">
                  <h3 className="text-sm font-bold text-slate-800">
                    {selectedFaq.id ? `Chỉnh sửa Câu hỏi FAQ (ID: ${selectedFaq.id})` : "Tạo mới Câu hỏi FAQ"}
                  </h3>
                </div>

                <div className="space-y-4 flex-1 flex flex-col">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Nội dung câu hỏi <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      maxLength={255}
                      value={faqQuestion}
                      onChange={(e) => {
                        setFaqQuestion(e.target.value);
                        setFaqErrors({ ...faqErrors, question: "" });
                      }}
                      placeholder="VD: Trẻ bị ốm có tiêm phòng được không?"
                      className={`w-full px-3 py-2 border rounded-lg text-sm font-semibold outline-none transition-colors ${
                        faqErrors.question ? "border-red-500 focus:border-red-500 bg-red-50" : "border-slate-300 focus:border-blue-500"
                      }`}
                    />
                    {faqErrors.question && <p className="text-[10px] text-red-500 font-bold mt-1">{faqErrors.question}</p>}
                  </div>

                  <div className="flex-1 flex flex-col">
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Bảng trả lời (Textbox) <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      maxLength={1000}
                      value={faqAnswer}
                      onChange={(e) => {
                        setFaqAnswer(e.target.value);
                        setFaqErrors({ ...faqErrors, answer: "" });
                      }}
                      placeholder="Viết nội dung giải đáp y khoa và lời khuyên chính quy..."
                      className={`w-full flex-1 px-3 py-2 border rounded-lg text-sm outline-none resize-none transition-colors ${
                        faqErrors.answer ? "border-red-500 focus:border-red-500 bg-red-50" : "border-slate-300 focus:border-emerald-500"
                      }`}
                    />
                    {faqErrors.answer && <p className="text-[10px] text-red-500 font-bold mt-1">{faqErrors.answer}</p>}
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedFaq(null)}
                    className="px-5 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-600 bg-white hover:bg-slate-50 transition-colors"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 flex items-center gap-1.5 transition-colors"
                  >
                    <Save className="w-4 h-4" /> {selectedFaq.id ? "Cập nhật Trả lời" : "Đăng câu hỏi"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ==================================================================================== */}
      {/* MÀN HÌNH 3: GIẢI ĐÁP THẮC MẮC (TICKETS) - 10.6.3 Screen Giải đáp thắc mắc */}
      {/* ==================================================================================== */}
      {activeTab === "tickets" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start h-[600px]">
          {/* Cột trái: Danh sách phản ánh & Thắc mắc */}
          <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm flex flex-col h-full">
            <div className="p-4 bg-slate-50 border-b border-slate-200 text-sm font-bold text-slate-800">Đường dây phản ảnh của Khách Hàng</div>
            <div className="p-3 border-b border-slate-100">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tìm kiếm theo ID, Tên..."
                  className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 text-xs outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="overflow-y-auto flex-1 divide-y divide-slate-100">
              {isLoadingTickets ? (
                <div className="p-8 text-center text-xs text-slate-400">Đang tải phản ánh từ cơ sở dữ liệu...</div>
              ) : filteredTickets.length > 0 ? (
                filteredTickets.map((t) => (
                  <div
                    key={t.id}
                    onClick={() => selectTicketForProcessing(t)}
                    className={`p-4 cursor-pointer text-sm transition-colors flex flex-col space-y-2 ${
                      selectedTicket?.id === t.id ? "bg-blue-50/50 border-l-4 border-blue-600 font-semibold" : "hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-mono text-xs font-bold text-slate-400 break-words">
                        {t.id} | {t.customerName}
                      </span>
                      <span
                        className={`text-[9px] font-bold px-2 py-0.5 rounded whitespace-nowrap ${
                          t.status === "Đã giải quyết" ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-800"
                        }`}
                      >
                        {t.status}
                      </span>
                    </div>
                    <div className="text-xs text-slate-600 truncate">{t.comments}</div>
                    <div className="flex justify-between items-center mt-2 pt-2 border-t border-slate-100">
                      <div className="text-[10px] text-slate-400 font-mono">{t.email}</div>
                      <div className="text-[10px] text-slate-500 font-medium font-mono">📅 Ngày tiêm: {t.time}</div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-xs text-slate-400">Không có thắc mắc nào được gửi về trung tâm.</div>
              )}
            </div>
          </div>

          {/* Cột phải: Giao diện giải đáp thắc mắc */}
          <div className="lg:col-span-7 h-full">
            {!selectedTicket ? (
              <div className="bg-slate-50 rounded-xl border border-slate-200 p-8 text-center text-slate-400 text-sm h-full flex items-center justify-center">
                Nhấp chọn một thư thắc mắc từ bên trái để soạn hồi đáp.
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm flex flex-col h-full justify-between">
                <div>
                  <div className="border-b border-slate-100 pb-3 flex justify-between items-center">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 font-mono">
                        CÂU HỎI ID: {selectedTicket.id} • NGÀY TIÊM: {selectedTicket.time}
                      </span>
                      <h3 className="text-base font-bold text-slate-900 mt-0.5">Trả lời thắc mắc được gửi về trung tâm</h3>
                    </div>
                  </div>

                  <div className="mt-4 space-y-3">
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                      <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Nội dung câu hỏi (Câu hỏi):</p>
                      <p className="text-sm text-slate-700 mt-2 italic font-sans break-words">"{selectedTicket.comments}"</p>
                    </div>
                  </div>
                </div>

                <form onSubmit={handleProcessTicket} noValidate className="space-y-4 pt-4 border-t border-slate-100">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Email (Textbox) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      maxLength={100}
                      value={ticketEmail}
                      onChange={(e) => {
                        setTicketEmail(e.target.value);
                        setTicketErrors({ ...ticketErrors, email: "" });
                      }}
                      className={`w-full border border-slate-200 rounded-lg p-2.5 text-sm outline-none transition-colors ${
                        ticketErrors.email ? "border-red-500 bg-red-50 focus:border-red-500" : "border-slate-200 focus:border-blue-500"
                      }`}
                    />
                    {ticketErrors.email && <p className="text-[10px] text-red-500 font-bold mt-1">{ticketErrors.email}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Nội dung trả lời (Tra lời Text Field - String) <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      required
                      maxLength={1000}
                      value={ticketResponse}
                      onChange={(e) => {
                        setTicketResponse(e.target.value);
                        setTicketErrors({ ...ticketErrors, response: "" });
                      }}
                      placeholder="Viết thư hồi đáp cụ thể..."
                      className={`w-full border rounded-lg p-2.5 text-sm h-32 outline-none transition-colors ${
                        ticketErrors.response ? "border-red-500 bg-red-50 focus:border-red-500" : "border-slate-200 focus:border-blue-500"
                      }`}
                    />
                    {ticketErrors.response && <p className="text-[10px] text-red-500 font-bold mt-1">{ticketErrors.response}</p>}
                  </div>

                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={handleCancelTicket}
                      className="px-5 py-2.5 border border-slate-300 rounded-lg text-xs font-semibold text-slate-600 bg-white hover:bg-slate-50 transition-colors"
                    >
                      Hủy
                    </button>
                    <button
                      type="submit"
                      className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs px-5 py-2.5 rounded-lg flex items-center gap-1.5 cursor-pointer shadow-sm transition-colors"
                    >
                      <Send className="w-4 h-4" /> Gởi
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
