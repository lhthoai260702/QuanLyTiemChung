package com.vaccine.qltiemchungbackend.dto;

import lombok.Data;

@Data
public class SupportTicketDTO {
    private String id;
    private String customerName;
    private String comments;
    private String email;
    private String status;
    private String type;
    private String responseText;
    private String time;
    private String chiTietPhanHoi; // Lịch sử chat
}