package com.vaccine.qltiemchungbackend.service;

import com.vaccine.qltiemchungbackend.dto.ProfileDTO;
import com.vaccine.qltiemchungbackend.dto.ProfileProjection;
import com.vaccine.qltiemchungbackend.entity.TaiKhoan;
import com.vaccine.qltiemchungbackend.repository.TaiKhoanRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ProfileServiceTest {

    @Mock
    private TaiKhoanRepository taiKhoanRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @InjectMocks
    private ProfileService profileService;

    private TaiKhoan mockTaiKhoan;
    private ProfileDTO mockDTO;

    @BeforeEach
    void setUp() {
        mockTaiKhoan = new TaiKhoan();
        mockTaiKhoan.setMaTaiKhoan(1L);
        mockTaiKhoan.setTenDangNhap("user123");
        mockTaiKhoan.setMatKhau("old_password");

        mockDTO = new ProfileDTO();
        mockDTO.setHoTen("Nguyen Van A");
        mockDTO.setCmnd("123456789");
        mockDTO.setNoiO("Ho Chi Minh");
        mockDTO.setMoTa("Mo ta test");
        mockDTO.setEmail("test@gmail.com");
        mockDTO.setNgaySinh("2000-01-01");
        mockDTO.setDiaChi("Quan 1");
        mockDTO.setNguoiGiamHo("Nguyen Van B");
        mockDTO.setSdt("0909123456");
        mockDTO.setGioiTinh("Nam");
        mockDTO.setNamSinh(2000);
    }

    // ==========================================
    // TEST GET PROFILE
    // ==========================================

    @Test
    void getProfile_Success() {
        // Arrange: Dùng mock() để tạo đối tượng ảo từ Interface ProfileProjection
        ProfileProjection mockProjection = mock(ProfileProjection.class);
        when(mockProjection.getTenDangNhap()).thenReturn("user123");
        when(mockProjection.getHoTen()).thenReturn("Nguyen Van A");
        when(mockProjection.getEmail()).thenReturn("test@gmail.com");

        when(taiKhoanRepository.findProfileByUsername("user123")).thenReturn(Optional.of(mockProjection));

        // Act
        ProfileDTO result = profileService.getProfile("user123");

        // Assert
        assertNotNull(result);
        assertEquals("user123", result.getTenDangNhap());
        assertEquals("Nguyen Van A", result.getHoTen());
        assertEquals("test@gmail.com", result.getEmail());
    }

    @Test
    void getProfile_NotFound_ThrowsException() {
        // Arrange
        when(taiKhoanRepository.findProfileByUsername("unknown_user")).thenReturn(Optional.empty());

        // Act & Assert
        RuntimeException exception = assertThrows(RuntimeException.class,
                () -> profileService.getProfile("unknown_user"));
        assertEquals("Không tìm thấy thông tin cá nhân", exception.getMessage());
    }

    // ==========================================
    // TEST UPDATE PROFILE
    // ==========================================

    @Test
    void updateProfile_UserNotFound_ThrowsException() {
        // Arrange
        when(taiKhoanRepository.findByTenDangNhapAndFlagDeleteFalseOrFlagDeleteIsNull("unknown"))
                .thenReturn(Optional.empty());

        // Act & Assert
        RuntimeException exception = assertThrows(RuntimeException.class,
                () -> profileService.updateProfile("unknown", mockDTO));
        assertEquals("Không tìm thấy tài khoản", exception.getMessage());
    }

    @Test
    void updateProfile_Customer_UpdateExistingProfile_Success() {
        // Arrange: Là Khách hàng (Role 6) và đã có hồ sơ trong bảng BENHNHAN
        when(taiKhoanRepository.findByTenDangNhapAndFlagDeleteFalseOrFlagDeleteIsNull("user123"))
                .thenReturn(Optional.of(mockTaiKhoan));
        when(taiKhoanRepository.findMaQuyenByMaTaiKhoan(1L)).thenReturn(6L);

        // Giả lập lệnh update trả về 1 (tức là đã cập nhật thành công 1 dòng)
        when(taiKhoanRepository.updateBenhNhan(
                eq(1L), anyString(), anyString(), anyString(), anyString(), anyString(), anyString()
        )).thenReturn(1);

        // Act
        profileService.updateProfile("user123", mockDTO);

        // Assert
        verify(taiKhoanRepository, times(1)).save(mockTaiKhoan);
        verify(taiKhoanRepository, times(1)).updateBenhNhan(
                eq(1L), anyString(), anyString(), anyString(), anyString(), anyString(), anyString());
        // Vì đã update thành công (rows = 1), hàm insert sẽ KHÔNG được gọi
        verify(taiKhoanRepository, never()).insertBenhNhan(
                anyLong(), anyString(), anyString(), anyString(), anyString(), anyString(), anyString());
        verify(passwordEncoder, never()).encode(anyString()); // DTO không có pass mới, không encode
    }

    @Test
    void updateProfile_Customer_InsertNewProfile_WithPassword_Success() {
        // Arrange: Khách hàng (Role 6) nhưng chưa có hồ sơ + Có đổi mật khẩu
        mockDTO.setMatKhau("new_password");
        when(taiKhoanRepository.findByTenDangNhapAndFlagDeleteFalseOrFlagDeleteIsNull("user123"))
                .thenReturn(Optional.of(mockTaiKhoan));
        when(taiKhoanRepository.findMaQuyenByMaTaiKhoan(1L)).thenReturn(6L);
        when(passwordEncoder.encode("new_password")).thenReturn("encoded_new_password");

        // Giả lập lệnh update trả về 0 (chưa có dòng nào trong bảng BENHNHAN)
        when(taiKhoanRepository.updateBenhNhan(
                anyLong(), anyString(), anyString(), anyString(), anyString(), anyString(), anyString()
        )).thenReturn(0);

        // Act
        profileService.updateProfile("user123", mockDTO);

        // Assert
        assertEquals("encoded_new_password", mockTaiKhoan.getMatKhau());
        verify(passwordEncoder, times(1)).encode("new_password");
        verify(taiKhoanRepository, times(1)).save(mockTaiKhoan);

        // Vì update trả về 0, hệ thống phải gọi hàm insertBenhNhan
        verify(taiKhoanRepository, times(1)).insertBenhNhan(
                eq(1L), anyString(), anyString(), anyString(), anyString(), anyString(), anyString());
    }

    @Test
    void updateProfile_Employee_UpdateExisting_Success() {
        // Arrange: Là Nhân viên/Quản lý (Role khác 6, VD: Role 1 = Admin)
        when(taiKhoanRepository.findByTenDangNhapAndFlagDeleteFalseOrFlagDeleteIsNull("user123"))
                .thenReturn(Optional.of(mockTaiKhoan));
        when(taiKhoanRepository.findMaQuyenByMaTaiKhoan(1L)).thenReturn(1L);

        // Giả lập lệnh update trả về 1
        when(taiKhoanRepository.updateNhanVien(eq(1L), anyString(), anyInt(), anyString())).thenReturn(1);

        // Act
        profileService.updateProfile("user123", mockDTO);

        // Assert
        verify(taiKhoanRepository, times(1)).updateNhanVien(eq(1L), anyString(), anyInt(), anyString());
        verify(taiKhoanRepository, never()).insertNhanVien(anyLong(), anyString(), anyInt(), anyString());
    }

    @Test
    void updateProfile_Employee_InsertNew_Success() {
        // Arrange: Nhân viên/Quản lý nhưng chưa có hồ sơ
        when(taiKhoanRepository.findByTenDangNhapAndFlagDeleteFalseOrFlagDeleteIsNull("user123"))
                .thenReturn(Optional.of(mockTaiKhoan));
        when(taiKhoanRepository.findMaQuyenByMaTaiKhoan(1L)).thenReturn(2L); // Inventory role

        // Giả lập update trả về 0 -> Bắt buộc phải Insert
        when(taiKhoanRepository.updateNhanVien(anyLong(), anyString(), anyInt(), anyString())).thenReturn(0);

        // Act
        profileService.updateProfile("user123", mockDTO);

        // Assert
        verify(taiKhoanRepository, times(1)).updateNhanVien(anyLong(), anyString(), anyInt(), anyString());
        verify(taiKhoanRepository, times(1)).insertNhanVien(eq(1L), anyString(), anyInt(), anyString());
    }
}