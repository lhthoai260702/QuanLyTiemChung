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

/**
 * AuthService
 * * Version 1.0
 * * Date: 03-07-2026
 * * Copyright
 * * Modification Logs:
 * DATE       AUTHOR    DESCRIPTION
 * -----------------------------------------------------------------------
 * 03-07-2026 lhthoai   Create
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
     * @return LoginResponse Kết quả đăng nhập (kèm token và mã quyền nếu thành công)
     */
    public LoginResponse authenticate(LoginRequest request) {
        // 1. Tìm tài khoản bằng Username
        Optional<TaiKhoan> taiKhoanOpt = taiKhoanRepository.findByTenDangNhapAndFlagDeleteFalseOrFlagDeleteIsNull(request.getUsername());

        if (taiKhoanOpt.isPresent()) {
            TaiKhoan taiKhoan = taiKhoanOpt.get();

            // 2. Dùng PasswordEncoder để kiểm tra mật khẩu
            if (passwordEncoder.matches(request.getPassword(), taiKhoan.getMatKhau())) {

                // 3. MẬT KHẨU ĐÚNG -> TẠO THẺ THÔNG HÀNH (JWT TOKEN)
                String token = jwtUtils.generateToken(taiKhoan.getTenDangNhap());

                // 4. LẤY MÃ QUYỀN CỦA USER
                Long maQuyen = taiKhoanRepository.findMaQuyenByMaTaiKhoan(taiKhoan.getMaTaiKhoan());

                // Trả về kèm theo token và mã quyền
                return new LoginResponse(true, "Đăng nhập thành công", taiKhoan.getHoTen(), token, maQuyen);
            }
        }

        // Đăng nhập thất bại -> Trả về token = null, maQuyen = null
        return new LoginResponse(false, "Sai tài khoản, mật khẩu hoặc tài khoản đã bị khóa", null, null, null);
    }
}