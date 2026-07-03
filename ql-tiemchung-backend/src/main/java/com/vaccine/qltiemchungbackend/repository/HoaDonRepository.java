package com.vaccine.qltiemchungbackend.repository;

import com.vaccine.qltiemchungbackend.dto.CustomerTransactionProjection;
import com.vaccine.qltiemchungbackend.dto.SupplierTransactionProjection;
import com.vaccine.qltiemchungbackend.entity.HoaDon;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * HoaDonRepository
 * * Version 1.0
 * * Date: 03-07-2026
 * * Copyright
 * * Modification Logs:
 * DATE       AUTHOR    DESCRIPTION
 * -----------------------------------------------------------------------
 * 03-07-2026 lhthoai   Create
 */
@Repository
public interface HoaDonRepository extends JpaRepository<HoaDon, Long> {

    /**
     * Lấy danh sách tất cả các hóa đơn (giao dịch) của khách hàng.
     * Truy vấn kết hợp với bảng Hồ sơ bệnh án, Chi tiết đăng ký tiêm và Vắc-xin.
     *
     * @return List<CustomerTransactionProjection> Danh sách giao dịch khách hàng
     */
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

    /**
     * Lấy danh sách 100 giao dịch (hóa đơn) nhập hàng gần nhất từ nhà cung cấp.
     * Liên kết dữ liệu bảng Lô vắc-xin và Nhà cung cấp.
     *
     * @return List<SupplierTransactionProjection> Danh sách giao dịch với nhà cung cấp
     */
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