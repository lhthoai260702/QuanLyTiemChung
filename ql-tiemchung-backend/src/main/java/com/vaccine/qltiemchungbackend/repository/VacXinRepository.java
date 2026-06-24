package com.vaccine.qltiemchungbackend.repository;

import com.vaccine.qltiemchungbackend.entity.VacXin;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface VacXinRepository extends JpaRepository<VacXin, Long> {
    Optional<VacXin> findByTenVacXin(String tenVacXin);
}