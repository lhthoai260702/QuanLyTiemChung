package com.vaccine.qltiemchungbackend.service;

import com.vaccine.qltiemchungbackend.dto.BenhNhanDTO;
import com.vaccine.qltiemchungbackend.dto.LichSuTiemDTO;
import com.vaccine.qltiemchungbackend.dto.LichSuTiemProjection;
import com.vaccine.qltiemchungbackend.entity.*;
import com.vaccine.qltiemchungbackend.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.Period;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class BenhNhanService {
    @Autowired
    private BenhNhanRepository repository;
    @Autowired
    private ChiTietDkTiemRepository chiTietDkTiemRepository;
    @Autowired
    private HoSoBenhAnRepository hoSoBenhAnRepository;
    @Autowired
    private HoaDonRepository hoaDonRepository;
    @Autowired
    private LoVacXinRepository loVacXinRepository;
    @Autowired
    private TaiKhoanRepository taiKhoanRepository;
    @Autowired
    private PasswordEncoder passwordEncoder;

    public BenhNhanDTO getPatientByUsername(String username) {
        BenhNhan bn = repository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy hồ sơ bệnh nhân"));
        return getPatientById(bn.getMaBenhNhan());
    }

    @Transactional
    public void updatePatientByUsername(String username, BenhNhanDTO dto) {
        BenhNhan bn = repository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy hồ sơ bệnh nhân"));
        updatePatient(bn.getMaBenhNhan(), dto);
    }

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

            if (bn.getMaTaiKhoan() != null) {
                taiKhoanRepository.findById(bn.getMaTaiKhoan()).ifPresent(tk -> {
                    dto.setCmnd(tk.getCmnd());
                    dto.setEmail(tk.getEmail());
                });
            }

            // --- BỔ SUNG BẮT ĐẦU TỪ ĐÂY: GẮN LỊCH SỬ TIÊM VÀO DANH SÁCH ---
            List<LichSuTiemProjection> projections = repository.findLichSuTiemByMaBenhNhan(bn.getMaBenhNhan());
            List<LichSuTiemDTO> historyList = projections.stream().map(p -> {
                LichSuTiemDTO h = new LichSuTiemDTO();
                h.setRecordId(p.getRecordId());
                h.setVaccineName(p.getVaccineName());
                h.setDate(p.getDate());
                h.setTime(p.getTime());
                h.setSideEffect(p.getSideEffect());
                h.setThoiGianTacDung(p.getThoiGianTacDung());
                h.setStatus(p.getStatus());
                h.setPlace(p.getPlace());
                h.setVaccineType(p.getVaccineType());
                h.setDosage(p.getDosage());
                h.setGhiChu(p.getGhiChu());
                return h;
            }).collect(Collectors.toList());

            dto.setHistory(historyList);
            // --- KẾT THÚC BỔ SUNG ---

            return dto;
        }).collect(Collectors.toList());
    }

    public void updatePatient(Long id, BenhNhanDTO dto) {
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

        if (bn.getMaTaiKhoan() != null) {
            taiKhoanRepository.findById(bn.getMaTaiKhoan()).ifPresent(tk -> {
                tk.setCmnd(dto.getCmnd());
                tk.setEmail(dto.getEmail());
                if (dto.getMatKhau() != null && !dto.getMatKhau().isEmpty()) {
                    tk.setMatKhau(passwordEncoder.encode(dto.getMatKhau()));
                }
                taiKhoanRepository.save(tk);
            });
        }
    }

    @Transactional
    public void updateHistoryRecord(Long recordId, LichSuTiemDTO dto) {
        ChiTietDkTiem ct = chiTietDkTiemRepository.findById(recordId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy bản ghi lịch sử với ID: " + recordId));

        // Kiểm tra xem bản ghi đã được tiêm (có Hồ sơ bệnh án) chưa
        Optional<HoSoBenhAn> hsbaOpt = hoSoBenhAnRepository.findByMaChiTietDkTiem(recordId);

        if (hsbaOpt.isPresent() || "Đã tiêm".equals(ct.getTrangThai())) {
            // NẾU ĐÃ TIÊM -> CHỈ CẬP NHẬT PHẢN ỨNG SAU TIÊM VÀ THỜI GIAN TÁC DỤNG
            HoSoBenhAn hs = hsbaOpt.orElseThrow(() -> new RuntimeException("Không tìm thấy hồ sơ bệnh án để cập nhật!"));
            hs.setPhanUngSauTiem(dto.getSideEffect());
            hs.setThoiGianTacDung(dto.getThoiGianTacDung());
            hoSoBenhAnRepository.save(hs);
        } else {
            // NẾU CHƯA TIÊM HOẶC BỊ HOÃN -> ĐƯỢC PHÉP CẬP NHẬT TRẠNG THÁI VÀ NGÀY GIỜ
            if (dto.getDate() != null && !dto.getDate().isEmpty()) {
                ct.setThoiGianCanTiem(LocalDate.parse(dto.getDate()));
            }
            ct.setGioTiem(dto.getTime());
            ct.setTrangThai(dto.getStatus());
            chiTietDkTiemRepository.save(ct);

            // NẾU TRẠNG THÁI VỪA CHUYỂN THÀNH "ĐÃ TIÊM" -> TẠO HỒ SƠ BỆNH ÁN & HÓA ĐƠN
            if ("Đã tiêm".equals(dto.getStatus())) {
                HoSoBenhAn hs = new HoSoBenhAn();
                LoVacXin lo = loVacXinRepository.findById(ct.getMaLo()).orElse(null);
                double price = 0.0;
                if (lo != null && lo.getVacXin() != null && lo.getVacXin().getDonGia() != null) {
                    price = lo.getVacXin().getDonGia();
                }

                HoaDon hd = new HoaDon();
                hd.setTongTien(price);
                hd.setFlagDelete(false);
                hd = hoaDonRepository.save(hd);

                hs.setMaHoaDon(hd.getMaHoaDon());
                hs.setChiTietDkTiem(ct);
                hs.setPhanUngSauTiem(dto.getSideEffect());
                hs.setThoiGianTacDung(dto.getThoiGianTacDung());
                if (dto.getDate() != null && !dto.getDate().isEmpty()) {
                    hs.setThoiGianTiem(LocalDate.parse(dto.getDate()));
                }
                hoSoBenhAnRepository.save(hs);
            }
        }
    }

    public void deleteHistoryRecord(Long recordId) {
        ChiTietDkTiem ct = chiTietDkTiemRepository.findById(recordId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy bản ghi lịch sử với ID: " + recordId));
        ct.setFlagDelete(true);
        chiTietDkTiemRepository.save(ct);

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

        if (bn.getMaTaiKhoan() != null) {
            taiKhoanRepository.findById(bn.getMaTaiKhoan()).ifPresent(tk -> {
                dto.setCmnd(tk.getCmnd());
                dto.setEmail(tk.getEmail());
            });
        }

        List<LichSuTiemProjection> projections = repository.findLichSuTiemByMaBenhNhan(bn.getMaBenhNhan());
        List<LichSuTiemDTO> historyList = projections.stream().map(p -> {
            LichSuTiemDTO h = new LichSuTiemDTO();
            h.setRecordId(p.getRecordId());
            h.setVaccineName(p.getVaccineName());
            h.setDate(p.getDate());
            h.setTime(p.getTime());
            h.setSideEffect(p.getSideEffect());
            h.setThoiGianTacDung(p.getThoiGianTacDung());
            h.setStatus(p.getStatus());
            h.setPlace(p.getPlace());
            h.setVaccineType(p.getVaccineType());
            h.setDosage(p.getDosage());
            h.setGhiChu(p.getGhiChu());
            return h;
        }).collect(Collectors.toList());

        dto.setHistory(historyList);
        return dto;
    }
}