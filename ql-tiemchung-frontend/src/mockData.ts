import { Vaccine, Patient, UserAccount, StockLog, Appointment, SupportTicket, FAQ, Invoice, SystemLog } from './types';

export const initialUsers: UserAccount[] = [
  { id: 'US-001', fullName: 'Dr. Hoàng Quốc Việt', email: 'viet.hq@mediflow.com', phone: '0912345678', role: 'Medical', status: 'Hoạt động', createdAt: '2025-01-10' },
  { id: 'US-002', fullName: 'Trần Thị Mỹ Linh', email: 'linh.ttm@mediflow.com', phone: '0987654321', role: 'Inventory', status: 'Hoạt động', createdAt: '2025-02-15' },
  { id: 'US-003', fullName: 'Nguyễn Minh Anh', email: 'anh.nm@mediflow.com', phone: '0905123456', role: 'Finance', status: 'Hoạt động', createdAt: '2025-03-20' },
  { id: 'US-004', fullName: 'Lê Văn Thanh', email: 'thanh.lv@mediflow.com', phone: '0914223344', role: 'Support', status: 'Hoạt động', createdAt: '2025-04-05' },
  { id: 'US-005', fullName: 'Phạm Hải Đăng', email: 'dang.ph@mediflow.com', phone: '0977889988', role: 'Admin', status: 'Hoạt động', createdAt: '2024-12-01' },
];

export const initialVaccines: Vaccine[] = [
  {
    id: 'VAC-001',
    name: 'Phòng bệnh lao - BCG',
    code: 'BCG',
    receivedDate: '2026-01-15',
    expiryDate: '2027-01-15',
    licenseNo: '1/1/2015',
    origin: 'Việt Nam',
    dosage: '0.1 ml',
    stock: 500,
    tempRange: '2°C - 8°C',
    ageGroup: 'Trẻ sơ sinh',
    importPrice: 80000,
    sellingPrice: 150000,
    status: 'Sẵn có'
  },
  {
    id: 'VAC-002',
    name: 'Phòng Viêm gan B - ENGERIX B 1ml',
    code: 'ENGERIX B',
    receivedDate: '2026-02-10',
    expiryDate: '2027-02-10',
    licenseNo: '2/1/2015',
    origin: 'Bỉ',
    dosage: '1.0 ml',
    stock: 45,
    tempRange: '2°C - 8°C',
    ageGroup: 'Người lớn (>20 tuổi)',
    importPrice: 180000,
    sellingPrice: 200000,
    status: 'Sắp hết'
  },
  {
    id: 'VAC-003',
    name: 'Phòng Viêm gan B - ENGERIX B 0.5ml',
    code: 'ENGERIX B 0.5',
    receivedDate: '2026-02-10',
    expiryDate: '2027-02-10',
    licenseNo: '3/1/2015',
    origin: 'Bỉ',
    dosage: '0.5 ml',
    stock: 0,
    tempRange: '2°C - 8°C',
    ageGroup: 'Trẻ em (<20 tuổi)',
    importPrice: 120000,
    sellingPrice: 195000,
    status: 'Đã hết'
  },
  {
    id: 'VAC-004',
    name: 'Phòng bệnh uốn ván - TETAVAX',
    code: 'TETAVAX',
    receivedDate: '2026-01-20',
    expiryDate: '2027-01-20',
    licenseNo: '4/1/2015',
    origin: 'Pháp',
    dosage: '0.5 ml',
    stock: 250,
    tempRange: '2°C - 8°C',
    ageGroup: 'Mọi lứa tuổi',
    importPrice: 90000,
    sellingPrice: 180000,
    status: 'Sẵn có'
  },
  {
    id: 'VAC-005',
    name: 'Phòng bệnh sởi - TRIMOVAX',
    code: 'TRIMOVAX',
    receivedDate: '2026-03-05',
    expiryDate: '2027-03-05',
    licenseNo: '5/1/2015',
    origin: 'Pháp',
    dosage: '0.5 ml',
    stock: 120,
    tempRange: '2°C - 8°C',
    ageGroup: 'Trẻ em > 9 tháng tuổi',
    importPrice: 151000,
    sellingPrice: 280000,
    status: 'Sẵn có'
  },
  {
    id: 'VAC-006',
    name: 'Báo 6 trong 1 - Infanrix Hexa',
    code: 'INFANRIX HEXA',
    receivedDate: '2026-04-12',
    expiryDate: '2027-10-12',
    licenseNo: '12/5/2018',
    origin: 'Bỉ',
    dosage: '0.5 ml',
    stock: 350,
    tempRange: '2°C - 8°C',
    ageGroup: 'Trẻ từ 2 tháng đến 2 tuổi',
    importPrice: 650000,
    sellingPrice: 1010000,
    status: 'Sẵn có'
  }
];

