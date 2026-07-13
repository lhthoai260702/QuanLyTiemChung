package com.vaccine.qltiemchungbackend.dto;

import lombok.Data;

@Data
public class PhanHoiDTO {
    private Long id;
    private String customerName;
    private String comments;
    private String email;
    private String status;
    private String responseText;
    private String time;
    private String chiTietPhanHoi; // Lịch sử chat
}