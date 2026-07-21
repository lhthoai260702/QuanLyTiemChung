package com.vaccine.qltiemchungbackend.controller;

import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import com.vaccine.qltiemchungbackend.dto.LoginRequest;
import com.vaccine.qltiemchungbackend.dto.LoginResponse;
import com.vaccine.qltiemchungbackend.service.AuthService;
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
 */
@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
public class AuthController {

    @Autowired
    private AuthService authService;

    // Lấy Client ID từ cấu hình application.properties (nếu có), nếu không lấy chuỗi mặc định
    @Value("${google.client.id:YOUR_GOOGLE_CLIENT_ID}")
    private String googleClientId;

    /**
     * Xử lý yêu cầu đăng nhập từ phía người dùng bằng tài khoản nội bộ
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

    /**
     * Xử lý yêu cầu đăng nhập bằng Google OAuth2
     *
     * @param request chứa chuỗi token được Frontend gửi lên từ Google
     * @return ResponseEntity<LoginResponse> trạng thái và dữ liệu phản hồi
     */
    @PostMapping("/google")
    public ResponseEntity<?> googleLogin(@RequestBody Map<String, String> request) {
        String googleToken = request.get("token");

        if (googleToken == null || googleToken.isEmpty()) {
            return ResponseEntity.badRequest().body("Token không được để trống");
        }

        try {
            // Khởi tạo bộ xác thực Token của Google
            GoogleIdTokenVerifier verifier = new GoogleIdTokenVerifier.Builder(new NetHttpTransport(), new GsonFactory())
                    .setAudience(Collections.singletonList(googleClientId))
                    .build();

            // Xác thực token
            GoogleIdToken idToken = verifier.verify(googleToken);

            if (idToken != null) {
                GoogleIdToken.Payload payload = idToken.getPayload();

                // Trích xuất thông tin người dùng từ Google
                String email = payload.getEmail();
                String name = (String) payload.get("name");

                // Gọi tới AuthService để xử lý logic tìm/tạo tài khoản và cấp phát JWT nội bộ
                // TODO: Bạn cần viết thêm hàm processGoogleLogin trong AuthService
                LoginResponse response = authService.processGoogleLogin(email, name);

                if (response.isSuccess()) {
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
}