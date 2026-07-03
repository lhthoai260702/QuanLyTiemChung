package com.vaccine.qltiemchungbackend.dto;

import lombok.Data;

/**
 * FeedbackRequestDTO
 * * Version 1.0
 * * Date: 03-07-2026
 * * Copyright
 * * Modification Logs:
 * DATE       AUTHOR    DESCRIPTION
 * -----------------------------------------------------------------------
 * 03-07-2026 lhthoai   Create
 */
@Data
public class FeedbackRequestDTO {
    private Long maBenhNhan;

    // Các trường cho phản hồi thường
    private String vacName;
    private String time;
    private String place;
    private String doctor;
    private String normalContent; // THÊM TRƯỜNG NÀY

    // Các trường cho phản hồi cấp cao
    private String highLevelType;
    private String highLevelContent;
}