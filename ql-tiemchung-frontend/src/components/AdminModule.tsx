import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import {
  Users,
  CalendarDays,
  Plus,
  Search,
  Save,
  X,
  Clock,
  MapPin,
  Shield,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  Send,
  AlertCircle,
  CheckCircle2,
  Filter
} from "lucide-react";

// --- ĐỊNH NGHĨA KIỂU DỮ LIỆU ---
export interface TaiKhoan {
  maTaiKhoan: number | string;
  tenDangNhap: string;
  hoTen: string;
  cmnd: string;
  noiO: string;
  moTa: string;
  email?: string;
  phanQuyen?: string;
  maQuyen?: number;
  namSinh?: number;
  sdt?: string;
  ngaySinh?: string;
  diaChi?: string;
  nguoiGiamHo?: string;
  gioiTinh?: string;
  flagDelete?: boolean;
}

export interface NguoiDangKy {
  maBenhNhan: string;
  tenBenhNhan: string;
  ngaySinh: string;
  gioiTinh: string;
  sdt: string;
  trangThaiTiem: "Chưa tiêm" | "Chờ khám sàng lọc" | "Đủ điều kiện tiêm" | "Đã tiêm" | "Đã hủy";
}

export interface SupportTicket {
  id: string;
  customerName: string;
  comments: string;
  email: string;
  status: string;
  type?: string;
  responseText?: string;
  time?: string;
  chiTietPhanHoi?: string; // Bổ sung trường này để lưu lịch sử Chat
}

interface ChatMessage {
  sender: "customer" | "admin" | "support";
  message: string;
  time: string;
}

export interface LichTiemChungSRS {
  maLichTiem: string;
  ngay: string;
  thang: string;
  nam: string;
  thoiGian: string;
  maLoaiVacXin: number;
  loaiVacXin: string;
  maVacXin: number;
  tenVacXin: string;
  soLuong: number;
  doTuoi: string;
  diaDiem: string;
  ghiChu: string;
  danhSachBacSi: string[];
  danhSachNguoiDangKy: NguoiDangKy[];
  flag_delete: boolean;
}

interface AdminModuleProps {
  triggerToast?: (msg: string) => void;
  onNameChange?: (name: string) => void;
}

