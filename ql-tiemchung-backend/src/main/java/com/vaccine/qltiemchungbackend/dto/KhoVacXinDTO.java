package com.vaccine.qltiemchungbackend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

/**
 * KhoVacXinDTO
 * * Version 1.0
 * * Date: 03-07-2026
 * * Copyright
 * * Modification Logs:
 * DATE       AUTHOR    DESCRIPTION
 * -----------------------------------------------------------------------
 * 03-07-2026 lhthoai   Create
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class KhoVacXinDTO {
    // Thông tin Lô Vắc xin
    private Long soLo;
    private LocalDate ngayNhan;
    private String giayPhep;
    private String nuocSanXuat;
    private Integer soLuong;
    private String tinhTrang;

    // Thông tin Vắc xin
    private Long maVacXin;
    private String tenVacXin;
    private String loaiVacXin;
    private String hamLuong;
    private LocalDate hanSuDung;
    private String dieuKienBaoQuan;
    private String doTuoiTiemChung;
    private Double donGia;

    // Thông tin Nhà Cung Cấp
    private Long maNhaCungCap;
    private String tenNhaCungCap;

    // Hóa đơn
    private Double tongTien;
}