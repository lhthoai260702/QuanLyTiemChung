package com.vaccine.qltiemchungbackend.repository;

import com.vaccine.qltiemchungbackend.dto.AccountRoleProjection;
import com.vaccine.qltiemchungbackend.entity.TaiKhoan;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

/**
 * TaiKhoanRepository
 * * Version 1.0
 * * Date: 03-07-2026
 * * Copyright
 * * Modification Logs:
 * DATE       AUTHOR    DESCRIPTION
 * -----------------------------------------------------------------------
 * 03-07-2026 lhthoai   Create
 */
@Repository
public interface TaiKhoanRepository extends JpaRepository<TaiKhoan, Long> {

    /**
     * Tìm tài khoản bằng Tên đăng nhập và Mật khẩu (Chức năng đăng nhập).
     *
     * @param tenDangNhap Tên đăng nhập
     * @param matKhau     Mật khẩu (đã mã hóa)
     * @return Optional<TaiKhoan> Tài khoản nếu hợp lệ
     */
    Optional<TaiKhoan> findByTenDangNhapAndMatKhauAndFlagDeleteFalseOrFlagDeleteIsNull(String tenDangNhap, String matKhau);

    /**
     * Lấy toàn bộ danh sách tài khoản cùng với chi tiết phân quyền và thông tin cá nhân.
     *
     * @return List<AccountRoleProjection> Danh sách thông tin tài khoản dạng Projection
     */
    @Query(value = "SELECT " +
            "tk.MaTaiKhoan as maTaiKhoan, tk.TenDangNhap as tenDangNhap, tk.HoTen as hoTen, " +
            "tk.CMND as cmnd, tk.NoiO as noiO, tk.MoTa as moTa, tk.Email as email, tk.flag_delete as flagDelete, " +
            "COALESCE(STRING_AGG(pq.TenQuyen, ', '), 'Chưa cấp quyền') as phanQuyen, " +
            "MAX(pq.MaQuyen) as maQuyen, " +
            "MAX(nv.NamSinh) as namSinh, MAX(COALESCE(nv.SDT, bn.SDT)) as sdt, " +
            "MAX(CAST(bn.NgaySinh AS VARCHAR)) as ngaySinh, MAX(bn.DiaChi) as diaChi, " +
            "MAX(bn.NguoiGiamHo) as nguoiGiamHo, MAX(bn.GioiTinh) as gioiTinh " +
            "FROM TAIKHOAN tk " +
            "LEFT JOIN CHITIETPHANQUYEN ct ON tk.MaTaiKhoan = ct.MaTaiKhoan " +
            "LEFT JOIN PHANQUYEN pq ON ct.MaQuyen = pq.MaQuyen " +
            "LEFT JOIN NHANVIEN nv ON tk.MaTaiKhoan = nv.MaTaiKhoan " +
            "LEFT JOIN BENHNHAN bn ON tk.MaTaiKhoan = bn.MaTaiKhoan " +
            "WHERE tk.flag_delete = FALSE OR tk.flag_delete IS NULL " +
            "GROUP BY tk.MaTaiKhoan, tk.TenDangNhap, tk.HoTen, tk.CMND, tk.NoiO, tk.MoTa, tk.Email, tk.flag_delete " +
            "ORDER BY LOWER(tk.HoTen) ASC", nativeQuery = true)
    List<AccountRoleProjection> findAllAccountsWithRoles();

    /**
     * Thêm phân quyền cho tài khoản.
     *
     * @param maTaiKhoan Mã tài khoản
     * @param maQuyen    Mã quyền cấp phát
     */
    @Modifying
    @Transactional
    @Query(value = "INSERT INTO CHITIETPHANQUYEN (MaTaiKhoan, MaQuyen) VALUES (:maTaiKhoan, :maQuyen)", nativeQuery = true)
    void insertChiTietPhanQuyen(@Param("maTaiKhoan") Long maTaiKhoan, @Param("maQuyen") Long maQuyen);

    /**
     * Thêm hồ sơ cho Nhân viên mới.
     *
     * @param maTaiKhoan  Mã tài khoản
     * @param tenNhanVien Tên nhân viên
     * @param namSinh     Năm sinh
     * @param sdt         Số điện thoại
     */
    @Modifying
    @Transactional
    @Query(value = "INSERT INTO NHANVIEN (MaTaiKhoan, TenNhanVien, NamSinh, SDT, flag_delete) VALUES (:maTaiKhoan, :tenNhanVien, :namSinh, :sdt, FALSE)", nativeQuery = true)
    void insertNhanVien(@Param("maTaiKhoan") Long maTaiKhoan, @Param("tenNhanVien") String tenNhanVien, @Param("namSinh") Integer namSinh, @Param("sdt") String sdt);

