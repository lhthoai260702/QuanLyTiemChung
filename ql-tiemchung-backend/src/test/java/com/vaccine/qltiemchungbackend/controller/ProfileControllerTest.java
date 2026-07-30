package com.vaccine.qltiemchungbackend.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.vaccine.qltiemchungbackend.dto.ProfileDTO;
import com.vaccine.qltiemchungbackend.service.ProfileService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.filter.CharacterEncodingFilter;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
class ProfileControllerTest {

    private MockMvc mockMvc;

    @Mock
    private ProfileService profileService;

    @InjectMocks
    private ProfileController profileController;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @BeforeEach
    void setUp() {
        // Cấu hình MockMvc và thêm bộ lọc UTF-8 để không bị lỗi font tiếng Việt khi assert JSON
        mockMvc = MockMvcBuilders.standaloneSetup(profileController)
                .addFilters(new CharacterEncodingFilter("UTF-8", true))
                .build();
    }

    // ==========================================
    // TEST GET PROFILE
    // ==========================================

    @Test
    void getProfile_Success() throws Exception {
        // Arrange
        String username = "testuser";
        // Giả lập đối tượng Authentication của Spring Security
        Authentication authentication = new UsernamePasswordAuthenticationToken(username, "password123");

        ProfileDTO mockProfile = new ProfileDTO();
        mockProfile.setTenDangNhap(username);
        mockProfile.setHoTen("Nguyễn Văn A");
        // Giả sử DTO của bạn có email, sdt, ...

        when(profileService.getProfile(username)).thenReturn(mockProfile);

        // Act & Assert
        mockMvc.perform(get("/api/profile")
                        .principal(authentication)) // Truyền principal vào request
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.tenDangNhap").value(username))
                .andExpect(jsonPath("$.hoTen").value("Nguyễn Văn A"));

        verify(profileService, times(1)).getProfile(username);
    }

    // ==========================================
    // TEST UPDATE PROFILE
    // ==========================================

    @Test
    void updateProfile_Success() throws Exception {
        // Arrange
        String username = "testuser";
        Authentication authentication = new UsernamePasswordAuthenticationToken(username, "password123");

        ProfileDTO requestDto = new ProfileDTO();
        requestDto.setHoTen("Nguyễn Văn B (Đã cập nhật)");

        doNothing().when(profileService).updateProfile(eq(username), any(ProfileDTO.class));

        // Act & Assert
        mockMvc.perform(put("/api/profile")
                        .principal(authentication)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(requestDto)))
                .andExpect(status().isOk())
                .andExpect(content().json("{\"message\": \"Cập nhật thông tin cá nhân thành công!\"}"));

        verify(profileService, times(1)).updateProfile(eq(username), any(ProfileDTO.class));
    }

    @Test
    void updateProfile_Failure_ReturnsBadRequest() throws Exception {
        // Arrange
        String username = "testuser";
        Authentication authentication = new UsernamePasswordAuthenticationToken(username, "password123");

        ProfileDTO requestDto = new ProfileDTO();
        requestDto.setHoTen("Tên lỗi");

        doThrow(new RuntimeException("Lỗi cập nhật CSDL")).when(profileService).updateProfile(eq(username), any(ProfileDTO.class));

        // Act & Assert
        mockMvc.perform(put("/api/profile")
                        .principal(authentication)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(requestDto)))
                .andExpect(status().isBadRequest())
                .andExpect(content().json("{\"error\": \"Lỗi cập nhật CSDL\"}"));

        verify(profileService, times(1)).updateProfile(eq(username), any(ProfileDTO.class));
    }
}