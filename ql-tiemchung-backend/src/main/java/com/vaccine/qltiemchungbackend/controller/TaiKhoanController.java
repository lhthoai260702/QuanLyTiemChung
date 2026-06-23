package com.vaccine.qltiemchungbackend.controller;

import com.vaccine.qltiemchungbackend.dto.AccountCreationDTO;
import com.vaccine.qltiemchungbackend.dto.AccountDTO;
import com.vaccine.qltiemchungbackend.service.TaiKhoanService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
@CrossOrigin(origins = "http://localhost:3000") // Cho phép Frontend kết nối
public class TaiKhoanController {

    @Autowired
    private TaiKhoanService taiKhoanService;

    // API lấy toàn bộ user: GET http://localhost:8080/api/admin/accounts
    @GetMapping("/accounts")
    public ResponseEntity<List<AccountDTO>> getAllAccounts() {
        return ResponseEntity.ok(taiKhoanService.getAllAccounts());
    }

    @PostMapping("/accounts")
    public ResponseEntity<?> createAccount(@RequestBody AccountCreationDTO request) {
        try {
            taiKhoanService.createAccount(request);
            return ResponseEntity.ok().body("{\"message\": \"Tạo tài khoản và phân quyền thành công!\"}");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("{\"error\": \"Lỗi: " + e.getMessage() + "\"}");
        }
    }

    @PutMapping("/accounts/{id}")
    public ResponseEntity<?> updateAccount(@PathVariable Long id, @RequestBody AccountCreationDTO request) {
        try {
            taiKhoanService.updateAccount(id, request);
            return ResponseEntity.ok().body("{\"message\": \"Cập nhật thành công!\"}");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("{\"error\": \"Lỗi: " + e.getMessage() + "\"}");
        }
    }

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