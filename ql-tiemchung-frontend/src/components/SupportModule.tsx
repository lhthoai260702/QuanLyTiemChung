import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { FAQ, SystemLog } from "../types";
import { HelpCircle, MessageSquare, Plus, Send, Save, Bell, Search, X, Mail, CheckCircle2, Filter, ArrowLeft } from "lucide-react";
import axiosClient from "../utils/axiosClient";

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

// Định nghĩa kiểu dữ liệu Ticket (Giải đáp thắc mắc)
export interface SupportTicket {
  id: string | number;
  customerName: string;
  comments: string;
  email: string;
  status: string; // "Đang xử lý" | "Đã trả lời" | "Đã hoàn thành"
  responseText?: string;
  time?: string;
  chiTietPhanHoi?: string; // Chuỗi JSON lịch sử chat
}

interface ChatMessage {
  sender: "customer" | "admin" | "support";
  message: string;
  time: string;
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
  const navigate = useNavigate();

  // =========================================================================
  // CACHE SYSTEM & BẢO MẬT GỌI API
  // =========================================================================
  const apiCache = useRef<Record<string, { data: any; timestamp: number }>>({});
  const CACHE_TTL = 5 * 60 * 1000; // 5 phút

  const fetchWithCache = useCallback(async (url: string, forceRefetch = false) => {
    if (!forceRefetch && apiCache.current[url]) {
      const cached = apiCache.current[url];
      if (Date.now() - cached.timestamp < CACHE_TTL) {
        return cached.data;
      }
    }
    
    try {
      const response = await axiosClient.get(url);
      const data = response.data;
      apiCache.current[url] = { data, timestamp: Date.now() };
      return data;
    } catch (error: any) {
      if (error.response?.status === 401 || error.response?.status === 403) {
         triggerToast("Phiên đăng nhập đã hết hạn hoặc bạn không có quyền. Vui lòng đăng nhập lại!");
      }
      throw error;
    }
  }, [triggerToast]);


  // ==========================================
  // STATE: MÀN HÌNH 1 - NHẮC NHỞ TIÊM CHỦNG
  // ==========================================
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [selectedReminder, setSelectedReminder] = useState<Reminder | null>(null);
  const [reminderEmail, setReminderEmail] = useState("");
  const [reminderErrors, setReminderErrors] = useState<Record<string, string>>({});
  const [isLoadingReminders, setIsLoadingReminders] = useState(false);

  const fetchReminders = useCallback(async (force = false) => {
    setIsLoadingReminders(true);
    try {
      const data = await fetchWithCache(`/api/support/reminders`, force);
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
    } catch (error: any) {
      if (error.message !== "Unauthorized") console.error("Lỗi kết nối:", error);
    } finally {
      setIsLoadingReminders(false);
    }
  }, [fetchWithCache]);

  // ==========================================
  // STATE: MÀN HÌNH 2 - TƯ VẤN TIÊM CHỦNG (FAQ)
  // ==========================================
  const [faqsList, setFaqsList] = useState<FAQType[]>([]);
  const [selectedFaq, setSelectedFaq] = useState<FAQType | null>(null);
  const [faqQuestion, setFaqQuestion] = useState("");
  const [faqAnswer, setFaqAnswer] = useState("");
  const [faqErrors, setFaqErrors] = useState<Record<string, string>>({});
  const [isLoadingFaqs, setIsLoadingFaqs] = useState(false);

  const fetchFaqs = useCallback(async (force = false) => {
    setIsLoadingFaqs(true);
    try {
      const data = await fetchWithCache(`/api/support/faqs`, force);
      setFaqsList(data);
    } catch (error: any) {
      if (error.message !== "Unauthorized") console.error("Lỗi kết nối:", error);
    } finally {
      setIsLoadingFaqs(false);
    }
  }, [fetchWithCache]);

  // ==========================================
  // STATE: MÀN HÌNH 3 - GIẢI ĐÁP THẮC MẮC (TICKETS CHAT)
  // ==========================================
  const [ticketsList, setTicketsList] = useState<SupportTicket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [replyMessage, setReplyMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [ticketStatusFilter, setTicketStatusFilter] = useState<string>("Tất cả"); // Bổ sung bộ lọc trạng thái
  const [isLoadingTickets, setIsLoadingTickets] = useState(false);
  const [isReplying, setIsReplying] = useState(false);
  const [showConfirmCompleteModal, setShowConfirmCompleteModal] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Xử lý Debounce cho ô tìm kiếm
  useEffect(() => {
    const timerId = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);
    return () => clearTimeout(timerId);
  }, [searchQuery]);

