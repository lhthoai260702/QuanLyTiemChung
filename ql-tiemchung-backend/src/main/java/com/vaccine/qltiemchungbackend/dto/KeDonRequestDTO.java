package com.vaccine.qltiemchungbackend.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Data;

import java.time.LocalDate;

@Data
public class KeDonRequestDTO {
    private Long patientId;
    private Long vaccineId;

    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate date;

    private String time;

    // THÊM TRƯỜNG GHI CHÚ
    private String ghiChu;
}