package com.vaccine.qltiemchungbackend.repository;

import com.vaccine.qltiemchungbackend.entity.PhanHoi;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

@Repository
public interface PhanHoiRepository extends JpaRepository<PhanHoi, Long> {

    // 1. Insert cho Phản hồi sau khi tiêm
    @Modifying
    @Transactional
    @Query(value = "INSERT INTO PHANHOI (MaBenhNhan, TenVacXin, ThoiGianTiem, DiaDiemTiem, TenNhanVienPhuTrach, NoiDung, flag_delete) " +
            "VALUES (:maBenhNhan, :tenVacXin, CAST(:thoiGianTiem AS DATE), :diaDiemTiem, :tenNhanVien, :noiDung, FALSE)", nativeQuery = true)
    void insertNormalFeedback(@Param("maBenhNhan") Long maBenhNhan,
                              @Param("tenVacXin") String tenVacXin,
                              @Param("thoiGianTiem") String thoiGianTiem,
                              @Param("diaDiemTiem") String diaDiemTiem,
                              @Param("tenNhanVien") String tenNhanVien,
                              @Param("noiDung") String noiDung); // THÊM PARAM NÀY

    // 2. Insert cho Phản hồi cấp cao (Giám đốc)
    @Modifying
    @Transactional
    @Query(value = "INSERT INTO PHANHOICC (MaBenhNhan, name, content, flag_delete) " +
            "VALUES (:maBenhNhan, :name, :content, FALSE)", nativeQuery = true)
    void insertHighLevelFeedback(@Param("maBenhNhan") Long maBenhNhan,
                                 @Param("name") String name,
                                 @Param("content") String content);
}