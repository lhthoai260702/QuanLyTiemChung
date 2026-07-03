package com.vaccine.qltiemchungbackend.controller;

import com.vaccine.qltiemchungbackend.dto.FaqDTO;
import com.vaccine.qltiemchungbackend.dto.ReminderProjection;
import com.vaccine.qltiemchungbackend.repository.ChiTietDkTiemRepository;
import com.vaccine.qltiemchungbackend.service.SupportService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * SupportController
 * * Version 1.0
 * * Date: 03-07-2026
 * * Copyright
 * * Modification Logs:
 * DATE       AUTHOR    DESCRIPTION
 * -----------------------------------------------------------------------
 * 03-07-2026 lhthoai   Create
 */
@RestController
@RequestMapping("/api/support")
@CrossOrigin(origins = "http://localhost:3000")
public class SupportController {

    @Autowired
    private ChiTietDkTiemRepository chiTietDkTiemRepository;

    @Autowired
    private SupportService supportService;

    /**
     * Lấy danh sách nhắc nhở tiêm chủng
     *
     * @return ResponseEntity<List<ReminderProjection>>
     */
    @GetMapping("/reminders")
    public ResponseEntity<List<ReminderProjection>> getReminders() {
        return ResponseEntity.ok(chiTietDkTiemRepository.findDanhSachNhacNho());
    }

    /**
     * Lấy danh sách các câu hỏi thường gặp (FAQ)
     *
     * @return ResponseEntity<List<FaqDTO>>
     */
    @GetMapping("/faqs")
    public ResponseEntity<List<FaqDTO>> getFaqs() {
        return ResponseEntity.ok(supportService.getAllFaqs());
    }

    /**
     * Thêm mới một câu hỏi thường gặp (FAQ)
     *
     * @param request dữ liệu FAQ
     * @return ResponseEntity<?>
     */
    @PostMapping("/faqs")
    public ResponseEntity<?> createFaq(@RequestBody FaqDTO request) {
        try {
            supportService.saveFaq(request);
            return ResponseEntity.ok().body("{\"message\": \"Thêm FAQ thành công\"}");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("{\"error\": \"" + e.getMessage() + "\"}");
        }
    }

    /**
     * Cập nhật thông tin FAQ hiện có
     *
     * @param id      mã FAQ
     * @param request dữ liệu cập nhật FAQ
     * @return ResponseEntity<?>
     */
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