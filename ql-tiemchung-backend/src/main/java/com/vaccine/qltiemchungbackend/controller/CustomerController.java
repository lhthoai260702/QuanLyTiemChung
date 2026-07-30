package com.vaccine.qltiemchungbackend.controller;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.vaccine.qltiemchungbackend.dto.*;
import com.vaccine.qltiemchungbackend.entity.PhanHoi;
import com.vaccine.qltiemchungbackend.entity.PhanHoiCC;
import com.vaccine.qltiemchungbackend.repository.DichBenhRepository;
import com.vaccine.qltiemchungbackend.repository.PhanHoiCCRepository;
import com.vaccine.qltiemchungbackend.repository.PhanHoiRepository;
import com.vaccine.qltiemchungbackend.repository.VacXinRepository;
import com.vaccine.qltiemchungbackend.service.BenhNhanService;
import com.vaccine.qltiemchungbackend.service.CustomerService;
import com.vaccine.qltiemchungbackend.service.SupportService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.orm.ObjectOptimisticLockingFailureException;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * CustomerController
 * * Version 1.0
 * * Date: 13-07-2026
 * * Copyright
 * * Modification Logs:
 * DATE       AUTHOR    DESCRIPTION
 * -----------------------------------------------------------------------
 * 13-07-2026 lhthoai   Create, Format and add JavaDoc
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
     * Helper Method: Tạo chuỗi JSON lịch sử chat
     *
     * @param historyJson chuỗi JSON lịch sử hiện tại
     * @param sender      người gửi
     * @param message     nội dung tin nhắn
     * @return String     chuỗi JSON lịch sử đã được cập nhật
     */
    private String appendMessage(String historyJson, String sender, String message) {
        try {
            ObjectMapper mapper = new ObjectMapper();
            List<Map<String, String>> history = new ArrayList<>();
            if (historyJson != null && !historyJson.trim().isEmpty() && !historyJson.equals("null")) {
                history = mapper.readValue(historyJson, new TypeReference<List<Map<String, String>>>() {
                });
            }
            Map<String, String> msg = new HashMap<>();
            msg.put("sender", sender);
            msg.put("message", message);
            msg.put("time", LocalDateTime.now().format(DateTimeFormatter.ofPattern("HH:mm dd/MM/yyyy")));
            history.add(msg);
            return mapper.writeValueAsString(history);
        } catch (Exception e) {
            e.printStackTrace();
            return historyJson;
        }
    }

    /**
     * Lấy danh sách vắc xin cho khách hàng
     *
     * @return ResponseEntity danh sách vắc xin
     */
    @GetMapping("/vaccines")
    public ResponseEntity<List<CustomerVaccineProjection>> getVaccinesCatalog() {
        return ResponseEntity.ok(vacXinRepository.findAllVaccinesForCustomer());
    }

    /**
     * Xử lý yêu cầu đăng ký tiêm phòng
     *
     * @param request dữ liệu đăng ký tiêm
     * @return ResponseEntity trạng thái xử lý
     */
    @PostMapping("/book")
    public ResponseEntity<?> bookVaccine(@RequestBody BookingRequestDTO request) {
        try {
            customerService.bookVaccine(request);
            return ResponseEntity.ok().body("{\"message\": \"Đăng ký tiêm phòng thành công!\"}");
        } catch (ObjectOptimisticLockingFailureException ex) {
            throw ex; // Bỏ qua ngoại lệ này cho GlobalExceptionHandler xử lý
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("{\"error\": \"" + e.getMessage() + "\"}");
        }
    }

    /**
     * Lấy thông tin hồ sơ của khách hàng hiện tại
     *
     * @param authentication thông tin xác thực
     * @return ResponseEntity hồ sơ bệnh nhân
     */
    @GetMapping("/profile")
    public ResponseEntity<BenhNhanDTO> getMyProfile(Authentication authentication) {
        return ResponseEntity.ok(benhNhanService.getPatientByUsername(authentication.getName()));
    }

    /**
     * Cập nhật thông tin hồ sơ khách hàng
     *
     * @param authentication thông tin xác thực
     * @param request        dữ liệu hồ sơ cần cập nhật
     * @return ResponseEntity trạng thái xử lý
     */
    @PutMapping("/profile")
    public ResponseEntity<?> updateMyProfile(Authentication authentication, @RequestBody BenhNhanDTO request) {
        try {
            benhNhanService.updatePatientByUsername(authentication.getName(), request);
            return ResponseEntity.ok().body("{\"message\": \"Cập nhật hồ sơ thành công!\"}");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("{\"error\": \"" + e.getMessage() + "\"}");
        }
    }

    /**
     * Lấy thông tin các dịch bệnh
     *
     * @return ResponseEntity danh sách dịch bệnh
     */
    @GetMapping("/diseases")
    public ResponseEntity<List<DichBenhProjection>> getDiseasesInfo() {
        return ResponseEntity.ok(dichBenhRepository.findAllDichBenh());
    }

    /**
     * Lấy danh sách các câu hỏi thường gặp (FAQs)
     *
     * @return ResponseEntity danh sách FAQs
     */
    @GetMapping("/faqs")
    public ResponseEntity<List<FaqDTO>> getCustomerFaqs() {
        return ResponseEntity.ok(supportService.getAllFaqs());
    }

    /**
     * Gửi phản hồi thường
     *
     * @param request thông tin phản hồi
     * @return ResponseEntity trạng thái xử lý
     */
    @PostMapping("/feedback/normal")
    public ResponseEntity<?> submitNormalFeedback(@RequestBody FeedbackRequestDTO request) {
        try {
            PhanHoi ph = new PhanHoi();
            ph.setMaBenhNhan(request.getMaBenhNhan());
            ph.setTenVacXin(request.getVacName());
            if (request.getTime() != null && !request.getTime().isEmpty()) {
                ph.setThoiGianTiem(java.time.LocalDate.parse(request.getTime()));
            }
            ph.setDiaDiemTiem(request.getPlace());
            ph.setTenNhanVienPhuTrach(request.getDoctor());
            ph.setNoiDung(request.getNormalContent());
            ph.setTrangThai("Đang xử lý");
            ph.setChiTietPhanHoi(appendMessage("[]", "customer", request.getNormalContent()));
            phanHoiRepository.save(ph);
            return ResponseEntity.ok().body("{\"message\": \"Gửi thành công\"}");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("{\"error\": \"Gửi thất bại\"}");
        }
    }

    /**
     * Gửi phản hồi cấp cao
     *
     * @param request thông tin phản hồi cấp cao
     * @return ResponseEntity trạng thái xử lý
     */
    @PostMapping("/feedback/high-level")
    public ResponseEntity<?> submitHighLevelFeedback(@RequestBody FeedbackRequestDTO request) {
        try {
            PhanHoiCC phcc = new PhanHoiCC();
            phcc.setMaBenhNhan(request.getMaBenhNhan());
            phcc.setName(request.getHighLevelType());
            phcc.setContent(request.getHighLevelContent());
            phcc.setTrangThai("Đang xử lý");
            phcc.setChiTietPhanHoi(appendMessage("[]", "customer", request.getHighLevelContent()));
            phanHoiCCRepository.save(phcc);
            return ResponseEntity.ok().body("{\"message\": \"Phản hồi gửi đi thành công.\"}");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("{\"error\": \"Phản hồi gửi thất bại\"}");
        }
    }

    /**
     * Trả lời phản hồi
     *
     * @param request nội dung trả lời
     * @return ResponseEntity trạng thái xử lý
     */
    @PostMapping("/feedback/reply")
    public ResponseEntity<?> replyFeedback(@RequestBody FeedbackRequestDTO request) {
        try {
            String fId = request.getFeedbackId();
            if (fId.startsWith("PH-")) {
                Long id = Long.parseLong(fId.replace("PH-", ""));
                PhanHoi ph = phanHoiRepository.findById(id).orElseThrow(() -> new Exception("Not found"));
                ph.setChiTietPhanHoi(appendMessage(ph.getChiTietPhanHoi(), request.getSender(), request.getReplyContent()));
                ph.setTrangThai(request.getSender().equals("customer") ? "Đang xử lý" : "Đã trả lời");
                phanHoiRepository.save(ph);
            } else if (fId.startsWith("PHCC-")) {
                Long id = Long.parseLong(fId.replace("PHCC-", ""));
                PhanHoiCC phcc = phanHoiCCRepository.findById(id).orElseThrow(() -> new Exception("Not found"));
                phcc.setChiTietPhanHoi(appendMessage(phcc.getChiTietPhanHoi(), request.getSender(), request.getReplyContent()));
                phcc.setTrangThai(request.getSender().equals("customer") ? "Đang xử lý" : "Đã trả lời");
                phanHoiCCRepository.save(phcc);
            }
            return ResponseEntity.ok().body("{\"message\": \"Gửi tin nhắn thành công\"}");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("{\"error\": \"Lỗi gửi tin nhắn\"}");
        }
    }

    /**
     * Đánh dấu hoàn thành phản hồi
     *
     * @param feedbackId ID của phản hồi
     * @return ResponseEntity trạng thái xử lý
     */
    @PutMapping("/feedback/complete/{feedbackId}")
    public ResponseEntity<?> completeFeedback(@PathVariable String feedbackId) {
        try {
            if (feedbackId.startsWith("PH-")) {
                Long id = Long.parseLong(feedbackId.replace("PH-", ""));
                PhanHoi ph = phanHoiRepository.findById(id).orElseThrow(() -> new Exception("Not found"));
                ph.setTrangThai("Đã hoàn thành");
                phanHoiRepository.save(ph);
            } else if (feedbackId.startsWith("PHCC-")) {
                Long id = Long.parseLong(feedbackId.replace("PHCC-", ""));
                PhanHoiCC phcc = phanHoiCCRepository.findById(id).orElseThrow(() -> new Exception("Not found"));
                phcc.setTrangThai("Đã hoàn thành");
                phanHoiCCRepository.save(phcc);
            }
            return ResponseEntity.ok().body("{\"message\": \"Đã đánh dấu hoàn thành\"}");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("{\"error\": \"Lỗi cập nhật trạng thái\"}");
        }
    }

    /**
     * Lấy danh sách toàn bộ phản hồi thường
     *
     * @return ResponseEntity danh sách phản hồi
     */
    @GetMapping("/feedback/list")
    public ResponseEntity<List<PhanHoiDTO>> getFeedbackList() {
        List<PhanHoiProjection> projections = phanHoiRepository.layDanhSachPhanHoiProjection();
        List<PhanHoiDTO> dtoList = projections.stream().map(p -> {
            PhanHoiDTO dto = new PhanHoiDTO();
            dto.setId(p.getId());
            dto.setCustomerName(p.getCustomerName());
            dto.setComments(p.getComments());
            dto.setEmail(p.getEmail());

            PhanHoi entity = phanHoiRepository.findById(p.getId()).orElse(null);
            if (entity != null) {
                dto.setStatus(entity.getTrangThai());
                dto.setChiTietPhanHoi(entity.getChiTietPhanHoi());
            } else {
                dto.setStatus(p.getStatus());
            }
            dto.setResponseText(p.getResponseText());
            dto.setTime(p.getThoiGianTiem());
            return dto;
        }).toList();
        return ResponseEntity.ok(dtoList);
    }

    /**
     * Lấy danh sách toàn bộ phản hồi cấp cao (Dành cho Admin)
     *
     * @return ResponseEntity danh sách phản hồi cấp cao
     */
    @GetMapping("/admin/feedback/high-level")
    public ResponseEntity<List<SupportTicketDTO>> getAllHighLevelFeedbacks() {
        List<Object[]> phanHoiCC = phanHoiCCRepository.layTatCaPhanHoiCC();
        List<SupportTicketDTO> result = new ArrayList<>();
        for (Object[] row : phanHoiCC) {
            SupportTicketDTO dto = new SupportTicketDTO();
            Long id = ((Number) row[0]).longValue();
            dto.setId("PHCC-" + id);
            dto.setCustomerName((String) row[1]);
            dto.setComments((String) row[2]);
            dto.setEmail((String) row[3]);
            dto.setType((String) row[4]);

            PhanHoiCC entity = phanHoiCCRepository.findById(id).orElse(null);
            if (entity != null) {
                dto.setStatus(entity.getTrangThai());
                dto.setChiTietPhanHoi(entity.getChiTietPhanHoi());
            } else {
                dto.setStatus("Chưa giải quyết");
            }
            dto.setTime((String) row[6]);
            result.add(dto);
        }
        return ResponseEntity.ok(result);
    }

    /**
     * Lấy danh sách phản hồi của một bệnh nhân cụ thể
     *
     * @param patientId mã bệnh nhân
     * @return ResponseEntity danh sách phản hồi của khách hàng
     */
    @GetMapping("/my-feedbacks/{patientId}")
    public ResponseEntity<List<CustomerFeedbackDTO>> getMyFeedbacks(@PathVariable Long patientId) {
        List<CustomerFeedbackDTO> result = new ArrayList<>();

        List<Object[]> phanHoiThuong = phanHoiRepository.layDanhSachPhanHoiTheoBenhNhan(patientId);
        for (Object[] row : phanHoiThuong) {
            CustomerFeedbackDTO dto = new CustomerFeedbackDTO();
            Long id = ((Number) row[0]).longValue();
            dto.setId("PH-" + id);
            dto.setType("Thường");
            dto.setContent((String) row[1]);
            dto.setResponseText((String) row[2]);
            dto.setTime((String) row[3]);

            PhanHoi entity = phanHoiRepository.findById(id).orElse(null);
            if (entity != null) {
                dto.setStatus(entity.getTrangThai());
                dto.setChiTietPhanHoi(entity.getChiTietPhanHoi());
            } else {
                dto.setStatus("Đang chờ");
            }
            result.add(dto);
        }

        List<Object[]> phanHoiCC = phanHoiCCRepository.layDanhSachPhanHoiCCTheoBenhNhan(patientId);
        for (Object[] row : phanHoiCC) {
            CustomerFeedbackDTO dto = new CustomerFeedbackDTO();
            Long id = ((Number) row[0]).longValue();
            dto.setId("PHCC-" + id);
            dto.setType("Cấp cao");
            dto.setContent((String) row[1]);
            dto.setResponseText((String) row[2]);
            dto.setTime("---");

            PhanHoiCC entity = phanHoiCCRepository.findById(id).orElse(null);
            if (entity != null) {
                dto.setStatus(entity.getTrangThai());
                dto.setChiTietPhanHoi(entity.getChiTietPhanHoi());
            } else {
                dto.setStatus("Đang chờ");
            }
            result.add(dto);
        }
        return ResponseEntity.ok(result);
    }

    /**
     * Giải quyết phản hồi thường
     *
     * @param id      mã phản hồi
     * @param request dữ liệu trả lời
     * @return ResponseEntity trạng thái xử lý
     */
    @PostMapping("/feedback/resolve/{id}")
    public ResponseEntity<?> resolveFeedback(@PathVariable Long id, @RequestBody FeedbackRequestDTO request) {
        try {
            PhanHoi ph = phanHoiRepository.findById(id).orElseThrow(() -> new Exception("Not found"));
            ph.setChiTietPhanHoi(appendMessage(ph.getChiTietPhanHoi(), "support", request.getNormalContent()));
            ph.setTrangThai("Đã trả lời");
            phanHoiRepository.save(ph);
            return ResponseEntity.ok().body("{\"message\": \"Giải đáp thành công\"}");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("{\"error\": \"Lỗi gửi giải đáp\"}");
        }
    }

    /**
     * Giải quyết phản hồi cấp cao
     *
     * @param id      mã phản hồi
     * @param request dữ liệu trả lời
     * @return ResponseEntity trạng thái xử lý
     */
    @PostMapping("/admin/feedback/high-level/resolve/{id}")
    public ResponseEntity<?> resolveHighLevelFeedback(@PathVariable Long id, @RequestBody FeedbackRequestDTO request) {
        try {
            PhanHoiCC phcc = phanHoiCCRepository.findById(id).orElseThrow(() -> new Exception("Not found"));
            phcc.setChiTietPhanHoi(appendMessage(phcc.getChiTietPhanHoi(), "admin", request.getNormalContent()));
            phcc.setTrangThai("Đã trả lời");
            phanHoiCCRepository.save(phcc);
            return ResponseEntity.ok().body("{\"message\": \"Giải đáp phản hồi cấp cao thành công\"}");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("{\"error\": \"Lỗi gửi phản hồi\"}");
        }
    }
}