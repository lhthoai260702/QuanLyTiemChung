package com.vaccine.qltiemchungbackend.controller;

import com.vaccine.qltiemchungbackend.dto.BenhNhanDTO;
import com.vaccine.qltiemchungbackend.dto.KeDonRequestDTO;
import com.vaccine.qltiemchungbackend.dto.VacXinBasicDTO;
import com.vaccine.qltiemchungbackend.entity.BenhNhan;
import com.vaccine.qltiemchungbackend.entity.ChiTietDkTiem;
import com.vaccine.qltiemchungbackend.entity.LoVacXin;
import com.vaccine.qltiemchungbackend.repository.BenhNhanRepository;
import com.vaccine.qltiemchungbackend.repository.ChiTietDkTiemRepository;
import com.vaccine.qltiemchungbackend.repository.LoVacXinRepository;
import com.vaccine.qltiemchungbackend.repository.VacXinRepository;
import com.vaccine.qltiemchungbackend.service.BenhNhanService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

/**
 * MedicalController
 * * Version 1.0
 * * Date: 03-07-2026
 * * Copyright
 * * Modification Logs:
 * DATE       AUTHOR    DESCRIPTION
 * -----------------------------------------------------------------------
 * 03-07-2026 lhthoai   Create
 */
@RestController
@RequestMapping("/api/medical")
public class MedicalController {

    @Autowired
    private BenhNhanService benhNhanService;

    @Autowired
    private VacXinRepository vacXinRepository;

    @Autowired
    private LoVacXinRepository loVacXinRepository;

    @Autowired
    private ChiTietDkTiemRepository chiTietDkTiemRepository;

    @Autowired
    private BenhNhanRepository benhNhanRepository;

    /**
     * Lấy danh sách toàn bộ bệnh nhân
     *
     * @return List<BenhNhanDTO>
     */
    @GetMapping("/patients")
    public List<BenhNhanDTO> getAllPatients() {
        return benhNhanService.getAllPatients();
    }

    /**
     * Cập nhật thông tin hồ sơ bệnh nhân
     *
     * @param id  mã bệnh nhân
     * @param dto dữ liệu bệnh nhân cần cập nhật
     * @return ResponseEntity<String>
     */
    @PutMapping("/patients/{id}")
    public ResponseEntity<String> updatePatient(@PathVariable Long id, @RequestBody BenhNhanDTO dto) {
        try {
            benhNhanService.updatePatient(id, dto);
            return ResponseEntity.ok("Cập nhật hồ sơ thành công!");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Lỗi: " + e.getMessage());
        }
    }

    /**
     * Lấy danh sách vắc-xin khả dụng để hiển thị trên ComboBox
     *
     * @return List<VacXinBasicDTO>
     */
    @GetMapping("/vaccines")
    public List<VacXinBasicDTO> getVaccinesForCombobox() {
        return vacXinRepository.findAllAvailable().stream().map(v -> {
            VacXinBasicDTO dto = new VacXinBasicDTO();
            dto.setId(v.getMaVacXin());
            dto.setName(v.getTenVacXin());
            return dto;
        }).collect(Collectors.toList());
    }

    /**
     * Xử lý quá trình bác sĩ kê đơn vắc-xin và lưu lịch tiêm vào cơ sở dữ liệu
     *
     * @param req thông tin yêu cầu kê đơn
     * @return ResponseEntity<String>
     */
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

    /**
     * Xóa bản ghi lịch sử tiêm chủng của bệnh nhân
     *
     * @param recordId mã bản ghi lịch sử
     * @return ResponseEntity<String>
     */
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