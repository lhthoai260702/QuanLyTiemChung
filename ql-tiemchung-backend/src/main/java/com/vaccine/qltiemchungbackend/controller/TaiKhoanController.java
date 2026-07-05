package com.vaccine.qltiemchungbackend.controller;

import com.vaccine.qltiemchungbackend.dto.AccountCreationDTO;
import com.vaccine.qltiemchungbackend.dto.AccountDTO;
import com.vaccine.qltiemchungbackend.service.TaiKhoanService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * TaiKhoanController
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
public class TaiKhoanController {

    @Autowired
    private TaiKhoanService taiKhoanService;

    /**
     * Lấy toàn bộ danh sách tài khoản
     * API: GET http://localhost:8080/api/admin/accounts
     *
     * @return ResponseEntity<List<AccountDTO>>
     */
    @GetMapping("/accounts")
    public ResponseEntity<List<AccountDTO>> getAllAccounts() {
        return ResponseEntity.ok(taiKhoanService.getAllAccounts());
    }

    /**
     * Tạo tài khoản mới và phân quyền
     *
     * @param request dữ liệu khởi tạo tài khoản
     * @return ResponseEntity<?>
     */
    @PostMapping("/accounts")
    public ResponseEntity<?> createAccount(@RequestBody AccountCreationDTO request) {
        try {
            taiKhoanService.createAccount(request);
            return ResponseEntity.ok().body("{\"message\": \"Tạo tài khoản và phân quyền thành công!\"}");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("{\"error\": \"Lỗi: " + e.getMessage() + "\"}");
        }
    }

    /**
     * Cập nhật thông tin tài khoản
     *
     * @param id      mã tài khoản cần cập nhật
     * @param request dữ liệu cập nhật
     * @return ResponseEntity<?>
     */
    @PutMapping("/accounts/{id}")
    public ResponseEntity<?> updateAccount(@PathVariable Long id, @RequestBody AccountCreationDTO request) {
        try {
            taiKhoanService.updateAccount(id, request);
            return ResponseEntity.ok().body("{\"message\": \"Cập nhật thành công!\"}");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("{\"error\": \"Lỗi: " + e.getMessage() + "\"}");
        }
    }

    /**
     * Xóa tài khoản
     *
     * @param id mã tài khoản cần xóa
     * @return ResponseEntity<?>
     */
    @DeleteMapping("/accounts/{id}")
    public ResponseEntity<?> deleteAccount(@PathVariable Long id) {
        try {
            taiKhoanService.deleteAccount(id);
            return ResponseEntity.ok().body("{\"message\": \"Xóa tài khoản thành công!\"}");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("{\"error\": \"Lỗi: " + e.getMessage() + "\"}");
        }
    }
}