package com.vaccine.qltiemchungbackend.dto;

/**
 * LichSuTiemProjection
 * * Version 1.0
 * * Date: 03-07-2026
 * * Copyright
 * * Modification Logs:
 * DATE       AUTHOR    DESCRIPTION
 * -----------------------------------------------------------------------
 * 03-07-2026 lhthoai   Create
 */
public interface LichSuTiemProjection {
    Long getRecordId();

    String getVaccineName();

    String getDate();

    String getSideEffect();

    String getThoiGianTacDung();

    String getStatus();

    String getPlace();

    String getVaccineType();

    String getDosage();
}