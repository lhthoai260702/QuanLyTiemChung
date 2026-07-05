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
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;

/**
 * CustomerController
 * * Version 1.0
 * * Date: 03-07-2026
 * * Copyright
 * * Modification Logs:
 * DATE       AUTHOR    DESCRIPTION
 * -----------------------------------------------------------------------
 * 03-07-2026 lhthoai   Create
 */
@RestController
@RequestMapping("/api/customer")
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

    /**
     * Lấy danh mục các loại vắc-xin cho khách hàng
     *
     * @return ResponseEntity<List<CustomerVaccineProjection>>
     */
    @GetMapping("/vaccines")
    public ResponseEntity<List<CustomerVaccineProjection>> getVaccinesCatalog() {
        return ResponseEntity.ok(vacXinRepository.findAllVaccinesForCustomer());
    }

    /**
     * Xử lý yêu cầu đăng ký tiêm phòng của khách hàng
     *
     * @param request thông tin đăng ký
     * @return ResponseEntity<?>
     */
    @PostMapping("/book")
    public ResponseEntity<?> bookVaccine(@RequestBody BookingRequestDTO request) {
        try {
            customerService.bookVaccine(request);
            return ResponseEntity.ok().body("{\"message\": \"Đăng ký tiêm phòng thành công!\"}");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("{\"error\": \"" + e.getMessage() + "\"}");
        }
    }

    /**
     * Lấy chi tiết hồ sơ bệnh nhân cho người dùng đang đăng nhập
     *
     * @param authentication
     * @return
     */
    @GetMapping("/profile")
    public ResponseEntity<BenhNhanDTO> getMyProfile(Authentication authentication) {
        String username = authentication.getName();
        return ResponseEntity.ok(benhNhanService.getPatientByUsername(username));
    }

    /**
     * Cập nhật thông tin hồ sơ đồng bộ cả 2 bảng
     *
     * @param authentication
     * @param request
     * @return
     */
    @PutMapping("/profile")
    public ResponseEntity<?> updateMyProfile(Authentication authentication, @RequestBody BenhNhanDTO request) {
        try {
            String username = authentication.getName();
            benhNhanService.updatePatientByUsername(username, request);
            return ResponseEntity.ok().body("{\"message\": \"Cập nhật hồ sơ thành công!\"}");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("{\"error\": \"" + e.getMessage() + "\"}");
        }
    }

    /**
     * Lấy danh sách thông tin về các loại dịch bệnh
     *
     * @return ResponseEntity<List<DichBenhProjection>>
     */
    @GetMapping("/diseases")
    public ResponseEntity<List<DichBenhProjection>> getDiseasesInfo() {
        return ResponseEntity.ok(dichBenhRepository.findAllDichBenh());
    }

    /**
     * Ghi nhận phản hồi thường sau khi tiêm của khách hàng
     *
     * @param request thông tin phản hồi
     * @return ResponseEntity<?>
     */
    @PostMapping("/feedback/normal")
    public ResponseEntity<?> submitNormalFeedback(@RequestBody FeedbackRequestDTO request) {
        try {
            phanHoiRepository.insertNormalFeedback(
                    request.getMaBenhNhan(),
                    request.getVacName(),
                    request.getTime(),
                    request.getPlace(),
                    request.getDoctor(),
                    request.getNormalContent()
            );
            return ResponseEntity.ok().body("{\"message\": \"Gửi thành công\"}");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("{\"error\": \"Gửi thất bại\"}");
        }
    }

    /**
     * Ghi nhận phản hồi cấp cao từ khách hàng
     *
     * @param request thông tin phản hồi cấp cao
     * @return ResponseEntity<?>
     */
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

    /**
     * Lấy danh sách tất cả các phản hồi thường để quản lý
     *
     * @return ResponseEntity<List<PhanHoiDTO>>
     */
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

    /**
     * Cập nhật lời giải đáp cho một phản hồi thường
     *
     * @param id      mã phản hồi
     * @param request nội dung giải đáp
     * @return ResponseEntity<?>
     */
    @PostMapping("/feedback/resolve/{id}")
    public ResponseEntity<?> resolveFeedback(@PathVariable Long id, @RequestBody FeedbackRequestDTO request) {
        try {
            phanHoiRepository.capNhatPhanHoi(id, request.getNormalContent(), "Nhân viên hỗ trợ");
            return ResponseEntity.ok().body("{\"message\": \"Giải đáp thành công\"}");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("{\"error\": \"Lỗi gởi email\"}");
        }
    }

    /**
     * Lấy danh sách các câu hỏi thường gặp (FAQ)
     *
     * @return ResponseEntity<List<FaqDTO>>
     */
    @GetMapping("/faqs")
    public ResponseEntity<List<FaqDTO>> getCustomerFaqs() {
        return ResponseEntity.ok(supportService.getAllFaqs());
    }

    /**
     * Lấy lịch sử phản hồi của cá nhân, bao gồm cả phản hồi thường và cấp cao
     *
     * @param patientId mã bệnh nhân
     * @return ResponseEntity<List<CustomerFeedbackDTO>>
     */
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
            dto.setStatus(row[2] != null && !((String) row[2]).trim().isEmpty() ? "Đã trả lời" : "Đang chờ");
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
            dto.setStatus(row[2] != null && !((String) row[2]).trim().isEmpty() ? "Đã trả lời" : "Đang chờ");
            dto.setTime("---"); // PHCC không lưu ngày tiêm trong query này
            result.add(dto);
        }

        return ResponseEntity.ok(result);
    }

    /**
     * Lấy toàn bộ danh sách phản hồi cấp cao dành cho Admin quản lý
     *
     * @return ResponseEntity<List<SupportTicketDTO>>
     */
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

    /**
     * Quản trị viên xử lý và giải đáp phản hồi cấp cao
     *
     * @param id      mã phản hồi cấp cao
     * @param request nội dung trả lời
     * @return ResponseEntity<?>
     */
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