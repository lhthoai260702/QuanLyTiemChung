package com.vaccine.qltiemchungbackend.dto;

import lombok.Data;

@Data
public class LichSuTiemDTO {
    private Long recordId; // Thêm ID để biết đang sửa record nào
    private String vaccineName;
    private String date;
    private String sideEffect;
    private String nextDose;
}