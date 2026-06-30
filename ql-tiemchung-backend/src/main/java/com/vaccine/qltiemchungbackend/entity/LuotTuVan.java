package com.vaccine.qltiemchungbackend.entity;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "LUOTTUVAN")
@Data
public class LuotTuVan {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "MaLuotTuVan")
    private Long maLuotTuVan;

    @Column(name = "CauHoi", columnDefinition = "TEXT")
    private String cauHoi;

    @Column(name = "TraLoi", columnDefinition = "TEXT")
    private String traLoi;

    @Column(name = "MaBenhNhan")
    private Long maBenhNhan;

    @Column(name = "MaNhanVien")
    private Long maNhanVien;

    @Column(name = "CauHoiThuongGap")
    private Boolean cauHoiThuongGap;

    @Column(name = "flag_delete")
    private Boolean flagDelete = false;
}