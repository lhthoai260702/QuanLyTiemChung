package com.vaccine.qltiemchungbackend.dto;

import lombok.Data;
import java.time.LocalDate;

@Data
public class CustomerFeedbackDTO {
    private String id;
    private String type; // "Thường" hoặc "Cấp cao"
    private String content;
    private String responseText;
    private String status; // "Đã trả lời" hoặc "Đang chờ"
    private String time;
}