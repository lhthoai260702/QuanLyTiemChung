package com.vaccine.qltiemchungbackend.dto;

import lombok.Data;

@Data
public class LichSuTiemDTO {
    private Long recordId;
    private String vaccineName;
    private String date;
    private String time;
    private String sideEffect;
    private String thoiGianTacDung;
    private String status;
    private String place;
    private String vaccineType;
    private String dosage;

    // THÊM TRƯỜNG GHI CHÚ
    private String ghiChu;
}