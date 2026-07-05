package com.vaccine.qltiemchungbackend.controller;

import com.vaccine.qltiemchungbackend.dto.LoginRequest;
import com.vaccine.qltiemchungbackend.dto.LoginResponse;
import com.vaccine.qltiemchungbackend.service.AuthService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * AuthController
 * * Version 1.0
 * * Date: 03-07-2026
 * * Copyright
 * * Modification Logs:
 * DATE       AUTHOR    DESCRIPTION
 * -----------------------------------------------------------------------
 * 03-07-2026 lhthoai   Create
 */
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private AuthService authService;

    /**
     * Xử lý yêu cầu đăng nhập từ phía người dùng
     *
     * @param request chứa thông tin tài khoản và mật khẩu
     * @return ResponseEntity<LoginResponse> trạng thái và dữ liệu phản hồi (bao gồm JWT token nếu thành công)
     */
    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@RequestBody LoginRequest request) {
        LoginResponse response = authService.authenticate(request);

        if (response.isSuccess()) {
            return ResponseEntity.ok(response);
        } else {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
        }
    }
}