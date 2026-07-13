package com.vaccine.qltiemchungbackend.controller;

import com.vaccine.qltiemchungbackend.dto.*;
import com.vaccine.qltiemchungbackend.entity.BenhNhan;
import com.vaccine.qltiemchungbackend.entity.ChiTietDkTiem;
import com.vaccine.qltiemchungbackend.entity.LoVacXin;
import com.vaccine.qltiemchungbackend.repository.BenhNhanRepository;
import com.vaccine.qltiemchungbackend.repository.ChiTietDkTiemRepository;
import com.vaccine.qltiemchungbackend.repository.LoVacXinRepository;
import com.vaccine.qltiemchungbackend.repository.VacXinRepository;
import com.vaccine.qltiemchungbackend.service.BenhNhanService;
import com.vaccine.qltiemchungbackend.service.TaiKhoanService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

/**
 * MedicalController
 * * Version 1.0
 * * Date: 13-07-2026
 * * Copyright
 * * Modification Logs:
 * DATE       AUTHOR    DESCRIPTION
 * -----------------------------------------------------------------------
 * 13-07-2026 lhthoai   Create, Format and add JavaDoc
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

    @Autowired
    private TaiKhoanService taiKhoanService;

    /**
     * Lấy toàn bộ danh sách hồ sơ bệnh nhân
     *
     * @return List<BenhNhanDTO> danh sách thông tin bệnh nhân
     */
    @GetMapping("/patients")
    public List<BenhNhanDTO> getAllPatients() {
        return benhNhanService.getAllPatients();
    }

    /**
     * Cập nhật thông tin hồ sơ bệnh nhân
     *
     * @param id  mã bệnh nhân cần cập nhật
     * @param dto dữ liệu thông tin cập nhật
     * @return ResponseEntity<String> trạng thái và thông báo
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
     * Lấy danh sách vắc xin khả dụng hiển thị cho Combobox
     *
     * @return List<VacXinBasicDTO> danh sách vắc xin dạng cơ bản
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
     * Kê đơn vắc xin và lên lịch tiêm cho bệnh nhân
     *
     * @param req thông tin yêu cầu kê đơn bao gồm ID bệnh nhân, ID vắc xin và ngày giờ hẹn
     * @return ResponseEntity<String> trạng thái kết quả kê đơn
     */
    @PostMapping("/prescribe")
    public ResponseEntity<String> prescribeVaccine(@RequestBody KeDonRequestDTO req) {
        try {
            BenhNhan bn = benhNhanRepository.findById(req.getPatientId())
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy bệnh nhân!"));

            LoVacXin loVacXin = loVacXinRepository.findAvailableLotByVaccineId(req.getVaccineId())
                    .orElseThrow(() -> new RuntimeException("Vắc xin này hiện đã hết hàng trong kho hoặc không có lô nào khả dụng!"));

            ChiTietDkTiem chiTiet = new ChiTietDkTiem();
            chiTiet.setBenhNhan(bn);
            chiTiet.setMaLo(loVacXin.getMaLo());
            chiTiet.setThoiGianCanTiem(req.getDate());
            chiTiet.setGioTiem(req.getTime());
            chiTiet.setTrangThai("Chưa tiêm");
            chiTiet.setGhiChu(req.getGhiChu());

            chiTietDkTiemRepository.save(chiTiet);

            return ResponseEntity.ok("Kê đơn và lên lịch thành công!");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    /**
     * Cập nhật thông tin chi tiết của một bản ghi lịch sử tiêm chủng
     *
     * @param recordId mã bản ghi chi tiết tiêm cần cập nhật
     * @param dto      dữ liệu lịch sử tiêm chứa thông tin phản ứng, trạng thái...
     * @return ResponseEntity<String> trạng thái kết quả cập nhật
     */
    @PutMapping("/history/{recordId}")
    public ResponseEntity<String> updateHistoryRecord(@PathVariable Long recordId, @RequestBody LichSuTiemDTO dto) {
        try {
            benhNhanService.updateHistoryRecord(recordId, dto);
            return ResponseEntity.ok("Cập nhật lịch sử tiêm thành công!");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Lỗi: " + e.getMessage());
        }
    }

    /**
     * Xóa một bản ghi lịch sử tiêm chủng (Hỗ trợ xóa mềm tùy logic Service)
     *
     * @param recordId mã bản ghi cần xóa
     * @return ResponseEntity<String> trạng thái kết quả xóa
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

    /**
     * Tạo tài khoản mới cho bệnh nhân (Mặc định phân quyền Khách hàng)
     *
     * @param request thông tin tạo tài khoản bao gồm username, password, chi tiết cá nhân...
     * @return ResponseEntity<?> trạng thái phản hồi JSON
     */
    @PostMapping("/patients/account")
    public ResponseEntity<?> createPatientAccount(@RequestBody AccountCreationDTO request) {
        try {
            // Ép cứng quyền là Khách hàng (Bệnh nhân) - maQuyen = 6
            request.setMaQuyen(6L);
            taiKhoanService.createAccount(request);
            return ResponseEntity.ok().body("{\"message\": \"Tạo hồ sơ bệnh nhân thành công!\"}");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("{\"error\": \"Lỗi: " + e.getMessage() + "\"}");
        }
    }
}