package com.vaccine.qltiemchungbackend.service;

import com.vaccine.qltiemchungbackend.dto.ProfileDTO;
import com.vaccine.qltiemchungbackend.dto.ProfileProjection;
import com.vaccine.qltiemchungbackend.entity.TaiKhoan;
import com.vaccine.qltiemchungbackend.repository.TaiKhoanRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * ProfileService
 * * Version 1.0
 * * Date: 03-07-2026
 * * Copyright
 * * Modification Logs:
 * DATE       AUTHOR    DESCRIPTION
 * -----------------------------------------------------------------------
 * 03-07-2026 lhthoai   Create
 */
@Service
public class ProfileService {

    @Autowired
    private TaiKhoanRepository taiKhoanRepository;

    /**
     * Lấy thông tin profile
     *
     * @param username
     * @return
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
        return dto;
    }

    /**
     * Cập nhật thông tin profile
     *
     * @param username
     * @param dto
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
        taiKhoanRepository.save(tk);

        // Cập nhật bảng NHANVIEN (Cập nhật đồng thời tên hiển thị, sdt, năm sinh)
        int rows = taiKhoanRepository.updateNhanVien(tk.getMaTaiKhoan(), dto.getHoTen(), dto.getNamSinh(), dto.getSdt());

        // Nếu user này chưa có bản ghi trong bảng NHANVIEN thì thêm mới vào
        if (rows == 0) {
            taiKhoanRepository.insertNhanVien(tk.getMaTaiKhoan(), dto.getHoTen(), dto.getNamSinh(), dto.getSdt());
        }
    }
}