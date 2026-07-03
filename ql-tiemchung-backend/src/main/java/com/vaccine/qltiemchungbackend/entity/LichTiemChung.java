package com.vaccine.qltiemchungbackend.entity;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDate;

/**
 * LichTiemChung
 * * Version 1.0
 * * Date: 03-07-2026
 * * Copyright
 * * Modification Logs:
 * DATE       AUTHOR    DESCRIPTION
 * -----------------------------------------------------------------------
 * 03-07-2026 lhthoai   Create
 */
@Entity
@Table(name = "LICHTIEMCHUNG")
@Data
public class LichTiemChung {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "MaLichTiem")
    private Long maLichTiem;

    @Column(name = "DoiTuong")
    private String doiTuong;

    @Column(name = "ThoiGianChung")
    private String thoiGianChung;

    @Column(name = "GhiChu", columnDefinition = "TEXT")
    private String ghiChu;

    @Column(name = "SoLuongNguoiTiem")
    private Integer soLuongNguoiTiem;

    @Column(name = "NgayTiem")
    private LocalDate ngayTiem;

    @Column(name = "DiaDiem")
    private String diaDiem;

    @Column(name = "MaLoaiVacXin")
    private Long maLoaiVacXin;

    @Column(name = "MaVacXin")
    private Long maVacXin;

    @Column(name = "flag_delete")
    private Boolean flagDelete;
}