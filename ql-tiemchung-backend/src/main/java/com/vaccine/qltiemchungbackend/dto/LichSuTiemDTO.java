package com.vaccine.qltiemchungbackend.dto;

import lombok.Data;

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