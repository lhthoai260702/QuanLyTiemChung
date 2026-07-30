package com.vaccine.qltiemchungbackend.service;

import com.vaccine.qltiemchungbackend.entity.TaiKhoan;
import com.vaccine.qltiemchungbackend.repository.TaiKhoanRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CustomUserDetailsServiceTest {

    @Mock
    private TaiKhoanRepository taiKhoanRepository;

    @InjectMocks
    private CustomUserDetailsService customUserDetailsService;

    private TaiKhoan mockTaiKhoan;

    @BeforeEach
    void setUp() {
        // Khởi tạo một đối tượng TaiKhoan giả lập để dùng chung cho các test case
        mockTaiKhoan = new TaiKhoan();
        mockTaiKhoan.setMaTaiKhoan(1L);
        mockTaiKhoan.setTenDangNhap("testuser");
        mockTaiKhoan.setMatKhau("encoded_password");
    }

    @Test
    void loadUserByUsername_UserExistsWithRole_ReturnsUserDetails() {
        // Arrange: Cài đặt hành vi cho Mock Repository
        when(taiKhoanRepository.findByTenDangNhapAndFlagDeleteFalseOrFlagDeleteIsNull("testuser"))
                .thenReturn(Optional.of(mockTaiKhoan));
        when(taiKhoanRepository.findMaQuyenByMaTaiKhoan(1L))
                .thenReturn(1L); // Giả sử quyền 1 là Admin

        // Act: Gọi hàm cần test
        UserDetails userDetails = customUserDetailsService.loadUserByUsername("testuser");

        // Assert: Kiểm tra kết quả trả về
        assertNotNull(userDetails);
        assertEquals("testuser", userDetails.getUsername());
        assertEquals("encoded_password", userDetails.getPassword());

        // Kiểm tra xem UserDetails có chứa quyền ROLE_ADMIN không
        assertTrue(userDetails.getAuthorities().stream()
                .anyMatch(auth -> auth.getAuthority().equals("ROLE_ADMIN")));

        // Đảm bảo các hàm trong repository đã được gọi đúng 1 lần
        verify(taiKhoanRepository, times(1)).findByTenDangNhapAndFlagDeleteFalseOrFlagDeleteIsNull("testuser");
        verify(taiKhoanRepository, times(1)).findMaQuyenByMaTaiKhoan(1L);
    }

    @Test
    void loadUserByUsername_UserExistsNoRole_ReturnsUserDetailsWithRoleUser() {
        // Arrange
        when(taiKhoanRepository.findByTenDangNhapAndFlagDeleteFalseOrFlagDeleteIsNull("testuser"))
                .thenReturn(Optional.of(mockTaiKhoan));
        // Giả lập DB trả về null cho mã quyền
        when(taiKhoanRepository.findMaQuyenByMaTaiKhoan(1L))
                .thenReturn(null);

        // Act
        UserDetails userDetails = customUserDetailsService.loadUserByUsername("testuser");

        // Assert
        assertNotNull(userDetails);
        assertEquals("testuser", userDetails.getUsername());

        // Nếu mã quyền null, hệ thống phải gán mặc định là ROLE_USER
        assertTrue(userDetails.getAuthorities().stream()
                .anyMatch(auth -> auth.getAuthority().equals("ROLE_USER")));
    }

    @Test
    void loadUserByUsername_UserNotFound_ThrowsException() {
        // Arrange: Giả lập không tìm thấy user trong DB
        when(taiKhoanRepository.findByTenDangNhapAndFlagDeleteFalseOrFlagDeleteIsNull("unknown_user"))
                .thenReturn(Optional.empty());

        // Act & Assert: Kiểm tra xem hàm có ném ra lỗi UsernameNotFoundException không
        UsernameNotFoundException exception = assertThrows(
                UsernameNotFoundException.class,
                () -> customUserDetailsService.loadUserByUsername("unknown_user")
        );

        // Kiểm tra câu thông báo lỗi
        assertEquals("Không tìm thấy người dùng với tên đăng nhập: unknown_user", exception.getMessage());

        // Đảm bảo hàm lấy quyền không bao giờ được gọi tới vì đã bị ngắt bởi Exception ở trên
        verify(taiKhoanRepository, never()).findMaQuyenByMaTaiKhoan(anyLong());
    }
}