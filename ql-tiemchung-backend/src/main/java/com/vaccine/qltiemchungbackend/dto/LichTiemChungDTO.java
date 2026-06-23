package com.vaccine.qltiemchungbackend.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;
import java.util.List;

@Data
public class LichTiemChungDTO {
    private String maLichTiem;
    private String dateInput; // Nhận trực tiếp định dạng YYYY-MM-DD từ Form React
    private String ngay;
    private String thang;
    private String nam;
    private String thoiGian;
    private String loaiVacXin;
    private Integer soLuong;
    private String doTuoi;
    private String diaDiem;
    private String ghiChu;

    private List<String> selectedDoctors; // Nhận mảng tên bác sĩ từ checkbox
    private List<String> danhSachBacSi;   // Dùng để trả về hiển thị

    @JsonProperty("flag_delete")
    private Boolean flagDelete;
}