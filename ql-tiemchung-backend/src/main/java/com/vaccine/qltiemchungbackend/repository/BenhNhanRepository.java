package com.vaccine.qltiemchungbackend.repository;

import com.vaccine.qltiemchungbackend.dto.LichSuTiemProjection;
import com.vaccine.qltiemchungbackend.entity.BenhNhan;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BenhNhanRepository extends JpaRepository<BenhNhan, Long> {

    @Query("SELECT b FROM BenhNhan b WHERE b.flagDelete = false OR b.flagDelete IS NULL ORDER BY LOWER(b.tenBenhNhan) ASC")
    List<BenhNhan> findByFlagDeleteFalseOrFlagDeleteIsNull();

    @Query(value = "SELECT " +
            "  dk.MaChiTietDKTiem AS recordId, " +
            "  v.TenVacXin AS vaccineName, " +
            "  TO_CHAR(COALESCE(h.ThoiGianTiem, dk.ThoiGianCanTiem), 'YYYY-MM-DD') AS date, " +
            "  COALESCE(h.PhanUngSauTiem, '') AS sideEffect, " +
            "  COALESCE(h.ThoiGianTacDung, '') AS thoiGianTacDung, " +
            "  CASE " +
            "    WHEN h.MaHoSoBenhAn IS NOT NULL THEN 'Đã tiêm' " +
            "    ELSE 'Chưa tiêm' " +
            "  END AS status, " +
            "  COALESCE(ltc.DiaDiem, 'Chưa xác định') AS place, " +
            "  lv.TenLoaiVacXin AS vaccineType, " +
            "  v.HamLuong AS dosage " +
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
}