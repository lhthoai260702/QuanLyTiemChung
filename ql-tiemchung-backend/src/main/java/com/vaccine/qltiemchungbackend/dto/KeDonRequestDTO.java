package com.vaccine.qltiemchungbackend.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Data;

import java.time.LocalDate;

/**
 * KeDonRequestDTO
 * * Version 1.0
 * * Date: 03-07-2026
 * * Copyright
 * * Modification Logs:
 * DATE       AUTHOR    DESCRIPTION
 * -----------------------------------------------------------------------
 * 03-07-2026 lhthoai   Create
 */
@Data
public class KeDonRequestDTO {
    private Long patientId;
    private Long vaccineId;

    // Thêm định dạng ngày giờ để Spring map tự động
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate date;
}