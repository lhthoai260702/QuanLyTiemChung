package com.vaccine.qltiemchungbackend.controller;

import com.vaccine.qltiemchungbackend.dto.*;
import com.vaccine.qltiemchungbackend.entity.*;
import com.vaccine.qltiemchungbackend.repository.*;
import com.vaccine.qltiemchungbackend.service.BenhNhanService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/medical")
@CrossOrigin(origins = "http://localhost:3000")
public class MedicalController {

    @Autowired private BenhNhanService benhNhanService;
    @Autowired private VacXinRepository vacXinRepository;
    @Autowired private LoVacXinRepository loVacXinRepository;
    @Autowired private ChiTietDkTiemRepository chiTietDkTiemRepository;
    @Autowired private BenhNhanRepository benhNhanRepository;

    @GetMapping("/patients")
    public List<BenhNhanDTO> getAllPatients() { return benhNhanService.getAllPatients(); }

    @PutMapping("/patients/{id}")
    public ResponseEntity<String> updatePatient(@PathVariable Long id, @RequestBody BenhNhanDTO dto) {
        try { benhNhanService.updatePatient(id, dto); return ResponseEntity.ok("Cập nhật hồ sơ thành công!"); }
        catch (Exception e) { return ResponseEntity.badRequest().body("Lỗi: " + e.getMessage()); }
    }

    // --- API MỚI: LẤY DANH SÁCH VẮC XIN ĐỂ ĐƯỢC VÀO COMBOBOX ---
    @GetMapping("/vaccines")
    public List<VacXinBasicDTO> getVaccinesForCombobox() {
        return vacXinRepository.findAllAvailable().stream().map(v -> {
            VacXinBasicDTO dto = new VacXinBasicDTO();
            dto.setId(v.getMaVacXin());
            dto.setName(v.getTenVacXin());
            return dto;
        }).collect(Collectors.toList());
    }

    // --- API MỚI: KÊ ĐƠN VÀ LƯU VÀO DB ---
    @PostMapping("/prescribe")
    public ResponseEntity<String> prescribeVaccine(@RequestBody KeDonRequestDTO req) {
        try {
            // 1. Tìm bệnh nhân
            BenhNhan bn = benhNhanRepository.findById(req.getPatientId())
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy bệnh nhân!"));

            // 2. Tự động tìm Lô Vắc xin còn khả dụng cho loại vắc xin bác sĩ chọn
            LoVacXin loVacXin = loVacXinRepository.findAvailableLotByVaccineId(req.getVaccineId())
                    .orElseThrow(() -> new RuntimeException("Vắc xin này hiện đã hết hàng trong kho hoặc không có lô nào khả dụng!"));

            // 3. Tạo chi tiết đăng ký tiêm (Hẹn lịch)
            ChiTietDkTiem chiTiet = new ChiTietDkTiem();
            chiTiet.setBenhNhan(bn);
            chiTiet.setMaLo(loVacXin.getMaLo()); // Lưu MaLo vào DB
            chiTiet.setThoiGianCanTiem(req.getDate());

            chiTietDkTiemRepository.save(chiTiet);

            return ResponseEntity.ok("Kê đơn và lên lịch thành công!");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @DeleteMapping("/history/{recordId}")
    public ResponseEntity<String> deleteHistoryRecord(@PathVariable Long recordId) {
        try {
            benhNhanService.deleteHistoryRecord(recordId);
            return ResponseEntity.ok("Đã xóa lịch sử tiêm thành công!");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Lỗi: " + e.getMessage());
        }
    }
}