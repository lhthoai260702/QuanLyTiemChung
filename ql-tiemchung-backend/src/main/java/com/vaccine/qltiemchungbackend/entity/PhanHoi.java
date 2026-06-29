package com.vaccine.qltiemchungbackend.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDate;

@Entity
@Table(name = "PHANHOI")
@Data
public class PhanHoi {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "MaPhanHoi")
    private Long maPhanHoi;

    // Khóa ngoại trỏ tới bảng LOAIPHANHOI (dùng Long để đơn giản hóa quá trình Insert Native Query)
    @Column(name = "MaLoaiPhanHoi")
    private Long maLoaiPhanHoi;

    // Khóa ngoại trỏ tới bảng BENHNHAN
    @Column(name = "MaBenhNhan")
    private Long maBenhNhan;

    @Column(name = "TenNhanVienPhuTrach")
    private String tenNhanVienPhuTrach;

    @Column(name = "TenVacXin")
    private String tenVacXin;

    @Column(name = "NoiDung", columnDefinition = "TEXT")
    private String noiDung;

    @Column(name = "ThoiGianTiem")
    private LocalDate thoiGianTiem;

    @Column(name = "DiaDiemTiem")
    private String diaDiemTiem;

    @Column(name = "flag_delete")
    private Boolean flagDelete = false;
}