package com.vaccine.qltiemchungbackend.service;

import com.vaccine.qltiemchungbackend.dto.LichTiemChungDTO;
import com.vaccine.qltiemchungbackend.entity.LichTiemChung;
import com.vaccine.qltiemchungbackend.repository.LichTiemChungRepository;
import com.vaccine.qltiemchungbackend.repository.LoaiVacXinRepository;
import com.vaccine.qltiemchungbackend.repository.VacXinRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class LichTiemChungService {

    @Autowired
    private LichTiemChungRepository lichTiemChungRepository;

    @Autowired
    private LoaiVacXinRepository loaiVacXinRepository;

    @Autowired
    private VacXinRepository vacXinRepository;

    public List<LichTiemChungDTO> getAllSchedules() {
        return lichTiemChungRepository.findByFlagDeleteFalseOrFlagDeleteIsNull().stream().map(ltc -> {
            LichTiemChungDTO dto = new LichTiemChungDTO();
            dto.setMaLichTiem("LTC" + String.format("%03d", ltc.getMaLichTiem()));

            if (ltc.getNgayTiem() != null) {
                LocalDate date = ltc.getNgayTiem();
                dto.setNgay(String.format("%02d", date.getDayOfMonth()));
                dto.setThang(String.format("%02d", date.getMonthValue()));
                dto.setNam(String.valueOf(date.getYear()));
            }

            dto.setThoiGian(ltc.getThoiGianChung());

            // Kéo ID từ Database ra DTO
            dto.setMaLoaiVacXin(ltc.getMaLoaiVacXin());

            // Truy vấn lấy Tên Loại Vắc Xin để hiển thị ra màn hình Frontend
            if (ltc.getMaLoaiVacXin() != null) {
                loaiVacXinRepository.findById(ltc.getMaLoaiVacXin())
                        .ifPresent(lvx -> dto.setLoaiVacXin(lvx.getTenLoaiVacXin()));

                // LẤY THÊM TÊN & MÃ VẮC-XIN CỤ THỂ THUỘC LOẠI NÀY
                List<com.vaccine.qltiemchungbackend.entity.VacXin> dsVacXin = vacXinRepository.findByLoaiVacXinId(ltc.getMaLoaiVacXin());
                if (!dsVacXin.isEmpty()) {
                    String dsTen = dsVacXin.stream()
                            .map(com.vaccine.qltiemchungbackend.entity.VacXin::getTenVacXin)
                            .collect(Collectors.joining(", "));
                    dto.setTenVacXin(dsTen);
                    dto.setMaVacXin(dsVacXin.get(0).getMaVacXin()); // Gắn tạm ID đầu tiên để hỗ trợ tính năng Đăng ký
                } else {
                    dto.setTenVacXin("Chưa có vắc-xin cụ thể");
                }
            } else {
                dto.setLoaiVacXin("Chưa xác định");
                dto.setTenVacXin("Chưa xác định");
            }

            dto.setSoLuong(ltc.getSoLuongNguoiTiem());
            dto.setDoTuoi(ltc.getDoiTuong());
            dto.setDiaDiem(ltc.getDiaDiem());
            dto.setGhiChu(ltc.getGhiChu());

            // Kéo danh sách bác sĩ từ bảng trung gian lên
            dto.setDanhSachBacSi(lichTiemChungRepository.findDanhSachBacSiByLichTiem(ltc.getMaLichTiem()));

            dto.setFlagDelete(ltc.getFlagDelete());
            return dto;
        }).collect(Collectors.toList());
    }

    @Transactional
    public void createSchedule(LichTiemChungDTO dto) {
        LichTiemChung ltc = new LichTiemChung();
        ltc.setDoiTuong(dto.getDoTuoi());
        ltc.setThoiGianChung(dto.getThoiGian());
        ltc.setSoLuongNguoiTiem(dto.getSoLuong());
        ltc.setDiaDiem(dto.getDiaDiem());
        ltc.setGhiChu(dto.getGhiChu());

        // Nhận ID từ Frontend và lưu xuống Database
        ltc.setMaLoaiVacXin(dto.getMaLoaiVacXin());

        ltc.setFlagDelete(false);

        if (dto.getDateInput() != null && !dto.getDateInput().isEmpty()) {
            ltc.setNgayTiem(LocalDate.parse(dto.getDateInput()));
        }

        // Lưu bảng chính trước để sinh ra ID (MaLichTiem)
        ltc = lichTiemChungRepository.save(ltc);

        // Lưu vào bảng phụ (CHITIET_NV_THAMGIA)
        if (dto.getSelectedDoctors() != null && !dto.getSelectedDoctors().isEmpty()) {
            for (String tenBs : dto.getSelectedDoctors()) {
                Long maNv = lichTiemChungRepository.findMaNhanVienByTen(tenBs);
                if (maNv != null) {
                    lichTiemChungRepository.insertChiTietNhanVien(maNv, ltc.getMaLichTiem());
                }
            }
        }
    }

    @Transactional
    public void updateSchedule(Long id, LichTiemChungDTO dto) {
        // Tìm lịch tiêm hiện tại
        LichTiemChung ltc = lichTiemChungRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy lịch tiêm!"));

        // Cập nhật thông tin
        ltc.setDoiTuong(dto.getDoTuoi());
        ltc.setThoiGianChung(dto.getThoiGian());
        ltc.setSoLuongNguoiTiem(dto.getSoLuong());
        ltc.setDiaDiem(dto.getDiaDiem());
        ltc.setGhiChu(dto.getGhiChu());

        // Cập nhật lại ID loại Vắc-xin từ Form
        ltc.setMaLoaiVacXin(dto.getMaLoaiVacXin());

        if (dto.getDateInput() != null && !dto.getDateInput().isEmpty()) {
            ltc.setNgayTiem(LocalDate.parse(dto.getDateInput()));
        }

        lichTiemChungRepository.save(ltc);

        // Xóa danh sách bác sĩ phân công cũ
        lichTiemChungRepository.deleteChiTietNhanVienByLichTiem(id);

        // Thêm danh sách bác sĩ phân công mới
        if (dto.getSelectedDoctors() != null && !dto.getSelectedDoctors().isEmpty()) {
            for (String tenBs : dto.getSelectedDoctors()) {
                Long maNv = lichTiemChungRepository.findMaNhanVienByTen(tenBs);
                if (maNv != null) {
                    lichTiemChungRepository.insertChiTietNhanVien(maNv, ltc.getMaLichTiem());
                }
            }
        }
    }

    public void deleteSchedule(Long id) {
        // Cập nhật cờ flagDelete thành true (Xóa mềm)
        LichTiemChung ltc = lichTiemChungRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy lịch tiêm!"));
        ltc.setFlagDelete(true);
        lichTiemChungRepository.save(ltc);
    }
}