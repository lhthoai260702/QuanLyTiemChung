//package com.vaccine.qltiemchungbackend.entity;
//
//import jakarta.persistence.*;
//import lombok.AllArgsConstructor;
//import lombok.Data;
//import lombok.NoArgsConstructor;
//import java.time.LocalDate;
//
//@Entity
//@Table(name = "VACXIN")
//@Data
//@NoArgsConstructor
//@AllArgsConstructor
//public class VacXin {
//
//    @Id
//    @GeneratedValue(strategy = GenerationType.IDENTITY)
//    @Column(name = "MaVacXin")
//    private Long maVacXin;
//
//    // Khóa ngoại liên kết tới bảng LOAIVACXIN
//    @ManyToOne(fetch = FetchType.LAZY)
//    @JoinColumn(name = "MaLoaiVacXin")
//    private LoaiVacXin loaiVacXin;
//
//    @Column(name = "TenVacXin")
//    private String tenVacXin;
//
//    @Column(name = "HanSuDung")
//    private LocalDate hanSuDung;
//
//    @Column(name = "HamLuong")
//    private String hamLuong;
//
//    @Column(name = "PhongNguaBenh")
//    private String phongNguaBenh;
//
//    @Column(name = "DoTuoiTiemChung")
//    private String doTuoiTiemChung;
//
//    @Column(name = "DonGia")
//    private Double donGia;
//
//    @Column(name = "DieuKienBaoQuan")
//    private String dieuKienBaoQuan;
//
//    @Column(name = "flag_delete")
//    private Boolean flagDelete = false;
//}

package com.vaccine.qltiemchungbackend.entity;

// 1. THÊM IMPORT NÀY
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDate;

@Entity
@Table(name = "VACXIN")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class VacXin {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "MaVacXin")
    private Long maVacXin;

    // 2. THÊM ANNOTATION @JsonIgnoreProperties VÀO ĐÂY
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "MaLoaiVacXin")
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private LoaiVacXin loaiVacXin;

    @Column(name = "TenVacXin")
    private String tenVacXin;

    @Column(name = "HanSuDung")
    private LocalDate hanSuDung;

    @Column(name = "HamLuong")
    private String hamLuong;

    @Column(name = "PhongNguaBenh")
    private String phongNguaBenh;

    @Column(name = "DoTuoiTiemChung")
    private String doTuoiTiemChung;

    @Column(name = "DonGia")
    private Double donGia;

    @Column(name = "DieuKienBaoQuan")
    private String dieuKienBaoQuan;

    @Column(name = "flag_delete")
    private Boolean flagDelete = false;
}