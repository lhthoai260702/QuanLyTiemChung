package com.vaccine.qltiemchungbackend.service;

import com.vaccine.qltiemchungbackend.config.JwtUtils;
import com.vaccine.qltiemchungbackend.dto.LoginRequest;
import com.vaccine.qltiemchungbackend.dto.LoginResponse;
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

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private TaiKhoanRepository taiKhoanRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtUtils jwtUtils;

    @InjectMocks
    private AuthService authService;

    private TaiKhoan mockTaiKhoan;
    private LoginRequest loginRequest;

    @BeforeEach
    void setUp() {
        // Dữ liệu giả định dùng chung cho các test case
        mockTaiKhoan = new TaiKhoan();
        mockTaiKhoan.setMaTaiKhoan(1L);
        mockTaiKhoan.setTenDangNhap("thoaile");
        mockTaiKhoan.setMatKhau("encoded_password");
        mockTaiKhoan.setHoTen("Lê Hữu Thoại");
        mockTaiKhoan.setFlagDelete(false);

        loginRequest = new LoginRequest();
        loginRequest.setUsername("thoaile");
        loginRequest.setPassword("raw_password");
    }

    // ==========================================
    // TEST LUỒNG ĐĂNG NHẬP THƯỜNG (authenticate)
    // ==========================================

    @Test
    void authenticate_Success() {
        // Arrange (Chuẩn bị)
        when(taiKhoanRepository.findByTenDangNhapAndFlagDeleteFalseOrFlagDeleteIsNull("thoaile"))
                .thenReturn(Optional.of(mockTaiKhoan));
        when(passwordEncoder.matches("raw_password", "encoded_password")).thenReturn(true);
        when(jwtUtils.generateToken("thoaile")).thenReturn("mock_access_token");
        when(jwtUtils.generateRefreshToken("thoaile")).thenReturn("mock_refresh_token");
        when(taiKhoanRepository.findMaQuyenByMaTaiKhoan(1L)).thenReturn(2L); // 2L: Quyền nào đó

        // Act (Thực thi)
        LoginResponse response = authService.authenticate(loginRequest);

        // Assert (Kiểm tra)
        assertTrue(response.isSuccess());
        assertEquals("Đăng nhập thành công", response.getMessage());
        assertEquals("mock_access_token", response.getToken());
        assertEquals("mock_refresh_token", response.getRefreshToken());
        assertEquals(2L, response.getMaQuyen());
        assertEquals("Lê Hữu Thoại", response.getHoTen());
    }

    @Test
    void authenticate_WrongPassword_ReturnsFail() {
        // Arrange
        when(taiKhoanRepository.findByTenDangNhapAndFlagDeleteFalseOrFlagDeleteIsNull("thoaile"))
                .thenReturn(Optional.of(mockTaiKhoan));
        when(passwordEncoder.matches("raw_password", "encoded_password")).thenReturn(false); // Sai mật khẩu

        // Act
        LoginResponse response = authService.authenticate(loginRequest);

        // Assert
        assertFalse(response.isSuccess());
        assertEquals("Sai tài khoản, mật khẩu hoặc tài khoản đã bị khóa", response.getMessage());
        verify(jwtUtils, never()).generateToken(anyString()); // Đảm bảo không sinh token khi sai pass
    }

    @Test
    void authenticate_AccountNotFound_ReturnsFail() {
        // Arrange
        when(taiKhoanRepository.findByTenDangNhapAndFlagDeleteFalseOrFlagDeleteIsNull("thoaile"))
                .thenReturn(Optional.empty()); // Không tìm thấy user

        // Act
        LoginResponse response = authService.authenticate(loginRequest);

        // Assert
        assertFalse(response.isSuccess());
        assertEquals("Sai tài khoản, mật khẩu hoặc tài khoản đã bị khóa", response.getMessage());
        verify(passwordEncoder, never()).matches(anyString(), anyString());
    }

    // ==========================================
    // TEST LUỒNG ĐĂNG NHẬP GOOGLE (processGoogleLogin)
    // ==========================================

    @Test
    void processGoogleLogin_ExistingAccount_Success() {
        // Arrange
        String email = "thoaile@gmail.com";
        String name = "Thoại Lê Google";
        mockTaiKhoan.setTenDangNhap(email);

        when(taiKhoanRepository.findByTenDangNhapAndFlagDeleteFalseOrFlagDeleteIsNull(email))
                .thenReturn(Optional.of(mockTaiKhoan));
        when(taiKhoanRepository.findMaQuyenByMaTaiKhoan(1L)).thenReturn(6L);
        when(jwtUtils.generateToken(email)).thenReturn("google_access_token");
        when(jwtUtils.generateRefreshToken(email)).thenReturn("google_refresh_token");

        // Act
        LoginResponse response = authService.processGoogleLogin(email, name);

        // Assert
        assertTrue(response.isSuccess());
        assertEquals("google_access_token", response.getToken());
        assertEquals("google_refresh_token", response.getRefreshToken());
        assertEquals(6L, response.getMaQuyen());
        verify(taiKhoanRepository, never()).save(any(TaiKhoan.class)); // Account đã có, không được gọi hàm save
    }

    @Test
    void processGoogleLogin_NewAccountWithName_CreatesAndReturnsSuccess() {
        // Arrange
        String email = "newuser@gmail.com";
        String name = "New User";

        when(taiKhoanRepository.findByTenDangNhapAndFlagDeleteFalseOrFlagDeleteIsNull(email))
                .thenReturn(Optional.empty()); // Tài khoản chưa tồn tại
        when(passwordEncoder.encode(anyString())).thenReturn("random_encoded_pass");

        // Cấu hình mock cho hàm save để trả về chính object được truyền vào
        when(taiKhoanRepository.save(any(TaiKhoan.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(jwtUtils.generateToken(email)).thenReturn("new_access_token");
        when(jwtUtils.generateRefreshToken(email)).thenReturn("new_refresh_token");

        // Act
        LoginResponse response = authService.processGoogleLogin(email, name);

        // Assert
        assertTrue(response.isSuccess());
        assertEquals(6L, response.getMaQuyen()); // Quyền mặc định là Khách hàng (6L)
        assertEquals("New User", response.getHoTen());

        // Kiểm tra xem dữ liệu lưu xuống DB (hàm save) có chính xác không
        ArgumentCaptor<TaiKhoan> captor = ArgumentCaptor.forClass(TaiKhoan.class);
        verify(taiKhoanRepository).save(captor.capture());

        TaiKhoan savedTaiKhoan = captor.getValue();
        assertEquals(email, savedTaiKhoan.getTenDangNhap());
        assertEquals("random_encoded_pass", savedTaiKhoan.getMatKhau());
        assertFalse(savedTaiKhoan.getFlagDelete());
    }

    @Test
    void processGoogleLogin_NewAccountNoName_SplitsEmailForName() {
        // Arrange
        String email = "no.name.user@gmail.com";

        when(taiKhoanRepository.findByTenDangNhapAndFlagDeleteFalseOrFlagDeleteIsNull(email))
                .thenReturn(Optional.empty());
        when(passwordEncoder.encode(anyString())).thenReturn("pass");
        when(taiKhoanRepository.save(any(TaiKhoan.class))).thenAnswer(i -> i.getArgument(0));
        when(jwtUtils.generateToken(email)).thenReturn("token");
        when(jwtUtils.generateRefreshToken(email)).thenReturn("token");

        // Act: Gửi null cho tham số name
        LoginResponse response = authService.processGoogleLogin(email, null);

        // Assert
        assertTrue(response.isSuccess());
        // Do không có name nên nó sẽ lấy chuỗi trước chữ @ trong email (no.name.user)
        assertEquals("no.name.user", response.getHoTen());
    }
}