    /**
     * Thêm hồ sơ cho Bệnh nhân mới.
     *
     * @param maTaiKhoan  Mã tài khoản
     * @param tenBenhNhan Tên bệnh nhân
     * @param ngaySinh    Ngày sinh
     * @param diaChi      Địa chỉ
     * @param nguoiGiamHo Người giám hộ
     * @param sdt         Số điện thoại
     * @param gioiTinh    Giới tính
     */
    @Modifying
    @Transactional
    @Query(value = "INSERT INTO BENHNHAN (MaTaiKhoan, TenBenhNhan, NgaySinh, DiaChi, NguoiGiamHo, SDT, GioiTinh, flag_delete) VALUES (:maTaiKhoan, :tenBenhNhan, CAST(:ngaySinh AS DATE), :diaChi, :nguoiGiamHo, :sdt, :gioiTinh, FALSE)", nativeQuery = true)
    void insertBenhNhan(@Param("maTaiKhoan") Long maTaiKhoan, @Param("tenBenhNhan") String tenBenhNhan, @Param("ngaySinh") String ngaySinh, @Param("diaChi") String diaChi, @Param("nguoiGiamHo") String nguoiGiamHo, @Param("sdt") String sdt, @Param("gioiTinh") String gioiTinh);

    /**
     * Cập nhật mã phân quyền cho một tài khoản.
     *
     * @param maTaiKhoan Mã tài khoản
     * @param maQuyen    Mã quyền mới
     */
    @Modifying
    @Transactional
    @Query(value = "UPDATE CHITIETPHANQUYEN SET MaQuyen = :maQuyen WHERE MaTaiKhoan = :maTaiKhoan", nativeQuery = true)
    void updateChiTietPhanQuyen(@Param("maTaiKhoan") Long maTaiKhoan, @Param("maQuyen") Long maQuyen);

    /**
     * Cập nhật thông tin nhân viên.
     *
     * @param maTaiKhoan  Mã tài khoản
     * @param tenNhanVien Tên nhân viên
     * @param namSinh     Năm sinh
     * @param sdt         Số điện thoại
     * @return int Số dòng bị ảnh hưởng
     */
    @Modifying
    @Transactional
    @Query(value = "UPDATE NHANVIEN SET TenNhanVien = :tenNhanVien, NamSinh = :namSinh, SDT = :sdt WHERE MaTaiKhoan = :maTaiKhoan", nativeQuery = true)
    int updateNhanVien(@Param("maTaiKhoan") Long maTaiKhoan, @Param("tenNhanVien") String tenNhanVien, @Param("namSinh") Integer namSinh, @Param("sdt") String sdt);

    /**
     * Cập nhật thông tin bệnh nhân.
     *
     * @param maTaiKhoan  Mã tài khoản
     * @param tenBenhNhan Tên bệnh nhân
     * @param ngaySinh    Ngày sinh
     * @param diaChi      Địa chỉ
     * @param nguoiGiamHo Người giám hộ
     * @param sdt         Số điện thoại
     * @param gioiTinh    Giới tính
     * @return int Số dòng bị ảnh hưởng
     */
    @Modifying
    @Transactional
    @Query(value = "UPDATE BENHNHAN SET TenBenhNhan = :tenBenhNhan, NgaySinh = CAST(:ngaySinh AS DATE), DiaChi = :diaChi, NguoiGiamHo = :nguoiGiamHo, SDT = :sdt, GioiTinh = :gioiTinh WHERE MaTaiKhoan = :maTaiKhoan", nativeQuery = true)
    int updateBenhNhan(@Param("maTaiKhoan") Long maTaiKhoan, @Param("tenBenhNhan") String tenBenhNhan, @Param("ngaySinh") String ngaySinh, @Param("diaChi") String diaChi, @Param("nguoiGiamHo") String nguoiGiamHo, @Param("sdt") String sdt, @Param("gioiTinh") String gioiTinh);

    /**
     * Xóa mềm (Soft delete) tài khoản khỏi hệ thống bằng cách chuyển cờ flag_delete sang TRUE.
     *
     * @param maTaiKhoan Mã tài khoản cần xóa
     */
    @Modifying
    @Transactional
    @Query(value = "UPDATE TAIKHOAN SET flag_delete = TRUE WHERE MaTaiKhoan = :maTaiKhoan", nativeQuery = true)
    void softDeleteAccount(@Param("maTaiKhoan") Long maTaiKhoan);

    /**
     * Tìm kiếm tài khoản dựa vào tên đăng nhập (hỗ trợ kiểm tra tồn tại).
     *
     * @param tenDangNhap Tên đăng nhập cần tìm
     * @return Optional<TaiKhoan> Kết quả tài khoản nếu tìm thấy
     */
    Optional<TaiKhoan> findByTenDangNhapAndFlagDeleteFalseOrFlagDeleteIsNull(String tenDangNhap);

    /**
     * Truy xuất mã quyền cao nhất thuộc về một tài khoản cụ thể.
     *
     * @param maTaiKhoan Mã tài khoản
     * @return Long Mã quyền
     */
    @Query(value = "SELECT MAX(MaQuyen) FROM CHITIETPHANQUYEN WHERE MaTaiKhoan = :maTaiKhoan", nativeQuery = true)
    Long findMaQuyenByMaTaiKhoan(@Param("maTaiKhoan") Long maTaiKhoan);
}