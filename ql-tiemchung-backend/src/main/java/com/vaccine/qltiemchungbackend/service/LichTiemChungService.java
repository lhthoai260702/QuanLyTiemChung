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

            // Gán dữ liệu mã ID
            dto.setMaLoaiVacXin(ltc.getMaLoaiVacXin());
            dto.setMaVacXin(ltc.getMaVacXin());

            // Lấy tên Loại Vắc xin
            if (ltc.getMaLoaiVacXin() != null) {
                loaiVacXinRepository.findById(ltc.getMaLoaiVacXin())
                        .ifPresent(lvx -> dto.setLoaiVacXin(lvx.getTenLoaiVacXin()));
            } else {
                dto.setLoaiVacXin("Chưa xác định");
            }

            // Lấy tên Vắc xin cụ thể
            if (ltc.getMaVacXin() != null) {
                vacXinRepository.findById(ltc.getMaVacXin())
                        .ifPresent(v -> dto.setTenVacXin(v.getTenVacXin()));
            } else {
                dto.setTenVacXin("Chưa có vắc-xin cụ thể");
            }

            dto.setSoLuong(ltc.getSoLuongNguoiTiem());
            dto.setDoTuoi(ltc.getDoiTuong());
            dto.setDiaDiem(ltc.getDiaDiem());
            dto.setGhiChu(ltc.getGhiChu());

            // Lấy danh sách bác sĩ
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

        // Lưu cả Loại và Vắc xin cụ thể
        ltc.setMaLoaiVacXin(dto.getMaLoaiVacXin());
        ltc.setMaVacXin(dto.getMaVacXin());
        ltc.setFlagDelete(false);

        if (dto.getDateInput() != null && !dto.getDateInput().isEmpty()) {
            ltc.setNgayTiem(LocalDate.parse(dto.getDateInput()));
        }

        ltc = lichTiemChungRepository.save(ltc);

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
        LichTiemChung ltc = lichTiemChungRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy lịch tiêm!"));

        ltc.setDoiTuong(dto.getDoTuoi());
        ltc.setThoiGianChung(dto.getThoiGian());
        ltc.setSoLuongNguoiTiem(dto.getSoLuong());
        ltc.setDiaDiem(dto.getDiaDiem());
        ltc.setGhiChu(dto.getGhiChu());

        // Cập nhật lại mã
        ltc.setMaLoaiVacXin(dto.getMaLoaiVacXin());
        ltc.setMaVacXin(dto.getMaVacXin());

        if (dto.getDateInput() != null && !dto.getDateInput().isEmpty()) {
            ltc.setNgayTiem(LocalDate.parse(dto.getDateInput()));
        }

        lichTiemChungRepository.save(ltc);
        lichTiemChungRepository.deleteChiTietNhanVienByLichTiem(id);

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
        LichTiemChung ltc = lichTiemChungRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy lịch tiêm!"));
        ltc.setFlagDelete(true);
        lichTiemChungRepository.save(ltc);
    }
}