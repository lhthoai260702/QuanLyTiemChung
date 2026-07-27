package com.vaccine.qltiemchungbackend.controller;

import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import com.vaccine.qltiemchungbackend.config.JwtUtils;
import com.vaccine.qltiemchungbackend.dto.LoginRequest;
import com.vaccine.qltiemchungbackend.dto.LoginResponse;
import com.vaccine.qltiemchungbackend.service.AuthService;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Collections;
import java.util.Map;

/**
 * AuthController
 * * Version 1.0
 * * Date: 03-07-2026
 * * Copyright
 * * Modification Logs:
 * DATE        AUTHOR    DESCRIPTION
 * -----------------------------------------------------------------------
 * 03-07-2026 lhthoai   Create
 * 21-07-2026 lhthoai   Add Google OAuth2 login endpoint
 * 27-07-2026 lhthoai   Tích hợp HttpOnly Cookie cho Refresh Token
 */
@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "http://localhost:3000", allowCredentials = "true") // Bắt buộc để Frontend đính kèm Cookie
public class AuthController {

    @Autowired
    private AuthService authService;

    @Autowired
    private JwtUtils jwtUtils;

    @Value("${google.client.id:YOUR_GOOGLE_CLIENT_ID}")
    private String googleClientId;

    /**
     * Helper Method: Gắn Refresh Token vào HttpOnly Cookie
     *
     * @param response     HttpServletResponse
     * @param refreshToken Chuỗi Refresh Token
     */
    private void setRefreshTokenCookie(HttpServletResponse response, String refreshToken) {
        Cookie cookie = new Cookie("refreshToken", refreshToken);
        cookie.setHttpOnly(true); // Tránh bị Frontend đọc bằng Javascript (Chống XSS)
        cookie.setSecure(false); // Sửa thành true nếu deploy chạy HTTPS
        cookie.setPath("/");
        cookie.setMaxAge(7 * 24 * 60 * 60); // Sống trong 7 ngày
        response.addCookie(cookie);
    }

    /**
     * Xử lý yêu cầu đăng nhập từ phía người dùng bằng tài khoản nội bộ
     *
     * @param request      chứa thông tin tài khoản và mật khẩu
     * @param httpResponse đối tượng response để gắn cookie
     * @return ResponseEntity<LoginResponse>
     */
    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@RequestBody LoginRequest request, HttpServletResponse httpResponse) {
        LoginResponse response = authService.authenticate(request);

        if (response.isSuccess()) {
            // Lấy Refresh Token từ Service và gắn vào Cookie
            setRefreshTokenCookie(httpResponse, response.getRefreshToken());
            return ResponseEntity.ok(response);
        } else {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
        }
    }

    /**
     * Xử lý yêu cầu đăng nhập bằng Google OAuth2
     *
     * @param request      chứa chuỗi token được Frontend gửi lên từ Google
     * @param httpResponse đối tượng response để gắn cookie
     * @return ResponseEntity<?>
     */
    @PostMapping("/google")
    public ResponseEntity<?> googleLogin(@RequestBody Map<String, String> request, HttpServletResponse httpResponse) {
        String googleToken = request.get("token");

        if (googleToken == null || googleToken.isEmpty()) {
            return ResponseEntity.badRequest().body("Token không được để trống");
        }

        try {
            GoogleIdTokenVerifier verifier = new GoogleIdTokenVerifier.Builder(new NetHttpTransport(), new GsonFactory())
                    .setAudience(Collections.singletonList(googleClientId))
                    .build();

            GoogleIdToken idToken = verifier.verify(googleToken);

            if (idToken != null) {
                GoogleIdToken.Payload payload = idToken.getPayload();
                String email = payload.getEmail();
                String name = (String) payload.get("name");

                LoginResponse response = authService.processGoogleLogin(email, name);

                if (response.isSuccess()) {
                    // Xử lý gắn Cookie như hàm đăng nhập thường
                    setRefreshTokenCookie(httpResponse, response.getRefreshToken());
                    return ResponseEntity.ok(response);
                } else {
                    return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
                }
            } else {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Token Google không hợp lệ hoặc đã hết hạn");
            }
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Lỗi hệ thống khi xác thực Google");
        }
    }

    /**
     * Cấp phát lại Access Token mới dựa trên Refresh Token lưu trong Cookie
     *
     * @param refreshToken token lấy tự động từ Cookie
     * @return ResponseEntity<?>
     */
    @PostMapping("/refresh")
    public ResponseEntity<?> refreshToken(@CookieValue(name = "refreshToken", required = false) String refreshToken) {
        if (refreshToken == null || !jwtUtils.validateToken(refreshToken)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Refresh Token không hợp lệ hoặc đã hết hạn");
        }

        // Tạo Access Token mới
        String username = jwtUtils.getUsernameFromToken(refreshToken);
        String newAccessToken = jwtUtils.generateToken(username);

        LoginResponse response = new LoginResponse();
        response.setSuccess(true);
        response.setToken(newAccessToken);

        return ResponseEntity.ok(response);
    }

    /**
     * Đăng xuất và xóa Cookie
     *
     * @param response HttpServletResponse
     * @return ResponseEntity<?>
     */
    @PostMapping("/logout")
    public ResponseEntity<?> logout(HttpServletResponse response) {
        Cookie cookie = new Cookie("refreshToken", null);
        cookie.setHttpOnly(true);
        cookie.setSecure(false);
        cookie.setPath("/");
        cookie.setMaxAge(0); // Đặt thời gian sống = 0 để trình duyệt xóa Cookie
        response.addCookie(cookie);

        return ResponseEntity.ok().body("{\"message\": \"Đăng xuất thành công\"}");
    }
}