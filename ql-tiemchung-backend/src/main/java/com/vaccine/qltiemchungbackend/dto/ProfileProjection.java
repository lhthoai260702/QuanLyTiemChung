package com.vaccine.qltiemchungbackend.dto;

public interface ProfileProjection {
    String getTenDangNhap();

    String getHoTen();

    String getCmnd();

    String getNoiO();

    String getMoTa();

    String getEmail();

    // NhanVien
    Integer getNamSinh();

    String getSdt();

    // BenhNhan
    String getNgaySinh();

    String getGioiTinh();

    String getDiaChi();

    String getNguoiGiamHo();
}