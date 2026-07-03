package com.vaccine.qltiemchungbackend.controller;

import com.vaccine.qltiemchungbackend.dto.CustomerTransactionDTO;
import com.vaccine.qltiemchungbackend.dto.SupplierTransactionDTO;
import com.vaccine.qltiemchungbackend.dto.VaccinePriceDTO;
import com.vaccine.qltiemchungbackend.service.FinanceService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * FinanceController
 * * Version 1.0
 * * Date: 03-07-2026
 * * Copyright
 * * Modification Logs:
 * DATE       AUTHOR    DESCRIPTION
 * -----------------------------------------------------------------------
 * 03-07-2026 lhthoai   Create
 */
@RestController
@RequestMapping("/api/finance")
@CrossOrigin(origins = "http://localhost:3000")
public class FinanceController {

    @Autowired
    private FinanceService financeService;

    /**
     * Lấy danh sách tất cả các giá vắc-xin
     *
     * @return ResponseEntity<List<VaccinePriceDTO>>
     */
    @GetMapping("/vaccine-prices")
    public ResponseEntity<List<VaccinePriceDTO>> getAllVaccinePrices() {
        return ResponseEntity.ok(financeService.getAllVaccinePrices());
    }

    /**
     * Cập nhật thông tin giá của một loại vắc-xin
     *
     * @param id      mã giá vắc-xin
     * @param request dữ liệu giá cập nhật
     * @return ResponseEntity<?>
     */
    @PutMapping("/vaccine-prices/{id}")
    public ResponseEntity<?> updateVaccinePrice(@PathVariable Long id, @RequestBody VaccinePriceDTO request) {
        try {
            financeService.updateVaccinePrice(id, request);
            return ResponseEntity.ok().body("{\"message\": \"Cập nhật giá thành công!\"}");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("{\"error\": \"" + e.getMessage() + "\"}");
        }
    }

    /**
     * Xóa mềm giá vắc-xin theo mã
     *
     * @param id mã giá vắc-xin
     * @return ResponseEntity<?>
     */
    @DeleteMapping("/vaccine-prices/{id}")
    public ResponseEntity<?> deleteVaccinePrice(@PathVariable Long id) {
        try {
            financeService.deleteVaccinePrice(id);
            return ResponseEntity.ok().body("{\"message\": \"Xóa mềm thành công!\"}");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("{\"error\": \"" + e.getMessage() + "\"}");
        }
    }

    /**
     * Lấy danh sách toàn bộ hóa đơn/giao dịch của khách hàng
     *
     * @return ResponseEntity<List<CustomerTransactionDTO>>
     */
    @GetMapping("/customer-transactions")
    public ResponseEntity<List<CustomerTransactionDTO>> getAllCustomerTransactions() {
        return ResponseEntity.ok(financeService.getAllCustomerTransactions());
    }

    /**
     * Cập nhật thông tin giao dịch của khách hàng
     *
     * @param id      mã giao dịch khách hàng
     * @param request dữ liệu giao dịch cập nhật
     * @return ResponseEntity<?>
     */
    @PutMapping("/customer-transactions/{id}")
    public ResponseEntity<?> updateCustomerTransaction(@PathVariable Long id, @RequestBody CustomerTransactionDTO request) {
        try {
            financeService.updateCustomerTransaction(id, request);
            return ResponseEntity.ok().body("{\"message\": \"Cập nhật hóa đơn thành công!\"}");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("{\"error\": \"" + e.getMessage() + "\"}");
        }
    }

    /**
     * Xóa giao dịch của khách hàng
     *
     * @param id mã giao dịch khách hàng
     * @return ResponseEntity<?>
     */
    @DeleteMapping("/customer-transactions/{id}")
    public ResponseEntity<?> deleteCustomerTransaction(@PathVariable Long id) {
        try {
            financeService.deleteCustomerTransaction(id);
            return ResponseEntity.ok().body("{\"message\": \"Xóa hóa đơn thành công!\"}");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("{\"error\": \"" + e.getMessage() + "\"}");
        }
    }

    /**
     * Lấy danh sách toàn bộ giao dịch với nhà cung cấp
     *
     * @return ResponseEntity<List<SupplierTransactionDTO>>
     */
    @GetMapping("/supplier-transactions")
    public ResponseEntity<List<SupplierTransactionDTO>> getAllSupplierTransactions() {
        return ResponseEntity.ok(financeService.getAllSupplierTransactions());
    }

    /**
     * Tạo mới một giao dịch với nhà cung cấp
     *
     * @param request thông tin giao dịch mới
     * @return ResponseEntity<?>
     */
    @PostMapping("/supplier-transactions")
    public ResponseEntity<?> createSupplierTransaction(@RequestBody SupplierTransactionDTO request) {
        try {
            financeService.createSupplierTransaction(request);
            return ResponseEntity.ok().body("{\"message\": \"Tạo mới thành công!\"}");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("{\"error\": \"Lỗi tạo mới\"}");
        }
    }

    /**
     * Cập nhật thông tin giao dịch với nhà cung cấp
     *
     * @param id      mã giao dịch nhà cung cấp
     * @param request dữ liệu giao dịch cập nhật
     * @return ResponseEntity<?>
     */
    @PutMapping("/supplier-transactions/{id}")
    public ResponseEntity<?> updateSupplierTransaction(@PathVariable Long id, @RequestBody SupplierTransactionDTO request) {
        try {
            financeService.updateSupplierTransaction(id, request);
            return ResponseEntity.ok().body("{\"message\": \"Chỉnh sửa thành công!\"}");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("{\"error\": \"Lỗi chỉnh sửa\"}");
        }
    }

    /**
     * Xóa giao dịch với nhà cung cấp
     *
     * @param id mã giao dịch nhà cung cấp
     * @return ResponseEntity<?>
     */
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