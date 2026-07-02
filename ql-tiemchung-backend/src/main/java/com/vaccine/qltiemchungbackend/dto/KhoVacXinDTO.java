package com.vaccine.qltiemchungbackend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor // Lombok sẽ TỰ ĐỘNG tạo ra constructor 17 tham số tương ứng với thứ tự khai báo dưới đây
public class KhoVacXinDTO {
    // Thông tin Lô Vắc xin
    private Long soLo;
    private LocalDate ngayNhan;
    private String giayPhep;
    private String nuocSanXuat;
    private Integer soLuong;
    private String tinhTrang;

    // Thông tin Vắc xin
    private Long maVacXin;
    private String tenVacXin;
    private String loaiVacXin;
    private String hamLuong;
    private LocalDate hanSuDung;
    private String dieuKienBaoQuan;
    private String doTuoiTiemChung;
    private Double donGia;

    // Thông tin Nhà Cung Cấp
    private Long maNhaCungCap;
    private String tenNhaCungCap;

    // Hóa đơn
    private Double tongTien;
}