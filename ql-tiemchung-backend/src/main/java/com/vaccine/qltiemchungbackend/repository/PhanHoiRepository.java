package com.vaccine.qltiemchungbackend.repository;

import com.vaccine.qltiemchungbackend.dto.PhanHoiDTO;
import com.vaccine.qltiemchungbackend.dto.PhanHoiProjection;
import com.vaccine.qltiemchungbackend.entity.PhanHoi;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Repository
public interface PhanHoiRepository extends JpaRepository<PhanHoi, Long> {

    // 1. Insert cho Phản hồi sau khi tiêm
    @Modifying
    @Transactional
    @Query(value = "INSERT INTO PHANHOI (MaBenhNhan, TenVacXin, ThoiGianTiem, DiaDiemTiem, TenNhanVienPhuTrach, NoiDung, flag_delete) " +
            "VALUES (:maBenhNhan, :tenVacXin, CAST(:thoiGianTiem AS DATE), :diaDiemTiem, :tenNhanVien, :noiDung, FALSE)", nativeQuery = true)
    void insertNormalFeedback(@Param("maBenhNhan") Long maBenhNhan,
                              @Param("tenVacXin") String tenVacXin,
                              @Param("thoiGianTiem") String thoiGianTiem,
                              @Param("diaDiemTiem") String diaDiemTiem,
                              @Param("tenNhanVien") String tenNhanVien,
                              @Param("noiDung") String noiDung); // THÊM PARAM NÀY

    // 2. Insert cho Phản hồi cấp cao (Giám đốc)
    @Modifying
    @Transactional
    @Query(value = "INSERT INTO PHANHOICC (MaBenhNhan, name, content, flag_delete) " +
            "VALUES (:maBenhNhan, :name, :content, FALSE)", nativeQuery = true)
    void insertHighLevelFeedback(@Param("maBenhNhan") Long maBenhNhan,
                                 @Param("name") String name,
                                 @Param("content") String content);

    @Query(value = "SELECT " +
            "p.MaPhanHoi AS id, " +
            "bn.TenBenhNhan AS customerName, " +
            "p.NoiDung AS comments, " +
            "tk.Email AS email, " +
            "COALESCE(p.TenNhanVienPhuTrach, 'Mới') AS status, " +
            "p.NoiDungPhanHoi AS responseText, " +
            "CAST(p.ThoiGianTiem AS VARCHAR) AS thoiGianTiem " + // THÊM CỘT NÀY
            "FROM PHANHOI p " +
            "JOIN BENHNHAN bn ON p.MaBenhNhan = bn.MaBenhNhan " +
            "JOIN TAIKHOAN tk ON bn.MaTaiKhoan = tk.MaTaiKhoan " +
            "WHERE p.flag_delete = FALSE OR p.flag_delete IS NULL " +
            "ORDER BY p.ThoiGianTiem DESC NULLS LAST", nativeQuery = true) // TỰ ĐỘNG SORT TỪ GẦN -> XA
    List<PhanHoiProjection> layDanhSachPhanHoiProjection();

    @Modifying
    @Transactional
    @Query(value = "UPDATE PHANHOI SET NoiDungPhanHoi = :noiDungPhanHoi, TenNhanVienPhuTrach = :nhanVien WHERE MaPhanHoi = :id", nativeQuery = true)
    void capNhatPhanHoi(@Param("id") Long id, @Param("noiDungPhanHoi") String noiDungPhanHoi, @Param("nhanVien") String nhanVien);

    @Query(value = "SELECT " +
            "p.MaPhanHoi AS id, " +
            "p.NoiDung AS content, " +
            "p.NoiDungPhanHoi AS responseText, " +
            "CAST(p.ThoiGianTiem AS VARCHAR) AS time " +
            "FROM PHANHOI p " +
            "WHERE p.MaBenhNhan = :maBenhNhan AND (p.flag_delete = FALSE OR p.flag_delete IS NULL) " +
            "ORDER BY p.MaPhanHoi DESC", nativeQuery = true)
    List<Object[]> layDanhSachPhanHoiTheoBenhNhan(@Param("maBenhNhan") Long maBenhNhan);
}