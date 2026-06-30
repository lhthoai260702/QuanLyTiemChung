package com.vaccine.qltiemchungbackend.dto;
import lombok.Data;
import java.time.LocalDate;

@Data
public class PhanHoiDTO {
    private Long id;
    private String customerName;
    private String comments;
    private String email;
    private String status;
    private String responseText;
    private String time;
}