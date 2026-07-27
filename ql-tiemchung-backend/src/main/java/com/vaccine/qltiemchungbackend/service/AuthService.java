package com.vaccine.qltiemchungbackend.service;

import com.vaccine.qltiemchungbackend.config.JwtUtils;
import com.vaccine.qltiemchungbackend.dto.LoginRequest;
import com.vaccine.qltiemchungbackend.dto.LoginResponse;
import com.vaccine.qltiemchungbackend.entity.TaiKhoan;
import com.vaccine.qltiemchungbackend.repository.TaiKhoanRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Optional;
import java.util.UUID;

/**
 * AuthService
 * * Version 1.0
 * * Date: 03-07-2026
 * * Copyright
 * * Modification Logs:
 * DATE        AUTHOR    DESCRIPTION
 * -----------------------------------------------------------------------
 * 03-07-2026 lhthoai   Create
 * 21-07-2026 lhthoai   Bổ sung tính năng xác thực Google OAuth2
 * 27-07-2026 lhthoai   Sinh thêm Refresh Token cho 2 luồng xác thực
 */
@Service
public class AuthService {

    @Autowired
    private TaiKhoanRepository taiKhoanRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtUtils jwtUtils;

    /**
     * Xác thực thông tin đăng nhập của người dùng và cấp phát JWT Token.
     *
     * @param request Đối tượng chứa tên đăng nhập và mật khẩu
     * @return LoginResponse Kết quả đăng nhập
     */
    public LoginResponse authenticate(LoginRequest request) {
        Optional<TaiKhoan> taiKhoanOpt = taiKhoanRepository.findByTenDangNhapAndFlagDeleteFalseOrFlagDeleteIsNull(request.getUsername());

        if (taiKhoanOpt.isPresent()) {
            TaiKhoan taiKhoan = taiKhoanOpt.get();

            if (passwordEncoder.matches(request.getPassword(), taiKhoan.getMatKhau())) {

                // TẠO CẢ ACCESS TOKEN VÀ REFRESH TOKEN
                String accessToken = jwtUtils.generateToken(taiKhoan.getTenDangNhap());
                String refreshToken = jwtUtils.generateRefreshToken(taiKhoan.getTenDangNhap());

                Long maQuyen = taiKhoanRepository.findMaQuyenByMaTaiKhoan(taiKhoan.getMaTaiKhoan());

                LoginResponse response = new LoginResponse();
                response.setSuccess(true);
                response.setMessage("Đăng nhập thành công");
                response.setHoTen(taiKhoan.getHoTen());
                response.setToken(accessToken);
                response.setMaQuyen(maQuyen);
                response.setRefreshToken(refreshToken); // Set Refresh Token cho Controller xử lý Cookie

                return response;
            }
        }

        LoginResponse errorResponse = new LoginResponse();
        errorResponse.setSuccess(false);
        errorResponse.setMessage("Sai tài khoản, mật khẩu hoặc tài khoản đã bị khóa");
        return errorResponse;
    }

    /**
     * Xử lý xác thực người dùng đăng nhập bằng Google OAuth2
     * Nếu email chưa tồn tại, hệ thống tự động tạo tài khoản mới với quyền Khách hàng.
     *
     * @param email Email lấy từ Google Payload
     * @param name  Họ tên lấy từ Google Payload
     * @return LoginResponse
     */
    public LoginResponse processGoogleLogin(String email, String name) {
        Optional<TaiKhoan> taiKhoanOpt = taiKhoanRepository.findByTenDangNhapAndFlagDeleteFalseOrFlagDeleteIsNull(email);

        TaiKhoan taiKhoan;
        Long maQuyen;

        if (taiKhoanOpt.isPresent()) {
            taiKhoan = taiKhoanOpt.get();
            maQuyen = taiKhoanRepository.findMaQuyenByMaTaiKhoan(taiKhoan.getMaTaiKhoan());
        } else {
            taiKhoan = new TaiKhoan();
            taiKhoan.setTenDangNhap(email);
            taiKhoan.setHoTen((name != null && !name.isEmpty()) ? name : email.split("@")[0]);

            String randomPassword = UUID.randomUUID().toString();
            taiKhoan.setMatKhau(passwordEncoder.encode(randomPassword));
            taiKhoan.setFlagDelete(false);
            taiKhoan = taiKhoanRepository.save(taiKhoan);

            maQuyen = 6L;
        }

        // TẠO CẢ ACCESS TOKEN VÀ REFRESH TOKEN CHO GOOGLE ACCOUNT
        String accessToken = jwtUtils.generateToken(taiKhoan.getTenDangNhap());
        String refreshToken = jwtUtils.generateRefreshToken(taiKhoan.getTenDangNhap());

        LoginResponse response = new LoginResponse();
        response.setSuccess(true);
        response.setMessage("Đăng nhập Google thành công");
        response.setHoTen(taiKhoan.getHoTen());
        response.setToken(accessToken);
        response.setMaQuyen(maQuyen);
        response.setRefreshToken(refreshToken); // Set Refresh Token

        return response;
    }
}