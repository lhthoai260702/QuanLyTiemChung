package com.vaccine.qltiemchungbackend.dto;

import lombok.Data;

@Data
public class SupportTicketDTO {
    private String id;
    private String customerName;
    private String comments;
    private String email;
    private String status; // Trạng thái "Đã giải quyết" / "Chưa giải quyết"
    private String type; // Loại phản hồi (Thường / Cấp cao)
    private String responseText;
    private String time;
}