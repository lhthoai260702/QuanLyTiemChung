package com.vaccine.qltiemchungbackend.dto;

public interface AccountRoleProjection {
    Long getMaTaiKhoan();
    String getTenDangNhap();
    String getHoTen();
    String getCmnd();
    String getNoiO();
    String getMoTa();
    String getEmail();
    Boolean getFlagDelete();
    String getPhanQuyen();

    // Thêm các trường lấy từ bảng JOIN
    Long getMaQuyen();
    Integer getNamSinh();
    String getSdt();
    String getNgaySinh();
    String getDiaChi();
    String getNguoiGiamHo();
    String getGioiTinh();
}