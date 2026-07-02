package com.vaccine.qltiemchungbackend.repository;

import com.vaccine.qltiemchungbackend.entity.NhaCungCap;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface NhaCungCapRepository extends JpaRepository<NhaCungCap, Long> {
    List<NhaCungCap> findByFlagDeleteFalseOrFlagDeleteIsNull();
}