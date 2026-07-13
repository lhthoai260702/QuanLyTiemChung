package com.vaccine.qltiemchungbackend.repository;

import com.vaccine.qltiemchungbackend.dto.LichSuTiemProjection;
import com.vaccine.qltiemchungbackend.entity.BenhNhan;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * BenhNhanRepository
 * * Version 1.0
 * * Date: 13-07-2026
 * * Copyright
 * * Modification Logs:
 * DATE        AUTHOR      DESCRIPTION
 * -----------------------------------------------------------------------
 * 13-07-2026  lhthoai     Create
 */
@Repository
public interface BenhNhanRepository extends JpaRepository<BenhNhan, Long> {

    /**
     * Lấy danh sách tất cả bệnh nhân chưa bị xóa trong hệ thống,
     * kết quả được sắp xếp theo tên bệnh nhân theo thứ tự từ điển tăng dần.
     *
     * @return List<BenhNhan> danh sách bệnh nhân hợp lệ
     */
    @Query("SELECT b FROM BenhNhan b WHERE b.flagDelete = false OR b.flagDelete IS NULL ORDER BY LOWER(b.tenBenhNhan) ASC")
    List<BenhNhan> findByFlagDeleteFalseOrFlagDeleteIsNull();

    /**
     * Truy xuất chi tiết lịch sử đăng ký và tiêm chủng của một bệnh nhân,
     * bao gồm thông tin vắc xin, thời gian, địa điểm và phản ứng sau tiêm.
     *
     * @param maBenhNhan mã định danh của bệnh nhân cần tra cứu
     * @return List<LichSuTiemProjection> danh sách các record lịch sử tiêm chủng dưới dạng projection
     */
    @Query(value = "SELECT " +
            "  dk.MaChiTietDKTiem AS recordId, " +
            "  v.TenVacXin AS vaccineName, " +
            "  TO_CHAR(COALESCE(h.ThoiGianTiem, dk.ThoiGianCanTiem), 'YYYY-MM-DD') AS date, " +
            "  COALESCE(dk.GioTiem, '') AS time, " +
            "  COALESCE(h.PhanUngSauTiem, '') AS sideEffect, " +
            "  COALESCE(h.ThoiGianTacDung, '') AS thoiGianTacDung, " +
            "  CASE " +
            "    WHEN h.MaHoSoBenhAn IS NOT NULL THEN 'Đã tiêm' " +
            "    ELSE COALESCE(dk.TrangThai, 'Chưa tiêm') " +
            "  END AS status, " +
            "  COALESCE(ltc.DiaDiem, 'Chưa xác định') AS place, " +
            "  lv.TenLoaiVacXin AS vaccineType, " +
            "  v.HamLuong AS dosage, " +
            "  dk.GhiChu AS ghiChu " +
            "FROM CHITIET_DK_TIEM dk " +
            "JOIN LOVACXIN lo ON dk.MaLo = lo.MaLo " +
            "JOIN VACXIN v ON lo.MaVacXin = v.MaVacXin " +
            "LEFT JOIN LOAIVACXIN lv ON v.MaLoaiVacXin = lv.MaLoaiVacXin " +
            "LEFT JOIN LICHTIEMCHUNG ltc ON dk.MaLichTiem = ltc.MaLichTiem " +
            "LEFT JOIN HOSOBENHAN h ON dk.MaChiTietDKTiem = h.MaChiTietDKTiem " +
            "WHERE dk.MaBenhNhan = :maBenhNhan " +
            "  AND (dk.flag_delete = false OR dk.flag_delete IS NULL)",
            nativeQuery = true)
    List<LichSuTiemProjection> findLichSuTiemByMaBenhNhan(@Param("maBenhNhan") Long maBenhNhan);

    /**
     * Tìm kiếm hồ sơ bệnh nhân dựa trên tên đăng nhập của tài khoản người dùng liên kết.
     *
     * @param username tên đăng nhập của tài khoản (yêu cầu tài khoản chưa bị xóa)
     * @return Optional<BenhNhan> đối tượng bệnh nhân nếu tìm thấy, ngược lại trả về empty
     */
    @Query("SELECT b FROM BenhNhan b WHERE b.maTaiKhoan = (SELECT t.maTaiKhoan FROM TaiKhoan t WHERE t.tenDangNhap = :username AND (t.flagDelete = FALSE OR t.flagDelete IS NULL))")
    Optional<BenhNhan> findByUsername(@Param("username") String username);
}