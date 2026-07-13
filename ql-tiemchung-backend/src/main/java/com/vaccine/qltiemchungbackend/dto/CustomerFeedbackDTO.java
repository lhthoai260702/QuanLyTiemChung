package com.vaccine.qltiemchungbackend.dto;

import lombok.Data;

@Data
public class CustomerFeedbackDTO {
    private String id;
    private String type;
    private String content;
    private String responseText;
    private String status;
    private String time;
    private String chiTietPhanHoi; // Lịch sử chat
}