package com.vaccine.qltiemchungbackend.repository;

import com.vaccine.qltiemchungbackend.entity.LoaiVacXin;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface LoaiVacXinRepository extends JpaRepository<LoaiVacXin, Long> {
    List<LoaiVacXin> findByFlagDeleteFalseOrFlagDeleteIsNull();
    Optional<LoaiVacXin> findByTenLoaiVacXin(String tenLoaiVacXin);
}