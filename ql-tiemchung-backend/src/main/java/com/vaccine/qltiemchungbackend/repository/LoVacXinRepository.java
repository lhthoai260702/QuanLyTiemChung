package com.vaccine.qltiemchungbackend.repository;

import com.vaccine.qltiemchungbackend.dto.KhoVacXinDTO;
import com.vaccine.qltiemchungbackend.entity.LoVacXin;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LoVacXinRepository extends JpaRepository<LoVacXin, Long> {

    @Query("SELECT new com.vaccine.qltiemchungbackend.dto.KhoVacXinDTO(" +
            "l.maLo, v.tenVacXin, lv.tenLoaiVacXin, l.ngayNhan, l.giayPhep, " +
            "l.nuocSanXuat, v.hamLuong, v.hanSuDung, v.dieuKienBaoQuan, " +
            "v.doTuoiTiemChung, l.tinhTrang, l.soLuong) " +
            "FROM LoVacXin l " +
            "JOIN l.vacXin v " +
            "JOIN v.loaiVacXin lv " +
            "WHERE l.flagDelete = false AND v.flagDelete = false " +
            "ORDER BY LOWER(v.tenVacXin) ASC")
    List<KhoVacXinDTO> findAllKhoVacXin();
}