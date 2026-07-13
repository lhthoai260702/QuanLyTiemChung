package com.vaccine.qltiemchungbackend.entity;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDate;

@Entity
@Table(name = "PHANHOI")
@Data
public class PhanHoi {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "MaPhanHoi")
    private Long maPhanHoi;

    @Column(name = "MaLoaiPhanHoi")
    private Long maLoaiPhanHoi;

    @Column(name = "MaBenhNhan")
    private Long maBenhNhan;

    @Column(name = "TenNhanVienPhuTrach")
    private String tenNhanVienPhuTrach;

    @Column(name = "TenVacXin")
    private String tenVacXin;

    @Column(name = "NoiDung", columnDefinition = "TEXT")
    private String noiDung;

    @Column(name = "ThoiGianTiem")
    private LocalDate thoiGianTiem;

    @Column(name = "DiaDiemTiem")
    private String diaDiemTiem;

    @Column(name = "TrangThai")
    private String trangThai = "Đang xử lý";

    @Column(name = "ChiTietPhanHoi", columnDefinition = "TEXT")
    private String chiTietPhanHoi;

    @Column(name = "flag_delete")
    private Boolean flagDelete = false;
}