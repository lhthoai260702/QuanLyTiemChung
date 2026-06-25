package com.vaccine.qltiemchungbackend.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDate;

@Entity
@Table(name = "BENHNHAN")
@Data
public class BenhNhan {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "MaBenhNhan")
    private Long maBenhNhan;

    @Column(name = "TenBenhNhan")
    private String tenBenhNhan;

    @Column(name = "NgaySinh")
    private LocalDate ngaySinh;

    @Column(name = "GioiTinh")
    private String gioiTinh;

    @Column(name = "DiaChi")
    private String diaChi;

    @Column(name = "NguoiGiamHo")
    private String nguoiGiamHo;

    @Column(name = "SDT")
    private String sdt;

    @Column(name = "flag_delete")
    private Boolean flagDelete;
}