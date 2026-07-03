package com.vaccine.qltiemchungbackend.repository;

import com.vaccine.qltiemchungbackend.entity.LuotTuVan;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * LuotTuVanRepository
 * * Version 1.0
 * * Date: 03-07-2026
 * * Copyright
 * * Modification Logs:
 * DATE       AUTHOR    DESCRIPTION
 * -----------------------------------------------------------------------
 * 03-07-2026 lhthoai   Create
 */
@Repository
public interface LuotTuVanRepository extends JpaRepository<LuotTuVan, Long> {

    /**
     * Lấy danh sách lượt tư vấn được đánh dấu là câu hỏi thường gặp (FAQ).
     * Sắp xếp giảm dần theo mã lượt tư vấn để hiển thị mới nhất lên đầu.
     *
     * @return List<LuotTuVan> Danh sách FAQ
     */
    @Query("SELECT l FROM LuotTuVan l WHERE l.cauHoiThuongGap = true AND (l.flagDelete = false OR l.flagDelete IS NULL) ORDER BY l.maLuotTuVan DESC")
    List<LuotTuVan> findAllFaqs();
}