package com.vaccine.qltiemchungbackend.service;

import com.vaccine.qltiemchungbackend.entity.TaiKhoan;
import com.vaccine.qltiemchungbackend.repository.TaiKhoanRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.Optional;

@Service
public class CustomUserDetailsService implements UserDetailsService {

    @Autowired
    private TaiKhoanRepository taiKhoanRepository;

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        // 1. Tìm User trong Database thông qua Repository
        Optional<TaiKhoan> taiKhoanOpt = taiKhoanRepository.findByTenDangNhapAndFlagDeleteFalseOrFlagDeleteIsNull(username);

        if (taiKhoanOpt.isEmpty()) {
            throw new UsernameNotFoundException("Không tìm thấy người dùng với tên đăng nhập: " + username);
        }

        TaiKhoan taiKhoan = taiKhoanOpt.get();

        // 2. Lấy mã quyền (Role) của user để đưa vào Security Context
        Long maQuyen = taiKhoanRepository.findMaQuyenByMaTaiKhoan(taiKhoan.getMaTaiKhoan());
        String roleName = "ROLE_USER"; // Quyền mặc định nếu không có

        if (maQuyen != null) {
            // Chuyển đổi mã số thành tên Quyền theo chuẩn Spring Security (bắt buộc có tiền tố ROLE_)
            switch (maQuyen.intValue()) {
                case 1:
                    roleName = "ROLE_ADMIN";
                    break;
                case 2:
                    roleName = "ROLE_INVENTORY";
                    break;
                case 3:
                    roleName = "ROLE_MEDICAL";
                    break;
                case 4:
                    roleName = "ROLE_SUPPORT";
                    break;
                case 5:
                    roleName = "ROLE_FINANCE";
                    break;
                case 6:
                    roleName = "ROLE_CUSTOMER";
                    break;
                default:
                    roleName = "ROLE_USER";
                    break;
            }
        }

        // 3. Trả về đối tượng User của Spring Security
        return new User(
                taiKhoan.getTenDangNhap(),
                taiKhoan.getMatKhau(),
                Collections.singletonList(new SimpleGrantedAuthority(roleName))
        );
    }
}