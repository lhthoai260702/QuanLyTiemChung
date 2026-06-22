package com.vaccine.qltiemchungbackend.repository;

import com.vaccine.qltiemchungbackend.entity.TaiKhoan;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface TaiKhoanRepository extends JpaRepository<TaiKhoan, Long> {
    Optional<TaiKhoan> findByTenDangNhapAndMatKhauAndFlagDeleteFalseOrFlagDeleteIsNull(String tenDangNhap, String matKhau);
}