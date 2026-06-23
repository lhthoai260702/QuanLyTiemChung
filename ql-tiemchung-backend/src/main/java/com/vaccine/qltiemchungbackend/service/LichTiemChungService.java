package com.vaccine.qltiemchungbackend.service;

import com.vaccine.qltiemchungbackend.dto.LichTiemChungDTO;
import com.vaccine.qltiemchungbackend.entity.LichTiemChung;
import com.vaccine.qltiemchungbackend.repository.LichTiemChungRepository;
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
            dto.setLoaiVacXin(ltc.getLoaiVacXin());
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
        ltc.setLoaiVacXin(dto.getLoaiVacXin());
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
        ltc.setLoaiVacXin(dto.getLoaiVacXin());

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