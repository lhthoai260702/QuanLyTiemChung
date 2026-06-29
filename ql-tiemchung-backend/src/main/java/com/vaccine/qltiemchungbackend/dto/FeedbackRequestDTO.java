package com.vaccine.qltiemchungbackend.dto;

import lombok.Data;

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