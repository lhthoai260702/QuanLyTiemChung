package com.vaccine.qltiemchungbackend.dto;

import lombok.Data;

/**
 * CustomerFeedbackDTO
 * * Version 1.0
 * * Date: 03-07-2026
 * * Copyright
 * * Modification Logs:
 * DATE       AUTHOR    DESCRIPTION
 * -----------------------------------------------------------------------
 * 03-07-2026 lhthoai   Create
 */
@Data
public class CustomerFeedbackDTO {
    private String id;
    private String type; // "Thường" hoặc "Cấp cao"
    private String content;
    private String responseText;
    private String status; // "Đã trả lời" hoặc "Đang chờ"
    private String time;
}