/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type Role = 'Admin' | 'Inventory' | 'Medical' | 'Customer' | 'Support' | 'Finance';

export interface UserAccount {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  role: Role;
  status: 'Hoạt động' | 'Bị khóa';
  createdAt: string;
}

export interface Vaccine {
  id: string;
  name: string;
  code: string;
  receivedDate: string;
  expiryDate: string;
  licenseNo: string;
  origin: string;
  dosage: string;
  stock: number;
  tempRange: string;
  ageGroup: string;
  importPrice: number;
  sellingPrice: number;
  status: 'Sẵn có' | 'Đã hết' | 'Sắp hết';
}

export interface StockLog {
  id: string;
  vaccineName: string;
  quantity: number;
  type: 'Nhập kho' | 'Xuất kho';
  date: string;
  handler: string;
  notes: string;
}

export interface VaccineHistoryItem {
  id: string;
  vaccineName: string;
  date: string;
  sideEffect: string;
  nextDose: string;
  doctorName: string;
}

export interface Patient {
  id: string; // e.g. BN-2023-001
  fullName: string;
  gender: 'Nam' | 'Nữ';
  dob: string;
  guardianName: string;
  address: string;
  phone: string;
  history: VaccineHistoryItem[];
}

export interface Appointment {
  id: string;
  patientName: string;
  patientPhone: string;
  patientDob: string;
  vaccineId: string;
  vaccineName: string;
  date: string;
  timeSlot: string;
  branch: string;
  status: 'Chờ xác nhận' | 'Đã duyệt' | 'Đã tiêm' | 'Hủy lịch';
  healthDeclaration?: string;
}

export interface SupportTicket {
  id: string;
  customerName: string;
  phone: string;
  rating: number;
  comments: string;
  status: 'Mới' | 'Đang xử lý' | 'Đã giải quyết';
  responseText?: string;
  date: string;
}

export interface FAQ {
  id: string;
  question: string;
  answer: string;
  updatedAt: string;
}

export interface Invoice {
  id: string;
  invoiceNo: string;
  customerName: string;
  phone: string;
  vaccineName: string;
  totalAmount: number;
  status: 'Đã thanh toán' | 'Chờ thanh toán' | 'Đã hủy';
  date: string;
}

export interface SystemLog {
  id: string;
  time: string;
  handler: string;
  action: string;
  details: string;
}
