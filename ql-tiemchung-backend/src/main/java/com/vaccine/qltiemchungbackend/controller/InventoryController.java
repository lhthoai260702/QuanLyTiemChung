package com.vaccine.qltiemchungbackend.controller;

import com.vaccine.qltiemchungbackend.dto.KhoVacXinDTO;
import com.vaccine.qltiemchungbackend.entity.LoaiVacXin;
import com.vaccine.qltiemchungbackend.service.InventoryService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/inventory")
@CrossOrigin(origins = "http://localhost:3000")
public class InventoryController {

    @Autowired
    private InventoryService inventoryService;

    // API Lấy danh sách
    @GetMapping("/vaccines")
    public ResponseEntity<List<KhoVacXinDTO>> getInventoryStatus() {
        List<KhoVacXinDTO> danhSachKho = inventoryService.getAllKhoVacXin();
        return ResponseEntity.ok(danhSachKho);
    }

    // API Thêm mới hoặc Cập nhật (Save/Update)
    @PostMapping("/vaccines")
    public ResponseEntity<KhoVacXinDTO> saveOrUpdateVaccine(@RequestBody KhoVacXinDTO khoVacXinDTO) {
        try {
            KhoVacXinDTO savedData = inventoryService.saveOrUpdateKhoVacXin(khoVacXinDTO);
            return ResponseEntity.ok(savedData);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(null);
        }
    }

    @GetMapping("/vaccine-types")
    public ResponseEntity<List<LoaiVacXin>> getVaccineTypes() {
        List<LoaiVacXin> list = inventoryService.getAllLoaiVacXin();
        return ResponseEntity.ok(list);
    }

    // API Xuất Kho
    @PostMapping("/vaccines/{id}/export")
    public ResponseEntity<?> exportVaccine(@PathVariable("id") Long id, @RequestParam int quantity) {
        try {
            inventoryService.exportVaccine(id, quantity);
            return ResponseEntity.ok().body("Xuất kho thành công");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // API Xóa Mềm Lô Vắc Xin
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