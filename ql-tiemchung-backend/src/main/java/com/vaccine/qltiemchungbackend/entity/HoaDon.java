package com.vaccine.qltiemchungbackend.entity;

import jakarta.persistence.*;
import lombok.Data;

/**
 * HoaDon
 * * Version 1.0
 * * Date: 03-07-2026
 * * Copyright
 * * Modification Logs:
 * DATE       AUTHOR    DESCRIPTION
 * -----------------------------------------------------------------------
 * 03-07-2026 lhthoai   Create
 */
@Entity
@Table(name = "HOADON")
@Data
public class HoaDon {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "MaHoaDon")
    private Long maHoaDon;

    @Column(name = "TongTien")
    private Double tongTien;

    @Column(name = "flag_delete")
    private Boolean flagDelete = false;
}