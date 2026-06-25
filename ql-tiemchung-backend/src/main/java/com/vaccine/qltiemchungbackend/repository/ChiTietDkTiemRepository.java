package com.vaccine.qltiemchungbackend.repository;
import com.vaccine.qltiemchungbackend.entity.ChiTietDkTiem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ChiTietDkTiemRepository extends JpaRepository<ChiTietDkTiem, Long> {}