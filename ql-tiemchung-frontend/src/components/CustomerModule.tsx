import React, { useState, useEffect, useRef } from "react";
import {
  Syringe,
  CalendarDays,
  Bug,
  MessageSquare,
  Search,
  X,
  PlusCircle,
  Send,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  HelpCircle,
  History,
  Activity,
  ArrowLeft,
  Filter,
} from "lucide-react";

interface CustomerModuleProps {
  triggerToast: (msg: string) => void;
  onNameChange?: (name: string) => void;
}

export interface VaccineCatalog {
  maVacXin: number;
  tenVacXin: string;
  loaiVacXin: string;
  phongNguaBenh: string;
  doTuoiTiemChung: string;
  donGia: number;
  tonKho: number;
}

export interface FaqType {
  id: number;
  question: string;
  answer: string;
}

export interface MyFeedbackType {
  id: string;
  type: string;
  content: string;
  responseText: string;
  status: string;
  time: string;
  chiTietPhanHoi?: string; // Bổ sung trường lưu lịch sử chat
}

interface ChatMessage {
  sender: "customer" | "admin" | "support";
  message: string;
  time: string;
}

export default function CustomerModule({ triggerToast, onNameChange }: CustomerModuleProps) {
  // --- STATES: ĐIỀU HƯỚNG TABS (Mặc định là lịch sử) ---
  const [activeTab, setActiveTab] = useState<"history" | "vaccines" | "schedules" | "diseases" | "feedback" | "faqs" | "my_feedbacks">("history");

  const fetchWithAuth = async (url: string, options: RequestInit = {}) => {
    const token = localStorage.getItem("token");
    const headers = { ...options.headers, Authorization: `Bearer ${token}` };
    const response = await fetch(url, { ...options, headers });
    if (response.status === 401 || response.status === 403) {
      triggerToast("Phiên đăng nhập đã hết hạn hoặc bạn không có quyền. Vui lòng đăng nhập lại!");
      return Promise.reject("Unauthorized");
    }
    return response;
  };

  const [profile, setProfile] = useState({ id: "" });
  const [history, setHistory] = useState<any[]>([]);
  const [schedules, setSchedules] = useState<any[]>([]);
  const [diseases, setDiseases] = useState<any[]>([]);
  const [faqs, setFaqs] = useState<FaqType[]>([]);
  const [myFeedbacks, setMyFeedbacks] = useState<MyFeedbackType[]>([]);
  const [vaccines, setVaccines] = useState<VaccineCatalog[]>([]);

  // Lấy danh sách bệnh
  const fetchDiseases = async () => {
    try {
      const response = await fetchWithAuth(`${import.meta.env.VITE_API_BASE_URL}/api/customer/diseases`);
      if (response.ok) setDiseases(await response.json());
    } catch (error) {
      if (error !== "Unauthorized") console.error(error);
    }
  };

  // Lấy danh sách FAQ
  const fetchFaqs = async () => {
    try {
      const res = await fetchWithAuth(`${import.meta.env.VITE_API_BASE_URL}/api/customer/faqs`);
      if (res.ok) setFaqs(await res.json());
    } catch (e) {
      if (e !== "Unauthorized") console.error(e);
    }
  };

  // Lấy lịch sử phản hồi
  const fetchMyFeedbacks = async () => {
    if (!profile.id) return;
    try {
      const res = await fetchWithAuth(`${import.meta.env.VITE_API_BASE_URL}/api/customer/my-feedbacks/${profile.id}`);
      if (res.ok) setMyFeedbacks(await res.json());
    } catch (e) {
      if (e !== "Unauthorized") console.error(e);
    }
  };

  // Lấy dữ liệu cá nhân & Lịch sử tiêm
  const fetchPatientData = async () => {
    try {
      const response = await fetchWithAuth(`${import.meta.env.VITE_API_BASE_URL}/api/customer/profile`);
      if (response.ok) {
        const data = await response.json();
        setProfile({ id: data.id });

        // Map đầy đủ lịch sử tiêm
        const formattedHistory = data.history.map((h: any, i: number) => ({
          id: h.recordId || i,
          date: h.date || "---",
          time: h.time || "",
          place: h.place || "Chưa xác định",
          vacName: h.vaccineName || "---",
          vacType: h.vaccineType || "Chưa xác định",
          dosage: h.dosage || "Chưa xác định",
          status: h.status || "Chưa xác định",
          sideEffect: h.sideEffect || "",
          thoiGianTacDung: h.thoiGianTacDung || "",
        }));
        setHistory(formattedHistory);
      }
    } catch (error) {
      if (error !== "Unauthorized") console.error(error);
    }
  };

  // Lấy danh sách Vắc-xin
  const fetchVaccines = async () => {
    try {
      const response = await fetchWithAuth(`${import.meta.env.VITE_API_BASE_URL}/api/customer/vaccines`);
      if (response.ok) setVaccines(await response.json());
    } catch (error) {
      if (error !== "Unauthorized") console.error(error);
    }
  };

  // Lấy danh sách lịch tiêm trung tâm
  const fetchSchedules = async () => {
    try {
      const response = await fetchWithAuth(`${import.meta.env.VITE_API_BASE_URL}/api/admin/schedules`);
      if (response.ok) setSchedules(await response.json());
    } catch (error) {
      if (error !== "Unauthorized") console.error(error);
    }
  };

  useEffect(() => {
    fetchPatientData();
  }, []);

  useEffect(() => {
    if (activeTab === "history") fetchPatientData();
    if (activeTab === "vaccines") fetchVaccines();
    if (activeTab === "schedules") fetchSchedules();
    if (activeTab === "diseases") fetchDiseases();
    if (activeTab === "faqs") fetchFaqs();
    if (activeTab === "my_feedbacks" && profile.id) fetchMyFeedbacks();
  }, [activeTab, profile.id]);

  // States cho Form Feedback
  const [feedbackType, setFeedbackType] = useState<"after_vaccine" | "high_level">("after_vaccine");
  const [feedbackForm, setFeedbackForm] = useState({
    vacName: "",
    time: "",
    place: "",
    doctor: "",
    normalContent: "",
    highLevelType: "Phàn nàn",
    highLevelContent: "",
  });
  const [feedbackErrors, setFeedbackErrors] = useState<Record<string, string>>({});

  // --- THÊM STATES CHO TÍNH NĂNG CHAT HAI CHIỀU ---
  const [selectedFeedbackForChat, setSelectedFeedbackForChat] = useState<MyFeedbackType | null>(null);
  const [replyMessage, setReplyMessage] = useState("");
  const [isReplying, setIsReplying] = useState(false);
  const [feedbackStatusFilter, setFeedbackStatusFilter] = useState<string>("Tất cả"); // Bộ lọc feedback
  const [showConfirmCompleteModal, setShowConfirmCompleteModal] = useState(false); // Modal xác nhận đóng
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll xuống cuối khung chat mỗi khi nội dung cập nhật
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [selectedFeedbackForChat?.chiTietPhanHoi]);

  // Cập nhật lại khung chat nếu có tin nhắn mới từ API
  useEffect(() => {
    if (selectedFeedbackForChat) {
      const updated = myFeedbacks.find((fb) => fb.id === selectedFeedbackForChat.id);
      if (updated) setSelectedFeedbackForChat(updated);
    }
  }, [myFeedbacks]);

  // Gửi tin nhắn Reply
  const handleReplyFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyMessage.trim() || !selectedFeedbackForChat) return;

    try {
      setIsReplying(true);
      const res = await fetchWithAuth(`${import.meta.env.VITE_API_BASE_URL}/api/customer/feedback/reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          feedbackId: selectedFeedbackForChat.id,
          replyContent: replyMessage,
          sender: "customer",
        }),
      });
      if (!res.ok) throw new Error("API lỗi");
      setReplyMessage("");
      await fetchMyFeedbacks(); // Reload lại tin nhắn
    } catch (err) {
      triggerToast("Lỗi gửi tin nhắn");
    } finally {
      setIsReplying(false);
    }
  };

  // Đánh dấu hoàn thành
  const handleCompleteFeedback = async () => {
    if (!selectedFeedbackForChat) return;
    try {
      const res = await fetchWithAuth(`${import.meta.env.VITE_API_BASE_URL}/api/customer/feedback/complete/${selectedFeedbackForChat.id}`, {
        method: "PUT",
      });
      if (!res.ok) throw new Error("Lỗi");
      triggerToast("Đã đánh dấu hoàn thành!");
      setShowConfirmCompleteModal(false);
      await fetchMyFeedbacks(); // Reload danh sách
    } catch (err) {
      triggerToast("Lỗi cập nhật trạng thái");
    }
  };

  const renderChatHistory = (jsonStr?: string) => {
    if (!jsonStr || jsonStr === "null") return null;
    try {
      const messages: ChatMessage[] = JSON.parse(jsonStr);
      return messages.map((msg, idx) => (
        <div key={idx} className={`flex w-full mb-4 ${msg.sender === "customer" ? "justify-end" : "justify-start"}`}>
          <div
            className={`max-w-[80%] rounded-2xl px-4 py-2.5 shadow-sm text-[13px] ${
              msg.sender === "customer"
                ? "bg-blue-600 text-white rounded-tr-none"
                : msg.sender === "admin"
                  ? "bg-amber-100 text-amber-900 border border-amber-200 rounded-tl-none font-medium"
                  : "bg-white text-slate-700 border border-slate-200 rounded-tl-none"
            }`}
          >
            <p className="whitespace-pre-wrap leading-relaxed">{msg.message}</p>
            <p className={`text-[10px] mt-1.5 ${msg.sender === "customer" ? "text-blue-200 text-right" : "text-slate-400"}`}>
              {msg.sender === "admin" ? "👨‍💼 Ban Giám Đốc • " : msg.sender === "support" ? "🎧 CSKH • " : ""}
              {msg.time}
            </p>
          </div>
        </div>
      ));
    } catch (e) {
      return <div className="text-center text-xs text-slate-400">Lỗi hiển thị nội dung chat.</div>;
    }
  };

  // States cho Form Modal Booking
  const [bookModal, setBookModal] = useState<{ isOpen: boolean; type: "vaccine" | "schedule"; data: any }>({
    isOpen: false,
    type: "vaccine",
    data: null,
  });
  const [bookingDate, setBookingDate] = useState<string>("");
  const [bookingTime, setBookingTime] = useState<string>("");

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN").format(amount) + " ₫";
  };

  const handleCancelFeedback = () => {
    setFeedbackForm({ vacName: "", time: "", place: "", doctor: "", normalContent: "", highLevelType: "Phàn nàn", highLevelContent: "" });
    setFeedbackErrors({});
  };

  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};
    if (feedbackType === "after_vaccine") {
      if (!feedbackForm.vacName.trim()) errors.vacName = "Vui lòng nhập tên vắc-xin";
      if (!feedbackForm.time) errors.time = "Vui lòng nhập/chọn thời gian tiêm";
      if (!feedbackForm.place.trim()) errors.place = "Vui lòng nhập địa điểm";
      if (!feedbackForm.doctor.trim()) errors.doctor = "Vui lòng nhập tên nhân viên";
      if (!feedbackForm.normalContent.trim()) errors.normalContent = "Vui lòng nhập nội dung phản hồi";
    } else {
      if (!feedbackForm.highLevelContent.trim()) errors.highLevelContent = "Vui lòng nhập nội dung phản hồi";
    }

    if (Object.keys(errors).length > 0) {
      setFeedbackErrors(errors);
      triggerToast(feedbackType === "after_vaccine" ? "Vui lòng điền đầy đủ thông tin" : "Phản hồi gửi thất bại");
      return;
    }

    try {
      const endpoint = feedbackType === "after_vaccine" ? "/api/customer/feedback/normal" : "/api/customer/feedback/high-level";
      const payload = { ...feedbackForm, maBenhNhan: profile.id };
      const res = await fetchWithAuth(`${import.meta.env.VITE_API_BASE_URL}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("API trả về lỗi");
      triggerToast(feedbackType === "after_vaccine" ? "Gửi thành công" : "Phản hồi gửi đi thành công.");
      handleCancelFeedback();
      setActiveTab("my_feedbacks"); // Tự động chuyển qua tab lịch sử để chat
    } catch (error) {
      if (error !== "Unauthorized") triggerToast(feedbackType === "after_vaccine" ? "Gửi thất bại" : "Phản hồi gửi thất bại");
    }
  };

  const handleConfirmBooking = async () => {
    if (bookModal.type === "vaccine") {
      if (!bookingDate) return triggerToast("Vui lòng chọn ngày mong muốn tiêm!");
      if (!bookingTime.trim()) return triggerToast("Vui lòng nhập giờ mong muốn tiêm!");
    }

    try {
      const payload: any = { maBenhNhan: profile.id };
      if (bookModal.type === "vaccine") {
        payload.maVacXin = bookModal.data.maVacXin;
        payload.ngayMongMuon = bookingDate;
        payload.gioMongMuon = bookingTime;
      } else {
        const rawId = bookModal.data.maLichTiem;
        payload.maLichTiem = typeof rawId === "string" ? parseInt(rawId.replace(/\D/g, ""), 10) : rawId;
        payload.ngayMongMuon =
          bookModal.data.ngay && bookModal.data.thang && bookModal.data.nam
            ? `${bookModal.data.nam}-${bookModal.data.thang}-${bookModal.data.ngay}`
            : bookingDate || new Date().toISOString().split("T")[0];
      }
      const res = await fetchWithAuth(`${import.meta.env.VITE_API_BASE_URL}/api/customer/book`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Có lỗi xảy ra khi đăng ký");
      triggerToast("Đăng ký thành công! Hệ thống đã lưu phiếu đăng ký lịch tiêm vào CSDL.");
      setBookModal({ isOpen: false, type: "vaccine", data: null });
      setBookingDate("");
      setBookingTime("");
    } catch (err: any) {
      if (err !== "Unauthorized") triggerToast("Lỗi: " + err.message);
    }
  };

  // State lọc Vắc xin
  const [vacSearchType, setVacSearchType] = useState("Tất cả");
  const [vacSearchName, setVacSearchName] = useState("");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const ITEMS_PER_PAGE = 8;
  const uniqueTypes = ["Tất cả", ...Array.from(new Set(vaccines.map((v) => v.loaiVacXin).filter(Boolean)))];

  useEffect(() => {
    setCurrentPage(1);
  }, [vacSearchType, vacSearchName]);

  const filteredVaccines = vaccines.filter(
    (v) =>
      (vacSearchType === "Tất cả" || (v.loaiVacXin && v.loaiVacXin === vacSearchType)) &&
      v.tenVacXin.toLowerCase().includes(vacSearchName.toLowerCase()),
  );
  const totalPages = Math.ceil(filteredVaccines.length / ITEMS_PER_PAGE) || 1;
  const currentVaccines = filteredVaccines.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
  const getVaccineTypeCount = (type: string) => (type === "Tất cả" ? vaccines.length : vaccines.filter((v) => v.loaiVacXin === type).length);

  // --- LỌC, NHÓM VÀ SẮP XẾP FEEDBACKS ---
  const uniqueFeedbackStatuses = ["Tất cả", ...Array.from(new Set(myFeedbacks.map((f) => f.status).filter(Boolean)))];
  const filteredFeedbacks = myFeedbacks.filter(
    (fb) => feedbackStatusFilter === "Tất cả" || fb.status === feedbackStatusFilter
  );

  const groupedFeedbacks = filteredFeedbacks.reduce((acc, fb) => {
    const status = fb.status || "Chưa xác định";
    if (!acc[status]) acc[status] = [];
    acc[status].push(fb);
    return acc;
  }, {} as Record<string, MyFeedbackType[]>);

  // Sort each group by time (Mới nhất lên trên)
  Object.keys(groupedFeedbacks).forEach((status) => {
    groupedFeedbacks[status].sort((a, b) => {
      const tA = new Date(a.time).getTime();
      const tB = new Date(b.time).getTime();
      if (!isNaN(tA) && !isNaN(tB)) return tB - tA;
      return (b.time || "").localeCompare(a.time || ""); // Fallback
    });
  });

  const statusOrder = ["Đang xử lý", "Đã trả lời", "Đã hoàn thành"];
  const sortedStatuses = Object.keys(groupedFeedbacks).sort((a, b) => {
    const indexA = statusOrder.indexOf(a);
    const indexB = statusOrder.indexOf(b);
    if (indexA !== -1 && indexB !== -1) return indexA - indexB;
    if (indexA === -1 && indexB !== -1) return 1;
    if (indexA !== -1 && indexB === -1) return -1;
    return a.localeCompare(b);
  });

  return (
    <>
      <div className="space-y-6 animate-fade-in h-full flex flex-col">
        {/* HEADER CHUẨN */}
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Hệ thống Tiêm chủng VaccineFlow Pro</h2>
          <p className="text-sm text-slate-500 mt-1">Tra cứu thông tin, đăng ký tiêm chủng và theo dõi hồ sơ.</p>
        </div>

        {/* MENU TABS */}
        <div className="border-b border-slate-200 flex space-x-2 overflow-x-auto no-scrollbar">
          {[
            { id: "history", icon: Activity, label: "Lịch sử tiêm chủng" },
            { id: "vaccines", icon: Syringe, label: "Xem thông tin Vắc-xin" },
            { id: "schedules", icon: CalendarDays, label: "Tra cứu lịch tiêm" },
            { id: "diseases", icon: Bug, label: "Tình hình dịch bệnh" },
            { id: "faqs", icon: HelpCircle, label: "Tư vấn tiêm chủng" },
            { id: "feedback", icon: MessageSquare, label: "Gửi phản hồi" },
            { id: "my_feedbacks", icon: History, label: "Lịch sử giải đáp" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id as any);
                if (tab.id !== "my_feedbacks") setSelectedFeedbackForChat(null);
              }}
              className={`px-4 py-2.5 font-medium text-sm border-b-2 transition-colors whitespace-nowrap flex items-center gap-2 ${
                activeTab === tab.id ? "border-blue-600 text-blue-600" : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* NỘI DUNG TABS */}
        <div className="flex-1 overflow-y-auto pb-6">
          {/* ======================= TAB 1: LỊCH SỬ TIÊM CHỦNG ======================= */}
          {activeTab === "history" && (
            <div className="w-full bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col animate-fade-in h-full">
              <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
                    <Activity className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-lg text-slate-800">Lịch sử và Nhật ký tiêm chủng cá nhân</h3>
                </div>
                <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-extrabold border border-blue-100">
                  {history.length} bản ghi
                </span>
              </div>

              <div className="overflow-x-auto p-5 flex-1">
                <table className="w-full text-left text-sm border-collapse min-w-[900px]">
                  <thead>
                    <tr className="border-b-2 border-slate-200 text-slate-500 uppercase tracking-wider text-[11px] font-black bg-slate-50/50">
                      <th className="px-4 py-3 w-[5%]">STT</th>
                      <th className="px-4 py-3 w-[15%]">Thời gian</th>
                      <th className="px-4 py-3 w-[18%]">Địa điểm</th>
                      <th className="px-4 py-3 w-[22%]">Tên Vắc-xin</th>
                      <th className="px-4 py-3 w-[15%]">Loại Vắc-xin</th>
                      <th className="px-4 py-3 w-[13%] text-center">Kết quả</th>
                      <th className="px-4 py-3 w-[12%] text-center">Tác dụng phụ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {history.length > 0 ? (
                      history.map((h, i) => (
                        <tr key={h.id} className="hover:bg-slate-50/60 transition-colors group">
                          <td className="px-4 py-3.5 font-mono text-slate-400 font-medium">{i + 1}</td>
                          <td className="px-4 py-3.5 font-mono text-slate-600 font-medium">
                            {h.date} {h.time ? `| ${h.time}` : ""}
                          </td>
                          <td className="px-4 py-3.5 text-slate-600">{h.place}</td>
                          <td className="px-4 py-3.5 font-black text-slate-800 group-hover:text-blue-700 transition-colors">
                            {h.vacName}
                            <div className="text-[10px] text-slate-500 font-normal mt-0.5">Liều: {h.dosage}</div>
                          </td>
                          <td className="px-4 py-3.5 text-slate-600">{h.vacType}</td>
                          <td className="px-4 py-3.5 text-center">
                            <span
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold inline-flex items-center justify-center border shadow-sm ${
                                h.status === "Đã tiêm"
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                  : h.status === "Bị hoãn"
                                    ? "bg-amber-50 text-amber-700 border-amber-200"
                                    : "bg-blue-50 text-blue-700 border-blue-200"
                              }`}
                            >
                              {h.status}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 text-center text-xs">
                            {h.sideEffect ? (
                              <span className="text-red-500 font-semibold">{h.sideEffect}</span>
                            ) : (
                              <span className="text-slate-400 italic">Không có</span>
                            )}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={7} className="text-center py-12">
                          <div className="flex flex-col items-center justify-center text-slate-400">
                            <CalendarDays className="w-12 h-12 mb-3 text-slate-300" />
                            <p className="font-medium">Chưa ghi nhận lịch sử tiêm chủng nào trên hệ thống.</p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ======================= TAB 2: XEM THÔNG TIN VẮC-XIN ======================= */}
          {activeTab === "vaccines" && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col h-full min-h-0 animate-fade-in">
              <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center gap-3 shrink-0">
                <div className="flex-1 flex gap-2">
                  <select
                    value={vacSearchType}
                    onChange={(e) => setVacSearchType(e.target.value)}
                    className="px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-500 bg-white cursor-pointer"
                  >
                    {uniqueTypes.map((type, idx) => (
                      <option key={idx} value={type}>
                        {type} ({getVaccineTypeCount(type)})
                      </option>
                    ))}
                  </select>
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Tìm kiếm nhanh loại vắc-xin..."
                      value={vacSearchName}
                      onChange={(e) => setVacSearchName(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 text-sm focus:border-blue-500 outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="overflow-y-auto overflow-x-hidden flex-1">
                <table className="w-full text-left text-xs border-collapse table-fixed">
                  <thead className="sticky top-0 bg-slate-50 z-10 shadow-sm">
                    <tr className="text-slate-500 font-bold border-b border-slate-200 uppercase tracking-wider">
                      <th className="px-2 sm:px-3 py-3 w-[8%] text-center">STT</th>
                      <th className="px-2 sm:px-3 py-3 w-[20%]">Tên Vắc-xin</th>
                      <th className="px-2 sm:px-3 py-3 w-[15%]">Phân loại</th>
                      <th className="px-2 sm:px-3 py-3 w-[17%]">Phòng bệnh</th>
                      <th className="px-2 sm:px-3 py-3 w-[12%]">Độ tuổi</th>
                      <th className="px-2 sm:px-3 py-3 w-[10%] text-right">Đơn giá</th>
                      <th className="px-2 sm:px-3 py-3 w-[8%] text-center">Tồn</th>
                      <th className="px-2 sm:px-3 py-3 w-[10%] text-center">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {currentVaccines.length > 0 ? (
                      currentVaccines.map(
                        (
                          v,
                          index,
                        ) => (
                          <tr key={v.maVacXin} className="hover:bg-slate-50/50">
                            <td className="px-2 sm:px-3 py-3.5 font-mono text-slate-400 break-words text-center font-bold">
                              {(currentPage - 1) * ITEMS_PER_PAGE + index + 1}
                            </td>
                            <td className="px-2 sm:px-3 py-3.5 font-bold text-slate-800 break-words">{v.tenVacXin}</td>
                            <td className="px-2 sm:px-3 py-3.5 break-words">{v.loaiVacXin || "Chưa phân loại"}</td>
                            <td className="px-2 sm:px-3 py-3.5 text-[11px] text-slate-600 break-words">{v.phongNguaBenh}</td>
                            <td className="px-2 sm:px-3 py-3.5 text-slate-600 break-words">{v.doTuoiTiemChung}</td>
                            <td className="px-2 sm:px-3 py-3.5 text-right font-extrabold text-blue-700 break-words">{formatCurrency(v.donGia)}</td>
                            <td className="px-2 sm:px-3 py-3.5 text-center">
                              {v.tonKho > 0 ? (
                                <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-1 rounded-md text-[10px] font-bold">
                                  Sẵn có
                                </span>
                              ) : (
                                <span className="bg-red-50 text-red-700 border border-red-200 px-1.5 py-1 rounded-md text-[10px] font-bold">
                                  Đã hết
                                </span>
                              )}
                            </td>
                            <td className="px-2 sm:px-3 py-3.5 text-center">
                              <button
                                title="Đăng ký"
                                disabled={v.tonKho <= 0}
                                onClick={() => setBookModal({ isOpen: true, type: "vaccine", data: v })}
                                className="bg-blue-600 text-white p-2 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center transition-colors"
                              >
                                <PlusCircle className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ),
                      )
                    ) : (
                      <tr>
                        <td colSpan={8} className="text-center py-8 text-slate-400">
                          Không tìm thấy dữ liệu.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 bg-slate-50/50 shrink-0">
                  <span className="text-[11px] font-semibold text-slate-500">
                    Hiển thị {(currentPage - 1) * ITEMS_PER_PAGE + 1} - {Math.min(currentPage * ITEMS_PER_PAGE, filteredVaccines.length)} /{" "}
                    {filteredVaccines.length}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="p-1 border border-slate-200 rounded hover:bg-white disabled:opacity-40 cursor-pointer"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="text-[11px] font-bold px-3 py-1 bg-white border border-slate-200 rounded">
                      {currentPage} / {totalPages}
                    </span>
                    <button
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="p-1 border border-slate-200 rounded hover:bg-white disabled:opacity-40 cursor-pointer"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ======================= TAB 3: TRA CỨU LỊCH TIÊM ======================= */}
          {activeTab === "schedules" && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col animate-fade-in">
              <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center shrink-0">
                <h3 className="font-bold text-xs text-slate-500 uppercase tracking-wider">Lịch tiêm phòng trung tâm</h3>
                <span className="bg-blue-100 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded-full">{schedules.length} bản ghi</span>
              </div>
              <div className="p-4 overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse table-fixed min-w-[1000px]">
                  <thead>
                    <tr className="bg-slate-100 text-slate-600 font-bold border-b border-slate-200">
                      <th className="px-4 py-3 w-[10%] text-center">STT</th>
                      <th className="px-4 py-3 w-[15%]">Ngày & Thời gian</th>
                      <th className="px-4 py-3 w-[15%]">Địa điểm</th>
                      <th className="px-4 py-3 w-[18%]">Tên Vắc-xin</th>
                      <th className="px-4 py-3 w-[12%]">Loại Vắc-xin</th>
                      <th className="px-4 py-3 w-[8%] text-center">SL</th>
                      <th className="px-4 py-3 w-[10%]">Đối tượng</th>
                      <th className="px-4 py-3 w-[12%]">Ghi chú</th>
                      <th className="px-4 py-3 text-center w-[10%]">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {schedules.map((s, index) => (
                      <tr key={s.maLichTiem} className="hover:bg-slate-50">
                        <td className="px-4 py-3 font-mono text-xs text-slate-400 break-words text-center font-bold">{index + 1}</td>
                        <td className="px-4 py-3 text-xs text-slate-600 break-words">
                          <span className="font-bold text-red-600">
                            {s.ngay}/{s.thang}/{s.nam}
                          </span>
                          <br />
                          <span className="text-[11px]">{s.thoiGian}</span>
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-600 break-words">{s.diaDiem}</td>
                        <td className="px-4 py-3 font-bold text-xs text-blue-800 break-words">{s.tenVacXin}</td>
                        <td className="px-4 py-3 text-xs text-slate-600 break-words">{s.loaiVacXin}</td>
                        <td className="px-4 py-3 text-xs text-slate-600 break-words font-mono font-semibold text-center">{s.soLuong}</td>
                        <td className="px-4 py-3 text-xs text-slate-600 break-words">{s.doTuoi}</td>
                        <td className="px-4 py-3 text-xs text-slate-600 break-words">{s.ghiChu}</td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => setBookModal({ isOpen: true, type: "schedule", data: s })}
                            className="bg-blue-600 text-white p-2 rounded-lg font-semibold hover:bg-blue-700 inline-flex items-center mx-auto cursor-pointer"
                          >
                            <PlusCircle className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {schedules.length === 0 && (
                      <tr>
                        <td colSpan={9} className="text-center py-8 text-slate-400 text-xs">
                          Không có lịch tiêm chủng nào.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ======================= TAB 4: TÌNH HÌNH DỊCH BỆNH ======================= */}
          {activeTab === "diseases" && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col animate-fade-in">
              <div className="p-4 bg-slate-50 border-b border-slate-200">
                <h3 className="font-bold text-xs text-slate-500 uppercase tracking-wider">Bảng tra cứu dịch bệnh tại địa phương</h3>
              </div>
              <div className="p-4 overflow-x-auto">
                <table className="w-full table-fixed text-left text-sm border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-slate-600 font-bold border-b border-slate-200 text-xs">
                      <th className="px-2 py-3 w-[5%] text-center">STT</th>
                      <th className="px-2 py-3 w-[10%]">Thời điểm KS</th>
                      <th className="px-2 py-3 w-[12%]">Địa chỉ</th>
                      <th className="px-2 py-3 w-[14%]">Loại dịch bệnh</th>
                      <th className="px-2 py-3 w-[9%] text-center">Ca nhiễm</th>
                      <th className="px-2 py-3 w-[18%]">Đường lây nhiễm</th>
                      <th className="px-2 py-3 w-[18%]">Tác hại sức khoẻ</th>
                      <th className="px-2 py-3 w-[14%]">Vắc-xin phòng</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700 text-xs">
                    {diseases.length > 0 ? (
                      diseases.map((d, idx) => (
                        <tr key={d.id || idx} className="hover:bg-slate-50 align-top">
                          <td className="px-2 py-3 font-mono text-center font-bold text-slate-400 break-words">{idx + 1}</td>
                          <td className="px-2 py-3 font-mono text-slate-600 break-words">{d.thoiDiemKhaoSat || "---"}</td>
                          <td className="px-2 py-3 text-slate-600 break-words">{d.diaChi || "---"}</td>
                          <td className="px-2 py-3 font-bold text-red-600 break-words">{d.tenDichBenh || "---"}</td>
                          <td className="px-2 py-3 text-center font-mono font-bold text-amber-600 bg-amber-50/30 break-words">
                            {d.soNguoiNhiem ? new Intl.NumberFormat("vi-VN").format(d.soNguoiNhiem) : 0}
                          </td>
                          <td className="px-2 py-3 text-slate-600 leading-relaxed break-words">{d.duongLayNhiem || "---"}</td>
                          <td className="px-2 py-3 text-slate-600 leading-relaxed break-words">{d.tacHai || "---"}</td>
                          <td className="px-2 py-3 font-semibold text-blue-700 break-words">
                            {d.vacXinPhong ? (
                              <span className="bg-blue-50 text-blue-700 border border-blue-200 px-2 py-1 rounded-md inline-block break-words">
                                {d.vacXinPhong}
                              </span>
                            ) : (
                              <span className="text-slate-400 italic">Chưa có dữ liệu</span>
                            )}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={8} className="text-center py-10 text-slate-400">
                          <Bug className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                          Chưa có dữ liệu.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ======================= TAB 5: FAQS ======================= */}
          {activeTab === "faqs" && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col max-w-4xl mx-auto h-[600px] animate-fade-in">
              <div className="p-4 bg-slate-50 border-b border-slate-200">
                <h3 className="font-bold text-slate-800 text-sm">Câu hỏi thường gặp (FAQ)</h3>
              </div>
              <div className="overflow-y-auto p-6 space-y-4">
                {faqs.length > 0 ? (
                  faqs.map((faq) => (
                    <div key={faq.id} className="border border-slate-200 rounded-xl overflow-hidden group">
                      <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex gap-3 items-start">
                        <div className="bg-blue-100 text-blue-600 font-bold rounded px-2 py-0.5 text-xs mt-0.5 shrink-0">Hỏi</div>
                        <h4 className="font-semibold text-slate-800 text-sm">{faq.question}</h4>
                      </div>
                      <div className="px-4 py-4 flex gap-3 items-start bg-white">
                        <div className="bg-emerald-100 text-emerald-700 font-bold rounded px-2 py-0.5 text-xs mt-0.5 shrink-0">Đáp</div>
                        <p className="text-sm text-slate-600 whitespace-pre-wrap leading-relaxed">{faq.answer}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-10 text-slate-400 text-sm">Chưa có câu hỏi FAQ nào trên hệ thống.</div>
                )}
              </div>
            </div>
          )}

          {/* ======================= TAB 6: FEEDBACK ======================= */}
          {activeTab === "feedback" && (
            <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
              <div className="flex gap-4">
                <label
                  className={`flex-1 border p-4 rounded-xl cursor-pointer transition-colors ${feedbackType === "after_vaccine" ? "border-blue-500 bg-blue-50 shadow-sm" : "border-slate-200 bg-white hover:bg-slate-50"}`}
                >
                  <input
                    type="radio"
                    className="hidden"
                    checked={feedbackType === "after_vaccine"}
                    onChange={() => {
                      setFeedbackType("after_vaccine");
                      setFeedbackErrors({});
                    }}
                  />
                  <div className="font-bold text-slate-800 mb-1">💬 Phản hồi sau khi tiêm</div>
                  <div className="text-xs text-slate-500">Thông báo tình trạng sức khỏe cho bác sĩ/y tá.</div>
                </label>
                <label
                  className={`flex-1 border p-4 rounded-xl cursor-pointer transition-colors ${feedbackType === "high_level" ? "border-amber-500 bg-amber-50 shadow-sm" : "border-slate-200 bg-white hover:bg-slate-50"}`}
                >
                  <input
                    type="radio"
                    className="hidden"
                    checked={feedbackType === "high_level"}
                    onChange={() => {
                      setFeedbackType("high_level");
                      setFeedbackErrors({});
                    }}
                  />
                  <div className="font-bold text-slate-800 mb-1">⭐ Phản hồi cấp cao</div>
                  <div className="text-xs text-slate-500">Gửi trực tiếp lên Lãnh đạo / Giám đốc trung tâm.</div>
                </label>
              </div>

              <form onSubmit={handleFeedbackSubmit} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
                {feedbackType === "after_vaccine" ? (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Tên vắc-xin đã tiêm <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          maxLength={100}
                          value={feedbackForm.vacName}
                          onChange={(e) => {
                            setFeedbackForm({ ...feedbackForm, vacName: e.target.value });
                            setFeedbackErrors({ ...feedbackErrors, vacName: "" });
                          }}
                          className={`w-full px-3 py-2 border rounded-lg text-xs outline-none ${feedbackErrors.vacName ? "border-red-500 bg-red-50" : "border-slate-300 focus:border-blue-500"}`}
                        />
                        {feedbackErrors.vacName && <p className="text-[10px] text-red-500 font-bold mt-1">{feedbackErrors.vacName}</p>}
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Thời gian tiêm <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="date"
                          value={feedbackForm.time}
                          onChange={(e) => {
                            setFeedbackForm({ ...feedbackForm, time: e.target.value });
                            setFeedbackErrors({ ...feedbackErrors, time: "" });
                          }}
                          className={`w-full px-3 py-2 border rounded-lg text-xs outline-none ${feedbackErrors.time ? "border-red-500 bg-red-50" : "border-slate-300 focus:border-blue-500"}`}
                        />
                        {feedbackErrors.time && <p className="text-[10px] text-red-500 font-bold mt-1">{feedbackErrors.time}</p>}
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Địa điểm tiêm <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          maxLength={200}
                          value={feedbackForm.place}
                          onChange={(e) => {
                            setFeedbackForm({ ...feedbackForm, place: e.target.value });
                            setFeedbackErrors({ ...feedbackErrors, place: "" });
                          }}
                          className={`w-full px-3 py-2 border rounded-lg text-xs outline-none ${feedbackErrors.place ? "border-red-500 bg-red-50" : "border-slate-300 focus:border-blue-500"}`}
                        />
                        {feedbackErrors.place && <p className="text-[10px] text-red-500 font-bold mt-1">{feedbackErrors.place}</p>}
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Nhân viên phụ trách <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          maxLength={50}
                          value={feedbackForm.doctor}
                          onChange={(e) => {
                            setFeedbackForm({ ...feedbackForm, doctor: e.target.value });
                            setFeedbackErrors({ ...feedbackErrors, doctor: "" });
                          }}
                          className={`w-full px-3 py-2 border rounded-lg text-xs outline-none ${feedbackErrors.doctor ? "border-red-500 bg-red-50" : "border-slate-300 focus:border-blue-500"}`}
                        />
                        {feedbackErrors.doctor && <p className="text-[10px] text-red-500 font-bold mt-1">{feedbackErrors.doctor}</p>}
                      </div>
                    </div>
                    <div className="pt-2">
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Nội dung phản hồi tình trạng <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        maxLength={1000}
                        value={feedbackForm.normalContent}
                        placeholder="Nhập tình trạng sức khỏe..."
                        onChange={(e) => {
                          setFeedbackForm({ ...feedbackForm, normalContent: e.target.value });
                          setFeedbackErrors({ ...feedbackErrors, normalContent: "" });
                        }}
                        className={`w-full px-3 py-2 border rounded-lg text-xs outline-none h-20 resize-none ${feedbackErrors.normalContent ? "border-red-500 bg-red-50" : "border-slate-300 focus:border-blue-500"}`}
                      />
                      {feedbackErrors.normalContent && <p className="text-[10px] text-red-500 font-bold mt-1">{feedbackErrors.normalContent}</p>}
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Loại phản hồi <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={feedbackForm.highLevelType}
                        onChange={(e) => setFeedbackForm({ ...feedbackForm, highLevelType: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs outline-none focus:border-blue-500 bg-white"
                      >
                        <option>Phàn nàn</option>
                        <option>Khen ngợi</option>
                        <option>Động viên</option>
                        <option>Khuyến khích</option>
                        <option>Ủng hộ</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Nội dung <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        maxLength={1000}
                        value={feedbackForm.highLevelContent}
                        placeholder="Chi tiết phần trình bày phản hồi..."
                        onChange={(e) => {
                          setFeedbackForm({ ...feedbackForm, highLevelContent: e.target.value });
                          setFeedbackErrors({ ...feedbackErrors, highLevelContent: "" });
                        }}
                        className={`w-full px-3 py-2 border rounded-lg text-xs outline-none h-24 resize-none ${feedbackErrors.highLevelContent ? "border-red-500 bg-red-50" : "border-slate-300 focus:border-blue-500"}`}
                      />
                      {feedbackErrors.highLevelContent && (
                        <p className="text-[10px] text-red-500 font-bold mt-1">{feedbackErrors.highLevelContent}</p>
                      )}
                    </div>
                  </>
                )}

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleCancelFeedback}
                    className="px-6 py-2 bg-white border border-slate-300 text-slate-600 rounded-lg text-xs font-semibold hover:bg-slate-50 cursor-pointer"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 hover:bg-blue-700 cursor-pointer"
                  >
                    <Send className="w-4 h-4" /> Gửi
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ======================= TAB 7: MY FEEDBACKS (TÍCH HỢP CHAT) ======================= */}
          {activeTab === "my_feedbacks" && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col h-[600px] max-w-6xl mx-auto animate-fade-in overflow-hidden">
              <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center shrink-0">
                <div>
                  <h3 className="font-bold text-slate-800 text-sm">Thắc mắc của tôi</h3>
                  <p className="text-xs text-slate-500 mt-1">Theo dõi quá trình giải quyết khiếu nại</p>
                </div>
                <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-bold">{myFeedbacks.length} bản ghi</span>
              </div>

              <div className="flex flex-1 min-h-0">
                {/* --- CỘT TRÁI: DANH SÁCH THẮC MẮC --- */}
                <div className={`w-full lg:w-2/5 border-r border-slate-100 flex-col bg-white ${selectedFeedbackForChat ? "hidden lg:flex" : "flex"}`}>
                  
                  {/* Filter Header */}
                  <div className="p-3 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2 shrink-0">
                    <Filter className="w-4 h-4 text-slate-400" />
                    <select
                      value={feedbackStatusFilter}
                      onChange={(e) => setFeedbackStatusFilter(e.target.value)}
                      className="flex-1 bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs outline-none focus:border-blue-500"
                    >
                      {uniqueFeedbackStatuses.map((status) => (
                        <option key={status} value={status}>
                          {status} ({status === "Tất cả" ? myFeedbacks.length : myFeedbacks.filter((f) => f.status === status).length})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Lọc, nhóm theo status & Sắp xếp */}
                  <div className="overflow-y-auto flex-1 p-2 bg-slate-50/20">
                    {sortedStatuses.length > 0 ? (
                      sortedStatuses.map((status) => (
                        <div key={status} className="mb-4">
                          <div className="sticky top-0 bg-white/95 backdrop-blur py-1.5 px-3 mb-2 border border-slate-100 rounded-lg shadow-sm z-10 flex justify-between items-center">
                            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">{status}</span>
                            <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md">
                              {groupedFeedbacks[status].length}
                            </span>
                          </div>
                          <div className="space-y-1.5">
                            {groupedFeedbacks[status].map((fb) => {
                              // Thêm màu sắc cho trạng thái
                              const statusColor = 
                                fb.status === "Đã hoàn thành" ? "bg-slate-100 text-slate-500 border-slate-200" :
                                fb.status === "Đã trả lời" ? "bg-emerald-50 text-emerald-600 border-emerald-200" :
                                "bg-red-50 text-red-600 border-red-200";

                              return (
                                <div
                                  key={fb.id}
                                  onClick={() => setSelectedFeedbackForChat(fb)}
                                  className={`p-3 cursor-pointer rounded-xl transition-all border ${
                                    selectedFeedbackForChat?.id === fb.id
                                      ? "bg-blue-50 border-blue-300 shadow-md"
                                      : "bg-white border-slate-100 hover:border-slate-300 hover:shadow-sm"
                                  }`}
                                >
                                  <div className="flex justify-between items-center mb-1.5">
                                    <div className="flex items-center gap-2">
                                      <span className="font-mono text-[11px] font-bold text-slate-500">{fb.id}</span>
                                      <span
                                        className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${
                                          fb.type === "Cấp cao" ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-600"
                                        }`}
                                      >
                                        {fb.type}
                                      </span>
                                    </div>
                                    {/* Thay đổi màu trạng thái ở góc trên bên phải của card */}
                                    <span className={`text-[9px] px-1.5 py-0.5 rounded border font-semibold ${statusColor}`}>
                                      {fb.status}
                                    </span>
                                  </div>
                                  <p className="text-xs text-slate-700 line-clamp-2 leading-relaxed">{fb.content}</p>
                                  <div className="text-[10px] text-slate-400 mt-1.5 flex justify-end">
                                    {fb.time?.split(" ")[0]}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-16 flex flex-col items-center justify-center">
                        <MessageSquare className="w-10 h-10 text-slate-200 mb-3" />
                        <p className="text-slate-400 text-sm">Không tìm thấy thắc mắc nào.</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* --- CỘT PHẢI: KHUNG CHAT LỊCH SỬ --- */}
                <div className={`w-full lg:w-3/5 flex-col bg-slate-50/50 min-h-0 ${!selectedFeedbackForChat ? "hidden lg:flex" : "flex"}`}>
                  {!selectedFeedbackForChat ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
                      <MessageSquare className="w-12 h-12 mb-3 text-slate-200" />
                      <p className="text-sm">Chọn một thắc mắc để xem chi tiết và trao đổi</p>
                    </div>
                  ) : (
                    <div className="flex flex-col h-full min-h-0 relative">
                      {/* Chat Header */}
                      <div className="p-4 bg-white border-b border-slate-200 flex justify-between items-center shrink-0 shadow-sm z-10">
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => setSelectedFeedbackForChat(null)}
                            className="lg:hidden p-1.5 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200"
                          >
                            <ArrowLeft className="w-4 h-4" />
                          </button>
                          <div>
                            <h4 className="font-bold text-sm text-slate-800 flex items-center gap-2">
                              Phiên trao đổi #{selectedFeedbackForChat.id}
                            </h4>
                            <p className="text-[11px] text-slate-500 mt-0.5">Mở ngày: {selectedFeedbackForChat.time}</p>
                          </div>
                        </div>

                        {selectedFeedbackForChat.status !== "Đã hoàn thành" ? (
                          <button
                            onClick={() => setShowConfirmCompleteModal(true)}
                            className="px-3 py-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 hover:text-emerald-700 border border-emerald-200 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" /> Hài lòng & Đóng
                          </button>
                        ) : (
                          // Trạng thái disable không đổi nội dung text
                          <button
                            disabled
                            className="px-3 py-1.5 bg-slate-100 text-slate-400 border border-slate-200 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-not-allowed opacity-70"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" /> Hài lòng & Đóng
                          </button>
                        )}
                      </div>

                      {/* Modal Xác nhận Đóng Ticket */}
                      {showConfirmCompleteModal && (
                        <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
                          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden flex flex-col">
                            <div className="p-5 text-center">
                              <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3">
                                <CheckCircle2 className="w-6 h-6" />
                              </div>
                              <h3 className="font-bold text-lg text-slate-800 mb-1">Xác nhận đóng phiên hỗ trợ</h3>
                              <p className="text-sm text-slate-500">
                                Bạn đã hài lòng với câu trả lời và muốn đóng thắc mắc <span className="font-semibold text-slate-700">#{selectedFeedbackForChat.id}</span> này lại?
                              </p>
                            </div>
                            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-2">
                              <button
                                onClick={() => setShowConfirmCompleteModal(false)}
                                className="px-4 py-2 bg-white border border-slate-300 text-slate-600 font-semibold text-xs rounded-lg hover:bg-slate-100 transition-colors"
                              >
                                Hủy bỏ
                              </button>
                              <button
                                onClick={handleCompleteFeedback}
                                className="px-4 py-2 bg-emerald-600 text-white font-semibold text-xs rounded-lg hover:bg-emerald-700 transition-colors"
                              >
                                Xác nhận đóng
                              </button>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Chat Messages */}
                      <div className="flex-1 overflow-y-auto min-h-0 p-4 bg-slate-50">
                        {renderChatHistory(selectedFeedbackForChat.chiTietPhanHoi)}
                        <div ref={chatEndRef} />
                      </div>

                      {/* Chat Input */}
                      <div className="p-4 bg-white border-t border-slate-200 shrink-0">
                        {selectedFeedbackForChat.status === "Đã hoàn thành" ? (
                          <div className="text-center text-xs text-slate-400 italic py-2">Cuộc trao đổi này đã kết thúc.</div>
                        ) : (
                          <form onSubmit={handleReplyFeedback} className="flex gap-2">
                            <input
                              type="text"
                              required
                              value={replyMessage}
                              onChange={(e) => setReplyMessage(e.target.value)}
                              placeholder="Nhập phản hồi thêm của bạn..."
                              className="flex-1 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-500 focus:bg-white transition-all"
                            />
                            <button
                              type="submit"
                              disabled={isReplying || !replyMessage.trim()}
                              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold rounded-xl flex items-center justify-center transition-colors shadow-sm cursor-pointer"
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
            </div>
          )}
        </div>
      </div>

      {/* ======================= MODAL: ĐĂNG KÍ TIÊM PHÒNG ======================= */}
      {bookModal.isOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden border border-blue-100 flex flex-col max-h-[90vh]">
            <div className="p-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white flex justify-between items-center shrink-0">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5" /> Đăng ký tiêm phòng Vắc-xin
              </h3>
              <button
                onClick={() => {
                  setBookModal({ isOpen: false, type: "vaccine", data: null });
                  setBookingDate("");
                  setBookingTime("");
                }}
                className="hover:bg-blue-800 p-1 rounded-full cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto space-y-5">
              <div className="text-center border-b border-slate-100 pb-4">
                <span className="bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-[10px] font-bold uppercase mb-2 inline-block">
                  Thông tin vắc-xin
                </span>
                <h4 className="text-xl font-extrabold text-slate-800">{bookModal.data.tenVacXin}</h4>
              </div>
              {bookModal.type === "vaccine" ? (
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <span className="block text-[10px] uppercase font-bold text-slate-400">Mã Vắc-xin</span>
                    <span className="font-mono text-slate-700 font-semibold">VX{String(bookModal.data.maVacXin).padStart(3, "0")}</span>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <span className="block text-[10px] uppercase font-bold text-slate-400">Nhóm</span>
                    <span className="text-slate-700 font-semibold">{bookModal.data.loaiVacXin || "Chưa phân loại"}</span>
                  </div>
                  <div className="col-span-2 bg-blue-50/50 p-3 rounded-lg border border-blue-100/50">
                    <span className="block text-[10px] uppercase font-bold text-blue-400">Phòng bệnh</span>
                    <span className="text-blue-900 font-medium text-xs">{bookModal.data.phongNguaBenh}</span>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <span className="block text-[10px] uppercase font-bold text-slate-400">Độ tuổi</span>
                    <span className="text-slate-700 font-medium text-xs">{bookModal.data.doTuoiTiemChung}</span>
                  </div>
                  <div className="bg-emerald-50 p-3 rounded-lg border border-emerald-100 text-right">
                    <span className="block text-[10px] uppercase font-bold text-emerald-500">Đơn giá</span>
                    <span className="font-extrabold text-emerald-700 text-base">
                      {new Intl.NumberFormat("vi-VN").format(bookModal.data.donGia)} ₫
                    </span>
                  </div>
                </div>
              ) : (
                <div className="space-y-3 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <span className="block text-[10px] font-bold uppercase text-slate-400">Mã Lịch</span>
                      <span className="font-mono text-slate-800 font-bold">{bookModal.data.maLichTiem}</span>
                    </div>
                    <div>
                      <span className="block text-[10px] font-bold uppercase text-slate-400">Thời Gian Tiêm</span>
                      <span className="text-red-600 font-extrabold">
                        {bookModal.data.ngay}/{bookModal.data.thang}/{bookModal.data.nam}
                      </span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 border-t border-slate-200 pt-2">
                    <div>
                      <span className="block text-[10px] font-bold uppercase text-slate-400">Phân loại</span>
                      <span className="text-slate-700 font-semibold">{bookModal.data.loaiVacXin}</span>
                    </div>
                    <div>
                      <span className="block text-[10px] font-bold uppercase text-slate-400">Khung giờ</span>
                      <span className="text-slate-700 font-medium font-mono">{bookModal.data.thoiGian}</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 border-t border-slate-200 pt-2">
                    <div>
                      <span className="block text-[10px] font-bold uppercase text-slate-400">Đối tượng</span>
                      <span className="text-slate-700 font-medium">{bookModal.data.doTuoi || "Mọi đối tượng"}</span>
                    </div>
                    <div>
                      <span className="block text-[10px] font-bold uppercase text-slate-400">SL dự kiến</span>
                      <span className="text-slate-700 font-bold font-mono">{bookModal.data.soLuong} người</span>
                    </div>
                  </div>
                  <div className="border-t border-slate-200 pt-2">
                    <span className="block text-[10px] font-bold uppercase text-slate-400">Địa điểm tổ chức</span>
                    <p className="text-slate-700 font-medium">📍 {bookModal.data.diaDiem}</p>
                  </div>
                  {bookModal.data.danhSachBacSi && bookModal.data.danhSachBacSi.length > 0 && (
                    <div className="border-t border-slate-200 pt-2">
                      <span className="block text-[10px] font-bold uppercase text-slate-400">Đội ngũ y tế</span>
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        {bookModal.data.danhSachBacSi.map((doc: string, idx: number) => (
                          <span key={idx} className="bg-blue-100/70 text-blue-800 px-2 py-0.5 rounded text-[11px]">
                            {doc}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {bookModal.data.ghiChu && (
                    <div className="border-t border-slate-200 pt-2">
                      <span className="block text-[10px] font-bold uppercase text-slate-400">Ghi chú lưu ý</span>
                      <p className="text-slate-500 italic leading-tight">{bookModal.data.ghiChu}</p>
                    </div>
                  )}
                </div>
              )}
              {bookModal.type === "vaccine" ? (
                <div className="pt-2 grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-2">
                      Ngày mong muốn tiêm <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={bookingDate}
                      onChange={(e) => setBookingDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:border-blue-500 outline-none shadow-sm cursor-pointer"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-2">
                      Giờ tiêm <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="VD: 08:30 Sáng"
                      value={bookingTime}
                      onChange={(e) => setBookingTime(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:border-blue-500 outline-none shadow-sm"
                    />
                  </div>
                </div>
              ) : (
                <div className="pt-2 space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-2">Ngày tiêm chỉ định</label>
                    <input
                      type="date"
                      disabled
                      value={bookModal.data ? `${bookModal.data.nam}-${bookModal.data.thang}-${bookModal.data.ngay}` : ""}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-100 text-slate-500 text-sm cursor-not-allowed font-medium"
                    />
                  </div>
                  <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                    <p className="text-[11px] text-blue-700">
                      Hệ thống đồng bộ ngày tiêm{" "}
                      <span className="font-bold">
                        {bookModal.data?.ngay}/{bookModal.data?.thang}/{bookModal.data?.nam}
                      </span>
                      . Vui lòng đến đúng giờ <span className="font-bold">{bookModal.data?.thoiGian}</span>.
                    </p>
                  </div>
                </div>
              )}
            </div>
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3 shrink-0">
              <button
                onClick={() => {
                  setBookModal({ isOpen: false, type: "vaccine", data: null });
                  setBookingDate("");
                  setBookingTime("");
                }}
                className="px-5 py-2.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleConfirmBooking}
                className="px-5 py-2.5 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 flex items-center gap-1.5 cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" /> Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}