package com.vaccine.qltiemchungbackend.dto;

import lombok.Data;

/**
 * PhanHoiDTO
 * * Version 1.0
 * * Date: 03-07-2026
 * * Copyright
 * * Modification Logs:
 * DATE       AUTHOR    DESCRIPTION
 * -----------------------------------------------------------------------
 * 03-07-2026 lhthoai   Create
 */
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