  const fetchTickets = useCallback(async (force = false) => {
    setIsLoadingTickets(true);
    try {
      const data = await fetchWithCache(`/api/customer/feedback/list`, force);
      const mapped = data.map((t: any) => ({
        id: `PH-${t.id}`,
        customerName: t.customerName,
        comments: t.comments,
        email: t.email || "chưa_cập_nhật@gmail.com",
        status: t.status || "Đang xử lý",
        chiTietPhanHoi: t.chiTietPhanHoi,
        time: t.time || "Chưa cập nhật",
      }));
      setTicketsList(mapped);
    } catch (err: any) {
      if (err.message !== "Unauthorized") console.error(err);
    } finally {
      setIsLoadingTickets(false);
    }
  }, [fetchWithCache]);

  useEffect(() => {
    if (activeTab === "reminder") fetchReminders();
    if (activeTab === "faq") fetchFaqs();
    if (activeTab === "tickets") fetchTickets();
  }, [activeTab, fetchReminders, fetchFaqs, fetchTickets]);

  // Cập nhật lại màn hình chat nếu danh sách thay đổi (khi có tin nhắn mới)
  useEffect(() => {
    if (selectedTicket) {
      const updated = ticketsList.find((t) => t.id === selectedTicket.id);
      if (updated) setSelectedTicket(updated);
    }
  }, [ticketsList, selectedTicket?.id]);

