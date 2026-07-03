package com.vaccine.qltiemchungbackend.repository;

import com.vaccine.qltiemchungbackend.dto.DichBenhProjection;
import com.vaccine.qltiemchungbackend.entity.DichBenh;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * DichBenhRepository
 * * Version 1.0
 * * Date: 03-07-2026
 * * Copyright
 * * Modification Logs:
 * DATE       AUTHOR    DESCRIPTION
 * -----------------------------------------------------------------------
 * 03-07-2026 lhthoai   Create
 */
@Repository
public interface DichBenhRepository extends JpaRepository<DichBenh, Long> {

    /**
     * Lấy toàn bộ danh sách dịch bệnh hiện có trên hệ thống (chưa bị xóa mềm).
     * Dữ liệu trả về được tổng hợp kèm theo danh sách các loại vắc-xin có thể phòng ngừa dịch bệnh đó.
     * Sắp xếp theo thời điểm khảo sát giảm dần.
     *
     * @return List<DichBenhProjection> Danh sách thông tin chi tiết các dịch bệnh
     */
    @Query(value = "SELECT " +
            "db.MaDichBenh AS id, " +
            "CAST(db.ThoiDiemKhaoSat AS VARCHAR) AS thoiDiemKhaoSat, " +
            "db.DiaChi AS diaChi, " +
            "db.TenDichBenh AS tenDichBenh, " +
            "db.SoNguoiBiNhiem AS soNguoiNhiem, " +
            "db.DuongLayNhiem AS duongLayNhiem, " +
            "db.TacHaiSucKhoe AS tacHai, " +
            "db.GhiChu AS ghiChu, " +
            "(SELECT STRING_AGG(v.TenVacXin, ', ') FROM VACXIN v WHERE v.PhongNguaBenh ILIKE '%' || db.TenDichBenh || '%') AS vacXinPhong " +
            "FROM DICHBENH db " +
            "WHERE db.flag_delete = FALSE OR db.flag_delete IS NULL " +
            "ORDER BY db.ThoiDiemKhaoSat DESC", nativeQuery = true)
    List<DichBenhProjection> findAllDichBenh();
}