export const initialPatients: Patient[] = [
  {
    id: 'BN-2023-001',
    fullName: 'Nguyễn Văn A',
    gender: 'Nam',
    dob: '2025-06-15',
    guardianName: 'Nguyễn Văn B',
    address: 'Hải Châu, Đà Nẵng',
    phone: '0903999999',
    history: [
      {
        id: 'H-001',
        vaccineName: 'Phòng Viêm gan B - ENGERIX B 0.5ml',
        date: '2026-02-10',
        sideEffect: 'Bình thường (sốt nhẹ biến mất sau 12h)',
        nextDose: 'BCG (Đã hẹn)',
        doctorName: 'Dr. Hoàng Quốc Việt'
      }
    ]
  },
  {
    id: 'BN-2023-002',
    fullName: 'Lê Hoàng Minh',
    gender: 'Nam',
    dob: '2020-04-12',
    guardianName: 'Lê Hoàng Sơn',
    address: 'Thanh Xuân, Hà Nội',
    phone: '0912445566',
    history: [
      {
        id: 'H-002',
        vaccineName: 'Bầu 6 trong 1 - Infanrix Hexa',
        date: '2025-11-15',
        sideEffect: 'Mẩn đỏ nhẹ ở vết tiêm (hết sau 24h)',
        nextDose: 'TETAVAX',
        doctorName: 'Dr. Nguyễn Văn Long'
      },
      {
        id: 'H-003',
        vaccineName: 'Phòng bệnh sởi - TRIMOVAX',
        date: '2026-03-20',
        sideEffect: 'Bình thường',
        nextDose: 'Không có chỉ định cụ thể',
        doctorName: 'Dr. Hoàng Quốc Việt'
      }
    ]
  },
  {
    id: 'BN-2023-003',
    fullName: 'Phạm Thị Thùy Dung',
    gender: 'Nữ',
    dob: '1998-05-24',
    guardianName: 'Tự biên',
    address: 'Quận 1, TP. Hồ Chí Minh',
    phone: '0933445566',
    history: []
  }
];

export const initialAppointments: Appointment[] = [
  {
    id: 'L-001',
    patientName: 'Nguyễn Thị A',
    patientPhone: '0903123456',
    patientDob: '1995-08-14',
    vaccineId: 'VAC-004',
    vaccineName: 'Phòng bệnh uốn ván - TETAVAX',
    date: '2026-06-18',
    timeSlot: '08:00 - 09:30',
    branch: 'Cơ sở 1 - Hải Châu, Đà Nẵng',
    status: 'Chờ xác nhận',
    healthDeclaration: 'Sức khỏe bình thường, không dị ứng thành phần vaccine'
  },
  {
    id: 'L-002',
    patientName: 'Trần Minh Tiến',
    patientPhone: '0988675432',
    patientDob: '2023-11-12',
    vaccineId: 'VAC-001',
    vaccineName: 'Phòng bệnh lao - BCG',
    date: '2026-06-20',
    timeSlot: '10:00 - 11:30',
    branch: 'Cơ sở 2 - Cầu Giấy, Hà Nội',
    status: 'Đã duyệt',
    healthDeclaration: 'Bé nặng 6kg, bú khỏe, không sốt'
  },
  {
    id: 'L-003',
    patientName: 'Phan Bảo Trâm',
    patientPhone: '0977112233',
    patientDob: '2025-01-20',
    vaccineId: 'VAC-006',
    vaccineName: 'Báo 6 trong 1 - Infanrix Hexa',
    date: '2026-06-15',
    timeSlot: '14:00 - 15:30',
    branch: 'Cơ sở 3 - Quận 3, TP. HCM',
    status: 'Đã tiêm',
    healthDeclaration: 'Khỏe mạnh, đã tắm rửa sạch sẽ'
  }
];

