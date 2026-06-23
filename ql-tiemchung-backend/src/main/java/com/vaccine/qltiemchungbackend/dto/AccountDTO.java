package com.vaccine.qltiemchungbackend.dto;

import lombok.Data;

@Data
public class AccountDTO {
    private Long maTaiKhoan;
    private String tenDangNhap;
    private String hoTen;
    private String cmnd;
    private String noiO;
    private String moTa;
    private String email;
    private Boolean flagDelete;
    private String phanQuyen;

    // --- THÊM CÁC TRƯỜNG NÀY ĐỂ API TRẢ VỀ FRONTEND ---
    private Long maQuyen;
    private Integer namSinh;
    private String sdt;
    private String ngaySinh;
    private String diaChi;
    private String nguoiGiamHo;
    private String gioiTinh;
}