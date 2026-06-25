package com.vaccine.qltiemchungbackend.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDate;

@Entity
@Table(name = "HOSOBENHAN")
@Data
public class HoSoBenhAn {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "MaHoSoBenhAn")
    private Long maHoSoBenhAn;

    @OneToOne
    @JoinColumn(name = "MaChiTietDKTiem")
    private ChiTietDkTiem chiTietDkTiem;

    @Column(name = "PhanUngSauTiem")
    private String phanUngSauTiem;

    @Column(name = "ThoiGianTacDung")
    private String thoiGianTacDung;

    @Column(name = "ThoiGianTiem")
    private LocalDate thoiGianTiem;

    @Column(name = "flag_delete")
    private Boolean flagDelete = false;
}