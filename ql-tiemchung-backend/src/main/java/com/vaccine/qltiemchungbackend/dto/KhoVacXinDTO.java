package com.vaccine.qltiemchungbackend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class KhoVacXinDTO {
    private Long soLo; // Lấy từ MaLo của LOVACXIN
    private String tenVacXin; // Lấy từ VACXIN
    private String loaiVacXin; // Lấy từ LOAIVACXIN
    private LocalDate ngayNhan; // Lấy từ LOVACXIN
    private String giayPhep; // Lấy từ LOVACXIN
    private String nuocSanXuat; // Lấy từ LOVACXIN
    private String hamLuong; // Lấy từ VACXIN
    private LocalDate hanSuDung; // Lấy từ VACXIN
    private String dieuKienBaoQuan; // Lấy từ VACXIN
    private String doTuoiTiemChung; // Lấy từ VACXIN
    private String tinhTrang; // Lấy từ LOVACXIN
    private Integer soLuong; // Lấy từ LOVACXIN
}