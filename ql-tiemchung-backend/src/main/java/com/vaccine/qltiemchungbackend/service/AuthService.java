package com.vaccine.qltiemchungbackend.service;

import com.vaccine.qltiemchungbackend.dto.LoginRequest;
import com.vaccine.qltiemchungbackend.dto.LoginResponse;
import com.vaccine.qltiemchungbackend.entity.TaiKhoan;
import com.vaccine.qltiemchungbackend.repository.TaiKhoanRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class AuthService {

    @Autowired
    private TaiKhoanRepository taiKhoanRepository;

    public LoginResponse authenticate(LoginRequest request) {
        // Lưu ý: Sau này đổi sang BCrypt, bạn sẽ tìm bằng Username trước rồi dùng passwordEncoder.matches()
        Optional<TaiKhoan> taiKhoan = taiKhoanRepository.findByTenDangNhapAndMatKhauAndFlagDeleteFalseOrFlagDeleteIsNull(
                request.getUsername(), request.getPassword()
        );

        if (taiKhoan.isPresent()) {
            return new LoginResponse(true, "Đăng nhập thành công", taiKhoan.get().getHoTen());
        } else {
            return new LoginResponse(false, "Sai tài khoản, mật khẩu hoặc tài khoản đã bị khóa", null);
        }
    }
}