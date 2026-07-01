package com.vaccine.qltiemchungbackend.controller;

import com.vaccine.qltiemchungbackend.dto.*;
import com.vaccine.qltiemchungbackend.repository.DichBenhRepository;
import com.vaccine.qltiemchungbackend.repository.PhanHoiCCRepository;
import com.vaccine.qltiemchungbackend.repository.PhanHoiRepository;
import com.vaccine.qltiemchungbackend.repository.VacXinRepository;
import com.vaccine.qltiemchungbackend.service.BenhNhanService;
import com.vaccine.qltiemchungbackend.service.CustomerService;
import com.vaccine.qltiemchungbackend.service.SupportService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
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

    @Autowired
    private PhanHoiCCRepository phanHoiCCRepository;

    @Autowired
    private SupportService supportService;

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


    @GetMapping("/faqs")
    public ResponseEntity<List<FaqDTO>> getCustomerFaqs() {
        return ResponseEntity.ok(supportService.getAllFaqs());
    }

    // Lấy lịch sử phản hồi của cá nhân (gộp cả thường và cấp cao)
    @GetMapping("/my-feedbacks/{patientId}")
    public ResponseEntity<List<CustomerFeedbackDTO>> getMyFeedbacks(@PathVariable Long patientId) {
        List<CustomerFeedbackDTO> result = new ArrayList<>();

        // 1. Phản hồi thường
        List<Object[]> phanHoiThuong = phanHoiRepository.layDanhSachPhanHoiTheoBenhNhan(patientId);
        for (Object[] row : phanHoiThuong) {
            CustomerFeedbackDTO dto = new CustomerFeedbackDTO();
            dto.setId("PH-" + row[0]);
            dto.setType("Thường");
            dto.setContent((String) row[1]);
            dto.setResponseText((String) row[2]);
            dto.setStatus(row[2] != null && !((String)row[2]).trim().isEmpty() ? "Đã trả lời" : "Đang chờ");
            dto.setTime((String) row[3]);
            result.add(dto);
        }

        // 2. Phản hồi cấp cao
        List<Object[]> phanHoiCC = phanHoiCCRepository.layDanhSachPhanHoiCCTheoBenhNhan(patientId);
        for (Object[] row : phanHoiCC) {
            CustomerFeedbackDTO dto = new CustomerFeedbackDTO();
            dto.setId("PHCC-" + row[0]);
            dto.setType("Cấp cao");
            dto.setContent((String) row[1]);
            dto.setResponseText((String) row[2]);
            dto.setStatus(row[2] != null && !((String)row[2]).trim().isEmpty() ? "Đã trả lời" : "Đang chờ");
            dto.setTime("---"); // PHCC không lưu ngày tiêm trong query này
            result.add(dto);
        }

        return ResponseEntity.ok(result);
    }

    @GetMapping("/admin/feedback/high-level")
    public ResponseEntity<List<SupportTicketDTO>> getAllHighLevelFeedbacks() {
        List<Object[]> phanHoiCC = phanHoiCCRepository.layTatCaPhanHoiCC();
        List<SupportTicketDTO> result = new ArrayList<>();

        for (Object[] row : phanHoiCC) {
            SupportTicketDTO dto = new SupportTicketDTO();
            dto.setId("PHCC-" + row[0]);
            dto.setCustomerName((String) row[1]);
            dto.setComments((String) row[2]);
            dto.setEmail((String) row[3]);
            dto.setType((String) row[4]); // Loại (VD: Phàn nàn, Khen ngợi)

            String response = (String) row[5];
            dto.setResponseText(response);
            dto.setStatus(response != null && !response.trim().isEmpty() ? "Đã giải quyết" : "Chưa giải quyết");

            dto.setTime((String) row[6]);
            result.add(dto);
        }
        return ResponseEntity.ok(result);
    }

    // API 3: Admin giải quyết phản hồi cấp cao
    @PostMapping("/admin/feedback/high-level/resolve/{id}")
    public ResponseEntity<?> resolveHighLevelFeedback(@PathVariable Long id, @RequestBody FeedbackRequestDTO request) {
        try {
            // Lấy nội dung trả lời (Tái sử dụng trường normalContent cho nhanh, hoặc tạo trường mới trong DTO)
            phanHoiCCRepository.capNhatPhanHoiCC(id, request.getNormalContent());
            return ResponseEntity.ok().body("{\"message\": \"Giải đáp phản hồi cấp cao thành công\"}");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("{\"error\": \"Lỗi gửi phản hồi\"}");
        }
    }
}