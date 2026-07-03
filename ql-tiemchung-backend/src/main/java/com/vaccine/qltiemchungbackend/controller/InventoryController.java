package com.vaccine.qltiemchungbackend.controller;

import com.vaccine.qltiemchungbackend.dto.KhoVacXinDTO;
import com.vaccine.qltiemchungbackend.entity.LoaiVacXin;
import com.vaccine.qltiemchungbackend.entity.NhaCungCap;
import com.vaccine.qltiemchungbackend.entity.VacXin;
import com.vaccine.qltiemchungbackend.repository.NhaCungCapRepository;
import com.vaccine.qltiemchungbackend.repository.VacXinRepository;
import com.vaccine.qltiemchungbackend.service.InventoryService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * InventoryController
 * * Version 1.0
 * * Date: 03-07-2026
 * * Copyright
 * * Modification Logs:
 * DATE       AUTHOR    DESCRIPTION
 * -----------------------------------------------------------------------
 * 03-07-2026 lhthoai   Create
 */
@RestController
@RequestMapping("/api/inventory")
@CrossOrigin(origins = "http://localhost:3000")
public class InventoryController {

    @Autowired
    private InventoryService inventoryService;

    @Autowired
    private VacXinRepository vacXinRepository;

    @Autowired
    private NhaCungCapRepository nhaCungCapRepository;

    /**
     * Lấy danh sách toàn bộ trạng thái kho vắc-xin
     *
     * @return ResponseEntity<List<KhoVacXinDTO>>
     */
    @GetMapping("/vaccines")
    public ResponseEntity<List<KhoVacXinDTO>> getInventoryStatus() {
        return ResponseEntity.ok(inventoryService.getAllKhoVacXin());
    }

    /**
     * Thêm mới hoặc cập nhật thông tin lô vắc-xin trong kho
     *
     * @param khoVacXinDTO thông tin lô vắc-xin
     * @return ResponseEntity<KhoVacXinDTO>
     */
    @PostMapping("/vaccines")
    public ResponseEntity<KhoVacXinDTO> saveOrUpdateVaccine(@RequestBody KhoVacXinDTO khoVacXinDTO) {
        try {
            KhoVacXinDTO savedData = inventoryService.saveOrUpdateKhoVacXin(khoVacXinDTO);
            return ResponseEntity.ok(savedData);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(null);
        }
    }

    // --- API CHO COMBOBOX ---

    /**
     * Lấy danh sách các loại vắc-xin để hiển thị trên ComboBox
     *
     * @return ResponseEntity<List<LoaiVacXin>>
     */
    @GetMapping("/vaccine-types")
    public ResponseEntity<List<LoaiVacXin>> getVaccineTypes() {
        return ResponseEntity.ok(inventoryService.getAllLoaiVacXin());
    }

    /**
     * Lấy danh sách tên vắc-xin khả dụng để hiển thị trên ComboBox
     *
     * @return ResponseEntity<List<VacXin>>
     */
    @GetMapping("/vaccine-list")
    public ResponseEntity<List<VacXin>> getVaccinesList() {
        return ResponseEntity.ok(vacXinRepository.findAllAvailable());
    }

    /**
     * Lấy danh sách nhà cung cấp khả dụng để hiển thị trên ComboBox
     *
     * @return ResponseEntity<List<NhaCungCap>>
     */
    @GetMapping("/suppliers")
    public ResponseEntity<List<NhaCungCap>> getSuppliers() {
        return ResponseEntity.ok(nhaCungCapRepository.findByFlagDeleteFalseOrFlagDeleteIsNull());
    }

    // --- API XUẤT KHO & XÓA ---

    /**
     * Xử lý xuất kho vắc-xin theo số lượng
     *
     * @param id       mã lô vắc-xin
     * @param quantity số lượng cần xuất
     * @return ResponseEntity<?>
     */
    @PostMapping("/vaccines/{id}/export")
    public ResponseEntity<?> exportVaccine(@PathVariable("id") Long id, @RequestParam int quantity) {
        try {
            inventoryService.exportVaccine(id, quantity);
            return ResponseEntity.ok().body("Xuất kho thành công");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    /**
     * Xóa mềm thông tin một lô vắc-xin khỏi kho
     *
     * @param id mã lô vắc-xin
     * @return ResponseEntity<?>
     */
    @DeleteMapping("/vaccines/{id}")
    public ResponseEntity<?> deleteVaccine(@PathVariable("id") Long id) {
        try {
            inventoryService.deleteKhoVacXin(id);
            return ResponseEntity.ok().body("Đã xóa mềm Lô Vắc-xin thành công");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}