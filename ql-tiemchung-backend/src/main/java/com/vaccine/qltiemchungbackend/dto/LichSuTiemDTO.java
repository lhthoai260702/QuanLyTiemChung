package com.vaccine.qltiemchungbackend.dto;

import lombok.Data;

/**
 * LichSuTiemDTO
 * * Version 1.0
 * * Date: 03-07-2026
 * * Copyright
 * * Modification Logs:
 * DATE       AUTHOR    DESCRIPTION
 * -----------------------------------------------------------------------
 * 03-07-2026 lhthoai   Create
 */
@Data
public class LichSuTiemDTO {
    private Long recordId;
    private String vaccineName;
    private String date;
    private String sideEffect;
    private String thoiGianTacDung;
    private String status;
    private String place;
    private String vaccineType;
    private String dosage;
}