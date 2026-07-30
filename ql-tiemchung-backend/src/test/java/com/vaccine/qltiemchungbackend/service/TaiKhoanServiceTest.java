package com.vaccine.qltiemchungbackend.service;

import com.vaccine.qltiemchungbackend.dto.AccountCreationDTO;
import com.vaccine.qltiemchungbackend.dto.AccountDTO;
import com.vaccine.qltiemchungbackend.dto.AccountRoleProjection;
import com.vaccine.qltiemchungbackend.entity.TaiKhoan;
import com.vaccine.qltiemchungbackend.repository.TaiKhoanRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TaiKhoanServiceTest {

    @Mock
    private TaiKhoanRepository taiKhoanRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @InjectMocks
    private TaiKhoanService taiKhoanService;

    private AccountCreationDTO dto;
    private TaiKhoan taiKhoan;

    @BeforeEach
    void setUp() {
        dto = new AccountCreationDTO();
        dto.setTenDangNhap("testuser");
        dto.setMatKhau("password");
        dto.setHoTen("Test User");
        dto.setCmnd("123456789");
        dto.setNoiO("Hanoi");
        dto.setMoTa("Test account");
        dto.setEmail("test@gmail.com");
        dto.setSdt("0123456789");
        dto.setGioiTinh("Nam");
        dto.setMaQuyen(6L); // Mặc định là khách hàng
        dto.setNgaySinh("2000-01-01");
        dto.setDiaChi("Hanoi");

        taiKhoan = new TaiKhoan();
        taiKhoan.setMaTaiKhoan(1L);
        taiKhoan.setTenDangNhap("testuser");
        taiKhoan.setMatKhau("encoded_password");
    }

    @Test
    void getAllAccounts() {
        // Arrange
        AccountRoleProjection projectionMock = mock(AccountRoleProjection.class);
        when(projectionMock.getMaTaiKhoan()).thenReturn(1L);
        when(projectionMock.getTenDangNhap()).thenReturn("testuser");
        when(projectionMock.getMaQuyen()).thenReturn(6L);
        when(projectionMock.getHoTen()).thenReturn("Test User");

        when(taiKhoanRepository.findAllAccountsWithRoles()).thenReturn(Arrays.asList(projectionMock));

        // Act
        List<AccountDTO> result = taiKhoanService.getAllAccounts();

        // Assert
        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals(1L, result.get(0).getMaTaiKhoan());
        assertEquals("testuser", result.get(0).getTenDangNhap());
        assertEquals(6L, result.get(0).getMaQuyen());

        verify(taiKhoanRepository, times(1)).findAllAccountsWithRoles();
    }

    @Test
    void createAccount_BenhNhan_Success() {
        // Arrange
        dto.setMaQuyen(6L);
        when(passwordEncoder.encode(anyString())).thenReturn("encoded_password");
        when(taiKhoanRepository.save(any(TaiKhoan.class))).thenReturn(taiKhoan);

        // Act
        taiKhoanService.createAccount(dto);

        // Assert
        ArgumentCaptor<TaiKhoan> captor = ArgumentCaptor.forClass(TaiKhoan.class);
        verify(taiKhoanRepository).save(captor.capture());
        assertEquals("testuser", captor.getValue().getTenDangNhap());
        assertEquals("encoded_password", captor.getValue().getMatKhau());

        verify(taiKhoanRepository, times(1)).insertChiTietPhanQuyen(1L, 6L);
        verify(taiKhoanRepository, times(1)).insertBenhNhan(
                eq(1L), eq(dto.getHoTen()), eq(dto.getNgaySinh()), eq(dto.getDiaChi()),
                eq(dto.getNguoiGiamHo()), eq(dto.getSdt()), eq(dto.getGioiTinh())
        );
        verify(taiKhoanRepository, never()).insertNhanVien(anyLong(), anyString(), anyInt(), anyString());
    }

    @Test
    void createAccount_NhanVien_Success() {
        // Arrange
        dto.setMaQuyen(5L); // Nhân viên y tế
        dto.setNamSinh(1995);
        when(passwordEncoder.encode(anyString())).thenReturn("encoded_password");
        when(taiKhoanRepository.save(any(TaiKhoan.class))).thenReturn(taiKhoan);

        // Act
        taiKhoanService.createAccount(dto);

        // Assert
        verify(taiKhoanRepository, times(1)).insertChiTietPhanQuyen(1L, 5L);
        verify(taiKhoanRepository, times(1)).insertNhanVien(
                eq(1L), eq(dto.getHoTen()), eq(dto.getNamSinh()), eq(dto.getSdt())
        );
        verify(taiKhoanRepository, never()).insertBenhNhan(anyLong(), anyString(), anyString(), anyString(), anyString(), anyString(), anyString());
    }

    @Test
    void updateAccount_AccountNotFound_ThrowsException() {
        // Arrange
        when(taiKhoanRepository.findById(1L)).thenReturn(Optional.empty());

        // Act & Assert
        RuntimeException exception = assertThrows(RuntimeException.class, () -> {
            taiKhoanService.updateAccount(1L, dto);
        });
        assertEquals("Không tìm thấy tài khoản", exception.getMessage());
    }

    @Test
    void updateAccount_BenhNhan_Exists_UpdatesSuccessfully() {
        // Arrange
        dto.setMaQuyen(6L);
        when(taiKhoanRepository.findById(1L)).thenReturn(Optional.of(taiKhoan));
        when(passwordEncoder.encode(dto.getMatKhau())).thenReturn("new_encoded_password");
        when(taiKhoanRepository.updateBenhNhan(anyLong(), anyString(), anyString(), anyString(), any(), anyString(), anyString())).thenReturn(1); // 1 row updated

        // Act
        taiKhoanService.updateAccount(1L, dto);

        // Assert
        verify(taiKhoanRepository, times(1)).save(taiKhoan);
        assertEquals("new_encoded_password", taiKhoan.getMatKhau()); // Verify password updated
        verify(taiKhoanRepository, times(1)).updateChiTietPhanQuyen(1L, 6L);
        verify(taiKhoanRepository, times(1)).updateBenhNhan(eq(1L), eq(dto.getHoTen()), eq(dto.getNgaySinh()), eq(dto.getDiaChi()), eq(dto.getNguoiGiamHo()), eq(dto.getSdt()), eq(dto.getGioiTinh()));
        verify(taiKhoanRepository, never()).insertBenhNhan(anyLong(), anyString(), anyString(), anyString(), any(), anyString(), anyString()); // Vì update trả về 1 nên không chạy insert
    }

    @Test
    void updateAccount_NhanVien_NotExists_InsertsSuccessfully() {
        // Arrange
        dto.setMaQuyen(2L); // Thủ kho (Nhân viên)
        dto.setMatKhau(""); // Bỏ trống mật khẩu => Không đổi
        when(taiKhoanRepository.findById(1L)).thenReturn(Optional.of(taiKhoan));
        when(taiKhoanRepository.updateNhanVien(anyLong(), anyString(), any(), anyString())).thenReturn(0); // 0 row updated -> Cần insert

        // Act
        taiKhoanService.updateAccount(1L, dto);

        // Assert
        verify(passwordEncoder, never()).encode(anyString()); // Không đổi mật khẩu
        verify(taiKhoanRepository, times(1)).save(taiKhoan);
        verify(taiKhoanRepository, times(1)).updateChiTietPhanQuyen(1L, 2L);
        verify(taiKhoanRepository, times(1)).updateNhanVien(eq(1L), eq(dto.getHoTen()), eq(dto.getNamSinh()), eq(dto.getSdt()));
        verify(taiKhoanRepository, times(1)).insertNhanVien(eq(1L), eq(dto.getHoTen()), eq(dto.getNamSinh()), eq(dto.getSdt())); // Chạy vào nhánh fallback
    }

    @Test
    void deleteAccount_Success() {
        // Arrange
        when(taiKhoanRepository.existsById(1L)).thenReturn(true);

        // Act
        taiKhoanService.deleteAccount(1L);

        // Assert
        verify(taiKhoanRepository, times(1)).existsById(1L);
        verify(taiKhoanRepository, times(1)).softDeleteAccount(1L);
    }

    @Test
    void deleteAccount_NotFound_ThrowsException() {
        // Arrange
        when(taiKhoanRepository.existsById(1L)).thenReturn(false);

        // Act & Assert
        RuntimeException exception = assertThrows(RuntimeException.class, () -> {
            taiKhoanService.deleteAccount(1L);
        });

        assertEquals("Tài khoản không tồn tại trên hệ thống!", exception.getMessage());
        verify(taiKhoanRepository, never()).softDeleteAccount(anyLong());
    }
}