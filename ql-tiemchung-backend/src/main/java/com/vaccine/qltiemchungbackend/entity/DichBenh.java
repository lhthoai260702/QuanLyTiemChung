package com.vaccine.qltiemchungbackend.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDate;

@Entity
@Table(name = "DICHBENH")
@Data
public class DichBenh {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "MaDichBenh")
    private Long maDichBenh;

    @Column(name = "MaNhanVien")
    private Long maNhanVien;

    @Column(name = "TenDichBenh")
    private String tenDichBenh;

    @Column(name = "DuongLayNhiem", columnDefinition = "TEXT")
    private String duongLayNhiem;

    @Column(name = "TacHaiSucKhoe", columnDefinition = "TEXT")
    private String tacHaiSucKhoe;

    @Column(name = "SoNguoiBiNhiem")
    private Integer soNguoiBiNhiem;

    @Column(name = "DiaChi")
    private String diaChi;

    @Column(name = "GhiChu", columnDefinition = "TEXT")
    private String ghiChu;

    @Column(name = "ThoiDiemKhaoSat")
    private LocalDate thoiDiemKhaoSat;

    @Column(name = "flag_delete")
    private Boolean flagDelete = false;
}