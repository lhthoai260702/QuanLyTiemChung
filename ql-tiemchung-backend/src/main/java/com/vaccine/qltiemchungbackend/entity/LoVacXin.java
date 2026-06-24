package com.vaccine.qltiemchungbackend.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDate;

@Entity
@Table(name = "LOVACXIN")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class LoVacXin {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "MaLo")
    private Long maLo;

    // Thiết lập Khóa ngoại liên kết tới bảng VACXIN
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "MaVacXin")
    private VacXin vacXin;

    // Giữ liên kết dạng Long cho các khóa ngoại chưa cần Join phức tạp
    @Column(name = "MaNhaCungCap")
    private Long maNhaCungCap;

    @Column(name = "MaHoaDon")
    private Long maHoaDon;

    @Column(name = "SoLuong")
    private Integer soLuong;

    @Column(name = "TinhTrang")
    private String tinhTrang;

    @Column(name = "NgayNhan")
    private LocalDate ngayNhan;

    @Column(name = "NuocSanXuat")
    private String nuocSanXuat;

    @Column(name = "GiayPhep")
    private String giayPhep;

    @Column(name = "GhiChu")
    private String ghiChu;

    @Column(name = "flag_delete")
    private Boolean flagDelete = false;
}