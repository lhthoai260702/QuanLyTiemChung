package com.vaccine.qltiemchungbackend.repository;

import com.vaccine.qltiemchungbackend.entity.PhanHoiCC;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * PhanHoiCCRepository
 * * Version 1.0
 * * Date: 03-07-2026
 * * Copyright
 * * Modification Logs:
 * DATE       AUTHOR    DESCRIPTION
 * -----------------------------------------------------------------------
 * 03-07-2026 lhthoai   Create
 */
@Repository
public interface PhanHoiCCRepository extends JpaRepository<PhanHoiCC, Long> {

    /**
     * Lấy danh sách phản hồi cấp cao (VIP) theo mã bệnh nhân (Dành cho Customer).
     *
     * @param maBenhNhan Mã bệnh nhân cần truy vấn
     * @return List<Object[]> Danh sách thông tin phản hồi
     */
    @Query(value = "SELECT " +
            "p.MaPhanHoiCC AS id, " +
            "p.content AS content, " +
            "p.NoiDungTraLoi AS responseText " +
            "FROM PHANHOICC p " +
            "WHERE p.MaBenhNhan = :maBenhNhan AND (p.flag_delete = FALSE OR p.flag_delete IS NULL) " +
            "ORDER BY p.MaPhanHoiCC DESC", nativeQuery = true)
    List<Object[]> layDanhSachPhanHoiCCTheoBenhNhan(@Param("maBenhNhan") Long maBenhNhan);

    /**
     * Lấy TOÀN BỘ danh sách phản hồi cấp cao (Dành cho Admin/Quản lý).
     *
     * @return List<Object[]> Danh sách toàn bộ phản hồi cấp cao
     */
    @Query(value = "SELECT " +
            "p.MaPhanHoiCC AS id, " +
            "bn.TenBenhNhan AS customerName, " +
            "p.content AS comments, " +
            "tk.Email AS email, " +
            "p.name AS status, " +
            "p.NoiDungTraLoi AS responseText, " +
            "'---' AS thoiGianTiem " +
            "FROM PHANHOICC p " +
            "JOIN BENHNHAN bn ON p.MaBenhNhan = bn.MaBenhNhan " +
            "JOIN TAIKHOAN tk ON bn.MaTaiKhoan = tk.MaTaiKhoan " +
            "WHERE p.flag_delete = FALSE OR p.flag_delete IS NULL " +
            "ORDER BY p.MaPhanHoiCC DESC", nativeQuery = true)
    List<Object[]> layTatCaPhanHoiCC();

    /**
     * Cập nhật nội dung trả lời cho một phản hồi cấp cao.
     *
     * @param id            Mã phản hồi cấp cao cần cập nhật
     * @param noiDungTraLoi Nội dung trả lời từ hệ thống/nhân viên
     */
    @Modifying
    @Transactional
    @Query(value = "UPDATE PHANHOICC SET NoiDungTraLoi = :noiDungTraLoi WHERE MaPhanHoiCC = :id", nativeQuery = true)
    void capNhatPhanHoiCC(@Param("id") Long id, @Param("noiDungTraLoi") String noiDungTraLoi);
}