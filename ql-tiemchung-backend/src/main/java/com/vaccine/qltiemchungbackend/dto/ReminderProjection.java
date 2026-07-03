package com.vaccine.qltiemchungbackend.dto;

/**
 * ReminderProjection
 * * Version 1.0
 * * Date: 03-07-2026
 * * Copyright
 * * Modification Logs:
 * DATE       AUTHOR    DESCRIPTION
 * -----------------------------------------------------------------------
 * 03-07-2026 lhthoai   Create
 */
public interface ReminderProjection {
    Long getId();

    Long getPatientId();

    String getPatientName();

    String getExpectedDate();

    String getVaccineName();

    Double getEstimatedPrice();

    String getEmail();
}