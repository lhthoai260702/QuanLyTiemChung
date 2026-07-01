package com.vaccine.qltiemchungbackend.repository;

import com.vaccine.qltiemchungbackend.entity.PhanHoiCC;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Repository
public interface PhanHoiCCRepository extends JpaRepository<PhanHoiCC, Long> {

    // (Query cũ của bạn) Lấy danh sách cho Customer
    @Query(value = "SELECT " +
            "p.MaPhanHoiCC AS id, " +
            "p.content AS content, " +
            "p.NoiDungTraLoi AS responseText " +
            "FROM PHANHOICC p " +
            "WHERE p.MaBenhNhan = :maBenhNhan AND (p.flag_delete = FALSE OR p.flag_delete IS NULL) " +
            "ORDER BY p.MaPhanHoiCC DESC", nativeQuery = true)
    List<Object[]> layDanhSachPhanHoiCCTheoBenhNhan(@Param("maBenhNhan") Long maBenhNhan);

    // THÊM MỚI: Lấy TOÀN BỘ danh sách phản hồi cấp cao (Dành cho Admin)
    @Query(value = "SELECT " +
            "p.MaPhanHoiCC AS id, " +
            "bn.TenBenhNhan AS customerName, " +
            "p.content AS comments, " +
            "tk.Email AS email, " +
            "p.name AS status, " + // Tạm dùng cột name lưu Loại phản hồi (vd: Phàn nàn, Khen ngợi)
            "p.NoiDungTraLoi AS responseText, " +
            "'---' AS thoiGianTiem " + // Không có thời gian cụ thể
            "FROM PHANHOICC p " +
            "JOIN BENHNHAN bn ON p.MaBenhNhan = bn.MaBenhNhan " +
            "JOIN TAIKHOAN tk ON bn.MaTaiKhoan = tk.MaTaiKhoan " +
            "WHERE p.flag_delete = FALSE OR p.flag_delete IS NULL " +
            "ORDER BY p.MaPhanHoiCC DESC", nativeQuery = true)
    List<Object[]> layTatCaPhanHoiCC();

    // THÊM MỚI: Cập nhật phản hồi cấp cao
    @Modifying
    @Transactional
    @Query(value = "UPDATE PHANHOICC SET NoiDungTraLoi = :noiDungTraLoi WHERE MaPhanHoiCC = :id", nativeQuery = true)
    void capNhatPhanHoiCC(@Param("id") Long id, @Param("noiDungTraLoi") String noiDungTraLoi);
}