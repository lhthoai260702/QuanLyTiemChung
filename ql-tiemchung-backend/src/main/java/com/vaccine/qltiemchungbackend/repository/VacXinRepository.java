package com.vaccine.qltiemchungbackend.repository;

import com.vaccine.qltiemchungbackend.dto.CustomerVaccineProjection;
import com.vaccine.qltiemchungbackend.entity.VacXin;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * VacXinRepository
 * * Version 1.0
 * * Date: 03-07-2026
 * * Copyright
 * * Modification Logs:
 * DATE       AUTHOR    DESCRIPTION
 * -----------------------------------------------------------------------
 * 03-07-2026 lhthoai   Create
 */
@Repository
public interface VacXinRepository extends JpaRepository<VacXin, Long> {

    /**
     * Tìm kiếm thông tin vắc-xin thông qua tên vắc-xin.
     *
     * @param tenVacXin Tên vắc-xin cần tìm kiếm
     * @return Optional<VacXin> Thông tin vắc-xin nếu có
     */
    Optional<VacXin> findByTenVacXin(String tenVacXin);

    /**
     * Lấy danh sách toàn bộ các loại vắc-xin khả dụng (chưa bị xóa mềm).
     * Sắp xếp theo tên vắc-xin (Tăng dần).
     *
     * @return List<VacXin> Danh sách vắc-xin
     */
    @Query("SELECT v FROM VacXin v WHERE v.flagDelete = false OR v.flagDelete IS NULL ORDER BY LOWER(v.tenVacXin) ASC")
    List<VacXin> findAllAvailable();

    /**
     * Lấy danh sách thông tin hiển thị vắc-xin dành riêng cho phía Khách hàng (Customer).
     * Dữ liệu bao gồm các thông số cơ bản và tổng số lượng tồn kho của từng vắc-xin.
     *
     * @return List<CustomerVaccineProjection> Danh sách thông tin vắc-xin
     */
    @Query(value = "SELECT " +
            "v.MaVacXin as maVacXin, " +
            "v.TenVacXin as tenVacXin, " +
            "lv.TenLoaiVacXin as loaiVacXin, " +
            "v.PhongNguaBenh as phongNguaBenh, " +
            "v.DoTuoiTiemChung as doTuoiTiemChung, " +
            "v.DonGia as donGia, " +
            "COALESCE(SUM(lo.SoLuong), 0) as tonKho " +
            "FROM VACXIN v " +
            "LEFT JOIN LOAIVACXIN lv ON v.MaLoaiVacXin = lv.MaLoaiVacXin " +
            "LEFT JOIN LOVACXIN lo ON v.MaVacXin = lo.MaVacXin AND (lo.flag_delete = FALSE OR lo.flag_delete IS NULL) " +
            "WHERE v.flag_delete = FALSE OR v.flag_delete IS NULL " +
            "GROUP BY v.MaVacXin, v.TenVacXin, lv.TenLoaiVacXin, v.PhongNguaBenh, v.DoTuoiTiemChung, v.DonGia " +
            "ORDER BY LOWER(v.TenVacXin) ASC", nativeQuery = true)
    List<CustomerVaccineProjection> findAllVaccinesForCustomer();

    /**
     * Tìm danh sách các vắc-xin trực thuộc một mã loại vắc-xin cụ thể.
     *
     * @param maLoaiVacXin Mã phân loại vắc-xin
     * @return List<VacXin> Danh sách vắc-xin cùng loại
     */
    @Query("SELECT v FROM VacXin v WHERE v.loaiVacXin.maLoaiVacXin = :maLoaiVacXin AND (v.flagDelete = false OR v.flagDelete IS NULL)")
    List<VacXin> findByLoaiVacXinId(@Param("maLoaiVacXin") Long maLoaiVacXin);
}