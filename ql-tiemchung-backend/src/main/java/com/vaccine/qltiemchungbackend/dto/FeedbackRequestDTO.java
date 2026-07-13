package com.vaccine.qltiemchungbackend.dto;

import lombok.Data;

@Data
public class FeedbackRequestDTO {
    private Long maBenhNhan;
    private String vacName;
    private String time;
    private String place;
    private String doctor;
    private String normalContent;
    private String highLevelType;
    private String highLevelContent;

    // Các trường hỗ trợ cho tính năng Chat Lịch sử
    private String feedbackId;   // Ví dụ: PH-1 hoặc PHCC-2
    private String replyContent; // Tin nhắn mới gửi
    private String sender;       // Ai là người gửi: "customer", "support", "admin"
}