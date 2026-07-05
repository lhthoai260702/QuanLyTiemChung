package com.vaccine.qltiemchungbackend.controller;

import com.vaccine.qltiemchungbackend.dto.LichTiemChungDTO;
import com.vaccine.qltiemchungbackend.entity.LoaiVacXin;
import com.vaccine.qltiemchungbackend.repository.LoaiVacXinRepository;
import com.vaccine.qltiemchungbackend.service.LichTiemChungService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * LichTiemChungController
 * * Version 1.0
 * * Date: 03-07-2026
 * * Copyright
 * * Modification Logs:
 * DATE       AUTHOR    DESCRIPTION
 * -----------------------------------------------------------------------
 * 03-07-2026 lhthoai   Create
 */
@RestController
@RequestMapping("/api/admin")
public class LichTiemChungController {

    @Autowired
    private LichTiemChungService lichTiemChungService;

    @Autowired
    private LoaiVacXinRepository loaiVacXinRepository;

    /**
     * Lấy danh sách toàn bộ lịch tiêm chủng
     *
     * @return ResponseEntity<List<LichTiemChungDTO>>
     */
    @GetMapping("/schedules")
    public ResponseEntity<List<LichTiemChungDTO>> getAllSchedules() {
        return ResponseEntity.ok(lichTiemChungService.getAllSchedules());
    }

    /**
     * Lấy danh sách các loại vắc-xin
     *
     * @return ResponseEntity<List<LoaiVacXin>>
     */
    @GetMapping("/vaccine-types")
    public ResponseEntity<List<LoaiVacXin>> getAllVaccineTypes() {
        return ResponseEntity.ok(loaiVacXinRepository.findByFlagDeleteFalseOrFlagDeleteIsNull());
    }

    /**
     * Tạo mới một lịch tiêm chủng
     *
     * @param request thông tin lịch tiêm chủng cần tạo
     * @return ResponseEntity<?>
     */
    @PostMapping("/schedules")
    public ResponseEntity<?> createSchedule(@RequestBody LichTiemChungDTO request) {
        try {
            lichTiemChungService.createSchedule(request);
            return ResponseEntity.ok().body("{\"message\": \"Tạo lịch tiêm thành công!\"}");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("{\"error\": \"Lỗi: " + e.getMessage() + "\"}");
        }
    }

    /**
     * Cập nhật thông tin lịch tiêm chủng
     *
     * @param id      mã lịch tiêm chủng
     * @param request dữ liệu lịch tiêm cập nhật
     * @return ResponseEntity<?>
     */
    @PutMapping("/schedules/{id}")
    public ResponseEntity<?> updateSchedule(@PathVariable Long id, @RequestBody LichTiemChungDTO request) {
        try {
            lichTiemChungService.updateSchedule(id, request);
            return ResponseEntity.ok().body("{\"message\": \"Cập nhật lịch tiêm thành công!\"}");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("{\"error\": \"Lỗi: " + e.getMessage() + "\"}");
        }
    }

    /**
     * Xóa lịch tiêm chủng theo ID
     *
     * @param id mã lịch tiêm chủng cần xóa
     * @return ResponseEntity<?>
     */
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