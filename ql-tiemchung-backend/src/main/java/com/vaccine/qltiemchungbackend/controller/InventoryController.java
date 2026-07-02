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

@RestController
@RequestMapping("/api/inventory")
@CrossOrigin(origins = "http://localhost:3000")
public class InventoryController {

    @Autowired private InventoryService inventoryService;
    @Autowired private VacXinRepository vacXinRepository;
    @Autowired private NhaCungCapRepository nhaCungCapRepository;

    @GetMapping("/vaccines")
    public ResponseEntity<List<KhoVacXinDTO>> getInventoryStatus() {
        return ResponseEntity.ok(inventoryService.getAllKhoVacXin());
    }

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
    @GetMapping("/vaccine-types")
    public ResponseEntity<List<LoaiVacXin>> getVaccineTypes() {
        return ResponseEntity.ok(inventoryService.getAllLoaiVacXin());
    }

    @GetMapping("/vaccine-list")
    public ResponseEntity<List<VacXin>> getVaccinesList() {
        return ResponseEntity.ok(vacXinRepository.findAllAvailable());
    }

    @GetMapping("/suppliers")
    public ResponseEntity<List<NhaCungCap>> getSuppliers() {
        return ResponseEntity.ok(nhaCungCapRepository.findByFlagDeleteFalseOrFlagDeleteIsNull());
    }

    // --- API XUẤT KHO & XÓA ---
    @PostMapping("/vaccines/{id}/export")
    public ResponseEntity<?> exportVaccine(@PathVariable("id") Long id, @RequestParam int quantity) {
        try {
            inventoryService.exportVaccine(id, quantity);
            return ResponseEntity.ok().body("Xuất kho thành công");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

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