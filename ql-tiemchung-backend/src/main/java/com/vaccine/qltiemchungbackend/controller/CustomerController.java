package com.vaccine.qltiemchungbackend.controller;

import com.vaccine.qltiemchungbackend.dto.*;
import com.vaccine.qltiemchungbackend.repository.DichBenhRepository;
import com.vaccine.qltiemchungbackend.repository.PhanHoiRepository;
import com.vaccine.qltiemchungbackend.repository.VacXinRepository;
import com.vaccine.qltiemchungbackend.service.BenhNhanService;
import com.vaccine.qltiemchungbackend.service.CustomerService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/customer")
@CrossOrigin(origins = "http://localhost:3000")
public class CustomerController {

    @Autowired
    private VacXinRepository vacXinRepository;

    @Autowired
    private CustomerService customerService;

    @Autowired
    private BenhNhanService benhNhanService;

    @Autowired
    private DichBenhRepository dichBenhRepository;

    @Autowired
    private PhanHoiRepository phanHoiRepository;

    @GetMapping("/vaccines")
    public ResponseEntity<List<CustomerVaccineProjection>> getVaccinesCatalog() {
        return ResponseEntity.ok(vacXinRepository.findAllVaccinesForCustomer());
    }

    // THÊM API ĐĂNG KÝ NÀY
    @PostMapping("/book")
    public ResponseEntity<?> bookVaccine(@RequestBody BookingRequestDTO request) {
        try {
            customerService.bookVaccine(request);
            return ResponseEntity.ok().body("{\"message\": \"Đăng ký tiêm phòng thành công!\"}");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("{\"error\": \"" + e.getMessage() + "\"}");
        }
    }

    @GetMapping("/profile/{id}")
    public ResponseEntity<BenhNhanDTO> getCustomerProfile(@PathVariable Long id) {
        return ResponseEntity.ok(benhNhanService.getPatientById(id));
    }

    @PutMapping("/profile/{id}")
    public ResponseEntity<?> updateCustomerProfile(@PathVariable Long id, @RequestBody BenhNhanDTO request) {
        try {
            benhNhanService.updatePatient(id, request);
            return ResponseEntity.ok().body("{\"message\": \"Cập nhật hồ sơ thành công!\"}");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("{\"error\": \"" + e.getMessage() + "\"}");
        }
    }

    @GetMapping("/diseases")
    public ResponseEntity<List<DichBenhProjection>> getDiseasesInfo() {
        return ResponseEntity.ok(dichBenhRepository.findAllDichBenh());
    }

    // API 1: Xử lý Gửi phản hồi sau khi tiêm
    @PostMapping("/feedback/normal")
    public ResponseEntity<?> submitNormalFeedback(@RequestBody FeedbackRequestDTO request) {
        try {
            phanHoiRepository.insertNormalFeedback(
                    request.getMaBenhNhan(),
                    request.getVacName(),
                    request.getTime(),
                    request.getPlace(),
                    request.getDoctor(),
                    request.getNormalContent() // THÊM DÒNG NÀY
            );
            return ResponseEntity.ok().body("{\"message\": \"Gửi thành công\"}");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("{\"error\": \"Gửi thất bại\"}");
        }
    }

    // API 2: Xử lý Gửi phản hồi cấp cao
    @PostMapping("/feedback/high-level")
    public ResponseEntity<?> submitHighLevelFeedback(@RequestBody FeedbackRequestDTO request) {
        try {
            phanHoiRepository.insertHighLevelFeedback(
                    request.getMaBenhNhan(),
                    request.getHighLevelType(),
                    request.getHighLevelContent()
            );
            return ResponseEntity.ok().body("{\"message\": \"Phản hồi gửi đi thành công.\"}");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("{\"error\": \"Phản hồi gửi thất bại\"}");
        }
    }

    @GetMapping("/feedback/list")
    public ResponseEntity<List<PhanHoiDTO>> getFeedbackList() {
        // 1. Lấy dữ liệu dạng Projection từ DB
        List<PhanHoiProjection> projections = phanHoiRepository.layDanhSachPhanHoiProjection();

        // 2. Map sang DTO
        List<PhanHoiDTO> dtoList = projections.stream().map(p -> {
            PhanHoiDTO dto = new PhanHoiDTO();
            dto.setId(p.getId());
            dto.setCustomerName(p.getCustomerName());
            dto.setComments(p.getComments());
            dto.setEmail(p.getEmail());
            dto.setStatus(p.getStatus());
            dto.setResponseText(p.getResponseText());
            dto.setTime(p.getThoiGianTiem());
            return dto;
        }).toList();

        // 3. Trả về cho Frontend
        return ResponseEntity.ok(dtoList);
    }

    // Cập nhật giải đáp thắc mắc
    @PostMapping("/feedback/resolve/{id}")
    public ResponseEntity<?> resolveFeedback(@PathVariable Long id, @RequestBody FeedbackRequestDTO request) {
        try {
            phanHoiRepository.capNhatPhanHoi(id, request.getNormalContent(), "Nhân viên hỗ trợ");
            return ResponseEntity.ok().body("{\"message\": \"Giải đáp thành công\"}");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("{\"error\": \"Lỗi gởi email\"}");
        }
    }
}