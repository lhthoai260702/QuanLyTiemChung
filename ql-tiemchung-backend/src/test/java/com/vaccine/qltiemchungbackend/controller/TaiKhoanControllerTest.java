package com.vaccine.qltiemchungbackend.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.vaccine.qltiemchungbackend.dto.AccountCreationDTO;
import com.vaccine.qltiemchungbackend.dto.AccountDTO;
import com.vaccine.qltiemchungbackend.service.TaiKhoanService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.filter.CharacterEncodingFilter;

import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
class TaiKhoanControllerTest {

    private MockMvc mockMvc;

    @Mock
    private TaiKhoanService taiKhoanService;

    @InjectMocks
    private TaiKhoanController taiKhoanController;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @BeforeEach
    void setUp() {
        // Cấu hình MockMvc với CharacterEncodingFilter để hỗ trợ Tiếng Việt (UTF-8)
        mockMvc = MockMvcBuilders.standaloneSetup(taiKhoanController)
                .addFilters(new CharacterEncodingFilter("UTF-8", true))
                .build();
    }

    // ==========================================
    // TEST GET ALL ACCOUNTS
    // ==========================================

    @Test
    void getAllAccounts_Success() throws Exception {
        // Arrange
        AccountDTO account1 = new AccountDTO();
        // Cài đặt các giá trị giả định cho account1 (tùy theo cấu trúc AccountDTO của bạn)
        // Ví dụ: account1.setMaTaiKhoan(1L); account1.setTenDangNhap("admin");

        when(taiKhoanService.getAllAccounts()).thenReturn(List.of(account1));

        // Act & Assert
        mockMvc.perform(get("/api/admin/accounts"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1));

        verify(taiKhoanService, times(1)).getAllAccounts();
    }

    // ==========================================
    // TEST CREATE ACCOUNT
    // ==========================================

    @Test
    void createAccount_Success() throws Exception {
        // Arrange
        AccountCreationDTO requestDto = new AccountCreationDTO();
        requestDto.setTenDangNhap("newuser");
        requestDto.setMatKhau("123456");

        doNothing().when(taiKhoanService).createAccount(any(AccountCreationDTO.class));

        // Act & Assert
        mockMvc.perform(post("/api/admin/accounts")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(requestDto)))
                .andExpect(status().isOk())
                .andExpect(content().json("{\"message\": \"Tạo tài khoản và phân quyền thành công!\"}"));

        verify(taiKhoanService, times(1)).createAccount(any(AccountCreationDTO.class));
    }

    @Test
    void createAccount_Failure_ReturnsBadRequest() throws Exception {
        // Arrange
        AccountCreationDTO requestDto = new AccountCreationDTO();
        requestDto.setTenDangNhap("existinguser");

        doThrow(new RuntimeException("Tên đăng nhập đã tồn tại")).when(taiKhoanService).createAccount(any(AccountCreationDTO.class));

        // Act & Assert
        mockMvc.perform(post("/api/admin/accounts")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(requestDto)))
                .andExpect(status().isBadRequest())
                .andExpect(content().json("{\"error\": \"Lỗi: Tên đăng nhập đã tồn tại\"}"));
    }

    // ==========================================
    // TEST UPDATE ACCOUNT
    // ==========================================

    @Test
    void updateAccount_Success() throws Exception {
        // Arrange
        Long accountId = 1L;
        AccountCreationDTO requestDto = new AccountCreationDTO();
        requestDto.setHoTen("Nguyễn Văn A (Updated)");

        doNothing().when(taiKhoanService).updateAccount(eq(accountId), any(AccountCreationDTO.class));

        // Act & Assert
        mockMvc.perform(put("/api/admin/accounts/{id}", accountId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(requestDto)))
                .andExpect(status().isOk())
                .andExpect(content().json("{\"message\": \"Cập nhật thành công!\"}"));

        verify(taiKhoanService, times(1)).updateAccount(eq(accountId), any(AccountCreationDTO.class));
    }

    @Test
    void updateAccount_Failure_ReturnsBadRequest() throws Exception {
        // Arrange
        Long accountId = 99L;
        AccountCreationDTO requestDto = new AccountCreationDTO();

        doThrow(new RuntimeException("Không tìm thấy tài khoản")).when(taiKhoanService).updateAccount(eq(accountId), any(AccountCreationDTO.class));

        // Act & Assert
        mockMvc.perform(put("/api/admin/accounts/{id}", accountId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(requestDto)))
                .andExpect(status().isBadRequest())
                .andExpect(content().json("{\"error\": \"Lỗi: Không tìm thấy tài khoản\"}"));
    }

    // ==========================================
    // TEST DELETE ACCOUNT
    // ==========================================

    @Test
    void deleteAccount_Success() throws Exception {
        // Arrange
        Long accountId = 1L;

        doNothing().when(taiKhoanService).deleteAccount(accountId);

        // Act & Assert
        mockMvc.perform(delete("/api/admin/accounts/{id}", accountId))
                .andExpect(status().isOk())
                .andExpect(content().json("{\"message\": \"Xóa tài khoản thành công!\"}"));

        verify(taiKhoanService, times(1)).deleteAccount(accountId);
    }

    @Test
    void deleteAccount_Failure_ReturnsBadRequest() throws Exception {
        // Arrange
        Long accountId = 99L;

        doThrow(new RuntimeException("Tài khoản đang có giao dịch, không thể xóa")).when(taiKhoanService).deleteAccount(accountId);

        // Act & Assert
        mockMvc.perform(delete("/api/admin/accounts/{id}", accountId))
                .andExpect(status().isBadRequest())
                .andExpect(content().json("{\"error\": \"Lỗi: Tài khoản đang có giao dịch, không thể xóa\"}"));
    }
}