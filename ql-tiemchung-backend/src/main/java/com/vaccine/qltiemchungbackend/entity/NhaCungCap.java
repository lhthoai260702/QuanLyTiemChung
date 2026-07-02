package com.vaccine.qltiemchungbackend.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "NHACUNGCAP")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class NhaCungCap {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "MaNhaCungCap")
    private Long maNhaCungCap;

    @Column(name = "TenNhaCungCap")
    private String tenNhaCungCap;

    @Column(name = "flag_delete")
    private Boolean flagDelete = false;
}