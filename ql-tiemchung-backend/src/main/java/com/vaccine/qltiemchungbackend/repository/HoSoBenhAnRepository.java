package com.vaccine.qltiemchungbackend.repository;

import com.vaccine.qltiemchungbackend.entity.HoSoBenhAn;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface HoSoBenhAnRepository extends JpaRepository<HoSoBenhAn, Long> {
    @Query("SELECT h FROM HoSoBenhAn h WHERE h.chiTietDkTiem.maChiTietDkTiem = :maChiTiet")
    Optional<HoSoBenhAn> findByMaChiTietDkTiem(@Param("maChiTiet") Long maChiTiet);
}