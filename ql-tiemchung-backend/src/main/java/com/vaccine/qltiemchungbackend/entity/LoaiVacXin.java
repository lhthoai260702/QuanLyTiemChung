package com.vaccine.qltiemchungbackend.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

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