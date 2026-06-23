package com.vaccine.qltiemchungbackend.entity;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "LOAIVACXIN")
@Data
public class LoaiVacXin {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "MaLoaiVacXin")
    private Long maLoaiVacXin;

    @Column(name = "TenLoaiVacXin")
    private String tenLoaiVacXin;

    @Column(name = "flag_delete")
    private Boolean flagDelete;
}