package com.vaccine.qltiemchungbackend.repository;

import com.vaccine.qltiemchungbackend.dto.PhanHoiProjection;
import com.vaccine.qltiemchungbackend.entity.PhanHoi;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * PhanHoiRepository
 * * Version 1.0
 * * Date: 03-07-2026
 * * Copyright
 * * Modification Logs:
 * DATE       AUTHOR    DESCRIPTION
 * -----------------------------------------------------------------------
 * 03-07-2026 lhthoai   Create
 */
@Repository
public interface PhanHoiRepository extends JpaRepository<PhanHoi, Long> {

    /**
     * Thêm mới một phản hồi thông thường sau khi tiêm.
     *
     * @param maBenhNhan   Mã bệnh nhân
     * @param tenVacXin    Tên vắc-xin đã tiêm
     * @param thoiGianTiem Thời gian thực hiện tiêm chủng
     * @param diaDiemTiem  Địa điểm tiêm chủng
     * @param tenNhanVien  Tên nhân viên phụ trách
     * @param noiDung      Nội dung phản hồi từ khách hàng
     */
    @Modifying
    @Transactional
    @Query(value = "INSERT INTO PHANHOI (MaBenhNhan, TenVacXin, ThoiGianTiem, DiaDiemTiem, TenNhanVienPhuTrach, NoiDung, flag_delete) " +
            "VALUES (:maBenhNhan, :tenVacXin, CAST(:thoiGianTiem AS DATE), :diaDiemTiem, :tenNhanVien, :noiDung, FALSE)", nativeQuery = true)
    void insertNormalFeedback(@Param("maBenhNhan") Long maBenhNhan,
                              @Param("tenVacXin") String tenVacXin,
                              @Param("thoiGianTiem") String thoiGianTiem,
                              @Param("diaDiemTiem") String diaDiemTiem,
                              @Param("tenNhanVien") String tenNhanVien,
                              @Param("noiDung") String noiDung);

    /**
     * Thêm mới một phản hồi cấp cao (Gửi trực tiếp giám đốc/quản lý).
     *
     * @param maBenhNhan Mã bệnh nhân
     * @param name       Tiêu đề/Tên loại phản hồi
     * @param content    Nội dung phản hồi chi tiết
     */
    @Modifying
    @Transactional
    @Query(value = "INSERT INTO PHANHOICC (MaBenhNhan, name, content, flag_delete) " +
            "VALUES (:maBenhNhan, :name, :content, FALSE)", nativeQuery = true)
    void insertHighLevelFeedback(@Param("maBenhNhan") Long maBenhNhan,
                                 @Param("name") String name,
                                 @Param("content") String content);

    /**
     * Lấy toàn bộ danh sách phản hồi để hiển thị cho phía Quản trị viên.
     * Trả về dữ liệu dạng Projection, tự động sắp xếp theo thời gian tiêm từ gần đến xa.
     *
     * @return List<PhanHoiProjection> Danh sách phản hồi
     */
    @Query(value = "SELECT " +
            "p.MaPhanHoi AS id, " +
            "bn.TenBenhNhan AS customerName, " +
            "p.NoiDung AS comments, " +
            "tk.Email AS email, " +
            "COALESCE(p.TenNhanVienPhuTrach, 'Mới') AS status, " +
            "p.NoiDungPhanHoi AS responseText, " +
            "CAST(p.ThoiGianTiem AS VARCHAR) AS thoiGianTiem " +
            "FROM PHANHOI p " +
            "JOIN BENHNHAN bn ON p.MaBenhNhan = bn.MaBenhNhan " +
            "JOIN TAIKHOAN tk ON bn.MaTaiKhoan = tk.MaTaiKhoan " +
            "WHERE p.flag_delete = FALSE OR p.flag_delete IS NULL " +
            "ORDER BY p.ThoiGianTiem DESC NULLS LAST", nativeQuery = true)
    List<PhanHoiProjection> layDanhSachPhanHoiProjection();

    /**
     * Cập nhật nội dung trả lời phản hồi và lưu thông tin nhân viên phụ trách.
     *
     * @param id             Mã phản hồi
     * @param noiDungPhanHoi Nội dung quản trị viên trả lời
     * @param nhanVien       Tên nhân viên phụ trách
     */
    @Modifying
    @Transactional
    @Query(value = "UPDATE PHANHOI SET NoiDungPhanHoi = :noiDungPhanHoi, TenNhanVienPhuTrach = :nhanVien WHERE MaPhanHoi = :id", nativeQuery = true)
    void capNhatPhanHoi(@Param("id") Long id, @Param("noiDungPhanHoi") String noiDungPhanHoi, @Param("nhanVien") String nhanVien);

    /**
     * Lấy danh sách phản hồi thông thường dựa theo mã bệnh nhân.
     *
     * @param maBenhNhan Mã bệnh nhân cần truy vấn
     * @return List<Object[]> Danh sách dữ liệu phản hồi
     */
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