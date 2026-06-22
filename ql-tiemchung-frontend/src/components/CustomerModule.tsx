import React, { useState } from 'react';
import { Appointment, Vaccine, SupportTicket, SystemLog } from '../types';
import { Calendar, Syringe, MessageSquare, ListCheck, Star, Send, PlusCircle, Sparkles, Shield, Bell } from 'lucide-react';

interface CustomerModuleProps {
  appointments: Appointment[];
  setAppointments: React.Dispatch<React.SetStateAction<Appointment[]>>;
  vaccines: Vaccine[];
  tickets: SupportTicket[];
  setTickets: React.Dispatch<React.SetStateAction<SupportTicket[]>>;
  systemLogs: SystemLog[];
  setSystemLogs: React.Dispatch<React.SetStateAction<SystemLog[]>>;
  triggerToast: (msg: string) => void;
}

export default function CustomerModule({
  appointments,
  setAppointments,
  vaccines,
  tickets,
  setTickets,
  systemLogs,
  setSystemLogs,
  triggerToast
}: CustomerModuleProps) {
  const [activeTab, setActiveTab] = useState<'home' | 'book' | 'vaccines' | 'feedback'>('home');

  // Booking states
  const [bookName, setBookName] = useState('Nguyễn Thị A');
  const [bookPhone, setBookPhone] = useState('0903123456');
  const [bookDob, setBookDob] = useState('1995-08-14');
  const [bookVacId, setBookVacId] = useState(vaccines[0]?.id || '');
  const [bookDate, setBookDate] = useState('2026-06-25');
  const [bookSlot, setBookSlot] = useState('08:00 - 09:30');
  const [bookBranch, setBookBranch] = useState('Cơ sở 1 - Hải Châu, Đà Nẵng');
  const [bookDeclaration, setBookDeclaration] = useState('Không có lịch sử kích ứng thuốc hay mẫn cảm nặng.');

  // Feedback states
  const [feedRating, setFeedRating] = useState(5);
  const [feedComment, setFeedComment] = useState('');
  const [feedPhone, setFeedPhone] = useState('0903123456');

  const myAppointments = appointments.filter(
    (app) => app.patientPhone === '0903123456' || app.patientName.toLowerCase() === 'nguyễn thị a'
  );

  const handleBookAppointment = (e: React.FormEvent) => {
    e.preventDefault();

    const selectedVac = vaccines.find((v) => v.id === bookVacId);
    if (!selectedVac) return;

    if (selectedVac.stock <= 0) {
      triggerToast(`Chúng tôi vô cùng xin lỗi: Vaccine ${selectedVac.name} hiện thời đang hết hàng tại cơ sở. Bạn hãy chọn loại khác nhé.`);
      return;
    }

    const newAppointment: Appointment = {
      id: `L-${String(appointments.length + 1).padStart(3, '0')}`,
      patientName: bookName,
      patientPhone: bookPhone,
      patientDob: bookDob,
      vaccineId: bookVacId,
      vaccineName: selectedVac.name,
      date: bookDate,
      timeSlot: bookSlot,
      branch: bookBranch,
      status: 'Chờ xác nhận',
      healthDeclaration: bookDeclaration,
    };

    setAppointments([...appointments, newAppointment]);
    triggerToast(`Đăng ký cuộc hẹn tiêm chủng thành công! Vui lòng chờ bác sĩ tại ${bookBranch} phê duyệt.`);

    // Add to system log
    setSystemLogs([
      {
        id: `LOG-${Date.now()}`,
        time: new Date().toISOString().replace('T', ' ').substring(0, 19),
        handler: `${bookName} (Khách hàng)`,
        action: 'Đặt lịch tiêm chủng',
        details: `Khách hàng đặt hẹn tiêm vắc-xin ${selectedVac.name} vào ngày ${bookDate} (${bookSlot}) tại ${bookBranch}`,
      },
      ...systemLogs,
    ]);

    setActiveTab('home');
    // clean
    setBookDeclaration('Sức khỏe bình thường.');
  };

  const handleFeedbackSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!feedComment) {
      triggerToast('Vui lòng viết đánh giá trước khi gửi.');
      return;
    }

    const newTicket: SupportTicket = {
      id: `TK-${String(tickets.length + 1).padStart(3, '0')}`,
      customerName: 'Nguyễn Thị A',
      phone: feedPhone,
      rating: feedRating,
      comments: feedComment,
      status: 'Mới',
      date: new Date().toISOString().split('T')[0],
    };

    setTickets([newTicket, ...tickets]);
    triggerToast('Cám ơn đóng góp ý kiến của quý khách! Gửi feedback lên phân hệ tư vấn thành công.');

    setSystemLogs([
      {
        id: `LOG-${Date.now()}`,
        time: new Date().toISOString().replace('T', ' ').substring(0, 19),
        handler: 'Nguyễn Thị A (Khách hàng)',
        action: 'Gửi bình luận đánh giá',
        details: `Đánh giá mức độ hài lòng: ${feedRating} sao. Ý kiến phản cảm: ${feedComment}`,
      },
      ...systemLogs,
    ]);

    setFeedComment('');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Visual Header Banner */}
      <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-800 text-white rounded-2xl p-8 relative overflow-hidden shadow-lg border border-blue-700">
        <div className="relative z-10 max-w-2xl space-y-3">
          <span className="bg-blue-500/30 text-blue-100 text-xs font-bold px-3 py-1 rounded-full border border-blue-400/30 inline-flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5" /> Phân hệ dành cho Khách Hàng
          </span>
          <h2 className="text-3xl font-bold tracking-tight">Chào buổi sáng, Nguyễn Thị A!</h2>
          <p className="text-sm text-blue-100 opacity-90 leading-relaxed">
            Hồ sơ điện tử số tiêm chủng của gia đình bạn đã được đồng bộ hóa thành công. Bạn đang có{' '}
            <span className="font-bold underline text-white">{myAppointments.length}</span> cuộc hẹn đang chờ chăm sóc.
          </p>
          <div className="pt-2 flex gap-3">
            <button
              onClick={() => setActiveTab('book')}
              className="bg-white text-blue-700 text-xs font-bold px-4 py-2.5 rounded-lg hover:bg-blue-50 transition-colors shadow shadow-blue-900/30 cursor-pointer flex items-center gap-1 bg-white"
            >
              <Calendar className="w-4 h-4" /> Đăng ký tiêm phòng mới
            </button>
            <button
              onClick={() => setActiveTab('vaccines')}
              className="bg-blue-500/20 border border-blue-300 text-white text-xs font-bold px-4 py-2.5 rounded-lg hover:bg-blue-500/30 transition-colors cursor-pointer"
            >
              Tra cứu giá vắc-xin
            </button>
          </div>
        </div>
        
        {/* Abstract design nodes */}
        <div className="absolute right-0 top-0 w-80 h-80 bg-white/5 rounded-full blur-3xl -mr-20 -mt-20"></div>
        <div className="absolute right-32 bottom-0 w-48 h-48 bg-blue-400/10 rounded-full blur-2xl -mb-10 animate-pulse"></div>
      </div>

      {/* Metrics inside Module */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Số mũi đã tiêm</p>
            <h3 className="text-2xl font-extrabold text-slate-800 mt-1">14 Mũi tiêm</h3>
          </div>
          <Syringe className="w-10 h-10 text-blue-500 bg-blue-50 p-2 rounded-lg" />
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Lịch hẹn sắp tới</p>
            <h3 className="text-2xl font-extrabold text-slate-800 mt-1">{myAppointments.length} Lịch hẹn</h3>
          </div>
          <Calendar className="w-10 h-10 text-purple-500 bg-purple-50 p-2 rounded-lg" />
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Thông báo y tế</p>
            <h3 className="text-2xl font-extrabold text-emerald-600 mt-1">05 Mới</h3>
          </div>
          <Bell className="w-10 h-10 text-emerald-500 bg-emerald-50 p-2 rounded-lg" />
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Bảo hiểm Y tế liên kết</p>
            <h3 className="text-2xl font-extrabold text-slate-800 mt-1">BHYT Toàn Dân</h3>
          </div>
          <Shield className="w-10 h-10 text-slate-500 bg-slate-50 p-2 rounded-lg" />
        </div>
      </div>

      {/* Navigation Inside Customer Module */}
      <div className="border-b border-slate-200 flex space-x-2">
        <button
          onClick={() => setActiveTab('home')}
          className={`px-4 py-2.5 font-medium text-sm border-b-2 transition-colors ${
            activeTab === 'home' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          🏠 Trang chủ cá nhân
        </button>
        <button
          onClick={() => setActiveTab('book')}
          className={`px-4 py-2.5 font-medium text-sm border-b-2 transition-colors ${
            activeTab === 'book' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          📋 Đăng ký lịch tiêm mới
        </button>
        <button
          onClick={() => setActiveTab('vaccines')}
          className={`px-4 py-2.5 font-medium text-sm border-b-2 transition-colors ${
            activeTab === 'vaccines' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          💉 Bảng giá & Danh mục vắc-xin
        </button>
        <button
          onClick={() => setActiveTab('feedback')}
          className={`px-4 py-2.5 font-medium text-sm border-b-2 transition-colors ${
            activeTab === 'feedback' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          💬 Gửi phản hồi, hâm nóng dịch vụ
        </button>
      </div>

      {/* Tab Area */}
      {activeTab === 'home' && (
        <div className="space-y-6">
          {/* Active Appointments list */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <ListCheck className="w-5 h-5 text-blue-500" /> Tiến trình đăng ký cuộc hẹn tiêm chủng của bạn
              </h3>
              <span className="text-xs text-slate-400">Tự động cập nhật sau 3 giây</span>
            </div>

            {myAppointments.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {myAppointments.map((app) => (
                  <div key={app.id} className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 space-y-3 relative overflow-hidden">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="text-xs text-slate-400 font-bold font-mono">ID CUỘC HẸN: {app.id}</div>
                        <h4 className="font-bold text-slate-800 mt-1">{app.vaccineName}</h4>
                      </div>
                      <span
                        className={`text-xs px-2.5 py-0.5 rounded font-semibold ${
                          app.status === 'Chờ xác nhận'
                            ? 'bg-amber-100 text-amber-800'
                            : app.status === 'Đã duyệt'
                            ? 'bg-blue-100 text-blue-800'
                            : app.status === 'Đã tiêm'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {app.status}
                      </span>
                    </div>

                    <div className="text-xs text-slate-600 space-y-1">
                      <div>
                        <span className="text-slate-400 font-medium">Bệnh nhân thụ hưởng:</span>{' '}
                        <span className="font-semibold text-slate-800">{app.patientName}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 font-medium">Mốc thời gian:</span>{' '}
                        <span className="font-semibold text-slate-800">{app.date} | {app.timeSlot}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 font-medium">Chi nhánh tiêm chủng:</span>{' '}
                        <span className="font-semibold text-slate-800">{app.branch}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-slate-400 space-y-2">
                <Calendar className="w-10 h-10 mx-auto text-slate-300" />
                <p className="text-sm font-semibold text-slate-700">Gia đình bạn chưa có lịch hẹn tiêm phòng nào</p>
                <p className="text-xs text-slate-400">Bạn có thể tạo ngay một cuộc hẹn tiêm phòng dịch vụ ở tab Đăng ký!</p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'book' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-6">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-base font-bold text-slate-800 font-sans">Đặt hẹn chương trình tiêm phòng dịch vụ</h3>
            <p className="text-xs text-slate-500 mt-1">Chọn vắc-xin, cơ sở y viện và cam kết tình trạng mẫn cảm trẻ em.</p>
          </div>

          <form onSubmit={handleBookAppointment} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Tên Bệnh nhân (Người tiêm) *</label>
                <input
                  type="text"
                  required
                  value={bookName}
                  onChange={(e) => setBookName(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg p-2 text-sm outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Số điện thoại liên lạc *</label>
                <input
                  type="text"
                  required
                  value={bookPhone}
                  onChange={(e) => setBookPhone(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg p-2 text-sm outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Ngày tháng năm sinh *</label>
                <input
                  type="date"
                  required
                  value={bookDob}
                  onChange={(e) => setBookDob(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg p-2 text-sm outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Chọn vắc-xin phòng bệnh *</label>
                <select
                  value={bookVacId}
                  onChange={(e) => setBookVacId(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg p-2.5 text-sm bg-white outline-none focus:ring-1 focus:ring-blue-500"
                >
                  {vaccines.map((v) => (
                    <option key={v.id} value={v.id} disabled={v.stock === 0}>
                      {v.name} ({v.stock > 0 ? `Còn ${v.stock} liều` : 'ĐÃ HẾT HÀNG'})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Ngày mong muốn tiêm chủng *</label>
                <input
                  type="date"
                  required
                  value={bookDate}
                  onChange={(e) => setBookDate(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg p-2 text-sm outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Khung giờ vàng khám sàng lọc *</label>
                <select
                  value={bookSlot}
                  onChange={(e) => setBookSlot(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg p-2.5 text-sm bg-white outline-none"
                >
                  <option value="08:00 - 09:30">Khung giờ: 08:00 - 09:30 AM</option>
                  <option value="10:00 - 11:30">Khung giờ: 10:00 - 11:30 AM</option>
                  <option value="14:00 - 15:30">Khung giờ: 14:00 - 15:30 PM</option>
                  <option value="16:00 - 17:30">Khung giờ: 16:00 - 17:30 PM</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Chi nhánh phòng khám thuận tiện nhất *</label>
              <select
                value={bookBranch}
                onChange={(e) => setBookBranch(e.target.value)}
                className="w-full border border-slate-200 rounded-lg p-2.5 text-sm bg-white outline-none"
              >
                <option value="Cơ sở 1 - Hải Châu, Đà Nẵng">Chi nhánh 1: Số 120 Hải Châu, Đà Nẵng</option>
                <option value="Cơ sở 2 - Cầu Giấy, Hà Nội">Chi nhánh 2: Số 86 Cầu Giấy, Hà Nội</option>
                <option value="Cơ sở 3 - Quận 3, TP. HCM">Chi nhánh 3: Số 340 Nam Kỳ Khởi Nghĩa, Quận 3, TP. HCM</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Bản tự khai báo mẫn cảm của trẻ (Hoặc sinh hiệu bé lúc khám gần nhất)</label>
              <textarea
                value={bookDeclaration}
                onChange={(e) => setBookDeclaration(e.target.value)}
                className="w-full border border-slate-200 rounded-lg p-3 text-sm h-20 outline-none"
                placeholder="VD: Bé không dị ứng sữa mẹ, ăn khỏe, sinh hoạt bình thường..."
              />
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-5 py-2.5 rounded-lg flex items-center gap-1.5 cursor-pointer shadow-sm transition-colors"
              >
                <PlusCircle className="w-4.5 h-4.5" /> Gửi yêu cầu đặt lịch hẹn
              </button>
            </div>
          </form>
        </div>
      )}

      {activeTab === 'vaccines' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <h3 className="text-base font-bold text-slate-800 font-sans">Tra cứu Danh mục Vắc-xin chính quy dịch vụ</h3>
            <p className="text-xs text-slate-500 mt-1">
              Giá niêm yết công khai và được cập nhật trực thực tế theo tình hình tồn kho của trung tâm MediFlow Pro.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {vaccines.map((v) => (
              <div key={v.id} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4 hover:border-blue-300 hover:shadow-md transition-all">
                <div className="flex justify-between items-start">
                  <div className="w-10 h-10 bg-blue-50 text-blue-600 p-2 rounded-lg flex items-center justify-center">
                    <Syringe className="w-5 h-5 animate-pulse" />
                  </div>
                  <span
                    className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded ${
                      v.stock > 0
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-100'
                        : 'bg-red-50 text-red-800 border border-red-100'
                    }`}
                  >
                    {v.stock > 0 ? 'Còn liều tiêm' : 'Tạm hết hàng'}
                  </span>
                </div>

                <div>
                  <h4 className="font-bold text-slate-900 group-hover:text-blue-600">{v.name}</h4>
                  <p className="text-xs text-slate-400 mt-1">Xuất xứ quy chuẩn: <span className="font-semibold text-slate-600">{v.origin}</span></p>
                  <p className="text-xs text-slate-400">Thể tích / liều dung: <span className="font-semibold text-slate-600">{v.dosage}</span></p>
                  <p className="text-xs text-slate-400 font-medium">Đối tượng tiêm phù hợp: <span className="text-blue-600 font-semibold">{v.ageGroup}</span></p>
                </div>

                <div className="border-t border-slate-100 pt-3 flex justify-between items-center bg-slate-50 -mx-5 -mb-5 p-4 rounded-b-xl border-t">
                  <span className="text-xs text-slate-500 font-medium">Đơn giá niêm yết (VND):</span>
                  <span className="font-extrabold text-blue-700 text-base">{v.sellingPrice.toLocaleString()} ₫</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'feedback' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-6">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-base font-bold text-slate-800 font-sans">Gửi hâm nóng dịch vụ & đóng góp ý kiến</h3>
            <p className="text-xs text-slate-500 mt-1">Phản hồi của quý khách sẽ gửi trực lên phân hệ hỗ trợ nhằm khắc phục và tối ưu chất lượng.</p>
          </div>

          <form onSubmit={handleFeedbackSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Số sao hài lòng dịch vụ y khoa *</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setFeedRating(star)}
                      className="p-1 cursor-pointer transition-transform active:scale-90"
                    >
                      <Star
                        className={`w-6 h-6 ${
                          star <= feedRating ? 'text-amber-400 fill-amber-400' : 'text-slate-200'
                        }`}
                      />
                    </button>
                  ))}
                  <span className="text-xs mt-2.5 text-slate-500 font-semibold">({feedRating} / 5 sao)</span>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Số điện thoại khách hàng đóng góp *</label>
                <input
                  type="text"
                  required
                  value={feedPhone}
                  onChange={(e) => setFeedPhone(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg p-2 text-sm outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Mô tả phản hồi của bạn chi tiết *</label>
              <textarea
                required
                value={feedComment}
                onChange={(e) => setFeedComment(e.target.value)}
                placeholder="Ví dụ: Vết tiêm của bé có sưng đỏ không nặng, bác sĩ tư vấn mĩ mãn. Tôi mong muốn có hướng dẫn cụ thể trên sổ..."
                className="w-full border border-slate-200 rounded-lg p-3 text-sm h-32 outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs px-5 py-2.5 rounded-lg flex items-center gap-1.5 cursor-pointer shadow-sm transition-colors"
              >
                <Send className="w-4 h-4" /> Gửi phản hồi lên trung tâm
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
