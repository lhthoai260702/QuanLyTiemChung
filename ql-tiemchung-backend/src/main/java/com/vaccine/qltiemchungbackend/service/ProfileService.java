package com.vaccine.qltiemchungbackend.service;

import com.vaccine.qltiemchungbackend.dto.ProfileDTO;
import com.vaccine.qltiemchungbackend.dto.ProfileProjection;
import com.vaccine.qltiemchungbackend.entity.TaiKhoan;
import com.vaccine.qltiemchungbackend.repository.TaiKhoanRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * ProfileService
 * * Version 1.0
 * * Date: 13-07-2026
 * * Copyright
 * * Modification Logs:
 * DATE        AUTHOR      DESCRIPTION
 * -----------------------------------------------------------------------
 * 13-07-2026  lhthoai     Create
 */
@Service
public class ProfileService {

    @Autowired
    private TaiKhoanRepository taiKhoanRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    /**
     * Lấy thông tin hồ sơ cá nhân của người dùng dựa trên tên đăng nhập.
     *
     * @param username tên đăng nhập của tài khoản
     * @return ProfileDTO đối tượng chứa dữ liệu chi tiết hồ sơ cá nhân
     * @throws RuntimeException nếu không tìm thấy thông tin cá nhân
     */
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

    /**
     * Cập nhật thông tin hồ sơ cá nhân của người dùng.
     * Cập nhật thông tin chung trong bảng TAIKHOAN và tự động đồng bộ sang bảng BENHNHAN (nếu là khách hàng)
     * hoặc bảng NHANVIEN (nếu là quản lý hoặc nhân viên y tế).
     *
     * @param username tên đăng nhập của tài khoản cần cập nhật
     * @param dto      đối tượng chứa các trường dữ liệu cần thay đổi
     * @throws RuntimeException nếu không tìm thấy tài khoản hợp lệ
     */
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