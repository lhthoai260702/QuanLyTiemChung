package com.vaccine.qltiemchungbackend.repository;

import com.vaccine.qltiemchungbackend.dto.KhoVacXinDTO;
import com.vaccine.qltiemchungbackend.entity.LoVacXin;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * LoVacXinRepository
 * * Version 1.0
 * * Date: 03-07-2026
 * * Copyright
 * * Modification Logs:
 * DATE       AUTHOR    DESCRIPTION
 * -----------------------------------------------------------------------
 * 03-07-2026 lhthoai   Create
 */
@Repository
public interface LoVacXinRepository extends JpaRepository<LoVacXin, Long> {

    /**
     * Lấy toàn bộ danh sách thông tin lô vắc-xin trong kho.
     * Ánh xạ dữ liệu trực tiếp sang đối tượng KhoVacXinDTO.
     *
     * @return List<KhoVacXinDTO> Danh sách thông tin kho vắc-xin
     */
    @Query("SELECT new com.vaccine.qltiemchungbackend.dto.KhoVacXinDTO(" +
            "l.maLo, l.ngayNhan, l.giayPhep, l.nuocSanXuat, l.soLuong, l.tinhTrang, " +
            "v.maVacXin, v.tenVacXin, lv.tenLoaiVacXin, v.hamLuong, v.hanSuDung, v.dieuKienBaoQuan, v.doTuoiTiemChung, v.donGia, " +
            "l.maNhaCungCap, ncc.tenNhaCungCap, hd.tongTien) " +
            "FROM LoVacXin l " +
            "JOIN l.vacXin v " +
            "LEFT JOIN v.loaiVacXin lv " +
            "LEFT JOIN NhaCungCap ncc ON l.maNhaCungCap = ncc.maNhaCungCap " +
            "LEFT JOIN HoaDon hd ON l.maHoaDon = hd.maHoaDon " +
            "WHERE l.flagDelete = false AND v.flagDelete = false " +
            "ORDER BY l.ngayNhan DESC")
    List<KhoVacXinDTO> findAllKhoVacXin();

    /**
     * Tìm kiếm lô vắc-xin khả dụng (số lượng > 0 và chưa bị xóa mềm) dựa vào mã vắc-xin.
     * Dùng JPQL chuẩn để tránh lỗi Entity Mapping. Ưu tiên lấy lô có ngày nhận cũ nhất (ASC).
     *
     * @param maVacXin Mã vắc-xin cần tìm lô
     * @return Optional<LoVacXin> Đối tượng lô vắc-xin khả dụng nếu có
     */
    @Query("SELECT l FROM LoVacXin l WHERE l.vacXin.maVacXin = :maVacXin AND l.soLuong > 0 AND (l.flagDelete = false OR l.flagDelete IS NULL) ORDER BY l.ngayNhan ASC LIMIT 1")
    Optional<LoVacXin> findAvailableLotByVaccineId(@Param("maVacXin") Long maVacXin);

    /**
     * Tìm kiếm lô vắc-xin khả dụng (số lượng > 0 và chưa bị xóa mềm) dựa vào mã loại vắc-xin.
     *
     * @param maLoaiVacXin Mã loại vắc-xin cần tìm lô
     * @return Optional<LoVacXin> Đối tượng lô vắc-xin khả dụng nếu có
     */
    @Query("SELECT l FROM LoVacXin l WHERE l.vacXin.loaiVacXin.maLoaiVacXin = :maLoaiVacXin AND l.soLuong > 0 AND (l.flagDelete = false OR l.flagDelete IS NULL) ORDER BY l.ngayNhan ASC LIMIT 1")
    Optional<LoVacXin> findAvailableLotByLoaiVacXinId(@Param("maLoaiVacXin") Long maLoaiVacXin);
}