export const initialTickets: SupportTicket[] = [
  {
    id: 'TK-001',
    customerName: 'Nguyễn Thị Hoa',
    phone: '0905667788',
    rating: 5,
    comments: 'Dịch vụ rất chu đáo. Bác sĩ tư vấn kỹ và tiêm cực êm, bé không khóc tí nào luôn.',
    status: 'Đã giải quyết',
    responseText: 'Cám ơn chị đã tin tưởng MediFlow Pro. Chúc bé luôn khỏe mạnh và hay ăn chóng lớn!',
    date: '2026-06-14'
  },
  {
    id: 'TK-002',
    customerName: 'Đặng Quốc Bảo',
    phone: '0913998877',
    rating: 3,
    comments: 'Vaccine 6-trong-1 hết hàng ở chi nhánh Quận 3 mà không thông báo trên web rõ ràng. Tôi cất công đưa cháu tới rồi lại phải về.',
    status: 'Mới',
    date: '2026-06-15'
  },
  {
    id: 'TK-003',
    customerName: 'Vũ Hoàng Nam',
    phone: '0935123123',
    rating: 4,
    comments: 'Cho hỏi vaccine phòng cúm người lớn bao giờ có hàng đợt mới vậy ạ?',
    status: 'Đang xử lý',
    responseText: 'Chào anh, dự kiến ngày 20/06 sẽ có đợt thuốc cúm mới, anh đón theo dõi hoặc đăng ký đặt trước nhé.',
    date: '2026-06-16'
  }
];

export const initialFAQs: FAQ[] = [
  {
    id: 'FAQ-001',
    question: 'Tiêm vắc-xin có sốt không?',
    answer: 'Thông thường, sau khi tiêm vắc-xin, trẻ có thể bị sốt nhẹ (dưới 38.5 độ C). Đây là phản ứng miễn dịch sinh lý tự nhiên cho thấy cơ thể đang tương tác tốt với vắc-xin nhằm tạo ra kháng thể bảo vệ. Sốt thường tự khỏi sau 1-2 ngày.\n\nTuy nhiên, nếu trẻ sốt cao trên 38.5 độ C kéo dài trên 48 giờ, hoặc kèm theo các triệu chứng cảnh báo bất thường khác như quấy khóc dồn dập kéo dài, bỏ bú, co giật, thở dốc... phụ huynh cần đưa bé đến ngay cơ sở y tế gần nhất.',
    updatedAt: '2026-06-10'
  },
  {
    id: 'FAQ-002',
    question: 'Sau khi tiêm vắc-xin cần phải kiêng kị những gì?',
    answer: 'Sau tiêm chủng, cần chú ý theo dõi bé 30 phút tại điểm tiêm và ít nhất 24 giờ tiếp theo tại nhà. Về vấn đề dinh dưỡng:\n- KHÔNG đắp bất kì bài thuốc dân gian (khoai tây, lát chanh, lá cây) đè trực tiếp lên vết tiêm để phòng tránh nhiễm trùng.\n- Giữ vết tiêm khô thoáng sạch sẽ.\n- Cho trẻ mặc quần áo thoáng rộng, dễ thấm mồ hôi.\n- Cho bú sữa mẹ hoặc bổ sung nhiều nước lọc đối với người lớn để tránh mất nước.',
    updatedAt: '2026-06-11'
  },
  {
    id: 'FAQ-003',
    question: 'Lịch tiêm phòng cho trẻ sơ sinh bắt đầu như thế nào?',
    answer: 'Đợt tiêm đầu đời khởi động ngay trong vòng 24 giờ đầu sau sinh với vắc-xin phòng Viêm gan B sơ sinh đầu tiên và tiếp nối bằng vắc-xin phòng bệnh Lao (BCG) trong vòng 30 ngày tuổi đầu đời.\n\nSau đó từ tháng thứ 2 trở đi, bé sẽ bắt đầu các mốc vắc-xin quan trọng như vắc-xin phối hợp 6-trong-1 hoặc 5-trong-1, vắc-xin chống virus Rota gây tiêu chảy cấp, vắc-xin phòng viêm phổi do phế cầu khuẩn,...',
    updatedAt: '2026-06-13'
  },
  {
    id: 'FAQ-004',
    question: 'Phụ nữ mang thai có được tiêm phòng cúm không?',
    answer: 'Có, vắc-xin cúm bất hoạt là an toàn và được khuyến cáo mạnh mẽ tiêm cho phụ nữ đang trong thai kỳ. Việc này giúp bảo vệ người mẹ khỏi biến chứng nặng của cúm và truyền kháng thể miễn dịch sang để bảo vệ trẻ sơ sinh cực kỳ tối ưu trong những tháng đầu đời chưa đủ tuổi tiêm chủng.',
    updatedAt: '2026-06-14'
  }
];

