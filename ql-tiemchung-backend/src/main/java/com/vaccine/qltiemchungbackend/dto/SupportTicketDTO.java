package com.vaccine.qltiemchungbackend.dto;

import lombok.Data;

/**
 * SupportTicketDTO
 * * Version 1.0
 * * Date: 03-07-2026
 * * Copyright
 * * Modification Logs:
 * DATE       AUTHOR    DESCRIPTION
 * -----------------------------------------------------------------------
 * 03-07-2026 lhthoai   Create
 */
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