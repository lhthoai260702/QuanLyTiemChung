package com.vaccine.qltiemchungbackend.dto;

import lombok.Data;

@Data
public class ProfileDTO {
    private String tenDangNhap;
    private String hoTen;
    private String cmnd;
    private String noiO;
    private String moTa;
    private String email;
    private String matKhau; // Phục vụ cho đổi mật khẩu

    // Dành cho Nhân viên
    private Integer namSinh;
    private String sdt;

    // Dành riêng cho Bệnh nhân / Khách hàng
    private String ngaySinh;
    private String gioiTinh;
    private String diaChi;
    private String nguoiGiamHo;
}