export const initialInvoices: Invoice[] = [
  {
    id: 'INV-001',
    invoiceNo: 'HD-1040',
    customerName: 'Lê Hoàng Sơn',
    phone: '0912445566',
    vaccineName: 'Phòng bệnh sởi - TRIMOVAX',
    totalAmount: 280000,
    status: 'Đã thanh toán',
    date: '2026-06-15'
  },
  {
    id: 'INV-002',
    invoiceNo: 'HD-1041',
    customerName: 'Nguyễn Thị A',
    phone: '0903123456',
    vaccineName: 'Phòng bệnh uốn ván - TETAVAX',
    totalAmount: 180000,
    status: 'Chờ thanh toán',
    date: '2026-06-16'
  },
  {
    id: 'INV-003',
    invoiceNo: 'HD-1042',
    customerName: 'Phạm Thị Thùy Dung',
    phone: '0933445566',
    vaccineName: 'Báo 6 trong 1 - Infanrix Hexa',
    totalAmount: 1010000,
    status: 'Chờ thanh toán',
    date: '2026-06-16'
  },
  {
    id: 'INV-004',
    invoiceNo: 'HD-1043',
    customerName: 'Vũ Hoàng Nam',
    phone: '0935123123',
    vaccineName: 'Phòng bệnh lao - BCG',
    totalAmount: 150000,
    status: 'Đã thanh toán',
    date: '2026-06-14'
  }
];

export const initialSystemLogs: SystemLog[] = [
  { id: 'LOG-001', time: '2026-06-16 07:15:30', handler: 'System', action: 'Chạy hệ thống', details: 'Hệ thống clinical đã khởi dộng thành công trên môi trường Clour Run.' },
  { id: 'LOG-002', time: '2026-06-16 07:45:12', handler: 'Phạm Hải Đăng (Admin)', action: 'Xem Log Hệ Thống', details: 'Truy cập tab audit logs hệ thống.' },
  { id: 'LOG-003', time: '2026-06-16 07:55:04', handler: 'Trần Thị Mỹ Linh (Kho)', action: 'Kiểm kho vắc-xin', details: 'Check số lượng vắc-xin ENGERIX B có dấu hiệu sắp hết.' }
];

export const initialStockLogs: StockLog[] = [
  { id: 'SL-001', vaccineName: 'Phòng bệnh uốn ván - TETAVAX', quantity: 100, type: 'Nhập kho', date: '2026-05-10', handler: 'Trần Thị Mỹ Linh', notes: 'Nhập bổ sung từ nhà đại lý Sanofi' },
  { id: 'SL-002', vaccineName: 'Báo 6 trong 1 - Infanrix Hexa', quantity: 5, type: 'Xuất kho', date: '2026-06-14', handler: 'Trần Thị Mỹ Linh', notes: 'Xuất cấp cứu tiêm chủng hàng ngày cơ sở 3' }
];
