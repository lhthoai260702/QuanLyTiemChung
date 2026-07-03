package com.vaccine.qltiemchungbackend.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * LoaiVacXin
 * * Version 1.0
 * * Date: 03-07-2026
 * * Copyright
 * * Modification Logs:
 * DATE       AUTHOR    DESCRIPTION
 * -----------------------------------------------------------------------
 * 03-07-2026 lhthoai   Create
 */
@Entity
@Table(name = "LOAIVACXIN")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class LoaiVacXin {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "MaLoaiVacXin")
    private Long maLoaiVacXin;

    @Column(name = "TenLoaiVacXin")
    private String tenLoaiVacXin;

    @Column(name = "flag_delete")
    private Boolean flagDelete = false;
}