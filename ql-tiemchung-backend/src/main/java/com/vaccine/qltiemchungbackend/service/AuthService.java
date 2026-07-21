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

    /**
     * Xử lý xác thực người dùng đăng nhập bằng Google OAuth2
     * Nếu email chưa tồn tại, hệ thống tự động tạo tài khoản mới với quyền Khách hàng.
     *
     * @param email Email lấy từ Google Payload
     * @param name  Họ tên lấy từ Google Payload
     * @return LoginResponse Kết quả đăng nhập kèm JWT Token nội bộ
     */
    public LoginResponse processGoogleLogin(String email, String name) {
        // Tìm tài khoản bằng Email (Lưu ý: Dùng TenDangNhap để lưu Email)
        Optional<TaiKhoan> taiKhoanOpt = taiKhoanRepository.findByTenDangNhapAndFlagDeleteFalseOrFlagDeleteIsNull(email);

        TaiKhoan taiKhoan;
        Long maQuyen;

        if (taiKhoanOpt.isPresent()) {
            // 1. Nếu tài khoản đã tồn tại -> Lấy thông tin
            taiKhoan = taiKhoanOpt.get();
            maQuyen = taiKhoanRepository.findMaQuyenByMaTaiKhoan(taiKhoan.getMaTaiKhoan());

        } else {
            // 2. Nếu tài khoản CHƯA tồn tại -> Tự động đăng ký mới
            taiKhoan = new TaiKhoan();
            taiKhoan.setTenDangNhap(email);

            // Lấy tên từ Google, nếu không có thì gán mặc định bằng tiền tố của email
            taiKhoan.setHoTen((name != null && !name.isEmpty()) ? name : email.split("@")[0]);

            // Tạo mật khẩu ngẫu nhiên để không ai có thể login bằng form thường
            String randomPassword = UUID.randomUUID().toString();
            taiKhoan.setMatKhau(passwordEncoder.encode(randomPassword));

            // Cài đặt các cờ mặc định (nếu có trong Entity của bạn)
            taiKhoan.setFlagDelete(false);

            // Lưu tài khoản mới vào Database
            taiKhoan = taiKhoanRepository.save(taiKhoan);

            // Gán quyền mặc định là Khách Hàng (MaQuyen = 6)
            // (Tuỳ vào cách DB của bạn lưu quyền, có thể bạn cần gọi hàm Insert vào bảng phân quyền trung gian nữa)
            maQuyen = 6L;

            // Nếu bạn có dùng Procedure để insert thông tin vào bảng BENH_NHAN (như đã thấy ở các module trước),
            // bạn có thể gọi hàm repository ở đây. Ví dụ:
            // taiKhoanRepository.insertBenhNhan(taiKhoan.getMaTaiKhoan(), taiKhoan.getHoTen(), null, null, null, null, null);
        }

        // 3. Sinh JWT Token cho người dùng
        String token = jwtUtils.generateToken(taiKhoan.getTenDangNhap());

        // 4. Trả về thông tin
        return new LoginResponse(true, "Đăng nhập Google thành công", taiKhoan.getHoTen(), token, maQuyen);
    }
}