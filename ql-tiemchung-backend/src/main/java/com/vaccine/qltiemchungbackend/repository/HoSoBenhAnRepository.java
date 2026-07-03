package com.vaccine.qltiemchungbackend.repository;

import com.vaccine.qltiemchungbackend.entity.HoSoBenhAn;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * HoSoBenhAnRepository
 * * Version 1.0
 * * Date: 03-07-2026
 * * Copyright
 * * Modification Logs:
 * DATE       AUTHOR    DESCRIPTION
 * -----------------------------------------------------------------------
 * 03-07-2026 lhthoai   Create
 */
@Repository
public interface HoSoBenhAnRepository extends JpaRepository<HoSoBenhAn, Long> {

    /**
     * Tìm kiếm hồ sơ bệnh án dựa vào mã chi tiết đăng ký tiêm tương ứng.
     *
     * @param maChiTiet Mã chi tiết đăng ký tiêm cần tìm hồ sơ
     * @return Optional<HoSoBenhAn> Trả về hồ sơ bệnh án nếu tồn tại, ngược lại trả về rỗng (empty)
     */
    @Query("SELECT h FROM HoSoBenhAn h WHERE h.chiTietDkTiem.maChiTietDkTiem = :maChiTiet")
    Optional<HoSoBenhAn> findByMaChiTietDkTiem(@Param("maChiTiet") Long maChiTiet);

    /**
     * Tìm kiếm hồ sơ bệnh án dựa vào mã hóa đơn thanh toán.
     *
     * @param maHoaDon Mã hóa đơn cần tìm hồ sơ tương ứng
     * @return Optional<HoSoBenhAn> Trả về hồ sơ bệnh án nếu tồn tại, ngược lại trả về rỗng (empty)
     */
    @Query("SELECT h FROM HoSoBenhAn h WHERE h.maHoaDon = :maHoaDon")
    Optional<HoSoBenhAn> findByMaHoaDon(@Param("maHoaDon") Long maHoaDon);
}