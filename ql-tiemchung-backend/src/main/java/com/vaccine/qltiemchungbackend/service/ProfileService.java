package com.vaccine.qltiemchungbackend.service;

import com.vaccine.qltiemchungbackend.dto.ProfileDTO;
import com.vaccine.qltiemchungbackend.dto.ProfileProjection;
import com.vaccine.qltiemchungbackend.entity.TaiKhoan;
import com.vaccine.qltiemchungbackend.repository.TaiKhoanRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ProfileService {

    @Autowired
    private TaiKhoanRepository taiKhoanRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    public ProfileDTO getProfile(String username) {
        ProfileProjection proj = taiKhoanRepository.findProfileByUsername(username)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy thông tin cá nhân"));

        ProfileDTO dto = new ProfileDTO();
        dto.setTenDangNhap(proj.getTenDangNhap());
        dto.setHoTen(proj.getHoTen());
        dto.setCmnd(proj.getCmnd());
        dto.setNoiO(proj.getNoiO());
        dto.setMoTa(proj.getMoTa());
        dto.setEmail(proj.getEmail());

        dto.setNamSinh(proj.getNamSinh());
        dto.setSdt(proj.getSdt());
        dto.setNgaySinh(proj.getNgaySinh());
        dto.setGioiTinh(proj.getGioiTinh());
        dto.setDiaChi(proj.getDiaChi());
        dto.setNguoiGiamHo(proj.getNguoiGiamHo());

        return dto;
    }

    @Transactional
    public void updateProfile(String username, ProfileDTO dto) {
        TaiKhoan tk = taiKhoanRepository.findByTenDangNhapAndFlagDeleteFalseOrFlagDeleteIsNull(username)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy tài khoản"));

        // Cập nhật bảng TAIKHOAN
        tk.setHoTen(dto.getHoTen());
        tk.setCmnd(dto.getCmnd());
        tk.setNoiO(dto.getNoiO());
        tk.setMoTa(dto.getMoTa());
        tk.setEmail(dto.getEmail());

        // Đổi mật khẩu nếu có nhập
        if (dto.getMatKhau() != null && !dto.getMatKhau().trim().isEmpty()) {
            tk.setMatKhau(passwordEncoder.encode(dto.getMatKhau()));
        }
        taiKhoanRepository.save(tk);

        Long maQuyen = taiKhoanRepository.findMaQuyenByMaTaiKhoan(tk.getMaTaiKhoan());

        // Nếu là Khách hàng (Role 6) thì Cập nhật BENHNHAN
        if (maQuyen != null && maQuyen == 6L) {
            int rows = taiKhoanRepository.updateBenhNhan(
                    tk.getMaTaiKhoan(), dto.getHoTen(), dto.getNgaySinh(),
                    dto.getDiaChi(), dto.getNguoiGiamHo(), dto.getSdt(), dto.getGioiTinh()
            );
            if (rows == 0) {
                taiKhoanRepository.insertBenhNhan(
                        tk.getMaTaiKhoan(), dto.getHoTen(), dto.getNgaySinh(),
                        dto.getDiaChi(), dto.getNguoiGiamHo(), dto.getSdt(), dto.getGioiTinh()
                );
            }
        } else {
            // Nếu là Nhân viên / Quản lý thì Cập nhật NHANVIEN
            int rows = taiKhoanRepository.updateNhanVien(tk.getMaTaiKhoan(), dto.getHoTen(), dto.getNamSinh(), dto.getSdt());
            if (rows == 0) {
                taiKhoanRepository.insertNhanVien(tk.getMaTaiKhoan(), dto.getHoTen(), dto.getNamSinh(), dto.getSdt());
            }
        }
    }
}