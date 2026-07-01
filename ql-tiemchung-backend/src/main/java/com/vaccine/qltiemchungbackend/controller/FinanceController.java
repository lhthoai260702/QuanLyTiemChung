package com.vaccine.qltiemchungbackend.controller;

import com.vaccine.qltiemchungbackend.dto.CustomerTransactionDTO;
import com.vaccine.qltiemchungbackend.dto.SupplierTransactionDTO;
import com.vaccine.qltiemchungbackend.dto.VaccinePriceDTO;
import com.vaccine.qltiemchungbackend.service.FinanceService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/finance")
@CrossOrigin(origins = "http://localhost:3000")
public class FinanceController {

    @Autowired
    private FinanceService financeService;

    @GetMapping("/vaccine-prices")
    public ResponseEntity<List<VaccinePriceDTO>> getAllVaccinePrices() {
        return ResponseEntity.ok(financeService.getAllVaccinePrices());
    }

    @PutMapping("/vaccine-prices/{id}")
    public ResponseEntity<?> updateVaccinePrice(@PathVariable Long id, @RequestBody VaccinePriceDTO request) {
        try {
            financeService.updateVaccinePrice(id, request);
            return ResponseEntity.ok().body("{\"message\": \"Cập nhật giá thành công!\"}");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("{\"error\": \"" + e.getMessage() + "\"}");
        }
    }

    @DeleteMapping("/vaccine-prices/{id}")
    public ResponseEntity<?> deleteVaccinePrice(@PathVariable Long id) {
        try {
            financeService.deleteVaccinePrice(id);
            return ResponseEntity.ok().body("{\"message\": \"Xóa mềm thành công!\"}");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("{\"error\": \"" + e.getMessage() + "\"}");
        }
    }

    @GetMapping("/customer-transactions")
    public ResponseEntity<List<CustomerTransactionDTO>> getAllCustomerTransactions() {
        return ResponseEntity.ok(financeService.getAllCustomerTransactions());
    }

    @PutMapping("/customer-transactions/{id}")
    public ResponseEntity<?> updateCustomerTransaction(@PathVariable Long id, @RequestBody CustomerTransactionDTO request) {
        try {
            financeService.updateCustomerTransaction(id, request);
            return ResponseEntity.ok().body("{\"message\": \"Cập nhật hóa đơn thành công!\"}");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("{\"error\": \"" + e.getMessage() + "\"}");
        }
    }

    @DeleteMapping("/customer-transactions/{id}")
    public ResponseEntity<?> deleteCustomerTransaction(@PathVariable Long id) {
        try {
            financeService.deleteCustomerTransaction(id);
            return ResponseEntity.ok().body("{\"message\": \"Xóa hóa đơn thành công!\"}");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("{\"error\": \"" + e.getMessage() + "\"}");
        }
    }

    @GetMapping("/supplier-transactions")
    public ResponseEntity<List<SupplierTransactionDTO>> getAllSupplierTransactions() {
        return ResponseEntity.ok(financeService.getAllSupplierTransactions());
    }

    @PostMapping("/supplier-transactions")
    public ResponseEntity<?> createSupplierTransaction(@RequestBody SupplierTransactionDTO request) {
        try {
            financeService.createSupplierTransaction(request);
            return ResponseEntity.ok().body("{\"message\": \"Tạo mới thành công!\"}");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("{\"error\": \"Lỗi tạo mới\"}");
        }
    }

    @PutMapping("/supplier-transactions/{id}")
    public ResponseEntity<?> updateSupplierTransaction(@PathVariable Long id, @RequestBody SupplierTransactionDTO request) {
        try {
            financeService.updateSupplierTransaction(id, request);
            return ResponseEntity.ok().body("{\"message\": \"Chỉnh sửa thành công!\"}");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("{\"error\": \"Lỗi chỉnh sửa\"}");
        }
    }

    @DeleteMapping("/supplier-transactions/{id}")
    public ResponseEntity<?> deleteSupplierTransaction(@PathVariable Long id) {
        try {
            financeService.deleteSupplierTransaction(id);
            return ResponseEntity.ok().body("{\"message\": \"Xóa thành công!\"}");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("{\"error\": \"Lỗi xóa\"}");
        }
    }
}