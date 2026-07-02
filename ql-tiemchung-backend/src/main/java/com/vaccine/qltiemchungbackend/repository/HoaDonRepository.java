package com.vaccine.qltiemchungbackend.repository;

import com.vaccine.qltiemchungbackend.dto.SupplierTransactionProjection;
import com.vaccine.qltiemchungbackend.entity.HoaDon;
import com.vaccine.qltiemchungbackend.dto.CustomerTransactionProjection;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface HoaDonRepository extends JpaRepository<HoaDon, Long> {

    @Query(value = "SELECT " +
            "CAST(hd.MaHoaDon AS VARCHAR) AS id, " +
            "CAST(hsba.ThoiGianTiem AS VARCHAR) AS date, " +
            "v.TenVacXin AS vaccineCode, " +
            "1 AS quantity, " +
            "bn.TenBenhNhan AS customerName, " +
            "hd.TongTien AS price " +
            "FROM HOSOBENHAN hsba " +
            "JOIN HOADON hd ON hsba.MaHoaDon = hd.MaHoaDon " +
            "JOIN CHITIET_DK_TIEM ctdkt ON hsba.MaChiTietDKTiem = ctdkt.MaChiTietDKTiem " +
            "JOIN LOVACXIN lvx ON ctdkt.MaLo = lvx.MaLo " +
            "JOIN VACXIN v ON lvx.MaVacXin = v.MaVacXin " +
            "JOIN BENHNHAN bn ON ctdkt.MaBenhNhan = bn.MaBenhNhan " +
            "WHERE hd.flag_delete = FALSE OR hd.flag_delete IS NULL " +
            "ORDER BY hsba.ThoiGianTiem DESC", nativeQuery = true)
    List<CustomerTransactionProjection> findAllCustomerTransactions();

    @Query(value = "SELECT " +
            "CAST(hd.MaHoaDon AS VARCHAR) AS id, " +
            "CAST(lvx.NgayNhan AS VARCHAR) AS date, " +
            "CAST(lvx.MaVacXin AS VARCHAR) AS vaccineCode, " +
            "lvx.SoLuong AS quantity, " +
            "ncc.TenNhaCungCap AS supplierName, " +
            "hd.TongTien AS price " +
            "FROM LOVACXIN lvx " +
            "JOIN NHACUNGCAP ncc ON lvx.MaNhaCungCap = ncc.MaNhaCungCap " +
            "JOIN HOADON hd ON lvx.MaHoaDon = hd.MaHoaDon " +
            "WHERE hd.flag_delete = FALSE OR hd.flag_delete IS NULL " +
            "ORDER BY lvx.NgayNhan DESC LIMIT 100", nativeQuery = true)
    List<SupplierTransactionProjection> findAllSupplierTransactions();
}