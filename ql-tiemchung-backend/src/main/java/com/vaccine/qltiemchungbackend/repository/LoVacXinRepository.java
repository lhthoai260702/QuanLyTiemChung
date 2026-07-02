package com.vaccine.qltiemchungbackend.repository;

import com.vaccine.qltiemchungbackend.dto.KhoVacXinDTO;
import com.vaccine.qltiemchungbackend.entity.LoVacXin;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface LoVacXinRepository extends JpaRepository<LoVacXin, Long> {

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

    // SỬA TẠI ĐÂY: Dùng JPQL chuẩn để tránh lỗi Entity Mapping thay vì dùng nativeQuery
    @Query("SELECT l FROM LoVacXin l WHERE l.vacXin.maVacXin = :maVacXin AND l.soLuong > 0 AND (l.flagDelete = false OR l.flagDelete IS NULL) ORDER BY l.ngayNhan ASC LIMIT 1")
    Optional<LoVacXin> findAvailableLotByVaccineId(@Param("maVacXin") Long maVacXin);

    @Query("SELECT l FROM LoVacXin l WHERE l.vacXin.loaiVacXin.maLoaiVacXin = :maLoaiVacXin AND l.soLuong > 0 AND (l.flagDelete = false OR l.flagDelete IS NULL) ORDER BY l.ngayNhan ASC LIMIT 1")
    Optional<LoVacXin> findAvailableLotByLoaiVacXinId(@Param("maLoaiVacXin") Long maLoaiVacXin);
}