package com.vaccine.qltiemchungbackend.repository;

import com.vaccine.qltiemchungbackend.entity.LichTiemChung;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Repository
public interface LichTiemChungRepository extends JpaRepository<LichTiemChung, Long> {

    // 👇 THAY ĐỔI Ở ĐÂY: Sắp xếp giảm dần (DESC) theo ngày tiêm mới nhất lên đầu
    @Query(value = "SELECT * FROM LICHTIEMCHUNG WHERE flag_delete = FALSE OR flag_delete IS NULL ORDER BY NgayTiem DESC", nativeQuery = true)
    List<LichTiemChung> findByFlagDeleteFalseOrFlagDeleteIsNull();

    // 1. Tìm Mã Nhân Viên dựa trên Tên (để map với giao diện checkbox)
    @Query(value = "SELECT MaNhanVien FROM NHANVIEN WHERE TenNhanVien = :tenNhanVien AND (flag_delete = FALSE OR flag_delete IS NULL) LIMIT 1", nativeQuery = true)
    Long findMaNhanVienByTen(@Param("tenNhanVien") String tenNhanVien);

    // 2. Insert vào bảng Chi tiết Tham gia
    @Modifying
    @Transactional
    @Query(value = "INSERT INTO CHITIET_NV_THAMGIA (MaNhanVien, MaLichTiem) VALUES (:maNhanVien, :maLichTiem)", nativeQuery = true)
    void insertChiTietNhanVien(@Param("maNhanVien") Long maNhanVien, @Param("maLichTiem") Long maLichTiem);

    // 3. Lấy danh sách tên bác sĩ hiển thị ra màn hình
    @Query(value = "SELECT nv.TenNhanVien FROM CHITIET_NV_THAMGIA ct JOIN NHANVIEN nv ON ct.MaNhanVien = nv.MaNhanVien WHERE ct.MaLichTiem = :maLichTiem", nativeQuery = true)
    List<String> findDanhSachBacSiByLichTiem(@Param("maLichTiem") Long maLichTiem);

    @Modifying
    @Transactional
    @Query(value = "DELETE FROM CHITIET_NV_THAMGIA WHERE MaLichTiem = :maLichTiem", nativeQuery = true)
    void deleteChiTietNhanVienByLichTiem(@Param("maLichTiem") Long maLichTiem);
}