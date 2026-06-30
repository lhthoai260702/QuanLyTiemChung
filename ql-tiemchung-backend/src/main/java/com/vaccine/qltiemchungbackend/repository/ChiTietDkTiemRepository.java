package com.vaccine.qltiemchungbackend.repository;

import com.vaccine.qltiemchungbackend.entity.ChiTietDkTiem;
import com.vaccine.qltiemchungbackend.dto.ReminderProjection;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ChiTietDkTiemRepository extends JpaRepository<ChiTietDkTiem, Long> {

    // Tìm các chi tiết đăng ký chưa được lập hồ sơ (chưa tiêm) VÀ có ngày tiêm >= ngày hiện tại
    @Query(value = "SELECT " +
            "dk.MaChiTietDKTiem AS id, " +
            "bn.MaBenhNhan AS patientId, " +
            "bn.TenBenhNhan AS patientName, " +
            "CAST(dk.ThoiGianCanTiem AS VARCHAR) AS expectedDate, " +
            "v.TenVacXin AS vaccineName, " +
            "v.DonGia AS estimatedPrice, " +
            "tk.Email AS email " +
            "FROM CHITIET_DK_TIEM dk " +
            "JOIN BENHNHAN bn ON dk.MaBenhNhan = bn.MaBenhNhan " +
            "JOIN TAIKHOAN tk ON bn.MaTaiKhoan = tk.MaTaiKhoan " +
            "JOIN LOVACXIN lo ON dk.MaLo = lo.MaLo " +
            "JOIN VACXIN v ON lo.MaVacXin = v.MaVacXin " +
            "LEFT JOIN HOSOBENHAN hs ON dk.MaChiTietDKTiem = hs.MaChiTietDKTiem " +
            "WHERE (dk.flag_delete = FALSE OR dk.flag_delete IS NULL) " +
            "  AND hs.MaHoSoBenhAn IS NULL " +
            "  AND dk.ThoiGianCanTiem >= CURRENT_DATE " + // <-- THÊM ĐIỀU KIỆN LỌC NGÀY TẠI ĐÂY
            "ORDER BY dk.ThoiGianCanTiem ASC", nativeQuery = true)
    List<ReminderProjection> findDanhSachNhacNho();
}