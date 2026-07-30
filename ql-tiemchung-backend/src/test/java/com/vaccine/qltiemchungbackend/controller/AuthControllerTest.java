package com.vaccine.qltiemchungbackend.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.vaccine.qltiemchungbackend.config.JwtUtils;
import com.vaccine.qltiemchungbackend.dto.LoginRequest;
import com.vaccine.qltiemchungbackend.dto.LoginResponse;
import com.vaccine.qltiemchungbackend.service.AuthService;
import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.filter.CharacterEncodingFilter;

import java.util.HashMap;
import java.util.Map;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
class AuthControllerTest {

    private MockMvc mockMvc;

    @Mock
    private AuthService authService;

    @Mock
    private JwtUtils jwtUtils;

    @InjectMocks
    private AuthController authController;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @BeforeEach
    void setUp() {
        // Sử dụng CharacterEncodingFilter để ép kiểu UTF-8
        mockMvc = MockMvcBuilders.standaloneSetup(authController)
                .addFilters(new CharacterEncodingFilter("UTF-8", true))
                .build();

        // Gán giá trị ảo cho biến @Value("${google.client.id}")
        ReflectionTestUtils.setField(authController, "googleClientId", "test-google-client-id");
    }

    // ==========================================
    // TEST LOGIN
    // ==========================================

    @Test
    void login_Success() throws Exception {
        // Arrange
        LoginRequest request = new LoginRequest();
        request.setUsername("testuser");
        request.setPassword("123456");

        LoginResponse mockResponse = new LoginResponse();
        mockResponse.setSuccess(true);
        mockResponse.setToken("access_token_123");
        mockResponse.setRefreshToken("refresh_token_456");

        when(authService.authenticate(any(LoginRequest.class))).thenReturn(mockResponse);

        // Act & Assert
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.token").value("access_token_123"))
                // Kiểm tra Cookie có được đính kèm đúng cấu hình không
                .andExpect(cookie().value("refreshToken", "refresh_token_456"))
                .andExpect(cookie().httpOnly("refreshToken", true))
                .andExpect(cookie().path("refreshToken", "/"));
    }

    @Test
    void login_Failure_ReturnsUnauthorized() throws Exception {
        // Arrange
        LoginRequest request = new LoginRequest();
        request.setUsername("wronguser");
        request.setPassword("wrongpass");

        LoginResponse mockResponse = new LoginResponse();
        mockResponse.setSuccess(false);
        mockResponse.setMessage("Sai tài khoản hoặc mật khẩu");

        when(authService.authenticate(any(LoginRequest.class))).thenReturn(mockResponse);

        // Act & Assert
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value("Sai tài khoản hoặc mật khẩu"))
                .andExpect(cookie().doesNotExist("refreshToken"));
    }

    // ==========================================
    // TEST GOOGLE LOGIN
    // ==========================================

    @Test
    void googleLogin_EmptyToken_ReturnsBadRequest() throws Exception {
        // Arrange
        Map<String, String> request = new HashMap<>();
        request.put("token", "");

        // Act & Assert
        // Cập nhật: Kiểm tra jsonPath thay vì content().string()
        mockMvc.perform(post("/api/auth/google")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Token không được để trống"));
    }

    @Test
    void googleLogin_InvalidToken_ThrowsException_ReturnsInternalError() throws Exception {
        // Arrange
        Map<String, String> request = new HashMap<>();
        request.put("token", "fake-invalid-token");

        // Act & Assert
        // Cập nhật: Kiểm tra jsonPath
        mockMvc.perform(post("/api/auth/google")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isInternalServerError())
                .andExpect(jsonPath("$.message").value("Lỗi hệ thống khi xác thực Google"));
    }

    // ==========================================
    // TEST REFRESH TOKEN
    // ==========================================

    @Test
    void refreshToken_Success() throws Exception {
        // Arrange
        String validRefreshToken = "valid_refresh_token";
        Cookie cookie = new Cookie("refreshToken", validRefreshToken);

        when(jwtUtils.validateToken(validRefreshToken)).thenReturn(true);
        when(jwtUtils.getUsernameFromToken(validRefreshToken)).thenReturn("testuser");
        when(jwtUtils.generateToken("testuser")).thenReturn("new_access_token");

        // Act & Assert
        mockMvc.perform(post("/api/auth/refresh")
                        .cookie(cookie))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.token").value("new_access_token"));
    }

    @Test
    void refreshToken_InvalidOrMissing_ReturnsUnauthorized() throws Exception {
        // Arrange
        String invalidRefreshToken = "invalid_refresh_token";
        Cookie cookie = new Cookie("refreshToken", invalidRefreshToken);

        when(jwtUtils.validateToken(invalidRefreshToken)).thenReturn(false);

        // Act & Assert
        // Cập nhật: Kiểm tra jsonPath
        mockMvc.perform(post("/api/auth/refresh")
                        .cookie(cookie))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").value("Refresh Token không hợp lệ hoặc đã hết hạn"));
    }

    @Test
    void refreshToken_NoCookie_ReturnsUnauthorized() throws Exception {
        // Act & Assert
        // Cập nhật: Kiểm tra jsonPath
        mockMvc.perform(post("/api/auth/refresh"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").value("Refresh Token không hợp lệ hoặc đã hết hạn"));
    }

    // ==========================================
    // TEST LOGOUT
    // ==========================================

    @Test
    void logout_Success() throws Exception {
        // Act & Assert
        mockMvc.perform(post("/api/auth/logout"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Đăng xuất thành công"))
                // Kiểm tra Cookie có bị xóa (maxAge = 0) hay chưa
                .andExpect(cookie().value("refreshToken", ""))
                .andExpect(cookie().maxAge("refreshToken", 0));
    }
}