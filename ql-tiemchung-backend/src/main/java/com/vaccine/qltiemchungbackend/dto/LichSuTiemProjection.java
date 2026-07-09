package com.vaccine.qltiemchungbackend.dto;

public interface LichSuTiemProjection {
    Long getRecordId();

    String getVaccineName();

    String getDate();

    String getTime(); // THÊM GIỜ TIÊM

    String getSideEffect();

    String getThoiGianTacDung();

    String getStatus();

    String getPlace();

    String getVaccineType();

    String getDosage();
}