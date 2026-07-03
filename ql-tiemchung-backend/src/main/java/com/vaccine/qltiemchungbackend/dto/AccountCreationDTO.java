package com.vaccine.qltiemchungbackend.dto;

import lombok.Data;

/**
 * AccountCreationDTO
 * * Version 1.0
 * * Date: 03-07-2026
 * * Copyright
 * * Modification Logs:
 * DATE       AUTHOR    DESCRIPTION
 * -----------------------------------------------------------------------
 * 03-07-2026 lhthoai   Create
 */
@Data
public class AccountCreationDTO {
    private String tenDangNhap;
    private String matKhau;
    private String hoTen;
    private String cmnd;
    private String noiO;
    private String moTa;
    private String email;
    private Long maQuyen;

    // --- CÁC TRƯỜNG BỔ SUNG CHO FORM ĐỘNG ---
    private Integer namSinh;       // Cho Nhân Viên
    private String sdt;            // Chung cho cả 2
    private String ngaySinh;       // Cho Bệnh nhân (định dạng YYYY-MM-DD)
    private String diaChi;         // Cho Bệnh nhân
    private String nguoiGiamHo;    // Cho Bệnh nhân
    private String gioiTinh;       // Cho Bệnh nhân
}