  // Tự động cuộn xuống tin nhắn cuối
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [selectedTicket?.chiTietPhanHoi]);

  // ---------- HANDLERS NHẮC NHỞ ----------
  const handleSelectReminder = useCallback((rem: Reminder) => {
    setSelectedReminder(rem);
    setReminderEmail(rem.email);
    setReminderErrors({});
  }, []);

  const handleSendReminder = useCallback((e: React.FormEvent) => {
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
  }, [reminderEmail, reminders, selectedReminder, triggerToast]);

  const handleCancelReminder = useCallback(() => {
    setSelectedReminder(null);
    setReminderErrors({});
  }, []);

  // ---------- HANDLERS TƯ VẤN (FAQ) ----------
  const selectFaqForEditing = useCallback((faq: FAQType) => {
    setSelectedFaq(faq);
    setFaqQuestion(faq.question);
    setFaqAnswer(faq.answer);
    setFaqErrors({});
  }, []);

  const handleAddFaq = useCallback(() => {
    const newFaq: FAQType = { id: null, question: "", answer: "" };
    setSelectedFaq(newFaq);
    setFaqQuestion("");
    setFaqAnswer("");
    setFaqErrors({});
  }, []);

  const handleSaveFaq = useCallback(async (e: React.FormEvent) => {
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
      const url = isEditing ? `/api/support/faqs/${selectedFaq.id}` : `/api/support/faqs`;

      if (isEditing) {
          await axiosClient.put(url, { question: faqQuestion, answer: faqAnswer });
      } else {
          await axiosClient.post(url, { question: faqQuestion, answer: faqAnswer });
      }

      triggerToast(isEditing ? "Đã cập nhật câu hỏi thành công" : "Đã thêm câu hỏi FAQ thành công");
      fetchFaqs(true); // Force refetch sau khi lưu
      setSelectedFaq(null);
    } catch (error: any) {
        triggerToast(error.response?.data?.error || "Lỗi kết nối tới máy chủ!");
    }
  }, [selectedFaq, faqQuestion, faqAnswer, fetchFaqs, triggerToast]);

  // ---------- HANDLERS GIẢI ĐÁP (TICKETS CHAT) ----------
  const selectTicketForProcessing = useCallback((t: SupportTicket) => {
    setSelectedTicket(t);
    setReplyMessage("");
  }, []);

  const handleProcessTicket = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket || !replyMessage.trim()) return;

    // Giữ nguyên ID gốc để backend phân loại
    const realId = String(selectedTicket.id).replace("PH-", "");

    try {
      setIsReplying(true);
      await axiosClient.post(`/api/customer/feedback/reply`, {
        feedbackId: realId,
        replyContent: replyMessage,
        sender: "support", // Định danh là CSKH
      });

      setReplyMessage("");
      await fetchTickets(true); // Force refetch để lấy tin nhắn mới
    } catch (err: any) {
      triggerToast(err.response?.data?.error || "Lỗi gửi phản hồi");
    } finally {
      setIsReplying(false);
    }
  }, [selectedTicket, replyMessage, fetchTickets, triggerToast]);

  const handleCompleteTicket = useCallback(async () => {
    if (!selectedTicket) return;
    const realId = String(selectedTicket.id).replace("PH-", "");
    try {
      await axiosClient.put(`/api/customer/feedback/complete/${realId}`);
      triggerToast("Đã đóng phản hồi thành công!");
      setShowConfirmCompleteModal(false);
      await fetchTickets(true);
    } catch (err: any) {
      triggerToast(err.response?.data?.error || "Lỗi cập nhật trạng thái");
    }
  }, [selectedTicket, triggerToast, fetchTickets]);


  const renderChatHistory = useCallback((jsonStr?: string) => {
    if (!jsonStr || jsonStr === "null") return null;
    try {
      const messages: ChatMessage[] = JSON.parse(jsonStr);
      return messages.map((msg, idx) => {
        const isMe = msg.sender === "support" || msg.sender === "admin";
        return (
          <div key={idx} className={`flex w-full mb-4 ${isMe ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-2.5 shadow-sm text-[13px] ${
                isMe
                  ? "bg-blue-600 text-white rounded-tr-none"
                  : "bg-white text-slate-700 border border-slate-200 rounded-tl-none"
              }`}
            >
              {msg.sender === "customer" && (
                <p className="text-[10px] font-bold text-slate-400 mb-1">Khách hàng</p>
              )}
              <p className="whitespace-pre-wrap leading-relaxed">{msg.message}</p>
              <p className={`text-[10px] mt-1.5 ${isMe ? "text-blue-200 text-right" : "text-slate-400"}`}>
                {msg.sender === "admin" ? "👨‍💼 Ban Giám Đốc • " : msg.sender === "support" ? "🎧 Bạn (CSKH) • " : ""}
                {msg.time}
              </p>
            </div>
          </div>
        );
      });
    } catch (e) {
      return <div className="text-center text-xs text-slate-400">Lỗi hiển thị nội dung chat.</div>;
    }
  }, []);

  const formatCurrency = useCallback((val: number) => {
    return val.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") + " VNĐ";
  }, []);

  // --- LỌC, NHÓM VÀ SẮP XẾP TICKETS ---
  const uniqueTicketStatuses = useMemo(() => {
    return ["Tất cả", ...Array.from(new Set(ticketsList.map((t) => t.status).filter(Boolean)))];
  }, [ticketsList]);

  const filteredTickets = useMemo(() => {
    return ticketsList.filter((t) => {
      const matchesSearch = t.customerName.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) || 
                            String(t.id).toLowerCase().includes(debouncedSearchQuery.toLowerCase());
      const matchesStatus = ticketStatusFilter === "Tất cả" || t.status === ticketStatusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [ticketsList, debouncedSearchQuery, ticketStatusFilter]);

  const groupedTickets = useMemo(() => {
    const grouped = filteredTickets.reduce((acc, ticket) => {
      const status = ticket.status || "Chưa xác định";
      if (!acc[status]) acc[status] = [];
      acc[status].push(ticket);
      return acc;
    }, {} as Record<string, SupportTicket[]>);

    // Sort each group by time (Mới nhất lên trên)
    Object.keys(grouped).forEach((status) => {
      grouped[status].sort((a, b) => {
        const tA = new Date(a.time || "").getTime();
        const tB = new Date(b.time || "").getTime();
        if (!isNaN(tA) && !isNaN(tB)) return tB - tA;
        return (b.time || "").localeCompare(a.time || ""); // Fallback
      });
    });

    return grouped;
  }, [filteredTickets]);

  const sortedStatuses = useMemo(() => {
    const statusOrder = ["Đang xử lý", "Đã trả lời", "Đã hoàn thành"];
    return Object.keys(groupedTickets).sort((a, b) => {
      const indexA = statusOrder.indexOf(a);
      const indexB = statusOrder.indexOf(b);
      if (indexA !== -1 && indexB !== -1) return indexA - indexB;
      if (indexA === -1 && indexB !== -1) return 1;
      if (indexA !== -1 && indexB === -1) return -1;
      return a.localeCompare(b);
    });
  }, [groupedTickets]);


  return (
    <div className="space-y-6 animate-fade-in h-full flex flex-col">
      {/* Header Module */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">Hỗ trợ khách hàng</h2>
        <p className="text-sm text-slate-500 mt-1">Năng nắm bắt thông tin, hỗ trợ và phản hồi các thông tin từ khách hàng.</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200 flex space-x-2">
        <button
          onClick={() => setActiveTab("reminder")}
          className={`px-4 py-2.5 font-medium text-sm border-b-2 transition-colors flex items-center gap-2 cursor-pointer ${
            activeTab === "reminder" ? "border-blue-600 text-blue-600" : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Bell className="w-4 h-4" /> Nhắc nhở tiêm chủng
        </button>
        <button
          onClick={() => setActiveTab("faq")}
          className={`px-4 py-2.5 font-medium text-sm border-b-2 transition-colors flex items-center gap-2 cursor-pointer ${
            activeTab === "faq" ? "border-blue-600 text-blue-600" : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <HelpCircle className="w-4 h-4" /> Tư vấn tiêm chủng (FAQ)
        </button>
        <button
          onClick={() => {
            setActiveTab("tickets");
            setSelectedTicket(null);
          }}
          className={`px-4 py-2.5 font-medium text-sm border-b-2 transition-colors flex items-center gap-2 cursor-pointer ${
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
          <div className="lg:col-span-8 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-full">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
              <h3 className="font-bold text-slate-800 text-sm">Danh sách Bệnh nhân tới hạn tiêm</h3>
              <span className="bg-blue-100 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded-full">{reminders.length} bản ghi</span>
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
                    className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-600 bg-white hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 flex items-center gap-1.5 transition-colors cursor-pointer"
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
          <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-full">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
              <h3 className="font-bold text-slate-800 text-sm">Bảng câu hỏi (FAQ)</h3>
              <button
                onClick={handleAddFaq}
                className="px-2.5 py-1.5 text-blue-600 bg-white border border-slate-200 rounded-lg hover:bg-blue-50 transition-colors flex items-center gap-1 text-xs font-semibold shadow-sm cursor-pointer"
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
                    className="px-5 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-600 bg-white hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Save className="w-4 h-4" /> {selectedFaq.id ? "Lưu" : "Đăng câu hỏi"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ==================================================================================== */}
      {/* MÀN HÌNH 3: GIẢI ĐÁP THẮC MẮC (CHAT LỊCH SỬ) */}
      {/* ==================================================================================== */}
      {activeTab === "tickets" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start h-[600px]">
          {/* Cột trái: Danh sách phản ánh & Thắc mắc */}
          <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm flex flex-col h-full">
            <div className="p-4 bg-slate-50 border-b border-slate-200 text-sm font-bold text-slate-800 shrink-0">Đường dây tiếp nhận thông tin</div>
            
            {/* Vùng Lọc và Tìm kiếm */}
            <div className="p-3 border-b border-slate-100 bg-slate-50/50 flex flex-col gap-2 shrink-0">
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
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-slate-400" />
                <select
                  value={ticketStatusFilter}
                  onChange={(e) => setTicketStatusFilter(e.target.value)}
                  className="flex-1 bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs outline-none focus:border-blue-500 cursor-pointer"
                >
                  {uniqueTicketStatuses.map((status) => (
                    <option key={status} value={status}>
                      {status} ({status === "Tất cả" ? ticketsList.length : ticketsList.filter((t) => t.status === status).length})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Danh sách đã nhóm và sắp xếp */}
            <div className="overflow-y-auto flex-1 p-2 bg-slate-50/20">
              {isLoadingTickets ? (
                <div className="p-8 text-center text-xs text-slate-400">Đang tải phản ánh từ cơ sở dữ liệu...</div>
              ) : sortedStatuses.length > 0 ? (
                sortedStatuses.map((status) => (
                  <div key={status} className="mb-4">
                    {/* Header Nhóm */}
                    <div className="sticky top-0 bg-white/95 backdrop-blur py-1.5 px-3 mb-2 border border-slate-100 rounded-lg shadow-sm z-10 flex justify-between items-center">
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">{status}</span>
                      <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md">
                        {groupedTickets[status].length}
                      </span>
                    </div>
                    {/* Các Items trong nhóm */}
                    <div className="space-y-1.5">
                      {groupedTickets[status].map((t) => {
                        const statusColor = 
                          t.status === "Đã hoàn thành" ? "bg-slate-100 text-slate-500 border-slate-200" :
                          t.status === "Đã trả lời" ? "bg-emerald-50 text-emerald-600 border-emerald-200" :
                          "bg-red-50 text-red-600 border-red-200";

                        return (
                        <div
                          key={t.id}
                          onClick={() => selectTicketForProcessing(t)}
                          className={`p-3 cursor-pointer rounded-xl transition-all flex flex-col space-y-2 ${
                            selectedTicket?.id === t.id
                              ? "bg-blue-50/50 border border-blue-200 shadow-sm"
                              : "bg-white border border-slate-100 hover:border-slate-300 hover:shadow-sm"
                          }`}
                        >
                          <div className="flex justify-between items-center">
                            <span className="font-mono text-xs font-bold text-slate-500 break-words">
                              {t.id} | <span className="text-slate-700">{t.customerName}</span>
                            </span>
                            <div className="flex items-center gap-2">
                              <span className={`text-[9px] px-1.5 py-0.5 rounded border font-semibold ${statusColor}`}>
                                {t.status}
                              </span>
                              <span className="text-[10px] text-slate-400">{t.time?.split(" ")[0]}</span>
                            </div>
                          </div>
                          <div className="text-xs text-slate-600 line-clamp-2">{t.comments}</div>
                          <div className="flex justify-between items-center mt-1 pt-1 border-t border-slate-100/50">
                            <div className="text-[10px] text-slate-400 font-mono">{t.email}</div>
                          </div>
                        </div>
                      )})}
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-xs text-slate-400">Không tìm thấy thắc mắc nào phù hợp.</div>
              )}
            </div>
          </div>

          {/* Cột phải: Giao diện Chat Lịch Sử */}
          <div className="lg:col-span-7 h-full flex-col min-h-0 flex">
            {!selectedTicket ? (
              <div className="bg-slate-50 rounded-xl border border-slate-200 p-8 text-center text-slate-400 text-sm flex-1 flex items-center justify-center">
                Nhấp chọn một thư thắc mắc từ bên trái để tham gia hỗ trợ.
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col h-full min-h-0 overflow-hidden">
                {/* Chat Header */}
                <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center shrink-0 z-10">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setSelectedTicket(null)}
                      className="lg:hidden p-1.5 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200"
                    >
                      <ArrowLeft className="w-4 h-4" />
                    </button>
                    <div>
                      <h4 className="font-bold text-sm text-slate-800 flex items-center gap-2">
                        Phiên hỗ trợ {selectedTicket.id}
                      </h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Khách hàng: <span className="font-semibold text-blue-600">{selectedTicket.customerName}</span> ({selectedTicket.email})
                      </p>
                    </div>
                  </div>
                  {selectedTicket.status === "Đã hoàn thành" && (
                    <span className="px-3 py-1.5 bg-slate-100 text-slate-500 border border-slate-200 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Đã đóng
                    </span>
                  )}
                </div>

                {/* Chat Body */}
                <div className="flex-1 overflow-y-auto min-h-0 p-4 bg-slate-50/50">
                  {renderChatHistory(selectedTicket.chiTietPhanHoi)}
                  <div ref={chatEndRef} />
                </div>

                {/* Chat Input */}
                <div className="p-4 bg-white border-t border-slate-200 shrink-0">
                  {selectedTicket.status === "Đã hoàn thành" ? (
                    <div className="text-center text-xs text-slate-400 italic py-2">Khách hàng đã xác nhận giải quyết xong sự cố này.</div>
                  ) : (
                    <form onSubmit={handleProcessTicket} className="flex gap-2">
                      <input
                        type="text"
                        required
                        value={replyMessage}
                        onChange={(e) => setReplyMessage(e.target.value)}
                        placeholder="Nhập nội dung hỗ trợ khách hàng..."
                        className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-500 focus:bg-white transition-all"
                      />
                      <button
                        type="submit"
                        disabled={isReplying || !replyMessage.trim()}
                        className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold rounded-xl flex items-center justify-center transition-colors shadow-sm cursor-pointer"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    </form>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}