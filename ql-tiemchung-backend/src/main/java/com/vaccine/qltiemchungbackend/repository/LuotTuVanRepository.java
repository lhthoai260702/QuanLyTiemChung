package com.vaccine.qltiemchungbackend.repository;

import com.vaccine.qltiemchungbackend.entity.LuotTuVan;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LuotTuVanRepository extends JpaRepository<LuotTuVan, Long> {
    // Chỉ lấy các câu hỏi được đánh dấu là FAQ (CauHoiThuongGap = true)
    @Query("SELECT l FROM LuotTuVan l WHERE l.cauHoiThuongGap = true AND (l.flagDelete = false OR l.flagDelete IS NULL) ORDER BY l.maLuotTuVan DESC")
    List<LuotTuVan> findAllFaqs();
}