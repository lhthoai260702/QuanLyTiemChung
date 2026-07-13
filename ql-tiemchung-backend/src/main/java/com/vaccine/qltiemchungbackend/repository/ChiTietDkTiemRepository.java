package com.vaccine.qltiemchungbackend.repository;

import com.vaccine.qltiemchungbackend.dto.NguoiDangKyProjection;
import com.vaccine.qltiemchungbackend.dto.ReminderProjection;
import com.vaccine.qltiemchungbackend.entity.ChiTietDkTiem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * ChiTietDkTiemRepository
 * * Version 1.0
 * * Date: 03-07-2026
 * * Copyright
 * * Modification Logs:
 * DATE       AUTHOR    DESCRIPTION
 * -----------------------------------------------------------------------
 * 03-07-2026 lhthoai   Create
 */
@Repository
public interface ChiTietDkTiemRepository extends JpaRepository<ChiTietDkTiem, Long> {

    /**
     * Lấy danh sách chi tiết đăng ký tiêm cần nhắc nhở.
     * Điều kiện: Chưa được lập hồ sơ (chưa tiêm), chưa bị xóa mềm,
     * và thời gian cần tiêm lớn hơn hoặc bằng ngày hiện tại.
     *
     * @return List<ReminderProjection> Danh sách các bản ghi nhắc nhở tiêm chủng
     */
    @Query(value = "SELECT " +
            "dk.MaChiTietDKTiem AS id, " +
            "bn.MaBenhNhan AS patientId, " +
            "bn.TenBenhNhan AS patientName, " +
            "CAST(dk.ThoiGianCanTiem AS VARCHAR) AS expectedDate, " +
            "v.TenVacXin AS vaccineName, " +
            "v.DonGia AS estimatedPrice, " +
            "tk.Email AS email " +
            "FROM CHITIET_DK_TIEM dk " +
            "JOIN BENHNHAN bn ON dk.MaBenhNhan = bn.MaBenhNhan " +
            "JOIN TAIKHOAN tk ON bn.MaTaiKhoan = tk.MaTaiKhoan " +
            "JOIN LOVACXIN lo ON dk.MaLo = lo.MaLo " +
            "JOIN VACXIN v ON lo.MaVacXin = v.MaVacXin " +
            "LEFT JOIN HOSOBENHAN hs ON dk.MaChiTietDKTiem = hs.MaChiTietDKTiem " +
            "WHERE (dk.flag_delete = FALSE OR dk.flag_delete IS NULL) " +
            "  AND hs.MaHoSoBenhAn IS NULL " +
            "  AND dk.ThoiGianCanTiem >= CURRENT_DATE " +
            "ORDER BY dk.ThoiGianCanTiem ASC", nativeQuery = true)
    List<ReminderProjection> findDanhSachNhacNho();

    /**
     * Lấy danh sách bệnh nhân đã đăng ký theo mã lịch tiêm trung tâm
     */
    @Query(value = "SELECT " +
            "CONCAT('BN', LPAD(CAST(bn.MaBenhNhan AS VARCHAR), 3, '0')) AS maBenhNhan, " +
            "bn.TenBenhNhan AS tenBenhNhan, " +
            "CAST(bn.NgaySinh AS VARCHAR) AS ngaySinh, " +
            "bn.GioiTinh AS gioiTinh, " +
            "bn.SDT AS sdt, " +
            "dk.TrangThai AS trangThaiTiem " +
            "FROM CHITIET_DK_TIEM dk " +
            "JOIN BENHNHAN bn ON dk.MaBenhNhan = bn.MaBenhNhan " +
            "WHERE dk.MaLichTiem = :maLichTiem " +
            "AND (dk.flag_delete = FALSE OR dk.flag_delete IS NULL)", nativeQuery = true)
    List<NguoiDangKyProjection> findDanhSachNguoiDangKyByLichTiem(@Param("maLichTiem") Long maLichTiem);
}