package com.vaccine.qltiemchungbackend.controller;

import com.vaccine.qltiemchungbackend.dto.LichTiemChungDTO;
import com.vaccine.qltiemchungbackend.entity.LoaiVacXin;
import com.vaccine.qltiemchungbackend.repository.LoaiVacXinRepository;
import com.vaccine.qltiemchungbackend.service.LichTiemChungService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
@CrossOrigin(origins = "http://localhost:3000") // Cổng Frontend của bạn
public class LichTiemChungController {

    @Autowired
    private LichTiemChungService lichTiemChungService;

    @Autowired
    private LoaiVacXinRepository loaiVacXinRepository;

    @GetMapping("/schedules")
    public ResponseEntity<List<LichTiemChungDTO>> getAllSchedules() {
        return ResponseEntity.ok(lichTiemChungService.getAllSchedules());
    }

    @GetMapping("/vaccine-types")
    public ResponseEntity<List<LoaiVacXin>> getAllVaccineTypes() {
        return ResponseEntity.ok(loaiVacXinRepository.findByFlagDeleteFalseOrFlagDeleteIsNull());
    }

    @PostMapping("/schedules")
    public ResponseEntity<?> createSchedule(@RequestBody LichTiemChungDTO request) {
        try {
            lichTiemChungService.createSchedule(request);
            return ResponseEntity.ok().body("{\"message\": \"Tạo lịch tiêm thành công!\"}");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("{\"error\": \"Lỗi: " + e.getMessage() + "\"}");
        }
    }

    @PutMapping("/schedules/{id}")
    public ResponseEntity<?> updateSchedule(@PathVariable Long id, @RequestBody LichTiemChungDTO request) {
        try {
            lichTiemChungService.updateSchedule(id, request);
            return ResponseEntity.ok().body("{\"message\": \"Cập nhật lịch tiêm thành công!\"}");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("{\"error\": \"Lỗi: " + e.getMessage() + "\"}");
        }
    }

    @DeleteMapping("/schedules/{id}")
    public ResponseEntity<?> deleteSchedule(@PathVariable Long id) {
        try {
            lichTiemChungService.deleteSchedule(id);
            return ResponseEntity.ok().body("{\"message\": \"Xóa lịch tiêm thành công!\"}");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("{\"error\": \"Lỗi: " + e.getMessage() + "\"}");
        }
    }
}