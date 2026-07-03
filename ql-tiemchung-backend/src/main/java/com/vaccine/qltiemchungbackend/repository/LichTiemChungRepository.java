package com.vaccine.qltiemchungbackend.repository;

import com.vaccine.qltiemchungbackend.entity.LichTiemChung;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * LichTiemChungRepository
 * * Version 1.0
 * * Date: 03-07-2026
 * * Copyright
 * * Modification Logs:
 * DATE       AUTHOR    DESCRIPTION
 * -----------------------------------------------------------------------
 * 03-07-2026 lhthoai   Create
 */
@Repository
public interface LichTiemChungRepository extends JpaRepository<LichTiemChung, Long> {

    /**
     * Lấy danh sách tất cả các lịch tiêm chủng chưa bị xóa mềm.
     * Sắp xếp giảm dần (DESC) theo ngày tiêm mới nhất lên đầu.
     *
     * @return List<LichTiemChung> Danh sách lịch tiêm chủng
     */
    @Query(value = "SELECT * FROM LICHTIEMCHUNG WHERE flag_delete = FALSE OR flag_delete IS NULL ORDER BY NgayTiem DESC", nativeQuery = true)
    List<LichTiemChung> findByFlagDeleteFalseOrFlagDeleteIsNull();

    /**
     * Tìm Mã Nhân Viên dựa trên Tên nhân viên (để map với giao diện checkbox).
     *
     * @param tenNhanVien Tên của nhân viên cần tìm
     * @return Long Mã nhân viên tương ứng
     */
    @Query(value = "SELECT MaNhanVien FROM NHANVIEN WHERE TenNhanVien = :tenNhanVien AND (flag_delete = FALSE OR flag_delete IS NULL) LIMIT 1", nativeQuery = true)
    Long findMaNhanVienByTen(@Param("tenNhanVien") String tenNhanVien);

    /**
     * Thêm mới dữ liệu vào bảng Chi tiết Nhân viên Tham gia (CHITIET_NV_THAMGIA).
     *
     * @param maNhanVien Mã nhân viên tham gia
     * @param maLichTiem Mã lịch tiêm tương ứng
     */
    @Modifying
    @Transactional
    @Query(value = "INSERT INTO CHITIET_NV_THAMGIA (MaNhanVien, MaLichTiem) VALUES (:maNhanVien, :maLichTiem)", nativeQuery = true)
    void insertChiTietNhanVien(@Param("maNhanVien") Long maNhanVien, @Param("maLichTiem") Long maLichTiem);

    /**
     * Lấy danh sách tên các bác sĩ/nhân viên hiển thị ra màn hình dựa trên mã lịch tiêm.
     *
     * @param maLichTiem Mã lịch tiêm cần lấy danh sách bác sĩ
     * @return List<String> Danh sách tên các bác sĩ
     */
    @Query(value = "SELECT nv.TenNhanVien FROM CHITIET_NV_THAMGIA ct JOIN NHANVIEN nv ON ct.MaNhanVien = nv.MaNhanVien WHERE ct.MaLichTiem = :maLichTiem", nativeQuery = true)
    List<String> findDanhSachBacSiByLichTiem(@Param("maLichTiem") Long maLichTiem);

    /**
     * Xóa toàn bộ chi tiết nhân viên tham gia của một lịch tiêm.
     *
     * @param maLichTiem Mã lịch tiêm cần xóa chi tiết tham gia
     */
    @Modifying
    @Transactional
    @Query(value = "DELETE FROM CHITIET_NV_THAMGIA WHERE MaLichTiem = :maLichTiem", nativeQuery = true)
    void deleteChiTietNhanVienByLichTiem(@Param("maLichTiem") Long maLichTiem);
}