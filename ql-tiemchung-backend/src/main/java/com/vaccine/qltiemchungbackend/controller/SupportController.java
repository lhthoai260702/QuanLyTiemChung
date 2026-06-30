package com.vaccine.qltiemchungbackend.controller;

import com.vaccine.qltiemchungbackend.dto.FaqDTO;
import com.vaccine.qltiemchungbackend.dto.ReminderProjection;
import com.vaccine.qltiemchungbackend.repository.ChiTietDkTiemRepository;
import com.vaccine.qltiemchungbackend.service.SupportService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/support")
@CrossOrigin(origins = "http://localhost:3000")
public class SupportController {

    @Autowired
    private ChiTietDkTiemRepository chiTietDkTiemRepository;

    @Autowired
    private SupportService supportService;

    // --- API NHẮC NHỞ TIÊM CHỦNG ---
    @GetMapping("/reminders")
    public ResponseEntity<List<ReminderProjection>> getReminders() {
        return ResponseEntity.ok(chiTietDkTiemRepository.findDanhSachNhacNho());
    }

    // --- API TƯ VẤN TIÊM CHỦNG (FAQ) ---
    @GetMapping("/faqs")
    public ResponseEntity<List<FaqDTO>> getFaqs() {
        return ResponseEntity.ok(supportService.getAllFaqs());
    }

    @PostMapping("/faqs")
    public ResponseEntity<?> createFaq(@RequestBody FaqDTO request) {
        try {
            supportService.saveFaq(request);
            return ResponseEntity.ok().body("{\"message\": \"Thêm FAQ thành công\"}");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("{\"error\": \"" + e.getMessage() + "\"}");
        }
    }

    @PutMapping("/faqs/{id}")
    public ResponseEntity<?> updateFaq(@PathVariable Long id, @RequestBody FaqDTO request) {
        try {
            request.setId(id);
            supportService.saveFaq(request);
            return ResponseEntity.ok().body("{\"message\": \"Cập nhật FAQ thành công\"}");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("{\"error\": \"" + e.getMessage() + "\"}");
        }
    }
}