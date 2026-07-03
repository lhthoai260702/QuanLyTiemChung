package com.vaccine.qltiemchungbackend.repository;

import com.vaccine.qltiemchungbackend.entity.LoaiVacXin;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * LoaiVacXinRepository
 * * Version 1.0
 * * Date: 03-07-2026
 * * Copyright
 * * Modification Logs:
 * DATE       AUTHOR    DESCRIPTION
 * -----------------------------------------------------------------------
 * 03-07-2026 lhthoai   Create
 */
@Repository
public interface LoaiVacXinRepository extends JpaRepository<LoaiVacXin, Long> {

    /**
     * Lấy danh sách các loại vắc-xin hiện có (chưa bị xóa mềm).
     *
     * @return List<LoaiVacXin> Danh sách loại vắc-xin
     */
    List<LoaiVacXin> findByFlagDeleteFalseOrFlagDeleteIsNull();

    /**
     * Tìm kiếm thông tin loại vắc-xin dựa trên tên.
     *
     * @param tenLoaiVacXin Tên loại vắc-xin cần tìm kiếm
     * @return Optional<LoaiVacXin> Đối tượng loại vắc-xin nếu tìm thấy
     */
    Optional<LoaiVacXin> findByTenLoaiVacXin(String tenLoaiVacXin);
}