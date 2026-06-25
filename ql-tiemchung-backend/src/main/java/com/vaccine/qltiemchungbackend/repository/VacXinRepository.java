package com.vaccine.qltiemchungbackend.repository;

import com.vaccine.qltiemchungbackend.entity.VacXin;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface VacXinRepository extends JpaRepository<VacXin, Long> {
    Optional<VacXin> findByTenVacXin(String tenVacXin);

    @Query("SELECT v FROM VacXin v WHERE v.flagDelete = false OR v.flagDelete IS NULL ORDER BY LOWER(v.tenVacXin) ASC")
    List<VacXin> findAllAvailable();
}