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
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

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

    // ============================================
    // HELPER METHOD: TẠO CHUỖI JSON LỊCH SỬ CHAT
    // ============================================
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

    // ============================================
    // API CŨ ĐƯỢC GIỮ NGUYÊN (CHỈ RÚT GỌN HIỂN THỊ Ở ĐÂY)
    // ============================================
    @GetMapping("/vaccines")
    public ResponseEntity<List<CustomerVaccineProjection>> getVaccinesCatalog() {
        return ResponseEntity.ok(vacXinRepository.findAllVaccinesForCustomer());
    }

    @PostMapping("/book")
    public ResponseEntity<?> bookVaccine(@RequestBody BookingRequestDTO request) {
        try {
            customerService.bookVaccine(request);
            return ResponseEntity.ok().body("{\"message\": \"Đăng ký tiêm phòng thành công!\"}");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("{\"error\": \"" + e.getMessage() + "\"}");
        }
    }

    @GetMapping("/profile")
    public ResponseEntity<BenhNhanDTO> getMyProfile(Authentication authentication) {
        return ResponseEntity.ok(benhNhanService.getPatientByUsername(authentication.getName()));
    }

    @PutMapping("/profile")
    public ResponseEntity<?> updateMyProfile(Authentication authentication, @RequestBody BenhNhanDTO request) {
        try {
            benhNhanService.updatePatientByUsername(authentication.getName(), request);
            return ResponseEntity.ok().body("{\"message\": \"Cập nhật hồ sơ thành công!\"}");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("{\"error\": \"" + e.getMessage() + "\"}");
        }
    }

    @GetMapping("/diseases")
    public ResponseEntity<List<DichBenhProjection>> getDiseasesInfo() {
        return ResponseEntity.ok(dichBenhRepository.findAllDichBenh());
    }

    @GetMapping("/faqs")
    public ResponseEntity<List<FaqDTO>> getCustomerFaqs() {
        return ResponseEntity.ok(supportService.getAllFaqs());
    }

    // ============================================
    // API: TẠO TICKET VÀ PHẢN HỒI (CẬP NHẬT LƯU CHAT)
    // ============================================
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

    // ============================================
    // API: TRẢ LỜI VÀ ĐÁNH DẤU HOÀN THÀNH (MỚI THÊM)
    // ============================================
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

    // ============================================
    // API CŨ: ĐƯỢC CẬP NHẬT ĐỂ TÍCH HỢP TRƯỜNG CHAT
    // ============================================
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