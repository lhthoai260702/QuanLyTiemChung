package com.vaccine.qltiemchungbackend.repository;

import com.vaccine.qltiemchungbackend.dto.CustomerVaccineProjection;
import com.vaccine.qltiemchungbackend.entity.VacXin;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface VacXinRepository extends JpaRepository<VacXin, Long> {
    Optional<VacXin> findByTenVacXin(String tenVacXin);

    @Query("SELECT v FROM VacXin v WHERE v.flagDelete = false OR v.flagDelete IS NULL ORDER BY LOWER(v.tenVacXin) ASC")
    List<VacXin> findAllAvailable();

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

    @Query("SELECT v FROM VacXin v WHERE v.loaiVacXin.maLoaiVacXin = :maLoaiVacXin AND (v.flagDelete = false OR v.flagDelete IS NULL)")
    List<VacXin> findByLoaiVacXinId(@Param("maLoaiVacXin") Long maLoaiVacXin);
}