export default function AdminModule({ triggerToast = alert, onNameChange }: AdminModuleProps) {
  const [activeTab, setActiveTab] = useState<"schedules" | "accounts" | "feedback">("accounts");
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();
  const [accounts, setAccounts] = useState<TaiKhoan[]>([]);

  // --- STATE CHO POPUP XÓA ---
  const [itemToDelete, setItemToDelete] = useState<{ id: string | number; type: "account" | "schedule"; name?: string } | null>(null);

  // --- STATE CHO TAB PHẢN HỒI CẤP CAO (DẠNG CHAT) ---
  const [ticketsList, setTicketsList] = useState<SupportTicket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [ticketResponse, setTicketResponse] = useState("");
  const [ticketErrors, setTicketErrors] = useState<Record<string, string>>({});
  const [isTicketsLoading, setIsTicketsLoading] = useState(false);
  const [isReplying, setIsReplying] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // --- STATE TÌM KIẾM, LỌC & PHÂN TRANG (Tài khoản) ---
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const ITEMS_PER_PAGE = 20;

  // LỌC TRẠNG THÁI:
  const [ticketStatusFilter, setTicketStatusFilter] = useState<string>("Tất cả");

  // =========================================================================
  // TỐI ƯU HÓA: LOGIC LỌC, NHÓM VÀ SẮP XẾP TICKETS BẰNG useMemo
  // =========================================================================
  const uniqueTicketStatuses = useMemo(() => {
    return ["Tất cả", ...Array.from(new Set(ticketsList.map((t) => t.status).filter(Boolean)))];
  }, [ticketsList]);

  const filteredTickets = useMemo(() => {
    return ticketsList.filter((t) => {
      const matchesSearch = t.customerName.toLowerCase().includes(searchQuery.toLowerCase()) || String(t.id).toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = ticketStatusFilter === "Tất cả" || t.status === ticketStatusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [ticketsList, searchQuery, ticketStatusFilter]);

  const groupedTickets = useMemo(() => {
    const grouped = filteredTickets.reduce((acc, ticket) => {
      const status = ticket.status || "Chưa xác định";
      if (!acc[status]) acc[status] = [];
      acc[status].push(ticket);
      return acc;
    }, {} as Record<string, SupportTicket[]>);

    // Sắp xếp mỗi nhóm theo thời gian (Mới nhất lên trên)
    Object.keys(grouped).forEach((status) => {
      grouped[status].sort((a, b) => {
        const tA = new Date(a.time || "").getTime();
        const tB = new Date(b.time || "").getTime();
        if (!isNaN(tA) && !isNaN(tB)) return tB - tA;
        return (b.time || "").localeCompare(a.time || "");
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

  // =========================================================================
  // BẢO MẬT & HÀM GỌI API CHUNG CÓ ĐÍNH KÈM TOKEN (Dùng useCallback)
  // =========================================================================
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      triggerToast("Bạn chưa đăng nhập hoặc phiên làm việc đã hết hạn!");
      navigate("/");
    }
  }, [navigate, triggerToast]);

  const fetchWithAuth = useCallback(async (url: string, options: RequestInit = {}) => {
    const token = localStorage.getItem("token");
    const headers = {
      ...options.headers,
      Authorization: `Bearer ${token}`,
    };
    const response = await fetch(url, { ...options, headers });
    if (response.status === 401 || response.status === 403) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      navigate("/");
      triggerToast("Phiên đăng nhập đã hết hạn hoặc bạn không có quyền. Vui lòng đăng nhập lại!");
      return Promise.reject("Unauthorized");
    }
    return response;
  }, [navigate, triggerToast]);

  // =========================================================================
  // API FETCH: ACCOUNTS
  // =========================================================================
  const fetchAccounts = useCallback(async () => {
    try {
      const response = await fetchWithAuth(`${import.meta.env.VITE_API_BASE_URL}/api/admin/accounts`);
      if (response.ok) {
        const data = await response.json();
        setAccounts(data);
      } else {
        triggerToast("Lỗi khi tải danh sách người dùng từ máy chủ!");
      }
    } catch (error) {
      if (error !== "Unauthorized") console.error("Error fetching accounts:", error);
      triggerToast("Không thể kết nối đến Backend Server!");
    }
  }, [fetchWithAuth, triggerToast]);

  useEffect(() => {
    if (activeTab === "accounts") fetchAccounts();
  }, [activeTab, fetchAccounts]);

  // =========================================================================
  // API FETCH: SCHEDULES
  // =========================================================================
  const [schedules, setSchedules] = useState<LichTiemChungSRS[]>([]);

  const fetchSchedules = useCallback(async () => {
    try {
      const response = await fetchWithAuth(`${import.meta.env.VITE_API_BASE_URL}/api/admin/schedules`);
      if (response.ok) {
        const data = await response.json();
        setSchedules(data);
      } else {
        triggerToast("Lỗi khi tải danh sách lịch tiêm chủng!");
      }
    } catch (error) {
      if (error !== "Unauthorized") console.error("Error fetching schedules:", error);
      triggerToast("Không thể kết nối đến Backend Server!");
    }
  }, [fetchWithAuth, triggerToast]);

  useEffect(() => {
    if (activeTab === "schedules") {
      fetchSchedules();
    }
  }, [activeTab, fetchSchedules]);

  // =========================================================================
  // API FETCH: TICKETS CẤP CAO
  // =========================================================================
  const fetchHighLevelTickets = useCallback(async () => {
    setIsTicketsLoading(true);
    try {
      const res = await fetchWithAuth(`${import.meta.env.VITE_API_BASE_URL}/api/customer/admin/feedback/high-level`);
      if (res.ok) {
        const data = await res.json();
        setTicketsList(data);
      } else {
        triggerToast("Lỗi lấy danh sách phản hồi cấp cao.");
      }
    } catch (err) {
      if (err !== "Unauthorized") console.error(err);
      triggerToast("Không thể tải danh sách phản hồi cấp cao.");
    } finally {
      setIsTicketsLoading(false);
    }
  }, [fetchWithAuth, triggerToast]);

  useEffect(() => {
    if (activeTab === "feedback") {
      fetchHighLevelTickets();
    }
  }, [activeTab, fetchHighLevelTickets]);

  // Cập nhật Chat View khi có tin nhắn mới
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

  // =========================================================================
  // XỬ LÝ GIAO DIỆN LỊCH TIÊM CHỦNG
  // =========================================================================
  const [selectedSchedule, setSelectedSchedule] = useState<LichTiemChungSRS | null>(null);
  const [scheduleSearchStartDate, setScheduleSearchStartDate] = useState<string>("");
  const [scheduleSearchEndDate, setScheduleSearchEndDate] = useState<string>("");

  const filteredSchedules = useMemo(() => {
    return schedules.filter((s) => {
      if (!scheduleSearchStartDate && !scheduleSearchEndDate) return true;

      const scheduleDate = new Date(`${s.nam}-${s.thang}-${s.ngay}`);

      if (scheduleSearchStartDate) {
        const startDate = new Date(scheduleSearchStartDate);
        if (scheduleDate < startDate) return false;
      }

      if (scheduleSearchEndDate) {
        const endDate = new Date(scheduleSearchEndDate);
        if (scheduleDate > endDate) return false;
      }

      return true;
    });
  }, [schedules, scheduleSearchStartDate, scheduleSearchEndDate]);

  useEffect(() => {
    if (filteredSchedules.length > 0) {
      const exists = filteredSchedules.find((s) => s.maLichTiem === selectedSchedule?.maLichTiem);
      if (!exists) setSelectedSchedule(filteredSchedules[0]);
    } else {
      setSelectedSchedule(null);
    }
  }, [filteredSchedules, selectedSchedule?.maLichTiem]);

  useEffect(() => {
    if (schedules.length > 0 && !selectedSchedule) setSelectedSchedule(schedules[0]);
  }, [schedules, selectedSchedule]);

  const [editingAccountId, setEditingAccountId] = useState<number | string | null>(null);
  const [editingScheduleId, setEditingScheduleId] = useState<string | null>(null);

  // =========================================================================
  // XỬ LÝ FORM TÀI KHOẢN
  // =========================================================================
  const [showAddAccount, setShowAddAccount] = useState(false);
  const [accForm, setAccForm] = useState({
    tenDangNhap: "",
    matKhau: "",
    maQuyen: 5,
    hoTen: "",
    cmnd: "",
    noiO: "",
    moTa: "",
    email: "",
    namSinh: "",
    sdt: "",
    ngaySinh: "",
    diaChi: "",
    nguoiGiamHo: "",
    gioiTinh: "Nam",
  });
  const [accErrors, setAccErrors] = useState<Record<string, string>>({});

  const handlePhoneChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, "");
    if (val.length > 10) val = val.substring(0, 10);
    let formatted = val;
    if (val.length > 3 && val.length <= 6) formatted = `${val.slice(0, 3)} ${val.slice(3)}`;
    else if (val.length > 6) formatted = `${val.slice(0, 3)} ${val.slice(3, 6)} ${val.slice(6)}`;
    
    setAccForm(prev => ({ ...prev, sdt: formatted }));
    setAccErrors(prev => prev.sdt ? { ...prev, sdt: "" } : prev);
  }, []);

  const handleNumberOnlyChange = useCallback((field: keyof typeof accForm, maxLength: number) => (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, "");
    if (val.length > maxLength) val = val.substring(0, maxLength);
    setAccForm(prev => ({ ...prev, [field]: val }));
    setAccErrors(prev => prev[field] ? { ...prev, [field]: "" } : prev);
  }, []);

  const formatDisplayPhone = useCallback((phone?: string) => {
    if (!phone) return "Chưa cập nhật";
    const val = phone.replace(/\D/g, "");
    if (val.length <= 3) return val;
    if (val.length <= 6) return `${val.slice(0, 3)} ${val.slice(3)}`;
    return `${val.slice(0, 3)} ${val.slice(3, 6)} ${val.slice(6)}`;
  }, []);

  const getRoleBadgeStyle = useCallback((roleName?: string) => {
    if (!roleName) return "bg-slate-100 text-slate-500 border-slate-200";
    const name = roleName.toLowerCase();
    if (name.includes("admin")) return "bg-rose-50 text-rose-700 border-rose-200";
    if (name.includes("kho")) return "bg-amber-50 text-amber-700 border-amber-200";
    if (name.includes("tài chính")) return "bg-emerald-50 text-emerald-700 border-emerald-200";
    if (name.includes("hỗ trợ")) return "bg-violet-50 text-violet-700 border-violet-200";
    if (name.includes("y tế")) return "bg-blue-50 text-blue-700 border-blue-200";
    if (name.includes("khách")) return "bg-slate-100 text-slate-700 border-slate-300";
    return "bg-gray-100 text-gray-600 border-gray-200";
  }, []);

  const ROLE_TABS = useMemo(() => [
    { id: "all", label: "Tất cả" },
    { id: "admin", label: "Admin" },
    { id: "y tế", label: "Y Tế" },
    { id: "kho", label: "Thủ Kho" },
    { id: "tài chính", label: "Tài Chính" },
    { id: "hỗ trợ", label: "Hỗ Trợ" },
    { id: "khách", label: "Khách Hàng" },
  ], []);

  const checkRoleMatch = useCallback((phanQuyenStr: string | undefined, filterId: string) => {
    if (!phanQuyenStr) return false;
    const str = phanQuyenStr.toLowerCase();
    if (filterId === "admin") return str.includes("admin");
    if (filterId === "y tế") return str.includes("y tế");
    if (filterId === "kho") return str.includes("kho");
    if (filterId === "tài chính") return str.includes("tài chính");
    if (filterId === "hỗ trợ") return str.includes("hỗ trợ");
    if (filterId === "khách") return str.includes("khách") && !str.includes("hỗ trợ");
    return false;
  }, []);

  const getRoleCount = useCallback((filterId: string) => {
    if (filterId === "all") return accounts.length;
    return accounts.filter((a) => checkRoleMatch(a.phanQuyen, filterId)).length;
  }, [accounts, checkRoleMatch]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, roleFilter]);

  const filteredAccounts = useMemo(() => {
    return accounts.filter((a) => {
      const matchSearch = a.hoTen.toLowerCase().includes(searchQuery.toLowerCase()) || a.tenDangNhap.toLowerCase().includes(searchQuery.toLowerCase());
      const matchRole = roleFilter === "all" || checkRoleMatch(a.phanQuyen, roleFilter);
      return matchSearch && matchRole;
    });
  }, [accounts, searchQuery, roleFilter, checkRoleMatch]);

  const totalPages = useMemo(() => Math.ceil(filteredAccounts.length / ITEMS_PER_PAGE) || 1, [filteredAccounts.length]);
  
  const currentAccounts = useMemo(() => {
    return filteredAccounts.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
  }, [filteredAccounts, currentPage]);

  // =========================================================================
  // XỬ LÝ FORM LỊCH TIÊM CHỦNG
  // =========================================================================
  const [showAddSchedule, setShowAddSchedule] = useState(false);
  const [scheduleForm, setScheduleForm] = useState({
    dateInput: "",
    thoiGian: "",
    maLoaiVacXin: 0,
    loaiVacXinName: "",
    maVacXin: 0,
    soLuong: 0,
    doTuoi: "",
    diaDiem: "",
    ghiChu: "",
    selectedDoctors: [] as string[],
  });

  const [vaccineTypes, setVaccineTypes] = useState<{ maLoaiVacXin: number; tenLoaiVacXin: string }[]>([]);
  const [vaccinesList, setVaccinesList] = useState<any[]>([]);

  const fetchVaccineTypes = useCallback(async () => {
    try {
      const res = await fetchWithAuth(`${import.meta.env.VITE_API_BASE_URL}/api/admin/vaccine-types`);
      if (res.ok) setVaccineTypes(await res.json());
    } catch (err) {
      if (err !== "Unauthorized") console.error(err);
    }
  }, [fetchWithAuth]);

  const fetchVaccinesList = useCallback(async () => {
    try {
      const res = await fetchWithAuth(`${import.meta.env.VITE_API_BASE_URL}/api/customer/vaccines`);
      if (res.ok) setVaccinesList(await res.json());
    } catch (err) {
      if (err !== "Unauthorized") console.error(err);
    }
  }, [fetchWithAuth]);

  useEffect(() => {
    if (activeTab === "schedules") {
      fetchVaccineTypes();
      fetchVaccinesList();
    }
  }, [activeTab, fetchVaccineTypes, fetchVaccinesList]);

  const handleVaccineSelect = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedMaVacXin = Number(e.target.value);
    const selectedVac = vaccinesList.find((v) => v.maVacXin === selectedMaVacXin);

    if (selectedVac) {
      const typeObj = vaccineTypes.find((t) => t.tenLoaiVacXin === selectedVac.loaiVacXin);
      const newMaLoaiVacXin = typeObj ? typeObj.maLoaiVacXin : 0;
      setScheduleForm(prev => ({
        ...prev,
        maVacXin: selectedMaVacXin,
        maLoaiVacXin: newMaLoaiVacXin,
        loaiVacXinName: selectedVac.loaiVacXin || "Chưa phân loại",
        doTuoi: selectedVac.doTuoiTiemChung || prev.doTuoi,
      }));
    } else {
      setScheduleForm(prev => ({ ...prev, maVacXin: 0, maLoaiVacXin: 0, loaiVacXinName: "" }));
    }
    setScheduleErrors(prev => ({ ...prev, maVacXin: "" }));
  }, [vaccinesList, vaccineTypes]);

  const toggleDoctor = useCallback((doctorName: string) => {
    setScheduleForm((prev) => {
      const exists = prev.selectedDoctors.includes(doctorName);
      if (exists) return { ...prev, selectedDoctors: prev.selectedDoctors.filter((d) => d !== doctorName) };
      return { ...prev, selectedDoctors: [...prev.selectedDoctors, doctorName] };
    });
  }, []);

  const [scheduleErrors, setScheduleErrors] = useState<Record<string, string>>({});
  
  const handleDateChange = useCallback((dateStr: string) => {
    setScheduleForm(prev => ({ ...prev, dateInput: dateStr }));
  }, []);

  // =========================================================================
  // LOGIC XÓA (DELETE)
  // =========================================================================
  const handleDeleteScheduleClick = useCallback((sch: LichTiemChungSRS) => {
    setItemToDelete({
      id: sch.maLichTiem,
      type: "schedule",
      name: sch.tenVacXin || sch.loaiVacXin || sch.maLichTiem,
    });
  }, []);

  const handleDeleteAccountClick = useCallback((acc: TaiKhoan) => {
    setItemToDelete({
      id: acc.maTaiKhoan,
      type: "account",
      name: acc.tenDangNhap,
    });
  }, []);

  const confirmDelete = useCallback(async () => {
    if (!itemToDelete) return;

    if (itemToDelete.type === "schedule") {
      const numericId = String(itemToDelete.id).replace("LTC", "");
      try {
        const response = await fetchWithAuth(`${import.meta.env.VITE_API_BASE_URL}/api/admin/schedules/${numericId}`, {
          method: "DELETE",
        });
        if (response.ok) {
          triggerToast("Hủy lịch tiêm chủng thành công!");
          setSelectedSchedule(null);
          fetchSchedules();
        } else {
          triggerToast("Lỗi khi thực hiện xóa lịch tiêm trên máy chủ!");
        }
      } catch (error) {
        if (error !== "Unauthorized") console.error("Error deleting schedule:", error);
        triggerToast("Không thể kết nối đến máy chủ!");
      }
    } else if (itemToDelete.type === "account") {
      try {
        const response = await fetchWithAuth(`${import.meta.env.VITE_API_BASE_URL}/api/admin/accounts/${itemToDelete.id}`, {
          method: "DELETE",
        });
        if (response.ok) {
          triggerToast("Xóa tài khoản người dùng thành công!");
          fetchAccounts();
        } else {
          triggerToast("Lỗi khi thực hiện xóa tài khoản trên máy chủ!");
        }
      } catch (error) {
        if (error !== "Unauthorized") console.error("Error deleting account:", error);
        triggerToast("Không thể kết nối đến máy chủ!");
      }
    }

    setItemToDelete(null); 
  }, [itemToDelete, fetchWithAuth, triggerToast, fetchSchedules, fetchAccounts]);

  // =========================================================================
  // RESET FORMS
  // =========================================================================
  const resetAccountForm = useCallback(() => {
    setAccForm({
      tenDangNhap: "", matKhau: "", maQuyen: 5, hoTen: "", cmnd: "", noiO: "", moTa: "",
      email: "", namSinh: "", sdt: "", ngaySinh: "", diaChi: "", nguoiGiamHo: "", gioiTinh: "Nam",
    });
    setAccErrors({});
    setEditingAccountId(null);
    setShowAddAccount(false);
  }, []);

  const resetScheduleForm = useCallback(() => {
    setScheduleForm({
      dateInput: "", thoiGian: "", maLoaiVacXin: 0, loaiVacXinName: "", maVacXin: 0,
      soLuong: 0, doTuoi: "", diaDiem: "", ghiChu: "", selectedDoctors: [],
    });
    setScheduleErrors({});
    setEditingScheduleId(null);
    setShowAddSchedule(false);
  }, []);

  // =========================================================================
  // EDIT FORMS
  // =========================================================================
  const handleEditAccount = useCallback((acc: TaiKhoan) => {
    let formattedPhone = acc.sdt ? acc.sdt.replace(/\D/g, "") : "";
    if (formattedPhone.length > 3 && formattedPhone.length <= 6) {
      formattedPhone = `${formattedPhone.slice(0, 3)} ${formattedPhone.slice(3)}`;
    } else if (formattedPhone.length > 6) {
      formattedPhone = `${formattedPhone.slice(0, 3)} ${formattedPhone.slice(3, 6)} ${formattedPhone.slice(6)}`;
    }

    setAccForm({
      tenDangNhap: acc.tenDangNhap,
      matKhau: "",
      maQuyen: acc.maQuyen || 5,
      hoTen: acc.hoTen,
      cmnd: acc.cmnd,
      noiO: acc.noiO,
      moTa: acc.moTa,
      email: acc.email || "",
      namSinh: acc.namSinh?.toString() || "",
      sdt: formattedPhone,
      ngaySinh: acc.ngaySinh || "",
      diaChi: acc.diaChi || "",
      nguoiGiamHo: acc.nguoiGiamHo || "",
      gioiTinh: acc.gioiTinh || "Nam",
    });

    setEditingAccountId(acc.maTaiKhoan);
    setShowAddAccount(true);
  }, []);

  const handleEditSchedule = useCallback((sch: LichTiemChungSRS) => {
    setScheduleForm({
      dateInput: `${sch.nam}-${sch.thang}-${sch.ngay}`,
      thoiGian: sch.thoiGian,
      maLoaiVacXin: sch.maLoaiVacXin || 0,
      loaiVacXinName: sch.loaiVacXin || "",
      maVacXin: sch.maVacXin || 0,
      soLuong: sch.soLuong,
      doTuoi: sch.doTuoi,
      diaDiem: sch.diaDiem,
      ghiChu: sch.ghiChu,
      selectedDoctors: sch.danhSachBacSi || [],
    });
    setEditingScheduleId(sch.maLichTiem);
    setShowAddSchedule(true);
  }, []);

  // =========================================================================
  // SAVE FORMS
  // =========================================================================
  const handleSaveAccount = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!accForm.tenDangNhap.trim()) {
      newErrors.tenDangNhap = "Vui lòng nhập tên đăng nhập";
    } else if (!editingAccountId) {
      const isDuplicate = accounts.some((a) => a.tenDangNhap.toLowerCase() === accForm.tenDangNhap.trim().toLowerCase());
      if (isDuplicate) newErrors.tenDangNhap = "Tài khoản không được trùng";
    }

    if (!editingAccountId && !accForm.matKhau) newErrors.matKhau = "Vui lòng nhập mật khẩu";
    if (!accForm.hoTen.trim()) newErrors.hoTen = "Vui lòng nhập họ và tên";
    if (!accForm.cmnd) newErrors.cmnd = "Vui lòng nhập CCCD/CMND";

    if (!accForm.email.trim()) {
      newErrors.email = "Vui lòng nhập email";
    } else if (!/^\S+@\S+\.\S+$/.test(accForm.email)) {
      newErrors.email = "Email không đúng định dạng hợp lệ";
    }

    const phoneNum = accForm.sdt.replace(/\s/g, "");
    if (!phoneNum) newErrors.sdt = "Vui lòng nhập số điện thoại";
    else if (phoneNum.length < 10) newErrors.sdt = "Số điện thoại phải đủ 10 số";

    if (accForm.maQuyen === 6) {
      if (!accForm.ngaySinh) newErrors.ngaySinh = "Vui lòng chọn ngày sinh";
    } else {
      if (!accForm.namSinh) newErrors.namSinh = "Vui lòng nhập năm sinh";
      else if (accForm.namSinh.length < 4) newErrors.namSinh = "Năm sinh không hợp lệ";
    }

    if (Object.keys(newErrors).length > 0) {
      setAccErrors(newErrors);
      triggerToast("Vui lòng kiểm tra lại các trường bị lỗi viền đỏ.");
      return;
    }

    const payload = {
      ...accForm,
      namSinh: accForm.namSinh ? parseInt(accForm.namSinh) : null,
      sdt: accForm.sdt.replace(/\s/g, ""),
    };

    try {
      const url = editingAccountId
        ? `${import.meta.env.VITE_API_BASE_URL}/api/admin/accounts/${editingAccountId}`
        : `${import.meta.env.VITE_API_BASE_URL}/api/admin/accounts`;
      const response = await fetchWithAuth(url, {
        method: editingAccountId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        triggerToast(editingAccountId ? "Cập nhật tài khoản thành công!" : "Tạo mới và phân luồng thành công!");
        if (editingAccountId) {
          const currentUserStr = localStorage.getItem("user");
          if (currentUserStr) {
            try {
              const currentUser = JSON.parse(currentUserStr);
              if (currentUser.tenDangNhap === accForm.tenDangNhap || currentUser.username === accForm.tenDangNhap) {
                if (onNameChange) {
                  onNameChange(accForm.hoTen);
                }
              }
            } catch (e) {
              console.error("Lỗi parse user từ localStorage:", e);
            }
          }
        }
        fetchAccounts();
        resetAccountForm();
      } else {
        triggerToast("Lỗi khi lưu tài khoản trên máy chủ!");
      }
    } catch (error) {
      if (error !== "Unauthorized") console.error(error);
      triggerToast("Lỗi kết nối đến máy chủ!");
    }
  }, [accForm, editingAccountId, accounts, fetchWithAuth, triggerToast, onNameChange, fetchAccounts, resetAccountForm]);

  const handleSaveSchedule = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};
    if (!scheduleForm.dateInput) newErrors.dateInput = "Vui lòng chọn ngày tiêm";
    if (!scheduleForm.thoiGian.trim()) newErrors.thoiGian = "Vui lòng nhập thời gian tiêm";
    if (!scheduleForm.maVacXin) newErrors.maVacXin = "Vui lòng chọn tên vắc xin";
    if (!scheduleForm.soLuong) {
      newErrors.soLuong = "Vui lòng nhập số lượng";
    } else if (scheduleForm.soLuong <= 0) {
      newErrors.soLuong = "Số lượng phải lớn hơn 0";
    }
    if (!scheduleForm.doTuoi.trim()) newErrors.doTuoi = "Vui lòng nhập độ tuổi khuyên dùng";
    if (!scheduleForm.diaDiem.trim()) newErrors.diaDiem = "Vui lòng nhập địa điểm tổ chức";

    if (Object.keys(newErrors).length > 0) {
      setScheduleErrors(newErrors);
      triggerToast("Vui lòng kiểm tra lại các trường bị lỗi viền đỏ.");
      return;
    }

    const payload = {
      dateInput: scheduleForm.dateInput,
      thoiGian: scheduleForm.thoiGian,
      maLoaiVacXin: scheduleForm.maLoaiVacXin,
      maVacXin: scheduleForm.maVacXin,
      soLuong: Number(scheduleForm.soLuong),
      doTuoi: scheduleForm.doTuoi,
      diaDiem: scheduleForm.diaDiem,
      ghiChu: scheduleForm.ghiChu,
      selectedDoctors: scheduleForm.selectedDoctors,
    };

    try {
      const url = editingScheduleId
        ? `${import.meta.env.VITE_API_BASE_URL}/api/admin/schedules/${editingScheduleId.replace("LTC", "")}`
        : `${import.meta.env.VITE_API_BASE_URL}/api/admin/schedules`;

      const response = await fetchWithAuth(url, {
        method: editingScheduleId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        triggerToast(editingScheduleId ? "Cập nhật lịch tiêm thành công!" : "Tạo lịch tiêm mới thành công!");
        fetchSchedules();
        resetScheduleForm();
      } else {
        triggerToast("Lỗi khi lưu lịch tiêm trên máy chủ!");
      }
    } catch (error) {
      if (error !== "Unauthorized") console.error(error);
      triggerToast("Lỗi kết nối đến máy chủ!");
    }
  }, [scheduleForm, editingScheduleId, fetchWithAuth, triggerToast, fetchSchedules, resetScheduleForm]);

  // =========================================================================
  // XỬ LÝ CHAT ADMIN CHO PHẢN HỒI CẤP CAO
  // =========================================================================
  const selectTicketForProcessing = useCallback((t: SupportTicket) => {
    setSelectedTicket(t);
    setTicketResponse("");
    setTicketErrors({});
  }, []);

  const handleProcessTicket = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket || !ticketResponse.trim()) return;

    try {
      setIsReplying(true);
      const res = await fetchWithAuth(`${import.meta.env.VITE_API_BASE_URL}/api/customer/feedback/reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          feedbackId: selectedTicket.id, 
          replyContent: ticketResponse,
          sender: "admin", 
        }),
      });

      if (res.ok) {
        setTicketResponse("");
        await fetchHighLevelTickets(); 
      } else {
        triggerToast("Lỗi gửi phản hồi.");
      }
    } catch (err) {
      if (err !== "Unauthorized") triggerToast("Lỗi kết nối máy chủ.");
    } finally {
      setIsReplying(false);
    }
  }, [selectedTicket, ticketResponse, fetchWithAuth, fetchHighLevelTickets, triggerToast]);

  const handleCompleteTicket = useCallback(async () => {
    if (!selectedTicket) return;
    try {
      const res = await fetchWithAuth(`${import.meta.env.VITE_API_BASE_URL}/api/customer/feedback/complete/${selectedTicket.id}`, { method: "PUT" });
      if (res.ok) {
        triggerToast("Đã đóng phản hồi thành công!");
        await fetchHighLevelTickets();
      }
    } catch (err) {
      triggerToast("Lỗi cập nhật trạng thái");
    }
  }, [selectedTicket, fetchWithAuth, triggerToast, fetchHighLevelTickets]);

  const renderChatHistory = useCallback((jsonStr?: string) => {
    if (!jsonStr || jsonStr === "null") return null;
    try {
      const messages: ChatMessage[] = JSON.parse(jsonStr);
      return messages.map((msg, idx) => {
        const isMe = msg.sender === "admin";
        return (
          <div key={idx} className={`flex w-full mb-4 ${isMe ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 shadow-sm text-[13px] ${isMe ? "bg-amber-600 text-white rounded-tr-none" : "bg-white text-slate-700 border border-slate-200 rounded-tl-none"}`}>
              {msg.sender === "customer" && <p className="text-[10px] font-bold text-slate-400 mb-1">Khách hàng VIP</p>}
              <p className="whitespace-pre-wrap leading-relaxed">{msg.message}</p>
              <p className={`text-[10px] mt-1.5 ${isMe ? "text-amber-200 text-right" : "text-slate-400"}`}>
                {msg.sender === "admin" ? "👨‍💼 Bạn (Ban Giám Đốc) • " : msg.sender === "support" ? "🎧 Nhân viên CSKH • " : ""}
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


  return (
    <div className="space-y-6 animate-fade-in relative h-full flex flex-col">
      {/* Header Module */}
      <div className="shrink-0">
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">Quản Trị Hệ Thống</h2>
        <p className="text-sm text-slate-500 mt-1">Quản lý hệ thống, như sửa, thêm, xóa dữ liệu, phân quyền cho các user khác.</p>
      </div>

      {/* Tabs Menu */}
      <div className="border-b border-slate-200 flex space-x-2 shrink-0">
        <button
          onClick={() => setActiveTab("accounts")}
          className={`px-4 py-2.5 font-medium text-sm border-b-2 transition-colors flex items-center gap-2 ${activeTab === "accounts" ? "border-blue-600 text-blue-600" : "border-transparent text-slate-500 hover:text-slate-800"}`}
        >
          <Users className="w-4 h-4" /> Quản lý User
        </button>
        <button
          onClick={() => setActiveTab("schedules")}
          className={`px-4 py-2.5 font-medium text-sm border-b-2 transition-colors flex items-center gap-2 ${activeTab === "schedules" ? "border-blue-600 text-blue-600" : "border-transparent text-slate-500 hover:text-slate-800"}`}
        >
          <CalendarDays className="w-4 h-4" /> Quản lý Lịch tiêm chủng
        </button>
        <button
          onClick={() => { setActiveTab("feedback"); setSelectedTicket(null); }}
          className={`px-4 py-2.5 font-medium text-sm border-b-2 transition-colors flex items-center gap-2 ${activeTab === "feedback" ? "border-amber-500 text-amber-600" : "border-transparent text-slate-500 hover:text-slate-800"}`}
        >
          <MessageSquare className="w-4 h-4" /> Duyệt phản hồi cấp cao
        </button>
      </div>

      {/* ========================================= TAB: USER ACCOUNT ========================================= */}
      {activeTab === "accounts" && (
        <div className="space-y-4 flex-1 flex flex-col min-h-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 shrink-0">
            <div className="flex-1 flex gap-2">
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-500 bg-white cursor-pointer"
              >
                {ROLE_TABS.map((tab) => (
                  <option key={tab.id} value={tab.id}>
                    {tab.label} ({getRoleCount(tab.id)})
                  </option>
                ))}
              </select>
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Tìm kiếm nhanh tài khoản..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 text-sm focus:border-blue-500 outline-none"
                />
              </div>
            </div>

            <button
              onClick={() => {
                resetAccountForm();
                setShowAddAccount(true);
              }}
              className="bg-blue-600 text-white text-xs font-semibold px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-1 cursor-pointer whitespace-nowrap shrink-0"
            >
              <Plus className="w-4 h-4" /> Tạo User
            </button>
          </div>

          {showAddAccount && (
            <form
              onSubmit={handleSaveAccount}
              noValidate
              className="bg-slate-50 p-6 rounded-xl border border-blue-200 space-y-4 shadow-sm animate-fade-in ring-1 ring-blue-50 shrink-0"
            >
              <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-blue-600" />
                  <h4 className="text-sm font-bold text-slate-800">
                    {editingAccountId ? `Chỉnh sửa User: ${accForm.tenDangNhap}` : "Tạo Tài khoản & Phân quyền"}
                  </h4>
                </div>
                <button type="button" onClick={resetAccountForm} className="text-slate-400 hover:text-slate-600">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">
                      Tài khoản <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      maxLength={40}
                      disabled={!!editingAccountId}
                      value={accForm.tenDangNhap}
                      onChange={(e) => {
                        setAccForm({ ...accForm, tenDangNhap: e.target.value });
                        setAccErrors({ ...accErrors, tenDangNhap: "" });
                      }}
                      className={`w-full bg-white px-3 py-2 border rounded-lg text-xs outline-none transition-colors ${accErrors.tenDangNhap ? "border-red-500 focus:border-red-500 bg-red-50" : "border-slate-200 focus:border-blue-500"} disabled:bg-slate-100 disabled:border-slate-200`}
                    />
                    {accErrors.tenDangNhap && <p className="text-[10px] text-red-500 font-bold mt-1">{accErrors.tenDangNhap}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">
                      Mật khẩu {!editingAccountId && <span className="text-red-500">*</span>}
                    </label>
                    <input
                      type="password"
                      maxLength={20}
                      value={accForm.matKhau}
                      onChange={(e) => {
                        setAccForm({ ...accForm, matKhau: e.target.value });
                        setAccErrors({ ...accErrors, matKhau: "" });
                      }}
                      placeholder={editingAccountId ? "Bỏ trống nếu không đổi mật khẩu" : "Nhập mật khẩu..."}
                      className={`w-full bg-white px-3 py-2 border rounded-lg text-xs outline-none transition-colors ${accErrors.matKhau ? "border-red-500 focus:border-red-500 bg-red-50" : "border-slate-200 focus:border-blue-500"}`}
                    />
                    {accErrors.matKhau && <p className="text-[10px] text-red-500 font-bold mt-1">{accErrors.matKhau}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">
                      Chức vụ <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={accForm.maQuyen}
                      onChange={(e) => setAccForm({ ...accForm, maQuyen: Number(e.target.value) })}
                      className="w-full bg-white px-3 py-2 border border-slate-200 rounded-lg text-xs outline-none focus:border-blue-500 cursor-pointer"
                    >
                      <option value={1}>Administrator</option>
                      <option value={2}>Quản lý kho</option>
                      <option value={3}>Tài chính</option>
                      <option value={4}>Hỗ trợ khách hàng</option>
                      <option value={5}>Nhân viên y tế</option>
                      <option value={6}>Khách hàng</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      maxLength={255}
                      value={accForm.email}
                      onChange={(e) => {
                        setAccForm({ ...accForm, email: e.target.value });
                        setAccErrors({ ...accErrors, email: "" });
                      }}
                      className={`w-full bg-white px-3 py-2 border rounded-lg text-xs outline-none transition-colors ${accErrors.email ? "border-red-500 focus:border-red-500 bg-red-50" : "border-slate-200 focus:border-blue-500"}`}
                    />
                    {accErrors.email && <p className="text-[10px] text-red-500 font-bold mt-1">{accErrors.email}</p>}
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">
                      Họ và tên <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      maxLength={50}
                      value={accForm.hoTen}
                      onChange={(e) => {
                        setAccForm({ ...accForm, hoTen: e.target.value });
                        setAccErrors({ ...accErrors, hoTen: "" });
                      }}
                      className={`w-full bg-white px-3 py-2 border rounded-lg text-xs outline-none transition-colors ${accErrors.hoTen ? "border-red-500 focus:border-red-500 bg-red-50" : "border-slate-200 focus:border-blue-500"}`}
                    />
                    {accErrors.hoTen && <p className="text-[10px] text-red-500 font-bold mt-1">{accErrors.hoTen}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">
                      CMND/CCCD <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={accForm.cmnd}
                      onChange={handleNumberOnlyChange("cmnd", 12)}
                      className={`w-full bg-white px-3 py-2 border rounded-lg text-xs outline-none transition-colors ${accErrors.cmnd ? "border-red-500 focus:border-red-500 bg-red-50" : "border-slate-200 focus:border-blue-500"}`}
                      placeholder="Chỉ nhập số..."
                    />
                    {accErrors.cmnd && <p className="text-[10px] text-red-500 font-bold mt-1">{accErrors.cmnd}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Hộ khẩu thường trú</label>
                    <input
                      type="text"
                      maxLength={255}
                      value={accForm.noiO}
                      onChange={(e) => setAccForm({ ...accForm, noiO: e.target.value })}
                      className="w-full bg-white px-3 py-2 border border-slate-200 rounded-lg text-xs outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4 mt-2 pt-4 border-t border-slate-200">
                  <div className="md:col-span-2 text-xs font-extrabold text-blue-600 uppercase">
                    Thông tin bổ sung ({accForm.maQuyen === 6 ? "Khách hàng" : "Nhân sự"})
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">
                      Số điện thoại liên hệ <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={accForm.sdt}
                      onChange={handlePhoneChange}
                      placeholder="090 123 4567"
                      className={`w-full bg-white px-3 py-2 border rounded-lg text-xs outline-none transition-colors ${accErrors.sdt ? "border-red-500 focus:border-red-500 bg-red-50" : "border-slate-200 focus:border-blue-500"}`}
                    />
                    {accErrors.sdt && <p className="text-[10px] text-red-500 font-bold mt-1">{accErrors.sdt}</p>}
                  </div>

                  {accForm.maQuyen === 6 ? (
                    <>
                      <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1">
                          Ngày sinh <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="date"
                          value={accForm.ngaySinh}
                          onChange={(e) => {
                            setAccForm({ ...accForm, ngaySinh: e.target.value });
                            setAccErrors({ ...accErrors, ngaySinh: "" });
                          }}
                          className={`w-full bg-white px-3 py-2 border rounded-lg text-xs outline-none transition-colors ${accErrors.ngaySinh ? "border-red-500 focus:border-red-500 bg-red-50" : "border-slate-200 focus:border-blue-500"}`}
                        />
                        {accErrors.ngaySinh && <p className="text-[10px] text-red-500 font-bold mt-1">{accErrors.ngaySinh}</p>}
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1">
                          Giới tính <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={accForm.gioiTinh}
                          onChange={(e) => setAccForm({ ...accForm, gioiTinh: e.target.value })}
                          className="w-full bg-white px-3 py-2 border border-slate-200 rounded-lg text-xs outline-none focus:border-blue-500 cursor-pointer"
                        >
                          <option value="Nam">Nam</option>
                          <option value="Nữ">Nữ</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1">Người giám hộ (Nếu là trẻ em)</label>
                        <input
                          type="text"
                          maxLength={255}
                          value={accForm.nguoiGiamHo}
                          onChange={(e) => setAccForm({ ...accForm, nguoiGiamHo: e.target.value })}
                          className="w-full bg-white px-3 py-2 border border-slate-200 rounded-lg text-xs outline-none focus:border-blue-500"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-xs font-bold text-slate-600 mb-1">Địa chỉ hiện tại</label>
                        <input
                          type="text"
                          maxLength={255}
                          value={accForm.diaChi}
                          onChange={(e) => setAccForm({ ...accForm, diaChi: e.target.value })}
                          className="w-full bg-white px-3 py-2 border border-slate-200 rounded-lg text-xs outline-none focus:border-blue-500"
                        />
                      </div>
                    </>
                  ) : (
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">
                        Năm sinh <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={accForm.namSinh}
                        onChange={handleNumberOnlyChange("namSinh", 4)}
                        placeholder="YYYY"
                        className={`w-full bg-white px-3 py-2 border rounded-lg text-xs outline-none transition-colors ${accErrors.namSinh ? "border-red-500 focus:border-red-500 bg-red-50" : "border-slate-200 focus:border-blue-500"}`}
                      />
                      {accErrors.namSinh && <p className="text-[10px] text-red-500 font-bold mt-1">{accErrors.namSinh}</p>}
                    </div>
                  )}
                </div>

                <div className="md:col-span-2 pt-2">
                  <label className="block text-xs font-bold text-slate-600 mb-1">Mô tả (Notes)</label>
                  <textarea
                    value={accForm.moTa}
                    onChange={(e) => setAccForm({ ...accForm, moTa: e.target.value })}
                    className="w-full bg-white px-3 py-2 border border-slate-200 rounded-lg text-xs outline-none h-16 text-slate-700 font-sans resize-none focus:border-blue-500"
                  ></textarea>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={resetAccountForm}
                  className="px-5 py-2 border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 bg-white hover:bg-slate-50 cursor-pointer"
                >
                  Thoát
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold shadow-sm hover:bg-blue-700 cursor-pointer flex items-center gap-1"
                >
                  <Save className="w-4 h-4" /> Lưu
                </button>
              </div>
            </form>
          )}

          <div className="bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col flex-1 overflow-hidden">
            <div className="overflow-y-auto overflow-x-auto flex-1">
              <table className="w-full text-left text-xs border-collapse table-fixed min-w-[800px]">
                <thead className="sticky top-0 bg-slate-50 z-10 shadow-sm">
                  <tr className="text-slate-500 font-bold border-b border-slate-200 uppercase tracking-wider">
                    <th className="px-4 py-3.5 w-[20%]">Tài khoản</th>
                    <th className="px-4 py-3.5 w-[30%]">Họ và Tên</th>
                    <th className="px-4 py-3.5 w-[20%]">Phân Quyền</th>
                    <th className="px-4 py-3.5 w-[15%]">Điện thoại</th>
                    <th className="px-4 py-3.5 w-[15%] text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {currentAccounts.length > 0 ? (
                    currentAccounts.map((a) => (
                      <tr key={a.maTaiKhoan} className="hover:bg-slate-50/50">
                        <td className="px-4 py-4 font-semibold text-blue-600 truncate" title={a.tenDangNhap}>
                          {a.tenDangNhap}
                        </td>
                        <td className="px-4 py-4 font-bold text-slate-800 break-words">{a.hoTen}</td>
                        <td className="px-4 py-4">
                          <span
                            className={`inline-block px-2 py-1 rounded text-[10px] font-bold border leading-tight ${getRoleBadgeStyle(a.phanQuyen)}`}
                          >
                            {a.phanQuyen || "Thành viên"}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-slate-500 font-mono truncate">{a.sdt ? formatDisplayPhone(a.sdt) : "Chưa cập nhật"}</td>
                        <td className="px-4 py-4 text-right space-x-2 whitespace-nowrap">
                          <button
                            onClick={() => handleEditAccount(a)}
                            className="text-blue-600 bg-blue-50 hover:bg-blue-100 p-1.5 rounded inline-flex items-center gap-1 font-semibold transition-colors"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteAccountClick(a)}
                            className="text-red-600 bg-red-50 hover:bg-red-100 p-1.5 rounded inline-flex items-center gap-1 font-semibold transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-slate-400 font-medium">
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
                  Đang hiển thị{" "}
                  <span className="text-slate-800">
                    {(currentPage - 1) * ITEMS_PER_PAGE + 1} - {Math.min(currentPage * ITEMS_PER_PAGE, filteredAccounts.length)}
                  </span>{" "}
                  trong tổng số <span className="text-slate-800">{filteredAccounts.length}</span> bản ghi
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="p-1.5 border border-slate-200 rounded text-slate-600 hover:bg-white disabled:opacity-40 disabled:hover:bg-transparent transition-colors cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-[11px] font-bold px-3 py-1.5 bg-white border border-slate-200 rounded-md shadow-sm">
                    {currentPage} / {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="p-1.5 border border-slate-200 rounded text-slate-600 hover:bg-white disabled:opacity-40 disabled:hover:bg-transparent transition-colors cursor-pointer"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================= TAB: LỊCH TIÊM CHỦNG ========================================= */}
      {activeTab === "schedules" && (
        <div className="space-y-6 flex-1 overflow-y-auto pr-2 pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-600" /> Điều chỉnh thiết lập lịch tiêm trung tâm
            </h3>
            <button
              onClick={() => {
                resetScheduleForm();
                setShowAddSchedule(true);
              }}
              className="bg-blue-600 text-white text-xs font-semibold px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Thêm mới lịch tiêm chủng đợt mới
            </button>
          </div>

          {showAddSchedule && (
            <form
              onSubmit={handleSaveSchedule}
              noValidate
              className="bg-slate-50 p-6 rounded-xl border border-blue-200 space-y-4 animate-fade-in shadow-sm ring-1 ring-blue-50"
            >
              <div className="flex justify-between items-center border-b border-slate-200 pb-2.5">
                <div className="flex items-center gap-2">
                  <span
                    className={`p-1.5 rounded-md text-xs font-bold ${editingScheduleId ? "bg-amber-100 text-amber-700" : "bg-blue-50 text-blue-600"}`}
                  >
                    {editingScheduleId ? "Chỉnh sửa" : "Tạo mới"}
                  </span>
                  <h4 className="text-sm font-bold text-slate-800">
                    {editingScheduleId ? `Chỉnh sửa thông tin Lịch Tiêm: ${editingScheduleId}` : "Thêm mới thông tin lịch tiêm"}
                  </h4>
                </div>
                <button type="button" onClick={resetScheduleForm} className="text-slate-400 hover:text-slate-600">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Ngày tiêm <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={scheduleForm.dateInput}
                    onChange={(e) => {
                      handleDateChange(e.target.value);
                      setScheduleErrors({ ...scheduleErrors, dateInput: "" });
                    }}
                    className={`w-full bg-white px-3 py-2 border rounded-lg text-xs outline-none transition-colors ${scheduleErrors.dateInput ? "border-red-500 focus:border-red-500 bg-red-50" : "border-slate-200 focus:border-blue-500"}`}
                  />
                  {scheduleErrors.dateInput && <p className="text-[10px] text-red-500 font-bold mt-1">{scheduleErrors.dateInput}</p>}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Thời gian tiêm chủng <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    maxLength={50}
                    placeholder="VD: 07:30 - 11:30"
                    value={scheduleForm.thoiGian}
                    onChange={(e) => {
                      setScheduleForm({ ...scheduleForm, thoiGian: e.target.value });
                      setScheduleErrors({ ...scheduleErrors, thoiGian: "" });
                    }}
                    className={`w-full bg-white px-3 py-2 border rounded-lg text-xs outline-none transition-colors ${scheduleErrors.thoiGian ? "border-red-500 focus:border-red-500 bg-red-50" : "border-slate-200 focus:border-blue-500"}`}
                  />
                  {scheduleErrors.thoiGian && <p className="text-[10px] text-red-500 font-bold mt-1">{scheduleErrors.thoiGian}</p>}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Tên vắc xin đợt này <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={scheduleForm.maVacXin || 0}
                    onChange={handleVaccineSelect}
                    className={`w-full bg-white px-3 py-2 border rounded-lg text-xs outline-none transition-colors cursor-pointer ${
                      scheduleErrors.maVacXin ? "border-red-500 focus:border-red-500 bg-red-50" : "border-slate-200 focus:border-blue-500"
                    }`}
                  >
                    <option value={0} disabled>
                      -- Chọn tên vắc xin --
                    </option>
                    {vaccinesList &&
                      vaccinesList.map((v) => (
                        <option key={v.maVacXin} value={v.maVacXin}>
                          {v.tenVacXin}
                        </option>
                      ))}
                  </select>
                  {scheduleErrors.maVacXin && <p className="text-[10px] text-red-500 font-bold mt-1">{scheduleErrors.maVacXin}</p>}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Nhóm phân loại (Tự động)</label>
                  <input
                    type="text"
                    disabled
                    value={scheduleForm.loaiVacXinName || "---"}
                    className="w-full bg-slate-100 px-3 py-2 border border-slate-200 rounded-lg text-xs outline-none text-slate-500 font-medium cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Số lượng vắc xin (liều) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={scheduleForm.soLuong || ""}
                    onChange={(e) => {
                      setScheduleForm({ ...scheduleForm, soLuong: Number(e.target.value) });
                      setScheduleErrors({ ...scheduleErrors, soLuong: "" });
                    }}
                    className={`w-full bg-white px-3 py-2 border rounded-lg text-xs outline-none text-right transition-colors ${scheduleErrors.soLuong ? "border-red-500 focus:border-red-500 bg-red-50" : "border-slate-200 focus:border-blue-500"}`}
                  />
                  {scheduleErrors.soLuong && <p className="text-[10px] text-red-500 font-bold mt-1">{scheduleErrors.soLuong}</p>}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Độ tuổi khuyên dùng <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    maxLength={100}
                    value={scheduleForm.doTuoi}
                    onChange={(e) => {
                      setScheduleForm({ ...scheduleForm, doTuoi: e.target.value });
                      setScheduleErrors({ ...scheduleErrors, doTuoi: "" });
                    }}
                    className={`w-full bg-white px-3 py-2 border rounded-lg text-xs outline-none transition-colors ${scheduleErrors.doTuoi ? "border-red-500 focus:border-red-500 bg-red-50" : "border-slate-200 focus:border-blue-500"}`}
                  />
                  {scheduleErrors.doTuoi && <p className="text-[10px] text-red-500 font-bold mt-1">{scheduleErrors.doTuoi}</p>}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Địa điểm tổ chức <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    maxLength={255}
                    value={scheduleForm.diaDiem}
                    onChange={(e) => {
                      setScheduleForm({ ...scheduleForm, diaDiem: e.target.value });
                      setScheduleErrors({ ...scheduleErrors, diaDiem: "" });
                    }}
                    className={`w-full bg-white px-3 py-2 border rounded-lg text-xs outline-none transition-colors ${scheduleErrors.diaDiem ? "border-red-500 focus:border-red-500 bg-red-50" : "border-slate-200 focus:border-blue-500"}`}
                  />
                  {scheduleErrors.diaDiem && <p className="text-[10px] text-red-500 font-bold mt-1">{scheduleErrors.diaDiem}</p>}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Hội đồng Y tế / Bác sĩ phụ trách</label>
                  <div className="bg-white border border-slate-200 rounded-lg p-3 max-h-48 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {accounts
                      .filter((a) => a.phanQuyen?.toLowerCase().includes("y tế") || a.maQuyen === 5)
                      .map((bs) => (
                        <label
                          key={bs.maTaiKhoan}
                          className="flex items-center gap-2 cursor-pointer hover:bg-slate-50 p-1 rounded transition-colors border border-transparent hover:border-slate-200"
                        >
                          <input
                            type="checkbox"
                            checked={scheduleForm.selectedDoctors?.includes(bs.hoTen)}
                            onChange={() => toggleDoctor(bs.hoTen)}
                            className="w-3.5 h-3.5 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
                          />
                          <span className="text-xs text-slate-700 font-medium">
                            {bs.hoTen} <span className="text-[9px] text-slate-400 font-mono">({bs.tenDangNhap})</span>
                          </span>
                        </label>
                      ))}
                    {accounts.filter((a) => a.phanQuyen?.toLowerCase().includes("y tế") || a.maQuyen === 5).length === 0 && (
                      <span className="text-xs text-slate-400 italic">Chưa có Nhân viên y tế nào trên hệ thống. Hãy tạo User!</span>
                    )}
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Ghi chú</label>
                  <textarea
                    maxLength={1000}
                    value={scheduleForm.ghiChu}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, ghiChu: e.target.value })}
                    className="w-full bg-white px-3 py-2 border border-slate-200 rounded-lg text-xs h-16 resize-none focus:border-blue-500 outline-none transition-colors"
                  ></textarea>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={resetScheduleForm}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 bg-white hover:bg-slate-50 cursor-pointer"
                >
                  Thoát
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold shadow-sm hover:bg-blue-700 flex items-center gap-1.5 cursor-pointer"
                >
                  <Save className="w-4 h-4" /> Lưu thông tin
                </button>
              </div>
            </form>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden flex flex-col">
              <div className="p-4 bg-slate-50 border-b border-slate-200 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-xs text-slate-500 uppercase tracking-wider">Danh sách lịch tiêm</span>
                  <span className="bg-blue-100 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded-full">{filteredSchedules.length} bản ghi</span>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex-1 flex items-center gap-1.5">
                    <div className="relative flex-1">
                      <Search className="absolute left-2.5 top-2 w-3.5 h-3.5 text-slate-400" />
                      <input
                        type="date"
                        value={scheduleSearchStartDate}
                        onChange={(e) => setScheduleSearchStartDate(e.target.value)}
                        className="w-full pl-8 pr-1 py-1.5 border border-slate-200 rounded-md text-[11px] focus:outline-none focus:border-blue-500"
                        title="Từ ngày"
                      />
                    </div>

                    <span className="text-slate-400 font-bold text-xs">-</span>

                    <div className="relative flex-1">
                      <input
                        type="date"
                        value={scheduleSearchEndDate}
                        onChange={(e) => setScheduleSearchEndDate(e.target.value)}
                        className="w-full px-2 py-1.5 border border-slate-200 rounded-md text-[11px] focus:outline-none focus:border-blue-500"
                        title="Đến ngày"
                      />
                    </div>
                  </div>

                  {(scheduleSearchStartDate || scheduleSearchEndDate) && (
                    <button
                      onClick={() => {
                        setScheduleSearchStartDate("");
                        setScheduleSearchEndDate("");
                      }}
                      className="p-1.5 text-slate-400 hover:text-red-600 bg-slate-100 hover:bg-red-50 rounded transition-colors"
                      title="Xóa bộ lọc thời gian"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto flex-1">
                {filteredSchedules.length > 0 ? (
                  filteredSchedules.map((s) => (
                    <div
                      key={s.maLichTiem}
                      onClick={() => setSelectedSchedule(s)}
                      className={`p-4 cursor-pointer transition-colors ${selectedSchedule?.maLichTiem === s.maLichTiem ? "bg-blue-50/70 border-l-4 border-blue-600" : "hover:bg-slate-50/50"}`}
                    >
                      <div className="flex justify-between text-xs font-mono font-bold text-slate-400 mb-1">
                        <span>{s.maLichTiem}</span>
                        <span className="text-slate-500 font-sans">
                          {s.ngay}/{s.thang}/{s.nam}
                        </span>
                      </div>
                      <div className="font-semibold text-slate-800 text-sm mb-1">{s.tenVacXin || s.loaiVacXin}</div>
                      <div className="flex items-center text-slate-500 text-xs gap-1">
                        <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                        <span className="truncate">{s.diaDiem}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center text-xs text-slate-400">Không tìm thấy lịch tiêm nào trong thời gian này.</div>
                )}
              </div>
            </div>

            <div className="lg:col-span-2 space-y-6">
              {selectedSchedule ? (
                <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-5 relative">
                  <div className="absolute top-6 right-6 flex items-center gap-2">
                    <button
                      onClick={() => handleEditSchedule(selectedSchedule)}
                      className="text-blue-600 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg inline-flex items-center gap-1.5 text-xs font-bold transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteScheduleClick(selectedSchedule)}
                      className="text-red-600 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg inline-flex items-center gap-1.5 text-xs font-bold transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="border-b border-slate-100 pb-4 pr-24">
                    <span className="text-xs font-mono font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                      MÃ ĐỢT: {selectedSchedule.maLichTiem}
                    </span>
                    <h3 className="text-lg font-bold text-slate-800 mt-1">{selectedSchedule.tenVacXin || selectedSchedule.loaiVacXin}</h3>
                    <p className="text-sm font-bold text-blue-600 mt-1">
                      {selectedSchedule.thoiGian} ({selectedSchedule.ngay}/{selectedSchedule.thang}/{selectedSchedule.nam})
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div className="bg-slate-50/60 p-3 rounded-lg border border-slate-100">
                      <span className="block font-semibold text-slate-400 mb-1">🎯 Độ tuổi khuyên dùng</span>
                      <span className="font-medium text-slate-800 text-sm">{selectedSchedule.doTuoi}</span>
                    </div>
                    <div className="bg-slate-50/60 p-3 rounded-lg border border-slate-100">
                      <span className="block font-semibold text-slate-400 mb-1">📦 Tổng cơ số vắc-xin</span>
                      <span className="font-bold text-slate-800 text-sm">{selectedSchedule.soLuong} liều thuốc</span>
                    </div>
                    <div className="sm:col-span-2 bg-slate-50/60 p-3 rounded-lg border border-slate-100 flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-slate-400 mt-0.5" />
                      <div>
                        <span className="block font-semibold text-slate-400">📍 Địa điểm tổ chức</span>
                        <span className="font-medium text-slate-800">{selectedSchedule.diaDiem}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-500 uppercase">👨‍⚕️ Hội đồng Y tế tham gia</label>
                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 flex flex-wrap gap-2">
                      {selectedSchedule.danhSachBacSi && selectedSchedule.danhSachBacSi.length > 0 ? (
                        selectedSchedule.danhSachBacSi.map((doc, idx) => (
                          <span key={idx} className="bg-white border border-slate-200 shadow-sm px-2.5 py-1 rounded-md flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span> {doc}
                          </span>
                        ))
                      ) : (
                        <span className="text-slate-400 italic">Chưa chỉ định.</span>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-500 uppercase">📝 Nhật ký (Ghi chú)</label>
                    <div className="bg-amber-50/50 border border-amber-200/60 p-3 rounded-lg text-xs text-slate-700 leading-relaxed whitespace-pre-line">
                      {selectedSchedule.ghiChu || "Không có ghi chú."}
                    </div>
                  </div>

                  {/* BẢNG DANH SÁCH BỆNH NHÂN ĐĂNG KÝ (MỚI THÊM) */}
                  <div className="mt-6 pt-4 border-t border-slate-200">
                    <h4 className="text-sm font-bold text-slate-800 mb-3 flex items-center justify-between">
                        Danh sách khách hàng đăng ký 
                        <span className="bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full">{selectedSchedule.danhSachNguoiDangKy?.length || 0} lượt ĐK</span>
                    </h4>
                    
                    <div className="border border-slate-200 rounded-lg overflow-hidden">
                      <div className="overflow-x-auto">
                          <table className="w-full text-left text-xs border-collapse">
                              <thead className="bg-slate-50 border-b border-slate-200">
                                  <tr className="text-slate-500 font-bold uppercase tracking-wider">
                                      <th className="px-4 py-2.5">STT</th>
                                      <th className="px-4 py-2.5">Mã KH</th>
                                      <th className="px-4 py-2.5">Họ và Tên</th>
                                      <th className="px-4 py-2.5">Ngày sinh</th>
                                      <th className="px-4 py-2.5">Giới tính</th>
                                      <th className="px-4 py-2.5">Liên hệ</th>
                                      <th className="px-4 py-2.5 text-center">Trạng thái</th>
                                  </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                  {selectedSchedule.danhSachNguoiDangKy && selectedSchedule.danhSachNguoiDangKy.length > 0 ? (
                                      selectedSchedule.danhSachNguoiDangKy.map((kh, idx) => (
                                          <tr key={idx} className="hover:bg-slate-50/50 text-slate-700 font-medium">
                                              <td className="px-4 py-2 text-slate-400">{idx + 1}</td>
                                              <td className="px-4 py-2 font-mono text-blue-600">{kh.maBenhNhan}</td>
                                              <td className="px-4 py-2">{kh.tenBenhNhan}</td>
                                              <td className="px-4 py-2">{kh.ngaySinh}</td>
                                              <td className="px-4 py-2">{kh.gioiTinh}</td>
                                              <td className="px-4 py-2">{formatDisplayPhone(kh.sdt)}</td>
                                              <td className="px-4 py-2 text-center">
                                                  <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${kh.trangThaiTiem === 'Đã tiêm' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                                                      {kh.trangThaiTiem}
                                                  </span>
                                              </td>
                                          </tr>
                                      ))
                                  ) : (
                                      <tr><td colSpan={7} className="px-4 py-6 text-center text-slate-400 italic">Chưa có khách hàng nào đăng ký vào lịch này.</td></tr>
                                  )}
                              </tbody>
                          </table>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center p-12 border border-dashed border-slate-200 rounded-xl text-slate-400 text-sm">
                  Chọn một lịch tiêm để hiển thị chi tiết.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================= TAB PHẢN HỒI CẤP CAO (GIAO DIỆN CHAT) ========================================= */}
      {/* {activeTab === "feedback" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start h-[600px] pb-4">
          <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm flex flex-col h-full">
            <div className="p-4 bg-amber-50/50 border-b border-slate-200">
              <h3 className="font-bold text-slate-800 text-sm">Hòm thư Góp ý / Khiếu nại</h3>
              <p className="text-xs text-slate-500 mt-1">Dành riêng cho Ban Giám Đốc xử lý</p>
            </div>

            <div className="p-3 border-b border-slate-100 bg-slate-50/50">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Tìm kiếm nhanh..."
                  className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 text-xs outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                />
              </div>
            </div>

            <div className="overflow-y-auto flex-1 divide-y divide-slate-100">
              {isTicketsLoading ? (
                <div className="p-8 text-center text-xs text-slate-400">Đang tải dữ liệu...</div>
              ) : ticketsList.length > 0 ? (
                ticketsList.map((t) => (
                  <div
                    key={t.id}
                    onClick={() => selectTicketForProcessing(t)}
                    className={`p-4 cursor-pointer text-sm transition-colors flex flex-col space-y-2 ${
                      selectedTicket?.id === t.id ? "bg-amber-50/50 border-l-4 border-amber-500" : "hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="font-mono text-xs font-bold text-slate-400">{t.id}</span>
                        <p className="font-bold text-slate-800 text-sm mt-0.5">{t.customerName}</p>
                      </div>
                      <span
                        className={`text-[9px] font-bold px-2 py-0.5 rounded whitespace-nowrap ${
                          t.status === "Đã hoàn thành" ? "bg-slate-100 text-slate-500" : t.status === "Đã trả lời" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
                        }`}
                      >
                        {t.status}
                      </span>
                    </div>
                    <div className="text-xs font-semibold text-amber-600 bg-amber-50 px-2 py-1 rounded inline-block w-max">
                      Loại: {t.type || "Chưa xác định"}
                    </div>
                    <div className="text-xs text-slate-600 line-clamp-2">{t.comments}</div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-xs text-slate-400">Không có phản hồi cấp cao nào.</div>
              )}
            </div>
          </div>

          <div className="lg:col-span-7 h-full flex-col min-h-0 flex">
            {!selectedTicket ? (
              <div className="bg-slate-50 rounded-xl border border-dashed border-slate-200 p-8 text-center text-slate-400 text-sm flex-1 flex items-center justify-center">
                Vui lòng chọn một thư bên trái để xem nội dung và trả lời.
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col h-full min-h-0 overflow-hidden">
                <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center shrink-0 z-10">
                  <div>
                    <h4 className="font-bold text-sm text-slate-800 flex items-center gap-2">
                      Hỗ trợ VIP {selectedTicket.id}
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Khách hàng: <span className="font-semibold text-blue-600">{selectedTicket.customerName}</span> ({selectedTicket.email})
                    </p>
                  </div>
                  {selectedTicket.status === "Đã hoàn thành" ? (
                    <span className="px-3 py-1.5 bg-slate-100 text-slate-500 border border-slate-200 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Đã đóng
                    </span>
                  ) : (
                    <button
                      onClick={handleCompleteTicket}
                      className="px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors"
                    >
                        <CheckCircle2 className="w-3.5 h-3.5" /> Đánh dấu Hoàn thành
                    </button>
                  )}
                </div>

                <div className="flex-1 overflow-y-auto min-h-0 p-4 bg-slate-50/50">
                  {renderChatHistory(selectedTicket.chiTietPhanHoi)}
                  <div ref={chatEndRef} />
                </div>

                <div className="p-4 bg-white border-t border-slate-200 shrink-0">
                  {selectedTicket.status === "Đã hoàn thành" ? (
                    <div className="text-center text-xs text-slate-400 italic py-2">Khách hàng đã xác nhận giải quyết xong sự cố này.</div>
                  ) : (
                    <form onSubmit={handleProcessTicket} className="flex gap-2">
                      <input
                        type="text"
                        required
                        value={ticketResponse}
                        onChange={(e) => setTicketResponse(e.target.value)}
                        placeholder="Nhập nội dung trả lời (Đại diện BGD)..."
                        className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-amber-500 focus:bg-white transition-all"
                      />
                      <button
                        type="submit"
                        disabled={isReplying || !ticketResponse.trim()}
                        className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-bold rounded-xl flex items-center justify-center transition-colors shadow-sm"
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
      )} */}

      {/* ========================================= TAB PHẢN HỒI CẤP CAO (GIAO DIỆN CHAT ĐỒNG BỘ SUPPORT) ========================================= */}
      {activeTab === "feedback" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start h-[600px] pb-4">
          {/* Cột trái: Danh sách phản hồi */}
          <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm flex flex-col h-full">
            <div className="p-4 bg-amber-50/50 border-b border-slate-200 shrink-0">
              <h3 className="font-bold text-slate-800 text-sm">Hòm thư Góp ý / Khiếu nại</h3>
              <p className="text-xs text-slate-500 mt-1">Dành riêng cho Ban Giám Đốc xử lý</p>
            </div>

            {/* Vùng Lọc và Tìm kiếm */}
            <div className="p-3 border-b border-slate-100 bg-slate-50/50 flex flex-col gap-2 shrink-0">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tìm kiếm theo ID, Tên..."
                  className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 text-xs outline-none focus:ring-1 focus:ring-amber-500 bg-white"
                />
              </div>
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-slate-400" />
                <select
                  value={ticketStatusFilter}
                  onChange={(e) => setTicketStatusFilter(e.target.value)}
                  className="flex-1 bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs outline-none focus:border-amber-500 cursor-pointer"
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
              {isTicketsLoading ? (
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
                              ? "bg-amber-50/50 border border-amber-200 shadow-sm"
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
                <div className="p-8 text-center text-xs text-slate-400">Không tìm thấy phản hồi nào phù hợp.</div>
              )}
            </div>
          </div>

          {/* Cột phải: Khung xử lý Chat */}
          <div className="lg:col-span-7 h-full flex flex-col min-h-0">
            {!selectedTicket ? (
              <div className="bg-slate-50 rounded-xl border border-dashed border-slate-200 p-8 text-center text-slate-400 text-sm h-full flex items-center justify-center">
                Vui lòng chọn một thư bên trái để xem nội dung và trả lời.
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col h-full min-h-0 overflow-hidden">
                {/* Chat Header */}
                <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center shrink-0 z-10">
                  <div>
                    <h4 className="font-bold text-sm text-slate-800 flex items-center gap-2">
                      Phản hồi cấp cao: {selectedTicket.id}
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Khách hàng: <span className="font-semibold text-blue-600">{selectedTicket.customerName}</span> ({selectedTicket.email})
                    </p>
                  </div>
                  {selectedTicket.status === "Đã hoàn thành" ? (
                    <span className="px-3 py-1.5 bg-slate-100 text-slate-500 border border-slate-200 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Đã đóng
                    </span>
                  ) : (
                    <button
                      onClick={handleCompleteTicket}
                      className="px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors"
                    >
                        <CheckCircle2 className="w-3.5 h-3.5" /> Đánh dấu Hoàn thành
                    </button>
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
                        value={ticketResponse}
                        onChange={(e) => setTicketResponse(e.target.value)}
                        placeholder="Nhập nội dung trả lời (Đại diện BGD)..."
                        className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-amber-500 focus:bg-white transition-all"
                      />
                      <button
                        type="submit"
                        disabled={isReplying || !ticketResponse.trim()}
                        className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-bold rounded-xl flex items-center justify-center transition-colors shadow-sm"
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

      {/* --- CUSTOM CONFIRM DELETE POPUP --- */}
      {itemToDelete !== null &&
        createPortal(
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-[90%] max-w-md p-6 space-y-4">
              <div className="flex items-center gap-3 text-red-600 border-b border-slate-100 pb-3">
                <AlertCircle className="w-6 h-6" />
                <h3 className="text-lg font-bold">Xác nhận xóa dữ liệu</h3>
              </div>
              <p className="text-sm text-slate-600">
                Bạn có chắc chắn muốn xóa {itemToDelete.type === "account" ? "tài khoản người dùng" : "lịch tiêm chủng"}{" "}
                <span className="font-bold text-red-600">{itemToDelete.name}</span> khỏi hệ thống không? Dữ liệu này sẽ không thể khôi phục.
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
          document.body,
        )}
    </div>
  );
}