package com.vaccine.qltiemchungbackend.dto;

import lombok.Data;
import java.time.LocalDate;
import com.fasterxml.jackson.annotation.JsonFormat;

@Data
public class KeDonRequestDTO {
    private Long patientId;
    private Long vaccineId;

    // Thêm định dạng ngày giờ để Spring map tự động
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate date;
}