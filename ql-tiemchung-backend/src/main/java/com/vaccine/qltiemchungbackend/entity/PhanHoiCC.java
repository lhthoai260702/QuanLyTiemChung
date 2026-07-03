package com.vaccine.qltiemchungbackend.entity;

import jakarta.persistence.*;
import lombok.Data;

/**
 * PhanHoiCC
 * * Version 1.0
 * * Date: 03-07-2026
 * * Copyright
 * * Modification Logs:
 * DATE       AUTHOR    DESCRIPTION
 * -----------------------------------------------------------------------
 * 03-07-2026 lhthoai   Create
 */
@Entity
@Table(name = "PHANHOICC")
@Data
public class PhanHoiCC {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "MaPhanHoiCC")
    private Long maPhanHoiCC;

    @Column(name = "MaBenhNhan")
    private Long maBenhNhan;

    @Column(name = "name")
    private String name;

    @Column(name = "content", columnDefinition = "TEXT")
    private String content;

    @Column(name = "NoiDungTraLoi", columnDefinition = "TEXT")
    private String noiDungTraLoi;

    @Column(name = "flag_delete")
    private Boolean flagDelete = false;
}