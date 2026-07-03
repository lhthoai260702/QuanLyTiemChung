package com.vaccine.qltiemchungbackend.repository;

import com.vaccine.qltiemchungbackend.entity.NhaCungCap;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * NhaCungCapRepository
 * * Version 1.0
 * * Date: 03-07-2026
 * * Copyright
 * * Modification Logs:
 * DATE       AUTHOR    DESCRIPTION
 * -----------------------------------------------------------------------
 * 03-07-2026 lhthoai   Create
 */
@Repository
public interface NhaCungCapRepository extends JpaRepository<NhaCungCap, Long> {

    /**
     * Lấy danh sách tất cả các nhà cung cấp chưa bị xóa mềm.
     *
     * @return List<NhaCungCap> Danh sách nhà cung cấp
     */
    List<NhaCungCap> findByFlagDeleteFalseOrFlagDeleteIsNull();
}