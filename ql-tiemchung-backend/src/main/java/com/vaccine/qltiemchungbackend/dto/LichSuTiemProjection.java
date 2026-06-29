package com.vaccine.qltiemchungbackend.dto;

public interface LichSuTiemProjection {
    Long getRecordId();
    String getVaccineName();
    String getDate();
    String getSideEffect();
    String getNextDose();
    String getPlace();
    String getVaccineType();
    String getDosage();
}