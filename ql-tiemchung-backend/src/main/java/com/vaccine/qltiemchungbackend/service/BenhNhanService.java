package com.vaccine.qltiemchungbackend.service;

import com.vaccine.qltiemchungbackend.dto.BenhNhanDTO;
import com.vaccine.qltiemchungbackend.dto.LichSuTiemDTO;
import com.vaccine.qltiemchungbackend.dto.LichSuTiemProjection;
import com.vaccine.qltiemchungbackend.entity.BenhNhan;
import com.vaccine.qltiemchungbackend.entity.ChiTietDkTiem;
import com.vaccine.qltiemchungbackend.entity.HoSoBenhAn;
import com.vaccine.qltiemchungbackend.repository.BenhNhanRepository;
import com.vaccine.qltiemchungbackend.repository.ChiTietDkTiemRepository;
import com.vaccine.qltiemchungbackend.repository.HoSoBenhAnRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.Period;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class BenhNhanService {
    @Autowired private BenhNhanRepository repository;
    @Autowired private ChiTietDkTiemRepository chiTietDkTiemRepository;
    @Autowired private HoSoBenhAnRepository hoSoBenhAnRepository;

    public List<BenhNhanDTO> getAllPatients() {
        return repository.findByFlagDeleteFalseOrFlagDeleteIsNull().stream().map(bn -> {
            BenhNhanDTO dto = new BenhNhanDTO();
            dto.setId(String.valueOf(bn.getMaBenhNhan()));
            dto.setFullName(bn.getTenBenhNhan());
            dto.setDob(bn.getNgaySinh() != null ? bn.getNgaySinh().toString() : "");
            dto.setGender(bn.getGioiTinh());
            dto.setAddress(bn.getDiaChi());
            dto.setGuardianName(bn.getNguoiGiamHo());
            dto.setPhone(bn.getSdt());
            dto.setAge(bn.getNgaySinh() != null ? Period.between(bn.getNgaySinh(), LocalDate.now()).getYears() : 0);

            // Mapping từ Projection sang DTO cho Lịch sử tiêm
            List<LichSuTiemProjection> projections = repository.findLichSuTiemByMaBenhNhan(bn.getMaBenhNhan());
            List<LichSuTiemDTO> historyList = projections.stream().map(p -> {
                LichSuTiemDTO h = new LichSuTiemDTO();
                h.setRecordId(p.getRecordId());
                h.setVaccineName(p.getVaccineName());
                h.setDate(p.getDate());
                h.setSideEffect(p.getSideEffect());
                h.setNextDose(p.getNextDose());
                return h;
            }).collect(Collectors.toList());

            dto.setHistory(historyList);
            return dto;
        }).collect(Collectors.toList());
    }

    public void updatePatient(Long id, BenhNhanDTO dto) {
        // 1. Cập nhật thông tin cá nhân (Bảng BENHNHAN)
        BenhNhan bn = repository.findById(id).orElseThrow(() -> new RuntimeException("Không tìm thấy bệnh nhân"));
        bn.setTenBenhNhan(dto.getFullName());
        bn.setGioiTinh(dto.getGender());
        bn.setDiaChi(dto.getAddress());
        bn.setNguoiGiamHo(dto.getGuardianName());
        bn.setSdt(dto.getPhone() != null ? dto.getPhone().replace(" ", "") : "");

        if (dto.getAge() != null && dto.getAge() > 0) {
            int birthYear = LocalDate.now().getYear() - dto.getAge();
            bn.setNgaySinh(LocalDate.of(birthYear, 1, 1));
        }
        repository.save(bn);

        // 2. Cập nhật thông tin Lịch sử tiêm (Bảng CHITIET_DK_TIEM & HOSOBENHAN)
        if (dto.getHistory() != null && !dto.getHistory().isEmpty()) {
            for (LichSuTiemDTO hist : dto.getHistory()) {
                if (hist.getRecordId() != null) {
                    chiTietDkTiemRepository.findById(hist.getRecordId()).ifPresent(ct -> {
                        // Cập nhật Ngày Tiêm / Lịch Hẹn
                        if (hist.getDate() != null && !hist.getDate().isEmpty()) {
                            ct.setThoiGianCanTiem(LocalDate.parse(hist.getDate()));
                            chiTietDkTiemRepository.save(ct);
                        }

                        // Cập nhật Phản ứng sau tiêm (Nếu có nhập thì tạo hoặc update HoSoBenhAn)
                        if (hist.getSideEffect() != null && !hist.getSideEffect().trim().isEmpty()) {
                            HoSoBenhAn hs = hoSoBenhAnRepository.findByMaChiTietDkTiem(ct.getMaChiTietDkTiem())
                                    .orElse(new HoSoBenhAn()); // Nếu chưa có thì tạo mới
                            hs.setChiTietDkTiem(ct);
                            hs.setPhanUngSauTiem(hist.getSideEffect());
                            if (hist.getDate() != null && !hist.getDate().isEmpty()) {
                                hs.setThoiGianTiem(LocalDate.parse(hist.getDate()));
                            }
                            hoSoBenhAnRepository.save(hs);
                        }
                    });
                }
            }
        }
    }

    public void deleteHistoryRecord(Long recordId) {
        // 1. Xóa mềm bên bảng ChiTietDkTiem
        ChiTietDkTiem ct = chiTietDkTiemRepository.findById(recordId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy bản ghi lịch sử với ID: " + recordId));
        ct.setFlagDelete(true);
        chiTietDkTiemRepository.save(ct);

        // 2. Xóa mềm bên bảng HoSoBenhAn (Nếu đã có)
        hoSoBenhAnRepository.findByMaChiTietDkTiem(recordId).ifPresent(hs -> {
            hs.setFlagDelete(true);
            hoSoBenhAnRepository.save(hs);
        });
    }

    public BenhNhanDTO getPatientById(Long id) {
        BenhNhan bn = repository.findById(id).orElseThrow(() -> new RuntimeException("Không tìm thấy bệnh nhân"));
        BenhNhanDTO dto = new BenhNhanDTO();
        dto.setId(String.valueOf(bn.getMaBenhNhan()));
        dto.setFullName(bn.getTenBenhNhan());
        dto.setDob(bn.getNgaySinh() != null ? bn.getNgaySinh().toString() : "");
        dto.setGender(bn.getGioiTinh());
        dto.setAddress(bn.getDiaChi());
        dto.setGuardianName(bn.getNguoiGiamHo());
        dto.setPhone(bn.getSdt());
        dto.setAge(bn.getNgaySinh() != null ? Period.between(bn.getNgaySinh(), LocalDate.now()).getYears() : 0);

        // Lấy lịch sử tiêm
        List<LichSuTiemProjection> projections = repository.findLichSuTiemByMaBenhNhan(bn.getMaBenhNhan());
        List<LichSuTiemDTO> historyList = projections.stream().map(p -> {
            LichSuTiemDTO h = new LichSuTiemDTO();
            h.setRecordId(p.getRecordId());
            h.setVaccineName(p.getVaccineName());
            h.setDate(p.getDate());
            h.setSideEffect(p.getSideEffect());
            h.setNextDose(p.getNextDose());
            h.setPlace(p.getPlace());
            h.setVaccineType(p.getVaccineType());
            h.setDosage(p.getDosage());
            return h;
        }).collect(Collectors.toList());

        dto.setHistory(historyList);
        return dto;
    }
}