package com.vaccine.qltiemchungbackend.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDate;

@Entity
@Table(name = "CHITIET_DK_TIEM")
@Data
public class ChiTietDkTiem {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "MaChiTietDKTiem")
    private Long maChiTietDkTiem;

    @ManyToOne
    @JoinColumn(name = "MaBenhNhan")
    private BenhNhan benhNhan;

    @Column(name = "MaLo")
    private Long maLo;

    @Column(name = "ThoiGianCanTiem")
    private LocalDate thoiGianCanTiem;

    // BỔ SUNG TRƯỜNG NÀY ĐỂ MAPPING VỚI DATABASE
    @Column(name = "MaLichTiem")
    private Long maLichTiem;

    @Column(name = "flag_delete")
    private Boolean flagDelete = false;
}